import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Target, Heart, Award, Loader2 } from 'lucide-react';
import { collection, getDocs, getDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

export function About() {
  const [instructors, setInstructors] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data());
        }

        const instSnap = await getDocs(query(collection(db, 'instructors'), orderBy('order', 'asc')));
        setInstructors(instSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching about data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0EA5E9]" size={32} />
      </div>
    );
  }

  const values = [
    { icon: GraduationCap, title: settings?.aboutValue1Title || 'Academic Excellence', desc: settings?.aboutValue1Desc || 'Rigorous curriculum combining tradition with modern pedagogical methods.' },
    { icon: Target, title: settings?.missionTitle || 'Our Mission', desc: settings?.missionDescription || 'To provide accessible, high-quality Islamic and modern education to every seeker.' },
    { icon: Heart, title: settings?.aboutValue3Title || 'Community First', desc: settings?.aboutValue3Desc || 'Fostering a supportive environment for students from all walks of life.' },
    { icon: Award, title: settings?.aboutValue4Title || 'Expert Guidance', desc: settings?.aboutValue4Desc || 'Learning directly from qualified scholars and industry professionals.' },
  ];

  return (
    <div className="pt-20 pb-32">
      {/* Academy Intro */}
      <section className="px-4 mb-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-6xl font-bold mb-8 tracking-tight"
            dangerouslySetInnerHTML={{ __html: settings?.aboutTitle || "Bridging Divides. Building Futures." }}
          />
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-500 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: settings?.aboutDescription || "Ribat Academy was founded on a simple belief: that education should be holistic. We don't just teach subjects; we nurture souls and empower minds with the tools they need to succeed in this life and the next." }}
          />
        </div>
      </section>

      {/* Stats/Values Grid */}
      <section className="bg-gray-50 py-24 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {values.map((v, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-6">
                <v.icon className="text-[#0EA5E9]" size={28} />
              </div>
              <h3 className="text-lg font-bold mb-3" dangerouslySetInnerHTML={{ __html: v.title }} />
              <p className="text-sm text-gray-500 leading-relaxed" dangerouslySetInnerHTML={{ __html: v.desc }} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Founders/Instructors */}
      <section className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold mb-4">Our Instructors</h2>
            <p className="text-gray-500">Learn from the best in the field.</p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-12">
            {instructors.length > 0 ? (
              instructors.map((instructor, idx) => (
                <motion.div 
                  key={instructor.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-center group"
                >
                  <div className="w-48 h-48 mx-auto rounded-full overflow-hidden mb-6 grayscale group-hover:grayscale-0 transition-all duration-500 border-4 border-white shadow-xl">
                    <img src={instructor.image || `https://images.unsplash.com/photo-1544217121-dca9cb6ad021?auto=format&fit=crop&w=300`} alt={instructor.name} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-xl font-bold">{instructor.name}</h4>
                  <p className="text-sm text-[#0EA5E9] font-medium mb-4">{instructor.role}</p>
                  <p className="text-sm text-gray-500 px-4 line-clamp-3">{instructor.bio}</p>
                </motion.div>
              ))
            ) : (
              [1, 2, 3].map(i => (
                <div key={i} className="text-center opacity-30">
                  <div className="w-48 h-48 mx-auto rounded-full bg-gray-100 mb-6" />
                  <div className="h-6 w-32 bg-gray-100 mx-auto mb-2 rounded" />
                  <div className="h-4 w-24 bg-gray-100 mx-auto rounded" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
