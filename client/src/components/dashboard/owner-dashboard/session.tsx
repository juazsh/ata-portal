import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LoaderIcon, PlusCircleIcon, TrashIcon, PencilIcon, SaveIcon, XIcon, ClockIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Session {
  id: string;
  name: string;
  day: string;
  start_time: string;
  end_time: string;
}

interface FormData {
  name: string;
  day: string;
  start_time: string;
  end_time: string;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const SessionManagement: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    day: '',
    start_time: '',
    end_time: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "No authentication token found. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/sessions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(`Failed to fetch sessions: ${response.status}`);
      }
      
      const data = await response.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load sessions. Please try again.",
        variant: "destructive",
      });
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      day: '',
      start_time: '',
      end_time: '',
    });
    setEditingSession(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (session: Session) => {
    setEditingSession(session);
    setFormData({
      name: session.name,
      day: session.day,
      start_time: session.start_time,
      end_time: session.end_time,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Session name is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.day) {
      toast({
        title: "Validation Error",
        description: "Please select a day.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.start_time) {
      toast({
        title: "Validation Error",
        description: "Start time is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.end_time) {
      toast({
        title: "Validation Error",
        description: "End time is required.",
        variant: "destructive",
      });
      return false;
    }

    const startTime = new Date(`2000-01-01T${formData.start_time}`);
    const endTime = new Date(`2000-01-01T${formData.end_time}`);
    
    if (endTime <= startTime) {
      toast({
        title: "Validation Error",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const url = editingSession 
        ? `/api/sessions/${editingSession.id}` 
        : '/api/sessions';
      
      const method = editingSession ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${editingSession ? 'update' : 'create'} session`);
      }

      toast({
        title: "Success",
        description: `Session ${editingSession ? 'updated' : 'created'} successfully`,
      });

      closeModal();
      fetchSessions();
    } catch (error) {
      console.error("Session operation error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Operation failed",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (session: Session) => {
    if (!window.confirm(`Are you sure you want to delete the session "${session.name}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/sessions/${session.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete session");
      }

      toast({
        title: "Success",
        description: "Session deleted successfully",
      });
      fetchSessions();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete session",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDayChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      day: value
    }));
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getDayLabel = (day: string) => {
    const dayObj = DAYS_OF_WEEK.find(d => d.value === day);
    return dayObj ? dayObj.label : day.charAt(0).toUpperCase() + day.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Session Management</h1>
          <p className="text-muted-foreground">Create and manage your sessions</p>
        </div>
        <Button onClick={openCreateModal}>
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Add New Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClockIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sessions Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven't created any sessions yet. Get started by creating your first session.
            </p>
            <Button onClick={openCreateModal}>
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              Create First Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{session.name}</CardTitle>
                    <CardDescription className="text-base font-medium">
                      {getDayLabel(session.day)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(session)}
                      title="Edit session"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(session)}
                      title="Delete session"
                      className="text-destructive hover:text-destructive"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Start Time:</span>
                    <span className="font-medium">{formatTime(session.start_time)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">End Time:</span>
                    <span className="font-medium">{formatTime(session.end_time)}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ClockIcon className="h-4 w-4" />
                      <span>
                        Duration: {
                          (() => {
                            const start = new Date(`2000-01-01T${session.start_time}`);
                            const end = new Date(`2000-01-01T${session.end_time}`);
                            const diffMs = end.getTime() - start.getTime();
                            const diffMins = Math.floor(diffMs / (1000 * 60));
                            const hours = Math.floor(diffMins / 60);
                            const minutes = diffMins % 60;
                            return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                          })()
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? 'Edit Session' : 'Create New Session'}
            </DialogTitle>
            <DialogDescription>
              {editingSession ? 'Update the session details below.' : 'Fill in the details to create a new session.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Session Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter session name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="day">
                Day <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.day} onValueChange={handleDayChange}>
                <SelectTrigger id="day">
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">
                  Start Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">
                  End Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={closeModal}
                disabled={submitting}
              >
                <XIcon className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <SaveIcon className="h-4 w-4 mr-2" />
                )}
                {submitting 
                  ? (editingSession ? 'Updating...' : 'Creating...') 
                  : (editingSession ? 'Update Session' : 'Create Session')
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionManagement;