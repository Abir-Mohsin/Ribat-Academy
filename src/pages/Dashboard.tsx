import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { LayoutDashboard, BookOpen, User, Settings, CreditCard, Loader2, Award, Download, ExternalLink, Bookmark, Bell, BellOff, Info, CheckCircle, Clock, Video, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { getDownloadUrl, getThumbnailUrl } from '@/src/lib/drive';

import { CertificateView } from '@/src/components/CertificateView';

function LiveCountdown({ startTime, meetingLink }: { startTime: string, meetingLink: string }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const target = new Date(startTime).getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;
      
      if (diff <= 0) {
        // If it started less than 3 hours ago, consider it live
        if (Math.abs(diff) < 3 * 60 * 60 * 1000) {
          setIsLive(true);
        } else {
          setIsLive(false);
        }
        setTimeLeft(null);
        return;
      }
      
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({ d, h, m, s });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [startTime]);

  if (isLive) {
    return (
      <div className="flex flex-col items-center gap-4 bg-red-50 p-6 rounded-2xl border border-red-100">
        <div className="flex items-center gap-2 text-red-600 font-bold animate-pulse">
           <span className="w-2 h-2 rounded-full bg-red-600" />
           LIVE NOW
        </div>
        <p className="text-sm text-center text-gray-600">The session has started! Join now to participate in real-time.</p>
        <a href={meetingLink} target="_blank" rel="noreferrer" className="w-full">
           <Button className="w-full gap-2 bg-red-600 hover:bg-red-700">
              <Video size={18} /> Join Class & Play
           </Button>
        </a>
      </div>
    );
  }

  if (!timeLeft) {
    return (
       <div className="p-6 rounded-2xl bg-gray-50 text-center text-gray-400 text-sm">
         This class has ended or the link is not yet available.
       </div>
    );
  }

  return (
    <div className="space-y-4">
       <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
          {[
            { label: 'Days', val: timeLeft.d },
            { label: 'Hrs', val: timeLeft.h },
            { label: 'Mins', val: timeLeft.m },
            { label: 'Secs', val: timeLeft.s }
          ].map((unit, i) => (
            <div key={i} className="text-center">
               <p className="text-xl font-bold text-black leading-none">{unit.val.toString().padStart(2, '0')}</p>
               <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{unit.label}</p>
            </div>
          ))}
       </div>
       <Button variant="outline" className="w-full gap-2 border-gray-200 cursor-not-allowed opacity-50" disabled>
          <Clock size={18} /> Link unlocks at start time
       </Button>
    </div>
  );
}

