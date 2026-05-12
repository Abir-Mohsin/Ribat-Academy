import React, { useState } from 'react';
import { X, CheckCircle, CreditCard, Smartphone, ChevronLeft, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './Button';
import { useAuth } from '@/src/contexts/AuthContext';
import { addDoc, collection } from 'firebase/firestore';
import { db, serverTimestamp, handleFirestoreError, OperationType } from '@/src/lib/firebase';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from './StripePaymentForm';
import { cn } from '@/src/lib/utils';

// @ts-ignore
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    title: string;
    price: number;
    type: 'course' | 'book' | 'live_class';
    bookType?: 'hardcover' | 'pdf';
  };
}

export function PaymentModal({ isOpen, onClose, item }: PaymentModalProps) {
  const { user } = useAuth();
  const [method, setMethod] = useState<'selection' | 'manual' | 'stripe' | 'cod'>('selection');
  const [trxId, setTrxId] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  const initializeStripe = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: item.price,
          metadata: { 
            userId: user?.uid,
            itemId: item.id,
            itemType: item.type
          }
        }),
      });
      const data = await response.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setMethod('stripe');
      } else {
        throw new Error(data.error || "Failed to get client secret");
      }
    } catch (error) {
      console.error("Stripe initialization error:", error);
      alert("Failed to initialize Stripe. Please try manual payment instead.");
      setMethod('manual');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent, isCod: boolean = false) => {
    e.preventDefault();
    if (!user || (!isCod && !trxId)) return;

    setLoading(true);
    setError(null);
    try {
      const orderData = {
        userId: user.uid,
        userEmail: user.email || 'no-email',
        itemType: item.type,
        itemId: item.id,
        itemTitle: item.title,
        amount: Number(item.price),
        trxId: isCod ? 'COD' : trxId.trim(),
        shippingAddress: (item.bookType === 'hardcover' ? shippingAddress.trim() : null),
        buyerName: (item.bookType === 'hardcover' ? buyerName.trim() : null),
        mobileNumber: (item.bookType === 'hardcover' ? mobileNumber.trim() : null),
        paymentMethod: isCod ? 'cod' : 'manual',
        status: isCod ? 'pending' : 'pending',
        createdAt: serverTimestamp(),
      };

      console.log("Submitting order with data:", orderData);
      await addDoc(collection(db, 'orders'), orderData);
      
      // Notify Admin
      try {
        fetch("https://formsubmit.co/ajax/abirmohsin02@gmail.com", {
          method: "POST",
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            Name: "System Notification",
            Message: `New pending order for ${item.type}: ${item.title}.`,
            UserEmail: user.email,
            Amount: item.price,
            TransactionID: isCod ? 'COD' : trxId
          })
        }).catch(() => {});
      } catch (e) {}

      setSuccess(true);
    } catch (err: any) {
      console.error("Payment Detailed Error:", err);
      let msg = "Something went wrong. Please check your internet and try again.";
      if (err.message && err.message.includes('permission')) {
        msg = "Permission denied. Please ensure you are logged in correctly.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleStripeSuccess = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        userEmail: user.email,
        itemType: item.type,
        itemId: item.id,
        itemTitle: item.title,
        amount: item.price,
        status: 'approved', // Auto-approve for card payments
        paymentMethod: 'stripe',
        shippingAddress: item.bookType === 'hardcover' ? shippingAddress : null,
        buyerName: item.bookType === 'hardcover' ? buyerName : null,
        mobileNumber: item.bookType === 'hardcover' ? mobileNumber : null,
        createdAt: serverTimestamp(),
      });
      
      // Notify Admin
      try {
        fetch("https://formsubmit.co/ajax/abirmohsin02@gmail.com", {
          method: "POST",
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            Name: "System Notification",
            Message: `New successful STRIPE payment for ${item.type}: ${item.title}.`,
            UserEmail: user.email,
            Amount: item.price,
            TransactionID: 'Stripe Auto'
          })
        }).catch(() => {});
      } catch (e) {}

      setSuccess(true);
    } catch (error) {
      console.error("Error saving Stripe order:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-3xl overflow-y-auto max-h-[90vh] shadow-2xl"
          >
            <div className="p-6 md:p-8">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>

              {method !== 'selection' && !success && (
                <button 
                  onClick={() => setMethod('selection')}
                  className="mb-6 flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}

              {success ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    {method === 'stripe' ? 'Access Granted!' : 'Payment Submitted!'}
                  </h3>
                  <p className="text-gray-500 mb-8 px-4 leading-relaxed">
                    {method === 'stripe' 
                      ? `Alhamdulillah! You now have instant access to '${item.title}'. Head over to your dashboard to start learning.`
                      : `Alhamdulillah! Your manual payment is being verified. You'll get access to '${item.title}' once approved (usually within 2-4 hours).`}
                  </p>
                  <Button onClick={onClose} fullWidth>Finish</Button>
                </div>
              ) : method === 'selection' ? (
                <>
                  <header className="mb-8">
                    <h3 className="text-2xl font-bold mb-2">Checkout</h3>
                    <p className="text-gray-500 text-sm">Select your preferred payment method.</p>
                  </header>

                  <div className="space-y-4">
                    <button 
                      onClick={initializeStripe}
                      className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-black hover:text-white rounded-2xl border border-gray-100 transition-all group"
                      disabled={loading}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black shadow-sm group-hover:scale-110 transition-transform">
                          <CreditCard size={24} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold">Credit/Debit Card</p>
                          <p className="text-xs opacity-60">Instant access via Stripe</p>
                        </div>
                      </div>
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center group-hover:border-white"><div className="w-2 h-2 bg-[#0EA5E9] rounded-full opacity-0 group-hover:opacity-100"></div></div>}
                    </button>

                    <button 
                      onClick={() => setMethod('manual')}
                      className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-black hover:text-white rounded-2xl border border-gray-100 transition-all group"
                      disabled={loading}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black shadow-sm group-hover:scale-110 transition-transform">
                          <Smartphone size={24} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold">Mobile Banking</p>
                          <p className="text-xs opacity-60">BKash, Nagad, Rocket</p>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center group-hover:border-white"><div className="w-2 h-2 bg-[#0EA5E9] rounded-full opacity-0 group-hover:opacity-100"></div></div>
                    </button>

                    {item.bookType === 'hardcover' && (
                      <button 
                        onClick={() => setMethod('cod')}
                        className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-black hover:text-white rounded-2xl border border-gray-100 transition-all group"
                        disabled={loading}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black shadow-sm group-hover:scale-110 transition-transform">
                            <Info size={24} />
                          </div>
                          <div className="text-left">
                            <p className="font-bold">Cash on Delivery</p>
                            <p className="text-xs opacity-60">Pay upon delivery</p>
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center group-hover:border-white"><div className="w-2 h-2 bg-[#0EA5E9] rounded-full opacity-0 group-hover:opacity-100"></div></div>
                      </button>
                    )}
                  </div>

                  <div className="mt-8 pt-8 border-t border-gray-50">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-gray-400">Total payable</span>
                      <span className="text-2xl font-bold">৳{item.price}</span>
                    </div>
                  </div>
                </>
              ) : method === 'stripe' ? (
                <div className="space-y-6">
                  <header>
                    <h3 className="text-2xl font-bold mb-2">Card Payment</h3>
                    <p className="text-gray-500 text-sm">Secure payment powered by Stripe.</p>
                  </header>

                  {item.bookType === 'hardcover' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Buyer Name</label>
                        <input
                          required
                          type="text"
                          placeholder="Your full name"
                          className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Mobile Number</label>
                        <input
                          required
                          type="tel"
                          placeholder="e.g. 01XXXXXXXXX"
                          className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Shipping Address</label>
                        <textarea
                          required
                          placeholder="House, Area, City, Postcode, District"
                          className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 min-h-[100px] resize-none text-sans text-sm"
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                  
                  {clientSecret && (!item.bookType || item.bookType !== 'hardcover' || shippingAddress.length > 5) && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <StripePaymentForm 
                        amount={item.price} 
                        item={item} 
                        onSuccess={handleStripeSuccess} 
                      />
                    </Elements>
                  )}
                  {item.bookType === 'hardcover' && shippingAddress.length <= 5 && (
                    <p className="text-xs text-amber-600 font-medium bg-amber-50 p-3 rounded-lg flex items-center gap-2">
                       <Info size={14} /> Please enter your shipping address to proceed.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <header className="mb-8">
                    <h3 className="text-2xl font-bold mb-2">{method === 'cod' ? 'Cash on Delivery' : 'Mobile Banking'}</h3>
                    <p className="text-gray-500 text-sm">{method === 'cod' ? 'Confirm your order' : 'Follow instructions to pay manually.'}</p>
                  </header>

                  {method === 'manual' && (
                    <div className="bg-gray-50 p-4 rounded-2xl mb-8 border border-gray-100 overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Smartphone size={60} />
                      </div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">BKash / Nagad</p>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100">
                            <span className="text-sm font-medium">Personal Number</span>
                            <span className="font-mono font-bold text-black">01788876206</span>
                        </div>
                        <div className="flex justify-between items-center text-blue-600 px-1">
                            <span className="text-sm font-medium">Amount to send</span>
                            <span className="font-bold text-xl">৳{item.price}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={(e) => handleManualSubmit(e, method === 'cod')} className="space-y-6">
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium flex items-center gap-2">
                        <X size={14} /> {error}
                      </div>
                    )}
                    {item.bookType === 'hardcover' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Buyer Name</label>
                          <input
                            required
                            type="text"
                            placeholder="Your full name"
                            className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                            value={buyerName}
                            onChange={(e) => setBuyerName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Mobile Number</label>
                          <input
                            required
                            type="tel"
                            placeholder="e.g. 01XXXXXXXXX"
                            className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Shipping Address</label>
                          <textarea
                            required
                            placeholder="House, Area, City, Postcode, District"
                            className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 min-h-[100px] resize-none"
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                    {method !== 'cod' && (
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-3 text-sans">Transaction ID</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. 7X32A89B"
                          className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                          value={trxId}
                          onChange={(e) => setTrxId(e.target.value)}
                        />
                      </div>
                    )}

                    <Button type="submit" fullWidth disabled={loading}>
                      {loading ? "Verifying..." : (method === 'cod' ? 'Confirm Order' : `Submit Payment`)}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
