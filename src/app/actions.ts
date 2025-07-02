
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { prioritizeTasks, type Task } from "@/ai/flows/intelligent-task-prioritization";
import { z } from "zod";
import type { AppTask } from "@/lib/types";

export async function getTasks(filter: "all" | "active" | "completed") {
  try {
    let query = `
      SELECT 
        id, 
        title, 
        description, 
        deadline, 
        importance, 
        predicted_effort AS "predictedEffort", 
        completed, 
        priority_score AS "priorityScore", 
        reasoning, 
        created_at AS "createdAt" 
      FROM tasks
    `;
    const params = [];

    if (filter === "active") {
      query += ' WHERE completed = false';
    } else if (filter === "completed") {
      query += ' WHERE completed = true';
    }

    query += ' ORDER BY priority_score DESC NULLS LAST, created_at DESC';

    const result = await db.query(query, params);
    return { success: true, data: result.rows as AppTask[] };
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return { success: false, error: "Failed to fetch tasks." };
  }
}

const AddTaskSchema = z.object({
  title: z.string(),
  description: z.string(),
  deadline: z.string(),
  importance: z.enum(['low', 'medium', 'high']),
  predictedEffort: z.string(),
});

export async function addTask(values: z.infer<typeof AddTaskSchema>) {
  try {
    const { title, description, deadline, importance, predictedEffort } = values;
    await db.query(
      'INSERT INTO tasks (title, description, deadline, importance, predicted_effort) VALUES ($1, $2, $3, $4, $5)',
      [title, description, deadline, importance, predictedEffort]
    );
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error adding task:", error);
    return { success: false, error: "Failed to add task." };
  }
}

const UpdateTaskSchema = z.object({
    title: z.string(),
    description: z.string(),
    deadline: z.string(),
    importance: z.enum(['low', 'medium', 'high']),
    predictedEffort: z.string(),
});

export async function updateTask(taskId: string, values: z.infer<typeof UpdateTaskSchema>) {
  try {
    const { title, description, deadline, importance, predictedEffort } = values;
    await db.query(
        'UPDATE tasks SET title = $1, description = $2, deadline = $3, importance = $4, predicted_effort = $5 WHERE id = $6',
        [title, description, deadline, importance, predictedEffort, taskId]
    );
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating task:", error);
    return { success: false, error: "Failed to update task." };
  }
}

export async function deleteTask(taskId: string) {
  try {
    await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting task:", error);
    return { success: false, error: "Failed to delete task." };
  }
}

export async function toggleTaskComplete(taskId: string, completed: boolean) {
  try {
    await db.query('UPDATE tasks SET completed = $1 WHERE id = $2', [completed, taskId]);
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
      return db.query(
        'UPDATE tasks SET priority_score = $1, reasoning = $2 WHERE title = $3',
        [pTask.priorityScore, pTask.reasoning, pTask.title]
      );
    });
    await Promise.all(promises);

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error prioritizing tasks:", error);
    return { success: false, error: "Failed to prioritize tasks with AI. Please try again." };
  }
}
