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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative"
        >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black">
          <X size={24} />
        </button>

        <div className="p-10 text-sans">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="animate-spin mx-auto text-[#0EA5E9]" size={40} />
              <p className="mt-4 font-bold text-gray-500">Preparing Quiz...</p>
            </div>
          ) : showResult ? (
            <div className="text-center">
               {(finalScore ?? score) >= passingThreshold ? (
                 <>
                   <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Award size={40} />
                   </div>
                   <h3 className="text-3xl font-bold mb-4">Mabrouk! You Passed</h3>
                   <p className="text-gray-500 mb-8">You scored {finalScore ?? score} out of {totalPossibleScore}. Alhamdulillah, you have completed the assessment successfully.</p>
                   
                   {lessonId ? (
                     <Button onClick={onClose} fullWidth className="gap-2">
                        Continue to Next Lesson <ArrowRight size={20} />
                     </Button>
                   ) : (
                     <>
                        {!hasCertificate && !isIssuing ? (
                           <Button onClick={issueCertificate} fullWidth className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-lg shadow-amber-200">
                              <Award size={20} /> Claim My Certificate
                           </Button>
                        ) : isIssuing ? (
                           <Button fullWidth disabled className="bg-gray-100 text-gray-400 border border-gray-200">
                              <Loader2 className="animate-spin mr-2" size={18} /> Preparing View...
                           </Button>
                        ) : (
                           <div className="space-y-3">
                              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl mb-4">
                                 <p className="text-[10px] uppercase font-bold tracking-widest text-blue-500 mb-1">Status</p>
                                 <p className="text-sm font-bold text-blue-900">Certificate Issued successfully!</p>
                              </div>
                              <Button onClick={() => setShowCertView(true)} fullWidth className="bg-[#0EA5E9] hover:bg-blue-700 gap-2 h-12">
                                 <Award size={20} /> View & Download Certificate
                              </Button>
                              <Button variant="ghost" onClick={onClose} fullWidth className="h-12">
                                 Finish Course
                              </Button>
                           </div>
                        )}
                     </>
                   )}
                 </>
               ) : (
                 <>
                   <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle size={40} />
                   </div>
                   <h3 className="text-3xl font-bold mb-4">Keep Practicing</h3>
                   <p className="text-gray-500 mb-8">
                     You scored {finalScore ?? score} out of {totalPossibleScore} ({Math.round(((finalScore ?? score) / totalPossibleScore) * 100)}%). 
                     You need at least {quiz?.passingScore ?? quiz?.passMark ?? 70}% to pass. Review the lessons and try again.
                   </p>
                   <Button onClick={() => { setShowResult(false); setFinalScore(null); setCurrentQuestion(0); setScore(0); setSelectedOption(null); setWrittenAnswer(''); }} fullWidth>
                      Try Again
                   </Button>
                 </>
               )}
            </div>
          ) : (
            <>
              <div className="mb-8">
                <span className="text-[10px] font-bold text-[#0EA5E9] bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Assessment</span>
                <h3 className="text-2xl font-bold mt-4">{quiz.title || (lessonId ? 'Lesson Quiz' : `${courseTitle} Final Quiz`)}</h3>
                <div className="mt-2 text-xs text-gray-400">Question {currentQuestion + 1} of {quiz.questions.length}</div>
              </div>

              <div className="space-y-6">
                <div className="text-lg font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: quiz.questions[currentQuestion].question }} />
                <div className="space-y-3">
                  {quiz.questions[currentQuestion].type === 'mcq' || !quiz.questions[currentQuestion].type ? (
                    quiz.questions[currentQuestion].options.map((option: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => setSelectedOption(i)}
                        className={cn(
                          "w-full text-left p-5 rounded-2xl border-2 transition-all font-medium",
                          selectedOption === i 
                            ? "border-[#0EA5E9] bg-blue-50/50 text-[#0EA5E9]" 
                            : "border-gray-100 hover:border-gray-200"
                        )}
                      >
                        {option}
                      </button>
                    ))
                  ) : (
                    <textarea 
                      value={writtenAnswer}
                      onChange={(e) => setWrittenAnswer(e.target.value)}
                      placeholder="Write your answer here..."
                      className="w-full min-h-[150px] p-5 rounded-2xl border-2 border-gray-100 focus:border-[#0EA5E9] outline-none font-medium resize-none transition-colors"
                    />
                  )}
                </div>
                <Button 
                  onClick={handleNext} 
                  fullWidth 
                  disabled={quiz.questions[currentQuestion].type === 'written' ? writtenAnswer.trim() === '' : selectedOption === null}
                  className="gap-2"
                >
                  {currentQuestion === quiz.questions.length - 1 ? 'Finish' : 'Next Question'}
                  <ArrowRight size={20} />
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
