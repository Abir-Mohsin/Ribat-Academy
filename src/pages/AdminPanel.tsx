import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { 
  BarChart, 
  BookOpen, 
  Book as BookIcon, 
  Users, 
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Search,
  UserCheck,
  UserX,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Video,
  MessageSquare,
  Info,
  Star,
  Award,
  Menu
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/Button';
import { collection, getDocs, updateDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { CourseManager } from '@/src/components/admin/CourseManager';
import { BookManager } from '@/src/components/admin/BookManager';
import { OrdersManager } from '@/src/components/admin/OrdersManager';
import { TestimonialManager } from '@/src/components/admin/TestimonialManager';
import { VideoReviewManager } from '@/src/components/admin/VideoReviewManager';
import { SiteContentManager } from '@/src/components/admin/SiteContentManager';
import { LiveClassManager } from '@/src/components/admin/LiveClassManager';
import { FeatureManager } from '@/src/components/admin/FeatureManager';
import { QuizManager } from '@/src/components/admin/QuizManager';
import { CertificateDesigner } from '@/src/components/admin/CertificateDesigner';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState('stats');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingApprovals: 0,
    activeStudents: 0,
    coursesLive: 0,
  });
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [coursesCount, setCoursesCount] = useState(0);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    setStats(prev => ({ ...prev, coursesLive: coursesCount + liveCount }));
  }, [coursesCount, liveCount]);

  useEffect(() => {
    // Real-time Stats Listeners
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const allOrders = snapshot.docs.map(doc => doc.data());
      const approvedOrders = allOrders.filter((o: any) => o.status === 'approved');
      const pendingOrders = allOrders.filter((o: any) => o.status === 'pending');
      
      const total = approvedOrders.reduce((acc, curr: any) => acc + (curr.amount || curr.price || 0), 0);
      const uniqueStudents = new Set(approvedOrders.map((o: any) => o.userId)).size;
      setStats(prev => ({ 
        ...prev, 
        totalSales: total,
        pendingApprovals: pendingOrders.length,
        activeStudents: uniqueStudents
      }));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      // Just keep for users table, active students now tracked via orders
    });

    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      const count = snapshot.docs.filter(doc => doc.data().status === 'published').length;
      setCoursesCount(count);
    });

    const unsubLive = onSnapshot(collection(db, 'live_classes'), (snapshot) => {
      const count = snapshot.docs.filter(doc => doc.data().status === 'published').length;
      setLiveCount(count);
    });

    return () => {
      unsubOrders();
      unsubUsers();
      unsubCourses();
      unsubLive();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      setLoadingUsers(true);
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoadingUsers(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
        setLoadingUsers(false);
      });
      return () => unsub();
    }
  }, [activeTab]);

  const fetchUsers = () => {
    // This is now handled by onSnapshot, but we can keep it as a no-op or remove it
  };

  const updateUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'deactivated' ? 'active' : 'deactivated';
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'reactivate' : 'deactivate'} this account?`)) return;

    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const menuItems = [
    { id: 'stats', name: 'Overview', icon: BarChart },
    { id: 'courses', name: 'Manage Courses', icon: BookOpen },
    { id: 'live-classes', name: 'Live Classes', icon: Video },
    { id: 'books', name: 'Manage Books', icon: BookIcon },
    { id: 'quizzes', name: 'Quizzes & Assessments', icon: CheckCircle },
    { id: 'payments', name: 'Approve Payments', icon: CreditCard },
    { id: 'testimonials', name: 'Text Reviews', icon: MessageSquare },
    { id: 'video-reviews', name: 'Video Reviews', icon: Video },
    { id: 'about', name: 'Site Editor', icon: Info },
    { id: 'features', name: 'Home Features', icon: Star },
    { id: 'certificates', name: 'Certificates', icon: Award },
    { id: 'users', name: 'User Management', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-black text-white shrink-0 py-10 flex flex-col transform transition-transform duration-500 ease-out lg:relative lg:transform-none lg:ml-6 lg:my-6 lg:rounded-[40px] shadow-2xl shadow-black/40",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="px-8 mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center font-black text-2xl group-hover:rotate-6 transition-transform duration-500">R</div>
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[3px] leading-none mb-1">Academy</p>
              <p className="text-sm font-black text-white tracking-widest leading-none">CONSOLE</p>
            </div>
          </div>
          <button className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white/40 active:scale-90 transition-transform" onClick={() => setIsSidebarOpen(false)}>
            <XCircle size={24} />
          </button>
        </div>
        
        <nav className="flex-grow overflow-y-auto no-scrollbar pb-20 px-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all duration-300 group",
                activeTab === item.id 
                  ? "bg-white text-black shadow-xl shadow-white/10 scale-[1.02]" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={20} className={cn("transition-transform duration-500", activeTab === item.id ? "scale-110" : "group-hover:scale-110")} />
              <span className="text-xs font-black uppercase tracking-widest">{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-full lg:max-w-[calc(100vw-312px)] h-screen overflow-y-auto p-4 md:p-8 lg:p-12 font-sans">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-6">
            <button
               className="lg:hidden w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 shadow-sm text-black active:scale-90 transition-transform"
               onClick={() => setIsSidebarOpen(true)}
            >
               <Menu size={24} />
            </button>
            <div>
              <h1 className="text-4xl md:text-5xl font-black capitalize tracking-tight mb-2">{activeTab.replace('-', ' ')}</h1>
              <p className="text-gray-400 text-sm font-medium">Internal Command Center • {new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>
          {activeTab === 'stats' && (
             <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-100 w-fit">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-green-700">Live Status: Operational</span>
             </div>
          )}
        </header>

        {activeTab === 'stats' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-700">
              {[
                { label: 'Total Revenue', value: `৳${stats.totalSales || 0}`, color: 'text-black', sub: 'Gross Volume' },
                { label: 'Queue', value: stats.pendingApprovals || 0, color: 'text-amber-500', sub: 'Awaiting Review' },
                { label: 'Active Minds', value: stats.activeStudents || 0, color: 'text-blue-500', sub: 'Lifetime Learners' },
                { label: 'Catalog', value: stats.coursesLive || 0, color: 'text-gray-400', sub: 'Published Assets' },
              ].map((s, i) => (
                <div key={i} className="bg-white p-10 rounded-[32px] shadow-sm border border-gray-50 flex flex-col group hover:shadow-xl hover:shadow-black/5 transition-all duration-500">
                   <div className="flex items-center justify-between mb-8">
                     <p className="text-[10px] font-black text-gray-300 uppercase tracking-[3px]">{s.label}</p>
                     <div className="w-2 h-2 rounded-full bg-gray-100 group-hover:bg-black transition-colors" />
                   </div>
                   <p className={cn("text-4xl font-black tracking-tight mb-2", s.color)}>{s.value}</p>
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{s.sub}</p>
                </div>
              ))}
           </div>
        )}

        {/* Content Table for Courses/Books */}
        {activeTab === 'courses' && <CourseManager />}
        {activeTab === 'live-classes' && <LiveClassManager />}
        {activeTab === 'books' && <BookManager />}
        {activeTab === 'quizzes' && <QuizManager />}

        {activeTab === 'users' && (
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-50 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="text" 
                  placeholder="Query member database..." 
                  className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 font-bold text-sm transition-all placeholder:text-gray-300" 
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="md" onClick={fetchUsers} disabled={loadingUsers} className="rounded-2xl px-10 h-14 bg-white">
                {loadingUsers ? <Loader2 className="animate-spin" size={18} /> : "REFRESH RECORDS"}
              </Button>
            </div>
            
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50/10 text-[10px] font-black text-gray-300 uppercase tracking-[2px] border-b border-gray-50">
                    <th className="px-8 py-6">Identity</th>
                    <th className="px-8 py-6">Privilege</th>
                    <th className="px-8 py-6">Registration</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className={cn("hover:bg-gray-50/50 transition-all duration-300 group", user.status === 'deactivated' && "opacity-40 grayscale")}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center font-black text-sm uppercase group-hover:scale-105 transition-transform">
                            {user.name?.[0] || user.email?.[0]}
                          </div>
                          <div>
                            <p className="font-black text-black tracking-tight">{user.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 tracking-wide">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={cn(
                          "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          user.role === 'admin' ? "bg-black text-white border-black" : "bg-white text-gray-400 border-gray-100"
                        )}>
                          {user.role === 'admin' ? <Shield size={12} /> : <Users size={12} />}
                          {user.role}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border",
                          user.status === 'deactivated' ? "bg-red-50 text-red-500 border-red-100" : "bg-green-50 text-green-600 border-green-100"
                        )}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => updateUserRole(user.id, user.role)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-black hover:text-white transition-all shadow-sm"
                            title={user.role === 'admin' ? "Demote to Student" : "Promote to Admin"}
                          >
                            {user.role === 'admin' ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                          </button>
                          <button 
                            onClick={() => toggleUserStatus(user.id, user.status)}
                            className={cn(
                              "w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm",
                              user.status === 'deactivated' ? "bg-green-50 text-green-500 hover:bg-green-500 hover:text-white" : "bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white"
                            )}
                            title={user.status === 'deactivated' ? "Reactivate Account" : "Deactivate Account"}
                          >
                            {user.status === 'deactivated' ? <UserCheck size={18} /> : <UserX size={18} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && !loadingUsers && (
              <div className="p-20 text-center text-gray-500">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                <p>No users found matching your search.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'payments' && (
          <OrdersManager />
        )}
        {activeTab === 'testimonials' && (
          <TestimonialManager />
        )}
        {activeTab === 'video-reviews' && (
          <VideoReviewManager />
        )}
        {activeTab === 'about' && (
          <SiteContentManager />
        )}
        {activeTab === 'features' && (
          <FeatureManager />
        )}
        {activeTab === 'certificates' && (
          <CertificateDesigner />
        )}
      </main>
    </div>
  );
}
