import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookIcon,
  PlusIcon,
  MoreVerticalIcon,
  PencilIcon,
  TrashIcon,
  InfoIcon,
  Loader2Icon,
  LayersIcon
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

function ProgramsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [programs, setPrograms] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [offeringModalOpen, setOfferingModalOpen] = useState(false);
  const [currentProgram, setCurrentProgram] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);
  const [viewDetailOpen, setViewDetailOpen] = useState(false);
  const [detailProgram, setDetailProgram] = useState(null);

  const [offeringFormData, setOfferingFormData] = useState({
    name: "",
    description: "",
    estimatedDuration: 0
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    estimatedDuration: 0,
    offering: ""
  });

  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch('/api/programs', { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch programs: ${response.status}`);
      }

      const data = await response.json();
      setPrograms(data);
    } catch (err) {
      console.error("Error fetching programs:", err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load programs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOfferings = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch('/api/offerings', { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch offerings: ${response.status}`);
      }

      const data = await response.json();
      setOfferings(data);
    } catch (err) {
      console.error("Error fetching offerings:", err);
      toast({
        title: "Error",
        description: "Failed to load offerings data",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'estimatedDuration' ? parseFloat(value) : value
    }));
  };

  const handleOfferingInputChange = (e) => {
    const { name, value } = e.target;
    setOfferingFormData(prev => ({
      ...prev,
      [name]: name === 'estimatedDuration' ? parseFloat(value) : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOfferingSelectChange = (name, value) => {
    setOfferingFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const createProgram = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create program');
      }

      const newProgram = await response.json();
      setPrograms(prev => [...prev, newProgram]);

      toast({
        title: "Success",
        description: "Program created successfully",
      });

      setProgramModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error creating program:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to create program",
        variant: "destructive"
      });
    }
  };

  const createOffering = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/offerings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(offeringFormData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create offering');
      }

      const newOffering = await response.json();
      setOfferings(prev => [...prev, newOffering]);

      toast({
        title: "Success",
        description: "Offering created successfully",
      });

      setOfferingModalOpen(false);
      resetOfferingForm();

      fetchOfferings();
    } catch (err) {
      console.error("Error creating offering:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to create offering",
        variant: "destructive"
      });
    }
  };

  const updateProgram = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/programs/${currentProgram._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update program');
      }

      const updatedProgram = await response.json();
      setPrograms(prev => prev.map(p => p._id === currentProgram._id ? updatedProgram : p));

      toast({
        title: "Success",
        description: "Program updated successfully",
      });

      setProgramModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error updating program:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update program",
        variant: "destructive"
      });
    }
  };

  const deleteProgram = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/programs/${programToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete program');
      }

      setPrograms(prev => prev.filter(p => p._id !== programToDelete._id));

      toast({
        title: "Success",
        description: "Program deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting program:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete program",
        variant: "destructive"
      });
    } finally {
      setConfirmDeleteOpen(false);
      setProgramToDelete(null);
    }
  };

  const handleAddProgram = () => {
    setCurrentProgram(null);
    resetForm();
    setProgramModalOpen(true);
  };

  const handleAddOffering = () => {
    resetOfferingForm();
    setOfferingModalOpen(true);
  };

  const handleEditProgram = (program) => {
    setCurrentProgram(program);
    setFormData({
      name: program.name,
      description: program.description,
      price: program.price,
      estimatedDuration: program.estimatedDuration,
      offering: program.offering._id
    });
    setProgramModalOpen(true);
  };

  const handleDeleteProgram = (program) => {
    setProgramToDelete(program);
    setConfirmDeleteOpen(true);
  };

  const handleViewDetails = (program) => {
    setDetailProgram(program);
    setViewDetailOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (currentProgram) {
      updateProgram();
    } else {
      createProgram();
    }
  };

  const handleOfferingFormSubmit = (e) => {
    e.preventDefault();
    createOffering();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      estimatedDuration: 0,
      offering: ""
    });
  };

  const resetOfferingForm = () => {
    setOfferingFormData({
      name: "",
      type: "",
      description: "",
      estimatedDuration: 0,
      price: 0
    });
  };


  useEffect(() => {
    fetchPrograms();
    fetchOfferings();
  }, []);

  const renderPrograms = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center p-12">
          <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading programs...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-8 text-center">
          <p className="text-destructive mb-4">Failed to load programs</p>
          <Button onClick={fetchPrograms}>Try Again</Button>
        </div>
      );
    }

    if (programs.length === 0) {
      return (
        <div className="p-8 text-center">
          <BookIcon className="h-12 w-12 mx-auto text-primary mb-4 opacity-50" />
          <p className="text-slate-600 dark:text-slate-400 mb-4">No programs available</p>
          {isAdmin && (
            <Button
              onClick={handleAddProgram}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add Your First Program
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <Card key={program._id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{program.name}</CardTitle>
                  <CardDescription>
                    {program.offering?.name} - {program.offering?.type}
                  </CardDescription>
                </div>
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVerticalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditProgram(program)}>
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteProgram(program)}>
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4">
                {program.description}
              </p>
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Price:</span>
                  <span className="ml-1 font-medium">${program.price.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Duration:</span>
                  <span className="ml-1 font-medium">{program.estimatedDuration} hrs</span>
                </div>
              </div>
              {program.modules?.length > 0 && (
                <div className="mt-3">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">Modules:</span>
                  <span className="ml-1 font-medium text-sm">{program.modules.length}</span>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() => handleViewDetails(program)}
              >
                <InfoIcon className="h-4 w-4" />
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Programs"
        description="Manage your educational programs"
        badge={isAdmin ? { text: user?.role?.toUpperCase(), variant: "outline" } : undefined}
      >
        {isAdmin && (
          <div className="flex gap-3">
            <Button
              onClick={handleAddOffering}
              className="flex items-center gap-2"
              variant="outline"
            >
              <LayersIcon className="h-4 w-4" />
              Add Offering
            </Button>
            <Button
              onClick={handleAddProgram}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add Program
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="mt-6">
        {renderPrograms()}
      </div>

      <Dialog open={programModalOpen} onOpenChange={setProgramModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{currentProgram ? "Edit Program" : "Add New Program"}</DialogTitle>
            <DialogDescription>
              {currentProgram
                ? "Update the details of the existing program."
                : "Fill out the form below to create a new program."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="name">Program Name*</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter program name"
              />
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="description">Description*</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Enter program description"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="price">Price ($)*</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="grid w-full items-center gap-2">
                <Label htmlFor="estimatedDuration">Duration (hours)*</Label>
                <Input
                  id="estimatedDuration"
                  name="estimatedDuration"
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={handleInputChange}
                  required
                  min="0"
                />
              </div>
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="offering">Offering*</Label>
              <Select
                name="offering"
                value={formData.offering}
                onValueChange={(value) => handleSelectChange("offering", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an offering" />
                </SelectTrigger>
                <SelectContent>
                  {offerings.map((offering) => (
                    <SelectItem key={offering._id} value={offering._id}>
                      {offering.name} ({offering.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {offerings.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No offerings available. Create an offering first.
                </p>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProgramModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!formData.name || !formData.description || !formData.offering || offerings.length === 0}
              >
                {currentProgram ? "Update Program" : "Create Program"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={offeringModalOpen} onOpenChange={setOfferingModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Offering</DialogTitle>
            <DialogDescription>
              Fill out the form below to create a new offering.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleOfferingFormSubmit} className="space-y-4 mt-4">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="name">Offering Name*</Label>
              <Input
                id="name"
                name="name"
                value={offeringFormData.name}
                onChange={handleOfferingInputChange}
                required
                placeholder="Enter offering name"
              />
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="description">Description*</Label>
              <Textarea
                id="description"
                name="description"
                value={offeringFormData.description}
                onChange={handleOfferingInputChange}
                required
                placeholder="Enter offering description"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="estimatedDuration">Duration (hours)*</Label>
                <Input
                  id="estimatedDuration"
                  name="estimatedDuration"
                  type="number"
                  value={offeringFormData.estimatedDuration}
                  onChange={handleOfferingInputChange}
                  required
                  min="0"
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOfferingModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!offeringFormData.name || !offeringFormData.description}
              >
                Create Offering
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete Program"
        description={`Are you sure you want to delete the program "${programToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={deleteProgram}
      />

      <Dialog open={viewDetailOpen} onOpenChange={setViewDetailOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Program Details</DialogTitle>
          </DialogHeader>

          {detailProgram && (
            <div className="mt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{detailProgram.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {detailProgram.offering?.name} - <Badge variant="outline">{detailProgram.offering?.type}</Badge>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">${detailProgram.price.toFixed(2)}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{detailProgram.estimatedDuration} hours</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Description</h4>
                <p>{detailProgram.description}</p>
              </div>

              {detailProgram.modules && detailProgram.modules.length > 0 && (
                <>
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-6 mb-2">Modules</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {detailProgram.modules.map((module, index) => (
                      <div key={module._id} className="bg-slate-50 dark:bg-slate-800 rounded-md p-3">
                        <div className="flex justify-between items-start">
                          <h5 className="font-medium">{module.name}</h5>
                          <Badge variant="secondary" className="ml-2">{module.topics?.length || 0} Topics</Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{module.description}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="flex justify-end mt-6">
                <Button onClick={() => setViewDetailOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div >
  );
}

export default ProgramsPage;