import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  LoaderIcon, 
  PlusCircleIcon, 
  TrashIcon, 
  PencilIcon, 
  SaveIcon, 
  XIcon, 
  TicketIcon,
  CalendarIcon,
  PercentIcon,
  UsersIcon,
  EyeIcon,
  EyeOffIcon,
  CopyIcon
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface DiscountCode {
  id: string;
  code: string;
  usage: 'single' | 'multiple';
  percent: number;
  expireDate: string;
  locationId: string;
  locationName?: string;
  description?: string;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  isExpired: boolean;
  isUsable: boolean;
  createdBy: string;
  createdAt: string;
}

interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface FormData {
  code: string;
  usage: 'single' | 'multiple';
  percent: number;
  expireDate: string;
  locationId: string;
  description: string;
  maxUses: number;
  isActive: boolean;
}

const DiscountCodeManagement: React.FC = () => {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [formData, setFormData] = useState<FormData>({
    code: '',
    usage: 'single',
    percent: 10,
    expireDate: '',
    locationId: '',
    description: '',
    maxUses: 1,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDiscountCodes();
    fetchLocations();
  }, []);

  // Set default expiration to 30 days from now
  useEffect(() => {
    const defaultExpireDate = new Date();
    defaultExpireDate.setDate(defaultExpireDate.getDate() + 30);
    setFormData(prev => ({
      ...prev,
      expireDate: defaultExpireDate.toISOString().slice(0, 16)
    }));
  }, []);

  const fetchDiscountCodes = async () => {
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

      const response = await fetch('/api/discount-codes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error(`Failed to fetch discount codes: ${response.status}`);
      
      const data = await response.json();
      setDiscountCodes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching discount codes:", error);
      toast({
        title: "Error",
        description: "Failed to load discount codes. Please try again.",
        variant: "destructive",
      });
      setDiscountCodes([]);
    } finally {
      setLoading(false);
    }
  };

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

  const resetForm = () => {
    const defaultExpireDate = new Date();
    defaultExpireDate.setDate(defaultExpireDate.getDate() + 30);
    
    setFormData({
      code: '',
      usage: 'single',
      percent: 10,
      expireDate: defaultExpireDate.toISOString().slice(0, 16),
      locationId: '',
      description: '',
      maxUses: 1,
      isActive: true,
    });
    setEditingCode(null);
  };

  const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  const openCreateModal = () => {
    resetForm();
    // Set first location as default if available
    if (locations.length > 0) {
      setFormData(prev => ({ ...prev, locationId: locations[0].id }));
    }
    setModalOpen(true);
  };

  const openEditModal = (discountCode: DiscountCode) => {
    setEditingCode(discountCode);
    setFormData({
      code: discountCode.code,
      usage: discountCode.usage,
      percent: discountCode.percent,
      expireDate: new Date(discountCode.expireDate).toISOString().slice(0, 16),
      locationId: discountCode.locationId,
      description: discountCode.description || '',
      maxUses: discountCode.maxUses || 1,
      isActive: discountCode.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    const requiredFields = [
      { field: 'code', label: 'Discount code' },
      { field: 'percent', label: 'Discount percentage' },
      { field: 'expireDate', label: 'Expiration date' },
      { field: 'locationId', label: 'Location' }
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

    // Validate code format
    if (!/^[A-Z0-9]{3,20}$/.test(formData.code.trim())) {
      toast({
        title: "Validation Error",
        description: "Discount code must be 3-20 characters and contain only letters and numbers.",
        variant: "destructive",
      });
      return false;
    }

    // Validate percentage
    if (formData.percent < 1 || formData.percent > 100) {
      toast({
        title: "Validation Error",
        description: "Discount percentage must be between 1 and 100.",
        variant: "destructive",
      });
      return false;
    }

    // Validate expiration date
    const expireDate = new Date(formData.expireDate);
    if (expireDate <= new Date()) {
      toast({
        title: "Validation Error",
        description: "Expiration date must be in the future.",
        variant: "destructive",
      });
      return false;
    }

    // Validate max uses for multiple usage codes
    if (formData.usage === 'multiple' && (!formData.maxUses || formData.maxUses < 1)) {
      toast({
        title: "Validation Error",
        description: "Max uses is required for multiple use discount codes and must be at least 1.",
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

      const payload = {
        code: formData.code.trim().toUpperCase(),
        usage: formData.usage,
        percent: Number(formData.percent),
        expireDate: new Date(formData.expireDate).toISOString(),
        locationId: formData.locationId,
        description: formData.description.trim() || undefined,
        maxUses: formData.usage === 'multiple' ? Number(formData.maxUses) : undefined,
        isActive: formData.isActive,
      };

      const url = editingCode ? `/api/discount-codes/${editingCode.id}` : '/api/discount-codes';
      const method = editingCode ? "PUT" : "POST";

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
        throw new Error(errorData.message || `Failed to ${editingCode ? 'update' : 'create'} discount code`);
      }

      toast({
        title: "Success",
        description: `Discount code ${editingCode ? 'updated' : 'created'} successfully`,
      });

      closeModal();
      fetchDiscountCodes();
    } catch (error) {
      console.error("Discount code operation error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Operation failed",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (discountCode: DiscountCode) => {
    if (!window.confirm(`Are you sure you want to delete discount code "${discountCode.code}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`/api/discount-codes/${discountCode.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete discount code");
      }

      toast({
        title: "Success",
        description: "Discount code deleted successfully",
      });
      
      fetchDiscountCodes();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete discount code",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Discount code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getStatusBadge = (discountCode: DiscountCode) => {
    if (!discountCode.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    if (discountCode.isExpired) {
      return <Badge variant="outline" className="text-red-600">Expired</Badge>;
    }
    if (!discountCode.isUsable) {
      return <Badge variant="outline" className="text-orange-600">Used Up</Badge>;
    }
    return <Badge variant="default" className="bg-green-600">Active</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLocationName = (locationId: string) => {
    const location = locations.find(l => l.id === locationId);
    return location ? `${location.name} (${location.city}, ${location.state})` : locationId;
  };

  const filteredDiscountCodes = discountCodes.filter(code => 
    showInactive ? true : code.isActive && !code.isExpired
  );

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
          <h1 className="text-3xl font-bold">Discount Code Management</h1>
          <p className="text-muted-foreground">Create and manage discount codes for your locations</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? <EyeOffIcon className="h-4 w-4 mr-2" /> : <EyeIcon className="h-4 w-4 mr-2" />}
            {showInactive ? 'Hide Inactive' : 'Show All'}
          </Button>
          <Button onClick={openCreateModal}>
            <PlusCircleIcon className="h-4 w-4 mr-2" />
            Create Discount Code
          </Button>
        </div>
      </div>

      {filteredDiscountCodes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TicketIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Discount Codes Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {showInactive 
                ? "You haven't created any discount codes yet."
                : "No active discount codes found. Try showing all codes or create a new one."
              }
            </p>
            <Button onClick={openCreateModal}>
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              Create First Discount Code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDiscountCodes.map((discountCode) => (
            <Card key={discountCode.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TicketIcon className="h-5 w-5" />
                      <span className="font-mono">{discountCode.code}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(discountCode.code)}
                        className="h-6 w-6"
                        title="Copy code"
                      >
                        <CopyIcon className="h-3 w-3" />
                      </Button>
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {getLocationName(discountCode.locationId)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(discountCode)}
                      title="Edit discount code"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(discountCode)}
                      title="Delete discount code"
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
                    <div className="flex items-center gap-2">
                      <PercentIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-lg font-semibold">{discountCode.percent}% OFF</span>
                    </div>
                    {getStatusBadge(discountCode)}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Expires: {formatDate(discountCode.expireDate)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <UsersIcon className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {discountCode.usage === 'single' 
                        ? `Single Use ${discountCode.currentUses > 0 ? '(Used)' : '(Available)'}`
                        : `${discountCode.currentUses}/${discountCode.maxUses || '∞'} uses`
                      }
                    </span>
                  </div>

                  {discountCode.description && (
                    <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      {discountCode.description}
                    </div>
                  )}
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
              {editingCode ? 'Edit Discount Code' : 'Create New Discount Code'}
            </DialogTitle>
            <DialogDescription>
              {editingCode ? 'Update the discount code details below.' : 'Fill in the details to create a new discount code.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Discount Code <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="Enter discount code"
                    className="font-mono uppercase"
                    maxLength={20}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateRandomCode}
                    title="Generate random code"
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  3-20 characters, letters and numbers only
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="percent">
                  Discount Percentage <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="percent"
                  name="percent"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.percent}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usage">
                  Usage Type <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.usage} onValueChange={(value) => handleSelectChange('usage', value)}>
                  <SelectTrigger id="usage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Use</SelectItem>
                    <SelectItem value="multiple">Multiple Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.usage === 'multiple' && (
                <div className="space-y-2">
                  <Label htmlFor="maxUses">
                    Max Uses <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="maxUses"
                    name="maxUses"
                    type="number"
                    min="1"
                    value={formData.maxUses}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expireDate">
                  Expiration Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="expireDate"
                  name="expireDate"
                  type="datetime-local"
                  value={formData.expireDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationId">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.locationId} onValueChange={(value) => handleSelectChange('locationId', value)}>
                  <SelectTrigger id="locationId">
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
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter a description for this discount code..."
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/200 characters
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
              />
              <Label htmlFor="isActive">Active (can be used immediately)</Label>
            </div>

            <Separator />

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
                  ? (editingCode ? 'Updating...' : 'Creating...') 
                  : (editingCode ? 'Update Discount Code' : 'Create Discount Code')
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscountCodeManagement;