import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCardIcon, PlusIcon, TrashIcon } from "lucide-react";
import { PaymentMethodModal } from "./payment-method-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface PaymentMethod {
  id: string;
  last4: string;
  expirationDate: string;
  cardType: string;
  isDefault: boolean;
}

export function PaymentMethods() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  const fetchPaymentMethods = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');

      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You are not logged in. Please log in to view payment methods.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

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
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, [user?.id]);

  const handleRemovePaymentMethod = async () => {
    if (!confirmRemove.id) return;

    try {

      const token = localStorage.getItem('auth_token');

      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You are not logged in. Please log in to remove payment methods.",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(`/api/payments/${confirmRemove.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to remove payment method');
      }

      setPaymentMethods(prevMethods =>
        prevMethods.filter(method => method.id !== confirmRemove.id)
      );

      toast({
        title: "Success",
        description: "Payment method removed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to remove payment method',
        variant: "destructive"
      });
    } finally {
      setConfirmRemove({ open: false, id: null });
    }
  };

  const getCardIcon = (cardType: string) => {
    return <CreditCardIcon className="h-8 w-8 text-primary" />;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Manage your payment methods for tuition and fees
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse h-16"></div>
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse h-16"></div>
            </div>
          ) : paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    {getCardIcon(method.cardType)}
                    <div>
                      <p className="font-medium capitalize">
                        {method.cardType} •••• {method.last4}
                        {method.isDefault && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary py-0.5 px-2 rounded-full">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Expires {method.expirationDate}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirmRemove({ open: true, id: method.id })}
                    aria-label="Remove payment method"
                  >
                    <TrashIcon className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-md text-center">
              <CreditCardIcon className="h-12 w-12 mx-auto text-primary mb-2 opacity-50" />
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                You don't have any payment methods yet
              </p>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full mt-4 flex items-center justify-center gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
            Add New Payment Method
          </Button>
        </CardContent>
      </Card>

      <PaymentMethodModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={fetchPaymentMethods}
      />

      <ConfirmDialog
        open={confirmRemove.open}
        onOpenChange={(open) => setConfirmRemove({ ...confirmRemove, open })}
        title="Remove Payment Method"
        description="Are you sure you want to remove this payment method? This action cannot be undone."
        confirmText="Remove"
        onConfirm={handleRemovePaymentMethod}
      />
    </>
  );
}