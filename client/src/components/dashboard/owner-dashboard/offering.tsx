import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { LoaderIcon, PlusCircleIcon, TrashIcon, PencilIcon, SaveIcon, XIcon, Package2Icon, MapPinIcon, CreditCardIcon, GraduationCapIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Offering {
  id: string;
  name: string;
  description: string;
  description2?: string;
  plans?: string[];
  programs?: string[];
}

interface Plan {
  id: string;
  name: string;
  defaultPrice: number;
}

interface Program {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  description: string;
  description2: string;
  selectedPlans: string[];
  selectedPrograms: string[];
}

const OfferingManagement: React.FC = () => {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<Offering | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    description2: '',
    selectedPlans: [],
    selectedPrograms: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOfferings();
    fetchPlans();
    fetchPrograms();
  }, []);

  const fetchOfferings = async () => {
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

      const response = await fetch('/api/offerings', {
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
        throw new Error(`Failed to fetch offerings: ${response.status}`);
      }
      
      const data = await response.json();
      setOfferings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching offerings:", error);
      toast({
        title: "Error",
        description: "Failed to load offerings. Please try again.",
        variant: "destructive",
      });
      setOfferings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch('/api/plans', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlans(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      setLoadingPrograms(true);
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch('/api/programs', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPrograms(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      description2: '',
      selectedPlans: [],
      selectedPrograms: [],
    });
    setEditingOffering(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (offering: Offering) => {
    setEditingOffering(offering);
    setFormData({
      name: offering.name,
      description: offering.description,
      description2: offering.description2 || '',
      selectedPlans: offering.plans || [],
      selectedPrograms: offering.programs || [],
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
        description: "Offering name is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Offering description is required.",
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

      const url = editingOffering 
        ? `/api/offerings/${editingOffering.id}` 
        : '/api/offerings';
      
      const method = editingOffering ? "PUT" : "POST";

      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        description2: formData.description2.trim() || undefined,
      };

      // Based on business rules: Marathon uses plans, others use programs
      if (formData.name.trim() === "Marathon") {
        payload.plans = formData.selectedPlans;
      } else {
        payload.programs = formData.selectedPrograms;
      }

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
        throw new Error(errorData.message || `Failed to ${editingOffering ? 'update' : 'create'} offering`);
      }

      toast({
        title: "Success",
        description: `Offering ${editingOffering ? 'updated' : 'created'} successfully`,
      });

      closeModal();
      fetchOfferings();
    } catch (error) {
      console.error("Offering operation error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Operation failed",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (offering: Offering) => {
    if (!window.confirm(`Are you sure you want to delete the offering "${offering.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/offerings/${offering.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete offering");
      }

      toast({
        title: "Success",
        description: "Offering deleted successfully",
      });
      
      fetchOfferings();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete offering",
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

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      // Reset selections when changing name
      selectedPlans: [],
      selectedPrograms: [],
    }));
  };

  const handlePlanToggle = (planId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPlans: prev.selectedPlans.includes(planId)
        ? prev.selectedPlans.filter(id => id !== planId)
        : [...prev.selectedPlans, planId]
    }));
  };

  const handleProgramToggle = (programId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPrograms: prev.selectedPrograms.includes(programId)
        ? prev.selectedPrograms.filter(id => id !== programId)
        : [...prev.selectedPrograms, programId]
    }));
  };

  const getPlanName = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.name : planId;
  };

  const getProgramName = (programId: string) => {
    const program = programs.find(p => p.id === programId);
    return program ? program.name : programId;
  };

  const isMarathonOffering = (offering: Offering) => offering.name === "Marathon";

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
          <h1 className="text-3xl font-bold">Offering Management</h1>
          <p className="text-muted-foreground">Create and manage your offerings</p>
        </div>
        <Button onClick={openCreateModal}>
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Add New Offering
        </Button>
      </div>

      {/* Offerings List */}
      {offerings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package2Icon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Offerings Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven't created any offerings yet. Get started by creating your first offering.
            </p>
            <Button onClick={openCreateModal}>
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              Create First Offering
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offerings.map((offering) => (
            <Card key={offering.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{offering.name}</CardTitle>
                      {isMarathonOffering(offering) && (
                        <Badge variant="secondary" className="text-xs">
                          <CreditCardIcon className="h-3 w-3 mr-1" />
                          Plans
                        </Badge>
                      )}
                      {!isMarathonOffering(offering) && (
                        <Badge variant="default" className="text-xs">
                          <GraduationCapIcon className="h-3 w-3 mr-1" />
                          Programs
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm line-clamp-2">
                      {offering.description}
                    </CardDescription>
                    {offering.description2 && (
                      <CardDescription className="text-xs mt-1 line-clamp-1">
                        {offering.description2}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(offering)}
                      title="Edit offering"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(offering)}
                      title="Delete offering"
                      className="text-destructive hover:text-destructive"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isMarathonOffering(offering) && offering.plans && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Associated Plans:</span>
                      </div>
                      {offering.plans.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {offering.plans.map((planId) => (
                            <Badge key={planId} variant="outline" className="text-xs">
                              {getPlanName(planId)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No plans assigned</p>
                      )}
                    </div>
                  )}

                  {!isMarathonOffering(offering) && offering.programs && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <GraduationCapIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Associated Programs:</span>
                      </div>
                      {offering.programs.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {offering.programs.map((programId) => (
                            <Badge key={programId} variant="outline" className="text-xs">
                              {getProgramName(programId)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No programs assigned</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Offering Modal */}
      <Dialog open={modalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOffering ? 'Edit Offering' : 'Create New Offering'}
            </DialogTitle>
            <DialogDescription>
              {editingOffering ? 'Update the offering details below.' : 'Fill in the details to create a new offering.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Offering Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter offering name"
                required
              />
              <p className="text-xs text-muted-foreground">
                Note: "Marathon" offerings will use plans, all others will use programs
              </p>
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
                placeholder="Describe this offering..."
                required
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description2">
                Additional Description
              </Label>
              <Textarea
                id="description2"
                name="description2"
                value={formData.description2}
                onChange={handleInputChange}
                placeholder="Additional details (optional)..."
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Plans Selection (only for Marathon) */}
            {formData.name === "Marathon" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCardIcon className="h-4 w-4" />
                  <Label className="text-base font-medium">Select Plans</Label>
                </div>
                {loadingPlans ? (
                  <div className="flex items-center justify-center py-4">
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm">Loading plans...</span>
                  </div>
                ) : plans.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No plans available. Create plans first.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {plans.map((plan) => (
                      <div key={plan.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`plan-${plan.id}`}
                          checked={formData.selectedPlans.includes(plan.id)}
                          onCheckedChange={() => handlePlanToggle(plan.id)}
                        />
                        <Label htmlFor={`plan-${plan.id}`} className="text-sm">
                          {plan.name} - ${plan.defaultPrice}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Programs Selection (for non-Marathon) */}
            {formData.name !== "Marathon" && formData.name.trim() !== "" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <GraduationCapIcon className="h-4 w-4" />
                  <Label className="text-base font-medium">Select Programs</Label>
                </div>
                {loadingPrograms ? (
                  <div className="flex items-center justify-center py-4">
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm">Loading programs...</span>
                  </div>
                ) : programs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No programs available. Create programs first.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {programs.map((program) => (
                      <div key={program.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`program-${program.id}`}
                          checked={formData.selectedPrograms.includes(program.id)}
                          onCheckedChange={() => handleProgramToggle(program.id)}
                        />
                        <Label htmlFor={`program-${program.id}`} className="text-sm">
                          {program.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                  ? (editingOffering ? 'Updating...' : 'Creating...') 
                  : (editingOffering ? 'Update Offering' : 'Create Offering')
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfferingManagement;