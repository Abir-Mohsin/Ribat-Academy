import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Button } from '@/src/components/Button';
import { PaymentModal } from '@/src/components/PaymentModal';
import { useAuth } from '@/src/contexts/AuthContext';
import { getThumbnailUrl } from '@/src/lib/drive';
import { PlayCircle, Video, BookOpen, Clock, ChevronLeft, Headphones } from 'lucide-react';

const iconMap: Record<string, any> = {
  PlayCircle: PlayCircle,
  Video: Video,
  BookOpen: BookOpen,
  Headphones: Headphones
};

export function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user, signInWithGoogle } = useAuth();
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        if (!id) return;
        const docRef = doc(db, 'courses', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCourse({ id: docSnap.id, ...docSnap.data() });
        } else {
          // It might be a live class
          const liveDocRef = doc(db, 'live_classes', id);
          const liveSnap = await getDoc(liveDocRef);
          if (liveSnap.exists()) {
            setCourse({ id: liveSnap.id, ...liveSnap.data(), type: 'live_class' });
          }
        }
      } catch (error) {
        console.error("Error fetching course:", error);
        handleFirestoreError(error as Error, OperationType.GET, `courses/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Course not found</h2>
        <Button onClick={() => navigate('/courses')}>Back to Courses</Button>
      </div>
    );
  }

  const handleEnroll = () => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    setShowPayment(true);
  };

  return (
    <div className="bg-white min-h-screen pt-20 pb-24">
      {/* Hero Section */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="text-gray-500 hover:text-black transition-colors mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <div className="inline-block bg-[#0EA5E9] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-6">
              {course.type === 'live_class' ? 'LIVE CLASS' : 'COURSE'}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#111111] leading-tight mb-6">
              {course.title}
            </h1>
            <div className="text-gray-500 text-lg md:text-xl mb-8 leading-relaxed" dangerouslySetInnerHTML={{ __html: course.description }} />
            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg" onClick={handleEnroll} className="text-lg px-8">
                Enroll Now - ৳{course.price}
              </Button>
            </div>
          </div>
          
          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl">
             {course.thumbnail ? (
               <img
                  src={getThumbnailUrl(course.thumbnail)}
                  alt={course.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
               />
             ) : (
               <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                 <Video size={48} className="text-gray-400" />
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-24">
        
        <div className="lg:col-span-2 space-y-16">
          {course.objectives && course.objectives.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold mb-8">What you'll learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.objectives.map((obj: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 bg-green-100 text-green-600 rounded-full p-1 flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{obj}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {course.lessons && course.lessons.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold mb-4">Course Modules</h2>
              <p className="text-gray-500 mb-8">{course.lessons.length} lessons</p>
              
              <div className="space-y-4">
                {course.lessons.map((lesson: any, i: number) => {
                  const Icon = iconMap[lesson.icon || 'PlayCircle'] || PlayCircle;
                  return (
                  <div key={lesson.id} className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:border-black transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-black flex-shrink-0">
                        <Icon size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{lesson.title}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 font-medium">
                          <span className="flex items-center gap-1.5"><Icon size={16} /> Course Lesson</span>
                          {lesson.duration && <span className="flex items-center gap-1.5"><Clock size={16} /> {lesson.duration}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-32">
            {course.instructor && (course.instructor.name || course.instructor.bio) && (
              <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                <h3 className="font-bold text-xl mb-6">Instructor</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-[#111111] text-white rounded-full flex items-center justify-center text-xl font-bold">
                    {course.instructor?.name?.charAt(0) || 'I'}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{course.instructor?.name || 'Instructor'}</h4>
                    <p className="text-gray-500 text-sm font-medium">{course.instructor?.role || 'Educator'}</p>
                  </div>
                </div>
                {course.instructor?.bio && (
                  <div className="text-gray-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: course.instructor.bio }} />
                )}
              </div>
            )}
            
            {course.type === 'live_class' && (
              <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 mt-6 lg:mt-0 lg:mb-6">
                <h3 className="font-bold text-xl mb-6">Live Class Info</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Start Time</p>
                    <p className="font-bold">{new Date(course.startTime).toLocaleString()}</p>
                  </div>
                  {course.duration && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Duration</p>
                      <p className="font-bold">{course.duration}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {showPayment && (
        <PaymentModal 
          isOpen={showPayment} 
          onClose={() => setShowPayment(false)} 
          item={{ ...course, type: course.type || 'course' }}
        />
      )}
    </div>
  );
}
