import type { Task, TaskPluginData, TaskPriority } from "./types";

const DEFAULT_DATA: TaskPluginData = {
	tasks: [],
	version: 1,
};

const DEFAULT_PRIORITY: TaskPriority = "Medium";

/** Format a tag string to PascalCase (e.g. "lotey vencimiento" → "LoteyVencimiento"). */
export function toPascalCase(s: string): string {
	const trimmed = s.trim();
	if (!trimmed) return "";
	return trimmed
		.split(/\s+/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join("");
}

export function generateTaskId(): string {
	return "task-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
}

function normalizeTask(t: Partial<Task> & Record<string, unknown>): Task {
	const any = t as Record<string, unknown>;
	let tags: string[] = [];
	if (Array.isArray(t.tags)) {
		tags = t.tags
			.filter((s): s is string => typeof s === "string" && s.trim() !== "")
			.map((s) => toPascalCase(s.trim()))
			.filter(Boolean);
	} else if (typeof (t.tag ?? any.tag) === "string") {
		const single = (t.tag ?? any.tag) as string;
		if (single.trim()) tags = [toPascalCase(single.trim())];
	}
	return {
		id: t.id!,
		content: t.content!,
		state: t.state!,
		priority: (t.priority ?? DEFAULT_PRIORITY) as Task["priority"],
		dueDate: (t.dueDate ?? any.endDate ?? null) as string | null,
		tags,
		createdAt: t.createdAt!,
		updatedAt: t.updatedAt!,
	};
}

export function newTask(
	content: string,
	state: Task["state"] = "ToDo",
	priority: TaskPriority = DEFAULT_PRIORITY,
	tags: string[] | null = null
): Task {
	const now = new Date().toISOString();
	const tagList = Array.isArray(tags)
		? tags
				.filter((s) => typeof s === "string" && s.trim())
				.map((s) => toPascalCase((s as string).trim()))
				.filter(Boolean)
		: [];
	return {
		id: generateTaskId(),
		content,
		state,
		priority,
		dueDate: null,
		tags: tagList,
		createdAt: now,
		updatedAt: now,
	};
}

export function mergeWithDefaults(data: unknown): TaskPluginData {
	if (!data || typeof data !== "object") return { ...DEFAULT_DATA };
	const partial = data as Partial<TaskPluginData>;
	const rawTasks = Array.isArray(partial.tasks) ? partial.tasks : DEFAULT_DATA.tasks;
	const tasks = rawTasks.map((t) => normalizeTask(t as Partial<Task> & Record<string, unknown>));
	return {
		tasks,
		version: partial.version ?? DEFAULT_DATA.version,
	};
}
