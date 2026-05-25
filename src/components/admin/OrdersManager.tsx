import { getThumbnailUrl } from '@/src/lib/drive';
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  setDoc,
  serverTimestamp,
  addDoc,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  Smartphone,
  CreditCard,
  Package,
  Mail,
  User,
  Calendar
} from 'lucide-react';
import { Button } from '@/src/components/Button';
import { cn } from '@/src/lib/utils';

interface Order {
  id: string;
  userId: string;
  userEmail: string;
  itemType: 'course' | 'book';
  purchaseType?: string;
  itemId: string;
  itemTitle: string;
  amount: number;
  trxId?: string;
  paymentScreenshot?: string;
  paymentMethod: 'manual' | 'stripe';
  status: 'pending' | 'approved' | 'rejected';
  shippingAddress?: string;
  createdAt: any;
}

export function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (order: Order) => {
    setProcessingId(order.id);
    try {
      // 1. Update order status
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'approved',
        updatedAt: serverTimestamp()
      });

      // 2. Grant access
      if (order.itemType === 'course') {
        const progressId = `${order.userId}_${order.itemId}`;
        await setDoc(doc(db, 'progress', progressId), {
          userId: order.userId,
          courseId: order.itemId,
          completedLessons: [],
          progress: 0,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      // 3. Create notification
      await addDoc(collection(db, 'notifications'), {
        userId: order.userId,
        title: 'Payment Approved!',
        message: `Your payment for "${order.itemTitle}" has been approved. You can now access it from your dashboard.`,
        type: 'success',
        read: false,
        createdAt: serverTimestamp()
      });

      alert('Order approved successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${order.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (orderId: string) => {
    if (!confirm('Are you sure you want to reject this payment?')) return;
    setProcessingId(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      alert('Order rejected.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center">
        <Loader2 className="animate-spin mx-auto text-gray-300" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.length === 0 ? (
        <div className="bg-white p-20 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400">
           No orders found yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className={cn(
                "bg-white p-6 rounded-2xl shadow-sm border transition-all",
                order.status === 'approved' ? "border-green-100" : order.status === 'rejected' ? "border-red-50" : "border-gray-100"
              )}
            >
              <div className="flex flex-col lg:flex-row gap-8">
                 {/* Payment Proof Column - Only show if it's not a card payment or if screenshot exists */}
                 {order.paymentMethod === 'manual' && (
                   <div className="w-full lg:w-64 shrink-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                         <Smartphone size={12} /> Verification
                      </p>
                      <div className="aspect-video bg-gray-50 rounded-xl overflow-hidden border border-gray-100 relative group">
                         {order.paymentScreenshot ? (
                           <>
                             <img referrerPolicy="no-referrer" src={getThumbnailUrl(order.paymentScreenshot)} alt="Proof" className="w-full h-full object-cover" />
                             <a 
                              href={order.paymentScreenshot} 
                              target="_blank" 
                              rel="noreferrer"
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                             >
                                <ExternalLink size={24} />
                             </a>
                           </>
                         ) : (
                           <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2 p-4 text-center">
                              <Smartphone size={24} className="opacity-20" />
                              <span className="text-[10px] font-bold uppercase">Manual Verification</span>
                              <span className="text-[9px]">Check TRX ID via App</span>
                           </div>
                         )}
                      </div>
                   </div>
                 )}

                 {order.paymentMethod === 'stripe' && (
                   <div className="w-full lg:w-32 shrink-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                         <CreditCard size={12} /> Method
                      </p>
                      <div className="h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-[10px] font-bold uppercase tracking-wider">
                         Card Paid
                      </div>
                   </div>
                 )}

                 {/* Information Column */}
                 <div className="flex-grow">
                    <div className="flex justify-between items-start mb-6">
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <h4 className="font-bold text-lg text-sans">{order.itemTitle}</h4>
                             <span className={cn(
                               "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                               order.itemType === 'course' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                             )}>
                               {order.itemType} {order.purchaseType ? `(${order.purchaseType})` : ''}
                             </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-gray-400 font-sans font-medium">
                             <span className="flex items-center gap-1"><User size={12} /> {order.userEmail}</span>
                             <span className="flex items-center gap-1"><Calendar size={12} /> {order.createdAt?.toDate?.().toLocaleString() || 'Long ago'}</span>
                             {order.trxId && <span className="text-black bg-yellow-50 px-2 rounded tracking-wider">TRX: {order.trxId}</span>}
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-2xl font-bold text-sans">৳{order.amount}</p>
                          <span className={cn(
                             "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                             order.status === 'approved' ? "bg-green-100 text-green-700" : 
                             order.status === 'rejected' ? "bg-red-100 text-red-700" : 
                             "bg-amber-100 text-amber-700"
                          )}>
                             {order.status}
                          </span>
                       </div>
                    </div>

                    {order.shippingAddress && (
                      <div className="mb-6 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                         <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <Package size={12} /> Shipping Address
                         </p>
                         <p className="text-sm font-sans font-medium text-gray-700">{order.shippingAddress}</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                       {order.status === 'pending' && (
                         <>
                           <Button 
                             variant="success" 
                             size="sm" 
                             className="gap-2"
                             onClick={() => handleApprove(order)}
                             disabled={!!processingId}
                           >
                              {processingId === order.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                              Approve Payment
                           </Button>
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="gap-2 text-red-500 border-red-100 hover:bg-red-50 hover:text-red-600"
                             onClick={() => handleReject(order.id)}
                             disabled={!!processingId}
                           >
                              <XCircle size={16} /> Reject
                           </Button>
                         </>
                       )}
                       <a href={`mailto:${order.userEmail}`} className="hidden sm:block">
                          <Button variant="ghost" size="sm" className="gap-2">
                             <Mail size={16} /> Contact
                          </Button>
                       </a>
                    </div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
