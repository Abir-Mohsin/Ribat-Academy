import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { PaymentModal } from '@/src/components/PaymentModal';
import { useAuth } from '@/src/contexts/AuthContext';
import { getThumbnailUrl } from '@/src/lib/drive';

export function Books() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const q = query(collection(db, 'books'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (data.length > 0) setBooks(data);
        else throw new Error('No data');
      } catch (error) {
        setBooks([
          { id: '1', title: 'The Prophetic Character', description: 'Ethics of the Prophet (PBUH).', hasPdf: true, pdfPrice: 150, hasHardcover: true, hardcoverPrice: 350, image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80', author: 'Dr. Abdur Rahim' },
          { id: '2', title: 'Digital Productivity', description: 'Work smarter, not harder.', hasPdf: true, pdfPrice: 120, image: 'https://images.unsplash.com/photo-1532012197267-da84d0279c6d?auto=format&fit=crop&q=80', author: 'Abu Bakr' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const handlePurchase = (book: any) => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    setSelectedBook(book);
  };

  return (
    <div className="pt-24 pb-32 px-4 bg-gray-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 text-center">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
             Library Console
           </div>
          <h1 className="text-4xl sm:text-6xl font-black mb-6 tracking-tight">Digital Bookstore</h1>
          <p className="text-gray-400 max-w-xl mx-auto font-medium text-sm sm:text-lg">Expand your knowledge with our exclusive collection of e-books and study guides.</p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 lg:gap-10">
          {loading ? (
             [1,2,3,4].map(i => <div key={i} className="aspect-[3/5] bg-gray-100 rounded-[32px] animate-pulse" />)
          ) : (
            books.map(book => (
              <div key={book.id} className="bg-white rounded-[24px] overflow-hidden flex flex-col group transition-all duration-500 border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1.5">
                <div 
                  className="relative aspect-[3/4] overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/books/${book.id}`)}
                >
                  {(book.coverImage || book.image) ? (
                    <img
                      src={getThumbnailUrl(book.coverImage || book.image)}
                      alt={book.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">No Cover</div>
                  )}
                  {/* We remove the general badge. Hardcover/PDF is handled in the UI */}
                </div>

                <div className="p-4 sm:p-5 flex flex-col flex-grow">
                  <h3 className="text-sm sm:text-lg font-bold text-[#111111] line-clamp-2 mb-1 leading-tight">
                    {book.title}
                  </h3>
                  {book.author && (
                    <p className="text-[10px] sm:text-xs text-blue-500 font-bold uppercase tracking-wider mb-3">
                      By {book.author}
                    </p>
                  )}
                  
                  <div className="flex flex-col gap-2 mt-auto pt-2">
                    {book.hasPdf && (
                      <button
                        onClick={() => handlePurchase({ ...book, type: 'book', purchaseType: 'pdf', price: book.pdfPrice })}
                        className="w-full relative overflow-hidden bg-gray-50 hover:bg-black text-black hover:text-white border border-gray-200 px-4 py-2.5 rounded-xl transition-all duration-300 flex items-center justify-between group/btn"
                      >
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">PDF E-Book</span>
                          <span className="text-[9px] font-medium text-gray-400 group-hover/btn:text-gray-300">Read on dashboard</span>
                        </div>
                        <span className="text-sm sm:text-base font-black tracking-tight">৳{book.pdfPrice}</span>
                      </button>
                    )}
                    {book.hasHardcover && (
                      <button
                        onClick={() => handlePurchase({ ...book, type: 'book', purchaseType: 'hardcover', price: book.hardcoverPrice })}
                        className="w-full relative overflow-hidden bg-gray-50 hover:bg-black text-black hover:text-white border border-gray-200 px-4 py-2.5 rounded-xl transition-all duration-300 flex items-center justify-between group/btn"
                      >
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">Hardcover</span>
                          <span className="text-[9px] font-medium text-gray-400 group-hover/btn:text-gray-300">Physical delivery</span>
                        </div>
                        <span className="text-sm sm:text-base font-black tracking-tight">৳{book.hardcoverPrice}</span>
                      </button>
                    )}

                    {(!book.hasPdf && !book.hasHardcover && book.price !== undefined) && (
                      <button
                        onClick={() => handlePurchase({ ...book, type: 'book', purchaseType: book.bookType || 'pdf', price: book.price })}
                        className="w-full bg-black text-white px-4 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all hover:bg-gray-800 active:scale-95 duration-300 shadow-md shadow-black/10 flex items-center justify-between"
                      >
                        <span>Buy Now</span>
                        <span className="text-sm sm:text-base">৳{book.price}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-20 flex justify-center">
          <Button variant="outline" className="rounded-full px-12 border-gray-200">Load More Books</Button>
        </div>
      </div>

      {selectedBook && (
        <PaymentModal 
          isOpen={!!selectedBook} 
          onClose={() => setSelectedBook(null)} 
          item={{ ...selectedBook, type: 'book' }}
        />
      )}
    </div>
  );
}
