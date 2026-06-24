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

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-10 lg:gap-20 items-start w-full">
          {/* Left/Col 1: Images */}
          <div className="w-full space-y-6 order-1 lg:order-1">
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

          {/* Info Block */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full space-y-8 order-3 lg:order-2"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
              {book.hasPdf && (
                <div className="flex flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all justify-between group">
                  <div className="flex flex-col items-start">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#0EA5E9] mb-0.5">eBook / PDF</span>
                    <div className="text-lg font-black text-black leading-none">৳{book.pdfPrice}</div>
                  </div>
                  <Button size="sm" className="h-9 px-4 text-[10px] font-bold rounded-xl gap-1.5 bg-black hover:bg-gray-800 transition-transform group-hover:scale-[1.02]" onClick={() => handlePurchase('pdf', book.pdfPrice)}>
                    <ShoppingCart size={14} /> Buy PDF
                  </Button>
                </div>
              )}
              
              {book.hasHardcover && (
                <div className="flex flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all justify-between group">
                  <div className="flex flex-col items-start">
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-0.5">Physical Book</span>
                    <div className="text-lg font-black text-black leading-none">৳{book.hardcoverPrice}</div>
                  </div>
                  <Button size="sm" className="h-9 px-4 text-[10px] font-bold rounded-xl gap-1.5 bg-black hover:bg-gray-800 transition-transform group-hover:scale-[1.02]" onClick={() => handlePurchase('hardcover', book.hardcoverPrice)}>
                    <ShoppingCart size={14} /> Buy Print
                  </Button>
                </div>
              )}

              {!book.hasPdf && !book.hasHardcover && book.price !== undefined && (
                 <div className="flex flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all justify-between group">
                  <div className="flex flex-col items-start">
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 mb-0.5">Standard Edition</span>
                    <div className="text-lg font-black text-black leading-none">৳{book.price}</div>
                  </div>
                  <Button size="sm" className="h-9 px-4 text-[10px] font-bold rounded-xl gap-1.5 bg-black hover:bg-gray-800 transition-transform group-hover:scale-[1.02]" onClick={() => handlePurchase(book.bookType || 'pdf', book.price)}>
                    <ShoppingCart size={14} /> Buy Now
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <Button size="sm" variant="outline" className="h-9 px-4 gap-2 rounded-xl text-gray-500 font-bold tracking-widest uppercase text-[10px]" onClick={() => {
                if (navigator.share) navigator.share({ title: book.title, url: window.location.href });
              }}>
                <Share2 size={14} /> Share
              </Button>
            </div>

            {/* Description Section */}
            <div className="pt-8 border-t border-gray-100">
              <h3 className="text-[10px] font-black uppercase tracking-[3px] text-gray-400 mb-4 flex items-center gap-2">
                <BookIcon size={12} /> Overview
              </h3>
              <div 
                className="rich-text-content text-gray-600 leading-relaxed text-sm lg:text-base break-words"
                dangerouslySetInnerHTML={{ __html: book.description }}
              />
            </div>
          </motion.div>

          {/* Video Trailer placed here for grid ordering */}
          <div className="w-full order-2 lg:order-3">
            {book.videoUrl && (
              <div className="w-full">
                <h3 className="text-[10px] font-black uppercase tracking-[3px] text-gray-400 mb-4 flex items-center gap-2">
                  <BookIcon size={12} /> Trailer
                </h3>
                <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
                  <iframe 
                    src={getEmbedUrl(book.videoUrl)}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          <div className="w-full order-4 lg:order-4">
            {/* Author Section */}
            {book.authorBio && (
              <div className="h-full">
                <h3 className="text-[10px] font-black uppercase tracking-[3px] text-gray-400 mb-4 flex items-center gap-2">
                  <User size={12} /> লেখক পরিচিতি (Author)
                </h3>
                <div 
                  className="rich-text-content text-gray-600 leading-relaxed text-sm lg:text-base bg-[#FAFAFA] p-6 lg:p-8 rounded-3xl border border-gray-100 shadow-sm"
                  dangerouslySetInnerHTML={{ __html: book.authorBio }}
                />
              </div>
            )}
          </div>
        </div>
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
