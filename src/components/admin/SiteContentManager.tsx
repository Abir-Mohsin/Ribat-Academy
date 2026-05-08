import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Plus, 
  Trash2, 
  UserPlus, 
  Info, 
  Loader2,
  X,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { collection, doc, getDoc, setDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Button } from '@/src/components/Button';
import { cn } from '@/src/lib/utils';

interface Instructor {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  order: number;
}

interface SiteSettings {
  aboutTitle: string;
  aboutDescription: string;
  missionTitle: string;
  missionDescription: string;
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  heroVideoId: string;
}

export function SiteContentManager() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    aboutTitle: 'Our Story & Vision',
    aboutDescription: 'Ribat is committed to providing balanced Islamic education that bridges traditional wisdom with contemporary challenges.',
    missionTitle: 'Our Mission',
    missionDescription: 'To empower the next generation of Muslims with knowledge and character through accessible, authentic digital learning.',
    heroBadge: 'Empowering the Next Generation',
    heroTitle: 'Islamic + Modern Education Platform',
    heroDescription: 'Bridging the gap between timeless Islamic values and contemporary skills. Join over 5,000+ students worldwide mastering Arabic, Deen, and Digital Technology.',
    heroImage: '',
    heroVideoId: ''
  });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [isEditingInstructor, setIsEditingInstructor] = useState(false);
  const [currentInstructor, setCurrentInstructor] = useState<Partial<Instructor> | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Settings
      const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setSettings(prev => ({ ...prev, ...data }));
      }

      // Fetch Instructors
      const instSnap = await getDocs(query(collection(db, 'instructors'), orderBy('order', 'asc')));
      setInstructors(instSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Instructor)));
    } catch (error) {
      console.error("Error fetching about data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        ...settings,
        updatedAt: serverTimestamp()
      });
      alert('Settings saved successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/general');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInstructor?.name) return;

    try {
      if (currentInstructor.id) {
        await updateDoc(doc(db, 'instructors', currentInstructor.id), {
          ...currentInstructor,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'instructors'), {
          ...currentInstructor,
          order: instructors.length,
          createdAt: serverTimestamp()
        });
      }
      setIsEditingInstructor(false);
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'instructors');
    }
  };

  const handleDeleteInstructor = async (id: string) => {
    if (!confirm('Delete this instructor?')) return;
    try {
      await deleteDoc(doc(db, 'instructors', id));
      setInstructors(instructors.filter(i => i.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `instructors/${id}`);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Site Content Section */}
      <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
          <Info size={20} className="text-[#0EA5E9]" />
          Page Content & Text
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <h4 className="text-sm font-bold border-b pb-2">About Page Content</h4>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Main About Title</label>
              <input 
                type="text" 
                value={settings.aboutTitle}
                onChange={e => setSettings({...settings, aboutTitle: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-sans text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Main Description</label>
              <textarea 
                value={settings.aboutDescription}
                onChange={e => setSettings({...settings, aboutDescription: e.target.value})}
                className="w-full h-32 px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 resize-none font-sans text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Mission Title</label>
              <input 
                type="text" 
                value={settings.missionTitle}
                onChange={e => setSettings({...settings, missionTitle: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-sans text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Mission Description</label>
              <textarea 
                value={settings.missionDescription}
                onChange={e => setSettings({...settings, missionDescription: e.target.value})}
                className="w-full h-32 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 resize-none font-sans text-sm p-4"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-bold border-b pb-2">Home Hero Content</h4>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Hero Badge (Small Text)</label>
              <input 
                type="text" 
                value={settings.heroBadge}
                onChange={e => setSettings({...settings, heroBadge: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-sans text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Hero Main Title</label>
              <input 
                type="text" 
                value={settings.heroTitle}
                onChange={e => setSettings({...settings, heroTitle: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-sans text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Hero Description</label>
              <textarea 
                value={settings.heroDescription}
                onChange={e => setSettings({...settings, heroDescription: e.target.value})}
                className="w-full h-32 px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 resize-none font-sans text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Hero Image URL (or Video Poster)</label>
                <input 
                  type="text" 
                  value={settings.heroImage}
                  onChange={e => setSettings({...settings, heroImage: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-sans text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Hero YouTube/Vimeo ID</label>
                <input 
                  type="text" 
                  value={settings.heroVideoId}
                  onChange={e => setSettings({...settings, heroVideoId: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-sans text-sm"
                />
              </div>
            </div>
          </div>
        </div>
        
        <Button onClick={handleSaveSettings} disabled={savingSettings} className="gap-2">
          {savingSettings ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Update Page Content
        </Button>
      </section>

      {/* Instructors Section */}
      <section>
        <div className="flex justify-between items-center mb-8">
           <h3 className="text-xl font-bold flex items-center gap-2">
             <UserPlus size={20} className="text-[#0EA5E9]" />
             Instructors & Team
           </h3>
           <Button variant="outline" className="gap-2" onClick={() => {
             setCurrentInstructor({ name: '', role: '', bio: '', image: '' });
             setIsEditingInstructor(true);
           }}>
             <Plus size={18} /> Add Instructor
           </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-gray-300" size={32} /></div>
          ) : instructors.map(i => (
            <div key={i.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm group">
               <div className="aspect-[3/4] relative overflow-hidden bg-gray-100">
                  {i.image ? (
                    <img src={i.image} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 italic text-xs">No image</div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                     <button 
                       onClick={() => { setCurrentInstructor(i); setIsEditingInstructor(true); }}
                       className="p-2 bg-white rounded-xl text-blue-600 hover:scale-110 transition-transform"
                     >
                       <Plus size={20} />
                     </button>
                     <button 
                       onClick={() => handleDeleteInstructor(i.id)}
                       className="p-2 bg-white rounded-xl text-red-600 hover:scale-110 transition-transform"
                     >
                       <Trash2 size={20} />
                     </button>
                  </div>
               </div>
               <div className="p-6 text-center">
                  <h4 className="font-bold text-sm tracking-tight">{i.name}</h4>
                  <p className="text-[#0EA5E9] text-[10px] font-bold uppercase tracking-widest mt-1">{i.role}</p>
               </div>
            </div>
          ))}
        </div>
      </section>

      {/* Instructor Modal */}
      {isEditingInstructor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden">
             <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <h3 className="font-bold">Edit Instructor Profile</h3>
               <button onClick={() => setIsEditingInstructor(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                 <X size={20} />
               </button>
             </div>
             <form onSubmit={handleSaveInstructor} className="p-8 space-y-6">
                <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Name</label>
                   <input required type="text" value={currentInstructor?.name || ''} 
                    onChange={e => setCurrentInstructor({...currentInstructor, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Title/Role</label>
                   <input required type="text" value={currentInstructor?.role || ''} 
                    onChange={e => setCurrentInstructor({...currentInstructor, role: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none" />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Image URL</label>
                   <input type="text" value={currentInstructor?.image || ''} 
                    onChange={e => setCurrentInstructor({...currentInstructor, image: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none" placeholder="https://..." />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Short Bio</label>
                   <textarea value={currentInstructor?.bio || ''} 
                    onChange={e => setCurrentInstructor({...currentInstructor, bio: e.target.value})}
                    className="w-full h-24 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none resize-none" />
                </div>
                <Button type="submit" fullWidth>Save Profile</Button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
