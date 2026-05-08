import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Award, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/src/lib/utils';
import { db, handleFirestoreError, OperationType, serverTimestamp } from '@/src/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  userId: string;
  userName: string;
  onSuccess: () => void;
}

export function QuizModal({ isOpen, onClose, courseId, courseTitle, userId, userName, onSuccess }: QuizModalProps) {
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchQuiz();
    }
  }, [isOpen, courseId]);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'quizzes'), where('courseId', '==', courseId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setQuiz(snapshot.docs[0].data());
      } else {
        // Fallback for demo
        setQuiz({
          questions: [
            { question: "What is the primary objective of this course?", options: ["Learning Arabic", "Modern Tech", "Both", "None"], correctAnswer: 2 },
            { question: "Which direction is the Qibla?", options: ["North", "South", "Kaaba", "East"], correctAnswer: 2 },
            { question: "How many prayers are obligatory?", options: ["3", "4", "5", "6"], correctAnswer: 2 }
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
    if (selectedOption === quiz.questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
    } else {
      setShowResult(true);
    }
  };

  const issueCertificate = async () => {
    setIsIssuing(true);
    try {
      await addDoc(collection(db, 'certificates'), {
        userId,
        userName,
        courseId,
        courseTitle,
        issuedAt: serverTimestamp(),
      });
      setHasCertificate(true);
      onSuccess();
      
      // Auto-trigger print
      setTimeout(() => {
        const printContent = document.getElementById('certificate-print-area');
        if (printContent) {
          window.print();
        }
      }, 500);

    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'certificates');
    } finally {
      setIsIssuing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 backdrop-blur-md bg-black/40">
      {/* Printable Certificate Area (Hidden usually) */}
      <div id="certificate-print-area" className="hidden print:block fixed inset-0 bg-white z-[200]">
        <div className="max-w-[800px] mx-auto my-20 p-20 border-[20px] border-double border-blue-900 text-center font-serif bg-white shadow-2xl relative">
          <div className="absolute top-10 right-10 opacity-10">
            <Award size={150} className="text-blue-900" />
          </div>
          <p className="text-4xl text-blue-900 mb-10 font-bold uppercase tracking-[10px]">Certificate of Achievement</p>
          <p className="text-xl mb-10 italic">This is to certify that</p>
          <p className="text-6xl mb-12 font-bold text-black border-b-2 border-black inline-block px-10 pb-4">{userName}</p>
          <p className="text-xl mb-10 italic">has successfully completed the course</p>
          <p className="text-4xl mb-20 font-bold text-blue-800">{courseTitle}</p>
          <div className="flex justify-between items-end mt-20">
             <div className="text-left">
               <p className="font-bold border-t-2 border-black pt-2 px-4">Authorized Signature</p>
               <p className="text-sm text-gray-500">Ribat Academy Director</p>
             </div>
             <div className="w-32 h-32 opacity-20">
               <CheckCircle size={100} className="text-blue-900" />
             </div>
             <div className="text-right">
               <p className="font-bold border-t-2 border-black pt-2 px-4">Issue Date</p>
               <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
             </div>
          </div>
          <div className="mt-20 text-[10px] text-gray-300 uppercase tracking-widest">Verification ID: {courseId.slice(0,8)}-{userId.slice(0,8)}</div>
        </div>
      </div>

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
               {score >= quiz.passingScore ? (
                 <>
                   <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Award size={40} />
                   </div>
                   <h3 className="text-3xl font-bold mb-4">Mabrouk! You Passed</h3>
                   <p className="text-gray-500 mb-8">You scored {score}/{quiz.questions.length}. Alhamdulillah, you have completed the assessment successfully.</p>
                   
                   {!hasCertificate && !isIssuing ? (
                      <Button onClick={issueCertificate} fullWidth className="gap-2">
                         <Award size={20} /> Claim Certificate & Print
                      </Button>
                   ) : isIssuing ? (
                      <Button fullWidth disabled>
                         <Loader2 className="animate-spin mr-2" /> Saving and Preparing Print...
                      </Button>
                   ) : (
                      <div className="space-y-3">
                         <Button onClick={() => window.print()} fullWidth className="bg-green-600 hover:bg-green-700 gap-2">
                            <Award size={20} /> Re-print Certificate
                         </Button>
                         <Button variant="ghost" onClick={onClose} fullWidth>
                            Finish Course
                         </Button>
                      </div>
                   )}
                 </>
               ) : (
                 <>
                   <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle size={40} />
                   </div>
                   <h3 className="text-3xl font-bold mb-4">Keep Practicing</h3>
                   <p className="text-gray-500 mb-8">You scored {score}/{quiz.questions.length}. You need at least {quiz.passingScore} to pass. review the lessons and try again.</p>
                   <Button onClick={() => { setShowResult(false); setCurrentQuestion(0); setScore(0); setSelectedOption(null); }} fullWidth>
                      Try Again
                   </Button>
                 </>
               )}
            </div>
          ) : (
            <>
              <div className="mb-8">
                <span className="text-[10px] font-bold text-[#0EA5E9] bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Assessment</span>
                <h3 className="text-2xl font-bold mt-4">{courseTitle} Final Quiz</h3>
                <div className="mt-2 text-xs text-gray-400">Question {currentQuestion + 1} of {quiz.questions.length}</div>
              </div>

              <div className="space-y-6">
                <p className="text-lg font-medium leading-relaxed">{quiz.questions[currentQuestion].question}</p>
                <div className="space-y-3">
                  {quiz.questions[currentQuestion].options.map((option: string, i: number) => (
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
                  ))}
                </div>
                <Button 
                  onClick={handleNext} 
                  fullWidth 
                  disabled={selectedOption === null}
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
    </div>
  );
}
