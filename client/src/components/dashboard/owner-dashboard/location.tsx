import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { LoaderIcon, PlusCircleIcon, TrashIcon, PencilIcon, SaveIcon, XIcon, MapPinIcon, PhoneIcon, MailIcon, UserIcon, BuildingIcon, DollarSignIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface Location {
  id: string;
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  email: string;
  phoneNumber: string;
  offerings: OfferingItem[];
  active?: boolean;
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

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Offering {
  id: string;
  name: string;
  description: string;
  plans?: string[];
  programs?: string[];
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
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  email: string;
  phoneNumber: string;
  selectedOfferings: string[];
  selectedPlans: { [key: string]: string[] }; // offeringId -> array of selected plan IDs
  selectedPrograms: { [key: string]: string[] }; // offeringId -> array of selected program IDs
  offeringPricing: { [key: string]: { [key: string]: { price: number; tax: number } } };
}

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }
];

const LocationManagement: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    email: '',
    phoneNumber: '',
    selectedOfferings: [],
    selectedPlans: {},
    selectedPrograms: {},
    offeringPricing: {},
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLocations();
    fetchOfferings();
    fetchPlans();
    fetchPrograms();
  }, []);

  const fetchLocations = async () => {
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

      const response = await fetch('/api/locations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error(`Failed to fetch locations: ${response.status}`);
      
      const data = await response.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast({
        title: "Error",
        description: "Failed to load locations. Please try again.",
        variant: "destructive",
      });
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfferings = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch('/api/offerings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setOfferings(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching offerings:", error);
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
      name: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: 'United States',
      email: '',
      phoneNumber: '',
      selectedOfferings: [],
      selectedPlans: {},
      selectedPrograms: {},
      offeringPricing: {},
    });
    setEditingLocation(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (location: Location) => {
    setEditingLocation(location);
    
    const offeringPricing: { [key: string]: { [key: string]: { price: number; tax: number } } } = {};
    const selectedPlans: { [key: string]: string[] } = {};
    const selectedPrograms: { [key: string]: string[] } = {};
    
    location.offerings.forEach(offering => {
      offeringPricing[offering.id] = {};
      
      if (offering.plans) {
        selectedPlans[offering.id] = offering.plans.map(p => p.id);
        offering.plans.forEach(plan => {
          offeringPricing[offering.id][plan.id] = { price: plan.price, tax: plan.tax };
        });
      }
      
      if (offering.programs) {
        selectedPrograms[offering.id] = offering.programs.map(p => p.id);
        offering.programs.forEach(program => {
          offeringPricing[offering.id][program.id] = { price: program.price, tax: program.tax };
        });
      }
    });

    setFormData({
      name: location.name,
      address1: location.address1,
      address2: location.address2 || '',
      city: location.city,
      state: location.state,
      zip: location.zip,
      country: location.country,
      email: location.email,
      phoneNumber: location.phoneNumber,
      selectedOfferings: location.offerings.map(o => o.id),
      selectedPlans,
      selectedPrograms,
      offeringPricing,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    const requiredFields = [
      { field: 'name', label: 'Location name' },
      { field: 'address1', label: 'Address' },
      { field: 'city', label: 'City' },
      { field: 'state', label: 'State' },
      { field: 'zip', label: 'ZIP code' },
      { field: 'email', label: 'Email' },
      { field: 'phoneNumber', label: 'Phone number' }
    ];

    for (const { field, label } of requiredFields) {
      if (!formData[field as keyof FormData] || String(formData[field as keyof FormData]).trim() === '') {
        toast({
          title: "Validation Error",
          description: `${label} is required.`,
          variant: "destructive",
        });
        return false;
      }
    }

   
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }

    
    if (!/^\d{5}(-\d{4})?$/.test(formData.zip.trim())) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid ZIP code.",
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

      
      const offeringsWithPricing = formData.selectedOfferings.map(offeringId => {
        const offering = offerings.find(o => o.id === offeringId);
        if (!offering) return null;

        const offeringItem: OfferingItem = {
          id: offering.id,
          name: offering.name,
        };

        
        if (offering.name === "Marathon") {
          const selectedPlanIds = formData.selectedPlans[offeringId] || [];
          if (selectedPlanIds.length > 0) {
            offeringItem.plans = selectedPlanIds.map(planId => {
              const plan = plans.find(p => p.id === planId);
              const pricing = formData.offeringPricing[offeringId]?.[planId] || { price: 0, tax: 0 };
              return {
                id: planId,
                name: plan?.name || planId,
                price: pricing.price,
                tax: pricing.tax,
              };
            });
          }
        }

        
        if (offering.name !== "Marathon") {
          const selectedProgramIds = formData.selectedPrograms[offeringId] || [];
          if (selectedProgramIds.length > 0) {
            offeringItem.programs = selectedProgramIds.map(programId => {
              const program = programs.find(p => p.id === programId);
              const pricing = formData.offeringPricing[offeringId]?.[programId] || { price: 0, tax: 0 };
              return {
                id: programId,
                name: program?.name || programId,
                price: pricing.price,
                tax: pricing.tax,
              };
            });
          }
        }

        return offeringItem;
      }).filter(Boolean) as OfferingItem[];

      const payload = {
        name: formData.name.trim(),
        address1: formData.address1.trim(),
        address2: formData.address2.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state,
        zip: formData.zip.trim(),
        country: formData.country,
        email: formData.email.trim().toLowerCase(),
        phoneNumber: formData.phoneNumber.trim(),
        offerings: offeringsWithPricing,
      };

      const url = editingLocation ? `/api/locations/${editingLocation.id}` : '/api/locations';
      const method = editingLocation ? "PUT" : "POST";

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
        throw new Error(errorData.message || `Failed to ${editingLocation ? 'update' : 'create'} location`);
      }

      toast({
        title: "Success",
        description: `Location ${editingLocation ? 'updated' : 'created'} successfully`,
      });

      closeModal();
      fetchLocations();
    } catch (error) {
      console.error("Location operation error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Operation failed",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (location: Location) => {
    if (!window.confirm(`Are you sure you want to delete location "${location.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`/api/locations/${location.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete location");
      }

      toast({
        title: "Success",
        description: "Location deleted successfully",
      });
      
      fetchLocations();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete location",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStateChange = (value: string) => {
    setFormData(prev => ({ ...prev, state: value }));
  };

  const handleOfferingToggle = (offeringId: string) => {
    setFormData(prev => {
      const isCurrentlySelected = prev.selectedOfferings.includes(offeringId);
      
      if (isCurrentlySelected) {
        // Remove offering and clear its plan/program selections and pricing
        const newSelectedPlans = { ...prev.selectedPlans };
        delete newSelectedPlans[offeringId];
        
        const newSelectedPrograms = { ...prev.selectedPrograms };
        delete newSelectedPrograms[offeringId];
        
        const newOfferingPricing = { ...prev.offeringPricing };
        delete newOfferingPricing[offeringId];
        
        return {
          ...prev,
          selectedOfferings: prev.selectedOfferings.filter(id => id !== offeringId),
          selectedPlans: newSelectedPlans,
          selectedPrograms: newSelectedPrograms,
          offeringPricing: newOfferingPricing
        };
      } else {
        // Add offering
        return {
          ...prev,
          selectedOfferings: [...prev.selectedOfferings, offeringId]
        };
      }
    });
  };

  const handlePlanToggle = (offeringId: string, planId: string) => {
    setFormData(prev => {
      const currentPlans = prev.selectedPlans[offeringId] || [];
      const isSelected = currentPlans.includes(planId);
      
      if (isSelected) {
        
        const newSelectedPlans = {
          ...prev.selectedPlans,
          [offeringId]: currentPlans.filter(id => id !== planId)
        };
        
        const newOfferingPricing = { ...prev.offeringPricing };
        if (newOfferingPricing[offeringId]) {
          delete newOfferingPricing[offeringId][planId];
        }
        
        return {
          ...prev,
          selectedPlans: newSelectedPlans,
          offeringPricing: newOfferingPricing
        };
      } else {
      
        const newSelectedPlans = {
          ...prev.selectedPlans,
          [offeringId]: [...currentPlans, planId]
        };
        
        return {
          ...prev,
          selectedPlans: newSelectedPlans
        };
      }
    });
  };

  const handleProgramToggle = (offeringId: string, programId: string) => {
    setFormData(prev => {
      const currentPrograms = prev.selectedPrograms[offeringId] || [];
      const isSelected = currentPrograms.includes(programId);
      
      if (isSelected) {
        
        const newSelectedPrograms = {
          ...prev.selectedPrograms,
          [offeringId]: currentPrograms.filter(id => id !== programId)
        };
        
        const newOfferingPricing = { ...prev.offeringPricing };
        if (newOfferingPricing[offeringId]) {
          delete newOfferingPricing[offeringId][programId];
        }
        
        return {
          ...prev,
          selectedPrograms: newSelectedPrograms,
          offeringPricing: newOfferingPricing
        };
      } else {
       
        const newSelectedPrograms = {
          ...prev.selectedPrograms,
          [offeringId]: [...currentPrograms, programId]
        };
        
        return {
          ...prev,
          selectedPrograms: newSelectedPrograms
        };
      }
    });
  };

  const handlePricingChange = (offeringId: string, itemId: string, field: 'price' | 'tax', value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      offeringPricing: {
        ...prev.offeringPricing,
        [offeringId]: {
          ...prev.offeringPricing[offeringId],
          [itemId]: {
            ...prev.offeringPricing[offeringId]?.[itemId],
            [field]: numValue
          }
        }
      }
    }));
  };

  const getUserName = (userId: string) => {
    // This function is no longer needed but keeping for compatibility
    // Remove this function in future updates
    return userId;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
          <h1 className="text-3xl font-bold">Location Management</h1>
          <p className="text-muted-foreground">Manage your business locations and their offerings</p>
        </div>
        <Button onClick={openCreateModal}>
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Add New Location
        </Button>
      </div>

      
      {locations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPinIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Locations Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven't created any locations yet. Get started by adding your first business location.
            </p>
            <Button onClick={openCreateModal}>
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              Create First Location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <Card key={location.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BuildingIcon className="h-5 w-5" />
                      {location.name}
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {location.address1}
                      {location.address2 && `, ${location.address2}`}
                      <br />
                      {location.city}, {location.state} {location.zip}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(location)}
                      title="Edit location"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(location)}
                      title="Delete location"
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
                    <MailIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{location.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{location.phoneNumber}</span>
                  </div>

                  {location.offerings && location.offerings.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Offerings ({location.offerings.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {location.offerings.slice(0, 3).map((offering) => (
                          <Badge key={offering.id} variant="outline" className="text-xs">
                            {offering.name}
                          </Badge>
                        ))}
                        {location.offerings.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{location.offerings.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      
      <Dialog open={modalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Edit Location' : 'Create New Location'}
            </DialogTitle>
            <DialogDescription>
              {editingLocation ? 'Update the location details below.' : 'Fill in the details to create a new business location.'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="offerings">Offerings & Pricing</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit}>
              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Location Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter location name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address1">
                      Address Line 1 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="address1"
                      name="address1"
                      value={formData.address1}
                      onChange={handleInputChange}
                      placeholder="Street address"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address2">Address Line 2</Label>
                    <Input
                      id="address2"
                      name="address2"
                      value={formData.address2}
                      onChange={handleInputChange}
                      placeholder="Apt, suite, etc. (optional)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">
                      State <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.state} onValueChange={handleStateChange}>
                      <SelectTrigger id="state">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zip">
                      ZIP Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="zip"
                      name="zip"
                      value={formData.zip}
                      onChange={handleInputChange}
                      placeholder="12345"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="location@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </TabsContent>

              <TabsContent value="offerings" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSignIcon className="h-4 w-4" />
                    <Label className="text-base font-medium">Select Offerings & Set Pricing</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose which offerings are available at this location and set location-specific pricing.
                  </p>

                  {offerings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No offerings available. Create offerings first.</p>
                  ) : (
                    <div className="space-y-4">
                      {offerings.map((offering) => (
                        <Card key={offering.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`offering-${offering.id}`}
                                checked={formData.selectedOfferings.includes(offering.id)}
                                onCheckedChange={() => handleOfferingToggle(offering.id)}
                              />
                              <Label htmlFor={`offering-${offering.id}`} className="text-sm font-medium">
                                {offering.name}
                              </Label>
                              <Badge variant={offering.name === "Marathon" ? "default" : "secondary"} className="text-xs">
                                {offering.name === "Marathon" ? "Plans" : "Programs"}
                              </Badge>
                            </div>

                            {formData.selectedOfferings.includes(offering.id) && (
                              <div className="ml-6 space-y-3 border-l-2 border-muted pl-4">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                  Set pricing for {offering.name === "Marathon" ? "plans" : "programs"}:
                                </h4>

                               
                                {offering.name === "Marathon" && offering.plans && (
                                  <div className="space-y-3">
                                    <div className="text-sm font-medium text-muted-foreground">
                                      Select plans available at this location:
                                    </div>
                                    {offering.plans.map((planId) => {
                                      const plan = plans.find(p => p.id === planId);
                                      const isSelected = formData.selectedPlans[offering.id]?.includes(planId) || false;
                                      const pricing = formData.offeringPricing[offering.id]?.[planId] || { price: 0, tax: 0 };
                                      
                                      return (
                                        <div key={planId} className="space-y-2">
                                          <div className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`plan-${offering.id}-${planId}`}
                                              checked={isSelected}
                                              onCheckedChange={() => handlePlanToggle(offering.id, planId)}
                                            />
                                            <Label htmlFor={`plan-${offering.id}-${planId}`} className="text-sm font-medium">
                                              {plan?.name || planId}
                                            </Label>
                                          </div>
                                          
                                          {isSelected && (
                                            <div className="ml-6 grid grid-cols-2 gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                              <div className="space-y-1">
                                                <Label className="text-xs">Price ($)</Label>
                                                <Input
                                                  type="number"
                                                  min="0"
                                                  step="0.01"
                                                  value={pricing.price}
                                                  onChange={(e) => handlePricingChange(offering.id, planId, 'price', e.target.value)}
                                                  placeholder="0.00"
                                                  className="h-8"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <Label className="text-xs">Tax (%)</Label>
                                                <Input
                                                  type="number"
                                                  min="0"
                                                  max="100"
                                                  step="0.01"
                                                  value={pricing.tax}
                                                  onChange={(e) => handlePricingChange(offering.id, planId, 'tax', e.target.value)}
                                                  placeholder="0.00"
                                                  className="h-8"
                                                />
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                    
                                    {offering.plans.length === 0 && (
                                      <p className="text-sm text-muted-foreground">No plans available for this offering.</p>
                                    )}
                                  </div>
                                )}

                                
                                {offering.name !== "Marathon" && offering.programs && (
                                  <div className="space-y-3">
                                    <div className="text-sm font-medium text-muted-foreground">
                                      Select programs available at this location:
                                    </div>
                                    {offering.programs.map((programId) => {
                                      const program = programs.find(p => p.id === programId);
                                      const isSelected = formData.selectedPrograms[offering.id]?.includes(programId) || false;
                                      const pricing = formData.offeringPricing[offering.id]?.[programId] || { price: 0, tax: 0 };
                                      
                                      return (
                                        <div key={programId} className="space-y-2">
                                          <div className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`program-${offering.id}-${programId}`}
                                              checked={isSelected}
                                              onCheckedChange={() => handleProgramToggle(offering.id, programId)}
                                            />
                                            <Label htmlFor={`program-${offering.id}-${programId}`} className="text-sm font-medium">
                                              {program?.name || programId}
                                            </Label>
                                          </div>
                                          
                                          {isSelected && (
                                            <div className="ml-6 grid grid-cols-2 gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                              <div className="space-y-1">
                                                <Label className="text-xs">Price ($)</Label>
                                                <Input
                                                  type="number"
                                                  min="0"
                                                  step="0.01"
                                                  value={pricing.price}
                                                  onChange={(e) => handlePricingChange(offering.id, programId, 'price', e.target.value)}
                                                  placeholder="0.00"
                                                  className="h-8"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <Label className="text-xs">Tax (%)</Label>
                                                <Input
                                                  type="number"
                                                  min="0"
                                                  max="100"
                                                  step="0.01"
                                                  value={pricing.tax}
                                                  onChange={(e) => handlePricingChange(offering.id, programId, 'tax', e.target.value)}
                                                  placeholder="0.00"
                                                  className="h-8"
                                                />
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                    
                                    {offering.programs.length === 0 && (
                                      <p className="text-sm text-muted-foreground">No programs available for this offering.</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

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
                    ? (editingLocation ? 'Updating...' : 'Creating...') 
                    : (editingLocation ? 'Update Location' : 'Create Location')
                  }
                </Button>
              </div>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocationManagement;