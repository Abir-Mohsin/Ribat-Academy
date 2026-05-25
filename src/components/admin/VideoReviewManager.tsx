import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Loader2, 
  Video,
  X,
  PlayCircle,
  Image as ImageIcon
} from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Button } from '@/src/components/Button';
import { cn } from '@/src/lib/utils';

interface VideoReview {
  id: string;
  name: string;
  role: string;
  videoUrl: string;
  thumbnail: string;
  createdAt: any;
}

export function VideoReviewManager() {
  const [reviews, setReviews] = useState<VideoReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingR, setEditingR] = useState<Partial<VideoReview> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'videoReviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoReview)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'videoReviews');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingR?.name || !editingR?.videoUrl) return;

    setSaving(true);
    try {
      if (editingR.id) {
        await updateDoc(doc(db, 'videoReviews', editingR.id), {
          ...editingR,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'videoReviews'), {
          ...editingR,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setIsEditing(false);
      setEditingR(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'videoReviews');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video review?')) return;
    try {
      await deleteDoc(doc(db, 'videoReviews', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `videoReviews/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-xl font-bold flex items-center gap-2">
           <Video size={24} className="text-[#0EA5E9]" />
           Video Testimonials
         </h2>
         <Button className="gap-2" onClick={() => {
           setEditingR({ name: '', role: '', videoUrl: '', thumbnail: '' });
           setIsEditing(true);
         }}>
           <Plus size={18} /> Add Video Review
         </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-gray-300" size={32} /></div>
        ) : reviews.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
            <div className="aspect-video relative overflow-hidden">
               <img referrerPolicy="no-referrer" src={r.thumbnail} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <PlayCircle className="text-white opacity-80" size={32} />
               </div>
               <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingR(r); setIsEditing(true); }} className="p-1.5 bg-white/90 rounded-lg text-blue-600 shadow-lg">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="p-1.5 bg-white/90 rounded-lg text-red-600 shadow-lg">
                    <Trash2 size={14} />
                  </button>
               </div>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-sm tracking-tight">{r.name}</h4>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">{r.role}</p>
            </div>
          </div>
        ))}
      </div>

      {reviews.length === 0 && !loading && (
        <div className="py-20 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-100">
           <Video size={48} className="mx-auto mb-4 opacity-10" />
           <p>No video reviews added yet.</p>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-lg">Manage Video Review</h3>
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
                    value={editingR?.name || ''}
                    onChange={e => setEditingR({...editingR, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-sans text-sm"
                    placeholder="e.g. Ahmad"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Role/Course</label>
                  <input 
                    type="text" 
                    value={editingR?.role || ''}
                    onChange={e => setEditingR({...editingR, role: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-sans text-sm"
                    placeholder="e.g. Hifz Student"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Video URL (YouTube/Drive)</label>
                <div className="relative">
                  <PlayCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    required
                    type="text" 
                    value={editingR?.videoUrl || ''}
                    onChange={e => setEditingR({...editingR, videoUrl: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-sans text-sm"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Thumbnail URL</label>
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    required
                    type="text" 
                    value={editingR?.thumbnail || ''}
                    onChange={e => setEditingR({...editingR, thumbnail: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-sans text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <Button type="submit" fullWidth disabled={saving}>
                {saving ? "Saving..." : (editingR?.id ? "Update Video" : "Add Video")}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
