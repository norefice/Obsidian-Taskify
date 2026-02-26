import { App, Modal } from "obsidian";
import type { Task, TaskState } from "./types";
import { TaskFormModal } from "./TaskFormModal";

export class TaskListModal extends Modal {
	tasks: Task[];
	onUpdate: (tasks: Task[]) => void;
	refreshList: () => void;

	constructor(app: App, tasks: Task[], onUpdate: (tasks: Task[]) => void) {
		super(app);
		this.tasks = [...tasks];
		this.onUpdate = onUpdate;
		this.refreshList = () => this.renderList();
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("task-plugin-container");
		contentEl.createEl("h2", { text: "Task list" });

		const addBtn = contentEl.createEl("button", { text: "+ New task", cls: "mod-cta" });
		addBtn.style.marginBottom = "1em";
		addBtn.onclick = () => this.openTaskForm();

		const listEl = contentEl.createDiv();
		this.renderListInto(listEl);
	}

	renderList(): void {
		const listEl = this.contentEl.querySelector(".task-plugin-list-container");
		if (listEl) {
			listEl.empty();
			this.renderListInto(listEl as HTMLDivElement);
		}
	}

	private renderListInto(container: HTMLDivElement): void {
		container.empty();
		container.addClass("task-plugin-list-container");

		if (this.tasks.length === 0) {
			container.createDiv({ cls: "task-plugin-empty", text: "No tasks yet. Add one with \"New task\"." });
			return;
		}

		const ul = container.createEl("ul", { cls: "task-plugin-list" });
		for (const task of this.tasks) {
			const li = ul.createEl("li", { cls: "task-plugin-item" });
			li.setAttribute("data-state", task.state);

			const contentDiv = li.createDiv({ cls: "task-content" });
			contentDiv.createDiv({ cls: "task-title", text: task.content });
			const meta = contentDiv.createDiv({ cls: "task-meta" });
			meta.append(
				contentDiv.createSpan({ cls: `task-plugin-state-badge ${task.state}`, text: task.state })
			);
			if (task.dueDate) {
				meta.appendText(" ? Due: " + task.dueDate);
			}
			for (const tag of task.tags ?? []) {
				if (tag) meta.append(contentDiv.createSpan({ cls: "task-plugin-tag-badge", text: tag }));
			}

			const actions = li.createDiv({ cls: "task-actions" });
			const editBtn = actions.createEl("button", { text: "Edit" });
			editBtn.onclick = () => this.openTaskForm(task);
			const stateBtn = actions.createEl("button", { text: "State" });
			stateBtn.onclick = () => this.cycleState(task);
			const deleteBtn = actions.createEl("button", { text: "Delete" });
			deleteBtn.onclick = () => this.deleteTask(task);
		}
	}

	private openTaskForm(task?: Task): void {
		new TaskFormModal(this.app, (result) => {
			if (task) {
				const idx = this.tasks.findIndex((t) => t.id === task.id);
				if (idx >= 0) {
					this.tasks[idx] = {
						...task,
						...result,
						updatedAt: new Date().toISOString(),
					};
				}
			} else {
				this.tasks.push({
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
			this.onUpdate(this.tasks);
			this.refreshList();
		}, task).open();
	}

	private cycleState(task: Task): void {
		const order: TaskState[] = ["ToDo", "InProgress", "Done"];
		const i = order.indexOf(task.state);
		const next = order[(i + 1) % order.length];
		const idx = this.tasks.findIndex((t) => t.id === task.id);
		if (idx >= 0) {
			this.tasks[idx] = { ...task, state: next, updatedAt: new Date().toISOString() };
			this.onUpdate(this.tasks);
			this.refreshList();
		}
	}

	private deleteTask(task: Task): void {
		this.tasks = this.tasks.filter((t) => t.id !== task.id);
		this.onUpdate(this.tasks);
		this.refreshList();
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
