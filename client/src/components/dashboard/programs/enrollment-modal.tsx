"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2Icon, CreditCard, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PaymentMethodModal } from "./../payment-method-modal"

interface EnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: any;
  students: any[];
  paymentMethods: any[];
  userId: string;
  onCardAddedSuccessfully: () => Promise<void> | void;
}

export function EnrollmentModal({
  open,
  onOpenChange,
  program,
  students,
  paymentMethods,
  userId,
  onCardAddedSuccessfully,
}: EnrollmentModalProps) {
  const { toast } = useToast()
  const offeringType = program?.offering.name || "Sprint"
  const [enrollmentData, setEnrollmentData] = useState({
    studentId: "",
    paymentMethod: "credit-card",
    existingCardId: "",
    offeringType: offeringType || "Sprint",
  })
  const [enrollmentLoading, setEnrollmentLoading] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [addingNewCard, setAddingNewCard] = useState(false)
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false)
  const [newlyCreatedEnrollmentId, setNewlyCreatedEnrollmentId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setEnrollmentData({
        studentId: "",
        paymentMethod: "credit-card",
        existingCardId: "",
        offeringType: program?.offering.name || "Sprint",
      });
      setEnrollmentLoading(false);
      setPaymentProcessing(false);
      setAddingNewCard(false);
      setNewlyCreatedEnrollmentId(null);
    } else {
      setEnrollmentData(prev => ({
        ...prev,
        offeringType: program?.offering.name || "Sprint",
      }));
    }
  }, [open, program]);

  useEffect(() => {
    if (enrollmentData.paymentMethod === 'credit-card' && paymentMethods.length > 0) {
      const currentSelectionValid = paymentMethods.some(pm => pm.id === enrollmentData.existingCardId);
    }
  }, [paymentMethods]);

  const calculatePaymentDetails = () => {
    if (!program) return null

    const programFee = program.price
    const adminFee = programFee * 0.05
    const taxRate = 0.07
    const taxAmount = (programFee + adminFee) * taxRate
    const totalAmount = programFee + adminFee + taxAmount

    return {
      programFee,
      adminFee,
      taxAmount,
      totalAmount
    }
  }

  const paymentDetails = calculatePaymentDetails()

  const handleEnrollmentInputChange = (name: string, value: string) => {
    setEnrollmentData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === 'paymentMethod' && value !== 'credit-card') {
      setEnrollmentData(prev => ({ ...prev, existingCardId: '' }));
    }
  }

  const submitEnrollment = async () => {
    if (!enrollmentData.studentId) {
      toast({ title: "Error", description: "Please select a student", variant: "destructive" });
      return;
    }

    if (enrollmentData.paymentMethod === "credit-card") {
      if (paymentMethods.length > 0 && !enrollmentData.existingCardId && !addingNewCard) {
        toast({ title: "Error", description: "Please select a card or add a new one", variant: "destructive" });
        return;
      }
      if (paymentMethods.length === 0 && !addingNewCard) {
        toast({ title: "Error", description: "Please add a credit card first", variant: "destructive" });
        handleAddNewCard();
        return;
      }
    }

    if (addingNewCard) {
      toast({ title: "Action Required", description: "Please finish adding your new card.", variant: "default" });
      return;
    }

    let createdEnrollmentId: string | null = null;
    try {
      setEnrollmentLoading(true)
      const token = localStorage.getItem("auth_token")
      if (!token) throw new Error("Authentication required")

      const transactionId = `txn_${Math.random().toString(36).substring(2, 15)}`
      const nextMonthDate = new Date();
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

      const requestData: any = {
        programId: program._id,
        studentId: enrollmentData.studentId,
        parentId: userId,
        paymentMethod: enrollmentData.paymentMethod,
        offeringType: enrollmentData.offeringType,
        totalAmount: paymentDetails?.totalAmount,
        ...(enrollmentData.offeringType === 'Marathon' ? {
          monthlyAmount: paymentDetails?.totalAmount,
          subscriptionId: `sub_${Math.random().toString(36).substring(2, 15)}`,
          nextPaymentDue: nextMonthDate,
          paymentHistory: [{
            amount: paymentDetails?.totalAmount, date: new Date(), status: 'pending', transactionId: transactionId
          }]
        } : {
          paymentDate: new Date(),
          paymentTransactionId: transactionId,
          paymentStatus: 'pending'
        })
      }

      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create enrollment record")
      }

      const enrollmentResult = await response.json()
      createdEnrollmentId = enrollmentResult.enrollment._id
      setNewlyCreatedEnrollmentId(createdEnrollmentId)

      if (enrollmentData.paymentMethod === 'credit-card' && enrollmentData.existingCardId) {
        await processPayment(createdEnrollmentId, 'stripe', enrollmentData.existingCardId);
      } else if (enrollmentData.paymentMethod === 'paypal') {
        await processPayment(createdEnrollmentId, 'paypal', null);
      } else {
        setEnrollmentLoading(false);
        onOpenChange(false);
        toast({
          title: "Enrollment Created (Payment Pending)",
          description: "Enrollment record created. Please complete payment.",
          variant: "default"
        });
      }
    } catch (err: any) {
      toast({
        title: "Enrollment Error",
        description: err.message || "Failed to enroll student",
        variant: "destructive",
      })
      setEnrollmentLoading(false)
      setNewlyCreatedEnrollmentId(null)
    }
  }

  const processPayment = async (
    enrollmentId: string,
    paymentProcessor: 'stripe' | 'paypal',
    paymentMethodId: string | null
  ) => {
    try {
      setPaymentProcessing(true);

      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Authentication required");

      const paymentData: any = {
        enrollmentId: enrollmentId,
        paymentProcessor: paymentProcessor,
      };

      if (paymentProcessor === 'stripe' && paymentMethodId) {
        paymentData.paymentMethodId = paymentMethodId;
      }

      const response = await fetch(`/api/enrollments/${enrollmentId}/process-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to process ${paymentProcessor} payment`);
      }

      const paymentResult = await response.json();

      if (paymentProcessor === 'paypal' && paymentResult.approvalUrl) {
        window.location.href = paymentResult.approvalUrl;
        return;
      }

      toast({
        title: "Success",
        description: paymentResult.message || `Payment processed via ${paymentProcessor}. Enrollment complete!`,
      });

      onOpenChange(false);

    } catch (err: any) {
      toast({
        title: "Payment Processing Error",
        description: err.message || `Failed to process ${paymentProcessor} payment. Your enrollment may be incomplete.`,
        variant: "destructive",
      });
    } finally {
      if (!(paymentProcessor === 'paypal' && !err)) {
        setPaymentProcessing(false);
        setEnrollmentLoading(false);
        setNewlyCreatedEnrollmentId(null);
      }
    }
  }

  const handleAddNewCard = () => {
    setAddingNewCard(true);
    handleEnrollmentInputChange('existingCardId', '');
    setIsAddCardModalOpen(true);
  }

  const handlePaymentMethodSuccess = async () => {
    setIsAddCardModalOpen(false);
    setAddingNewCard(false);
    try {
      await onCardAddedSuccessfully();
      toast({
        title: "Card Added",
        description: "New card added. Please select it to continue.",
      });
    } catch (error) {
      toast({
        title: "Update Error",
        description: "Failed to refresh card list after adding.",
        variant: "destructive"
      });
    }
  }

  const isSubmitDisabled = !enrollmentData.studentId ||
    enrollmentLoading ||
    paymentProcessing ||
    students.length === 0 ||
    addingNewCard ||
    (enrollmentData.paymentMethod === "credit-card" && paymentMethods.length > 0 && !enrollmentData.existingCardId) ||
    (enrollmentData.paymentMethod === "credit-card" && paymentMethods.length === 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader className="sticky top-0 bg-background pt-6 pb-2 z-10 border-b mb-4">
          <DialogTitle>Enroll in {program?.name}</DialogTitle>
          <DialogDescription>
            Select a student and payment details to complete enrollment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 flex-grow overflow-y-auto px-1 py-1">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="studentId">Select Student*</Label>
            {students.length > 0 ? (
              <Select
                value={enrollmentData.studentId}
                onValueChange={(value) => handleEnrollmentInputChange("studentId", value)}
                required
              >
                <SelectTrigger id="studentId">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student._id} value={student._id}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div></div>
            )}
          </div>

          {program && (
            <Alert></Alert>
          )}

          <div>
            <Label className="mb-2 block">Payment Method*</Label>
            <RadioGroup
              value={enrollmentData.paymentMethod}
              onValueChange={(value) => handleEnrollmentInputChange("paymentMethod", value)}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credit-card" id="credit-card" />
                <Label htmlFor="credit-card" className="font-normal">
                  Credit Card
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal" className={`font-normal`}>
                  PayPal
                </Label>
              </div>
            </RadioGroup>

            {enrollmentData.paymentMethod === "credit-card" && (
              <div className="mt-4 pl-6 border-l-2 border-border ml-1 space-y-4">
                {paymentMethods.length > 0 && (
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Select an existing card*</Label>
                    <RadioGroup
                      value={enrollmentData.existingCardId}
                      onValueChange={(value) => handleEnrollmentInputChange("existingCardId", value)}
                      className="flex flex-col space-y-2"
                    >
                      {paymentMethods.map((method) => (
                        <div key={method.id} className="flex items-start space-x-3 p-3 border rounded-md hover:border-primary transition-colors">
                          <RadioGroupItem value={method.id} id={`card-${method.id}`} className="mt-1 flex-shrink-0" />
                          <Label htmlFor={`card-${method.id}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                            </p>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-3"
                  onClick={handleAddNewCard}
                  disabled={addingNewCard}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {paymentMethods.length > 0 ? 'Add New Card' : 'Add Card to Pay*'}
                </Button>

                {addingNewCard && (<div className="mt-3 ..."></div>)}

                {paymentMethods.length === 0 && !addingNewCard && (
                  <Alert variant="destructive" className="mt-3"></Alert>
                )}
              </div>
            )}

            {enrollmentData.paymentMethod === "paypal" && (
              <div className="mt-4 pl-6 border-l-2 border-border ml-1 space-y-2">
                <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/30">
                  <img
                    src="/paypal-logo.png"
                    alt="PayPal"
                    className="h-6 w-auto"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Pay securely with PayPal</p>
                    <p className="text-xs text-muted-foreground mt-1">
                    </p>
                  </div>
                </div>
                <Alert className="bg-blue-50 border-blue-100">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700 text-sm">
                    {enrollmentData.offeringType === "Marathon" ?
                      "You'll set up a monthly subscription through PayPal." :
                      "You'll make a one-time payment through PayPal."
                    }
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          {program && paymentDetails && (
            <div className="bg-slate-50 ..."></div>
          )}

        </div>

        <DialogFooter className="mt-auto sticky bottom-0 bg-background pt-4 pb-6 z-10 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={enrollmentLoading || paymentProcessing}>
            Cancel
          </Button>
          <Button
            onClick={submitEnrollment}
            disabled={isSubmitDisabled}
          >
            {(enrollmentLoading || paymentProcessing) ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                {paymentProcessing
                  ? `Processing ${enrollmentData.paymentMethod === 'paypal' ? 'PayPal' : 'Payment'}...`
                  : "Creating Enrollment..."}
              </>
            ) : enrollmentData.paymentMethod === 'paypal' ? (
              "Continue to PayPal"
            ) : enrollmentData.offeringType === "Marathon" ? (
              "Start Subscription"
            ) : (
              "Complete Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      <PaymentMethodModal
        open={isAddCardModalOpen}
        onOpenChange={(open) => {
          setIsAddCardModalOpen(open)
          if (!open && addingNewCard) { setAddingNewCard(false); }
        }}
        onSuccess={handlePaymentMethodSuccess}
      />
    </Dialog>
  )
}