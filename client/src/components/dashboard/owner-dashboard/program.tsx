import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LoaderIcon, PlusCircleIcon, TrashIcon, PencilIcon, SaveIcon, XIcon, GraduationCapIcon, DollarSignIcon, PercentIcon, ClockIcon, ExternalLinkIcon, LayersIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Program {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number;
  image?: string;
  offering: string;
  modules: string[];
  stripeProductId?: string;
  paypalProductId?: string;
  googleClassroomLink?: string;
}

interface Offering {
  id: string;
  name: string;
  description: string;
}

interface Module {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number;
}

interface FormData {
  name: string;
  description: string;
  estimatedDuration: string;
  image: string;
  offering: string;
  googleClassroomLink: string;
  selectedModules: string[];
}

const ProgramManagement: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    estimatedDuration: '',
    image: '',
    offering: '',
    googleClassroomLink: '',
    selectedModules: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPrograms();
    fetchOfferings();
    fetchModules();
  }, []);

  const fetchPrograms = async () => {
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

      const response = await fetch('/api/programs', {
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
        throw new Error(`Failed to fetch programs: ${response.status}`);
      }
      
      const data = await response.json();
      setPrograms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast({
        title: "Error",
        description: "Failed to load programs. Please try again.",
        variant: "destructive",
      });
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfferings = async () => {
    try {
      setLoadingOfferings(true);
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch('/api/offerings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter out Marathon offerings since programs cannot be associated with them
        const nonMarathonOfferings = Array.isArray(data) 
          ? data.filter(offering => offering.name !== "Marathon") 
          : [];
        setOfferings(nonMarathonOfferings);
      }
    } catch (error) {
      console.error("Error fetching offerings:", error);
    } finally {
      setLoadingOfferings(false);
    }
  };

  const fetchModules = async () => {
    try {
      setLoadingModules(true);
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch('/api/modules', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setModules(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
    } finally {
      setLoadingModules(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      estimatedDuration: '',
      image: '',
      offering: '',
      googleClassroomLink: '',
      selectedModules: [],
    });
    setEditingProgram(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (program: Program) => {
    setEditingProgram(program);
    setFormData({
      name: program.name,
      description: program.description,
      estimatedDuration: program.estimatedDuration.toString(),
      image: program.image || '',
      offering: program.offering,
      googleClassroomLink: program.googleClassroomLink || '',
      selectedModules: program.modules || [],
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
        description: "Program name is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Program description is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.offering) {
      toast({
        title: "Validation Error",
        description: "Please select an offering.",
        variant: "destructive",
      });
      return false;
    }

    const duration = parseInt(formData.estimatedDuration);
    if (isNaN(duration) || duration <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid estimated duration (must be greater than 0).",
        variant: "destructive",
      });
      return false;
    }

    if (formData.googleClassroomLink.trim() && !isValidUrl(formData.googleClassroomLink.trim())) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid Google Classroom URL.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
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

      const url = editingProgram 
        ? `/api/programs/${editingProgram.id}` 
        : '/api/programs';
      
      const method = editingProgram ? "PUT" : "POST";

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        estimatedDuration: parseInt(formData.estimatedDuration),
        image: formData.image.trim() || undefined,
        offering: formData.offering,
        googleClassroomLink: formData.googleClassroomLink.trim() || undefined,
        modules: formData.selectedModules,
      };

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
        throw new Error(errorData.message || `Failed to ${editingProgram ? 'update' : 'create'} program`);
      }

      toast({
        title: "Success",
        description: `Program ${editingProgram ? 'updated' : 'created'} successfully`,
      });

      closeModal();
      fetchPrograms();
    } catch (error) {
      console.error("Program operation error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Operation failed",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (program: Program) => {
    if (!window.confirm(`Are you sure you want to delete the program "${program.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/programs/${program.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete program");
      }

      toast({
        title: "Success",
        description: "Program deleted successfully",
      });
      
      fetchPrograms();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete program",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOfferingChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      offering: value,
      selectedModules: [], // Reset modules when changing offering
    }));
  };

  const handleModuleToggle = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedModules: prev.selectedModules.includes(moduleId)
        ? prev.selectedModules.filter(id => id !== moduleId)
        : [...prev.selectedModules, moduleId]
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${hours * 60} min`;
    if (hours === 1) return "1 hour";
    return `${hours} hours`;
  };

  const getOfferingName = (offeringId: string) => {
    const offering = offerings.find(o => o.id === offeringId);
    return offering ? offering.name : offeringId;
  };

  const getModuleName = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    return module ? module.name : moduleId;
  };

  const getModulesForProgram = (programId: string) => {
    // Filter modules that belong to this program
    return modules.filter(module => 
      programs.find(p => p.id === programId)?.modules?.includes(module.id)
    );
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
          <h1 className="text-3xl font-bold">Program Management</h1>
          <p className="text-muted-foreground">Create and manage your educational programs</p>
        </div>
        <Button onClick={openCreateModal}>
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Add New Program
        </Button>
      </div>

      {/* Programs List */}
      {programs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCapIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Programs Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven't created any programs yet. Get started by creating your first educational program.
            </p>
            <Button onClick={openCreateModal}>
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              Create First Program
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <Card key={program.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {getOfferingName(program.offering)}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm line-clamp-2">
                      {program.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(program)}
                      title="Edit program"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(program)}
                      title="Delete program"
                      className="text-destructive hover:text-destructive"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-md">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-3 w-3 text-purple-600" />
                      <span className="text-xs text-muted-foreground">Duration:</span>
                    </div>
                    <span className="font-semibold text-sm text-purple-600">
                      {formatDuration(program.estimatedDuration)}
                    </span>
                  </div>

                  {program.modules && program.modules.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <LayersIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Modules ({program.modules.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {program.modules.slice(0, 3).map((moduleId) => (
                          <Badge key={moduleId} variant="secondary" className="text-xs">
                            {getModuleName(moduleId)}
                          </Badge>
                        ))}
                        {program.modules.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{program.modules.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {program.googleClassroomLink && (
                    <div className="pt-2 border-t">
                      <a
                        href={program.googleClassroomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <ExternalLinkIcon className="h-4 w-4" />
                        Google Classroom
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Program Modal */}
      <Dialog open={modalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProgram ? 'Edit Program' : 'Create New Program'}
            </DialogTitle>
            <DialogDescription>
              {editingProgram ? 'Update the program details below.' : 'Fill in the details to create a new educational program.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Program Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter program name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offering">
                  Offering <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.offering} onValueChange={handleOfferingChange}>
                  <SelectTrigger id="offering">
                    <SelectValue placeholder="Select an offering" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingOfferings ? (
                      <SelectItem value="loading" disabled>Loading offerings...</SelectItem>
                    ) : offerings.length === 0 ? (
                      <SelectItem value="empty" disabled>No non-Marathon offerings available</SelectItem>
                    ) : (
                      offerings.map((offering) => (
                        <SelectItem key={offering.id} value={offering.id}>
                          {offering.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Note: Marathon offerings are not shown as programs cannot be associated with them
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe this program..."
                required
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedDuration">
                  Duration (hours) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="estimatedDuration"
                    name="estimatedDuration"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.estimatedDuration}
                    onChange={handleInputChange}
                    placeholder="8"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="image">
                  Image URL
                </Label>
                <Input
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleClassroomLink">
                  Google Classroom Link
                </Label>
                <Input
                  id="googleClassroomLink"
                  name="googleClassroomLink"
                  value={formData.googleClassroomLink}
                  onChange={handleInputChange}
                  placeholder="https://classroom.google.com/..."
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
                  ? (editingProgram ? 'Updating...' : 'Creating...') 
                  : (editingProgram ? 'Update Program' : 'Create Program')
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProgramManagement;