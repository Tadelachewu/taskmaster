"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Sparkles, Loader2 } from "lucide-react";

import type { AppTask } from "@/lib/types";
import { getPrioritizedTasks } from "@/app/actions";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

import { TaskForm, taskSchema } from "./task-form";
import { z } from "zod";
import TaskList from "./task-list";

const initialTasks: AppTask[] = [
  {
    id: 'task-1',
    title: 'Design the new logo',
    description: 'Create a modern and fresh logo for the brand refresh. Explore 3-4 different concepts.',
    deadline: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
    importance: 'high',
    predictedEffort: '3 days',
    completed: false,
  },
  {
    id: 'task-2',
    title: 'Develop the landing page',
    description: 'Code the new landing page based on the approved Figma designs. Ensure it is fully responsive.',
    deadline: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
    importance: 'high',
    predictedEffort: '5 days',
    completed: false,
  },
  {
    id: 'task-3',
    title: 'Write blog post about Q2 updates',
    description: 'Draft a blog post summarizing the key product updates and achievements from the second quarter.',
    deadline: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    importance: 'medium',
    predictedEffort: '1 day',
    completed: true,
  },
  {
    id: 'task-4',
    title: 'Update user documentation',
    description: 'Review and update the help articles and tutorials for the new features released.',
    deadline: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString(),
    importance: 'low',
    predictedEffort: '4 hours',
    completed: false,
  },
];

export default function TaskManager() {
  const [tasks, setTasks] = useState<AppTask[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<AppTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    // Simulate loading tasks from a source
    setTasks(initialTasks);
  }, []);

  const handleAddTask = () => {
    setTaskToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditTask = (task: AppTask) => {
    setTaskToEdit(task);
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (taskId: string) => {
    setTaskToDelete(taskId);
    setIsAlertOpen(true);
  };

  const handleDeleteTask = () => {
    if (!taskToDelete) return;
    setTasks(tasks.filter((task) => task.id !== taskToDelete));
    toast({ title: "Task Deleted", description: "The task has been successfully removed." });
    setIsAlertOpen(false);
    setTaskToDelete(null);
  };

  const handleToggleComplete = (taskId: string, completed: boolean) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed } : task
      )
    );
  };

  const handlePrioritize = async () => {
    setIsPrioritizing(true);
    const nonPrioritizedTasks = tasks.map(({id, completed, priorityScore, reasoning, ...task}) => task);
    const result = await getPrioritizedTasks(nonPrioritizedTasks);
    
    if (result.success && result.data) {
      const prioritizedData = new Map(result.data.map(p => [p.title, p]));
      
      const updatedTasks = tasks.map(task => {
        const pTask = prioritizedData.get(task.title);
        if (pTask) {
          return { ...task, ...pTask };
        }
        return task;
      });

      // Sort by priority score, highest first
      updatedTasks.sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0));
      setTasks(updatedTasks);

      toast({
        title: "Tasks Prioritized!",
        description: "Your tasks have been intelligently re-ordered.",
        className: "bg-primary text-primary-foreground",
      });
    } else {
      toast({
        title: "Prioritization Failed",
        description: result.error,
        variant: "destructive",
      });
    }
    setIsPrioritizing(false);
  };
  
  const onFormSubmit = (values: z.infer<typeof taskSchema>) => {
    if (taskToEdit) {
      setTasks(
        tasks.map((task) =>
          task.id === taskToEdit.id ? { ...task, ...values, deadline: values.deadline.toISOString() } : task
        )
      );
      toast({ title: "Task Updated", description: "Your changes have been saved." });
    } else {
      const newTask: AppTask = {
        id: `task-${Date.now()}`,
        ...values,
        deadline: values.deadline.toISOString(),
        completed: false,
      };
      setTasks([newTask, ...tasks]);
      toast({ title: "Task Created", description: "A new task has been added to your list." });
    }
    setIsFormOpen(false);
    setTaskToEdit(null);
  };
  
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter === "active") return !task.completed;
      if (filter === "completed") return task.completed;
      return true;
    });
  }, [tasks, filter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-center sm:text-left text-foreground font-headline">Task Master</h1>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrioritize} disabled={isPrioritizing} variant="outline">
            {isPrioritizing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Sparkles className="mr-2 h-4 w-4" />
            )}
            Prioritize with AI
          </Button>
          <Button onClick={handleAddTask} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </header>

      <div>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
          <TabsList>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <TaskList
        tasks={filteredTasks}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteConfirmation}
        onToggleComplete={handleToggleComplete}
      />
      
      {filteredTasks.length === 0 && (
          <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">
              <h3 className="text-xl font-medium text-muted-foreground">No tasks here!</h3>
              <p className="text-muted-foreground mt-2">
                  {filter === 'completed' ? "You haven't completed any tasks yet." : 'Get started by adding a new task.'}
              </p>
              <Button onClick={handleAddTask} className="mt-4 bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Task
              </Button>
          </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{taskToEdit ? "Edit Task" : "Create New Task"}</DialogTitle>
            <DialogDescription>
              {taskToEdit ? "Update the details of your task." : "Fill in the details to add a new task."}
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            onSubmit={onFormSubmit}
            initialData={taskToEdit}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTaskToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
