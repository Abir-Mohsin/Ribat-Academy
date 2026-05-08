import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, limit } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { cn } from '@/src/lib/utils';

export function NotificationCenter() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-500" size={16} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={16} />;
      default: return <Info className="text-blue-500" size={16} />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-black hover:bg-gray-50 rounded-full transition-all"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
            >
              <header className="p-4 border-b border-gray-50 flex items-center justify-between">
                <h4 className="font-bold">Notifications</h4>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-black">
                  <X size={16} />
                </button>
              </header>

              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="animate-spin mx-auto text-gray-300" size={24} />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="mx-auto text-gray-200 mb-2" size={32} />
                    <p className="text-xs text-gray-400">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={cn(
                        "p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3",
                        !n.read ? "bg-blue-50/30" : ""
                      )}
                    >
                      <div className="mt-1">{getIcon(n.type)}</div>
                      <div className="flex-grow">
                        <p className={cn("text-sm font-bold", !n.read ? "text-blue-900" : "text-gray-900")}>
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-gray-300 mt-2 font-medium">
                          {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>

              <footer className="p-3 bg-gray-50 text-center">
                <button className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors">
                  Clear All
                </button>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
