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
    : [settings?.heroImage || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80"];

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
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-32 lg:pb-40 px-4 bg-gradient-to-br from-[var(--color-primary-dark)] to-[var(--color-primary-light)] overflow-hidden">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <img 
            src={getDownloadUrl(settings?.heroBackgroundImage || heroImages[0])} 
            className="w-full h-full object-cover opacity-10" 
            alt="Hero Background"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-sm border border-white/10">
              <Star size={14} className="fill-white" />
              <span dangerouslySetInnerHTML={{ __html: settings?.heroBadge || "Empowering the Next Generation" }} />
            </div>
            <h1 
              className="text-5xl lg:text-7xl font-bold text-[var(--color-text-heading)] leading-[1.1] mb-8"
              dangerouslySetInnerHTML={{ __html: settings?.heroTitle || "Islamic + Modern Education Platform" }}
            />
            <p 
              className="text-lg text-[var(--color-text-body)] mb-10 max-w-xl leading-relaxed"
              dangerouslySetInnerHTML={{ __html: settings?.heroDescription || "Bridging the gap between timeless Islamic values and contemporary skills. Join over 5,000+ students worldwide mastering Arabic, Deen, and Digital Technology." }}
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/courses">
                <Button size="lg" className="gap-2 group">
                  Enroll Now
                  <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/courses?type=live">
                <Button variant="outline" size="lg" className="gap-2 border-white text-white hover:bg-white hover:text-[var(--color-primary-dark)]">
                  <Video size={20} />
                  Live Classes
                </Button>
              </Link>
            </div>
            
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-3">
                {ratingImages.length > 0 ? (
                  ratingImages.map((img: string, i: number) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--color-primary-dark)] bg-gray-200 overflow-hidden">
                      <img src={img} alt="Student Profile" className="w-full h-full object-cover" />
                    </div>
                  ))
                ) : (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--color-primary-dark)] bg-gray-200" />
                  ))
                )}
              </div>
              <p 
                className="text-sm text-[var(--color-text-body)] font-medium"
                dangerouslySetInnerHTML={{ __html: settings?.heroRatingText || "4.9/5 rated by 2,000+ happy students" }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl shadow-black/20 bg-gray-50 aspect-[4/3]">
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
                <div className="relative w-full h-full overflow-hidden">
                  <AnimatePresence initial={false}>
                    <motion.img 
                      key={currentHeroImage}
                      src={getDownloadUrl(heroImages[currentHeroImage])} 
                      alt={`Hero slide ${currentHeroImage + 1}`} 
                      initial={{ x: '100%', opacity: 1 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: '-100%', opacity: 1 }}
                      transition={{ 
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                      }}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80";
                      }}
                    />
                  </AnimatePresence>

                  {heroImages.length > 1 && (
                    <>
                      <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center gap-2">
                        {heroImages.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentHeroImage(i)}
                            className={`w-2 h-2 rounded-full transition-all ${i === currentHeroImage ? 'w-6 bg-white' : 'bg-white/50'}`}
                          />
                        ))}
                      </div>
                      <button 
                        onClick={() => setCurrentHeroImage(prev => (prev - 1 + heroImages.length) % heroImages.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40 transition-colors z-20"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button 
                        onClick={() => setCurrentHeroImage(prev => (prev + 1) % heroImages.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40 transition-colors z-20"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>
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
          {homeFeatures && homeFeatures.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
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
                  <div key={feature.id} className={`w-[calc(33.333%-0.75rem)] md:w-[calc(33.333%-2rem)] p-4 md:p-10 ${c.bg} rounded-2xl md:rounded-[40px] border ${c.border} group hover:shadow-2xl ${c.hover} transition-all duration-500 flex flex-col items-center text-center md:items-start md:text-left`}>
                    <div className={`w-10 h-10 md:w-14 md:h-14 ${c.iconBg} rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-8 shadow-lg shadow-black/5 group-hover:scale-110 transition-transform`}>
                      <IconComponent className="text-white w-5 h-5 md:w-7 md:h-7" />
                    </div>
                    <h3 className="text-sm md:text-2xl font-bold mb-2 md:mb-4 tracking-tight md:leading-tight">{feature.title}</h3>
                    <p className="text-gray-600 text-[10px] md:text-base leading-relaxed md:line-clamp-none break-words" dangerouslySetInnerHTML={{ __html: feature.description }} />
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="grid grid-cols-3 gap-4 md:gap-8">
              <div className="p-4 md:p-10 bg-blue-50 rounded-2xl md:rounded-[40px] border border-blue-100 group hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-500 flex flex-col items-center text-center md:items-start md:text-left">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-[#0EA5E9] rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-8 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <GraduationCap className="text-white w-5 h-5 md:w-7 md:h-7" />
                </div>
                <h3 className="text-sm md:text-2xl font-bold mb-2 md:mb-4 tracking-tight">Learning</h3>
                <p className="hidden md:block text-gray-600 leading-relaxed">Our curriculum is designed by education experts to take you from basics to mastery.</p>
              </div>
              
              <div className="p-4 md:p-10 bg-green-50 rounded-2xl md:rounded-[40px] border border-green-100 group hover:shadow-2xl hover:shadow-green-200/50 transition-all duration-500 flex flex-col items-center text-center md:items-start md:text-left">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-green-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-8 shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                  <Video className="text-white w-5 h-5 md:w-7 md:h-7" />
                </div>
                <h3 className="text-sm md:text-2xl font-bold mb-2 md:mb-4 tracking-tight">Live Classes</h3>
                <p className="hidden md:block text-gray-600 leading-relaxed">Interact with qualified instructors daily. Get your questions answered instantly.</p>
              </div>


               <div className="p-4 md:p-10 bg-amber-50 rounded-2xl md:rounded-[40px] border border-amber-100 group hover:shadow-2xl hover:shadow-amber-200/50 transition-all duration-500 flex flex-col items-center text-center md:items-start md:text-left">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-amber-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-8 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                  <BookOpen className="text-white w-5 h-5 md:w-7 md:h-7" />
                </div>
                <h3 className="text-sm md:text-2xl font-bold mb-2 md:mb-4 tracking-tight">Resources</h3>
                <p className="hidden md:block text-gray-600 leading-relaxed">Access hundreds of PDF books, quizzes, and recorded lectures anytime.</p>
              </div>
            </div>
          )}
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
                  <div className="text-gray-600 italic mb-8 leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: `&ldquo;${t.content}&rdquo;` }} />
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
