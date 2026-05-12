import React, { useRef, useState, useEffect } from 'react';
import { Award, ShieldCheck, CheckCircle2, Download } from 'lucide-react';
import { Button } from './Button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { db } from '@/src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getDownloadUrl } from '@/src/lib/drive';

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

interface CertificateViewProps {
  userName: string;
  courseTitle: string;
  issueDate: string;
  certificateId: string;
  onClose?: () => void;
  settings?: CertificateSettings;
}

export function CertificateView({ 
  userName, 
  courseTitle, 
  issueDate, 
  certificateId,
  onClose,
  settings: initialSettings
}: CertificateViewProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialSettings);
  const [settings, setSettings] = useState<CertificateSettings | null>(initialSettings || null);

  useEffect(() => {
    if (!initialSettings) {
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
          console.error("Error fetching certificate settings:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSettings();
    } else {
      setSettings(initialSettings);
      setIsLoading(false);
    }
  }, [initialSettings]);

  const handleDownloadPDF = async () => {
    if (!certificateRef.current || !settings) return;
    setIsDownloading(true);
    
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            const style = window.getComputedStyle(el);
            ['color', 'backgroundColor', 'borderColor'].forEach(prop => {
              const val = style.getPropertyValue(prop);
              if (val && val.includes('oklch')) {
                 if (prop === 'color') el.style.color = settings.textColor;
                 if (prop === 'backgroundColor' && val !== 'transparent') el.style.backgroundColor = '#ffffff';
                 if (prop === 'borderColor') el.style.borderColor = settings.textColor;
              }
            });
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Certificate-${userName}-${courseTitle}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[40px] shadow-xl w-full max-w-5xl mx-auto">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-6 font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Premium Template...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4 md:p-8 bg-slate-50/50 rounded-[40px] animate-in fade-in duration-700">
      <p className="md:hidden text-xs text-gray-500 font-bold mb-4 uppercase tracking-widest text-center w-full">Scroll horizontally to view</p>
      <div className="w-full overflow-x-auto pb-4 md:pb-8 no-scrollbar scroll-smooth relative">
        <div 
          ref={certificateRef}
          className="certificate-container relative bg-white min-w-[1000px] aspect-[1.414/1] shadow-2xl w-full mx-auto overflow-hidden bg-cover bg-center"
          style={{ 
            backgroundImage: settings.backgroundUrl ? `url(${getDownloadUrl(settings.backgroundUrl)})` : 'none',
            color: settings.textColor
          }}
        >
          {/* Fallback pattern if no background image */}
          {!settings.backgroundUrl && (
            <div className="absolute inset-0 border-[40px] border-double opacity-20 pointer-events-none" style={{ borderColor: settings.textColor }} />
          )}

          <div className="absolute inset-0 z-10 pointer-events-none">
            {/* Student Name */}
            <div 
               className="absolute left-0 right-0 text-center font-bold px-20"
               style={{ 
                 top: `${settings.nameTop}%`, 
                 fontSize: `${settings.nameFontSize}px`,
                 fontFamily: "'Dancing Script', cursive",
                 color: settings.textColor
               }}
            >
              {userName}
            </div>

            {/* Course Title */}
            <div 
               className="absolute left-0 right-0 text-center font-black uppercase tracking-widest px-24"
               style={{ 
                 top: `${settings.courseTop}%`, 
                 fontSize: `${settings.courseFontSize}px`,
                 fontFamily: "'Playfair Display', serif",
                 color: settings.textColor
               }}
            >
              {courseTitle}
            </div>

            {/* Date */}
            <div 
               className="absolute font-black tracking-widest"
               style={{ 
                 top: `${settings.dateTop}%`, 
                 left: `${settings.dateLeft}%`,
                 fontSize: '18px',
                 fontFamily: "'Playfair Display', serif",
                 color: settings.textColor
               }}
            >
              {issueDate}
            </div>

            {/* Certificate ID */}
            <div 
               className="absolute font-mono opacity-50"
               style={{ 
                 top: `${settings.idTop}%`, 
                 left: `${settings.idLeft}%`,
                 fontSize: '12px',
                 transform: 'translateX(-50%)',
                 color: settings.textColor
               }}
            >
               ID: {certificateId}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 w-full mt-4 bg-white/80 backdrop-blur-xl p-8 rounded-[32px] border border-white shadow-2xl">
        <Button 
          onClick={handleDownloadPDF} 
          disabled={isDownloading}
          className="min-w-[240px] h-16 text-xl font-black gap-3 rounded-2xl shadow-xl shadow-blue-100/50 bg-[#0EA5E9]"
        >
          {isDownloading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download size={28} /> Download PDF
            </>
          )}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => window.print()}
          className="min-w-[240px] h-16 text-xl font-black gap-3 rounded-2xl border-2"
          style={{ borderColor: `${settings.textColor}20`, color: settings.textColor }}
        >
          Print Certificate
        </Button>
        {onClose && (
          <Button variant="ghost" onClick={onClose} className="min-w-[120px] h-16 text-lg font-bold opacity-60 hover:opacity-100">
            Close
          </Button>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&display=swap');
        
        @media print {
          body * {
            visibility: hidden;
          }
          .certificate-container, .certificate-container * {
            visibility: visible;
          }
          .certificate-container {
             position: fixed;
             left: 0;
             top: 0;
             width: 100vw !important;
             height: 100vh !important;
             box-shadow: none !important;
             transform: scale(1) !important;
             margin: 0 !important;
             padding: 0 !important;
             background-size: contain !important;
             background-repeat: no-repeat !important;
             background-position: center !important;
          }
          @page {
            size: landscape;
            margin: 0;
          }
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
