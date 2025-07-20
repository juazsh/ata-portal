import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { LoaderIcon, PlusCircleIcon, TrashIcon, PencilIcon, SaveIcon, XIcon, CalendarIcon, ClockIcon, MapPinIcon, UsersIcon, GraduationCapIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface Schedule {
  id: string;
  date: string;
  totalCapacity: number;
  demoCapacity: number;
  availableCapacity: number;
  availableDemoCapacity: number;
  locationId: string;
  sessionId: string;
  programId?: string;
  planId?: string;
  active: boolean;
}

interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
  offerings: OfferingItem[];
}

interface OfferingItem {
  id: string;
  name: string;
  plans?: Array<{
    id: string;
    name: string;
    price: number;
    tax: number;
  }>;
  programs?: Array<{
    id: string;
    name: string;
    price: number;
    tax: number;
  }>;
}

interface Session {
  id: string;
  name: string;
  day: string;
  start_time: string;
  end_time: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
}

interface Program {
  id: string;
  name: string;
  description: string;
}

interface FormData {
  date: string;
  totalCapacity: number;
  demoCapacity: number;
  locationId: string;
  sessionId: string;
  offeringType: 'marathon' | 'sprint' | '';
  planId: string;
  programId: string;
  active: boolean;
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const ScheduleManagement: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState<FormData>({
    date: '',
    totalCapacity: 10,
    demoCapacity: 2,
    locationId: '',
    sessionId: '',
    offeringType: '',
    planId: '',
    programId: '',
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchSchedules();
    fetchLocations();
    fetchSessions();
    fetchPlans();
    fetchPrograms();
  }, []);

