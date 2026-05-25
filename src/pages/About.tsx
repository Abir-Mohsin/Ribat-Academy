import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { GraduationCap, Target, Heart, Award, Loader2 } from 'lucide-react';
import { collection, getDocs, getDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { getDownloadUrl } from '@/src/lib/drive';

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
              className="rich-text-content text-xl text-gray-500 leading-relaxed break-words"
              dangerouslySetInnerHTML={{ __html: settings?.aboutDescription || "Ribat Academy was founded on a simple belief: that education should be holistic. We don't just teach subjects; we nurture souls and empower minds with the tools they need to succeed in this life and the next." }}
            />
        </div>
      </section>

      {/* Stats/Values Grid */}
      <section className="bg-gray-50 py-16 lg:py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {values.map((v, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center p-6 bg-white sm:bg-transparent rounded-3xl sm:rounded-none shadow-sm sm:shadow-none border border-gray-100 sm:border-none"
            >
              <div className="w-16 h-16 bg-white sm:bg-gray-100/50 rounded-2xl shadow-sm sm:shadow-none border border-gray-100 flex items-center justify-center mb-6">
                <v.icon className="text-[#0EA5E9]" size={28} />
              </div>
              <h3 className="text-lg font-bold mb-3" dangerouslySetInnerHTML={{ __html: v.title }} />
                <p className="text-sm text-gray-500 leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: v.desc }} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Founders/Instructors */}
      <section className="py-24 lg:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-20">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Our Instructors</h2>
            <p className="text-gray-500">Learn from the best in the field.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 lg:gap-12">
            {instructors.length > 0 ? (
              instructors.map((instructor, idx) => (
                <Link to={`/instructor/${instructor.id}`} key={instructor.id}>
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="text-center group bg-white p-8 rounded-[40px] border border-gray-50 hover:border-blue-100 transition-colors h-full"
                  >
                    <div className="w-40 h-40 lg:w-48 lg:h-48 mx-auto rounded-full overflow-hidden mb-6 grayscale group-hover:grayscale-0 transition-all duration-500 border-4 border-white shadow-xl">
                      <img referrerPolicy="no-referrer" src={getDownloadUrl(instructor.image) || `https://images.unsplash.com/photo-1544217121-dca9cb6ad021?auto=format&fit=crop&w=300`} alt={instructor.name} className="w-full h-full object-cover" />
                    </div>
                    <h4 className="text-xl font-bold">{instructor.name}</h4>
                    <p className="text-sm text-[#0EA5E9] font-medium mb-4">{instructor.role}</p>
                    <div className="text-sm text-gray-500 px-4 line-clamp-3 break-words" dangerouslySetInnerHTML={{ __html: instructor.bio || 'No bio available.' }} />
                  </motion.div>
                </Link>
              ))
            ) : (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="text-center opacity-30">
                  <div className="w-40 h-40 lg:w-48 lg:h-48 mx-auto rounded-full bg-gray-100 mb-6" />
                  <div className="h-6 w-32 bg-gray-100 mx-auto mb-2 rounded" />
                  <div className="h-4 w-24 bg-gray-100 mx-auto rounded" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="py-24 px-4 bg-gray-50 border-t border-gray-100" id="contact">
        <div className="max-w-3xl mx-auto bg-white p-10 md:p-12 rounded-[40px] shadow-sm border border-gray-100">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Contact Support</h2>
            <p className="text-gray-500">Have any questions? We'd love to hear from you.</p>
          </div>
          
          <form action="https://formsubmit.co/abirmohsin02@gmail.com" method="POST" className="space-y-6">
            <input type="text" name="_honey" style={{ display: 'none' }} />
            <input type="hidden" name="_captcha" value="false" />
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Full Name</label>
              <input type="text" name="Name" required placeholder="John Doe" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Email</label>
                <input type="email" name="Email" required placeholder="john@example.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Address</label>
                <input type="text" name="Address" required placeholder="Your address here" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Message</label>
              <textarea name="Message" required rows={5} placeholder="How can we help you?" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] resize-none"></textarea>
            </div>

            <button type="submit" className="w-full py-4 bg-[#111111] hover:bg-black text-white font-bold rounded-xl transition-all">
              Send Message
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
