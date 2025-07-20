import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { LoaderIcon, PlusCircleIcon, TrashIcon, PencilIcon, SaveIcon, XIcon, UserIcon, ShieldIcon, CrownIcon, MapPinIcon, GraduationCapIcon, BookOpenIcon, UsersIcon, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface InternalUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'owner' | 'location_manager' | 'admin' | 'teacher';
  active: boolean;
  locationId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
  active: boolean;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'owner' | 'location_manager' | 'admin' | 'teacher' | '';
  locationId: string;
  active: boolean;
}

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner', icon: CrownIcon, requiresLocation: false, description: 'Full system access' },
  { value: 'location_manager', label: 'Location Manager', icon: MapPinIcon, requiresLocation: true, description: 'Manages specific location' },
  { value: 'admin', label: 'Admin', icon: ShieldIcon, requiresLocation: true, description: 'Location administration' },
  { value: 'teacher', label: 'Teacher', icon: GraduationCapIcon, requiresLocation: true, description: 'Teaching at location' },
] as const;

const InternalUserManagement: React.FC = () => {
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<InternalUser | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
    locationId: '',
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchLocations();
  }, []);

  const fetchUsers = async () => {
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

      const response = await fetch('/api/internal-users', {
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
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Fetched users:", data);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      setLocationsLoading(true);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.log("No auth token found for locations");
        return;
      }

      console.log("Fetching locations from /api/locations");
      const response = await fetch('/api/internal-users/locations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched locations:", data);
        setLocations(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch locations:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setLocationsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: '',
      locationId: '',
      active: true,
    });
    setEditingUser(null);
    setShowPassword(false);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (user: InternalUser) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '', // Don't populate password for editing
      role: user.role,
      locationId: user.locationId || '',
      active: user.active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      toast({
        title: "Validation Error",
        description: "First name is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "Last name is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required.",
        variant: "destructive",
      });
      return false;
    }

    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.role) {
      toast({
        title: "Validation Error",
        description: "Please select a role.",
        variant: "destructive",
      });
      return false;
    }

    // Location validation based on role
    const selectedRole = ROLE_OPTIONS.find(r => r.value === formData.role);
    if (selectedRole?.requiresLocation && !formData.locationId) {
      toast({
        title: "Validation Error",
        description: `${selectedRole.label} role requires a location assignment.`,
        variant: "destructive",
      });
      return false;
    }

    // Password validation (only for create or if password is provided for edit)
    if (!editingUser || formData.password.trim()) {
      if (!formData.password.trim()) {
        toast({
          title: "Validation Error",
          description: "Password is required.",
          variant: "destructive",
        });
        return false;
      }

      if (formData.password.length < 8) {
        toast({
          title: "Validation Error",
          description: "Password must be at least 8 characters long.",
          variant: "destructive",
        });
        return false;
      }

      // Check for strong password
      if (!isPasswordStrong(formData.password)) {
        toast({
          title: "Validation Error",
          description: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const isPasswordStrong = (password: string): boolean => {
    return password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password);
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

      const url = editingUser 
        ? `/api/internal-users/${editingUser.id}` 
        : '/api/internal-users';
      
      const method = editingUser ? "PUT" : "POST";

      // Build payload
      const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        active: formData.active,
      };

      // Only include password if it's provided
      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      // Include locationId only for roles that require or allow it
      const selectedRole = ROLE_OPTIONS.find(r => r.value === formData.role);
      if (selectedRole?.requiresLocation || (formData.locationId && formData.role !== 'owner')) {
        payload.locationId = formData.locationId || null;
      }

      console.log("Submitting payload:", payload);

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
        throw new Error(errorData.message || `Failed to ${editingUser ? 'update' : 'create'} user`);
      }

      toast({
        title: "Success",
        description: `User ${editingUser ? 'updated' : 'created'} successfully`,
      });

      closeModal();
      fetchUsers();
    } catch (error) {
      console.error("User operation error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Operation failed",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: InternalUser) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.firstName} ${user.lastName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/internal-users/${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete user");
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      fetchUsers();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
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

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value as any,
      locationId: value === 'owner' ? '' : prev.locationId // Clear location for owners
    }));
  };

  const handleLocationChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      locationId: value
    }));
  };

  const handleActiveChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      active: checked
    }));
  };

  const getRoleIcon = (role: string) => {
    const roleOption = ROLE_OPTIONS.find(r => r.value === role);
    return roleOption ? roleOption.icon : UserIcon;
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'owner') return 'default';
    if (role === 'location_manager') return 'secondary';
    if (role === 'admin') return 'outline';
    return 'secondary';
  };

  const getLocationName = (locationId?: string) => {
    if (!locationId) return 'No location';
    const location = locations.find(l => l.id === locationId);
    return location ? `${location.name} (${location.city}, ${location.state})` : locationId;
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

  const selectedRoleOption = ROLE_OPTIONS.find(r => r.value === formData.role);

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
          <h1 className="text-3xl font-bold">Internal User Management</h1>
          <p className="text-muted-foreground">Manage internal staff accounts (Owner, Location Manager, Admin, Teacher)</p>
        </div>
        <Button onClick={openCreateModal}>
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Add New User
        </Button>
      </div>



      {/* Users List */}
      {users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Internal Users Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven't created any internal users yet. Get started by adding your first staff account.
            </p>
            <Button onClick={openCreateModal}>
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              Create First User
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => {
            const RoleIcon = getRoleIcon(user.role);
            return (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">
                          {user.firstName} {user.lastName}
                        </CardTitle>
                        <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {user.email}
                      </CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={user.active ? "default" : "secondary"} className="text-xs">
                          {user.active ? "Active" : "Inactive"}
                        </Badge>
                        {user.locationId && (
                          <Badge variant="outline" className="text-xs">
                            <MapPinIcon className="h-3 w-3 mr-1" />
                            Assigned
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(user)}
                        title="Edit user"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user)}
                        title="Delete user"
                        className="text-destructive hover:text-destructive"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user.locationId && (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Location:</span>
                        </div>
                        <p className="text-sm text-muted-foreground ml-6">
                          {getLocationName(user.locationId)}
                        </p>
                      </div>
                    )}
                    <div className="space-y-2 text-sm pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Updated:</span>
                        <span>{formatDate(user.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit User Modal */}
      <Dialog open={modalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit Internal User' : 'Create New Internal User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser 
                ? 'Update the user details below. Leave password empty to keep current password.' 
                : 'Fill in the details to create a new staff account.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

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
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {editingUser ? 'New Password (optional)' : 'Password'} 
                {!editingUser && <span className="text-red-500"> *</span>}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={editingUser ? "Leave empty to keep current password" : "Enter temporary password"}
                  required={!editingUser}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {!editingUser && (
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters with uppercase, lowercase, number, and special character.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => {
                    const Icon = role.icon;
                    return (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span>{role.label}</span>
                            <span className="text-xs text-muted-foreground">{role.description}</span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Location Assignment */}
            {selectedRoleOption && (selectedRoleOption.requiresLocation || (formData.role !== 'owner' && formData.role !== '')) && (
              <div className="space-y-2">
                <Label htmlFor="location">
                  Location Assignment {selectedRoleOption.requiresLocation && <span className="text-red-500">*</span>}
                </Label>
                <Select value={formData.locationId} onValueChange={handleLocationChange}>
                  <SelectTrigger id="location">
                    <SelectValue placeholder={locationsLoading ? "Loading locations..." : "Select a location"} />
                  </SelectTrigger>
                  <SelectContent>
                    {!selectedRoleOption.requiresLocation && (
                      <SelectItem value="">No location</SelectItem>
                    )}
                    {locations.length === 0 && !locationsLoading ? (
                      <div className="p-2 text-sm text-muted-foreground">No locations available</div>
                    ) : (
                      locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="h-4 w-4" />
                            {location.name} - {location.city}, {location.state}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedRoleOption.requiresLocation && (
                  <p className="text-xs text-muted-foreground">
                    {selectedRoleOption.label} role requires a location assignment.
                  </p>
                )}
                {locations.length === 0 && !locationsLoading && (
                  <p className="text-xs text-amber-600">
                    No locations found. Please create a location first.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={handleActiveChange}
              />
              <Label htmlFor="active">Active User</Label>
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
                  ? (editingUser ? 'Updating...' : 'Creating...') 
                  : (editingUser ? 'Update User' : 'Create User')
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InternalUserManagement;