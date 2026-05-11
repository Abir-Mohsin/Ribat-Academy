import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CustomPageProps {
  type: 'enroll' | 'faq' | 'privacy';
  title: string;
}

export function CustomPage({ type, title }: CustomPageProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'general'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (type === 'enroll') setContent(data.pageEnrollContent || '<p>No content provided yet.</p>');
          if (type === 'faq') setContent(data.pageFaqContent || '<p>No content provided yet.</p>');
          if (type === 'privacy') setContent(data.pagePrivacyContent || '<p>No content provided yet.</p>');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [type]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#111111]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[40px] border border-gray-100 shadow-sm">
         <button 
           onClick={() => navigate(-1)}
           className="text-gray-500 hover:text-black transition-colors mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
         >
           <ChevronLeft size={16} /> Back
         </button>
         <h1 className="text-3xl md:text-5xl font-bold mb-8">{title}</h1>
         
         <div className="prose prose-lg max-w-none prose-p:text-gray-600 prose-headings:font-bold prose-a:text-[#0EA5E9]" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
}
