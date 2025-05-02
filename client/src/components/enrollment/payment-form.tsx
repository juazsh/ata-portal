"use client"

import type React from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { CreditCardIcon } from "lucide-react"
import type { Program, FormData } from "./enrollment-types"

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
  handleChange,
  setFormData,
  getFirstPaymentAmount,
  getAdminFee,
  getTaxAmount,
  getTotalAmountDue,
  setActiveTab,
  isLoading,
}: PaymentFormProps) {
  const [showDiscountField, setShowDiscountField] = useState(false);

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
            onClick={() => setFormData({ ...formData, paymentMethod: "credit-card" })}
          >
            <CreditCardIcon className="h-5 w-5" />
            <span>Credit Card</span>
          </Button>
        </div>

        {formData.paymentMethod === "credit-card" && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input id="cardNumber" name="cardNumber" placeholder="1234 5678 9012 3456" onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cardExpiry">Expiry Date</Label>
                <Input id="cardExpiry" name="cardExpiry" placeholder="MM/YY" onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardCVC">CVC</Label>
                <Input id="cardCVC" name="cardCVC" placeholder="123" onChange={handleChange} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={() => setActiveTab("child")}>
          Back to Student Info
        </Button>

        {formData.paymentMethod === "paypal" ? (
          <Button
            type="button"
            variant="outline"
            className="flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            disabled={isLoading}
          >
            <PaypalIcon className="h-5 w-5" />
            Pay with PayPal
          </Button>
        ) : (
          <Button type="submit" disabled={isLoading || !formData.enrollmentDate} className="min-w-[150px]">
            {isLoading ? "Processing..." : "Complete Enrollment"}
          </Button>
        )}
      </div>
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
