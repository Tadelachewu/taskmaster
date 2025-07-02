export type AppTask = {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  importance: 'low' | 'medium' | 'high';
  predictedEffort: string;
  completed: boolean;
  priorityScore: number | null;
  reasoning: string | null;
  createdAt: Date;
};
