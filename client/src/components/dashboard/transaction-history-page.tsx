"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CreditCard,
  Download,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Receipt,
  TrendingUp,
  FileText,
  Loader2,
} from "lucide-react"

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
  image?: string
  offering: {
    _id: string
    name: string
    description: string
  }
}

interface Enrollment {
  _id: string
  programId: Program | string
  offeringType: "Marathon" | "Sprint"
  createdAt: string
  paymentHistory?: PaymentTransaction[]
  lastAmountPaid: number
  lastPaymentDate?: string
  lastPaymentStatus: string
}

function TransactionCard({ transaction, programName }: { transaction: PaymentTransaction; programName: string }) {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
      case "success":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "failed":
      case "declined":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
      case "success":
        return "border-l-green-500"
      case "pending":
        return "border-l-amber-500"
      case "failed":
      case "declined":
        return "border-l-red-500"
      default:
        return "border-l-gray-500"
    }
  }

  return (
    <Card className={`transition-all duration-200 hover:shadow-md border-l-4 ${getStatusColor(transaction.status)}`}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {transaction.status.toLowerCase() === "completed" ? "Tuition Payment" : "Payment Transaction"}
                </h3>
                <p className="text-muted-foreground">{programName}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{new Date(transaction.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Processor:</span>
                <span className="font-medium">{transaction.processor}</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">Transaction ID: {transaction.transactionId}</div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">${transaction.amount.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Amount</div>
            </div>
            {getStatusBadge(transaction.status)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TransactionSummary({ enrollments }: { enrollments: Enrollment[] }) {
  const allTransactions = enrollments.flatMap((enrollment) => enrollment.paymentHistory || [])
  const totalAmount = allTransactions.reduce((sum, tx) => sum + tx.amount, 0)
  const completedTransactions = allTransactions.filter((tx) => tx.status.toLowerCase() === "completed")
  const pendingTransactions = allTransactions.filter((tx) => tx.status.toLowerCase() === "pending")

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{completedTransactions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pendingTransactions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-chart-2/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-chart-2" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold">{allTransactions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TransactionHistoryPage() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date-desc")
  const { toast } = useToast()

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const token = localStorage.getItem("auth_token")
        if (!token) {
          toast({
            title: "Authentication Error",
            description: "Please log in to view your transaction history",
            variant: "destructive",
          })
          return
        }

        const response = await fetch("/api/enrollments", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        if (data.success) {
          setEnrollments(data.enrollments)
        } else {
          throw new Error(data.message || "Failed to fetch enrollments")
        }
      } catch (e) {
        console.error("Error fetching enrollments:", e)
        toast({
          title: "Error",
          description: "Failed to load transaction history. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEnrollments()
  }, [user?.id, toast])

  // Filter and sort transactions
  const allTransactions = enrollments.flatMap((enrollment) => {
    const programName = typeof enrollment.programId === "object" ? enrollment.programId.name : "Program"
    return (enrollment.paymentHistory || []).map((tx) => ({
      ...tx,
      programName,
      enrollmentId: enrollment._id,
    }))
  })

  const filteredTransactions = allTransactions
    .filter((tx) => {
      const matchesSearch =
        tx.programName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || tx.status.toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "amount-desc":
          return b.amount - a.amount
        case "amount-asc":
          return a.amount - b.amount
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Loading Transaction History</h3>
            <p className="text-muted-foreground">Please wait while we fetch your payment records...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
          <p className="text-muted-foreground">View your complete payment history and transaction details</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2" disabled>
          <Download className="h-4 w-4" />
          Export History
        </Button>
      </div>

      {enrollments.length > 0 && <TransactionSummary enrollments={enrollments} />}

      {/* Filters and Search */}
      {/* <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Transactions</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by program or transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort transactions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                  <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                  <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>
                {filteredTransactions.length > 0
                  ? `Showing ${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? "s" : ""}`
                  : "No transactions found"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {enrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-6 bg-muted/30 rounded-full mb-4">
                <CreditCard className="h-12 w-12 text-muted-foreground opacity-40" />
              </div>
              <h3 className="text-lg font-semibold">No Enrollments Found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You don't have any enrollments yet. Once you enroll in programs, your transaction history will appear
                here.
              </p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-6 bg-muted/30 rounded-full mb-4">
                <Search className="h-12 w-12 text-muted-foreground opacity-40" />
              </div>
              <h3 className="text-lg font-semibold">No Transactions Found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                No transactions match your current search criteria. Try adjusting your filters or search terms.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction, index) => (
                <TransactionCard
                  key={`${transaction.transactionId}-${index}`}
                  transaction={transaction}
                  programName={transaction.programName}
                />
              ))}
            </div>
          )}

          {enrollments.length > 0 && allTransactions.length === 0 && (
            <div className="space-y-6">
              {enrollments.map((enrollment) => {
                const programName = typeof enrollment.programId === "object" ? enrollment.programId.name : "Program"
                return (
                  <div key={enrollment._id}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{programName}</h3>
                        <p className="text-muted-foreground">
                          Enrolled on {new Date(enrollment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Card className="bg-muted/30">
                      <CardContent className="p-6 text-center">
                        <div className="p-4 bg-background rounded-lg inline-block mb-3">
                          <Receipt className="h-8 w-8 text-muted-foreground mx-auto" />
                        </div>
                        <h4 className="font-medium mb-1">No Transactions Yet</h4>
                        <p className="text-sm text-muted-foreground">
                          Payment transactions for this enrollment will appear here once processed.
                        </p>
                      </CardContent>
                    </Card>
                    {enrollment !== enrollments[enrollments.length - 1] && <Separator className="my-6" />}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
