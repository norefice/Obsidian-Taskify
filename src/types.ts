/**
 * Possible task states
 */
export type TaskState = "ToDo" | "InProgress" | "Done";

/**
 * Task priority
 */
export type TaskPriority = "Low" | "Medium" | "High" | "Highest";

/**
 * Task model
 */
export interface Task {
	id: string;
	content: string;
	state: TaskState;
	priority: TaskPriority;
	dueDate: string | null;   // ISO date YYYY-MM-DD
	tags: string[];           // optional category tags (comma-separated in the form)
	createdAt: string;        // ISO datetime
	updatedAt: string;
}

/**
 * Persistent plugin data
 */
export interface TaskPluginData {
	tasks: Task[];
	version?: number;
}
