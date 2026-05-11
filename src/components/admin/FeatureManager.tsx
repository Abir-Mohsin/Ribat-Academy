import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { RichTextEditor } from '@/src/components/RichTextEditor';
import { Button } from '@/src/components/Button';
import { Plus, Trash2, Edit2, Loader2, Save, X, Star } from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  colorClass: string;
  order: number;
}

const AVAILABLE_ICONS = [
  'GraduationCap', 'Video', 'BookOpen', 'Star', 'CheckCircle', 'Lightbulb', 'Target', 'Award', 'Globe', 'Users', 'Zap', 'Shield'
];

const AVAILABLE_COLORS = [
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
  { label: 'Amber', value: 'amber' },
  { label: 'Purple', value: 'purple' },
  { label: 'Rose', value: 'rose' },
];

export function FeatureManager() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFeature, setCurrentFeature] = useState<Partial<Feature> | null>(null);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'home_features'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feature));
      setFeatures(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'home_features');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFeature?.title || !currentFeature?.description) return;

    try {
      if (currentFeature.id) {
        await updateDoc(doc(db, 'home_features', currentFeature.id), {
          ...currentFeature,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'home_features'), {
          ...currentFeature,
          order: features.length,
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
      fetchFeatures();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'home_features');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature?')) return;
    try {
      await deleteDoc(doc(db, 'home_features', id));
      setFeatures(features.filter(f => f.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `home_features/${id}`);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
            <Star className="text-amber-500" size={24} /> 
            Home Page Features
          </h2>
          <p className="text-gray-500 text-sm">Manage the 3 column features displayed on the Home Page.</p>
        </div>
        <Button onClick={() => {
          setCurrentFeature({ title: '', description: '', icon: 'GraduationCap', colorClass: 'blue' });
          setIsEditing(true);
        }} className="gap-2">
          <Plus size={18} /> Add Feature
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">
          <Loader2 size={32} className="animate-spin mx-auto mb-4" />
          <p>Loading features...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.length === 0 ? (
             <div className="col-span-full py-20 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
               <p>No features found. Add some to display on the homepage.</p>
             </div>
          ) : features.map((feature, i) => {
            const colors: any = {
              blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-[#0EA5E9]' },
              green: { bg: 'bg-green-50', text: 'text-green-600', iconBg: 'bg-green-500' },
              amber: { bg: 'bg-amber-50', text: 'text-amber-600', iconBg: 'bg-amber-500' },
              purple: { bg: 'bg-purple-50', text: 'text-purple-600', iconBg: 'bg-purple-500' },
              rose: { bg: 'bg-rose-50', text: 'text-rose-600', iconBg: 'bg-rose-500' }
            };
            const c = colors[feature.colorClass] || colors.blue;

            return (
            <div key={feature.id} className={`p-6 rounded-2xl border border-gray-100 ${c.bg} relative group`}>
               <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                  <button onClick={() => { setCurrentFeature(feature); setIsEditing(true); }} className="p-2 bg-white rounded-lg text-blue-600 shadow-sm hover:scale-105 transition-transform"><Edit2 size={16}/></button>
                  <button onClick={() => handleDelete(feature.id)} className="p-2 bg-white rounded-lg text-red-600 shadow-sm hover:scale-105 transition-transform"><Trash2 size={16}/></button>
               </div>
               <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${c.iconBg} text-white font-bold`}>
                 {feature.icon || '★'}
               </div>
               <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
               <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
            );
          })}
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden">
             <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <h3 className="font-bold">{currentFeature?.id ? 'Edit Feature' : 'Add Feature'}</h3>
               <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                 <X size={20} />
               </button>
             </div>
             
             <form onSubmit={handleSave} className="p-8 space-y-6">
                <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Title</label>
                   <input required type="text" value={currentFeature?.title || ''} 
                    onChange={e => setCurrentFeature({...currentFeature, title: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold text-lg" placeholder="e.g. Structured Learning" />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Description</label>
                   <RichTextEditor 
                     value={currentFeature?.description || ''} 
                     onChange={content => setCurrentFeature({...currentFeature, description: content})}
                     placeholder="Provide details here..."
                     className="h-[80px] mb-8"
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Icon Name</label>
                    <select value={currentFeature?.icon || 'GraduationCap'} 
                      onChange={e => setCurrentFeature({...currentFeature, icon: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none"
                    >
                      {AVAILABLE_ICONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Color Theme</label>
                    <select value={currentFeature?.colorClass || 'blue'} 
                      onChange={e => setCurrentFeature({...currentFeature, colorClass: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none capitalize"
                    >
                      {AVAILABLE_COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <Button type="submit" fullWidth className="py-4">Save Feature</Button>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}
