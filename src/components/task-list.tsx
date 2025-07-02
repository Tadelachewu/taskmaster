"use client";

import type { AppTask } from "@/lib/types";
import TaskCard from "./task-card";

interface TaskListProps {
  tasks: AppTask[];
  onEditTask: (task: AppTask) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
}

export default function TaskList({
  tasks,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
}: TaskListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={() => onEditTask(task)}
          onDelete={() => onDeleteTask(task.id)}
          onToggleComplete={onToggleComplete}
        />
      ))}
    </div>
  );
}
