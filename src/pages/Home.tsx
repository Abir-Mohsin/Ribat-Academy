import { getDownloadUrl, getThumbnailUrl } from '@/src/lib/drive';
import { motion } from 'motion/react';
import { ArrowRight, Star, Video, BookOpen, GraduationCap, ArrowUpRight, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, doc, limit, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';

export function Home() {
  const [courses, setCourses] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [videoReviews, setVideoReviews] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Settings
        const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data());
        }

        // Fetch Courses - broaden query to ensure visibility
        const coursesSnap = await getDocs(query(collection(db, 'courses'), limit(8)));
        setCourses(coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Books
        const booksSnap = await getDocs(query(collection(db, 'books'), limit(4)));
        setBooks(booksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Testimonials
        const testimonialsSnap = await getDocs(query(collection(db, 'testimonials'), limit(6)));
        setTestimonials(testimonialsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Video Reviews
        const videoSnap = await getDocs(query(collection(db, 'videoReviews'), limit(10)));
        setVideoReviews(videoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching homepage content:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-32 lg:pb-40 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <Star size={14} className="fill-blue-600" />
              {settings?.heroBadge || "Empowering the Next Generation"}
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-[#111111] leading-[1.1] mb-8">
              {settings?.heroTitle || "Islamic + Modern Education Platform"}
            </h1>
            <p className="text-lg text-gray-500 mb-10 max-w-xl leading-relaxed">
              {settings?.heroDescription || "Bridging the gap between timeless Islamic values and contemporary skills. Join over 5,000+ students worldwide mastering Arabic, Deen, and Digital Technology."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/courses">
                <Button size="lg" className="gap-2 group">
                  Enroll Now
                  <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/courses?type=live">
                <Button variant="outline" size="lg" className="gap-2">
                  <Video size={20} />
                  Live Classes
                </Button>
              </Link>
            </div>
            
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200" />
                ))}
              </div>
              <p className="text-sm text-gray-500 font-medium">
                <span className="text-black font-bold">4.9/5</span> rated by 2,000+ happy students
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl shadow-blue-200 bg-gray-50 aspect-[4/3]">
              {settings?.heroVideoId ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${settings.heroVideoId}?autoplay=1&mute=1&loop=1&playlist=${settings.heroVideoId}`}
                  title="Hero video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <img 
                  src={settings?.heroImage || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80"} 
                  alt="Student learning" 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="absolute -bottom-6 -right-6 lg:-bottom-10 lg:-right-10 z-20 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4 max-w-xs">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                <Video size={24} />
              </div>
              <div>
                <p className="font-bold text-sm">Live Classes</p>
                <p className="text-gray-500 text-xs mt-1">Daily interactive sessions with expert teachers.</p>
              </div>
            </div>
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#0EA5E9]/10 rounded-full blur-3xl -z-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-[#0EA5E9]/5 rounded-full -z-10" />
          </motion.div>
        </div>
      </section>

      {/* Academy Features */}
      <section className="py-24 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 bg-blue-50 rounded-[40px] border border-blue-100 group hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-500">
              <div className="w-14 h-14 bg-[#0EA5E9] rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <GraduationCap className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Structured Learning</h3>
              <p className="text-gray-600 leading-relaxed">Our curriculum is designed by education experts to take you from basics to mastery in record time.</p>
            </div>
            
            <div className="p-10 bg-green-50 rounded-[40px] border border-green-100 group hover:shadow-2xl hover:shadow-green-200/50 transition-all duration-500">
              <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                <Video className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Daily Live Sessions</h3>
              <p className="text-gray-600 leading-relaxed">Interact with qualified instructors daily. Get your questions answered instantly in real-time.</p>
            </div>

            <div className="p-10 bg-amber-50 rounded-[40px] border border-amber-100 group hover:shadow-2xl hover:shadow-amber-200/50 transition-all duration-500">
              <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                <BookOpen className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Comprehensive Resources</h3>
              <p className="text-gray-600 leading-relaxed">Access hundreds of PDF books, quizzes, and recorded lectures anytime, anywhere.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-24 bg-gray-50/50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Featured Courses</h2>
              <p className="text-gray-500 max-w-md">Our most popular learning paths, curated for your spiritual and professional growth.</p>
            </div>
            <Link to="/courses">
              <Button variant="ghost" className="gap-2 group">
                Browse All Courses
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading ? (
               <div className="col-span-full py-20 text-center text-gray-400">
                  <Loader2 className="animate-spin mx-auto mb-4" size={32} />
                  <p>Loading curated courses...</p>
               </div>
            ) : courses.length > 0 ? (
               courses.map((course) => (
                <Card 
                  key={course.id} 
                  id={course.id}
                  title={course.title}
                  subtitle={course.instructor?.name}
                  description={course.description}
                  price={course.price}
                  image={course.thumbnail}
                  badge={course.badge || 'New'}
                 />
               ))
            ) : (
              <div className="col-span-full py-20 text-center text-gray-400">
                <p>No featured courses found at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Books / Library Section */}
      <section className="py-24 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight">The Ribat <span className="text-[#0EA5E9]">Bookstore</span></h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Access our handcrafted collection of Islamic literature and academic guides, beautifully formatted for digital reading.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {loading ? (
              <div className="col-span-full py-20 text-center text-gray-400">
                <Loader2 className="animate-spin mx-auto mb-4" size={32} />
                <p>Curating your digital library...</p>
              </div>
            ) : books.length > 0 ? (
              books.map((book) => (
                <Link key={book.id} to="/books" className="group">
                  <div className="aspect-[3/4] rounded-3xl overflow-hidden mb-6 bg-gray-50 border border-gray-100 shadow-sm relative transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-blue-200/50 group-hover:-translate-y-2">
                    <img src={book.coverImage ? getThumbnailUrl(book.coverImage) : (book.image ? getThumbnailUrl(book.image) : 'https://images.unsplash.com/photo-1544640808-32ca72ac7f67?auto=format&fit=crop&q=80')} alt={book.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                      <Button size="sm" className="w-full bg-white text-black hover:bg-gray-100">Buy Now</Button>
                    </div>
                  </div>
                  <h4 className="font-bold text-lg mb-1 group-hover:text-[#0EA5E9] transition-colors">{book.title}</h4>
                  <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">{book.author || 'Ribat Publication'}</p>
                </Link>
              ))
            ) : (
              <div className="col-span-full bg-gray-50 rounded-[40px] p-20 text-center border-2 border-dashed border-gray-100">
                <BookOpen size={48} className="mx-auto mb-4 text-[#0EA5E9] opacity-20" />
                <p className="text-gray-400 font-medium">Digital books are being uploaded by our research team.</p>
                <Link to="/books" className="mt-4 inline-block text-[#0EA5E9] font-bold hover:underline">View All Collection</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Video Reviews Slider */}
      {videoReviews.length > 0 && (
        <section className="py-24 px-4 overflow-hidden bg-white">
          <div className="max-w-7xl mx-auto mb-16 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Our Students Speak</h2>
            <p className="text-gray-500">Watch recorded testimonials from students who transformed their lives at Ribat.</p>
          </div>
          
          <div className="flex gap-6 animate-scroll hover:[animation-play-state:paused] cursor-grab active:cursor-grabbing">
            {videoReviews.map((review) => (
              <div key={review.id} className="min-w-[320px] bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col items-center">
                 <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6 group cursor-pointer">
                    <img src={review.thumbnail || `https://images.unsplash.com/photo-1544640808-32ca72ac7f67?auto=format&fit=crop&w=400`} alt="Review thumbnail" className="w-full h-full object-cover" />
                    <a 
                      href={review.videoUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors"
                    >
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Video size={20} className="fill-black ml-1" />
                      </div>
                    </a>
                 </div>
                 <p className="font-bold text-sm">{review.name}</p>
                 <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">{review.role}</p>
              </div>
            ))}
            {/* Duplicated for smooth infinite scroll */}
            {videoReviews.map((review) => (
              <div key={`${review.id}-dup`} className="min-w-[320px] bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col items-center">
                 <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6 group cursor-pointer">
                    <img src={review.thumbnail || `https://images.unsplash.com/photo-1544640808-32ca72ac7f67?auto=format&fit=crop&w=400`} alt="Review thumbnail" className="w-full h-full object-cover" />
                    <a 
                      href={review.videoUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors"
                    >
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Video size={20} className="fill-black ml-1" />
                      </div>
                    </a>
                 </div>
                 <p className="font-bold text-sm">{review.name}</p>
                 <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">{review.role}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials Slider */}
      <section className="py-24 bg-gray-50/50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">What Our Students Say</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Join a thriving community of learners who are transforming their lives through balanced education.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full text-center py-12"><Loader2 className="animate-spin mx-auto text-gray-300" size={32} /></div>
            ) : testimonials.length > 0 ? (
              testimonials.map(t => (
                <motion.div 
                  key={t.id}
                  whileHover={{ y: -5 }}
                  className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative"
                >
                  <div className="flex gap-1 text-amber-400 mb-6">
                    {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                  </div>
                  <p className="text-gray-600 italic mb-8 leading-relaxed">"{t.content}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
                      <img src={t.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=random`} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{t.name}</p>
                      <p className="text-gray-400 text-xs font-medium">{t.role || 'Student'}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              // Fallback cards if no testimonials in DB
              [1,2,3].map(i => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm opacity-50 grayscale">
                   <div className="flex gap-1 text-gray-200 mb-6">
                    {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                  </div>
                  <p className="text-gray-300 italic mb-8">Testimonials will appear here once added in the admin panel.</p>
                </div>
              ))
             )}
          </div>
        </div>
      </section>

    </div>
  );
}
