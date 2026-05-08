import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Loader2, 
  Star,
  User,
  X,
  MessageSquare
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Button } from '@/src/components/Button';
import { cn } from '@/src/lib/utils';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar?: string;
  rating?: number;
  createdAt: any;
}

export function TestimonialManager() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingT, setEditingT] = useState<Partial<Testimonial> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTestimonials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'testimonials');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingT?.name || !editingT?.content) return;

    setSaving(true);
    try {
      if (editingT.id) {
        await updateDoc(doc(db, 'testimonials', editingT.id), {
          ...editingT,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'testimonials'), {
          ...editingT,
          rating: 5,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setIsEditing(false);
      setEditingT(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'testimonials');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      await deleteDoc(doc(db, 'testimonials', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `testimonials/${id}`);
    }
  };

  const filtered = testimonials.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search testimonials..." 
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl focus:outline-none border border-gray-100 font-sans text-sm shadow-sm" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
         </div>
         <Button className="gap-2 shrink-0" onClick={() => {
           setEditingT({ name: '', role: '', content: '', avatar: '' });
           setIsEditing(true);
         }}>
           <Plus size={18} /> Add Review
         </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-gray-300" size={32} /></div>
        ) : filtered.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {t.avatar ? <img src={t.avatar} className="w-full h-full object-cover" /> : <User size={20} className="text-gray-400" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{t.name}</h4>
                  <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">{t.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => { setEditingT(t); setIsEditing(true); }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 italic leading-relaxed mb-4">"{t.content}"</p>
            
            <div className="flex gap-0.5 text-amber-400">
              {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="currentColor" />)}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="py-20 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-100">
           <MessageSquare size={48} className="mx-auto mb-4 opacity-10" />
           <p>No testimonials found. Add one to show on Homepage!</p>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-lg">Manage Student Review</h3>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Student Name</label>
                  <input 
                    required
                    type="text" 
                    value={editingT?.name || ''}
                    onChange={e => setEditingT({...editingT, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-sans text-sm"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Role/Course</label>
                  <input 
                    type="text" 
                    value={editingT?.role || ''}
                    onChange={e => setEditingT({...editingT, role: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-sans text-sm"
                    placeholder="e.g. Arabic Learner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Avatar URL (Optional)</label>
                <input 
                  type="text" 
                  value={editingT?.avatar || ''}
                  onChange={e => setEditingT({...editingT, avatar: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-sans text-sm"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Review Content</label>
                <textarea 
                  required
                  value={editingT?.content || ''}
                  onChange={e => setEditingT({...editingT, content: e.target.value})}
                  className="w-full h-32 px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 resize-none font-sans text-sm leading-relaxed"
                  placeholder="Write student testimonial..."
                />
              </div>

              <Button type="submit" fullWidth disabled={saving}>
                {saving ? "Saving..." : (editingT?.id ? "Update Review" : "Add Review")}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
