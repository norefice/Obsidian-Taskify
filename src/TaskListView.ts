import { ItemView, setIcon, WorkspaceLeaf } from "obsidian";
import type { Task, TaskPriority, TaskState } from "./types";

import { TaskFormModal } from "./TaskFormModal";
import type TaskListPlugin from "./main";

export const TASK_LIST_VIEW_TYPE = "task-list-view";

const PRIORITY_ORDER: TaskPriority[] = ["Highest", "High", "Medium", "Low"];
const ALL_STATES: TaskState[] = ["ToDo", "InProgress", "Done"];

function sortTasksByPriority(tasks: Task[]): Task[] {
	const order = (p: TaskPriority) => PRIORITY_ORDER.indexOf(p);
	return [...tasks].sort((a, b) => order(a.priority ?? "Medium") - order(b.priority ?? "Medium"));
}

function sortTasksByDueDate(tasks: Task[]): Task[] {
	return [...tasks].sort((a, b) => {
		const da = a.dueDate ?? "";
		const db = b.dueDate ?? "";
		if (!da && !db) return 0;
		if (!da) return 1;
		if (!db) return -1;
		return da.localeCompare(db);
	});
}

type SortMode = "priority" | "dueDate";

export class TaskListView extends ItemView {
	private stateFilter = new Set<TaskState>(ALL_STATES);
	private tagFilter: string | null = null; // null = all tags
	private sortMode: SortMode = "priority";
	/** When set, we keep this order instead of re-sorting (avoids list jumping when changing priority from the list). */
	private preservedDisplayOrder: string[] | null = null;

	constructor(leaf: WorkspaceLeaf, private plugin: TaskListPlugin) {
		super(leaf);
	}

	getViewType(): string {
		return TASK_LIST_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Task list";
	}

	getIcon(): string {
		return "list-checks";
	}

	async onOpen(): Promise<void> {
		this.render();
	}

	async onClose(): Promise<void> {
		// contentEl is cleared by the framework if needed
	}

	/** Redraws the list (e.g. after save). */
	refresh(): void {
		this.render();
	}

	private get tasks(): Task[] {
		return this.plugin.getTasks();
	}

	private async saveTasks(tasks: Task[]): Promise<void> {
		await this.plugin.saveTasks(tasks);
		// Plugin refreshes all open task list views in saveTasks()
	}

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("task-plugin-container");

		const header = contentEl.createDiv({ cls: "task-plugin-view-header" });
		header.createEl("h2", { text: "Task list" });
		const addBtn = header.createEl("button", { text: "+ New task", cls: "mod-cta" });
		addBtn.onclick = () => this.openTaskForm();

		const toolbar = contentEl.createDiv({ cls: "task-plugin-toolbar" });
		toolbar.createSpan({ text: "Filter by state:", cls: "task-plugin-toolbar-label" });
		for (const state of ALL_STATES) {
			const label = toolbar.createEl("label", { cls: "task-plugin-filter-check" });
			const cb = label.createEl("input", { attr: { type: "checkbox" } });
			cb.checked = this.stateFilter.has(state);
			cb.onchange = () => {
				if (cb.checked) this.stateFilter.add(state);
				else this.stateFilter.delete(state);
				this.preservedDisplayOrder = null;
				this.refresh();
			};
			label.appendText(" " + state);
		}
		toolbar.createSpan({ cls: "task-plugin-toolbar-sep" });
		// Tag filter
		const tagFilterContainer = toolbar.createDiv({ cls: "task-plugin-toolbar-tag-filter" });
		tagFilterContainer.createSpan({ text: "Tag:", cls: "task-plugin-toolbar-label" });
		const tagSelect = tagFilterContainer.createEl("select", { cls: "task-plugin-tag-select" });
		const uniqueTags = [...new Set(this.tasks.flatMap((t) => t.tags || []).filter(Boolean))].sort();
		const allOpt = tagSelect.createEl("option", { attr: { value: "" }, text: "All" });
		for (const tag of uniqueTags) {
			tagSelect.createEl("option", { attr: { value: tag }, text: tag });
		}
		tagSelect.value = this.tagFilter ?? "";
		tagSelect.onchange = () => {
			this.tagFilter = tagSelect.value || null;
			this.preservedDisplayOrder = null;
			this.refresh();
		};
		toolbar.createSpan({ cls: "task-plugin-toolbar-sep" });
		const sortPriorityBtn = toolbar.createEl("button", { cls: "task-plugin-sort-btn" });
		sortPriorityBtn.setAttribute("aria-label", "Sort by priority");
		sortPriorityBtn.setAttribute("title", "Sort by priority");
		setIcon(sortPriorityBtn, "arrow-up-down");
		sortPriorityBtn.appendText(" Sort by Priority");
		sortPriorityBtn.onclick = () => {
			this.sortMode = "priority";
			this.preservedDisplayOrder = null;
			this.refresh();
		};
		const sortEndDateBtn = toolbar.createEl("button", { cls: "task-plugin-sort-btn" });
		sortEndDateBtn.setAttribute("aria-label", "Sort by end date");
		sortEndDateBtn.setAttribute("title", "Sort by due date (soonest first)");
		setIcon(sortEndDateBtn, "calendar");
		sortEndDateBtn.appendText(" Sort by Due date");
		sortEndDateBtn.onclick = () => {
			this.sortMode = "dueDate";
			this.preservedDisplayOrder = null;
			this.refresh();
		};

		const listContainer = contentEl.createDiv({ cls: "task-plugin-list-container" });
		this.renderListInto(listContainer);
	}

	private getFilteredAndSortedTasks(): Task[] {
		let tasks = this.tasks.filter((t) => this.stateFilter.has(t.state));
		if (this.tagFilter != null) {
			tasks = tasks.filter((t) => (t.tags ?? []).includes(this.tagFilter!));
		}
		if (this.preservedDisplayOrder === null) {
			tasks = this.sortMode === "priority" ? sortTasksByPriority(tasks) : sortTasksByDueDate(tasks);
			this.preservedDisplayOrder = tasks.map((t) => t.id);
			return tasks;
		}
		const orderMap = new Map(this.preservedDisplayOrder.map((id, i) => [id, i]));
		return tasks.slice().sort((a, b) => (orderMap.get(a.id) ?? 9999) - (orderMap.get(b.id) ?? 9999));
	}

	private renderListInto(container: HTMLDivElement): void {
		container.empty();
		const tasks = this.getFilteredAndSortedTasks();

		if (tasks.length === 0) {
			container.createDiv({
				cls: "task-plugin-empty",
				text: "No tasks yet. Add one with \"New task\" or adjust the filter.",
			});
			return;
		}

		const today = new Date().toISOString().slice(0, 10);
		const ul = container.createEl("ul", { cls: "task-plugin-list" });
		for (const task of tasks) {
			const li = ul.createEl("li", { cls: "task-plugin-item" });
			li.setAttribute("data-state", task.state);
			if (task.dueDate && task.dueDate <= today) {
				li.classList.add("task-plugin-item-overdue");
			}

			const contentDiv = li.createDiv({ cls: "task-content" });
			contentDiv.createDiv({ cls: "task-title", text: task.content });
			const labelsRow = contentDiv.createDiv({ cls: "task-plugin-labels" });
			const stateLabel = labelsRow.createSpan({ cls: `task-plugin-label task-plugin-label-state ${task.state}` });
			const stateLabelIcon = stateLabel.createSpan({ cls: "task-plugin-label-icon" });
			setIcon(stateLabelIcon, task.state === "ToDo" ? "circle" : task.state === "InProgress" ? "clock" : "circle-check");
			stateLabel.appendText(" " + task.state);
			const pr = task.priority ?? "Medium";
			const priorityLabel = labelsRow.createSpan({ cls: `task-plugin-label task-plugin-label-priority ${pr}` });
			const priorityLabelIcon = priorityLabel.createSpan({ cls: "task-plugin-label-icon" });
			setIcon(priorityLabelIcon, pr === "Highest" || pr === "High" ? "flame" : pr === "Low" ? "arrow-down" : "circle-dot");
			priorityLabel.appendText(" " + pr);
			if (task.dueDate) {
				const dueLabel = labelsRow.createSpan({ cls: "task-plugin-label task-plugin-label-due" });
				const dueIconWrap = dueLabel.createSpan({ cls: "task-plugin-label-icon" });
				setIcon(dueIconWrap, "calendar");
				dueLabel.appendText(" Due: " + task.dueDate);
			}
			for (const tag of task.tags ?? []) {
				if (!tag) continue;
				const tagLabel = labelsRow.createSpan({ cls: "task-plugin-label task-plugin-label-tag" });
				const tagIconWrap = tagLabel.createSpan({ cls: "task-plugin-label-icon" });
				setIcon(tagIconWrap, "tag");
				tagLabel.appendText(" " + tag);
			}

			const actions = li.createDiv({ cls: "task-actions" });
			// Group 1: State + Priority dropdowns (icon-only triggers)
			const statusGroup = actions.createDiv({ cls: "task-actions-status" });
			const stateTrigger = statusGroup.createEl("button", { cls: "task-plugin-dropdown-trigger task-plugin-trigger-icon" });
			stateTrigger.setAttribute("aria-label", "Change status");
			stateTrigger.setAttribute("title", "Status");
			setIcon(stateTrigger, "list-checks");
			stateTrigger.onclick = (e) => {
				e.stopPropagation();
				this.openStateDropdown(stateTrigger, task);
			};
			const priorityTrigger = statusGroup.createEl("button", { cls: "task-plugin-dropdown-trigger task-plugin-trigger-icon" });
			priorityTrigger.setAttribute("aria-label", "Change priority");
			priorityTrigger.setAttribute("title", "Priority");
			setIcon(priorityTrigger, "flag");
			priorityTrigger.onclick = (e) => {
				e.stopPropagation();
				this.openPriorityDropdown(priorityTrigger, task);
			};
			// Group 2: Edit + Delete (icons only)
			const editGroup = actions.createDiv({ cls: "task-actions-edit" });
			const editBtn = editGroup.createEl("button", { cls: "task-action-icon-btn" });
			editBtn.setAttribute("aria-label", "Edit");
			setIcon(editBtn, "pencil");
			editBtn.onclick = () => this.openTaskForm(task);
			const deleteBtn = editGroup.createEl("button", { cls: "task-action-icon-btn" });
			deleteBtn.setAttribute("aria-label", "Delete");
			setIcon(deleteBtn, "trash-2");
			deleteBtn.onclick = () => this.deleteTask(task);
		}
	}

	private openTaskForm(task?: Task): void {
		new TaskFormModal(this.app, (result) => {
			const tasks = [...this.tasks];
			if (task) {
				const idx = tasks.findIndex((t) => t.id === task.id);
				if (idx >= 0) {
					tasks[idx] = {
						...task,
						...result,
						updatedAt: new Date().toISOString(),
					};
				}
			} else {
				tasks.push({
					id: "task-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9),
					content: result.content,
					state: result.state,
					priority: result.priority ?? "Medium",
					dueDate: result.dueDate ?? null,
					tags: result.tags ?? [],
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				});
			}
			this.saveTasks(tasks);
		}, task).open();
	}

	private openStateDropdown(trigger: HTMLElement, task: Task): void {
		const rect = trigger.getBoundingClientRect();
		const dropdown = document.body.createDiv({ cls: "task-plugin-dropdown" });
		dropdown.style.left = `${rect.left}px`;
		dropdown.style.top = `${rect.bottom + 4}px`;
		for (const state of ALL_STATES) {
			const opt = dropdown.createEl("button", { cls: "task-plugin-dropdown-option task-plugin-dropdown-option-mini" });
			opt.createSpan({ cls: `task-plugin-dot task-plugin-dot-state-${state}` });
			opt.appendText(state);
			opt.onclick = (e) => {
				e.stopPropagation();
				this.applyTaskState(task, state);
				dropdown.remove();
				close();
			};
		}
		const close = () => {
			dropdown.remove();
			document.removeEventListener("mousedown", onOutside);
		};
		const onOutside = (e: MouseEvent) => {
			if (!dropdown.contains(e.target as Node) && trigger !== e.target && !trigger.contains(e.target as Node)) close();
		};
		requestAnimationFrame(() => document.addEventListener("mousedown", onOutside));
	}

	private openPriorityDropdown(trigger: HTMLElement, task: Task): void {
		const rect = trigger.getBoundingClientRect();
		const order: TaskPriority[] = ["Highest", "High", "Medium", "Low"];
		const dropdown = document.body.createDiv({ cls: "task-plugin-dropdown" });
		dropdown.style.left = `${rect.left}px`;
		dropdown.style.top = `${rect.bottom + 4}px`;
		for (const priority of order) {
			const opt = dropdown.createEl("button", { cls: "task-plugin-dropdown-option task-plugin-dropdown-option-mini" });
			opt.createSpan({ cls: `task-plugin-dot task-plugin-dot-priority-${priority}` });
			opt.appendText(priority);
			opt.onclick = (e) => {
				e.stopPropagation();
				this.applyTaskPriority(task, priority);
				dropdown.remove();
				close();
			};
		}
		const close = () => {
			dropdown.remove();
			document.removeEventListener("mousedown", onOutside);
		};
		const onOutside = (e: MouseEvent) => {
			if (!dropdown.contains(e.target as Node) && trigger !== e.target && !trigger.contains(e.target as Node)) close();
		};
		requestAnimationFrame(() => document.addEventListener("mousedown", onOutside));
	}

	private applyTaskState(task: Task, state: TaskState): void {
		const tasks = [...this.tasks];
		const idx = tasks.findIndex((t) => t.id === task.id);
		if (idx >= 0) {
			tasks[idx] = { ...task, state, updatedAt: new Date().toISOString() };
			this.saveTasks(tasks);
		}
	}

	private applyTaskPriority(task: Task, priority: TaskPriority): void {
		const tasks = [...this.tasks];
		const idx = tasks.findIndex((t) => t.id === task.id);
		if (idx >= 0) {
			tasks[idx] = { ...task, priority, updatedAt: new Date().toISOString() };
			this.saveTasks(tasks);
		}
	}

	private deleteTask(task: Task): void {
		const tasks = this.tasks.filter((t) => t.id !== task.id);
		this.saveTasks(tasks);
	}
}
