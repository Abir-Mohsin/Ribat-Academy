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
          { id: '1', title: 'The Prophetic Character', description: 'Ethics of the Prophet (PBUH).', price: 15, image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80', author: 'Dr. Abdur Rahim' },
          { id: '2', title: 'Digital Productivity', description: 'Work smarter, not harder.', price: 12, image: 'https://images.unsplash.com/photo-1532012197267-da84d0279c6d?auto=format&fit=crop&q=80', author: 'Abu Bakr' },
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
              <Card 
                key={book.id} 
                title={book.title}
                subtitle={book.author}
                image={book.coverImage ? getThumbnailUrl(book.coverImage) : (book.image ? getThumbnailUrl(book.image) : undefined)}
                badge={book.bookType || 'PDF'}
                price={book.price}
                buttonText="Buy Now"
                secondaryButtonText="Details"
                imageClassName="aspect-[3/4]"
                onClick={() => handlePurchase(book)}
                onSecondaryClick={() => navigate(`/books/${book.id}`)}
              />
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
