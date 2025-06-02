"use client"

import type React from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { CreditCardIcon, ShieldCheck } from "lucide-react"
import type { Program, FormData } from "./enrollment-types"
import { PaymentMethodModal } from "@/components/dashboard/payment-method-modal"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"

interface PaymentFormProps {
  program: Program | null
  formData: FormData
  discountCode: string
  setDiscountCode: (code: string) => void
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  setFormData: (data: FormData) => void
  getFirstPaymentAmount: () => number
  getAdminFee: () => number
  getTaxAmount: () => number
  getTotalAmountDue: () => number
  setActiveTab: (tab: string) => void
  isLoading: boolean
}

export function PaymentForm({
  program,
  formData,
  discountCode,
  setDiscountCode,
  setFormData,
  getFirstPaymentAmount,
  getAdminFee,
  getTaxAmount,
  getTotalAmountDue,
  setActiveTab,
  isLoading,
}: PaymentFormProps) {
  const [showDiscountField, setShowDiscountField] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [paymentMethodSummary, setPaymentMethodSummary] = useState<string | null>(null);
  const [verifyingDiscount, setVerifyingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isProcessingPaypal, setIsProcessingPaypal] = useState(false);
  const [paypalError, setPaypalError] = useState("");

  const handleStripeSuccess = (paymentMethodId: string) => {
    setFormData({ ...formData, stripePaymentMethodId: paymentMethodId, paymentMethod: "credit-card" });
    setPaymentMethodSummary("Credit Card ending in ••••");
    setShowStripeModal(false);
  };

  const paymentSelected = !!formData.stripePaymentMethodId || formData.paymentMethod === "paypal";

  
  const verifyDiscountCode = async (code: string) => {
    setVerifyingDiscount(true);
    setDiscountError(null);
    try {
      const res = await fetch(`/api/discounts/verify?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok || !data.percent) throw new Error(data.message || "Invalid code");
      setFormData({ ...formData, discountPercent: data.percent });
      setDiscountError(null);
    } catch (e: any) {
      setFormData({ ...formData, discountPercent: 0 });
      setDiscountError(e.message || "Invalid discount code");
    } finally {
      setVerifyingDiscount(false);
    }
  };

  const handlePayWithPaypal = async () => {
    setIsProcessingPaypal(true);
    setPaypalError("");
    try {
      const registrationRes = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!registrationRes.ok) {
        const errorData = await registrationRes.json();
        throw new Error(errorData.message || "Failed to create registration");
      }
      const registration = await registrationRes.json();
      const paymentRes = await fetch(`/api/registration/${registration._id}/process-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentProcessor: "paypal" }),
      });
      if (!paymentRes.ok) {
        const errorData = await paymentRes.json();
        throw new Error(errorData.message || "Failed to process PayPal payment");
      }
      const paymentResult = await paymentRes.json();
      if (paymentResult.approvalUrl) {
        window.location.href = paymentResult.approvalUrl;
        return;
      }
      
      toast({ title: "Success", description: paymentResult.message || "PayPal payment processed." });
    } catch (err: any) {
      setPaypalError(err.message || "PayPal payment failed");
    } finally {
      setIsProcessingPaypal(false);
    }
  };

  return (
    <>
      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg space-y-4">
        {showDiscountField ? (
          <div className="space-y-2">
            <Label htmlFor="discountCode" className="text-sm">Enter Discount Code</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="discountCode"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="Enter code"
                className="h-8 text-sm"
                disabled={verifyingDiscount}
              />
              <Button
                type="button"
                size="sm"
                disabled={verifyingDiscount || !discountCode}
                onClick={() => verifyDiscountCode(discountCode)}
              >
                {verifyingDiscount ? "Verifying..." : "Apply"}
              </Button>
            </div>
            {discountError && <div className="text-xs text-destructive mt-1">{discountError}</div>}
            {formData.discountPercent ? (
              <div className="text-xs text-green-600 mt-1">Discount applied: {formData.discountPercent}% off</div>
            ) : null}
          </div>
        ) : (
          <Button
            type="button"
            variant="link"
            className="text-sm p-0 h-auto"
            onClick={() => setShowDiscountField(true)}
          >
            Have a discount code?
          </Button>
        )}
        
        <div className="flex items-center gap-3 bg-slate-200 dark:bg-slate-700 rounded-md px-3 py-2 mt-2">
          <Switch
            checked={!!formData.enableAutoPay}
            onCheckedChange={(checked) => setFormData({ ...formData, enableAutoPay: checked })}
            id="autoPaySwitch"
          />
          <Label htmlFor="autoPaySwitch" className="text-sm font-medium">Auto-Pay</Label>
          <span className="text-xs text-slate-600 dark:text-slate-300 ml-2">
            <ShieldCheck className="inline h-4 w-4 text-primary mr-1" />
            Enroll in Auto-Pay to <span className="font-semibold text-green-600">waive 2.5% admin fees</span> on all payments.
          </span>
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <span className="text-slate-600 dark:text-slate-400">Program Name:</span>
            <span className="font-medium text-slate-900 dark:text-slate-50">{program?.name || "Loading..."}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <span className="text-slate-600 dark:text-slate-400">1st Payment:</span>
            <div className="flex flex-col items-end">
              <span className="font-medium text-slate-900 dark:text-slate-50">
                ${formData.enrollmentDate ? getFirstPaymentAmount().toFixed(2) : "0.00"}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Admin: ${getAdminFee().toFixed(2)} • Tax: ${getTaxAmount().toFixed(2)}
                {formData.discountPercent ? (
                  <span className="ml-2 text-green-600">Discount: -${(getFirstPaymentAmount() * (formData.discountPercent / 100)).toFixed(2)}</span>
                ) : null}
              </span>
            </div>
          </div>
          <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <span className="text-slate-600 dark:text-slate-400">Total Due:</span>
            <span className="font-bold text-lg text-primary">${getTotalAmountDue().toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Payment Method</h2>
        {!paymentSelected && (
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant={formData.paymentMethod === "paypal" ? "default" : "outline"}
              className="flex items-center justify-center gap-2 py-6"
              onClick={() => setFormData({ ...formData, paymentMethod: "paypal" })}
            >
              <PaypalIcon className="h-5 w-5" />
              <span>PayPal</span>
            </Button>
            <Button
              type="button"
              variant={formData.paymentMethod === "credit-card" ? "default" : "outline"}
              className="flex items-center justify-center gap-2 py-6"
              onClick={() => setShowStripeModal(true)}
            >
              <CreditCardIcon className="h-5 w-5" />
              <span>Credit Card</span>
            </Button>
          </div>
        )}
        {/* Stripe branding and card added message */}
        {formData.paymentMethod === "credit-card" && (
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
            <CreditCardIcon className="h-4 w-4 text-blue-500" />
            <span>Powered by Stripe – your card is processed securely.</span>
          </div>
        )}
        {formData.stripePaymentMethodId && (
          <div className="flex items-center gap-3 bg-card border border-primary/30 rounded-xl px-4 py-3 mt-2">
            <CreditCardIcon className="h-5 w-5 text-primary" />
            <span className="text-text font-medium">Card added successfully! <span className="text-green-600">(Saved securely)</span></span>
            <Button type="button" variant="ghost" size="sm" onClick={() => {
              setFormData({ ...formData, stripePaymentMethodId: "", paymentMethod: "" });
              setPaymentMethodSummary(null);
            }}>Change</Button>
          </div>
        )}
        {formData.paymentMethod === "paypal" && (
          <>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <PaypalIcon className="h-5 w-5 text-blue-600" />
              <span>Pay securely with PayPal</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, paymentMethod: "" })}>Change</Button>
            </div>
            <Button
              type="button"
              className="mt-4 flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black"
              onClick={handlePayWithPaypal}
              disabled={isProcessingPaypal}
            >
              <PaypalIcon className="h-5 w-5" />
              Pay with PayPal
            </Button>
          </>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={() => setActiveTab("child")}>
          Back to Student Info
        </Button>

        <Button type="submit" disabled={isLoading || !formData.enrollmentDate || (!formData.stripePaymentMethodId && formData.paymentMethod !== "paypal")}
          className="min-w-[150px]">
          {isLoading ? "Processing..." : "Complete Enrollment"}
        </Button>
      </div>
      <PaymentMethodModal
        open={showStripeModal}
        onOpenChange={setShowStripeModal}
        onSuccess={handleStripeSuccess}
      />
    </>
  )
}

export function PaypalIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 11l5-5l5 5l-5 5z" />
      <path d="M4 7v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7m-16 0a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1m-16 0v2h16V7" />
    </svg>
  )
}