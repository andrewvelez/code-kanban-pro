# AGENTS.md

## Overview

- MLink (formerly Link-Up) is a local-first progressive web app (PWA) for gay men.  It uses Bun.js as a bundler and package manager.  Aside from bundling, Bun is not used as the application's runtime.  The browser and the Web Platform (no TypeScript) are the application's runtime and technology stack.
- The browser is the application runtime. In being local-first, every effort is made for the app to be 100% cached on the first page load.  This means all assets, javascript, everything that would be in a Bun full stack executable file (minus Bun).
- The complete current browser build is emitted under `dist/`. Full-stack executable packaging is future work and is not currently implemented.
- The current design direction for the project is in `docs/DESIGN.md`. Other documents within the docs folder may be out of date.

## Commands

* Install dependencies
  >
  > `bun install`
  >

* Bundle project for production deployment
  >
  > `bun run build` **or** `bun build.js build`
  >

* Build project and run all tests (tests are coming soon)
  >
  > `bun run test` **or** `bun build.js test`
  >

* Build project and start local dev server
  >
  > `bun run start` **or** `bun build.js start`
  >

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
