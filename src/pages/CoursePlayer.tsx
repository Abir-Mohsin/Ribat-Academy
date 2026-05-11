import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PlayCircle, CheckCircle, ChevronLeft, ChevronRight, List, ChevronDown, Info, User, Target, Loader2, AlertCircle, Video, BookOpen, Headphones, Award, X } from 'lucide-react';
import { Button } from '@/src/components/Button';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';
import { db, handleFirestoreError, OperationType, serverTimestamp } from '@/src/lib/firebase';
import { collection, onSnapshot, setDoc, updateDoc, getDoc, query, where, getDocs, doc } from 'firebase/firestore';
import { QuizModal } from '@/src/components/QuizModal';

import { CertificateView } from '@/src/components/CertificateView';

const iconMap: Record<string, any> = {
  PlayCircle: PlayCircle,
  Video: Video,
  BookOpen: BookOpen,
  Headphones: Headphones
};

// Helper to extract YouTube ID from potential URL
const getYouTubeId = (url: string) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : url;
};

export function CoursePlayer() {
  const { id } = useParams();
  const { user, userData } = useAuth();
  const [activeLesson, setActiveLesson] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizLessonId, setQuizLessonId] = useState<string | undefined>(undefined);
  const [availableQuizzes, setAvailableQuizzes] = useState<any[]>([]);
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [certData, setCertData] = useState<any>(null);
  const [showCertView, setShowCertView] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchQuizzes = async () => {
      try {
        const q = query(collection(db, 'quizzes'), where('courseId', '==', id), where('status', '==', 'published'));
        const snap = await getDocs(q);
        setAvailableQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching quizzes:", err);
      }
    };
    fetchQuizzes();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    const checkCert = async () => {
      const q = query(collection(db, 'certificates'), where('userId', '==', user.uid), where('courseId', '==', id));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setHasCertificate(true);
        setCertData(snap.docs[0].data());
      }
    };
    checkCert();
  }, [user, id]);

  useEffect(() => {
    if (!id) return;
    const fetchCourse = async () => {
       try {
         const docSnap = await getDoc(doc(db, 'courses', id));
         if (docSnap.exists()) {
           setCourse({ id: docSnap.id, ...docSnap.data() });
         } else {
           setError("Course not found.");
         }
       } catch (err) {
         console.error("Error fetching course:", err);
         setError("Could not load course details.");
       } finally {
         setLoadingCourse(false);
       }
    };
    fetchCourse();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;

    const progressId = `${user.uid}_${id}`;
    const unsubscribe = onSnapshot(doc(db, 'progress', progressId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCompletedLessons(data.completedLessons || []);
        setCompletedQuizzes(data.completedQuizzes || []);
      } else {
        setCompletedLessons([]);
        setCompletedQuizzes([]);
      }
      setLoadingProgress(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `progress/${progressId}`);
      setLoadingProgress(false);
    });

    return () => unsubscribe();
  }, [user, id]);

  const handleMarkAsCompleted = async () => {
    if (!user || !id || updating || !course) return;
    
    const lessonId = course.lessons[activeLesson].id;
    if (completedLessons.includes(lessonId)) return;

    setUpdating(true);
    const progressId = `${user.uid}_${id}`;
    const newCompletedLessons = [...completedLessons, lessonId];
    const progressPercentage = Math.round((newCompletedLessons.length / course.lessons.length) * 100);

    try {
      const progressRef = doc(db, 'progress', progressId);
      if (completedLessons.length === 0) {
        // Create new progress doc
        await setDoc(progressRef, {
          userId: user.uid,
          courseId: id,
          completedLessons: newCompletedLessons,
          progress: progressPercentage,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Update existing
        await updateDoc(progressRef, {
          completedLessons: newCompletedLessons,
          progress: progressPercentage,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `progress/${progressId}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loadingCourse) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-[#0EA5E9] mb-4" size={48} />
        <p className="font-bold text-gray-500">Preparing your classroom...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold mb-2">Oops! something went wrong</h2>
        <p className="text-gray-500 mb-6">{error || 'Course not available.'}</p>
        <Link to="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const currentProgress = Math.round((completedLessons.length / course.lessons.length) * 100);
  const currentLesson = course.lessons[activeLesson];
  const isCurrentLessonCompleted = completedLessons.includes(currentLesson?.id);
  const currentLessonQuiz = availableQuizzes.find(q => q.lessonId === currentLesson?.id);
  const isQuizPassed = currentLessonQuiz ? completedQuizzes.includes(currentLessonQuiz.id) : true;
  const hasFinalQuiz = availableQuizzes.some(q => !q.lessonId || q.lessonId === '');

  const canSwitchToLesson = (index: number) => {
    // If going backwards, always allowed
    if (index <= activeLesson) return true;
    
    // Check if current lesson is completed AND if it has a quiz, it's passed
    if (!isCurrentLessonCompleted) return false;
    if (currentLessonQuiz && !isQuizPassed) return false;

    // Additionally, all previous lessons must be completed and their quizzes passed
    for (let i = 0; i < index; i++) {
       const lesson = course.lessons[i];
       if (!completedLessons.includes(lesson.id)) return false;
       const q = availableQuizzes.find(qu => qu.lessonId === lesson.id);
       if (q && !completedQuizzes.includes(q.id)) return false;
    }

    return true;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Certificate Viewer Overlay */}
      {showCertView && certData && (
        <div className="fixed inset-0 z-[200] bg-white overflow-y-auto">
          <div className="absolute top-6 right-6 z-[210]">
             <Button variant="outline" onClick={() => setShowCertView(false)} className="rounded-full w-12 h-12 p-0 shadow-lg">
               <X size={24} />
             </Button>
          </div>
          <div className="pt-20">
            <CertificateView 
              userName={userData?.name || 'Student'}
              courseTitle={course.title}
              issueDate={certData.issuedAt?.toDate ? certData.issuedAt.toDate().toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
              certificateId={`${course?.id?.slice(0,8)}-${user?.uid?.slice(0,8)}`}
              onClose={() => setShowCertView(false)}
            />
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row h-full">
        {/* Main Player Area */}
        <div className="flex-grow bg-black flex flex-col">
          <div className="sticky top-0 z-20 bg-black/50 backdrop-blur-md p-4 flex items-center gap-4 text-white border-b border-white/10">
             <Link to="/dashboard" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ChevronLeft />
             </Link>
             <div>
                <h1 className="font-bold text-sm lg:text-base line-clamp-1">{course.title}</h1>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-sans font-bold">Lesson {activeLesson + 1}: {course.lessons[activeLesson].title}</p>
             </div>
          </div>
          
          <div className="aspect-video w-full bg-black relative group">
             {(course.lessons[activeLesson].videoId || course.lessons[activeLesson].videoUrl) ? (
               <iframe
                 src={`https://www.youtube.com/embed/${getYouTubeId(course.lessons[activeLesson].videoId || course.lessons[activeLesson].videoUrl)}?autoplay=0&rel=0`}
                 className="w-full h-full border-0"
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                 allowFullScreen
                 title={course.lessons[activeLesson].title}
               />
             ) : (
               <div className="w-full h-full flex flex-col items-center justify-center text-white/50 space-y-4">
                 <PlayCircle size={64} className="opacity-20" />
                 <p className="font-bold text-sm">No video source provided for this lesson.</p>
               </div>
             )}
             
             <div className="absolute top-4 right-4 z-10 flex gap-2">
                {!isCurrentLessonCompleted ? (
                   <Button 
                    variant="success" 
                    size="sm"
                    onClick={handleMarkAsCompleted} 
                    disabled={updating}
                    className="shadow-lg shadow-green-500/20"
                   >
                      {updating ? <Loader2 className="animate-spin mr-2" size={16} /> : <CheckCircle className="mr-2" size={16} />}
                      Mark Completed
                   </Button>
                ) : (
                   <div className="px-4 py-2 bg-green-500/90 backdrop-blur-sm text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg border border-green-400/50">
                     <CheckCircle size={14} />
                     Lesson Completed
                   </div>
                )}
             </div>
          </div>

          <div className="p-6 lg:p-10 bg-white border-b border-gray-100">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
               <div>
                  <h2 className="text-2xl font-bold mb-2">{course.lessons[activeLesson].title}</h2>
                  <p className="text-gray-500 text-sm">Lesson {activeLesson + 1} of {course.lessons.length}</p>
               </div>
               <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 w-fit"
               >
                 <Info size={16} />
                 {showDetails ? 'Hide Course Details' : 'Show Course Details'}
                 <motion.div
                   animate={{ rotate: showDetails ? 180 : 0 }}
                   transition={{ duration: 0.2 }}
                 >
                   <ChevronDown size={14} />
                 </motion.div>
               </Button>
             </div>

             <div className="max-w-4xl">
                <div className="text-gray-600 leading-relaxed mb-8" dangerouslySetInnerHTML={{ __html: course.lessons[activeLesson].description || 'This lesson covers the fundamental building blocks of the language. Focus on the articulation points (Makharij) and the short vowels (Harakat).' }} />

                {isCurrentLessonCompleted && currentLessonQuiz && !isQuizPassed && (
                   <div className="mb-8 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                            <Target size={24} />
                         </div>
                         <div>
                            <h4 className="font-bold text-blue-900">Assessment Required</h4>
                            <p className="text-sm text-blue-600">Please complete the quiz for this lesson to proceed.</p>
                         </div>
                      </div>
                      <Button onClick={() => { setQuizLessonId(currentLesson.id); setIsQuizOpen(true); }} className="whitespace-nowrap">
                         Take Lesson Quiz
                      </Button>
                   </div>
                )}

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="grid md:grid-cols-2 gap-8 py-8 border-t border-gray-50">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Info size={14} className="text-[#0EA5E9]" />
                              About Course
                            </h3>
                            <div className="text-sm text-gray-600 leading-relaxed" 
                                 dangerouslySetInnerHTML={{ __html: course.description }} />
                          </div>

                          <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Target size={14} className="text-[#0EA5E9]" />
                              Learning Objectives
                            </h3>
                            <ul className="space-y-2">
                              {course.objectives.map((obj, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] mt-2 shrink-0" />
                                  {obj}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <User size={14} className="text-[#0EA5E9]" />
                              Your Instructor
                            </h3>
                            <div className="flex items-center gap-4 mb-3">
                              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-sm border border-gray-200">
                                AI
                              </div>
                              <div>
                                <p className="font-bold text-sm">{course.instructor.name}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{course.instructor.role}</p>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 leading-relaxed italic"
                                 dangerouslySetInnerHTML={{ __html: course.instructor.bio }} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        </div>

        {/* Sidebar Lesson List */}
        <aside className="w-full lg:w-[400px] bg-gray-50 border-l border-gray-100 flex flex-col h-screen overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-white flex items-center justify-between">
             <h3 className="font-bold flex items-center gap-2">
                <List size={20} />
                Course Content
             </h3>
             <span className={cn(
               "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
               currentProgress === 100 ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
             )}>
               {loadingProgress ? "..." : `${currentProgress}% Done`}
             </span>
          </div>
          <div className="flex-grow overflow-y-auto">
             {course.lessons.map((lesson, index) => {
                const isCompleted = completedLessons.includes(lesson.id);
                const hasQuiz = availableQuizzes.some(q => q.lessonId === lesson.id);
                const quizPassed = hasQuiz ? completedQuizzes.includes(availableQuizzes.find(q => q.lessonId === lesson.id)?.id) : true;
                const locked = index > 0 && (!completedLessons.includes(course.lessons[index-1].id) || (availableQuizzes.find(q => q.lessonId === course.lessons[index-1].id) && !completedQuizzes.includes(availableQuizzes.find(q => q.lessonId === course.lessons[index-1].id)?.id)));

                return (
                  <button
                    key={lesson.id}
                    disabled={locked}
                    onClick={() => {
                       if (canSwitchToLesson(index)) {
                          setActiveLesson(index);
                       }
                    }}
                    className={cn(
                      "w-full text-left p-6 transition-all border-b border-gray-100 flex gap-4 disabled:opacity-50 disabled:cursor-not-allowed",
                      activeLesson === index ? "bg-white shadow-sm border-l-4 border-l-[#0EA5E9]" : "hover:bg-gray-100"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors",
                      activeLesson === index 
                        ? "bg-[#0EA5E9] border-[#0EA5E9] text-white" 
                        : isCompleted
                          ? "bg-green-50 border-green-200 text-green-500"
                          : "border-gray-200 text-gray-400"
                    )}>
                      {locked ? <Target size={14} className="opacity-50" /> : (isCompleted ? <CheckCircle size={16} /> : index + 1)}
                    </div>
                    <div className="flex-grow">
                      <h4 className={cn(
                        "text-sm font-bold mb-1",
                        activeLesson === index ? "text-black" : "text-gray-600"
                      )}>
                        {lesson.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                        {(() => {
                           const Icon = iconMap[lesson.icon || 'PlayCircle'] || PlayCircle;
                           return <Icon size={12} />;
                        })()}
                        {lesson.duration}
                      </div>
                    </div>
                    {isCompleted && <CheckCircle size={18} className="text-green-500 shrink-0" />}
                  </button>
                );
             })}
             
             {currentProgress === 100 && (
               <div className="p-8 bg-blue-50/50">
                  {hasCertificate ? (
                    <div className="text-center">
                       <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                          <Award className="text-green-500" size={32} />
                       </div>
                       <p className="text-sm font-bold text-green-600 mb-4">Certificate Earned!</p>
                       <div className="space-y-2">
                         <Button onClick={() => setShowCertView(true)} variant="primary" size="sm" fullWidth className="gap-2 bg-[#0EA5E9] hover:bg-blue-700">
                           <Award size={16} /> View & Download
                         </Button>
                         <Link to="/dashboard" className="block">
                           <Button variant="ghost" size="sm" fullWidth>Back to Dashboard</Button>
                         </Link>
                       </div>
                    </div>
                  ) : (
                    <div className="text-center">
                       <Award className="mx-auto text-[#0EA5E9] mb-2" size={32} />
                       <p className="text-xs text-gray-500 mb-4">You've completed all lessons. Take the final exam to earn your certificate.</p>
                       <Button fullWidth onClick={() => { setQuizLessonId(undefined); setIsQuizOpen(true); }}>Take Final Exam</Button>
                    </div>
                  )}
               </div>
             )}
          </div>
        </aside>
      </div>

      {id && (
        <QuizModal 
          isOpen={isQuizOpen}
          onClose={() => setIsQuizOpen(false)}
          courseId={id}
          lessonId={quizLessonId}
          courseTitle={course.title}
          userId={user?.uid || ''}
          userName={userData?.name || 'Student'}
          onSuccess={async () => {
             if (quizLessonId) {
                // Update progress with completed quiz
                const progressId = `${user?.uid}_${id}`;
                const progressRef = doc(db, 'progress', progressId);
                const quiz = availableQuizzes.find(q => q.lessonId === quizLessonId);
                if (quiz && !completedQuizzes.includes(quiz.id)) {
                   const newCompletedQuizzes = [...completedQuizzes, quiz.id];
                   try {
                      await setDoc(progressRef, {
                         userId: user?.uid,
                         courseId: id,
                         completedQuizzes: newCompletedQuizzes,
                         updatedAt: serverTimestamp()
                      }, { merge: true });
                   } catch (err) {
                      console.error("Error updating quiz progress:", err);
                   }
                }
             } else {
                setHasCertificate(true);
             }
          }}
        />
      )}
    </div>
  );
}
