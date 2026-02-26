import { App, Modal } from "obsidian";
import type { Task, TaskPriority, TaskState } from "./types";
import { toPascalCase } from "./storage";

export type TaskFormResult = {
	content: string;
	state: TaskState;
	priority: TaskPriority;
	dueDate: string | null;
	tags: string[];
};

const STATES: TaskState[] = ["ToDo", "InProgress", "Done"];
const PRIORITIES: TaskPriority[] = ["Low", "Medium", "High", "Highest"];

export class TaskFormModal extends Modal {
	result: TaskFormResult = {
		content: "",
		state: "ToDo",
		priority: "Medium",
		dueDate: null,
		tags: [],
	};
	onSubmit: (result: TaskFormResult) => void;
	task: Task | null = null;

	constructor(app: App, onSubmit: (result: TaskFormResult) => void, task?: Task) {
		super(app);
		this.onSubmit = onSubmit;
		this.task = task ?? null;
		if (this.task) {
			this.result = {
				content: this.task.content,
				state: this.task.state,
				priority: this.task.priority ?? "Medium",
				dueDate: this.task.dueDate,
				tags: this.task.tags?.length ? this.task.tags : [],
			};
		}
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("task-plugin-modal");
		contentEl.createEl("h2", { text: this.task ? "Edit task" : "New task", cls: "task-plugin-modal-title" });

		// --- Description ---
		const descSection = contentEl.createDiv({ cls: "task-plugin-modal-section" });
		descSection.createEl("label", { text: "Description", cls: "task-plugin-modal-label" }).setAttribute("for", "task-content");
		const contentInput = descSection.createEl("textarea", {
			attr: { id: "task-content", placeholder: "What needs to be done..." },
			cls: "task-plugin-modal-input",
		});
		contentInput.value = this.result.content;
		contentInput.rows = 3;
		contentInput.oninput = () => (this.result.content = contentInput.value.trim());

		// --- Status (separate section) ---
		const stateSection = contentEl.createDiv({ cls: "task-plugin-modal-section" });
		stateSection.createEl("span", { text: "Status", cls: "task-plugin-modal-label" });
		const stateGroup = stateSection.createDiv({ cls: "task-plugin-modal-pill-group" });
		for (const s of STATES) {
			const btn = stateGroup.createEl("button", { cls: "task-plugin-modal-pill", text: s });
			btn.setAttribute("data-value", s);
			if (s === this.result.state) btn.classList.add("is-active");
			btn.onclick = () => {
				this.result.state = s;
				stateGroup.querySelectorAll(".task-plugin-modal-pill").forEach((el) => el.classList.remove("is-active"));
				btn.classList.add("is-active");
			};
		}

		// --- Priority (separate section) ---
		const prioritySection = contentEl.createDiv({ cls: "task-plugin-modal-section" });
		prioritySection.createEl("span", { text: "Priority", cls: "task-plugin-modal-label" });
		const priorityGroup = prioritySection.createDiv({ cls: "task-plugin-modal-pill-group" });
		for (const p of PRIORITIES) {
			const btn = priorityGroup.createEl("button", {
				cls: `task-plugin-modal-pill task-plugin-modal-pill-priority task-plugin-priority-badge ${p}`,
				text: p,
			});
			btn.setAttribute("data-value", p);
			if (p === this.result.priority) btn.classList.add("is-active");
			btn.onclick = () => {
				this.result.priority = p;
				priorityGroup.querySelectorAll(".task-plugin-modal-pill").forEach((el) => el.classList.remove("is-active"));
				btn.classList.add("is-active");
			};
		}

		// --- Due date ---
		const dueSection = contentEl.createDiv({ cls: "task-plugin-modal-section" });
		dueSection.createEl("label", { text: "Due date", cls: "task-plugin-modal-label" }).setAttribute("for", "task-due");
		const dueInput = dueSection.createEl("input", {
			attr: { id: "task-due", type: "date" },
			cls: "task-plugin-modal-input",
		});
		dueInput.value = this.result.dueDate ?? "";
		dueInput.onchange = () => (this.result.dueDate = dueInput.value || null);

		// --- Tags (categories, comma-separated) ---
		const tagSection = contentEl.createDiv({ cls: "task-plugin-modal-section" });
		tagSection.createEl("label", { text: "Tags", cls: "task-plugin-modal-label" }).setAttribute("for", "task-tag");
		const tagInput = tagSection.createEl("input", {
			attr: { id: "task-tag", type: "text", placeholder: "e.g. work, personal (separados por comas)" },
			cls: "task-plugin-modal-input",
		});
		tagInput.value = this.result.tags.join(", ");
		tagInput.oninput = () => {
			this.result.tags = tagInput.value
				.split(",")
				.map((s) => toPascalCase(s))
				.filter(Boolean);
		};

		// --- Actions ---
		const actions = contentEl.createDiv({ cls: "task-plugin-modal-actions" });
		const cancelBtn = actions.createEl("button", { text: "Cancel", cls: "task-plugin-modal-btn-cancel" });
		cancelBtn.onclick = () => this.close();
		const submitBtn = actions.createEl("button", {
			text: this.task ? "Save" : "Create task",
			cls: "mod-cta task-plugin-modal-btn-save",
		});
		submitBtn.onclick = () => {
			this.result.content = contentInput.value.trim();
			this.result.dueDate = dueInput.value || null;
			this.result.tags = tagInput.value
				.split(",")
				.map((s) => toPascalCase(s))
				.filter(Boolean);
			if (!this.result.content) return;
			this.onSubmit(this.result);
			this.close();
		};
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