export function Dashboard() {
  const { userData, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [myLiveClasses, setMyLiveClasses] = useState<any[]>([]);
  const [myBooks, setMyBooks] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [printingCert, setPrintingCert] = useState<any>(null);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'courses', name: 'Recorded Courses', icon: BookOpen },
    { id: 'live-classes', name: 'Live Classes', icon: Video },
    { id: 'library', name: 'My Library', icon: Bookmark },
    { id: 'notifications', name: 'Alerts', icon: Bell },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'profile', name: 'Profile & Achievements', icon: User },
  ];

  useEffect(() => {
    if (!user) return;

    // Fetch Certificates
    const qCerts = query(collection(db, 'certificates'), where('userId', '==', user.uid));
    const unsubscribeCerts = onSnapshot(qCerts, (snap) => {
      setCertificates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch approved books
    const qBooks = query(
      collection(db, 'orders'), 
      where('userId', '==', user.uid),
      where('itemType', '==', 'book'),
      where('status', '==', 'approved')
    );
    const unsubscribeBooks = onSnapshot(qBooks, async (snap) => {
      const ordersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const booksWithDetails = await Promise.all(ordersData.map(async (order: any) => {
        const bookSnap = await getDoc(doc(db, 'books', order.itemId));
        return bookSnap.exists() ? { ...order, ...bookSnap.data() } : order;
      }));
      setMyBooks(booksWithDetails);
    });

    // Fetch all orders
    const qOrders = query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(qOrders, async (snap) => {
      const allOrders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(allOrders);

      // Extract approved live classes
      const liveClassOrders = allOrders.filter((o: any) => o.itemType === 'live_class' && o.status === 'approved');
      const liveClassesDetails = await Promise.all(liveClassOrders.map(async (order: any) => {
        const docSnap = await getDoc(doc(db, 'live_classes', order.itemId));
        return docSnap.exists() ? { ...order, ...docSnap.data() } : order;
      }));
      setMyLiveClasses(liveClassesDetails);
    });

    const qNotifs = query(collection(db, 'notifications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribeNotifs = onSnapshot(qNotifs, (snap) => {
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Listen for real-time progress updates
    const q = query(collection(db, 'progress'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const progressData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch course details for each progress item
      const coursesWithDetails = await Promise.all(progressData.map(async (p: any) => {
        try {
          const courseSnap = await getDoc(doc(db, 'courses', p.courseId));
          if (courseSnap.exists()) {
             const data = courseSnap.data();
             return {
               ...p,
               title: data.title,
               image: data.thumbnail
             };
          }
        } catch (e) {
          console.error("Error fetching course details:", e);
        }
        return {
          ...p,
          title: `Course: ${p.courseId}`,
          image: 'https://images.unsplash.com/photo-1544640808-32ca72ac7f67?auto=format&fit=crop&q=80'
        };
      }));

      setMyCourses(coursesWithDetails);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'progress');
      setLoading(false);
    });

    return () => {
      unsubscribe();
      unsubscribeCerts();
      unsubscribeBooks();
      unsubscribeOrders();
      unsubscribeNotifs();
    };
  }, [user]);

  const headerSection = (
    <header className="mb-10">
      <h2 className="text-2xl font-bold">Assalamu Alaikum, {userData?.name}!</h2>
      <p className="text-gray-500">Welcome back to your learning journey.</p>
    </header>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Certificate Viewer Overlay */}
      {printingCert && (
        <div className="fixed inset-0 z-[200] bg-white overflow-y-auto pt-20">
          <div className="absolute top-6 right-6 z-[210]">
             <Button variant="outline" onClick={() => setPrintingCert(null)} className="rounded-full w-12 h-12 p-0">
               <X size={24} />
             </Button>
          </div>
          <CertificateView 
            userName={printingCert.userName || userData?.name}
            courseTitle={printingCert.courseTitle}
            issueDate={printingCert.issuedAt?.toDate ? printingCert.issuedAt.toDate().toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
            certificateId={`${printingCert.courseId?.slice(0,8)}-${user?.uid?.slice(0,8)}`}
            onClose={() => setPrintingCert(null)}
          />
        </div>
      )}

      {/* Sidebar - Mobile: Horizontal list, Desktop: Sidebar */}
      <aside className="bg-white border-r border-gray-100 w-full md:w-64 shrink-0 px-4 py-8">
        <div className="hidden md:block mb-10 px-2">
           <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Main Menu</h2>
        </div>
        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-black text-white shadow-lg shadow-black/10" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-black"
              )}
            >
              <tab.icon size={20} />
              {tab.name}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-10">
        {headerSection}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
             <Loader2 className="animate-spin mb-4" size={48} />
             <p>Loading your profile data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
               <div className="space-y-8">
                  {/* ... stats ... */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                    {[
                      { label: 'Courses', value: myCourses.length.toString() },
                      { label: 'Live Classes', value: myLiveClasses.length.toString() },
                      { label: 'Library Books', value: myBooks.length.toString() },
                      { label: 'Certificates', value: certificates.length.toString() },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">{stat.label}</p>
                        <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-bold">Continue Learning</h3>
                      <Button variant="ghost" size="sm">View All</Button>
                    </div>
                    <div className="p-6">
                      {myCourses.filter(c => c.progress > 0 && c.progress < 100).length === 0 && myCourses.length > 0 && (
                        <div className="text-center py-10 text-gray-400">
                           <p>You haven't started any course yet. Click on "My Courses" to start!</p>
                        </div>
                      )}
                      {myCourses.filter(c => c.progress > 0 && c.progress < 100).length === 0 && myCourses.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                           <p>No courses found. Explore our course catalog to get started!</p>
                        </div>
                      )}
                      {myCourses.filter(c => c.progress > 0 && c.progress < 100).map(course => (
                        <div key={course.id} className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border border-gray-50 bg-gray-50/30">
                           <img src={getThumbnailUrl(course.image)} alt={course.title} className="w-full sm:w-32 aspect-video object-cover rounded-lg" referrerPolicy="no-referrer" />
                           <div className="flex-grow w-full">
                              <h4 className="font-bold mb-2">{course.title}</h4>
                              <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
                                 <div className="h-full bg-[#0EA5E9] rounded-full transition-all duration-500" style={{ width: `${course.progress}%` }}></div>
                              </div>
                              <p className="text-xs text-gray-500">{course.progress}% completed</p>
                           </div>
                           <Link to={`/watch/${course.courseId || course.id}`}>
                             <Button size="sm">Continue</Button>
                           </Link>
                        </div>
                      ))}
                      {/* Show the first course if nothing is in progress */}
                      {myCourses.filter(c => c.progress > 0 && c.progress < 100).length === 0 && myCourses.length > 0 && (
                         <div key={myCourses[0].id} className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border border-gray-50 bg-gray-50/30">
                            <img src={getThumbnailUrl(myCourses[0].image)} alt={myCourses[0].title} className="w-full sm:w-32 aspect-video object-cover rounded-lg" referrerPolicy="no-referrer" />
                            <div className="flex-grow w-full">
                               <h4 className="font-bold mb-2">{myCourses[0].title}</h4>
                               <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
                                  <div className="h-full bg-[#0EA5E9] rounded-full transition-all duration-500" style={{ width: `${myCourses[0].progress || 0}%` }}></div>
                               </div>
                               <p className="text-xs text-gray-500">{myCourses[0].progress || 0}% completed</p>
                            </div>
                            <Link to={`/watch/${myCourses[0].courseId || myCourses[0].id}`}>
                              <Button size="sm">Start Learning</Button>
                            </Link>
                         </div>
                      )}
                    </div>
                  </div>
               </div>
            )}

            {activeTab === 'courses' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 font-sans">
                 {myCourses.map(course => (
                    <div key={course.id} className="relative group">
                       <Card 
                          title={course.title} 
                          image={course.image}
                          buttonText={course.progress === 100 ? "Review" : (course.progress > 0 ? "Continue" : "Start")}
                          description={`${course.progress || 0}% Completed`}
                       />
                       <Link 
                        to={`/watch/${course.courseId || course.id}`} 
                        className="absolute inset-0 z-10"
                        title={course.title}
                       >
                         <span className="sr-only">Go to course</span>
                       </Link>
                    </div>
                 ))}
                 {myCourses.length === 0 && (
                   <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                      <BookOpen size={48} className="mx-auto mb-4 opacity-10" />
                      <p>You haven't enrolled in any courses yet.</p>
                      <Link to="/courses" className="mt-4 inline-block text-[#0EA5E9] hover:underline font-bold text-sm">Explore Courses</Link>
                   </div>
                 )}
              </div>
            )}

            {activeTab === 'live-classes' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-lg font-bold">Upcoming Live Sessions</h3>
                   <div className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                     {myLiveClasses.length} Enrolled
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {myLiveClasses.map(live => (
                    <div key={live.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group">
                       <div className="aspect-video relative overflow-hidden bg-gray-50">
                          <img src={getThumbnailUrl(live.thumbnail)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
                             <div className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-[2px] mb-2">
                                <Video size={14} className="text-[#0EA5E9]" />
                                Live Class Enrollment
                             </div>
                             <h4 className="text-white text-xl font-bold">{live.title}</h4>
                          </div>
                       </div>
                       <div className="p-6">
                          <LiveCountdown startTime={live.startTime} meetingLink={live.meetingLink} />
                       </div>
                    </div>
                  ))}
                  {myLiveClasses.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                       <Video size={48} className="mx-auto mb-4 opacity-10" />
                       <p>You haven't enrolled in any live classes yet.</p>
                       <Link to="/courses" className="mt-4 inline-block text-[#0EA5E9] hover:underline font-bold text-sm">Browse Live Classes</Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'library' && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 font-sans">
                 {myBooks.map(book => (
                    <div key={book.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm group hover:shadow-md transition-all">
                       <div className="aspect-[3/4] bg-gray-100 relative">
                          <img 
                            src={book.coverImage ? getThumbnailUrl(book.coverImage) : (book.image ? getThumbnailUrl(book.image) : 'https://images.unsplash.com/photo-1544640808-32ca72ac7f67?auto=format&fit=crop&q=80')} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          {book.bookType === 'pdf' && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 gap-2">
                               {book.fileUrl ? (
                                 <a 
                                    href={getDownloadUrl(book.fileUrl)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="w-full"
                                 >
                                    <Button variant="primary" size="sm" className="gap-2 w-full">
                                       <ExternalLink size={16} /> View PDF
                                    </Button>
                                 </a>
                               ) : (
                                 <span className="text-[10px] text-white bg-black/50 px-2 py-1 rounded">No link provided yet</span>
                               )}
                            </div>
                          )}
                          {book.bookType === 'hardcover' && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-bold uppercase shadow-lg">
                               Hardcover
                            </div>
                          )}
                       </div>
                       <div className="p-4">
                          <h4 className="font-bold text-sm line-clamp-1 mb-1">{book.title}</h4>
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{book.bookType}</span>
                             {book.bookType === 'pdf' && book.fileUrl && (
                               <a href={getDownloadUrl(book.fileUrl)} download className="text-[#0EA5E9] hover:text-blue-700 transition-colors">
                                  <Download size={14} />
                               </a>
                             )}
                          </div>
                       </div>
                    </div>
                 ))}
                 {myBooks.length === 0 && (
                   <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                      <Bookmark size={48} className="mx-auto mb-4 opacity-10" />
                      <p>Your library is empty. Purchased PDF books will appear here.</p>
                      <Link to="/books" className="mt-4 inline-block text-[#0EA5E9] hover:underline font-bold text-sm">Browse Books</Link>
                   </div>
                 )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="max-w-2xl space-y-4 font-sans">
                 <h3 className="text-lg font-bold mb-6">Recent Alerts</h3>
                 {notifications.map(notif => (
                    <div key={notif.id} className={cn(
                      "p-6 rounded-2xl border shadow-sm transition-all",
                      notif.read ? "bg-white border-gray-100" : "bg-blue-50/50 border-blue-100 ring-1 ring-blue-50"
                    )}>
                       <div className="flex gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                            notif.type === 'success' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                          )}>
                             <Bell size={20} />
                          </div>
                          <div>
                             <h4 className="font-bold text-sm mb-1">{notif.title}</h4>
                             <p className="text-sm text-gray-600 mb-2 leading-relaxed">{notif.message}</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                               {notif.createdAt?.toDate?.().toLocaleString() || 'Just now'}
                             </p>
                          </div>
                       </div>
                    </div>
                 ))}
                 {notifications.length === 0 && (
                   <div className="py-20 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                      <BellOff size={48} className="mx-auto mb-4 opacity-10" />
                      <p>No notifications yet.</p>
                   </div>
                 )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="max-w-4xl space-y-4 font-sans">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold">Recent Transactions</h3>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                       <Info size={14} /> Manual payments usually take 1-6 hours to approve.
                    </div>
                 </div>
                 {orders.map(order => (
                    <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                       <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            order.itemType === 'course' ? "bg-blue-50 text-blue-500" : "bg-purple-50 text-purple-500"
                          )}>
                             {order.itemType === 'course' ? <BookOpen size={24} /> : <Bookmark size={24} />}
                          </div>
                          <div>
                             <h4 className="font-bold text-sm">{order.itemTitle}</h4>
                             <p className="text-xs text-gray-400 flex items-center gap-2">
                               {order.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'} 
                               <span className="w-1 h-1 rounded-full bg-gray-300" />
                               {order.paymentMethod || 'Manual'}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center justify-between sm:text-right gap-4 sm:gap-0">
                          <div className="sm:hidden text-xs text-gray-400 font-bold uppercase tracking-widest">Status</div>
                          <div>
                             <p className="font-bold text-sm mb-1">${order.amount}</p>
                             <span className={cn(
                                "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                                order.status === 'approved' ? "bg-green-50 text-green-600" : 
                                order.status === 'rejected' ? "bg-red-50 text-red-600" : 
                                "bg-amber-50 text-amber-600"
                             )}>
                                {order.status}
                             </span>
                          </div>
                       </div>
                    </div>
                 ))}
                 {orders.length === 0 && (
                    <div className="py-20 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                       <CreditCard size={48} className="mx-auto mb-4 opacity-10" />
                       <p>No transactions found.</p>
                       <Link to="/courses" className="mt-4 inline-block text-[#0EA5E9] hover:underline font-bold text-sm">Browse Courses</Link>
                    </div>
                 )}
              </div>
            )}
            
            {activeTab === 'profile' && (
              <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                 <div className="flex items-center gap-6 mb-8 font-sans">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-3xl shrink-0 font-bold">
                       {userData?.name?.[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{userData?.name}</h3>
                      <p className="text-sm text-gray-500 font-medium">{userData?.email}</p>
                      <div className="mt-2 text-[10px] uppercase font-bold tracking-widest text-[#0EA5E9] bg-blue-50 px-2 py-0.5 rounded inline-block">
                        {userData?.role}
                      </div>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Full Name</label>
                      <input type="text" defaultValue={userData?.name} className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email Address</label>
                      <input type="email" value={userData?.email} disabled className="w-full px-4 py-3 bg-gray-100 text-gray-500 rounded-xl focus:outline-none border border-gray-100 cursor-not-allowed" />
                    </div>
                    <Button>Save Changes</Button>
                 </div>

                 {certificates.length > 0 && (
                    <div className="mt-12">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2 font-sans">
                        <Award size={14} className="text-[#0EA5E9]" />
                        My Certificates
                      </h4>
                      <div className="space-y-4">
                        {certificates.map(cert => (
                          <div key={cert.id} className="p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-100 text-[#0EA5E9] rounded-xl flex items-center justify-center">
                                <Award size={24} />
                              </div>
                              <div className="font-sans">
                                <h5 className="font-bold text-sm tracking-tight">{cert.courseTitle}</h5>
                                <p className="text-[10px] text-gray-400 font-medium tracking-tight">Issued on: {cert.issuedAt?.toDate ? cert.issuedAt.toDate().toLocaleDateString() : 'Long ago'}</p>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2 border-blue-100 text-[#0EA5E9] hover:bg-blue-50"
                              onClick={() => {
                                setPrintingCert(cert);
                              }}
                            >
                              <Award size={14} />
                              View & Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                 )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
