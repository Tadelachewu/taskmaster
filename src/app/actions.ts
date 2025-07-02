"use server";

import { prioritizeTasks, type Task } from "@/ai/flows/intelligent-task-prioritization";

export async function getPrioritizedTasks(tasks: Task[]) {
  try {
    const prioritizedTasks = await prioritizeTasks(tasks);
    return { success: true, data: prioritizedTasks };
  } catch (error) {
    console.error("Error prioritizing tasks:", error);
    return { success: false, error: "Failed to prioritize tasks with AI. Please try again." };
  }
}
