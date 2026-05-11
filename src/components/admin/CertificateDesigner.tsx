import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/src/components/Button';
import { Loader2, Save, Eye, Palette, Type, Award, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { CertificateView } from '../CertificateView';

interface CertificateSettings {
  backgroundUrl: string;
  textColor: string;
  nameTop: number;
  nameFontSize: number;
  courseTop: number;
  courseFontSize: number;
  dateTop: number;
  dateLeft: number;
  idTop: number;
  idLeft: number;
}

export function CertificateDesigner() {
  const [settings, setSettings] = useState<CertificateSettings>({
    backgroundUrl: '',
    textColor: '#1e293b',
    nameTop: 45,
    nameFontSize: 80,
    courseTop: 60,
    courseFontSize: 40,
    dateTop: 80,
    dateLeft: 20,
    idTop: 90,
    idLeft: 50
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'certificate');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          backgroundUrl: data.backgroundUrl || '',
          textColor: data.textColor || '#1e293b',
          nameTop: data.nameTop ?? 45,
          nameFontSize: data.nameFontSize ?? 80,
          courseTop: data.courseTop ?? 60,
          courseFontSize: data.courseFontSize ?? 40,
          dateTop: data.dateTop ?? 80,
          dateLeft: data.dateLeft ?? 20,
          idTop: data.idTop ?? 90,
          idLeft: data.idLeft ?? 50
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'certificate'), {
        ...settings,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert('Settings saved successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/certificate');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Certificate Settings</h2>
          <p className="text-slate-500">Provide a custom background link and adjust text positions (%)</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="gap-2">
            <Eye size={18} /> {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button onClick={saveSettings} disabled={saving} className="gap-2 bg-blue-600">
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold mb-2">
              <ImageIcon size={20} className="text-blue-500" />
              <span>Template Background</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Custom Certificate Link (Google Drive / Direct Link)</label>
              <input 
                type="text" 
                value={settings.backgroundUrl} 
                onChange={e => setSettings({...settings, backgroundUrl: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm"
                placeholder="https://drive.google.com/..."
              />
              <p className="mt-2 text-[10px] text-slate-400 italic font-medium leading-relaxed">
                <span className="text-blue-600 block mb-1 font-bold">Recommended:</span>
                1. Upload your design to Google Drive<br/>
                2. Set access to "Anyone with the link"<br/>
                3. Paste the sharing link here.<br/>
                <span className="opacity-70 mt-1 block">Best resolution: 1414 x 1000 px (Landscape).</span>
              </p>
            </div>
          </div>
          
          {/* Global Text Style and Positioning moved here for compactness */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold mb-2">
              <Palette size={20} className="text-blue-500" />
              <span>Visual & Position Controls</span>
            </div>
            
            <div className="pb-4 border-b border-slate-50">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Global Text Color</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={settings.textColor} 
                  onChange={e => setSettings({...settings, textColor: e.target.value})}
                  className="h-10 w-10 rounded-lg cursor-pointer"
                />
                <input 
                  type="text" 
                  value={settings.textColor} 
                  onChange={e => setSettings({...settings, textColor: e.target.value})}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 pt-2">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Student Name
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Top Position (%)</label>
                    <input type="number" step="0.5" value={settings.nameTop} onChange={e => setSettings({...settings, nameTop: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Font Size (px)</label>
                    <input type="number" value={settings.nameFontSize} onChange={e => setSettings({...settings, nameFontSize: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Course Title
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Top Position (%)</label>
                    <input type="number" step="0.5" value={settings.courseTop} onChange={e => setSettings({...settings, courseTop: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Font Size (px)</label>
                    <input type="number" value={settings.courseFontSize} onChange={e => setSettings({...settings, courseFontSize: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700">Date Box</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Top (%)</label>
                      <input type="number" step="0.5" value={settings.dateTop} onChange={e => setSettings({...settings, dateTop: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Left (%)</label>
                      <input type="number" step="0.5" value={settings.dateLeft} onChange={e => setSettings({...settings, dateLeft: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700">Cert ID Box</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Top (%)</label>
                      <input type="number" step="0.5" value={settings.idTop} onChange={e => setSettings({...settings, idTop: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Left (%)</label>
                      <input type="number" step="0.5" value={settings.idLeft} onChange={e => setSettings({...settings, idLeft: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${showPreview ? "col-span-12" : "hidden lg:block lg:col-span-7"}`}>
           <div className="sticky top-24">
             <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Award size={16} /> Large Live Preview
                </span>
                <p className="text-[10px] text-slate-400">Scale automatically adjusted for screen</p>
             </div>
             <div className="border shadow-2xl rounded-[32px] overflow-hidden bg-white">
                <div className="transform scale-[0.9] lg:scale-[0.8] xl:scale-[0.95] origin-top-left p-4">
                  <CertificateView 
                    userName="S. M. ABIR MOHSIN"
                    courseTitle="PROFESSIONAL GRAPHIC DESIGN MASTERCLASS"
                    issueDate={new Date().toLocaleDateString('en-GB')}
                    certificateId="CERT-ID-2024-XXXX"
                    settings={settings}
                  />
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
