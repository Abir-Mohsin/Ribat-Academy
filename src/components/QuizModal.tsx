import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Award, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/src/lib/utils';
import { db, handleFirestoreError, OperationType, serverTimestamp } from '@/src/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

import { CertificateView } from './CertificateView';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  userId: string;
  userName: string;
  onSuccess: () => void;
  lessonId?: string;
}

export function QuizModal({ isOpen, onClose, courseId, courseTitle, userId, userName, onSuccess, lessonId }: QuizModalProps) {
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [showCertView, setShowCertView] = useState(false);
  const [issuedCertId, setIssuedCertId] = useState<string | null>(null);

  const totalPossibleScore = quiz?.questions?.reduce((acc: number, cur: any) => acc + (cur.marks || 1), 0) || 0;
  const passingThreshold = (totalPossibleScore * (quiz?.passingScore ?? quiz?.passMark ?? 70)) / 100;

  useEffect(() => {
    if (isOpen) {
      fetchQuiz();
      checkExistingCertificate();
    } else {
      // Reset state when closing
      setShowResult(false);
      setFinalScore(null);
      setCurrentQuestion(0);
      setScore(0);
      setSelectedOption(null);
      setWrittenAnswer('');
      setShowCertView(false);
    }
  }, [isOpen, courseId, lessonId]);

  const checkExistingCertificate = async () => {
    if (lessonId) return; // Only for final quizzes
    try {
      const q = query(
        collection(db, 'certificates'),
        where('userId', '==', userId),
        where('courseId', '==', courseId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setHasCertificate(true);
        setIssuedCertId(snap.docs[0].id);
      }
    } catch (e) {
      console.error("Error checking certificate:", e);
    }
  };

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'quizzes'), 
        where('courseId', '==', courseId),
        where('lessonId', '==', lessonId || '')
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setQuiz({ id: snapshot.docs[0].id, ...data });
      } else {
        // Fallback for demo
        setQuiz({
          questions: [
            { question: "What is the primary objective of this course?", options: ["Learning Arabic", "Modern Tech", "Both", "None"], correctAnswer: "2" },
            { question: "Which direction is the Qibla?", options: ["North", "South", "Kaaba", "East"], correctAnswer: "2" },
            { question: "How many prayers are obligatory?", options: ["3", "4", "5", "6"], correctAnswer: "2" }
          ],
          passingScore: 2
        });
      }
    } catch (error) {
      console.error("Error fetching quiz:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const q = quiz.questions[currentQuestion];
    let isCorrect = false;
    let marksToAdd = 0;

    if (q.type === 'mcq' || !q.type) {
       // Check if selectedOption is numerical index or text
       const selectedValue = selectedOption !== null && q.options ? q.options[selectedOption] : null;
       
       const isCorrectIndex = selectedOption !== null && String(selectedOption) === String(q.correctAnswer);
       const isCorrectText = selectedValue !== null && String(selectedValue).trim().toLowerCase() === String(q.correctAnswer || '').trim().toLowerCase();
       
       if (isCorrectIndex || isCorrectText) {
         isCorrect = true;
         marksToAdd = q.marks || 1;
       }
       console.log(`Question ${currentQuestion}: Selected=${selectedOption} (${selectedValue}), Correct=${q.correctAnswer}. Result=${isCorrect}`);
    } else if (q.type === 'written') {
       if (writtenAnswer.trim().toLowerCase() === String(q.correctAnswer || '').trim().toLowerCase()) {
         isCorrect = true;
         marksToAdd = q.marks || 1;
       }
    }

    const newScore = score + marksToAdd;
    setScore(newScore);

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      setWrittenAnswer('');
    } else {
      setFinalScore(newScore);
      setShowResult(true);
      submitAssessment(newScore);
      
      console.log(`Quiz Finished. Final Score: ${newScore}, Threshold: ${passingThreshold}, Passed: ${newScore >= passingThreshold}`);
      
      // If it's a lesson quiz and they passed, call onSuccess to unlock progress early
      if (lessonId && newScore >= passingThreshold) {
        onSuccess();
      }
    }
  };

  const submitAssessment = async (finalScoreValue: number) => {
     // Save the submission
     try {
        await addDoc(collection(db, 'quiz_submissions'), {
           userId,
           userName,
           courseId,
           quizId: quiz.id || 'unknown',
           score: finalScoreValue,
           totalMarks: totalPossibleScore,
           isPass: finalScoreValue >= passingThreshold,
           submittedAt: serverTimestamp()
        });
     } catch (e) {
        console.error("Submission error:", e);
     }
  };

  const issueCertificate = async () => {
    setIsIssuing(true);
    try {
      const docRef = await addDoc(collection(db, 'certificates'), {
        userId,
        userName,
        courseId,
        courseTitle,
        issuedAt: serverTimestamp(),
      });
      setHasCertificate(true);
      setIssuedCertId(docRef.id);
      onSuccess();
      setShowCertView(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'certificates');
    } finally {
      setIsIssuing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 backdrop-blur-md bg-black/40">
      {showCertView ? (
        <div className="w-full h-full max-h-[90vh] overflow-y-auto">
          <CertificateView 
            userName={userName}
            courseTitle={courseTitle}
            issueDate={new Date().toLocaleDateString('en-GB')}
            certificateId={`${courseId?.slice(0,8)}-${userId?.slice(0,8)}`}
            onClose={() => setShowCertView(false)}
          />
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden relative border border-gray-100"
        >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black hover:scale-110 transition-transform">
          <X size={24} />
        </button>

        <div className="p-8 md:p-12 text-sans">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 border-4 border-gray-100 border-t-black rounded-full animate-spin mx-auto mb-6" />
              <p className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Preparing Assessment...</p>
            </div>
          ) : showResult ? (
            <div className="text-center animate-in zoom-in-95 duration-500">
               {(finalScore ?? score) >= passingThreshold ? (
                 <>
                   <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[32px] border border-green-100 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-200/20">
                      <Award size={48} strokeWidth={1.5} />
                   </div>
                   <h3 className="text-4xl font-black mb-4 tracking-tight">Mabrouk!</h3>
                   <p className="text-gray-500 mb-10 leading-relaxed">
                     Alhamdulillah, you have passed with a score of <span className="font-bold text-black">{finalScore ?? score}/{totalPossibleScore}</span>.
                   </p>
                   
                   {lessonId ? (
                     <Button onClick={onClose} fullWidth size="lg" className="gap-2">
                        Next Lesson <ArrowRight size={20} />
                     </Button>
                   ) : (
                     <div className="space-y-4">
                        {!hasCertificate && !isIssuing ? (
                           <Button onClick={issueCertificate} fullWidth size="lg" className="gap-2 bg-gradient-to-br from-amber-500 to-yellow-600 border-none shadow-xl shadow-amber-200">
                              <Award size={20} /> Claim Certificate
                           </Button>
                        ) : isIssuing ? (
                           <Button fullWidth size="lg" disabled className="bg-gray-100 text-gray-400">
                              <Loader2 className="animate-spin mr-2" size={18} /> Preparing...
                           </Button>
                        ) : (
                           <div className="space-y-4">
                              <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-3xl">
                                 <p className="text-[10px] uppercase font-bold tracking-[2px] text-blue-500 mb-1">Status</p>
                                 <p className="font-bold text-blue-900">Certificate successfully issued!</p>
                              </div>
                              <Button onClick={() => setShowCertView(true)} fullWidth size="lg" className="gap-2">
                                 <Award size={20} /> View Certificate
                              </Button>
                              <Button variant="ghost" onClick={onClose} fullWidth>
                                 Close Portal
                              </Button>
                           </div>
                        )}
                     </div>
                   )}
                 </>
               ) : (
                 <>
                   <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[32px] border border-red-100 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-200/20">
                      <AlertCircle size={48} strokeWidth={1.5} />
                   </div>
                   <h3 className="text-3xl font-black mb-4 tracking-tight">Try Again</h3>
                   <p className="text-gray-500 mb-10 leading-relaxed">
                     You scored {finalScore ?? score} out of {totalPossibleScore}. 
                     Mastery requires {quiz?.passingScore ?? quiz?.passMark ?? 70}% correct answers.
                   </p>
                   <Button onClick={() => { setShowResult(false); setFinalScore(null); setCurrentQuestion(0); setScore(0); setSelectedOption(null); setWrittenAnswer(''); }} fullWidth size="lg">
                      Restart Quiz
                   </Button>
                 </>
               )}
            </div>
          ) : (
            <>
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-black text-[#0EA5E9] bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100 uppercase tracking-widest leading-none">
                    Assessment
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100 uppercase tracking-widest leading-none">
                    Q {currentQuestion + 1} / {quiz.questions.length}
                  </span>
                </div>
                <h3 className="text-2xl font-black tracking-tight leading-tight">{quiz.title || (lessonId ? 'Progress Check' : `Final Evaluation`)}</h3>
              </div>

              <div className="space-y-8">
                <div className="text-lg font-bold leading-relaxed text-black/80" dangerouslySetInnerHTML={{ __html: quiz.questions[currentQuestion].question }} />
                <div className="space-y-4">
                  {quiz.questions[currentQuestion].type === 'mcq' || !quiz.questions[currentQuestion].type ? (
                    quiz.questions[currentQuestion].options.map((option: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => setSelectedOption(i)}
                        className={cn(
                          "w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 font-bold text-sm transform active:scale-[0.98]",
                          selectedOption === i 
                            ? "border-black bg-black text-white shadow-xl shadow-black/10" 
                            : "border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200"
                        )}
                      >
                        {option}
                      </button>
                    ))
                  ) : (
                    <textarea 
                      value={writtenAnswer}
                      onChange={(e) => setWrittenAnswer(e.target.value)}
                      placeholder="Share your detailed answer..."
                      className="w-full min-h-[160px] p-6 rounded-2xl border-2 border-gray-100 focus:border-black focus:bg-white bg-gray-50/50 outline-none font-bold text-sm resize-none transition-all"
                    />
                  )}
                </div>
                <Button 
                  onClick={handleNext} 
                  fullWidth 
                  size="lg"
                  disabled={quiz.questions[currentQuestion].type === 'written' ? writtenAnswer.trim() === '' : selectedOption === null}
                  className="gap-3 shadow-xl shadow-black/10"
                >
                  {currentQuestion === quiz.questions.length - 1 ? 'SUBMIT TEST' : 'NEXT STEP'}
                  <ArrowRight size={18} />
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    )}
    </div>
  );
}
