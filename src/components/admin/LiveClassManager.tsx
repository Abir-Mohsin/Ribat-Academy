import { getThumbnailUrl } from '@/src/lib/drive';
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  query,
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Loader2, 
  Video, 
  X, 
  Calendar,
  Clock,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/src/components/Button';
import { cn } from '@/src/lib/utils';

export interface LiveClass {
  id?: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  instructor: string;
  startTime: string; // ISO String or similar
  duration: string;
  meetingLink: string;
  status: 'draft' | 'published' | 'completed';
  createdAt?: any;
}

export function LiveClassManager() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingClass, setEditingClass] = useState<Partial<LiveClass> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'live_classes'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveClass)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'live_classes');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass?.title || !editingClass?.startTime) return;

    setSaving(true);
    try {
      const data = {
        ...editingClass,
        updatedAt: serverTimestamp(),
      };

      if (editingClass.id) {
        await updateDoc(doc(db, 'live_classes', editingClass.id), data);
      } else {
        await addDoc(collection(db, 'live_classes'), {
          ...data,
          createdAt: serverTimestamp(),
          status: 'published',
        });
      }
      setIsEditing(false);
      setEditingClass(null);
      fetchClasses();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'live_classes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this live class?')) return;
    try {
      await deleteDoc(doc(db, 'live_classes', id));
      setClasses(classes.filter(c => c.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `live_classes/${id}`);
    }
  };

  const filteredClasses = classes.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold">
            {editingClass?.id ? 'Edit Live Class' : 'Create New Live Class'}
          </h3>
          <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-8 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Class Title</label>
                <input 
                  type="text" 
                  value={editingClass?.title || ''}
                  onChange={e => setEditingClass({...editingClass, title: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Price (BDT)</label>
                <input 
                  type="number" 
                  value={editingClass?.price || ''}
                  onChange={e => setEditingClass({...editingClass, price: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Thumbnail URL (Drive Link/Image)</label>
                <input 
                  type="text" 
                  value={editingClass?.thumbnail || ''}
                  onChange={e => setEditingClass({...editingClass, thumbnail: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description</label>
              <textarea 
                value={editingClass?.description || ''}
                onChange={e => setEditingClass({...editingClass, description: e.target.value})}
                className="w-full h-[180px] px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 resize-none"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-gray-50">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Instructor</label>
              <input 
                type="text" 
                value={editingClass?.instructor || ''}
                onChange={e => setEditingClass({...editingClass, instructor: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100"
                placeholder="Name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Start Time</label>
              <input 
                type="datetime-local" 
                value={editingClass?.startTime || ''}
                onChange={e => setEditingClass({...editingClass, startTime: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Duration (e.g. 1.5 Hours)</label>
              <input 
                type="text" 
                value={editingClass?.duration || ''}
                onChange={e => setEditingClass({...editingClass, duration: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100"
              />
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Meeting Link (Zoom/YouTube Live/Google Meet)</label>
             <input 
               type="text" 
               value={editingClass?.meetingLink || ''}
               onChange={e => setEditingClass({...editingClass, meetingLink: e.target.value})}
               className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-mono text-sm"
               placeholder="https://zoom.us/j/..."
             />
          </div>

          <div className="flex justify-end gap-4 pt-8 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {editingClass?.id ? 'Update Live Class' : 'Create Live Class'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div className="relative max-w-sm flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search live classes..." 
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-100 focus:outline-none shadow-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
         </div>
         <Button className="gap-2" onClick={() => {
           setEditingClass({
             title: '',
             description: '',
             price: 0,
             thumbnail: '',
             instructor: '',
             startTime: '',
             duration: '',
             meetingLink: '',
             status: 'published'
           });
           setIsEditing(true);
         }}>
           <Plus size={18} /> Add Live Class
         </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
              <th className="px-6 py-4">Class Details</th>
              <th className="px-6 py-4">Schedule</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-20 text-center text-gray-300">
                  <Loader2 className="animate-spin mx-auto" size={32} />
                </td>
              </tr>
            ) : filteredClasses.map(item => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 aspect-video bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {item.thumbnail ? (
                        <img src={getThumbnailUrl(item.thumbnail)} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={20} /></div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm block">{item.title}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        By {item.instructor || 'Staff'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <Calendar size={14} className="text-blue-500" />
                      {new Date(item.startTime).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      <Clock size={12} className="text-gray-400" />
                      {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({item.duration})
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className="font-bold text-sm">৳{item.price}</span>
                </td>
                <td className="px-6 py-4">
                   <button 
                    onClick={async () => {
                      const nextStatus = item.status === 'published' ? 'completed' : item.status === 'completed' ? 'draft' : 'published';
                      await updateDoc(doc(db, 'live_classes', item.id!), { status: nextStatus });
                      setClasses(classes.map(c => c.id === item.id ? { ...c, status: nextStatus } : c));
                    }}
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                      item.status === 'published' ? "bg-green-100 text-green-700" : 
                      item.status === 'completed' ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-600"
                    )}
                   >
                     {item.status}
                   </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {item.meetingLink && (
                      <a href={item.meetingLink} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-blue-500">
                        <ExternalLink size={18} />
                      </a>
                    )}
                    <button 
                      onClick={() => {
                        setEditingClass(item);
                        setIsEditing(true);
                      }}
                      className="p-2 text-gray-400 hover:text-[#0EA5E9]"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => item.id && handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredClasses.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-20 text-center text-gray-400">
                   No live classes scheduled.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
