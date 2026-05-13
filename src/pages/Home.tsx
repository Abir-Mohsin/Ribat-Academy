import { getDownloadUrl, getThumbnailUrl, getDriveId } from '@/src/lib/drive';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Star, Video, BookOpen, GraduationCap, ArrowUpRight, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, doc, limit, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import md5 from 'blueimp-md5';
import { useAuth } from '@/src/contexts/AuthContext';
import { PaymentModal } from '@/src/components/PaymentModal';

import * as Icons from 'lucide-react';

export function Home() {
  const [courses, setCourses] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [videoReviews, setVideoReviews] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [homeFeatures, setHomeFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();

  const handleEnroll = (item: any, type: 'course' | 'book') => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    setSelectedItem({ ...item, type });
  };

  const heroImages = settings?.heroImages 
    ? settings.heroImages.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '')
    : [settings?.heroImage].filter(Boolean);

  const parseRatingImages = (raw?: string) => {
    if (!raw) return [];
    return raw.split(',').map(s => s.trim()).filter(Boolean).map(item => {
      if (item.includes('@') && !item.startsWith('http')) {
        const hash = md5(item.toLowerCase());
        return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
      }
      return getDownloadUrl(item);
    });
  };

  const ratingImages = parseRatingImages(settings?.heroRatingImages);

  useEffect(() => {
    if (heroImages.length > 1) {
      const timer = setInterval(() => {
        setCurrentHeroImage(prev => (prev + 1) % heroImages.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [heroImages.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Settings
        const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data());
        }

        // Fetch Features
        const featuresSnap = await getDocs(query(collection(db, 'home_features')));
        setHomeFeatures(featuresSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })).sort((a,b) => (a.order || 0) - (b.order || 0)));

        // Fetch Courses
        const coursesSnap = await getDocs(collection(db, 'courses'));
        const activeCourses = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })).filter(c => c.status !== 'draft');
        setCourses(activeCourses.slice(0, 8));

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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 lg:pt-32 lg:pb-40 px-4 sm:px-6 bg-gradient-to-br from-[var(--color-primary-dark)] to-[var(--color-primary-light)] overflow-hidden">
        {/* Background Image Layer */}
        {(settings?.heroBackgroundImage || (heroImages.length > 0 && heroImages[0])) && (
          <div className="absolute inset-0 z-0 select-none">
            <img 
              src={getDownloadUrl(settings?.heroBackgroundImage || heroImages[0]) || undefined} 
              className="w-full h-full object-cover opacity-10 pointer-events-none" 
              alt="Hero Background"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-16 items-center w-full">
            {/* Slider/Media Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full order-first lg:order-last"
            >
              <div className="relative z-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl shadow-black/20 bg-black/5 aspect-video lg:aspect-[4/3] border-[2px] sm:border-[8px] lg:border-[12px] border-white/5">
                {settings?.heroVideoId ? (
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${settings.heroVideoId}?autoplay=1&mute=1&loop=1&playlist=${settings.heroVideoId}`}
                    title="Hero video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : settings?.heroVideoUrl ? (
                  <video 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    src={settings.heroVideoUrl} 
                  />
                ) : (
                  <div className="relative w-full h-full overflow-hidden bg-black/5 rounded-[2rem]">
                    {heroImages.length > 0 ? (
                      <AnimatePresence initial={false} mode="wait">
                        <motion.img 
                          key={currentHeroImage}
                          src={getDownloadUrl(heroImages[currentHeroImage]) || undefined} 
                          alt={`Hero slide ${currentHeroImage + 1}`} 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4 }}
                          className="absolute inset-0 w-full h-full object-cover rounded-[2rem]"
                          referrerPolicy="no-referrer"
                        />
                      </AnimatePresence>
                    ) : (
                      <div className="w-full h-full bg-black/5 rounded-[2rem] flex items-center justify-center">
                        <GraduationCap className="w-20 md:w-24 h-20 md:h-24 text-black/20" />
                      </div>
                    )}

                    {heroImages.length > 1 && (
                      <>
                        <div className="absolute inset-x-0 bottom-3 sm:bottom-6 z-20 flex justify-center gap-1.5 sm:gap-2">
                          {heroImages.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentHeroImage(i)}
                              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${i === currentHeroImage ? 'w-3 sm:w-6 bg-white' : 'bg-white/50'}`}
                            />
                          ))}
                        </div>
                        <button 
                          onClick={() => setCurrentHeroImage(prev => (prev - 1 + heroImages.length) % heroImages.length)}
                          className="absolute left-1.5 sm:left-4 top-1/2 -translate-y-1/2 p-1 sm:p-2 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40 transition-colors z-20"
                        >
                          <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
                        </button>
                        <button 
                          onClick={() => setCurrentHeroImage(prev => (prev + 1) % heroImages.length)}
                          className="absolute right-1.5 sm:right-4 top-1/2 -translate-y-1/2 p-1 sm:p-2 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40 transition-colors z-20"
                        >
                          <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="hidden sm:flex absolute -bottom-6 -right-6 lg:-bottom-10 lg:-right-10 z-20 bg-white p-4 lg:p-6 rounded-2xl shadow-xl border border-gray-100 items-center gap-4 max-w-[200px] lg:max-w-xs">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                  <Video size={20} className="lg:w-6 lg:h-6" />
                </div>
                <div>
                  <p className="font-bold text-xs lg:text-sm">Live Classes</p>
                  <p className="text-gray-500 text-[10px] lg:text-xs mt-1">Daily interactive sessions with expert teachers.</p>
                </div>
              </div>
            </motion.div>

            {/* Content Container */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 bg-white/10 text-white px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-sm border border-white/10">
                <Star size={14} className="fill-white" />
                <span dangerouslySetInnerHTML={{ __html: settings?.heroBadge || "Empowering the Next Generation" }} />
              </div>
              <h1 
                className="text-[1.75rem] leading-[1.2] sm:text-5xl lg:text-7xl font-bold text-white lg:text-[var(--color-text-heading)] lg:leading-[1.1] mb-4 sm:mb-8 break-words"
                dangerouslySetInnerHTML={{ __html: settings?.heroTitle || "Islamic + Modern Education Platform" }}
              />
              <div 
                className="rich-text-content text-sm sm:text-lg text-white/80 lg:text-[var(--color-text-body)] mb-6 sm:mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed opacity-90 break-words line-clamp-3 sm:line-clamp-none"
                dangerouslySetInnerHTML={{ __html: settings?.heroDescription || "Bridging the gap between timeless Islamic values and contemporary skills." }}
              />
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center lg:justify-start w-full px-2 sm:px-0">
                <Link to="/courses" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto gap-2 group justify-center sm:px-10 h-14 sm:h-auto text-sm">
                    Enroll Now
                    <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/courses?type=live" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto gap-2 border-white/20 bg-white/5 backdrop-blur-md text-white hover:bg-white hover:text-black hover:border-white transition-all duration-500 lg:shadow-2xl justify-center sm:px-10 h-14 sm:h-auto text-sm">
                    <Video size={20} />
                    Live Classes
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Academy Features */}
      <section className="py-16 lg:py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          {homeFeatures && homeFeatures.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {homeFeatures.map(feature => {
                const IconComponent = (Icons as any)[feature.icon] || Icons.Star;
                const colors: any = {
                  blue: { bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-[#0EA5E9]', hover: 'hover:shadow-blue-200/50' },
                  green: { bg: 'bg-green-50', border: 'border-green-100', iconBg: 'bg-green-500', hover: 'hover:shadow-green-200/50' },
                  amber: { bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-500', hover: 'hover:shadow-amber-200/50' },
                  purple: { bg: 'bg-purple-50', border: 'border-purple-100', iconBg: 'bg-purple-500', hover: 'hover:shadow-purple-200/50' },
                  rose: { bg: 'bg-rose-50', border: 'border-rose-100', iconBg: 'bg-rose-500', hover: 'hover:shadow-rose-200/50' }
                };
                const c = colors[feature.colorClass] || colors.blue;
                
                return (
                  <div key={feature.id} className={`p-8 md:p-10 ${c.bg} rounded-[40px] border ${c.border} group hover:shadow-2xl ${c.hover} transition-all duration-500 flex flex-col items-center text-center md:items-start md:text-left`}>
                    <div className={`w-14 h-14 ${c.iconBg} rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-black/5 group-hover:scale-110 transition-transform shrink-0`}>
                      <IconComponent className="text-white w-7 h-7" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-4 tracking-tight leading-tight break-words">{feature.title}</h3>
                    <div className="rich-text-content text-gray-600 text-sm md:text-base leading-relaxed break-words w-full" dangerouslySetInnerHTML={{ __html: feature.description }} />
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-8 md:p-10 bg-blue-50 rounded-[40px] border border-blue-100 group hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-500 flex flex-col items-center text-center md:items-start md:text-left">
                <div className="w-14 h-14 bg-[#0EA5E9] rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform shrink-0">
                  <GraduationCap className="text-white w-7 h-7" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-4 tracking-tight leading-tight break-words">Learning</h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">Our curriculum is designed by education experts to take you from basics to mastery.</p>
              </div>
              
              <div className="p-8 md:p-10 bg-green-50 rounded-[40px] border border-green-100 group hover:shadow-2xl hover:shadow-green-200/50 transition-all duration-500 flex flex-col items-center text-center md:items-start md:text-left">
                <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform shrink-0">
                  <Video className="text-white w-7 h-7" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-4 tracking-tight leading-tight break-words">Live Classes</h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">Interact with qualified instructors daily. Get your questions answered instantly.</p>
              </div>

               <div className="p-8 md:p-10 bg-amber-50 rounded-[40px] border border-amber-100 group hover:shadow-2xl hover:shadow-amber-200/50 transition-all duration-500 flex flex-col items-center text-center md:items-start md:text-left">
                <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform shrink-0">
                  <BookOpen className="text-white w-7 h-7" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-4 tracking-tight leading-tight break-words">Resources</h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">Access hundreds of PDF books, quizzes, and recorded lectures anytime.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-12 lg:py-16 bg-gray-50/50 px-4">
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
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
                  onClick={() => handleEnroll(course, 'course')}
                  secondaryButtonText="Details"
                  onSecondaryClick={() => navigate(`/courses/${course.id}`)}
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
      <section className="py-12 lg:py-16 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight">The Ribat <span className="text-[#0EA5E9]">Bookstore</span></h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Access our handcrafted collection of Islamic literature and academic guides, beautifully formatted for digital reading.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-12">
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
        <section className="py-16 lg:py-32 px-4 overflow-hidden bg-white relative">
          {/* Background Ambient Glows (Subtle for Light Mode) */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-4xl mx-auto mb-16 text-center relative z-10 px-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">
              <Star size={12} className="text-yellow-400 fill-yellow-400" /> Success Stories
            </div>
            <h2 className="text-3xl lg:text-4xl font-black mb-4 tracking-tight text-[#111111]">Our Students Speak</h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base font-medium">Watch recorded testimonials from students who transformed their lives at Ribat.</p>
          </div>
          
          <div className="flex gap-8 sm:gap-12 animate-scroll hover:[animation-play-state:paused] cursor-grab active:cursor-grabbing pb-12 px-12">
            {videoReviews.map((review) => (
              <div key={review.id} className="w-[130px] sm:w-[220px] shrink-0 aspect-[9/16] bg-white rounded-[1.2rem] sm:rounded-[2.2rem] p-1.5 sm:p-3 border border-gray-100 flex flex-col relative group overflow-hidden shadow-[0_12px_24px_-8px_rgba(0,0,0,0.1)]">
                 {/* Internal Image Wrap */}
                 <div className="relative flex-grow rounded-[0.8rem] sm:rounded-[1.6rem] overflow-hidden group cursor-pointer bg-gray-50">
                    <img 
                      src={review.thumbnail || `https://images.unsplash.com/photo-1544640808-32ca72ac7f67?auto=format&fit=crop&w=400`} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                      referrerPolicy="no-referrer"
                    />
                    
                    <a 
                      href={review.videoUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="absolute inset-0 bg-black/10 group-hover:bg-black/25 flex items-center justify-center transition-all duration-500"
                    >
                      <div className="w-8 h-8 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform duration-500 shadow-2xl">
                         <div className="w-6 h-6 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-inner">
                            <Icons.Play size={12} className="text-[#EE1D23] fill-[#EE1D23] ml-0.5" />
                         </div>
                      </div>
                    </a>
                 </div>

                 {/* Card Footer: Student Info */}
                 <div className="pt-3 pb-1.5 px-1.5 flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-11 sm:h-11 rounded-full border border-gray-100 p-0.5 overflow-hidden shrink-0">
                       <img 
                        src={review.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.name)}&background=random`} 
                        className="w-full h-full rounded-full object-cover" 
                        referrerPolicy="no-referrer"
                       />
                    </div>
                    <div className="min-w-0">
                       <p className="font-bold text-gray-900 text-[9px] sm:text-[13px] truncate tracking-tight">{review.name}</p>
                       <p className="text-gray-400 text-[6px] sm:text-[9px] font-black uppercase tracking-[0.2px] truncate mt-0.5">{review.role || 'Student'}</p>
                    </div>
                 </div>
              </div>
            ))}
            {/* Duplicated for smooth infinite scroll */}
            {videoReviews.map((review) => (
              <div key={`${review.id}-dup`} className="w-[130px] sm:w-[220px] shrink-0 aspect-[9/16] bg-white rounded-[1.2rem] sm:rounded-[2.2rem] p-1.5 sm:p-3 border border-gray-100 flex flex-col relative group overflow-hidden shadow-[0_12px_24px_-8px_rgba(0,0,0,0.1)]">
                 <div className="relative flex-grow rounded-[0.8rem] sm:rounded-[1.6rem] overflow-hidden group cursor-pointer bg-gray-50">
                    <img 
                      src={review.thumbnail || `https://images.unsplash.com/photo-1544640808-32ca72ac7f67?auto=format&fit=crop&w=400`} 
                      alt="Review thumbnail" 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                      referrerPolicy="no-referrer"
                    />
                    <a 
                      href={review.videoUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="absolute inset-0 bg-black/10 group-hover:bg-black/25 flex items-center justify-center transition-all duration-500"
                    >
                      <div className="w-8 h-8 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform duration-500 shadow-2xl">
                         <div className="w-6 h-6 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-inner">
                            <Icons.Play size={12} className="text-[#EE1D23] fill-[#EE1D23] ml-0.5" />
                         </div>
                      </div>
                    </a>
                 </div>
                 <div className="pt-3 pb-1.5 px-1.5 flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-11 sm:h-11 rounded-full border border-gray-100 p-0.5 overflow-hidden shrink-0">
                       <img 
                        src={review.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.name)}&background=random`} 
                        className="w-full h-full rounded-full object-cover" 
                        referrerPolicy="no-referrer"
                       />
                    </div>
                    <div className="min-w-0">
                       <p className="font-bold text-gray-900 text-[9px] sm:text-[13px] truncate tracking-tight">{review.name}</p>
                       <p className="text-gray-400 text-[6px] sm:text-[9px] font-black uppercase tracking-[0.2px] truncate mt-0.5">{review.role || 'Student'}</p>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials Slider */}
      {testimonials.length > 0 && (
        <section className="py-16 lg:py-24 bg-gray-50/30 overflow-hidden relative">
          <div className="max-w-7xl mx-auto mb-16 text-center px-4">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">What Our Students Say</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Join a thriving community of learners who are transforming their lives through balanced education.</p>
          </div>
          
          <div className="flex gap-6 animate-scroll hover:[animation-play-state:paused] cursor-grab active:cursor-grabbing pb-12 px-8">
            {testimonials.map((t) => (
              <div 
                key={t.id}
                className="w-[280px] sm:w-[350px] shrink-0 bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.08)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-1 text-amber-400 mb-4 sm:mb-6">
                    {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                  <div className="text-gray-600 italic mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: `&ldquo;${t.content}&rdquo;` }} />
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 overflow-hidden border border-gray-50">
                    <img src={t.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=random`} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs sm:text-sm truncate">{t.name}</p>
                    <p className="text-gray-400 text-[10px] sm:text-xs font-medium truncate uppercase tracking-wider">{t.role || 'Student'}</p>
                  </div>
                </div>
              </div>
            ))}
            {/* Duplicated for scroll */}
            {testimonials.map((t) => (
              <div 
                key={`${t.id}-dup`}
                className="w-[280px] sm:w-[350px] shrink-0 bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.08)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-1 text-amber-400 mb-4 sm:mb-6">
                    {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                  <div className="text-gray-600 italic mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: `&ldquo;${t.content}&rdquo;` }} />
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 overflow-hidden border border-gray-50">
                    <img src={t.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=random`} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs sm:text-sm truncate">{t.name}</p>
                    <p className="text-gray-400 text-[10px] sm:text-xs font-medium truncate uppercase tracking-wider">{t.role || 'Student'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedItem && (
        <PaymentModal 
          isOpen={!!selectedItem} 
          onClose={() => setSelectedItem(null)} 
          item={selectedItem}
        />
      )}
    </div>
  );
}
