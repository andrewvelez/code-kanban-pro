# AGENTS.md

## Overview

- Code Kanban is a VS Code extension for repository-specific Markdown kanban boards with permanent story numbers. The board opens in an editor tab, with an overview and actions in the Activity Bar sidebar.
- The project uses JavaScript, Node.js, npm, and esbuild. Extension code runs in the VS Code extension host; the board and sidebar run in webviews. The rich-text editor uses Tiptap.
- Board settings and Markdown story files are stored per repository under `ExtensionContext.storageUri`, outside the repository working tree.
- `build.js` bundles the extension, board, and sidebar into `dist/`. The extension is distributed as a self-contained VSIX. See `README.md` for usage, storage, and development details.

## Commands

* Install dependencies
  >
  > `npm ci`
  >

* Build the extension and webview bundles
  >
  > `npm run build`
  >

* Run storage and extension integration tests with Node's test runner
  >
  > `npm test`
  >

* Install Chromium for browser tests (once)
  >
  > `npx playwright install chromium`
  >

* Build and run browser UI tests with Playwright
  >
  > `npm run build && npm run test:ui`
  >
  > Alternatively, use an installed Chromium: `CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:ui` after building. UI tests use a substitute VS Code message bridge and regenerate `docs/board.png` and `docs/editor.png`.

* Build and package the extension as a VSIX
  >
  > `npm run package`
  >

* Install the packaged extension locally
  >
  > `code --install-extension code-kanban-1.0.0.vsix`
  >

* Debug the extension
  >
  > Press **F5** in VS Code to build and launch the Extension Development Host. Open a repository folder there and run **Code Kanban: Open Kanban Board**.

## Code Style

- If needed, the preference would be for you to ask questions to clarify the prompt before responding for all non-trivial tasks.
- Keep responses pragmatic, idiomatic and as concise as possible.
- Prefer changesets (total diff) with a minimum number of lines of code changed **to satisfy the task**; only change what is necessary.
- Always ask for approval on your changeset summary before making any code/configuration changes.
- Use standard Web and PWA APIs for browser capabilities and idiomatic Bun APIs for build tooling.
- Every new source file that supports comments should contain a valid (meaning JSDoc-like) header comment with at least these properties: author (Andrew Velez 2026), the license tag (MIT), and brief description.
- Production non-test code shouldn't be modified solely to aid in the construction of a unit test.
- Leave unresolved architecture decisions unresolved; do not make assumptions or try to fix anything beyond what is asked for in the prompt.
- Prefer constructs that improve readability of code.
- Prefer dot notation over destructuring.

## Misc

- When specifically asked to check the project or files for errors, group all errors related to syntax up front to and correct immediately before proceeding.
- Specific saved metadata created by Codex extension that is specific to this repository can be saved in <project_root>/.vscode/codex/
