"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { PlusIcon, LayersIcon } from "lucide-react"
import { ProgramList } from "./program-list"
import { ProgramModal } from "./program-modal"
import { OfferingModal } from "./offering-modal"
import { ConfirmDeleteModal } from "./confirm-delete-modal"
import { ProgramDetailsModal } from "./program-details-modal"
import { EnrollmentModal } from "./enrollment-modal"
import { ModuleModal } from "./module-modal"
import { TopicModal } from "./topic-modal"

function ProgramsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [programs, setPrograms] = useState([])
  const [offerings, setOfferings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [programModalOpen, setProgramModalOpen] = useState(false)
  const [offeringModalOpen, setOfferingModalOpen] = useState(false)
  const [currentProgram, setCurrentProgram] = useState(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [programToDelete, setProgramToDelete] = useState(null)
  const [viewDetailOpen, setViewDetailOpen] = useState(false)
  const [detailProgram, setDetailProgram] = useState(null)
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false)
  const [programToEnroll, setProgramToEnroll] = useState(null)
  const [userStudents, setUserStudents] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);
  const [moduleModalOpen, setModuleModalOpen] = useState(false)
  const [topicModalOpen, setTopicModalOpen] = useState(false)
  const [currentModule, setCurrentModule] = useState(null)
  const [currentTopic, setCurrentTopic] = useState(null)
  const [programModules, setProgramModules] = useState([])
  const [moduleTopics, setModuleTopics] = useState([])
  const [selectedProgramId, setSelectedProgramId] = useState(null)
  const [selectedModuleId, setSelectedModuleId] = useState(null)
  const [confirmDeleteModuleOpen, setConfirmDeleteModuleOpen] = useState(false)
  const [confirmDeleteTopicOpen, setConfirmDeleteTopicOpen] = useState(false)
  const [moduleToDelete, setModuleToDelete] = useState(null)
  const [topicToDelete, setTopicToDelete] = useState(null)

  const isAdmin = user?.role === "admin" || user?.role === "owner"

  // Fetch data functions
  const fetchPrograms = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await fetch("/api/programs", { headers })

      if (!response.ok) {
        throw new Error(`Failed to fetch programs: ${response.status}`)
      }

      const data = await response.json()
      setPrograms(data)
    } catch (err) {
      console.error("Error fetching programs:", err)
      setError(err.message)
      toast({
        title: "Error",
        description: "Failed to load programs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchOfferings = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await fetch("/api/offerings", { headers })

      if (!response.ok) {
        throw new Error(`Failed to fetch offerings: ${response.status}`)
      }

      const data = await response.json()
      setOfferings(data)
    } catch (err) {
      console.error("Error fetching offerings:", err)
      toast({
        title: "Error",
        description: "Failed to load offerings data",
        variant: "destructive",
      })
    }
  }

  const fetchUserStudents = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const response = await fetch("/api/students", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch students")
      }

      const data = await response.json()
      setUserStudents(data)
    } catch (err) {
      console.error("Error fetching students:", err)
      toast({
        title: "Error",
        description: "Failed to load your students",
        variant: "destructive",
      })
    }
  }

  const fetchPaymentMethods = useCallback(async () => {
    if (!user?.id) return; // Need user ID

    console.log("Parent: Fetching payment methods...");
    setIsLoadingMethods(true);
    const token = localStorage.getItem("auth_token");
    try {
      const response = await fetch(`/api/payments/${user.id}`, { // Use the correct API endpoint
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }
      const data = await response.json();
      // Ensure data is an array, map if necessary to match expected structure
      const formattedMethods = Array.isArray(data) ? data : [];
      setPaymentMethods(formattedMethods);
      console.log("Parent: Payment methods fetched successfully:", formattedMethods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      setPaymentMethods([]); // Reset on error
      // Show error toast if needed
    } finally {
      setIsLoadingMethods(false);
    }
  }, [user?.id]);

  const fetchModulesByProgram = async (programId) => {
    try {
      const token = localStorage.getItem("auth_token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await fetch(`/api/programs/${programId}/modules`, { headers })

      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.status}`)
      }

      const data = await response.json()
      setProgramModules(data)
      return data
    } catch (err) {
      console.error("Error fetching modules:", err)
      toast({
        title: "Error",
        description: "Failed to load modules",
        variant: "destructive",
      })
      return []
    }
  }

  const fetchTopicsByModule = async (moduleId) => {
    try {
      const token = localStorage.getItem("auth_token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await fetch(`/api/modules/${moduleId}/topics`, { headers })

      if (!response.ok) {
        throw new Error(`Failed to fetch topics: ${response.status}`)
      }

      const data = await response.json()
      setModuleTopics(data)
      return data
    } catch (err) {
      console.error("Error fetching topics:", err)
      toast({
        title: "Error",
        description: "Failed to load topics",
        variant: "destructive",
      })
      return []
    }
  }

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  // This function will be passed to EnrollmentModal
  const handleCardAdded = async () => {
    console.log("Parent: handleCardAdded triggered, refetching methods.");
    await fetchPaymentMethods(); // Refetch the list
  };
  // Handler functions
  const handleAddProgram = () => {
    setCurrentProgram(null)
    setProgramModalOpen(true)
  }

  const handleAddOffering = () => {
    setOfferingModalOpen(true)
  }

  const handleEditProgram = (program) => {
    setCurrentProgram(program)
    setProgramModalOpen(true)
  }

  const handleDeleteProgram = (program) => {
    setProgramToDelete(program)
    setConfirmDeleteOpen(true)
  }

  const handleViewDetails = async (program) => {
    setDetailProgram(program)
    setSelectedProgramId(program._id)
    await fetchModulesByProgram(program._id)
    setViewDetailOpen(true)
  }

  const handleEnrollClick = (program) => {
    setProgramToEnroll(program)
    setEnrollmentModalOpen(true)
  }

  const handleAddModule = (programId) => {
    setCurrentModule(null)
    setSelectedProgramId(programId)
    setModuleModalOpen(true)
  }

  const handleEditModule = (module) => {
    setCurrentModule(module)
    setModuleModalOpen(true)
  }

  const handleDeleteModule = (module) => {
    setModuleToDelete(module)
    setConfirmDeleteModuleOpen(true)
  }

  const handleAddTopic = (moduleId) => {
    setCurrentTopic(null)
    setSelectedModuleId(moduleId)
    setTopicModalOpen(true)
  }

  const handleEditTopic = (topic) => {
    setCurrentTopic(topic)
    setTopicModalOpen(true)
  }

  const handleDeleteTopic = (topic) => {
    setTopicToDelete(topic)
    setConfirmDeleteTopicOpen(true)
  }

  // CRUD operations
  const deleteProgram = async () => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch(`/api/programs/${programToDelete._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete program")
      }

      setPrograms((prev) => prev.filter((p) => p._id !== programToDelete._id))

      toast({
        title: "Success",
        description: "Program deleted successfully",
      })
    } catch (err) {
      console.error("Error deleting program:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete program",
        variant: "destructive",
      })
    } finally {
      setConfirmDeleteOpen(false)
      setProgramToDelete(null)
    }
  }

  const deleteModule = async () => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch(`/api/modules/${moduleToDelete._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete module")
      }

      setProgramModules((prev) => prev.filter((m) => m._id !== moduleToDelete._id))

      toast({
        title: "Success",
        description: "Module deleted successfully",
      })
    } catch (err) {
      console.error("Error deleting module:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete module",
        variant: "destructive",
      })
    } finally {
      setConfirmDeleteModuleOpen(false)
      setModuleToDelete(null)
    }
  }

  const deleteTopic = async () => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch(`/api/topics/${topicToDelete._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete topic")
      }

      setModuleTopics((prev) => prev.filter((t) => t._id !== topicToDelete._id))

      toast({
        title: "Success",
        description: "Topic deleted successfully",
      })
    } catch (err) {
      console.error("Error deleting topic:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete topic",
        variant: "destructive",
      })
    } finally {
      setConfirmDeleteTopicOpen(false)
      setTopicToDelete(null)
    }
  }

  useEffect(() => {
    fetchPrograms()
    fetchOfferings()
    if (user?.role === "parent") {
      fetchUserStudents()
      fetchPaymentMethods()
    }
  }, [user])

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Programs"
        description="Manage your educational programs"
        badge={isAdmin ? { text: user?.role?.toUpperCase(), variant: "outline" } : undefined}
      >
        {isAdmin && (
          <div className="flex gap-3">
            <Button onClick={handleAddOffering} className="flex items-center gap-2" variant="outline">
              <LayersIcon className="h-4 w-4" />
              Add Offering
            </Button>
            <Button onClick={handleAddProgram} className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Add Program
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="mt-6">
        <ProgramList
          programs={programs}
          loading={loading}
          error={error}
          isAdmin={isAdmin}
          onAddProgram={handleAddProgram}
          onEditProgram={handleEditProgram}
          onDeleteProgram={handleDeleteProgram}
          onViewDetails={handleViewDetails}
          onEnrollClick={handleEnrollClick}
          fetchPrograms={fetchPrograms}
        />
      </div>

      {/* Modals */}
      <ProgramModal
        open={programModalOpen}
        onOpenChange={setProgramModalOpen}
        currentProgram={currentProgram}
        offerings={offerings}
        onSuccess={(newOrUpdatedProgram) => {
          if (currentProgram) {
            setPrograms((prev) => prev.map((p) => (p._id === currentProgram._id ? newOrUpdatedProgram : p)))
          } else {
            setPrograms((prev) => [...prev, newOrUpdatedProgram])
          }
        }}
      />

      <OfferingModal
        open={offeringModalOpen}
        onOpenChange={setOfferingModalOpen}
        onSuccess={(newOffering) => {
          setOfferings((prev) => [...prev, newOffering])
          fetchOfferings()
        }}
      />

      <ConfirmDeleteModal
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete Program"
        description={`Are you sure you want to delete the program "${programToDelete?.name}"? This action cannot be undone.`}
        onConfirm={deleteProgram}
      />

      <ProgramDetailsModal
        open={viewDetailOpen}
        onOpenChange={setViewDetailOpen}
        program={detailProgram}
        modules={programModules}
        topics={moduleTopics}
        selectedModuleId={selectedModuleId}
        isAdmin={isAdmin}
        onAddModule={() => handleAddModule(detailProgram?._id)}
        onEditModule={handleEditModule}
        onDeleteModule={handleDeleteModule}
        onAddTopic={handleAddTopic}
        onEditTopic={handleEditTopic}
        onDeleteTopic={handleDeleteTopic}
        onSelectModule={(moduleId) => {
          if (selectedModuleId === moduleId) {
            setSelectedModuleId(null)
          } else {
            setSelectedModuleId(moduleId)
            fetchTopicsByModule(moduleId)
          }
        }}
        fetchTopicsByModule={fetchTopicsByModule}
      />

      <EnrollmentModal
        open={enrollmentModalOpen}
        onOpenChange={setEnrollmentModalOpen}
        program={programToEnroll}
        students={userStudents}
        paymentMethods={paymentMethods}
        onCardAddedSuccessfully={handleCardAdded}
        userId={user?.id}
      />

      <ModuleModal
        open={moduleModalOpen}
        onOpenChange={setModuleModalOpen}
        currentModule={currentModule}
        programId={selectedProgramId}
        onSuccess={() => {
          if (selectedProgramId) {
            fetchModulesByProgram(selectedProgramId)
          }
        }}
      />

      <TopicModal
        open={topicModalOpen}
        onOpenChange={setTopicModalOpen}
        currentTopic={currentTopic}
        moduleId={selectedModuleId}
        onSuccess={() => {
          if (selectedModuleId) {
            fetchTopicsByModule(selectedModuleId)
          }
        }}
      />

      <ConfirmDeleteModal
        open={confirmDeleteModuleOpen}
        onOpenChange={setConfirmDeleteModuleOpen}
        title="Delete Module"
        description={`Are you sure you want to delete the module "${moduleToDelete?.name}"? This will also remove any topics associated with this module. This action cannot be undone.`}
        onConfirm={deleteModule}
      />

      <ConfirmDeleteModal
        open={confirmDeleteTopicOpen}
        onOpenChange={setConfirmDeleteTopicOpen}
        title="Delete Topic"
        description={`Are you sure you want to delete the topic "${topicToDelete?.name}"? This action cannot be undone.`}
        onConfirm={deleteTopic}
      />
    </div>
  )
}

export default ProgramsPage
