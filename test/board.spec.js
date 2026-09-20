const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { StoryStore } = require('../src/store');
let store, root, errors;
const data = (content, status = 'backlog') => ({ content, status, priority: 'medium', labels: [], assignee: null, epic: null, dueDate: null });
test.beforeEach(async ({ page }) => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'kanban-ui-')); store = new StoryStore(root); errors = [];
  page.on('pageerror', error => errors.push(error.stack));
  await page.exposeFunction('hostMessage', async message => {
    let result;
    try {
      switch (message.type) {
        case 'create': result = await store.create(message.data); break;
        case 'update': await store.update(message.number, message.data, message.revision); break;
        case 'move': await store.move(message.number, message.status, message.beforeNumber, message.epic); break;
        case 'flag': await store.flag(message.number, message.field, message.value); break;
        case 'settings': await store.settings(message.data); break;
      }
      return { type: message.type === 'ready' ? 'snapshot' : 'result', requestId: message.requestId, result, repository: 'code-kanban', repositoryUri: 'file:///code-kanban', ...(await store.snapshot()) };
    } catch (error) { return { type: 'result', requestId: message.requestId, error: error.message }; }
  });
  await page.addInitScript(() => {
    window.acquireVsCodeApi = () => ({
      setState: state => { window.savedState = state; },
      getState: () => window.savedState,
      postMessage: message => window.hostMessage(message).then(data => window.dispatchEvent(new MessageEvent('message', { data })))
    });
  });
  await page.route('http://board.test/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src http://board.test 'unsafe-inline'; script-src 'nonce-test'; img-src data:"><link rel="stylesheet" href="/media/board.css"></head><body class="vscode-dark" style="--vscode-editor-background:#18181b;--vscode-foreground:#e4e4e7;--vscode-descriptionForeground:#a1a1aa"><main id="app"></main><script nonce="test" src="/dist/board.js"></script></body></html>` });
    const files = { '/media/board.css': ['media/board.css', 'text/css'], '/dist/board.js': ['dist/board.js', 'text/javascript'] };
    const file = files[url.pathname];
    if (!file) return route.abort();
    return route.fulfill({ contentType: file[1], body: await fs.readFile(path.join(__dirname, '..', file[0])) });
  });
});
test.afterEach(async () => { if (root) await fs.rm(root, { recursive: true, force: true }); expect(errors || []).toEqual([]); });
async function open(page) { await page.goto('http://board.test/'); await expect(page.locator('.column')).toHaveCount(5); }
async function refresh(page) { const snapshot = await store.snapshot(); await page.evaluate(data => window.dispatchEvent(new MessageEvent('message', { data: { type: 'snapshot', ...data } })), snapshot); }
test('sidebar story action opens the requested story and saves the current draft', async ({ page }) => {
  await store.create(data('# First story', 'in-progress'));
  await store.create(data('# Second story', 'in-progress'));
  await open(page);
  await page.getByRole('button', { name: 'Story #1: First story', exact: true }).click();
  await page.getByLabel('Story title', { exact: true }).fill('Edited first story');
  await page.evaluate(() => window.dispatchEvent(new MessageEvent('message', { data: { type: 'openStory', number: 2 } })));
  await expect(page.getByLabel('Story title', { exact: true })).toHaveValue('Second story');
  expect((await store.snapshot()).stories.find(story => story.number === 1).content).toContain('# Edited first story');
});
test('create numbered Markdown story, edit with autosave, and retain across reload', async ({ page }) => {
  await open(page);
  await page.keyboard.press('n');
  await page.getByLabel('Story title', { exact: true }).fill('Ship the board');
  await page.getByLabel('Story description', { exact: true }).fill('Markdown **description**');
  await page.getByRole('button', { name: 'Create story', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Story #1: Ship the board', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Story #1: Ship the board', exact: true }).click();
  await page.getByLabel('Story title', { exact: true }).fill('Board shipped');
  await expect(page.locator('.save-status')).toHaveText('Saved');
  await expect.poll(async () => (await store.snapshot()).stories[0].content).toContain('# Board shipped');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Story #1: Board shipped', exact: true })).toBeVisible();
  expect(await fs.readFile(store.file(1), 'utf8')).toContain('number: 1');
});
test('drag between columns, reorder, filter, archive, undo deletion and keep sequence', async ({ page }) => {
  await store.create(data('# First')); await store.create(data('# Second'));
  await open(page);
  await page.locator('[data-number="1"]').dragTo(page.locator('[data-status="todo"] .cards'));
  await expect(page.locator('[data-status="todo"] [data-number="1"]')).toBeVisible();
  await page.locator('[data-number="2"]').dragTo(page.locator('[data-number="1"]'));
  await expect.poll(async () => page.locator('[data-status="todo"] .card').evaluateAll(cards => cards.map(c => c.dataset.number))).toEqual(['2', '1']);
  await page.getByLabel('Search stories', { exact: true }).fill('#1');
  await expect(page.locator('.card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.locator('[data-number="1"]').click();
  await page.getByRole('button', { name: 'Archive story', exact: true }).click();
  await expect(page.locator('.card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Show archived stories', exact: true }).click();
  await page.locator('[data-number="1"]').click();
  await page.getByRole('button', { name: 'Delete story', exact: true }).click();
  await expect(page.locator('.card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('.card')).toHaveCount(1);
  expect(await store.create(data('# Third'))).toBe(3);
});
test('external changes update clean editor, conflicting save retains draft', async ({ page }) => {
  await store.create(data('# Original')); await open(page);
  await page.locator('.card').click();
  let story = (await store.snapshot()).stories[0];
  await store.update(1, { content: '# External' }, story.revision); await refresh(page);
  await expect(page.getByLabel('Story title', { exact: true })).toHaveValue('External');
  await page.getByLabel('Story title', { exact: true }).fill('Local draft');
  story = (await store.snapshot()).stories[0];
  await store.update(1, { content: '# New external change' }, story.revision);
  await expect(page.getByRole('alert')).toContainText('changed outside');
  await expect(page.getByLabel('Story title', { exact: true })).toHaveValue('Local draft');
  expect((await store.snapshot()).stories[0].content).toBe('# New external change');
  await page.getByRole('button', { name: 'Discard draft and reload', exact: true }).click();
  await expect(page.getByLabel('Story title', { exact: true })).toHaveValue('New external change');
});
test('theme, settings and responsive editor render without executing card HTML', async ({ page }) => {
  await store.create(data('# <img src=x onerror=alert(1)>\n\n<script>window.injected=true</script>'));
  await open(page);
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  await page.getByRole('button', { name: 'Board settings', exact: true }).click();
  await page.getByLabel('Compact cards', { exact: true }).check();
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await expect(page.locator('.board')).toHaveClass(/compact/);
  await page.getByRole('button', { name: 'Toggle horizontal / vertical layout', exact: true }).click();
  await expect(page.locator('.board')).toHaveClass(/vertical/);
  await page.reload(); await expect(page.locator('.board')).toHaveClass(/vertical/);
  await page.setViewportSize({ width: 600, height: 800 }); await page.locator('.card').click();
  await expect(page.locator('.editor')).toBeVisible(); await expect(page.locator('.board')).toBeHidden();
  await page.evaluate(() => { document.body.className = 'vscode-light'; document.body.style.cssText = ''; });
  await expect(page.locator('.editor')).toBeVisible();
});
test('capture reference layouts with representative stories', async ({ page }) => {
  const examples = [
    ['# GitHub Integration\n\nConnect stories to issues and pull requests.', 'backlog', 'low', 'integration'],
    ['# Keyboard Navigation Support\n\nNavigate every story with the keyboard.', 'todo', 'medium', 'enhancement'],
    ['# CLI Integration\n\n## Commands\n\nCreate and manage story cards from the terminal.\n\n```sh\ncode --install-extension code-kanban.vsix\n```\n\n## Benefits\n\n- Faster developer workflows\n- Markdown stays portable', 'todo', 'medium', 'cli'],
    ['# Full-Text Search\n\nSearch by story number, content, or label.', 'in-progress', 'medium', 'search'],
    ['# Drag & Drop Card Reordering\n\nMove stories between columns.', 'review', 'high', 'core'],
    ['# Dark Mode Support\n\nMatch the current editor theme.', 'review', 'critical', 'theme'],
    ['# Markdown Preview Panel\n\nRead and edit descriptions in the board.', 'done', 'high', 'shipped']
  ];
  for (const [content, status, priority, label] of examples) await store.create({ ...data(content, status), priority, labels: [label], assignee: status === 'done' ? 'Andrew' : null });
  await open(page); await fs.mkdir(path.join(__dirname, '../docs'), { recursive: true });
  await page.screenshot({ path: path.join(__dirname, '../docs/board.png') });
  await page.locator('[data-number="3"]').click();
  await page.getByRole('button', { name: 'Toggle horizontal / vertical layout', exact: true }).click();
  await expect(page.locator('.board')).toHaveClass(/vertical/);
  await page.screenshot({ path: path.join(__dirname, '../docs/editor.png') });
});

 test('dragging between epic lanes updates the epic and preserves the story number', async ({ page }) => {
  await store.create({ ...data('# Epic A story'), epic: 'Epic A' });
  await store.create({ ...data('# Epic B story'), epic: 'Epic B' });
  await store.settings({ epicView: true });
  await page.goto('http://board.test/');
  const lane = page.locator('.lane').filter({ has: page.getByRole('heading', { name: 'Epic B', exact: true }) });
  await page.locator('[data-number="1"]').dragTo(lane.locator('[data-status="todo"] .cards'));
  await expect(lane.locator('[data-status="todo"] [data-number="1"]')).toBeVisible();
  expect((await store.snapshot()).stories.find(s => s.number === 1).epic).toBe('Epic B');
});

test('long story titles wrap on opening, typing and resizing without changing Markdown headings', async ({ page }) => {
  const title = 'A long story title that needs several lines to display every word in a narrow editor beside the Kanban board '.repeat(3).trim();
  await store.create(data(`# ${title}\n\nDescription`));
  await open(page); await page.locator('.card').click();
  const field = page.getByLabel('Story title', { exact: true });
  await expect(field).toHaveValue(title);
  const fits = () => field.evaluate(node => node.clientHeight >= node.scrollHeight && node.clientHeight > 60);
  await expect.poll(fits).toBe(true);
  await page.setViewportSize({ width: 400, height: 800 });
  await expect.poll(fits).toBe(true);
  await field.fill(`${title} More words at the end.`);
  await expect.poll(fits).toBe(true);
  await expect(page.locator('.save-status')).toHaveText('Saved');
  expect((await store.snapshot()).stories[0].content.split('\n')[0]).toBe(`# ${title} More words at the end.`);
});

test('new-story modal validates, cancels without saving, and creates in the selected column', async ({ page }) => {
  await open(page);
  const add = page.getByRole('button', { name: 'Add story to To Do', exact: true });
  await add.click();
  const modal = page.getByRole('dialog', { name: 'New story', exact: true });
  const title = modal.getByLabel('Story title', { exact: true });
  await expect(title).toBeFocused();
  await expect(page.locator('.add-story')).toHaveCount(0);
  await modal.getByRole('button', { name: 'Create story', exact: true }).click();
  await expect(modal).toBeVisible();
  expect((await store.snapshot()).stories).toHaveLength(0);
  await title.fill('   ');
  await modal.getByRole('button', { name: 'Create story', exact: true }).click();
  expect(await title.evaluate(input => input.validity.valid)).toBe(false);
  await title.fill('A cancelled draft');
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
  await expect(add).toBeFocused();
  expect((await store.snapshot()).config.nextNumber).toBe(1);
  for (const action of ['Cancel', 'Close new story']) {
    await add.click(); await title.fill('Another cancelled draft');
    await modal.getByRole('button', { name: action, exact: true }).click();
    await expect(modal).toHaveCount(0);
  }
  await add.click(); await title.fill('A modal story');
  await modal.getByLabel('Story description', { exact: true }).fill('Some **Markdown** notes.');
  await modal.getByLabel('Story labels', { exact: true }).fill('ui, release, ui');
  await modal.locator('summary').click();
  await expect(modal.getByLabel('Story status', { exact: true })).toHaveValue('todo');
  await modal.getByLabel('Story priority', { exact: true }).selectOption('high');
  await modal.getByLabel('Story assignee', { exact: true }).fill('Andrew');
  await page.keyboard.press('Control+Enter');
  await expect(modal).toHaveCount(0);
  await expect(page.locator('[data-status="todo"] .card')).toContainText('A modal story');
  const stories = (await store.snapshot()).stories;
  expect(stories).toHaveLength(1);
  expect(stories[0]).toMatchObject({ number: 1, status: 'todo', priority: 'high', labels: ['ui', 'release'], assignee: 'Andrew', content: '# A modal story\n\nSome **Markdown** notes.' });
});

test('new-story modal retains failed drafts and prevents duplicate creation', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const host = window.hostMessage;
    let fail = true;
    window.hostMessage = async message => {
      if (message.type !== 'create') return host(message);
      if (fail) { fail = false; return { type: 'result', requestId: message.requestId, error: 'Cannot write story.' }; }
      await new Promise(resolve => { window.finishCreate = resolve; });
      return host(message);
    };
    window.dispatchEvent(new MessageEvent('message', { data: { type: 'newStory' } }));
  });
  const modal = page.getByRole('dialog', { name: 'New story', exact: true });
  const create = modal.getByRole('button', { name: 'Create story', exact: true });
  await modal.getByLabel('Story title', { exact: true }).fill('Keep this draft');
  await create.click();
  await expect(modal.getByRole('alert')).toHaveText('Cannot write story.');
  await expect(modal.getByLabel('Story title', { exact: true })).toHaveValue('Keep this draft');
  await create.click();
  await expect(modal.getByRole('button', { name: 'Creating…', exact: true })).toBeDisabled();
  await page.keyboard.press('Control+Enter');
  await page.keyboard.press('Escape');
  await expect(modal).toBeVisible();
  await page.evaluate(() => window.finishCreate());
  await expect(modal).toHaveCount(0);
  expect((await store.snapshot()).stories).toHaveLength(1);
});

test('column colors persist and readable headers work with outlines in both layouts', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Board settings', exact: true }).click();
  const colors = page.getByLabel('Column color', { exact: true });
  await colors.nth(0).fill('#ffffff');
  await colors.nth(1).fill('#000000');
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await page.reload();
  const backlog = page.locator('[data-status="backlog"] .column-header');
  const todo = page.locator('[data-status="todo"] .column-header');
  await expect(backlog).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(backlog).toHaveCSS('color', 'rgb(0, 0, 0)');
  await expect(todo).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await expect(todo).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(todo.getByRole('button', { name: 'Add story to To Do', exact: true })).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(page.locator('.column').first()).toHaveCSS('border-top-width', '1px');
  await page.getByRole('button', { name: 'Collapse Backlog', exact: true }).click();
  await expect(backlog).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.getByRole('button', { name: 'Toggle horizontal / vertical layout', exact: true }).click();
  await expect(page.locator('.board')).toHaveClass(/vertical/);
  await expect(page.locator('.column').first()).toHaveCSS('border-top-width', '1px');
});

test('board and modal follow live VS Code light and dark theme colors', async ({ page }) => {
  await store.create(data('# Theme example'));
  await open(page);
  await page.getByRole('button', { name: 'Add story to Backlog', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'New story', exact: true });
  for (const theme of [
    { name: 'light', background: '#ffffff', surface: '#f3f3f3', card: '#fafafa', foreground: '#222222', border: '#cccccc', button: '#0066bb' },
    { name: 'dark', background: '#18181b', surface: '#252526', card: '#303030', foreground: '#eeeeee', border: '#555555', button: '#0e639c' }
  ]) {
    await page.evaluate(theme => {
      document.body.className = `vscode-${theme.name}`;
      for (const [key, value] of Object.entries({ 'editor-background': theme.background, 'sideBar-background': theme.surface, 'editorWidget-background': theme.card, foreground: theme.foreground, 'panel-border': theme.border, 'button-background': theme.button, 'button-foreground': '#ffffff' })) {
        document.body.style.setProperty(`--vscode-${key}`, value);
      }
    }, theme);
    const rgb = hex => `rgb(${hex.slice(1).match(/../g).map(value => parseInt(value, 16)).join(', ')})`;
    await expect(page.locator('body')).toHaveCSS('color-scheme', theme.name);
    await expect(modal).toHaveCSS('background-color', rgb(theme.background));
    await expect(modal).toHaveCSS('color', rgb(theme.foreground));
    await expect(page.locator('.column').first()).toHaveCSS('background-color', rgb(theme.surface));
    await expect(page.locator('.column').first()).toHaveCSS('border-top-color', rgb(theme.border));
    await expect(page.locator('.card')).toHaveCSS('background-color', rgb(theme.card));
    await expect(modal.getByRole('button', { name: 'Create story', exact: true })).toHaveCSS('background-color', rgb(theme.button));
    await page.screenshot({ path: test.info().outputPath(`new-story-${theme.name}.png`) });
  }
  await page.setViewportSize({ width: 360, height: 640 });
  const bounds = await modal.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(360);
  await expect(modal.getByRole('button', { name: 'Create story', exact: true })).toBeInViewport();
});
