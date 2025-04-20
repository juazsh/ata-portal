import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
  const [programToEnroll, setProgramToEnroll] = useState(null);
  const [userStudents, setUserStudents] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState(null);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [programModules, setProgramModules] = useState([]);
  const [moduleTopics, setModuleTopics] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [confirmDeleteModuleOpen, setConfirmDeleteModuleOpen] = useState(false);
  const [confirmDeleteTopicOpen, setConfirmDeleteTopicOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState(null);
  const [topicToDelete, setTopicToDelete] = useState(null);

  const [moduleFormData, setModuleFormData] = useState({
    name: "",
    description: "",
    estimatedDuration: 0,
    program: ""
  });

  const [topicFormData, setTopicFormData] = useState({
    name: "",
    description: "",
    estimatedDuration: 0,
    module: ""
  });
  const [enrollmentData, setEnrollmentData] = useState({
    studentId: "",
    paymentMethod: "credit-card",
    paymentPlan: "one-time",
    installments: 3
  });
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

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
  const fetchUserStudents = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setUserStudents(data);
    } catch (err) {
      console.error("Error fetching students:", err);
      toast({
        title: "Error",
        description: "Failed to load your students",
        variant: "destructive"
      });
    }
  };
  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`/api/payments/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const data = await response.json();
      setPaymentMethods(data);
    } catch (err) {
      console.error("Error fetching payment methods:", err);
      toast({
        title: "Error",
        description: "Failed to load your payment methods",
        variant: "destructive"
      });
    }
  };
  const fetchModulesByProgram = async (programId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(`/api/programs/${programId}/modules`, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.status}`);
      }

      const data = await response.json();
      setProgramModules(data);
      return data;
    } catch (err) {
      console.error("Error fetching modules:", err);
      toast({
        title: "Error",
        description: "Failed to load modules",
        variant: "destructive"
      });
      return [];
    }
  };

  const fetchTopicsByModule = async (moduleId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(`/api/modules/${moduleId}/topics`, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch topics: ${response.status}`);
      }

      const data = await response.json();
      setModuleTopics(data);
      return data;
    } catch (err) {
      console.error("Error fetching topics:", err);
      toast({
        title: "Error",
        description: "Failed to load topics",
        variant: "destructive"
      });
      return [];
    }
  };

  const handleModuleInputChange = (e) => {
    const { name, value } = e.target;
    setModuleFormData(prev => ({
      ...prev,
      [name]: name === 'estimatedDuration' ? parseFloat(value) : value
    }));
  };

  const handleModuleSelectChange = (name, value) => {
    setModuleFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetModuleForm = () => {
    setModuleFormData({
      name: "",
      description: "",
      estimatedDuration: 0,
      program: selectedProgramId || ""
    });
  };

  const handleAddModule = (programId) => {
    setCurrentModule(null);
    setSelectedProgramId(programId);
    resetModuleForm();
    setModuleFormData(prev => ({ ...prev, program: programId }));
    setModuleModalOpen(true);
  };

  const handleEditModule = (module) => {
    setCurrentModule(module);
    setModuleFormData({
      name: module.name,
      description: module.description,
      estimatedDuration: module.estimatedDuration,
      program: module.program
    });
    setModuleModalOpen(true);
  };

  const handleDeleteModule = (module) => {
    setModuleToDelete(module);
    setConfirmDeleteModuleOpen(true);
  };

  const createModule = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(moduleFormData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create module');
      }

      const newModule = await response.json();
      setProgramModules(prev => [...prev, newModule]);

      toast({
        title: "Success",
        description: "Module created successfully",
      });

      setModuleModalOpen(false);
      resetModuleForm();
      if (selectedProgramId) {
        fetchModulesByProgram(selectedProgramId);
      }
    } catch (err) {
      console.error("Error creating module:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to create module",
        variant: "destructive"
      });
    }
  };

  const updateModule = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/modules/${currentModule._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(moduleFormData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update module');
      }

      const updatedModule = await response.json();
      setProgramModules(prev => prev.map(m => m._id === currentModule._id ? updatedModule : m));

      toast({
        title: "Success",
        description: "Module updated successfully",
      });

      setModuleModalOpen(false);
      resetModuleForm();
      if (selectedProgramId) {
        fetchModulesByProgram(selectedProgramId);
      }
    } catch (err) {
      console.error("Error updating module:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update module",
        variant: "destructive"
      });
    }
  };

  const deleteModule = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/modules/${moduleToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete module');
      }

      setProgramModules(prev => prev.filter(m => m._id !== moduleToDelete._id));

      toast({
        title: "Success",
        description: "Module deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting module:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete module",
        variant: "destructive"
      });
    } finally {
      setConfirmDeleteModuleOpen(false);
      setModuleToDelete(null);
    }
  };

  const handleModuleFormSubmit = (e) => {
    e.preventDefault();
    if (currentModule) {
      updateModule();
    } else {
      createModule();
    }
  };
  const handleTopicInputChange = (e) => {
    const { name, value } = e.target;
    setTopicFormData(prev => ({
      ...prev,
      [name]: name === 'estimatedDuration' ? parseFloat(value) : value
    }));
  };

  const handleTopicSelectChange = (name, value) => {
    setTopicFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetTopicForm = () => {
    setTopicFormData({
      name: "",
      description: "",
      estimatedDuration: 0,
      module: selectedModuleId || ""
    });
  };

  const handleAddTopic = (moduleId) => {
    setCurrentTopic(null);
    setSelectedModuleId(moduleId);
    resetTopicForm();
    setTopicFormData(prev => ({ ...prev, module: moduleId }));
    setTopicModalOpen(true);
  };

  const handleEditTopic = (topic) => {
    setCurrentTopic(topic);
    setTopicFormData({
      name: topic.name,
      description: topic.description,
      estimatedDuration: topic.estimatedDuration,
      module: topic.module
    });
    setTopicModalOpen(true);
  };

  const handleDeleteTopic = (topic) => {
    setTopicToDelete(topic);
    setConfirmDeleteTopicOpen(true);
  };

  const createTopic = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(topicFormData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create topic');
      }

      const newTopic = await response.json();
      setModuleTopics(prev => [...prev, newTopic]);

      toast({
        title: "Success",
        description: "Topic created successfully",
      });

      setTopicModalOpen(false);
      resetTopicForm();
      if (selectedModuleId) {
        fetchTopicsByModule(selectedModuleId);
      }
    } catch (err) {
      console.error("Error creating topic:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to create topic",
        variant: "destructive"
      });
    }
  };

  const updateTopic = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/topics/${currentTopic._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(topicFormData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update topic');
      }

      const updatedTopic = await response.json();
      setModuleTopics(prev => prev.map(t => t._id === currentTopic._id ? updatedTopic : t));

      toast({
        title: "Success",
        description: "Topic updated successfully",
      });

      setTopicModalOpen(false);
      resetTopicForm();
      if (selectedModuleId) {
        fetchTopicsByModule(selectedModuleId);
      }
    } catch (err) {
      console.error("Error updating topic:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update topic",
        variant: "destructive"
      });
    }
  };

  const deleteTopic = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/topics/${topicToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete topic');
      }

      setModuleTopics(prev => prev.filter(t => t._id !== topicToDelete._id));

      toast({
        title: "Success",
        description: "Topic deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting topic:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete topic",
        variant: "destructive"
      });
    } finally {
      setConfirmDeleteTopicOpen(false);
      setTopicToDelete(null);
    }
  };

  const handleTopicFormSubmit = (e) => {
    e.preventDefault();
    if (currentTopic) {
      updateTopic();
    } else {
      createTopic();
    }
  };
  const handleEnrollmentInputChange = (name, value) => {
    setEnrollmentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleViewDetails = async (program) => {
    setDetailProgram(program);
    setSelectedProgramId(program._id);
    const modules = await fetchModulesByProgram(program._id);
    setViewDetailOpen(true);
  };

  const handleEnrollClick = (program) => {
    setProgramToEnroll(program);
    setEnrollmentData({
      studentId: userStudents.length > 0 ? userStudents[0]._id : "",
      paymentMethod: "credit-card",
      paymentPlan: "one-time",
      installments: 3
    });
    setEnrollmentModalOpen(true);
  };

  const submitEnrollment = async () => {
    if (!enrollmentData.studentId) {
      toast({
        title: "Error",
        description: "Please select a student",
        variant: "destructive"
      });
      return;
    }

    try {
      setEnrollmentLoading(true);
      const token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const requestData = {
        programId: programToEnroll._id,
        studentId: enrollmentData.studentId,
        paymentMethod: enrollmentData.paymentMethod,
        paymentPlan: enrollmentData.paymentPlan,
        parentId: user.id,
        installments: enrollmentData.paymentPlan === 'monthly' ? enrollmentData.installments : 1
      };

      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create enrollment');
      }

      toast({
        title: "Success",
        description: "Student enrolled successfully!",
      });

      setEnrollmentModalOpen(false);
    } catch (err) {
      console.error("Error creating enrollment:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to enroll student",
        variant: "destructive"
      });
    } finally {
      setEnrollmentLoading(false);
    }
  };
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
    if (user?.role === 'parent') {
      fetchUserStudents();
      fetchPaymentMethods();
    }
  }, [user]);

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
              {user?.role === "parent" && (
                <Button
                  variant="default"
                  className="w-full flex items-center gap-2"
                  onClick={() => handleEnrollClick(program)}
                >
                  <PlusIcon className="h-4 w-4" />
                  Enroll Student
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  const renderEnrollmentModal = () => (
    <Dialog open={enrollmentModalOpen} onOpenChange={setEnrollmentModalOpen}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Enroll in {programToEnroll?.name}</DialogTitle>
          <DialogDescription>
            Select a student and payment details to complete enrollment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="studentId">Select Student*</Label>
            {userStudents.length > 0 ? (
              <Select
                value={enrollmentData.studentId}
                onValueChange={(value) => handleEnrollmentInputChange("studentId", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {userStudents.map((student) => (
                    <SelectItem key={student._id} value={student._id}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div>
                <p className="text-sm text-amber-600">No students found. Please add a student first.</p>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => {
                    setEnrollmentModalOpen(false);
                  }}
                >
                  Add a student
                </Button>
              </div>
            )}
          </div>

          <div>
            <Label className="mb-2 block">Payment Plan*</Label>
            <RadioGroup
              value={enrollmentData.paymentPlan}
              onValueChange={(value) => handleEnrollmentInputChange("paymentPlan", value)}
              className="flex flex-col space-y-1 mb-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="one-time" id="one-time" />
                <Label htmlFor="one-time" className="font-normal">One-time Payment</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="font-normal">Monthly Installments</Label>
              </div>
            </RadioGroup>

            {enrollmentData.paymentPlan === "monthly" && (
              <div className="mt-3">
                <Label htmlFor="installments">Number of Installments*</Label>
                <Select
                  value={enrollmentData.installments.toString()}
                  onValueChange={(value) => handleEnrollmentInputChange("installments", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select number of installments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label className="mb-2 block">Payment Method*</Label>
            <RadioGroup
              value={enrollmentData.paymentMethod}
              onValueChange={(value) => handleEnrollmentInputChange("paymentMethod", value)}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credit-card" id="credit-card" />
                <Label htmlFor="credit-card" className="font-normal">Credit Card</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal" className="font-normal">PayPal</Label>
              </div>
            </RadioGroup>

            {enrollmentData.paymentMethod === "paypal" && (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 bg-[#0070ba] text-white hover:bg-[#005ea6]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.5 7.5h-15a1.5 1.5 0 00-1.5 1.5v6a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5V9a1.5 1.5 0 00-1.5-1.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6.5 10.5h1M10.5 10.5h1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Continue with PayPal
                </Button>
                <p className="text-xs text-center mt-2 text-slate-500">You'll be redirected to PayPal to complete your payment</p>
              </div>
            )}
          </div>

          {programToEnroll && (
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-md mt-4">
              <h4 className="font-medium mb-2">Enrollment Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Program Fee:</span>
                  <span>${programToEnroll.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Administrative Fee (5%):</span>
                  <span>${(programToEnroll.price * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (7%):</span>
                  <span>${(programToEnroll.price * 1.05 * 0.07).toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>${(programToEnroll.price * 1.05 * 1.07).toFixed(2)}</span>
                </div>
                {enrollmentData.paymentPlan === "monthly" && (
                  <div className="flex justify-between text-primary font-medium mt-2">
                    <span>Monthly Payment:</span>
                    <span>
                      ${(programToEnroll.price * 1.05 * 1.07 / enrollmentData.installments).toFixed(2)}
                      x {enrollmentData.installments}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setEnrollmentModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={submitEnrollment}
            disabled={!enrollmentData.studentId || enrollmentLoading || userStudents.length === 0}
          >
            {enrollmentLoading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Complete Enrollment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );


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

              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">Modules</h4>
                  {isAdmin && (
                    <Button
                      onClick={() => handleAddModule(detailProgram._id)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <PlusIcon className="h-3 w-3" />
                      Add Module
                    </Button>
                  )}
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {programModules.length > 0 ? (
                    programModules.map((module) => (
                      <div key={module._id} className="bg-slate-50 dark:bg-slate-800 rounded-md p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium">{module.name}</h5>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{module.description}</p>
                            <p className="text-xs text-slate-500 mt-1">Duration: {module.estimatedDuration} hours</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="secondary">{module.topics?.length || 0} Topics</Badge>
                            {isAdmin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVerticalIcon className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditModule(module)}>
                                    <PencilIcon className="h-4 w-4 mr-2" />
                                    Edit Module
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteModule(module)}>
                                    <TrashIcon className="h-4 w-4 mr-2" />
                                    Delete Module
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedModuleId(module._id);
                                    fetchTopicsByModule(module._id);
                                    handleAddTopic(module._id);
                                  }}>
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add Topic
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedModuleId(module._id);
                                    fetchTopicsByModule(module._id);
                                  }}>
                                    <InfoIcon className="h-4 w-4 mr-2" />
                                    View Topics
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                        <div className="mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs py-0 h-6 mb-1"
                            onClick={() => {
                              if (selectedModuleId === module._id) {
                                setSelectedModuleId(null);
                              } else {
                                setSelectedModuleId(module._id);
                                fetchTopicsByModule(module._id);
                              }
                            }}
                          >
                            {selectedModuleId === module._id ? "Hide Topics" : "Show Topics"}
                          </Button>

                          {selectedModuleId === module._id && (
                            <div className="pl-4 space-y-2 mt-2 border-l-2 border-slate-200 dark:border-slate-700">
                              {moduleTopics.length > 0 ? (
                                moduleTopics.map((topic) => (
                                  <div key={topic._id} className="bg-slate-100 dark:bg-slate-700 rounded-md p-2">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h6 className="font-medium text-sm">{topic.name}</h6>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{topic.description}</p>
                                        <p className="text-xs text-slate-500 mt-1">Duration: {topic.estimatedDuration} hours</p>
                                      </div>
                                      {isAdmin && (
                                        <div className="flex gap-1">
                                          <Button variant="ghost" size="sm" onClick={() => handleEditTopic(topic)}>
                                            <PencilIcon className="h-3 w-3" />
                                          </Button>
                                          <Button variant="ghost" size="sm" onClick={() => handleDeleteTopic(topic)}>
                                            <TrashIcon className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-slate-500 p-2">
                                  No topics available for this module
                                </div>
                              )}
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs mt-1"
                                  onClick={() => handleAddTopic(module._id)}
                                >
                                  <PlusIcon className="h-3 w-3 mr-1" />
                                  Add Topic
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4 text-slate-500">
                      <p>No modules available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* {selectedModuleId && moduleTopics.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                    Topics for {programModules.find(m => m._id === selectedModuleId)?.name}
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {moduleTopics.map((topic) => (
                      <div key={topic._id} className="bg-slate-100 dark:bg-slate-700 rounded-md p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-sm">{topic.name}</h5>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{topic.description}</p>
                            <p className="text-xs text-slate-500 mt-1">Duration: {topic.estimatedDuration} hours</p>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditTopic(topic)}>
                                <PencilIcon className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteTopic(topic)}>
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )} */}

              <div className="flex justify-end mt-6">
                <Button onClick={() => setViewDetailOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={moduleModalOpen} onOpenChange={setModuleModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{currentModule ? "Edit Module" : "Add New Module"}</DialogTitle>
            <DialogDescription>
              {currentModule
                ? "Update the details of the existing module."
                : "Fill out the form below to create a new module."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleModuleFormSubmit} className="space-y-4 mt-4">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="module-name">Module Name*</Label>
              <Input
                id="module-name"
                name="name"
                value={moduleFormData.name}
                onChange={handleModuleInputChange}
                required
                placeholder="Enter module name"
              />
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="module-description">Description*</Label>
              <Textarea
                id="module-description"
                name="description"
                value={moduleFormData.description}
                onChange={handleModuleInputChange}
                required
                placeholder="Enter module description"
                rows={4}
              />
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="module-estimatedDuration">Duration (hours)*</Label>
              <Input
                id="module-estimatedDuration"
                name="estimatedDuration"
                type="number"
                value={moduleFormData.estimatedDuration}
                onChange={handleModuleInputChange}
                required
                min="0"
              />
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModuleModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!moduleFormData.name || !moduleFormData.description}
              >
                {currentModule ? "Update Module" : "Create Module"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={topicModalOpen} onOpenChange={setTopicModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{currentTopic ? "Edit Topic" : "Add New Topic"}</DialogTitle>
            <DialogDescription>
              {currentTopic
                ? "Update the details of the existing topic."
                : "Fill out the form below to create a new topic."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTopicFormSubmit} className="space-y-4 mt-4">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="topic-name">Topic Name*</Label>
              <Input
                id="topic-name"
                name="name"
                value={topicFormData.name}
                onChange={handleTopicInputChange}
                required
                placeholder="Enter topic name"
              />
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="topic-description">Description*</Label>
              <Textarea
                id="topic-description"
                name="description"
                value={topicFormData.description}
                onChange={handleTopicInputChange}
                required
                placeholder="Enter topic description"
                rows={4}
              />
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="topic-estimatedDuration">Duration (hours)*</Label>
              <Input
                id="topic-estimatedDuration"
                name="estimatedDuration"
                type="number"
                value={topicFormData.estimatedDuration}
                onChange={handleTopicInputChange}
                required
                min="0"
              />
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTopicModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!topicFormData.name || !topicFormData.description}
              >
                {currentTopic ? "Update Topic" : "Create Topic"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteModuleOpen}
        onOpenChange={setConfirmDeleteModuleOpen}
        title="Delete Module"
        description={`Are you sure you want to delete the module "${moduleToDelete?.name}"? This will also remove any topics associated with this module. This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={deleteModule}
      />

      <ConfirmDialog
        open={confirmDeleteTopicOpen}
        onOpenChange={setConfirmDeleteTopicOpen}
        title="Delete Topic"
        description={`Are you sure you want to delete the topic "${topicToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={deleteTopic}
      />
      {renderEnrollmentModal()}
    </div >
  );
}

export default ProgramsPage;