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
    <div className="pt-20 pb-32 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-6">Our Courses</h1>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-grow space-y-4">
               <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
                  {[
                    { id: 'all', name: 'All Assets' },
                    { id: 'recorded', name: 'Recorded Courses' },
                    { id: 'live', name: 'Live Classes' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveType(tab.id as any)}
                      className={cn(
                        "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                        activeType === tab.id ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      {tab.name}
                    </button>
                  ))}
               </div>
               <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search for courses or live sessions..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl font-medium hover:bg-gray-100 transition-colors h-fit self-end md:self-auto">
              <SlidersHorizontal size={20} />
              Filter
            </button>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 4, 5, 6].map(i => (
              <div key={i} className="aspect-[3/4] bg-gray-50 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <Card 
                key={item.id} 
                {...item}
                image={item.thumbnail}
                subtitle={item.type === 'live_class' ? `Next Session: ${new Date(item.startTime).toLocaleString()}` : item.instructor?.name}
                badge={item.type === 'live_class' ? 'LIVE' : 'COURSE'}
                onClick={() => handleEnroll(item)}
                secondaryButtonText="Details"
                onSecondaryClick={() => navigate(`/courses/${item.id}`)}
              />
            ))}
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
