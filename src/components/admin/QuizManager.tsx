import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { RichTextEditor } from '@/src/components/RichTextEditor';
import { Plus, Trash2, Edit2, Loader2, Save, X, Search, CheckCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/src/components/Button';
import { cn } from '@/src/lib/utils';

interface Question {
  id: string;
  type: 'mcq' | 'written';
  question: string;
  options?: string[];
  correctAnswer?: string;
  marks: number;
}

interface Quiz {
  id?: string;
  title: string;
  courseId: string;
  lessonId?: string; // Optional, can be for whole course if empty
  passingScore: number;
  questions: Question[];
  status: 'draft' | 'published';
  createdAt?: any;
}

export function QuizManager() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Partial<Quiz> | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const qSnap = await getDocs(query(collection(db, 'quizzes'), orderBy('createdAt', 'desc')));
      setQuizzes(qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Quiz)));

      const cSnap = await getDocs(collection(db, 'courses'));
      setCourses(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz?.title || !editingQuiz?.courseId) return;

    try {
      const data = {
        ...editingQuiz,
        updatedAt: serverTimestamp()
      };

      if (editingQuiz.id) {
        await updateDoc(doc(db, 'quizzes', editingQuiz.id), data);
      } else {
        await addDoc(collection(db, 'quizzes'), {
          ...data,
          createdAt: serverTimestamp(),
          status: 'draft',
          questions: editingQuiz.questions || []
        });
      }
      setIsEditing(false);
      setEditingQuiz(null);
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'quizzes');
    }
  };

  const handleDelete = async (quiz: Quiz) => {
    if (!quiz.id) return;
    if (!confirm(`Are you sure you want to delete the quiz "${quiz.title}"? This action cannot be undone.`)) return;
    
    try {
      await deleteDoc(doc(db, 'quizzes', quiz.id));
      setQuizzes(prev => prev.filter(q => q.id !== quiz.id));
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete quiz. Please try again.");
      handleFirestoreError(error, OperationType.DELETE, `quizzes/${quiz.id}`);
    }
  };

  if (isEditing) {
    const selectedCourse = courses.find(c => c.id === editingQuiz?.courseId);

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold">{editingQuiz?.id ? 'Edit Quiz' : 'Add Quiz'}</h3>
          <button onClick={() => setIsEditing(false)}><X size={20} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSave} className="p-8 space-y-6">
           <div className="grid md:grid-cols-2 gap-6">
             <div>
               <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Quiz Title</label>
               <input required type="text" value={editingQuiz?.title || ''} onChange={e => setEditingQuiz({...editingQuiz, title: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" placeholder="e.g. Arabic Alphabet Quiz" />
             </div>
             <div>
               <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Course</label>
               <select required value={editingQuiz?.courseId || ''} onChange={e => setEditingQuiz({...editingQuiz, courseId: e.target.value, lessonId: ''})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                 <option value="">Select Course</option>
                 {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Lesson (Optional)</label>
               <select value={editingQuiz?.lessonId || ''} onChange={e => setEditingQuiz({...editingQuiz, lessonId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" disabled={!selectedCourse}>
                 <option value="">Final Course Quiz</option>
                 {selectedCourse?.lessons?.map((l: any) => <option key={l.id} value={l.id}>{l.title}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Pass Mark (%)</label>
               <input required type="number" value={editingQuiz?.passingScore || 0} onChange={e => setEditingQuiz({...editingQuiz, passingScore: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" placeholder="e.g. 70" />
             </div>
           </div>

           <div className="pt-6 border-t border-gray-100">
             <div className="flex justify-between items-center mb-4">
               <h4 className="font-bold">Questions</h4>
               <div className="flex gap-2">
                 <Button type="button" variant="outline" size="sm" onClick={() => setEditingQuiz({...editingQuiz, questions: [...(editingQuiz?.questions||[]), { id: Date.now().toString(), type: 'mcq', question: '', options: ['', ''], correctAnswer: '', marks: 10 }]})}>+ Add MCQ</Button>
                 <Button type="button" variant="outline" size="sm" onClick={() => setEditingQuiz({...editingQuiz, questions: [...(editingQuiz?.questions||[]), { id: Date.now().toString(), type: 'written', question: '', marks: 10 }]})}>+ Add Written</Button>
               </div>
             </div>

             <div className="space-y-4">
               {editingQuiz?.questions?.map((q, qIndex) => (
                 <div key={q.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl relative group">
                   <button type="button" onClick={() => setEditingQuiz({...editingQuiz, questions: editingQuiz.questions?.filter(x => x.id !== q.id)})} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="md:col-span-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Question ({q.type})</label>
                        <RichTextEditor
                          value={q.question}
                          onChange={content => {
                            const qs = [...(editingQuiz.questions||[])];
                            qs[qIndex].question = content;
                            setEditingQuiz({...editingQuiz, questions: qs});
                          }}
                          placeholder="Enter question text..."
                          className="mt-1 h-[180px] mb-12"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Marks</label>
                        <input type="number" required value={q.marks} onChange={e => {
                          const qs = [...(editingQuiz.questions||[])];
                          qs[qIndex].marks = Number(e.target.value);
                          setEditingQuiz({...editingQuiz, questions: qs});
                        }} className="w-full px-3 py-2 mt-1 rounded border border-gray-200" />
                      </div>
                   </div>

                   {q.type === 'mcq' && (
                     <div className="space-y-2 mt-2 pl-4 border-l-2 border-blue-200">
                       <label className="text-[10px] font-bold text-gray-400 uppercase">Options & Correct Answer</label>
                       {q.options?.map((opt, oIndex) => (
                         <div key={oIndex} className="flex items-center gap-2">
                           <input type="radio" name={`correct_${q.id}`} checked={q.correctAnswer === oIndex.toString()} onChange={() => {
                              const qs = [...(editingQuiz.questions||[])];
                              qs[qIndex].correctAnswer = oIndex.toString();
                              setEditingQuiz({...editingQuiz, questions: qs});
                           }} />
                           <input type="text" required value={opt} onChange={e => {
                              const qs = [...(editingQuiz.questions||[])];
                              qs[qIndex].options![oIndex] = e.target.value;
                              if (q.correctAnswer === opt) qs[qIndex].correctAnswer = e.target.value;
                              setEditingQuiz({...editingQuiz, questions: qs});
                           }} className="flex-grow px-3 py-1 rounded border border-gray-200 text-sm" placeholder={`Option ${oIndex + 1}`} />
                           <button type="button" onClick={() => {
                              const qs = [...(editingQuiz.questions||[])];
                              qs[qIndex].options = qs[qIndex].options?.filter((_, i) => i !== oIndex);
                              setEditingQuiz({...editingQuiz, questions: qs});
                           }} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                         </div>
                       ))}
                       <button type="button" onClick={() => {
                          const qs = [...(editingQuiz.questions||[])];
                          qs[qIndex].options?.push('');
                          setEditingQuiz({...editingQuiz, questions: qs});
                       }} className="text-xs text-blue-500 font-bold mt-2">+ Add Option</button>
                     </div>
                   )}
                 </div>
               ))}
               {(!editingQuiz?.questions || editingQuiz.questions.length === 0) && (
                 <div className="text-center py-8 text-gray-400 text-sm">No questions added yet.</div>
               )}
             </div>
           </div>

           <Button type="submit" fullWidth>Save Quiz</Button>
        </form>
      </div>
    );
  }

  const filtered = quizzes.filter(q => q.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div className="relative max-w-sm flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search quizzes..." className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-100 focus:outline-none" value={search} onChange={e => setSearch(e.target.value)} />
         </div>
         <Button onClick={() => { setEditingQuiz({ title: '', courseId: '', passingScore: 70, questions: [], status: 'draft' }); setIsEditing(true); }} className="gap-2"><Plus size={18} /> Create Quiz</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(quiz => (
          <div key={quiz.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-50 text-blue-600 p-3 rounded-xl"><HelpCircle size={24} /></div>
              <div className="flex gap-2">
                <button onClick={async () => {
                   await updateDoc(doc(db, 'quizzes', quiz.id!), { status: quiz.status === 'published' ? 'draft' : 'published' });
                   fetchData();
                }} className={cn("text-[10px] font-bold px-2 py-1 rounded-full uppercase", quiz.status === 'published' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}>{quiz.status}</button>
              </div>
            </div>
            <h3 className="font-bold text-lg mb-1">{quiz.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{courses.find(c => c.id === quiz.courseId)?.title}</p>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 font-medium">
              <span>{quiz.questions?.length || 0} Questions</span>
              <span>•</span>
              <span>Pass: {quiz.passingScore}%</span>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
              <button onClick={() => { setEditingQuiz(quiz); setIsEditing(true); }} className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-bold transition-colors">Edit</button>
              <button onClick={() => handleDelete(quiz)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Quiz"><Trash2 size={18}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
