"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useLocation } from "wouter"
import {
  CreditCard,
  Plus,
  Trash2,
  History,
  DollarSign,
  Calendar,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Eye,
  Wallet,
  Receipt,
} from "lucide-react"

interface PaymentMethod {
  id: string
  cardType: string
  last4: string
  expirationDate: string
  cardholderName: string
  isDefault: boolean
}

interface PaymentTransaction {
  amount: number
  date: string
  status: string
  processor: string
  transactionId: string
}

interface Program {
  _id: string
  name: string
  description: string
  price: number
}

interface Enrollment {
  _id: string
  programId: Program | string
  monthlyAmount?: number
  paymentHistory?: PaymentTransaction[]
}

function PaymentMethodCard({ method, onRemove }: { method: PaymentMethod; onRemove: (id: string) => void }) {
  const getCardBrandColor = (cardType: string) => {
    switch (cardType.toLowerCase()) {
      case "visa":
        return "from-blue-600 to-blue-800"
      case "mastercard":
        return "from-red-600 to-red-800"
      case "amex":
      case "american express":
        return "from-green-600 to-green-800"
      default:
        return "from-gray-600 to-gray-800"
    }
  }

  const getCardBrandLogo = (cardType: string) => {
    switch (cardType.toLowerCase()) {
      case "visa":
        return "VISA"
      case "mastercard":
        return "MC"
      case "amex":
      case "american express":
        return "AMEX"
      default:
        return cardType.toUpperCase()
    }
  }

  return (
    <div className="space-y-4">
      {/* Credit Card Visual */}
      <div
        className={`relative rounded-xl overflow-hidden h-48 bg-gradient-to-br ${getCardBrandColor(method.cardType)} text-white shadow-lg`}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative p-6 flex flex-col h-full justify-between">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
              {method.isDefault && (
                <Badge className="bg-white/20 text-white border-white/30">
                  <Shield className="h-3 w-3 mr-1" />
                  Default
                </Badge>
              )}
            </div>
            <div className="text-right">
              <span className="text-white font-bold text-lg tracking-wider">{getCardBrandLogo(method.cardType)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-1">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="w-2 h-2 bg-white/60 rounded-full"></div>
                  ))}
                </div>
              ))}
              <span className="text-xl font-mono tracking-wider ml-2">{method.last4}</span>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-white/70 uppercase tracking-wide">Cardholder</p>
              <p className="text-lg font-semibold truncate max-w-[200px]">{method.cardholderName || "Not Provided"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/70 uppercase tracking-wide">Expires</p>
              <p className="text-lg font-semibold">{method.expirationDate || "12/24"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card Details */}
      <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
        <div>
          <p className="font-medium capitalize">
            {method.cardType} •••• {method.last4}
          </p>
          <p className="text-sm text-muted-foreground">Expires {method.expirationDate}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(method.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function EnrollmentPaymentCard({
  enrollment,
  onMakePayment,
}: { enrollment: Enrollment; onMakePayment: (enrollment: Enrollment, amount: number) => void }) {
  const today = new Date()
  const outstanding = today.getDate() > 20 && enrollment.monthlyAmount ? enrollment.monthlyAmount : 0.0
  const paymentHistory = (enrollment.paymentHistory || []).slice(-2).reverse()
  const programName = typeof enrollment.programId === "object" ? enrollment.programId.name : "Program"

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{programName}</CardTitle>
            <CardDescription>Payment status and recent activity</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">${outstanding.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Outstanding</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {outstanding > 0 && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-medium">Payment Due</span>
              </div>
              <span className="text-lg font-bold text-primary">${outstanding.toFixed(2)}</span>
            </div>
            <Button onClick={() => onMakePayment(enrollment, outstanding)} className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              Make Payment
            </Button>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">Recent Transactions</h4>
          </div>

          {paymentHistory.length === 0 ? (
            <div className="p-6 bg-muted/30 rounded-lg text-center">
              <Receipt className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No recent transactions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {paymentHistory.map((tx, idx) => (
                <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {tx.status.toLowerCase() === "completed" ? "Tuition Payment" : "Pending Payment"}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(tx.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold">${tx.amount.toFixed(2)}</p>
                      {getStatusBadge(tx.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PaymentInfoPage() {
  const { user } = useAuth()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const { toast } = useToast()
  const [confirmRemove, setConfirmRemove] = useState<{ open: boolean; id: string | null }>({ open: false, id: null })
  const [showDeleteDefaultModal, setShowDeleteDefaultModal] = useState(false)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [makePaymentModal, setMakePaymentModal] = useState<{ open: boolean; enrollment: Enrollment | null }>({
    open: false,
    enrollment: null,
  })
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [isPaying, setIsPaying] = useState(false)
  const [, navigate] = useLocation()

  useEffect(() => {
    if (user?.id) {
      fetchPaymentMethods()
      fetchEnrollments()
    } else {
      setIsLoading(false)
    }
  }, [user?.id])

  const fetchPaymentMethods = async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch(`/api/payments/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch payment methods")
      }

      const data = await response.json()
      setPaymentMethods(data)
    } catch (error) {
      console.error("Error fetching payment methods:", error)
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEnrollments = async () => {
    if (!user?.id) return
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return
      const response = await fetch("/api/enrollments", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) setEnrollments(data.enrollments)
    } catch (e) {
      toast({ title: "Error", description: "Failed to load enrollments", variant: "destructive" })
    }
  }

  const handleRemovePaymentMethod = async () => {
    if (!confirmRemove.id) return
    if (paymentMethods.length === 1) {
      setConfirmRemove({ open: false, id: null })
      setShowDeleteDefaultModal(true)
      return
    }

    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch(`/api/payments/${confirmRemove.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to remove payment method")
      }

      setPaymentMethods((prevMethods) => prevMethods.filter((method) => method.id !== confirmRemove.id))

      toast({
        title: "Success",
        description: "Payment method removed successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove payment method",
        variant: "destructive",
      })
    } finally {
      setConfirmRemove({ open: false, id: null })
    }
  }

  const handleMakePayment = (enrollment: Enrollment, amount: number) => {
    if (amount <= 0) {
      toast({ title: "No Outstanding", description: "No outstanding amount to pay.", variant: "default" })
      return
    }
    setSelectedPaymentMethod(paymentMethods.find((m) => m.isDefault)?.id || null)
    setMakePaymentModal({ open: true, enrollment })
  }

  const confirmMakePayment = async () => {
    if (!makePaymentModal.enrollment || !selectedPaymentMethod || !user?.id) return
    setIsPaying(true)
    try {
      const method = paymentMethods.find((m) => m.id === selectedPaymentMethod)
      if (!method) throw new Error("No payment method selected")
      const token = localStorage.getItem("auth_token")
      const response = await fetch(`/api/enrollments/${makePaymentModal.enrollment._id}/process-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          enrollmentId: makePaymentModal.enrollment._id,
          paymentMethodId: method.id,
          paymentProcessor: "stripe",
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Payment failed")
      toast({ title: "Payment Success", description: data.message || "Payment processed." })
      setMakePaymentModal({ open: false, enrollment: null })
      fetchEnrollments()
    } catch (e: any) {
      toast({
        title: "Payment Error",
        description: e.message || "Failed to process payment",
        variant: "destructive",
      })
    } finally {
      setIsPaying(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Loading Payment Information</h3>
            <p className="text-muted-foreground">Please wait while we fetch your payment details...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Payment Information</h1>
          <p className="text-muted-foreground">Manage your payment methods and billing preferences</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Payment Method
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Methods Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Your saved payment methods for tuition and fees</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {paymentMethods.length > 0 ? (
                <div className="space-y-6">
                  {paymentMethods.map((method) => (
                    <PaymentMethodCard
                      key={method.id}
                      method={method}
                      onRemove={(id) => setConfirmRemove({ open: true, id })}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-6 bg-muted/30 rounded-full mb-4">
                    <CreditCard className="h-12 w-12 text-muted-foreground opacity-40" />
                  </div>
                  <h3 className="text-lg font-semibold">No Payment Methods</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    You don't have any payment methods saved yet. Add one to get started with payments.
                  </p>
                  <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Payment Method
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Overview Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Payment Overview</CardTitle>
                    <CardDescription>Outstanding balances and recent transactions</CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/transaction-history")}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-6 bg-muted/30 rounded-full mb-4">
                    <Receipt className="h-12 w-12 text-muted-foreground opacity-40" />
                  </div>
                  <h3 className="text-lg font-semibold">No Enrollments Found</h3>
                  <p className="text-muted-foreground">
                    You don't have any active enrollments. Payment information will appear here once you enroll in
                    programs.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrollments.map((enrollment) => (
                    <EnrollmentPaymentCard
                      key={enrollment._id}
                      enrollment={enrollment}
                      onMakePayment={handleMakePayment}
                    />
                  ))}
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => navigate("/transaction-history")}
                >
                  <History className="h-4 w-4" />
                  View Complete Transaction History
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <Dialog open={confirmRemove.open} onOpenChange={(open) => setConfirmRemove({ ...confirmRemove, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Remove Payment Method
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this payment method? This action cannot be undone and may affect your
              automatic payments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove({ open: false, id: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemovePaymentMethod}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDefaultModal} onOpenChange={setShowDeleteDefaultModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Cannot Delete Default Payment Method
            </DialogTitle>
            <DialogDescription>
              You cannot delete your default payment method. Please add another payment method and set it as default
              before removing this one.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowDeleteDefaultModal(false)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Make Payment Dialog */}
      <Dialog open={makePaymentModal.open} onOpenChange={(open) => setMakePaymentModal({ ...makePaymentModal, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Confirm Payment
            </DialogTitle>
            <DialogDescription>
              You are about to make a payment for{" "}
              <span className="font-semibold">
                {makePaymentModal.enrollment?.programId && typeof makePaymentModal.enrollment.programId === "object"
                  ? makePaymentModal.enrollment.programId.name
                  : "Program"}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Select Payment Method:</h4>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedPaymentMethod === method.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                  >
                    <input
                      type="radio"
                      checked={selectedPaymentMethod === method.id}
                      onChange={() => setSelectedPaymentMethod(method.id)}
                      className="text-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {method.cardType} •••• {method.last4}
                        </span>
                        {method.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">Expires {method.expirationDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMakePaymentModal({ open: false, enrollment: null })}>
              Cancel
            </Button>
            <Button onClick={confirmMakePayment} disabled={isPaying || !selectedPaymentMethod}>
              {isPaying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PaymentInfoPage
