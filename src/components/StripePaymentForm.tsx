import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from './Button';
import { Loader2, AlertCircle } from 'lucide-react';

interface StripePaymentFormProps {
  amount: number;
  item: {
    id: string;
    title: string;
    type: string;
  };
  onSuccess: () => void;
}

export function StripePaymentForm({ amount, item, onSuccess }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // AI Studio App URL or dedicated success page
        return_url: `${window.location.origin}/dashboard?payment=success`,
      },
      redirect: 'if_required'
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "An error occurred.");
      } else {
        setMessage("An unexpected error occurred.");
      }
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />
      
      {message && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
           <AlertCircle size={18} />
           {message}
        </div>
      )}

      <Button
        disabled={isLoading || !stripe || !elements}
        id="submit"
        fullWidth
        className="mt-4"
      >
        <span id="button-text">
          {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : `Pay $${amount}`}
        </span>
      </Button>
    </form>
  );
}
