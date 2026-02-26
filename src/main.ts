import { FileView, MarkdownView, Notice, Plugin, TFolder } from "obsidian";
import type { TFile, WorkspaceLeaf } from "obsidian";
import type { Task, TaskPluginData } from "./types";
import { mergeWithDefaults, newTask } from "./storage";
import { TaskFormModal } from "./TaskFormModal";
import { TaskListView, TASK_LIST_VIEW_TYPE } from "./TaskListView";

export default class TaskListPlugin extends Plugin {
	data: TaskPluginData = { tasks: [], version: 1 };

	async onload(): Promise<void> {
		const saved = await this.loadData();
		this.data = mergeWithDefaults(saved);

		this.registerView(
			TASK_LIST_VIEW_TYPE,
			(leaf) => new TaskListView(leaf, this)
		);

		this.addRibbonIcon("list-checks", "Task list", () => this.openTaskList());

		this.addCommand({
			id: "task-list-open",
			name: "Open task list",
			callback: () => this.openTaskList(),
		});

		this.addCommand({
			id: "task-add",
			name: "Add task",
			callback: () => this.addTask(),
		});

		this.addCommand({
			id: "task-add-from-selection",
			name: "Create task from selection",
			checkCallback: (checking: boolean) => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				const sel = view?.editor?.getSelection()?.trim();
				if (!sel) return false;
				if (checking) return true;
				this.createTaskFromSelection(sel);
			},
		});

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor) => {
				const sel = editor.getSelection()?.trim();
				if (!sel) return;
				menu.addItem((item) =>
					item
						.setTitle("Create task from selection")
						.setIcon("list-checks")
						.onClick(() => {
							this.createTaskFromSelection(sel);
						})
				);
			})
		);

		this.registerEvent(
			this.app.workspace.on("file-open", (file: TFile | null) => {
				if (!file) return;
				setTimeout(() => this.revealExistingFileTab(file), 0);
			})
		);

		// When clicking a file in the explorer, if it's already open in a tab, switch to that tab.
		// Use mousedown + click in capture so we run before Obsidian and prevent opening in a new tab.
		const tryRevealExistingFileFromExplorer = (evt: MouseEvent): boolean => {
			const target = evt.target as HTMLElement;
			const fileEl = target.closest(".nav-file");
			if (!fileEl) return false;
			const path =
				(fileEl as HTMLElement).getAttribute("data-path") ??
				(fileEl.querySelector("[data-path]") as HTMLElement)?.getAttribute("data-path");
			if (!path) return false;
			const file = this.app.vault.getAbstractFileByPath(path);
			if (!file || file instanceof TFolder) return false;
			const leavesWithFile = this.getLeavesWithFile(file as TFile);
			if (leavesWithFile.length === 0) return false;
			evt.preventDefault();
			evt.stopImmediatePropagation();
			const leaf = leavesWithFile[0];
			this.app.workspace.setActiveLeaf(leaf, { focus: true });
			this.app.workspace.revealLeaf(leaf);
			return true;
		};
		this.registerDomEvent(document, "mousedown", (evt: MouseEvent) => tryRevealExistingFileFromExplorer(evt), true);
		this.registerDomEvent(document, "click", (evt: MouseEvent) => tryRevealExistingFileFromExplorer(evt), true);
	}

	private getLeavesWithFile(file: TFile): WorkspaceLeaf[] {
		const path = file.path;
		const out: WorkspaceLeaf[] = [];
		this.app.workspace.iterateAllLeaves((leaf) => {
			const v = leaf.view;
			if (v && "file" in v && v.file && (v as FileView).file?.path === path) out.push(leaf);
		});
		return out;
	}

	/** If this file is already open in a tab, switch to that tab (and close duplicate if one was created). */
	private revealExistingFileTab(file: TFile): void {
		const { workspace } = this.app;
		const leavesWithSameFile = this.getLeavesWithFile(file);
		if (leavesWithSameFile.length === 0) return;
		const active = workspace.activeLeaf;
		// If more than one tab has this file, keep the first and close the rest (duplicates)
		if (leavesWithSameFile.length > 1) {
			const toKeep = leavesWithSameFile[0];
			for (let i = 1; i < leavesWithSameFile.length; i++) leavesWithSameFile[i].detach();
			workspace.revealLeaf(toKeep);
			return;
		}
		// Exactly one tab has this file: if it's not the active tab, switch to it
		const only = leavesWithSameFile[0];
		if (only !== active) workspace.revealLeaf(only);
	}

	private async createTaskFromSelection(selectedText: string): Promise<void> {
		const lines = selectedText
			.split(/\r?\n/)
			.map((line) => this.parseListItemLine(line))
			.filter((content): content is string => content != null);
		if (lines.length === 0) return;
		const newTasks = lines.map((content) => {
			const task = newTask(content, "ToDo", "Medium");
			task.dueDate = null;
			return task;
		});
		await this.saveTasks([...this.data.tasks, ...newTasks]);
		new Notice(lines.length === 1 ? "Task created" : `${lines.length} tasks created`);
		this.openTaskList();
	}

	/** Strip list markers (- * + or "1. ") and return trimmed content, or null if empty. */
	private parseListItemLine(line: string): string | null {
		const trimmed = line.trim();
		if (!trimmed) return null;
		// Match optional leading whitespace, then "- ", "* ", "+ ", or "N. " (numbered list)
		const withoutMarker = trimmed.replace(/^\s*[-*+]\s+/, "").replace(/^\s*\d+\.\s+/, "");
		return withoutMarker.trim() || null;
	}

	onunload(): void {}

	getTasks(): Task[] {
		return this.data.tasks;
	}

	async saveTasks(tasks: Task[]): Promise<void> {
		this.data.tasks = tasks;
		await this.saveData(this.data);
		this.refreshOpenTaskListViews();
	}

	private refreshOpenTaskListViews(): void {
		const leaves = this.app.workspace.getLeavesOfType(TASK_LIST_VIEW_TYPE);
		// Defer so the view updates after the current stack (fixes list not updating when already open)
		requestAnimationFrame(() => {
			for (const leaf of leaves) {
				const view = leaf.view;
				if (view instanceof TaskListView) {
					view.refresh();
				}
			}
		});
	}

	private openTaskList(): void {
		const { workspace } = this.app;
		const existing = workspace.getLeavesOfType(TASK_LIST_VIEW_TYPE);
		if (existing.length > 0) {
			workspace.revealLeaf(existing[0]);
			return;
		}
		const leaf = workspace.getLeaf(true);
		leaf.setViewState({ type: TASK_LIST_VIEW_TYPE });
	}

	private addTask(): void {
		new TaskFormModal(this.app, (result) => {
			const task = newTask(result.content, result.state, result.priority, result.tags ?? null);
			task.dueDate = result.dueDate;
			this.saveTasks([...this.data.tasks, task]);
		}).open();
	}
}
