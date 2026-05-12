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

    // Fetch all user orders
    const qOrders = query(collection(db, 'orders'), where('userId', '==', user.uid));
    const unsubscribeOrders = onSnapshot(qOrders, async (snap) => {
      const allOrders = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      
      setOrders(allOrders);

      // Extract approved books
      const bookOrders = allOrders.filter(o => o.itemType === 'book' && o.status === 'approved');
      const booksWithDetails = await Promise.all(bookOrders.map(async (order: any) => {
        const bookSnap = await getDoc(doc(db, 'books', order.itemId));
        return bookSnap.exists() ? { ...order, ...bookSnap.data() } : order;
      }));
      setMyBooks(booksWithDetails);

      // Extract approved live classes
      const liveClassOrders = allOrders.filter(o => o.itemType === 'live_class' && o.status === 'approved');
      const liveClassesDetails = await Promise.all(liveClassOrders.map(async (order: any) => {
        const docSnap = await getDoc(doc(db, 'live_classes', order.itemId));
        return docSnap.exists() ? { ...order, ...docSnap.data() } : order;
      }));
      setMyLiveClasses(liveClassesDetails);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    const qNotifs = query(collection(db, 'notifications'), where('userId', '==', user.uid));
    const unsubscribeNotifs = onSnapshot(qNotifs, (snap) => {
      const notifs = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setNotifications(notifs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
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
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'progress');
    });

    return () => {
      unsubscribe();
      unsubscribeCerts();
      unsubscribeOrders();
      unsubscribeNotifs();
    };
  }, [user]);

  const headerSection = (
    <header className="mb-10">
      <h2 className="text-2xl font-bold">Assalamu Alaikum, {userData?.name || user?.displayName || 'Student'}!</h2>
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
            userName={printingCert.userName || userData?.name || user?.displayName || 'Student'}
            courseTitle={printingCert.courseTitle}
            issueDate={printingCert.issuedAt?.toDate ? printingCert.issuedAt.toDate().toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
            certificateId={`${printingCert.courseId?.slice(0,8)}-${user?.uid?.slice(0,8)}`}
            onClose={() => setPrintingCert(null)}
          />
        </div>
      )}

      {/* Sidebar - Mobile: Horizontal list, Desktop: Sidebar */}
      <aside className="bg-white border-b md:border-b-0 md:border-r border-gray-100 w-full md:w-64 shrink-0 px-4 py-4 md:py-8 sticky top-0 md:static z-30">
        <div className="hidden md:block mb-10 px-2">
           <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Main Menu</h2>
        </div>
        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar pb-1 md:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-black text-white shadow-xl shadow-black/20 transform scale-[1.02]" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-black"
              )}
            >
              <tab.icon size={18} />
              {tab.name}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-10">
        {headerSection}

        {loading ? (
          <div className="space-y-8">
             <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-4 animate-pulse">
                     <div className="w-24 h-3 bg-gray-100 rounded-full"></div>
                     <div className="w-16 h-8 bg-gray-100 rounded-full"></div>
                  </div>
                ))}
             </div>
             <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm h-64 animate-pulse">
                <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex justify-between">
                   <div className="w-40 h-6 bg-gray-200 rounded-full"></div>
                   <div className="w-24 h-6 bg-gray-200 rounded-full"></div>
                </div>
                <div className="p-8 space-y-4">
                   <div className="w-full h-20 bg-gray-50 rounded-2xl"></div>
                   <div className="w-full h-20 bg-gray-50 rounded-2xl"></div>
                </div>
             </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                    {[
                      { label: 'Courses', value: myCourses.length.toString(), color: 'bg-blue-50 text-blue-600' },
                      { label: 'Live Classes', value: myLiveClasses.length.toString(), color: 'bg-red-50 text-red-600' },
                      { label: 'Library Books', value: myBooks.length.toString(), color: 'bg-amber-50 text-amber-600' },
                      { label: 'Certificates', value: certificates.length.toString(), color: 'bg-green-50 text-green-600' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[2px] mb-3 group-hover:text-black transition-colors">{stat.label}</p>
                        <p className="text-4xl font-black tracking-tight">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                      <h3 className="font-bold text-lg">Continue Learning</h3>
                      <Link to="/courses">
                        <Button variant="ghost" size="sm" className="bg-white">Browse More</Button>
                      </Link>
                    </div>
                    <div className="p-8">
                      {myCourses.length === 0 && (
                        <div className="text-center py-16 px-4">
                           <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-gray-300">
                              <BookOpen size={32} />
                           </div>
                           <h4 className="text-lg font-bold mb-2">No Courses Enrolled</h4>
                           <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">Start your learning journey today by exploring our hand-picked courses.</p>
                           <Link to="/courses">
                              <Button size="md">Explore Catalog</Button>
                           </Link>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        {myCourses.filter(c => c.progress > 0 && c.progress < 100).map(course => (
                          <div key={course.id} className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-[24px] border border-gray-50 bg-gray-50/50 hover:bg-white hover:border-gray-100 hover:shadow-sm transition-all duration-300">
                             <div className="w-full sm:w-40 aspect-video rounded-xl overflow-hidden shadow-sm shrink-0">
                               <img src={getThumbnailUrl(course.image)} alt={course.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                             </div>
                             <div className="flex-grow w-full">
                                <h4 className="font-bold text-lg mb-3 tracking-tight">{course.title}</h4>
                                <div className="w-full h-2.5 bg-gray-200 rounded-full mb-3 overflow-hidden">
                                   <div className="h-full bg-black rounded-full transition-all duration-1000" style={{ width: `${course.progress}%` }}></div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{course.progress}% completed</p>
                                  <span className="text-[10px] px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-bold uppercase">Active</span>
                                </div>
                             </div>
                             <Link to={`/watch/${course.courseId || course.id}`}>
                               <Button size="md">Continue</Button>
                             </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
               </div>
            )}

            {activeTab === 'courses' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 font-sans">
                   {myCourses.map(course => (
                      <div key={course.id} className="relative group">
                         <Card 
                            title={course.title} 
                            image={course.image}
                            buttonText={course.progress === 100 ? "REVIEW" : (course.progress > 0 ? "CONTINUE" : "START")}
                            description={`${course.progress || 0}% Completed`}
                            className="bg-white border-gray-100 shadow-sm"
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
                     <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-[32px] border border-dashed border-gray-200">
                        <BookOpen size={48} className="mx-auto mb-6 opacity-20" />
                        <h4 className="text-black font-bold mb-2">No courses found</h4>
                        <p className="mb-6">You haven't enrolled in any courses yet.</p>
                        <Link to="/courses">
                          <Button variant="outline">Explore Courses</Button>
                        </Link>
                     </div>
                   )}
                </div>
              </div>
            )}

            {activeTab === 'live-classes' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {myLiveClasses.map(liveClass => (
                    <div key={liveClass.id} className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300">
                      <div className="aspect-video relative">
                        <img src={getThumbnailUrl(liveClass.thumbnail)} alt={liveClass.title} className="w-full h-full object-cover" />
                        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <Video size={12} />
                          Live Class
                        </div>
                      </div>
                      <div className="p-6 flex flex-col flex-grow">
                        <h4 className="font-bold text-lg mb-4">{liveClass.title || liveClass.itemTitle}</h4>
                        <div className="mt-auto pt-4 border-t border-gray-50 text-sm">
                          {liveClass.startTime && liveClass.meetingLink ? (
                            <LiveCountdown startTime={liveClass.startTime} meetingLink={liveClass.meetingLink} />
                          ) : (
                            <p className="text-gray-400 text-center py-4 bg-gray-50 rounded-xl">Session details pending</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {myLiveClasses.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-[32px] border border-dashed border-gray-200">
                      <Video size={48} className="mx-auto mb-6 opacity-20" />
                      <h4 className="text-black font-bold mb-2">No active live classes</h4>
                      <p className="mb-6">You haven't enrolled in any upcoming live sessions.</p>
                      <Link to="/courses?type=live">
                        <Button variant="outline">Browse Live Sessions</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'library' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  {myBooks.map(book => (
                    <div key={book.id} className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300">
                      <div className="aspect-[3/4] relative bg-gray-50 p-4 shrink-0">
                        <img src={getThumbnailUrl(book.coverImage || book.thumbnail)} alt={book.title || book.itemTitle} className="w-full h-full object-cover rounded-xl shadow-md" />
                      </div>
                      <div className="p-6 flex flex-col flex-grow text-center">
                        <h4 className="font-bold text-lg mb-2">{book.title || book.itemTitle}</h4>
                        {book.author && <p className="text-sm text-gray-500 mb-6">{book.author}</p>}
                        <div className="mt-auto">
                          {book.fileUrl || book.pdfFile || book.downloadUrl ? (
                            <a href={book.fileUrl || book.pdfFile || getDownloadUrl(book.downloadUrl)} target="_blank" rel="noreferrer" className="block w-full">
                              <Button fullWidth className="gap-2 shrink-0">
                                {(book.fileUrl || book.pdfFile) ? (
                                  <><BookOpen size={18} /> Read Book</>
                                ) : (
                                  <><Download size={18} /> Download Asset</>
                                )}
                              </Button>
                            </a>
                          ) : book.status === 'approved' ? (
                            <Button fullWidth variant="outline" className="gap-2 shrink-0 text-gray-400 border-gray-200" disabled>
                              Content Unavailable
                            </Button>
                          ) : (
                            <Button fullWidth variant="outline" className="gap-2 shrink-0 text-gray-400 border-gray-200" disabled>
                              Processing...
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {myBooks.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-[32px] border border-dashed border-gray-200">
                      <Bookmark size={48} className="mx-auto mb-6 opacity-20" />
                      <h4 className="text-black font-bold mb-2">Library is empty</h4>
                      <p className="mb-6">You haven't purchased any books or materials yet.</p>
                      <Link to="/courses">
                        <Button variant="outline">Browse Materials</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="max-w-2xl space-y-4 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <h3 className="text-xl font-black mb-8 tracking-tight">Recent Alerts</h3>
                 <div className="space-y-4">
                   {notifications.map(notif => (
                      <div key={notif.id} className={cn(
                        "p-8 rounded-[28px] border transition-all duration-300",
                        notif.read 
                          ? "bg-white border-gray-100 shadow-sm" 
                          : "bg-black text-white shadow-xl shadow-black/20"
                      )}>
                         <div className="flex gap-6">
                            <div className={cn(
                              "w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0 shadow-lg transition-transform hover:scale-110",
                              notif.read ? "bg-gray-50 text-black border border-gray-100" : "bg-white/10 text-white border border-white/10"
                            )}>
                               <Bell size={24} />
                            </div>
                            <div>
                               <h4 className="font-bold text-lg mb-2 tracking-tight">{notif.title}</h4>
                               <p className={cn(
                                 "text-sm mb-4 leading-relaxed",
                                 notif.read ? "text-gray-500" : "text-white/70"
                               )}>{notif.message}</p>
                               <p className={cn(
                                 "text-[10px] font-black uppercase tracking-[2px]",
                                 notif.read ? "text-gray-300" : "text-white/40"
                               )}>
                                 {notif.createdAt?.toDate?.().toLocaleString() || 'Just now'}
                               </p>
                            </div>
                         </div>
                      </div>
                   ))}
                 </div>
                 {notifications.length === 0 && (
                   <div className="py-24 text-center text-gray-400 bg-white rounded-[32px] border border-dashed border-gray-200">
                      <div className="w-20 h-20 bg-gray-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 opacity-30">
                        <BellOff size={32} />
                      </div>
                      <h4 className="text-black font-bold mb-2">Inbox is empty</h4>
                      <p>Assignments and class alerts will appear here.</p>
                   </div>
                 )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="max-w-4xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <h3 className="text-xl font-black tracking-tight">Order History</h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                       <Info size={14} className="text-blue-500" /> Manual approvals: 1-6 hours.
                    </div>
                 </div>
                 {orders.map(order => (
                    <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-8 bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                       <div className="flex items-center gap-6">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                            order.itemType === 'course' ? "bg-blue-50 text-blue-500" : "bg-purple-50 text-purple-500"
                          )}>
                             {order.itemType === 'course' ? <BookOpen size={24} /> : <Bookmark size={24} />}
                          </div>
                          <div>
                             <h4 className="font-bold text-base mb-1 tracking-tight">{order.itemTitle}</h4>
                             <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {order.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'} 
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                {order.paymentMethod || 'Manual'}
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center justify-between sm:text-right gap-8 sm:gap-4 border-t sm:border-t-0 pt-4 sm:pt-0">
                          <div>
                             <p className="font-black text-xl mb-1">৳{order.amount}</p>
                             <span className={cn(
                                "text-[10px] font-black uppercase px-3 py-1 rounded-full border",
                                order.status === 'approved' ? "bg-green-50 text-green-600 border-green-100" : 
                                order.status === 'rejected' ? "bg-red-50 text-red-600 border-red-100" : 
                                "bg-amber-50 text-amber-600 border-amber-100"
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
              <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-10 rounded-[32px] shadow-sm border border-gray-100 relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-full h-2 bg-black opacity-5" />
                   <div className="flex flex-col md:flex-row items-center gap-8 font-sans">
                      <div className="w-32 h-32 rounded-[40px] bg-gray-50 border-4 border-white shadow-xl flex items-center justify-center text-4xl shrink-0 font-black text-black">
                         {userData?.name?.[0] || user?.displayName?.[0] || 'S'}
                      </div>
                      <div className="text-center md:text-left">
                        <h3 className="text-3xl font-black mb-1">{userData?.name || user?.displayName || 'Student'}</h3>
                        <p className="text-lg text-gray-400 font-medium mb-4">{userData?.email || user?.email}</p>
                        <div className="flex items-center justify-center md:justify-start gap-4">
                          <div className="text-[10px] uppercase font-bold tracking-[2px] text-[#0EA5E9] bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                            Verified {userData?.role}
                          </div>
                          <div className="text-[10px] uppercase font-bold tracking-[2px] text-green-600 bg-green-50 px-4 py-1.5 rounded-full border border-green-100">
                            {myCourses.length} Courses
                          </div>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[32px] shadow-sm border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[2px] mb-8">Personal Information</h4>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                        <input type="text" defaultValue={userData?.name || user?.displayName || ''} className="w-full px-6 py-4 bg-gray-50 rounded-2xl focus:outline-none border border-gray-100 transition-all focus:bg-white focus:ring-1 focus:ring-black/5" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                        <input type="email" value={userData?.email || user?.email || ''} disabled className="w-full px-6 py-4 bg-gray-100 border border-transparent text-gray-400 rounded-2xl focus:outline-none cursor-not-allowed" />
                      </div>
                      <Button fullWidth size="lg">Save Changes</Button>
                    </div>
                  </div>

                  {certificates.length > 0 && (
                    <div className="bg-white p-10 rounded-[32px] shadow-sm border border-gray-100">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[2px] mb-8 flex items-center gap-2">
                        <Award size={14} className="text-black" />
                        Professional Badges
                      </h4>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                        {certificates.map(cert => (
                          <div key={cert.id} className="p-6 bg-gray-50/50 border border-gray-100 rounded-2xl flex flex-col gap-4 group hover:bg-white hover:shadow-md transition-all duration-300">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-white shadow-sm border border-gray-100 text-[#0EA5E9] rounded-2xl flex items-center justify-center shrink-0">
                                <Award size={28} />
                              </div>
                              <div className="font-sans overflow-hidden">
                                <h5 className="font-bold text-sm tracking-tight truncate">{cert.courseTitle}</h5>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight opacity-60">Verified Achievement</p>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              className="w-full text-xs py-3 rounded-xl border-gray-200"
                              onClick={() => setPrintingCert(cert)}
                            >
                              View PDF Certificate
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