  const fetchSchedules = async () => {
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

      let url = '/api/schedules';
      const params = new URLSearchParams();
      if (filterDate) params.append('date', filterDate);
      if (filterLocation) params.append('locationId', filterLocation);
      if (params.toString()) url += `?${params.toString()}`;

                    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error(`Failed to fetch schedules: ${response.status}`);
      
      const data = await response.json();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast({
        title: "Error",
        description: "Failed to load schedules. Please try again.",
        variant: "destructive",
      });
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // Update filter handling to properly handle "all" selection
  const applyFilters = () => {
    fetchSchedules();
  };

//   const fetchSchedules = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("auth_token");
//       if (!token) {
//         toast({
//           title: "Authentication Error",
//           description: "No authentication token found. Please log in again.",
//           variant: "destructive",
//         });
//         return;
//       }

//       let url = '/api/schedules';
//       const params = new URLSearchParams();
//       if (filterDate) params.append('date', filterDate);
//       if (filterLocation && filterLocation !== 'all') params.append('locationId', filterLocation);
//       if (params.toString()) url += `?${params.toString()}`;

//       const response = await fetch(url, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
      
//       if (!response.ok) throw new Error(`Failed to fetch schedules: ${response.status}`);
      
//       const data = await response.json();
//       setSchedules(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error("Error fetching schedules:", error);
//       toast({
//         title: "Error",
//         description: "Failed to load schedules. Please try again.",
//         variant: "destructive",
//       });
//       setSchedules([]);
//     } finally {
//       setLoading(false);
//     }
//   };

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch('/api/locations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLocations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch('/api/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessions(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch('/api/plans', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlans(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch('/api/programs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPrograms(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      totalCapacity: 10,
      demoCapacity: 2,
      locationId: '',
      sessionId: '',
      offeringType: '',
      planId: '',
      programId: '',
      active: true,
    });
    setEditingSchedule(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    
    // Convert date to YYYY-MM-DD format for input
    const scheduleDate = new Date(schedule.date);
    const formattedDate = scheduleDate.toISOString().split('T')[0];
    
    setFormData({
      date: formattedDate,
      totalCapacity: schedule.totalCapacity,
      demoCapacity: schedule.demoCapacity,
      locationId: schedule.locationId,
      sessionId: schedule.sessionId,
      offeringType: schedule.planId ? 'marathon' : 'sprint',
      planId: schedule.planId || '',
      programId: schedule.programId || '',
      active: schedule.active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    if (!formData.date) {
      toast({
        title: "Validation Error",
        description: "Date is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.locationId) {
      toast({
        title: "Validation Error",
        description: "Location is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.sessionId) {
      toast({
        title: "Validation Error",
        description: "Session is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.offeringType) {
      toast({
        title: "Validation Error",
        description: "Offering type is required.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.offeringType === 'marathon' && !formData.planId) {
      toast({
        title: "Validation Error",
        description: "Plan is required for Marathon offerings.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.offeringType === 'sprint' && !formData.programId) {
      toast({
        title: "Validation Error",
        description: "Program is required for Sprint offerings.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.totalCapacity < 1) {
      toast({
        title: "Validation Error",
        description: "Total capacity must be at least 1.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.demoCapacity < 0 || formData.demoCapacity > formData.totalCapacity) {
      toast({
        title: "Validation Error",
        description: "Demo capacity must be between 0 and total capacity.",
        variant: "destructive",
      });
      return false;
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(formData.date);
    if (selectedDate < today) {
      toast({
        title: "Validation Error",
        description: "Cannot create schedule for past dates.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No authentication token found");

      const payload: any = {
        date: formData.date,
        totalCapacity: formData.totalCapacity,
        demoCapacity: formData.demoCapacity,
        locationId: formData.locationId,
        sessionId: formData.sessionId,
        active: formData.active,
      };

      if (formData.offeringType === 'marathon') {
        payload.planId = formData.planId;
      } else {
        payload.programId = formData.programId;
      }

      const url = editingSchedule ? `/api/schedules/${editingSchedule.id}` : '/api/schedules';
      const method = editingSchedule ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${editingSchedule ? 'update' : 'create'} schedule`);
      }

      toast({
        title: "Success",
        description: `Schedule ${editingSchedule ? 'updated' : 'created'} successfully`,
      });

      closeModal();
      fetchSchedules();
    } catch (error) {
      console.error("Schedule operation error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Operation failed",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (schedule: Schedule) => {
    const enrolledCount = schedule.totalCapacity - schedule.availableCapacity;
    const enrolledDemoCount = schedule.demoCapacity - schedule.availableDemoCapacity;
    
    if (enrolledCount > 0 || enrolledDemoCount > 0) {
      toast({
        title: "Cannot Delete",
        description: `This schedule has ${enrolledCount} enrolled students and ${enrolledDemoCount} demo students. Remove enrollments first.`,
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete this schedule? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`/api/schedules/${schedule.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete schedule");
      }

      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });
      
      fetchSchedules();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete schedule",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'totalCapacity' || name === 'demoCapacity') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const getLocationName = (locationId: string) => {
    const location = locations.find(l => l.id === locationId);
    return location ? `${location.name} (${location.city}, ${location.state})` : locationId;
  };

  const getSessionName = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    return session ? `${session.name} - ${session.day} ${session.start_time}-${session.end_time}` : sessionId;
  };

  const getPlanName = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    return plan?.name || planId;
  };

  const getProgramName = (programId: string) => {
    const program = programs.find(p => p.id === programId);
    return program?.name || programId;
  };

  const getAvailableOptions = () => {
    if (!formData.locationId) return { plans: [], programs: [] };
    
    const location = locations.find(l => l.id === formData.locationId);
    if (!location) return { plans: [], programs: [] };

    const availablePlans: { id: string; name: string }[] = [];
    const availablePrograms: { id: string; name: string }[] = [];

    location.offerings.forEach(offering => {
      if (offering.name === "Marathon" && offering.plans) {
        offering.plans.forEach(plan => {
          availablePlans.push({ id: plan.id, name: plan.name });
        });
      } else if (offering.name !== "Marathon" && offering.programs) {
        offering.programs.forEach(program => {
          availablePrograms.push({ id: program.id, name: program.name });
        });
      }
    });

    return { plans: availablePlans, programs: availablePrograms };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatEnrollmentStatus = (available: number, total: number) => {
    const enrolled = total - available;
    return `${enrolled}/${total}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { plans: availablePlans, programs: availablePrograms } = getAvailableOptions();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Schedule Management</h1>
          <p className="text-muted-foreground">Manage class schedules and student capacity</p>
        </div>
        <Button onClick={openCreateModal}>
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Create Schedule
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="filterDate">Filter by Date</Label>
              <Input
                id="filterDate"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="filterLocation">Filter by Location</Label>
              <Select value={filterLocation || undefined} onValueChange={(value) => setFilterLocation(value || '')}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={applyFilters} className="w-full mt-1">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Schedules Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven't created any schedules yet. Get started by creating your first class schedule.
            </p>
            <Button onClick={openCreateModal}>
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              Create First Schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      {formatDate(schedule.date)}
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {getLocationName(schedule.locationId)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(schedule)}
                      title="Edit schedule"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(schedule)}
                      title="Delete schedule"
                      className="text-destructive hover:text-destructive"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{getSessionName(schedule.sessionId)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCapIcon className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {schedule.planId ? `Marathon: ${getPlanName(schedule.planId)}` : `Sprint: ${getProgramName(schedule.programId!)}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <UsersIcon className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Regular: {formatEnrollmentStatus(schedule.availableCapacity, schedule.totalCapacity)}
                    </span>
                  </div>

                  {schedule.demoCapacity > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <UsersIcon className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Demo: {formatEnrollmentStatus(schedule.availableDemoCapacity, schedule.demoCapacity)}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant={schedule.active ? "default" : "secondary"}>
                      {schedule.active ? "Active" : "Inactive"}
                    </Badge>
                    {schedule.availableCapacity === 0 && (
                      <Badge variant="destructive">Full</Badge>
                    )}
                    {schedule.planId && (
                      <Badge variant="outline">Marathon</Badge>
                    )}
                    {schedule.programId && (
                      <Badge variant="outline">Sprint</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
            </DialogTitle>
            <DialogDescription>
              {editingSchedule ? 'Update the schedule details below.' : 'Fill in the details to create a new class schedule.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationId">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.locationId || undefined} onValueChange={(value) => setFormData(prev => ({ ...prev, locationId: value || '', offeringType: '', planId: '', programId: '' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} ({location.city}, {location.state})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionId">
                Session <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.sessionId || undefined} onValueChange={(value) => setFormData(prev => ({ ...prev, sessionId: value || '' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name} - {session.day.charAt(0).toUpperCase() + session.day.slice(1)} {session.start_time}-{session.end_time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalCapacity">
                  Total Capacity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="totalCapacity"
                  name="totalCapacity"
                  type="number"
                  min="1"
                  value={formData.totalCapacity}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="demoCapacity">
                  Demo Capacity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="demoCapacity"
                  name="demoCapacity"
                  type="number"
                  min="0"
                  max={formData.totalCapacity}
                  value={formData.demoCapacity}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offeringType">
                Offering Type <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.offeringType || undefined} 
                onValueChange={(value: 'marathon' | 'sprint') => setFormData(prev => ({ ...prev, offeringType: value || '', planId: '', programId: '' }))}
                disabled={!formData.locationId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select offering type" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlans.length > 0 && (
                    <SelectItem value="marathon">Marathon (Plans)</SelectItem>
                  )}
                  {availablePrograms.length > 0 && (
                    <SelectItem value="sprint">Sprint (Programs)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {formData.offeringType === 'marathon' && (
              <div className="space-y-2">
                <Label htmlFor="planId">
                  Plan <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.planId || undefined} onValueChange={(value) => setFormData(prev => ({ ...prev, planId: value || '' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.offeringType === 'sprint' && (
              <div className="space-y-2">
                <Label htmlFor="programId">
                  Program <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.programId || undefined} onValueChange={(value) => setFormData(prev => ({ ...prev, programId: value || '' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePrograms.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked as boolean }))}
              />
              <Label htmlFor="active">Active</Label>
            </div>

            <Separator className="my-4" />

            <div className="flex justify-end gap-3">
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
                  ? (editingSchedule ? 'Updating...' : 'Creating...') 
                  : (editingSchedule ? 'Update Schedule' : 'Create Schedule')
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduleManagement;