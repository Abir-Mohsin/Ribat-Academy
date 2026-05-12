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
        const q = query(collection(db, 'quizzes'), where('courseId', '==', id));
        const snap = await getDocs(q);
        const allQuizzes = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
        setAvailableQuizzes(allQuizzes.filter(q => q.status === 'published'));
      } catch (err) {
        console.error("Error fetching quizzes:", err);
      }
    };
    fetchQuizzes();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    const checkCert = async () => {
      const q = query(collection(db, 'certificates'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const userCerts = snap.docs.map(doc => doc.data() as any);
      const courseCert = userCerts.find(cert => cert.courseId === id);
      if (courseCert) {
        setHasCertificate(true);
        setCertData(courseCert);
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
              userName={userData?.name || user?.displayName || 'Student'}
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
          <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl p-6 flex items-center justify-between text-white border-b border-white/5">
             <div className="flex items-center gap-6">
                <Link to="/dashboard" className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-2xl transition-all border border-white/10">
                   <ChevronLeft size={20} />
                </Link>
                <div>
                   <h1 className="font-bold text-sm lg:text-lg line-clamp-1 tracking-tight">{course.title}</h1>
                   <p className="text-[10px] text-white/40 uppercase font-black tracking-[2px]">Lesson {activeLesson + 1} of {course.lessons.length}</p>
                </div>
             </div>
             <div className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Live Stream Ready</span>
             </div>
          </div>
          
          <div className="w-full bg-black relative group p-4 lg:p-8">
             <div className="aspect-video w-full rounded-[32px] overflow-hidden shadow-2xl border border-white/5 bg-gray-900 relative">
               {(course.lessons[activeLesson].videoId || course.lessons[activeLesson].videoUrl) ? (
                 <iframe
                   src={`https://www.youtube.com/embed/${getYouTubeId(course.lessons[activeLesson].videoId || course.lessons[activeLesson].videoUrl)}?autoplay=0&rel=0`}
                   className="w-full h-full border-0"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                   allowFullScreen
                   title={course.lessons[activeLesson].title}
                 />
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-white/20 space-y-4">
                   <PlayCircle size={80} strokeWidth={1} className="opacity-10" />
                   <p className="font-bold text-sm uppercase tracking-widest">Video Stream Unavailable</p>
                 </div>
               )}
               
               <div className="absolute top-6 right-6 z-10">
                  {!isCurrentLessonCompleted ? (
                     <Button 
                      variant="success" 
                      onClick={handleMarkAsCompleted} 
                      disabled={updating}
                      className="shadow-2xl shadow-green-500/40 border-none px-8 rounded-full"
                     >
                        {updating ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle className="mr-2" size={18} />}
                        COMPLETE LESSON
                     </Button>
                  ) : (
                     <div className="px-6 py-3 bg-white/90 backdrop-blur-md text-black rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl border border-white">
                       <CheckCircle size={16} className="text-green-500" />
                       Achievement Unlocked
                     </div>
                  )}
               </div>
             </div>
          </div>

          <div className="p-8 lg:p-12 bg-white">
             <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-10 pb-10 border-b border-gray-50">
               <div>
                  <h2 className="text-3xl font-black mb-3 tracking-tight">{course.lessons[activeLesson].title}</h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                      <Video size={14} className="text-blue-500" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{course.lessons[activeLesson].duration}</span>
                    </div>
                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Module Progress: {Math.round(((activeLesson+1)/course.lessons.length)*100)}%</div>
                  </div>
               </div>
               <Button 
                variant="outline" 
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-3 rounded-2xl border-gray-100 py-4 px-6 hover:bg-gray-50"
               >
                 <Info size={18} className="text-black" />
                 <span className="text-xs font-black uppercase tracking-widest">{showDetails ? 'LESSON CONTEXT' : 'LESSON CONTEXT'}</span>
                 <motion.div
                   animate={{ rotate: showDetails ? 180 : 0 }}
                   transition={{ duration: 0.3 }}
                 >
                   <ChevronDown size={16} />
                 </motion.div>
               </Button>
             </div>

             <div className="max-w-4xl">
                <div className="rich-text-content text-gray-500 text-lg leading-relaxed mb-12 font-medium" dangerouslySetInnerHTML={{ __html: course.lessons[activeLesson].description || 'This module provides deep insights into the subject matter. Focus on the core principles discussed in this session.' }} />

                {isCurrentLessonCompleted && currentLessonQuiz && !isQuizPassed && (
                   <div className="mb-12 p-8 bg-black text-white rounded-[40px] shadow-2xl shadow-black/20 flex flex-col md:flex-row items-center justify-between gap-8 group">
                      <div className="flex items-center gap-6">
                         <div className="w-16 h-16 bg-white/10 text-white rounded-[24px] flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-110 transition-transform">
                            <Target size={32} />
                         </div>
                         <div>
                            <h4 className="font-black text-xl tracking-tight mb-1">Knowledge Verfication</h4>
                            <p className="text-sm text-white/50">Complete the assessment to unlock the next chapter.</p>
                         </div>
                      </div>
                      <Button onClick={() => { setQuizLessonId(currentLesson.id); setIsQuizOpen(true); }} className="bg-white text-black hover:bg-gray-100 rounded-2xl h-16 px-10 font-black">
                         TAKE QUIZ NOW
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
                            <div className="rich-text-content text-sm text-gray-600 leading-relaxed" 
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
                            <div className="rich-text-content text-xs text-gray-500 leading-relaxed italic"
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
        <aside className="w-full lg:w-[440px] bg-gray-50/50 border-l border-gray-100 flex flex-col lg:h-screen shrink-0 font-sans">
          <div className="p-8 border-b border-gray-100 bg-white sticky top-0 z-10 flex items-center justify-between">
             <h3 className="font-black text-xl tracking-tight flex items-center gap-3">
                <List size={22} className="text-gray-400" />
                Syllabus
             </h3>
             <div className="flex flex-col items-end">
               <span className="text-[10px] font-black uppercase tracking-[2px] text-gray-300 mb-1">Overall</span>
               <span className={cn(
                 "text-xs font-black px-4 py-1 rounded-full uppercase tracking-widest border shadow-sm",
                 currentProgress === 100 
                   ? "bg-green-50 text-green-600 border-green-100" 
                   : "bg-black text-white border-black"
               )}>
                 {loadingProgress ? "CALCULATING..." : `${currentProgress}%`}
               </span>
             </div>
          </div>
          <div className="flex-grow overflow-y-auto no-scrollbar space-y-1 p-2">
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
                      "w-full text-left p-6 rounded-[24px] border transition-all duration-300 flex items-start gap-5 disabled:opacity-30 disabled:cursor-not-allowed group mb-1",
                      activeLesson === index 
                        ? "bg-white border-gray-100 shadow-xl shadow-black/5 ring-1 ring-black/5" 
                        : "bg-transparent border-transparent hover:bg-white hover:border-gray-50"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500",
                      activeLesson === index 
                        ? "bg-black text-white shadow-xl shadow-black/20" 
                        : isCompleted
                          ? "bg-green-50 border-green-100 text-green-600"
                          : "bg-white border-gray-100 text-gray-300"
                    )}>
                      {locked ? <Target size={18} /> : (isCompleted ? <CheckCircle size={20} /> : <span className="font-black text-lg">{index + 1}</span>)}
                    </div>
                    <div className="flex-grow pt-1">
                      <h4 className={cn(
                        "text-sm font-black mb-2 tracking-tight transition-colors duration-300 group-hover:text-black",
                        activeLesson === index ? "text-black" : "text-gray-500"
                      )}>
                        {lesson.title}
                      </h4>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {(() => {
                             const Icon = iconMap[lesson.icon || 'PlayCircle'] || PlayCircle;
                             return <Icon size={12} />;
                          })()}
                          {lesson.duration}
                        </div>
                        {hasQuiz && (
                          <div className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                            quizPassed ? "bg-green-50 text-green-600 border-green-100" : "bg-blue-50 text-blue-600 border-blue-100"
                          )}>
                            Quiz {quizPassed ? 'Passed' : 'Required'}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
             })}
             
             {currentProgress === 100 && (
               <div className="p-8 mt-6 rounded-[32px] bg-gradient-to-br from-black to-gray-800 text-white shadow-2xl overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                  {hasCertificate ? (
                    <div className="relative z-10 text-center">
                       <Award className="text-amber-400 mx-auto mb-6 drop-shadow-lg" size={48} strokeWidth={1} />
                       <h3 className="text-xl font-black mb-2 tracking-tight">Course Graduation</h3>
                       <p className="text-xs text-white/50 mb-8 max-w-[200px] mx-auto font-medium leading-relaxed">Alhamdulillah, you have achieved the professional certification!</p>
                       <div className="space-y-3">
                         <Button onClick={() => setShowCertView(true)} size="lg" fullWidth className="bg-white text-black hover:bg-gray-100 rounded-2xl h-14 font-black">
                           VIEW BADGE
                         </Button>
                         <Link to="/dashboard" className="block">
                           <Button variant="ghost" size="sm" fullWidth className="text-white/60 hover:text-white border-white/10 hover:bg-white/5">DASHBOARD</Button>
                         </Link>
                       </div>
                    </div>
                  ) : (
                    <div className="relative z-10 text-center">
                       <Target className="text-white/30 mx-auto mb-4" size={40} />
                       <h3 className="text-xl font-black mb-2 tracking-tight">Final Assessment</h3>
                       <p className="text-xs text-white/50 mb-8 font-medium leading-relaxed">Complete the final grand test to earn your verified certificate.</p>
                       <Button fullWidth size="lg" className="bg-white text-black hover:bg-gray-100 rounded-2xl h-14 font-black" onClick={() => { setQuizLessonId(undefined); setIsQuizOpen(true); }}>
                         START EXAM
                       </Button>
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
          userName={userData?.name || user?.displayName || 'Student'}
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
