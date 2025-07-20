"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { ProgramList } from "./program-list"
import { ProgramModal } from "./program-modal"
import { ConfirmDeleteModal } from "./confirm-delete-modal"
import { ProgramDetailsModal } from "./program-details-modal"
import { EnrollmentModal } from "./enrollment-modal"
import { ModuleModal } from "./module-modal"
import { TopicModal } from "./topic-modal"

interface Program {
  _id: string;
  name: string;
  offering?: {
    name: string;
  };
}

interface Module {
  _id: string;
  name: string;
}

interface Topic {
  _id: string;
  name: string;
}

interface Offering {
  _id: string;
  name: string;
}

function ProgramsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [programs, setPrograms] = useState<Program[]>([])
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [programModalOpen, setProgramModalOpen] = useState(false)
  const [currentProgram, setCurrentProgram] = useState<Program | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null)
  const [viewDetailOpen, setViewDetailOpen] = useState(false)
  const [detailProgram, setDetailProgram] = useState<Program | null>(null)
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false)
  const [programToEnroll, setProgramToEnroll] = useState<Program | null>(null)
  const [userStudents, setUserStudents] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingMethods, setIsLoadingMethods] = useState(false)
  const [moduleModalOpen, setModuleModalOpen] = useState(false)
  const [topicModalOpen, setTopicModalOpen] = useState(false)
  const [currentModule, setCurrentModule] = useState<Module | null>(null)
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null)
  const [programModules, setProgramModules] = useState<Module[]>([])
  const [moduleTopics, setModuleTopics] = useState<Topic[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [confirmDeleteModuleOpen, setConfirmDeleteModuleOpen] = useState(false)
  const [confirmDeleteTopicOpen, setConfirmDeleteTopicOpen] = useState(false)
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null)
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null)

  const isAdmin = user?.role === "admin" || user?.role === "owner"

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await fetch("/api/programs", { headers })

      if (!response.ok) {
        throw new Error(`Failed to fetch programs: ${response.status}`)
      }

      const data = await response.json()
      setPrograms(data.filter((program: Program) => program.offering?.name !== "Marathon"))
    } catch (err) {
      console.error("Error fetching programs:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
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
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await fetch("/api/offerings", { headers })

      if (!response.ok) {
        throw new Error(`Failed to fetch offerings: ${response.status}`)
      }

      const data = await response.json()
      setOfferings(data.filter((offering: Offering) => offering.name !== "Marathon"))
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
    if (!user?.id) return;

    console.log("Parent: Fetching payment methods...");
    setIsLoadingMethods(true);
    const token = localStorage.getItem("auth_token");
    try {
      const response = await fetch(`/api/payments/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }
      const data = await response.json();
      const formattedMethods = Array.isArray(data) ? data : [];
      setPaymentMethods(formattedMethods);
      console.log("Parent: Payment methods fetched successfully:", formattedMethods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      setPaymentMethods([]);
    } finally {
      setIsLoadingMethods(false);
    }
  }, [user?.id]);

  const fetchModulesByProgram = async (programId: string) => {
    try {
      const token = localStorage.getItem("auth_token")
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

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

  const fetchTopicsByModule = async (moduleId: string) => {
    try {
      const token = localStorage.getItem("auth_token")
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

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

  const handleCardAdded = async () => {
    console.log("Parent: handleCardAdded triggered, refetching methods.");
    await fetchPaymentMethods();
  };

  const handleAddProgram = () => {
    setCurrentProgram(null)
    setProgramModalOpen(true)
  }

  const handleEditProgram = (program: Program) => {
    setCurrentProgram(program)
    setProgramModalOpen(true)
  }

  const handleDeleteProgram = (program: Program) => {
    setProgramToDelete(program)
    setConfirmDeleteOpen(true)
  }

  const handleViewDetails = async (program: Program) => {
    setDetailProgram(program)
    setSelectedProgramId(program._id)
    await fetchModulesByProgram(program._id)
    setViewDetailOpen(true)
  }

  const handleEnrollClick = (program: Program) => {
    setProgramToEnroll(program)
    setEnrollmentModalOpen(true)
  }

  const handleAddModule = (programId: string) => {
    setCurrentModule(null)
    setSelectedProgramId(programId)
    setModuleModalOpen(true)
  }

  const handleEditModule = (module: Module) => {
    setCurrentModule(module)
    setModuleModalOpen(true)
  }

  const handleDeleteModule = (module: Module) => {
    setModuleToDelete(module)
    setConfirmDeleteModuleOpen(true)
  }

  const handleAddTopic = (moduleId: string) => {
    setCurrentTopic(null)
    setSelectedModuleId(moduleId)
    setTopicModalOpen(true)
  }

  const handleEditTopic = (topic: Topic) => {
    setCurrentTopic(topic)
    setTopicModalOpen(true)
  }

  const handleDeleteTopic = (topic: Topic) => {
    setTopicToDelete(topic)
    setConfirmDeleteTopicOpen(true)
  }

  const deleteProgram = async () => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch(`/api/programs/${programToDelete?._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete program")
      }

      setPrograms((prev) => prev.filter((p) => p._id !== programToDelete?._id))

      toast({
        title: "Success",
        description: "Program deleted successfully",
      })
    } catch (err) {
      console.error("Error deleting program:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete program",
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

      const response = await fetch(`/api/modules/${moduleToDelete?._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete module")
      }

      setProgramModules((prev) => prev.filter((m) => m._id !== moduleToDelete?._id))

      toast({
        title: "Success",
        description: "Module deleted successfully",
      })
    } catch (err) {
      console.error("Error deleting module:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete module",
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

      const response = await fetch(`/api/topics/${topicToDelete?._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete topic")
      }

      setModuleTopics((prev) => prev.filter((t) => t._id !== topicToDelete?._id))

      toast({
        title: "Success",
        description: "Topic deleted successfully",
      })
    } catch (err) {
      console.error("Error deleting topic:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete topic",
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
          <Button onClick={handleAddProgram} className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Add Program
          </Button>
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

      <ProgramModal
        open={programModalOpen}
        onOpenChange={setProgramModalOpen}
        currentProgram={currentProgram}
        offerings={offerings}
        onSuccess={(newOrUpdatedProgram: Program) => {
          if (currentProgram) {
            setPrograms((prev) => prev.map((p) => (p._id === currentProgram._id ? newOrUpdatedProgram : p)))
          } else {
            setPrograms((prev) => [...prev, newOrUpdatedProgram])
          }
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
        onAddModule={() => handleAddModule(detailProgram?._id || "")}
        onEditModule={handleEditModule}
        onDeleteModule={handleDeleteModule}
        onAddTopic={handleAddTopic}
        onEditTopic={handleEditTopic}
        onDeleteTopic={handleDeleteTopic}
        onSelectModule={(moduleId: string) => {
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
        programId={selectedProgramId || ""}
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
        moduleId={selectedModuleId || ""}
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
