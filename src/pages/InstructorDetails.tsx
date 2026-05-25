import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { getDownloadUrl } from '@/src/lib/drive';
import { Loader2, ArrowLeft, Facebook, Twitter, Globe } from 'lucide-react';
import { motion } from 'motion/react';

export function InstructorDetails() {
  const { id } = useParams<{ id: string }>();
  const [instructor, setInstructor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstructor = async () => {
      try {
        if (!id) return;
        const docRef = doc(db, 'instructors', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setInstructor({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching instructor:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInstructor();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Instructor not found</h2>
        <Link to="/about" className="text-blue-500 hover:underline flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Instructors
        </Link>
      </div>
    );
  }

  return (
    <div className="py-24 px-6 max-w-4xl mx-auto">
      <Link to="/about" className="inline-flex items-center gap-2 mb-10 text-gray-500 hover:text-black transition-colors font-medium">
        <ArrowLeft size={20} />
        Back to Instructors
      </Link>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-gray-100"
      >
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className="w-full md:w-1/3 shrink-0">
            <div className="aspect-square rounded-[32px] overflow-hidden bg-gray-100 shadow-xl border-4 border-white mb-6">
              {instructor.image ? (
                <img referrerPolicy="no-referrer" src={getDownloadUrl(instructor.image)} alt={instructor.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full md:w-2/3">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{instructor.name}</h1>
            <p className="text-xl text-[#0EA5E9] font-semibold mb-6">{instructor.role}</p>

            <div className="flex gap-4 mb-8">
              {instructor.facebookUrl && (
                <a href={instructor.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors">
                  <Facebook size={20} />
                </a>
              )}
              {instructor.twitterUrl && (
                <a href={instructor.twitterUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center hover:bg-sky-500 hover:text-white transition-colors">
                  <Twitter size={20} />
                </a>
              )}
              {instructor.websiteUrl && (
                <a href={instructor.websiteUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-gray-800 hover:text-white transition-colors">
                  <Globe size={20} />
                </a>
              )}
            </div>
            
            <div className="rich-text-content px-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
              <div dangerouslySetInnerHTML={{ __html: instructor.bio || 'No bio available.' }} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
