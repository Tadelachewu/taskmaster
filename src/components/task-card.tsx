"use client";

import { Pencil, Trash2, Info, Sparkles } from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";

import type { AppTask } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TaskCardProps {
  task: AppTask;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
}

export default function TaskCard({ task, onEdit, onDelete, onToggleComplete }: TaskCardProps) {
  const importanceVariant = {
    high: "destructive",
    medium: "secondary",
    low: "outline",
  } as const;
  
  const deadlineDate = parseISO(task.deadline);

  return (
    <Card className={cn(
      "flex flex-col transition-all duration-300 hover:shadow-lg",
      task.completed ? "bg-muted/50" : "bg-card"
    )}>
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className={cn("text-lg font-semibold leading-snug", task.completed && "line-through text-muted-foreground")}>
                {task.title}
            </CardTitle>
            {task.priorityScore !== undefined && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant="default" className="flex items-center gap-1.5 bg-primary/20 text-primary hover:bg-primary/30 cursor-default">
                                <Sparkles className="h-3 w-3" />
                                {task.priorityScore}
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="max-w-xs">{task.reasoning}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
        <CardDescription className="text-sm line-clamp-2">{task.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex gap-2">
                <Badge variant={importanceVariant[task.importance]}>{task.importance}</Badge>
                <Badge variant="outline">{task.predictedEffort}</Badge>
            </div>
            
        </div>
        <div className="text-sm text-muted-foreground">
            Due {formatDistanceToNow(deadlineDate, { addSuffix: true })} ({format(deadlineDate, "MMM d")})
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`complete-${task.id}`}
            checked={task.completed}
            onCheckedChange={(checked) => onToggleComplete(task.id, !!checked)}
            aria-label="Mark task as complete"
          />
          <label htmlFor={`complete-${task.id}`} className="text-sm font-medium text-muted-foreground cursor-pointer">
            {task.completed ? "Completed" : "Mark as complete"}
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit task">
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete task">
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
