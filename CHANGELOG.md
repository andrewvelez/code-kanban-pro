# Changelog

Changes to Code Kanban Pro, newest version first. Add changes under their target
version as they are made. Versions before 1.2.0 were reconstructed from Git
history and the local VSIX packages.

## 1.2.0

- Replace new-story side-panel creation with a centered modal inspired by Code
  Kanban, with title, Markdown description, labels, and optional story details.
- Create stories explicitly with Create story or Ctrl/Cmd+Enter; Cancel, the close
  button, and Escape dismiss the modal without creating a story. Keep failed
  submissions open for correction and prevent duplicate submissions while saving.
- Add outlines around columns and remove the redundant Add story bars.
- Fill each column header with its customizable color and automatically choose
  readable black or white text and icons.
- Follow VS Code's light/dark theme and theme colors for board surfaces, borders,
  badges, buttons, and dialogs, including changes while the board is open.
- Add this versioned changelog to the repository and extension package.
- Update usage documentation, board screenshots, and UI coverage for creation,
  cancellation, custom colors, and theme changes.

## 1.1.0

- Rename the extension to Code Kanban Pro in its listing, commands, Activity Bar,
  webview titles, messages, and attribution.
- Simplify the README and add Marketplace installation instructions.

## 1.0.1

- Change the publisher to Valdex and update the extension description.
- Add the extension icon and its larger source image.
- Update the README branding and installation version.

## 1.0.0

- Promote 0.2.1 to the 1.0.0 release and update installation instructions.

## 0.2.1

- Open or reveal the board in an editor tab from the Activity Bar.
- Restore a separate sidebar overview with column counts, in-progress stories,
  and Open Kanban Board / New Story actions.
- Route sidebar story actions to the correct repository and refresh the overview
  when board data changes; reuse the existing board tab.
- Add sidebar bundling, styles, and host/UI tests.

## 0.2.0

- Add the Activity Bar entry and board view.
- Wrap and automatically resize long story titles when opening, typing, or resizing.
- Add coverage for title wrapping and Activity Bar activation.

## 0.1.0

- Introduce the JavaScript extension with a board tab and separate local Markdown
  story storage per workspace folder.
- Assign permanent story numbers, reserve numbers before writing, and protect
  writes with locking, atomic replacement, and revision conflict checks.
- Add configurable columns, drag-and-drop movement and ordering, search, filters,
  horizontal/vertical layouts, compact cards, collapsed columns, and epic lanes.
- Add rich-text Markdown editing, automatic saving of existing stories, native
  Markdown editing, and refresh after external file changes.
- Support priorities, labels, assignees, due dates, epics, archive/restore, and
  deletion with undo; retain unknown frontmatter fields.
- Add AI CLI integration and prompt copying, keyboard shortcuts, and initial
  support for VS Code light, dark, and high-contrast themes.
- Add build/VSIX packaging, storage tests, extension host mocks, browser UI tests,
  documentation, and reference-project license attribution.
