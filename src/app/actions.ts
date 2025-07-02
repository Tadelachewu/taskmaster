"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tasks, insertTaskSchema } from "@/db/schema";
import { prioritizeTasks, type Task } from "@/ai/flows/intelligent-task-prioritization";
import { eq, desc, not } from "drizzle-orm";
import { z } from "zod";

export async function getTasks(filter: "all" | "active" | "completed") {
  try {
    const whereCondition =
      filter === "active"
        ? not(tasks.completed)
        : filter === "completed"
        ? eq(tasks.completed, true)
        : undefined;

    const allTasks = await db.query.tasks.findMany({
      where: whereCondition,
      orderBy: [desc(tasks.priorityScore), desc(tasks.createdAt)],
    });
    return { success: true, data: allTasks };
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return { success: false, error: "Failed to fetch tasks." };
  }
}

const AddTaskSchema = insertTaskSchema.omit({
  id: true,
  completed: true,
  priorityScore: true,
  reasoning: true,
  createdAt: true,
});

export async function addTask(values: z.infer<typeof AddTaskSchema>) {
  try {
    await db.insert(tasks).values(values);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error adding task:", error);
    return { success: false, error: "Failed to add task." };
  }
}

const UpdateTaskSchema = insertTaskSchema.pick({
    title: true,
    description: true,
    deadline: true,
    importance: true,
    predictedEffort: true,
});

export async function updateTask(taskId: string, values: z.infer<typeof UpdateTaskSchema>) {
  try {
    await db.update(tasks).set(values).where(eq(tasks.id, taskId));
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating task:", error);
    return { success: false, error: "Failed to update task." };
  }
}

export async function deleteTask(taskId: string) {
  try {
    await db.delete(tasks).where(eq(tasks.id, taskId));
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting task:", error);
    return { success: false, error: "Failed to delete task." };
  }
}

export async function toggleTaskComplete(taskId: string, completed: boolean) {
  try {
    await db.update(tasks).set({ completed }).where(eq(tasks.id, taskId));
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating task completion:", error);
    return { success: false, error: "Failed to update task completion." };
  }
}

export async function getPrioritizedTasks(tasksToPrioritize: Task[]) {
  try {
    const prioritizedTasks = await prioritizeTasks(tasksToPrioritize);
    
    const promises = prioritizedTasks.map(pTask => {
      return db.update(tasks)
        .set({
          priorityScore: pTask.priorityScore,
          reasoning: p.reasoning,
        })
        .where(eq(tasks.title, pTask.title));
    });
    await Promise.all(promises);

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error prioritizing tasks:", error);
    return { success: false, error: "Failed to prioritize tasks with AI. Please try again." };
  }
}
