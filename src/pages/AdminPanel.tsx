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
  Award
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
  
  // Track counts separately for combining
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
      {/* Sidebar */}
      <aside className="w-16 lg:w-64 bg-black text-white shrink-0 py-8 flex flex-col">
        <div className="px-4 lg:px-8 mb-10 overflow-hidden">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white text-black rounded flex items-center justify-center font-bold">R</div>
          <p className="hidden lg:block mt-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Admin Console</p>
        </div>
        
        <nav className="flex-grow">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 lg:px-8 py-4 transition-all duration-200 border-l-4",
                activeTab === item.id 
                  ? "bg-white/10 border-white text-white" 
                  : "border-transparent text-gray-500 hover:text-white"
              )}
            >
              <item.icon size={20} />
              <span className="hidden lg:block text-sm font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 lg:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h1 className="text-3xl font-bold capitalize">{activeTab.replace('-', ' ')}</h1>
            <p className="text-gray-500 mt-1">Manage your academy contents and operations.</p>
          </div>
        </header>

        {activeTab === 'stats' && (
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Sales', value: `৳${stats.totalSales || 0}`, color: 'text-green-600' },
                { label: 'Pending Approvals', value: stats.pendingApprovals || 0, color: 'text-amber-600' },
                { label: 'Active Students', value: stats.activeStudents || 0, color: 'text-blue-600' },
                { label: 'Courses Live', value: stats.coursesLive || 0, color: 'text-black' },
              ].map((s, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                   <p className="text-xs font-bold text-gray-400 uppercase mb-2">{s.label}</p>
                   <p className={cn("text-3xl font-bold", s.color)}>{s.value}</p>
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
              <Search className="text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search users by name or email..." 
                className="bg-transparent text-sm focus:outline-none w-full" 
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loadingUsers}>
                {loadingUsers ? <Loader2 className="animate-spin" size={16} /> : "Reload"}
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className={cn("hover:bg-gray-50/50 transition-colors", user.status === 'deactivated' && "opacity-60")}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                            {user.name?.[0] || user.email?.[0]}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          user.role === 'admin' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {user.role === 'admin' ? <Shield size={12} /> : <Users size={12} />}
                          {user.role}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                          user.status === 'deactivated' ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        )}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateUserRole(user.id, user.role)}
                            className="p-2 text-gray-400 hover:text-black transition-colors"
                            title={user.role === 'admin' ? "Demote to Student" : "Promote to Admin"}
                          >
                            {user.role === 'admin' ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                          </button>
                          <button 
                            onClick={() => toggleUserStatus(user.id, user.status)}
                            className={cn(
                              "p-2 transition-colors",
                              user.status === 'deactivated' ? "text-green-400 hover:text-green-600" : "text-gray-400 hover:text-red-500"
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
