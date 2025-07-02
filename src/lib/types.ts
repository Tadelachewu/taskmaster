import type { PrioritizedTask } from "@/ai/flows/intelligent-task-prioritization";

export type AppTask = Partial<Omit<PrioritizedTask, 'deadline'>> & {
  id: string;
  title: string;
  description: string;
  deadline: string; // Keep as string for form compatibility
  importance: "high" | "medium" | "low";
  predictedEffort: string;
  completed: boolean;
};
