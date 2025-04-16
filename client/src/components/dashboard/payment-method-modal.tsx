import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// >> Keep Stripe types declaration
declare global {
  interface Window { Stripe?: any; }
}

interface PaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PaymentMethodModal({ open, onOpenChange, onSuccess }: PaymentMethodModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const cardElementRef = useRef<any>(null);

  const cardElementContainerRef = useRef<HTMLDivElement>(null);
  const [nameOnCard, setNameOnCard] = useState("");
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [isStripeLoading, setIsStripeLoading] = useState(true); // Track script loading


  useEffect(() => {
    console.log("Stripe Init Effect: Running");
    if (typeof window === 'undefined') {
      console.log("Stripe Init Effect: Skipping (SSR)");
      return;
    }
    const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY;
    console.log(stripeKey)

    if (!stripeKey) {
      console.error('Stripe key missing: NEXT_PUBLIC_STRIPE_KEY');
      toast({ title: "Config Error", description: "Payment system not configured.", variant: "destructive" });
      setIsStripeLoading(false);
      return;
    }

    console.log("Stripe:", stripe);
    console.log("Elements:", elements);
    console.log("Card Element Container Ref:", cardElementContainerRef.current);
    if (window.Stripe) {
      console.log("Stripe Init Effect: Stripe.js already loaded.");
      initializeStripe(stripeKey);
      setIsStripeLoading(false);
    } else {

      const scriptId = 'stripe-js-script';
      if (!document.getElementById(scriptId)) {
        console.log("Stripe Init Effect: Loading Stripe.js script...");
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        script.onload = () => {
          console.log("Stripe Init Effect: Stripe.js script loaded.");
          initializeStripe(stripeKey);
          setIsStripeLoading(false);
        };
        script.onerror = () => {
          console.error('Stripe Init Effect: Failed to load Stripe.js');
          toast({ title: "Error", description: "Failed to load payment system.", variant: "destructive" });
          setIsStripeLoading(false);
        };
        document.body.appendChild(script);
      } else {
        console.log("Stripe Init Effect: Script tag found, assuming it will load/has loaded.");
        if (window.Stripe) {
          initializeStripe(stripeKey);
        }
        setIsStripeLoading(false);
      }
    }
  }, [toast]);

  const initializeStripe = (key: string) => {
    if (!window.Stripe) {
      console.error("InitializeStripe: window.Stripe not found!");
      return;
    }
    try {

      if (stripe && elements) {
        console.log("InitializeStripe: Already initialized.");
        return;
      }
      const stripeInstance = window.Stripe(key);
      const elementsInstance = stripeInstance.elements();
      setStripe(stripeInstance);
      setElements(elementsInstance);
      console.log("InitializeStripe: Stripe and Elements initialized successfully.");
    } catch (error) {
      console.error("InitializeStripe: Error initializing Stripe:", error);
      toast({ title: "Init Error", description: "Could not initialize payment system.", variant: "destructive" });
    }
  };


  // >> I need to wrap my head around this code. useEffect, Stripe.js and component mount cycles are tricky.
  useEffect(() => {
    console.log("Mounting Effect: Running. Deps:", { stripe: !!stripe, elements: !!elements, open });


    if (!stripe || !elements || !open) {
      console.log("Mounting Effect: Aborting (Stripe/Elements not ready or modal closed).");

      if (cardElementRef.current) {
        console.log("Mounting Effect: Conditions unmet, unmounting existing element.");
        cardElementRef.current.unmount();
        cardElementRef.current = null;

        setCardComplete(false);
        setCardError(null);
      }
      return;
    }


    const timeout = setTimeout(() => {
      const container = cardElementContainerRef.current;
      if (!container) {
        console.log("Mounting Effect: Aborting (Container div ref not available yet).");
        return;
      }


      if (cardElementRef.current) {
        console.log("Mounting Effect: Card element instance already exists, skipping mount.");
        return;
      }


      try {
        console.log("Mounting Effect: Creating Card Element...");
        const cardElement = elements.create('card', {
          style: {
            base: {
              fontSize: '16px',
              color: '#111827',
              fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
              '::placeholder': { color: '#aab7c4' },
              padding: '12px',
            },
            invalid: { color: '#dc2626', iconColor: '#dc2626' },
          },
        });
        console.log("Mounting Effect: Card Element created.");

        console.log("Mounting Effect: Attempting to mount Card Element to container:", container);
        cardElement.mount(container);
        cardElementRef.current = cardElement;
        console.log("Mounting Effect: Card Element mounted successfully.");


        console.log("Mounting Effect: Setting up event listeners.");
        setCardComplete(false);
        setCardError(null);

        cardElement.on('change', (event: any) => {
          console.log("Card onChange:", { complete: event.complete, error: event.error });
          setCardComplete(event.complete);
          setCardError(event.error ? event.error.message : null);
        });
        cardElement.on('ready', () => console.log("Card onReady: Element is ready."));
        cardElement.on('focus', () => console.log("Card onFocus: Element focused."));
        cardElement.on('blur', () => console.log("Card onBlur: Element blurred."));

      } catch (error) {
        console.error("Mounting Effect: Error during create/mount:", error);
        toast({ title: "Mounting Error", description: "Could not display card input.", variant: "destructive" });
        cardElementRef.current = null;
      }
    }, 100); // >> Delay to ensure modal is fully rendered

    // >> Cleanup timeout and unmount card element
    return () => {
      clearTimeout(timeout);
      console.log("Mounting Effect: Cleanup function running.");
      const currentCardElement = cardElementRef.current;
      if (currentCardElement) {
        try {
          console.log("Mounting Effect: Unmounting element:", currentCardElement);
          currentCardElement.unmount();
          console.log("Mounting Effect: Element unmounted.");
        } catch (unmountError) {
          console.error("Mounting Effect: Error during unmount:", unmountError);
        } finally {
          cardElementRef.current = null; // Clear the instance ref
          console.log("Mounting Effect: Cleared cardElementRef.");
          setCardComplete(false);
          setCardError(null);
        }
      } else {
        console.log("Mounting Effect: Cleanup - No element instance found in ref.");
      }
    };
  }, [stripe, elements, open, toast]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("HandleSubmit: Starting submission...");


    if (!user?.id) {
      console.error("Submit Error: No user ID");
      toast({
        title: "Authentication Error",
        description: "User information is missing. Please log in again.",
        variant: "destructive",
      });
      return;
    }
    if (!stripe || !elements || !cardElementRef.current) {
      console.error("Submit Error: Stripe not ready");
      toast({
        title: "Error",
        description: "Payment system is not initialized. Please wait or refresh.",
        variant: "destructive",
      });
      return;
    }
    if (cardError) {
      console.warn("Submit Blocked: Card error exists", cardError);
      toast({
        title: "Card Error",
        description: cardError, // >> Display the existing card error message
        variant: "warning", // >> Use warning or destructive based on severity
      });
      return;
    }
    if (!cardComplete) {
      console.warn("Submit Blocked: Card not complete");
      toast({
        title: "Incomplete Details",
        description: "Please ensure all card details are filled correctly.",
        variant: "warning",
      });
      return;
    }

    console.log("HandleSubmit: Checks passed. Setting loading state.");
    setIsLoading(true);
    setCardError(null);

    try {
      console.log("HandleSubmit: Creating payment method...");
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElementRef.current,
        billing_details: {
          name: nameOnCard.trim() || undefined,
        },
      });

      if (error) {
        console.error("Submit Error: createPaymentMethod failed", error);

        throw new Error(error.message || "Failed to create payment method.");
      }
      console.log("HandleSubmit: Payment method created:", paymentMethod.id);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      console.log("HandleSubmit: Sending to /api/payments...");
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          userId: user.id
        })
      });
      const responseData = await response.json();
      if (!response.ok) {
        console.error("Submit Error: Server failed", responseData);
        throw new Error(responseData.message || `Server error: ${response.status}`);
      }

      console.log("HandleSubmit: Success!");
      toast({
        title: "Success",
        description: "Payment method added successfully!",
      });
      onSuccess();
      onOpenChange(false);

    } catch (error: any) {
      console.error("HandleSubmit: Error during submission:", error);
      setCardError(error.message || 'An unexpected error occurred.');
      toast({
        title: "Error Adding Card",
        description: error.message || 'Failed to add payment method. Please try again.',
        variant: "destructive"
      });
    } finally {
      console.log("HandleSubmit: Setting loading state to false.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Enter your card details to add a new payment method.
          </DialogDescription>
        </DialogHeader>

        {isStripeLoading ? (
          <div className="flex justify-center items-center h-32"><p>Loading Payment Form...</p></div>
        ) : !stripe || !elements ? (
          <div className="flex justify-center items-center h-32 text-red-600"><p>Could not load payment form.</p></div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nameOnCard">Name on Card</Label>
                <Input id="nameOnCard" value={nameOnCard} onChange={(e) => setNameOnCard(e.target.value)} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-element-container">Card Details</Label>
                <div
                  id="card-element-container"
                  ref={cardElementContainerRef}
                  className="rounded-md border border-input bg-transparent min-h-[40px]"
                />
                {cardError && (<p className="text-sm text-red-600 mt-1">{cardError}</p>)}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading || !stripe || !elements || !cardComplete || !!cardError}>
                {isLoading ? "Adding..." : "Add Payment Method"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}