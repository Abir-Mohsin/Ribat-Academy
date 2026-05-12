import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Card } from '@/src/components/Card';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PaymentModal } from '@/src/components/PaymentModal';
import { useAuth } from '@/src/contexts/AuthContext';
import { cn } from '@/src/lib/utils';

export function Courses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState<'all' | 'recorded' | 'live'>(
    (searchParams.get('type') === 'live' ? 'live' : 'all') as any
  );
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const { user, signInWithGoogle } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Courses
        const coursesSnap = await getDocs(collection(db, 'courses'));
        const activeCourses = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })).filter(c => c.status !== 'draft');
        // Safely sort by createdAt using toMillis() if available
        setCourses(activeCourses.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        }));

        const liveSnap = await getDocs(collection(db, 'live_classes'));
        const activeLive = liveSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any, type: 'live_class' })).filter(c => c.status !== 'draft');
        setLiveClasses(activeLive.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
      } catch (error) {
        console.error("Error fetching data:", error);
        handleFirestoreError(error as Error, OperationType.GET, 'courses');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEnroll = (course: any) => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    setSelectedCourse(course);
  };

  const allItems = [
    ...courses.map(c => ({ ...c, type: 'course' })),
    ...liveClasses
  ];

  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeType === 'all' || 
                       (activeType === 'recorded' && item.type === 'course') ||
                       (activeType === 'live' && item.type === 'live_class');
    return matchesSearch && matchesType;
  });

  return (
    <div className="pt-24 pb-32 px-6 bg-white font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100 mb-6 mx-auto md:mx-0">
            <span className="w-2 h-2 rounded-full bg-[#0EA5E9]" />
            <span className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Knowledge Catalog</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-12 tracking-tight">Invest in Your <span className="text-gray-300">Akhira.</span></h1>
          
          <div className="flex flex-col md:flex-row gap-8 items-center bg-gray-50/50 p-2 rounded-[32px] border border-gray-100 backdrop-blur-xl">
             <div className="flex bg-white shadow-xl shadow-black/5 p-1.5 rounded-[24px] overflow-x-auto no-scrollbar w-full md:w-auto">
                {[
                  { id: 'all', name: 'Infinite' },
                  { id: 'recorded', name: 'Recorded' },
                  { id: 'live', name: 'Live' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveType(tab.id as any)}
                    className={cn(
                      "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all duration-300 whitespace-nowrap",
                      activeType === tab.id ? "bg-black text-white shadow-2xl shadow-black/20" : "text-gray-400 hover:text-black"
                    )}
                  >
                    {tab.name}
                  </button>
                ))}
             </div>
             
             <div className="relative flex-grow w-full md:w-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <input
                type="text"
                placeholder="Search assets..."
                className="w-full pl-16 pr-6 py-5 bg-white border border-gray-100 rounded-[24px] focus:outline-none focus:ring-4 focus:ring-black/5 font-bold transition-all text-sm placeholder:text-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="aspect-[3/4.2] bg-gray-50 rounded-[40px] animate-pulse relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-t from-gray-100 to-transparent opacity-50" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {filteredItems.map(item => (
              <Card 
                key={item.id} 
                {...item}
                image={item.thumbnail}
                subtitle={item.type === 'live_class' ? `STREAMING AT: ${new Date(item.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : item.instructor?.name}
                badge={item.type === 'live_class' ? 'LIVE NOW' : 'MASTERCLASS'}
                onClick={() => handleEnroll(item)}
                secondaryButtonText="DETAILS"
                onSecondaryClick={() => navigate(`/courses/${item.id}`)}
              />
            ))}
          </div>
        )}
        
        {!loading && filteredItems.length === 0 && (
          <div className="py-40 text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 border border-gray-100">
               <Search className="text-gray-200" size={40} />
            </div>
            <h3 className="text-2xl font-black mb-2">No matching assets</h3>
            <p className="text-gray-400 font-medium">Try broadening your search criteria.</p>
          </div>
        )}
      </div>

      {selectedCourse && (
        <PaymentModal 
          isOpen={!!selectedCourse} 
          onClose={() => setSelectedCourse(null)} 
          item={{ ...selectedCourse, type: 'course' }}
        />
      )}
    </div>
  );
}
