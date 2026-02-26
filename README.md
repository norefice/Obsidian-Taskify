# Obsidian Taskify

Task list plugin for Obsidian with **states**, **priority**, **tags**, and **due date**. Create tasks directly from your notes.

**Repositorio:** [github.com/norefice/Obsidian-Taskify](https://github.com/norefice/Obsidian-Taskify)

## Features

- **States**: `ToDo`, `InProgress`, `Done`
- **Priority**: `Low`, `Medium`, `High`, `Highest`
- **Due date** per task
- Create, edit, and delete tasks; **create tasks from note selection** (text or list items)
- Change state and priority from the list (dropdowns)
- Filter by state (ToDo, InProgress, Done)
- Sort by priority or by due date
- Visual highlight for overdue tasks
- **Tabs**: when opening or clicking a note that is already open in another tab, that tab is activated instead of opening a new one

## Installation (development)

1. Clone or copy this project into your vault’s `.obsidian/plugins/obsidian-taskify/` (or use a symlink).
2. In the plugin root: `npm install` and `npm run dev` (or `npm run build`).
3. In Obsidian: Settings → Community plugins → Enable **Obsidian Taskify**.

## Usage

The task list opens in the **main workspace area** (like a note or Canvas), not as a popup.

- **Sidebar icon** (list with checks): opens the task list in a new tab.
- **Command palette** (Ctrl/Cmd + P):
  - **Open task list**: opens or focuses the task view.
  - **Add task**: creates a new task (content, state, priority, due date).
  - **Create task from selection**: turns the selected text in a note into a new task (ToDo, Medium priority).

If the list is already open, the command or icon brings it to the front. You can also use the editor context menu: select text and choose **Create task from selection**.

Data is stored in the plugin config inside your vault.

## Project structure

- `src/main.ts` – Main plugin, commands, and tab logic
- `src/types.ts` – `Task`, `TaskState`, `TaskPriority` types
- `src/storage.ts` – ID and default data helpers
- `src/TaskFormModal.ts` – Create/edit task modal
- `src/TaskListView.ts` – Task list view (workspace tab)
- `src/TaskListModal.ts` – Legacy list modal
- `manifest.json` – Plugin metadata
- `main.js` – Compiled output (`npm run build`)

## References

- [Repositorio en GitHub](https://github.com/norefice/Obsidian-Taskify)
- [Obsidian Developer Documentation](https://docs.obsidian.md/Home)
- [Sample Plugin (template)](https://github.com/obsidianmd/obsidian-sample-plugin)
