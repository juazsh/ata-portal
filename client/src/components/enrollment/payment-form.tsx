"use client"

import type React from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { CreditCardIcon } from "lucide-react"
import type { Program, FormData } from "./enrollment-types"
import { PaymentMethodModal } from "@/components/dashboard/payment-method-modal"

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
  setActiveTab,
  isLoading,
}: PaymentFormProps) {
  const [showDiscountField, setShowDiscountField] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [paymentMethodSummary, setPaymentMethodSummary] = useState<string | null>(null);

  const handleStripeSuccess = (paymentMethodId: string) => {
    setFormData({ ...formData, stripePaymentMethodId: paymentMethodId, paymentMethod: "credit-card" });
    setPaymentMethodSummary("Credit Card ending in ••••"); // You can update this to show last4 if available
    setShowStripeModal(false);
  };

  const paymentSelected = !!formData.stripePaymentMethodId || formData.paymentMethod === "paypal";

  return (
    <>
      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg space-y-4">
        {showDiscountField ? (
          <div className="space-y-2">
            <Label htmlFor="discountCode" className="text-sm">Enter Discount Code</Label>
            <Input
              id="discountCode"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="Enter code"
              className="h-8 text-sm"
            />
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
              </span>
            </div>
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
        {formData.stripePaymentMethodId && (
          <div className="flex items-center gap-3 bg-card border border-primary/30 rounded-xl px-4 py-3 mt-2">
            <CreditCardIcon className="h-5 w-5 text-primary" />
            <span className="text-text font-medium">Payment method selected: Credit Card</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => {
              setFormData({ ...formData, stripePaymentMethodId: "", paymentMethod: "" });
              setPaymentMethodSummary(null);
            }}>Change</Button>
          </div>
        )}
        {formData.paymentMethod === "paypal" && paymentSelected && (
          <div className="flex items-center gap-3 bg-card border border-primary/30 rounded-xl px-4 py-3 mt-2">
            <PaypalIcon className="h-5 w-5 text-primary" />
            <span className="text-text font-medium">Payment method selected: PayPal</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, paymentMethod: "" })}>Change</Button>
          </div>
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