"use client";

import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetAgentTasksQuery, useUpdateTaskStatusMutation } from "@/state/api";
import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Tasks = () => {
  const {
    data: tasks,
    isLoading,
    isError,
  } = useGetAgentTasksQuery();
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [selectedTask, setSelectedTask] = useState<any>(null);

  if (isLoading) return <Loading />;
  if (isError || !tasks) return <div>Error loading tasks</div>;

  const handleStatusUpdate = async (taskId: number, status: string) => {
    await updateTaskStatus({ taskId, status });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "overdue": return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  return (
    <div className="dashboard-container">
      <Header
        title="Task Management"
        subtitle="Track and manage your daily tasks and appointments"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task: any) => (
          <Card key={task.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{task.title}</CardTitle>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{task.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  {getStatusIcon(task.status)}
                  <span className="ml-2 capitalize">{task.status}</span>
                </div>
                {task.client && (
                  <div className="text-sm text-gray-500">
                    Client: {task.client.name}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {task.status !== "completed" && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate(task.id, "completed")}
                    className="flex-1"
                  >
                    Mark Complete
                  </Button>
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTask(task)}
                    >
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{selectedTask?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={selectedTask?.description}
                          readOnly
                          className="mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Due Date</Label>
                          <Input
                            value={selectedTask?.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : ""}
                            readOnly
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Priority</Label>
                          <Input
                            value={selectedTask?.priority}
                            readOnly
                            className="mt-1"
                          />
                        </div>
                      </div>
                      {selectedTask?.notes && (
                        <div>
                          <Label>Notes</Label>
                          <Textarea
                            value={selectedTask.notes}
                            readOnly
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Tasks;