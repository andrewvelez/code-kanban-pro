# Code Kanban Pro

Plan your work without leaving VS Code. Track tasks on a board, keep notes in
Markdown, and send a story to your AI coding tool. By **Valdex**.

![Code Kanban Pro board](https://raw.githubusercontent.com/andrewvelez/code-kanban-pro/main/docs/board.png)

## Features

- **Fixed story numbers.** Each story keeps its number, even when you move or archive it.
- **Easy notes.** Write with a rich-text editor or edit the Markdown file.
- **A quick overview.** See task counts and work in progress in the sidebar.
- **Find work fast.** Search cards and filter by priority, assignee, label, or due date.
- **Your board, your way.** Drag cards, rename columns, choose header colors, and group stories by epic.
- **Matches your editor.** Automatically follows your VS Code light or dark theme.
- **Build with AI.** Send a story to an installed Claude, Codex, Copilot, or OpenCode
  command-line tool, or copy the prompt.

Cards stay in local Markdown files, outside your project. Each workspace folder
has its own board. Boards are not synced by Git.

## Install

In VS Code, press **Ctrl+P** (**Cmd+P** on Mac), paste this line, and press Enter:

```text
ext install Valdex.code-kanban-pro
```

## Get started

Open a project folder and click **Code Kanban Pro** in the Activity Bar.
Click a column's **+** button to open the new-story modal, then choose **Create story**.
**Cancel** or **Escape** closes it without creating a story. Drag cards to move work along.
Click a card to edit its notes and details. Choose column colors in **Board settings**.

---

Based on [Kanban Markdown](https://github.com/LachyFS/kanban-markdown-vscode-extension).
[Changelog](CHANGELOG.md) · [MIT license](LICENSE) · [Credits](NOTICE)
