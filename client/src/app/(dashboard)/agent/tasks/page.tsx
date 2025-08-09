"use client";

import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Calendar, User, CheckSquare, Clock, AlertCircle } from "lucide-react";
import { useState } from "react";
import { 
  useGetAgentTasksQuery,
  useUpdateTaskStatusMutation
} from "@/state/api";

const Tasks = () => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [editForm, setEditForm] = useState({
    status: "",
    description: ""
  });

  // Get agent tasks from API
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useGetAgentTasksQuery();
  const [updateTaskStatus] = useUpdateTaskStatusMutation();

  // Filter tasks based on active tab
  const filteredTasks = tasks.filter((task: any) => {
    if (activeTab === "all") return true;
    return task.status.toLowerCase() === activeTab.toLowerCase();
  });

  // Calculate task statistics
  const taskStats = {
    totalTasks: tasks.length,
    pendingTasks: tasks.filter((task: any) => task.status === 'Pending').length,
    inProgressTasks: tasks.filter((task: any) => task.status === 'In Progress').length,
    completedTasks: tasks.filter((task: any) => task.status === 'Completed').length,
    overdueTasks: tasks.filter((task: any) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      return dueDate < today && task.status !== 'Completed';
    }).length
  };

  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setEditForm({
      status: task.status,
      description: task.description || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTask = async () => {
    try {
      if (!selectedTask) return;
      
      await updateTaskStatus({
        taskId: selectedTask.id,
        status: editForm.status,
        description: editForm.description
      }).unwrap();
      
      setIsEditDialogOpen(false);
      setSelectedTask(null);
      setEditForm({ status: "", description: "" });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "Completed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "Medium":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case "Low":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (!dueDate || status === 'Completed') return false;
    const due = new Date(dueDate);
    const today = new Date();
    return due < today;
  };

  if (tasksLoading) return <Loading />;

  return (
    <div className="dashboard-container">
      <Header
        title="My Tasks"
        subtitle="View and update your assigned tasks"
      />

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{taskStats.pendingTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{taskStats.inProgressTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{taskStats.completedTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{taskStats.overdueTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Task Tabs and Table */}
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All Tasks ({taskStats.totalTasks})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({taskStats.pendingTasks})</TabsTrigger>
            <TabsTrigger value="in progress">In Progress ({taskStats.inProgressTasks})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({taskStats.completedTasks})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-0">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {filteredTasks.length === 0 ? (
              <Card className="max-w-md mx-auto mt-12">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckSquare className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Tasks Available
                  </h3>
                  <p className="text-gray-500 text-center">
                    You don&apos;t have any tasks assigned yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task: any) => (
                    <TableRow key={task.id} className={isOverdue(task.dueDate, task.status) ? "bg-red-50" : ""}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {task.title}
                            {isOverdue(task.dueDate, task.status) && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{task.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadge(task.priority)}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(task.status)}>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={isOverdue(task.dueDate, task.status) ? "text-red-600 font-medium" : ""}>
                          {formatDate(task.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(task.createdAt)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTask(task)}
                          disabled={task.status === 'Completed'}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Other tab contents */}
        {["pending", "in progress", "completed"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="mt-0">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {filteredTasks.length === 0 ? (
                <Card className="max-w-md mx-auto mt-12">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CheckSquare className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No {tabValue.charAt(0).toUpperCase() + tabValue.slice(1)} Tasks
                    </h3>
                    <p className="text-gray-500 text-center">
                      You don&apos;t have any {tabValue} tasks.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task: any) => (
                      <TableRow key={task.id} className={isOverdue(task.dueDate, task.status) ? "bg-red-50" : ""}>
                        <TableCell>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {task.title}
                              {isOverdue(task.dueDate, task.status) && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{task.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityBadge(task.priority)}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={isOverdue(task.dueDate, task.status) ? "text-red-600 font-medium" : ""}>
                            {formatDate(task.dueDate)}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(task.createdAt)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTask(task)}
                            disabled={task.status === 'Completed'}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="task-title">Task</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded border">
                <div className="font-medium">{selectedTask?.title}</div>
                <div className="text-sm text-gray-500">{selectedTask?.description}</div>
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm({...editForm, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Update Description (Optional)</Label>
              <Textarea 
                id="description" 
                placeholder="Add any updates or notes about this task" 
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTask}>
              Update Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;