"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Sparkles, Loader2 } from "lucide-react";

import type { AppTask } from "@/lib/types";
import { getTasks, addTask, updateTask, deleteTask, toggleTaskComplete, getPrioritizedTasks } from "@/app/actions";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

import { TaskForm, taskSchema } from "./task-form";
import { z } from "zod";
import TaskList from "./task-list";
import { Skeleton } from "./ui/skeleton";


export default function TaskManager() {
  const [tasks, setTasks] = useState<AppTask[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<AppTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    const result = await getTasks(filter);
    if (result.success && result.data) {
      setTasks(result.data);
    } else {
      toast({
        title: "Error fetching tasks",
        description: result.error,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [filter, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    const result = await deleteTask(taskToDelete);
    if (result.success) {
      toast({ title: "Task Deleted", description: "The task has been successfully removed." });
      await fetchTasks();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsAlertOpen(false);
    setTaskToDelete(null);
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    const result = await toggleTaskComplete(taskId, completed);
    if (result.success) {
      await fetchTasks();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handlePrioritize = async () => {
    setIsPrioritizing(true);
    const tasksToPrioritize = tasks
      .filter(t => !t.completed)
      .map(({ title, description, deadline, importance, predictedEffort }) => ({
        title,
        description,
        deadline: deadline.toISOString(),
        importance,
        predictedEffort,
      }));

    if (tasksToPrioritize.length === 0) {
      toast({
        title: "No Active Tasks",
        description: "There are no active tasks to prioritize.",
      });
      setIsPrioritizing(false);
      return;
    }

    const result = await getPrioritizedTasks(tasksToPrioritize);
    
    if (result.success) {
      toast({
        title: "Tasks Prioritized!",
        description: "Your tasks have been intelligently re-ordered.",
        className: "bg-primary text-primary-foreground",
      });
      await fetchTasks();
    } else {
      toast({
        title: "Prioritization Failed",
        description: result.error,
        variant: "destructive",
      });
    }
    setIsPrioritizing(false);
  };
  
  const onFormSubmit = async (values: z.infer<typeof taskSchema>) => {
    const result = taskToEdit
      ? await updateTask(taskToEdit.id, values)
      : await addTask(values);

    if (result.success) {
      toast({
        title: taskToEdit ? "Task Updated" : "Task Created",
        description: taskToEdit ? "Your changes have been saved." : "A new task has been added to your list.",
      });
      setIsFormOpen(false);
      setTaskToEdit(null);
      await fetchTasks();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };
  
  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-center sm:text-left text-foreground font-headline">Task Master</h1>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrioritize} disabled={isPrioritizing || isLoading} variant="outline">
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

      <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          {isLoading ? (
             <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </CardContent>
                    <CardFooter><Skeleton className="h-8 w-1/2" /></CardFooter>
                  </Card>
                ))}
             </div>
          ) : tasks.length > 0 ? (
            <TaskList
              tasks={tasks}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteConfirmation}
              onToggleComplete={handleToggleComplete}
            />
          ) : (
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
        </div>
      </Tabs>

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
