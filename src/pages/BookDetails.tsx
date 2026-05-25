import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { getThumbnailUrl } from '@/src/lib/drive';
import { Button } from '@/src/components/Button';
import { PaymentModal } from '@/src/components/PaymentModal';
import { useAuth } from '@/src/contexts/AuthContext';
import { cn } from '@/src/lib/utils';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Book as BookIcon, 
  User, 
  Tag, 
  Calendar,
  Share2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const getEmbedUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1].split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1].split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
};

export function BookDetails() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBookForPurchase, setSelectedBookForPurchase] = useState<any>(null);
  const { user, signInWithGoogle } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, 'books', id));
        if (docSnap.exists()) {
          setBook({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching book:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  const handlePurchase = (purchaseType: string, price: number) => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    setSelectedBookForPurchase({ ...book, type: 'book', purchaseType, price });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Book not found</h2>
        <Link to="/books">
          <Button variant="outline">Back to Bookstore</Button>
        </Link>
      </div>
    );
  }

  const gallery = book.gallery || [];
  const allImages = [book.coverImage, ...gallery].filter(Boolean);

  return (
    <div className="min-h-screen pt-24 pb-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Link 
          to="/books" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-8 group"
        >
          <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
          <span className="font-bold text-xs uppercase tracking-widest">Back to Bookstore</span>
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left: Images */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-[3/4] bg-gray-50 rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100 group"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={getThumbnailUrl(allImages[currentImageIndex])}
                  alt={book.title}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>

              {allImages.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setCurrentImageIndex(prev => (prev - 1 + allImages.length) % allImages.length)}
                    className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-black shadow-lg"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={() => setCurrentImageIndex(prev => (prev + 1) % allImages.length)}
                    className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-black shadow-lg"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              )}
            </motion.div>

            {/* Gallery Thumbnails */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      "aspect-square rounded-xl overflow-hidden border-2 transition-all",
                      currentImageIndex === index ? "border-black scale-95" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img referrerPolicy="no-referrer" 
                      src={getThumbnailUrl(img)} 
                      className="w-full h-full object-cover" 
                      />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                <Tag size={12} />
                {book.bookType || 'Digital Edition'}
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-[#111111] leading-tight mb-4 tracking-tight">
                {book.title}
              </h1>
              <div className="flex items-center gap-4 text-gray-500">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                  <User size={16} />
                  {book.author}
                </div>
                {book.createdAt && (
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                    <Calendar size={16} />
                    {new Date(book.createdAt.seconds * 1000).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {book.hasPdf && (
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 justify-between">
                  <div className="flex flex-col items-center sm:items-start w-full">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0EA5E9] mb-1">PDF Version</span>
                    <div className="text-2xl font-black text-black">৳{book.pdfPrice}</div>
                    <span className="text-[10px] font-medium text-gray-500">Read instantly on your dashboard</span>
                  </div>
                  <Button size="lg" className="w-full sm:w-1/2 gap-2 shrink-0 bg-black hover:bg-gray-800" onClick={() => handlePurchase('pdf', book.pdfPrice)}>
                    <ShoppingCart size={20} />
                    Buy PDF
                  </Button>
                </div>
              )}
              
              {book.hasHardcover && (
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 justify-between">
                  <div className="flex flex-col items-center sm:items-start w-full">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Hardcover</span>
                    <div className="text-2xl font-black text-black">৳{book.hardcoverPrice}</div>
                    <span className="text-[10px] font-medium text-gray-500">Physical book delivered to your address</span>
                  </div>
                  <Button size="lg" className="w-full sm:w-1/2 gap-2 shrink-0 bg-black hover:bg-gray-800" onClick={() => handlePurchase('hardcover', book.hardcoverPrice)}>
                    <ShoppingCart size={20} />
                    Buy Hardcover
                  </Button>
                </div>
              )}

              {!book.hasPdf && !book.hasHardcover && book.price !== undefined && (
                 <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 justify-between">
                  <div className="flex flex-col items-center sm:items-start w-full">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Standard Version</span>
                    <div className="text-2xl font-black text-black">৳{book.price}</div>
                  </div>
                  <Button size="lg" className="w-full sm:w-1/2 gap-2 shrink-0 bg-black hover:bg-gray-800" onClick={() => handlePurchase(book.bookType || 'pdf', book.price)}>
                    <ShoppingCart size={20} />
                    Buy Now
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button size="lg" variant="outline" className="w-full gap-2 text-gray-400 font-bold tracking-widest uppercase text-xs" onClick={() => {
                if (navigator.share) navigator.share({ title: book.title, url: window.location.href });
              }}>
                <Share2 size={16} /> Share
              </Button>
            </div>

            {/* Description Section */}
            <div className="pt-8 border-t border-gray-100">
              <h3 className="text-xs font-black uppercase tracking-[3px] text-gray-400 mb-6 flex items-center gap-2">
                <BookIcon size={14} /> Description
              </h3>
              <div 
                className="rich-text-content text-gray-600 leading-relaxed text-sm lg:text-base break-words"
                dangerouslySetInnerHTML={{ __html: book.description }}
              />
            </div>

            {/* Author Section */}
            {book.authorBio && (
              <div className="pt-8 border-t border-gray-100">
                <h3 className="text-xs font-black uppercase tracking-[3px] text-gray-400 mb-6 flex items-center gap-2">
                  <User size={14} /> লেখক পরিচিতি (Author)
                </h3>
                <div 
                  className="rich-text-content text-gray-600 leading-relaxed text-sm lg:text-base bg-gray-50 p-6 rounded-2xl border border-gray-100"
                  dangerouslySetInnerHTML={{ __html: book.authorBio }}
                />
              </div>
            )}
          </motion.div>
        </div>

        {/* Video Trailer */}
        {book.videoUrl && (
          <div className="mt-20 pt-16 border-t border-gray-100">
            <h3 className="text-xl font-bold mb-8">Book Trailer</h3>
            <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
              <iframe 
                src={getEmbedUrl(book.videoUrl)}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        {/* Gallery Preview Below (As requested "বইয়ের নিচে কিছু ছবি যুক্ত করা থাকবে") */}
        {gallery.length > 0 && (
          <div className="mt-24 pt-20 border-t border-gray-100">
            <header className="mb-12">
               <h3 className="text-xs font-black uppercase tracking-[4px] text-gray-400 mb-2">GALLERY</h3>
               <h2 className="text-2xl font-black tracking-tight">বইয়ের ভেতরের কিছু পৃষ্ঠা (Preview)</h2>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {gallery.map((img: string, i: number) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  className="aspect-[3/4] bg-gray-100 rounded-3xl overflow-hidden shadow-xl border border-gray-100"
                >
                  <img referrerPolicy="no-referrer" 
                    src={getThumbnailUrl(img)} 
                    alt={`Preview ${i + 1}`} 
                    className="w-full h-full object-cover"
                    />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedBookForPurchase && (
        <PaymentModal 
          isOpen={!!selectedBookForPurchase} 
          onClose={() => setSelectedBookForPurchase(null)} 
          item={{ ...selectedBookForPurchase, type: 'book' }}
        />
      )}
    </div>
  );
}
