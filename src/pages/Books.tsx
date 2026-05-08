import { useState, useEffect } from 'react';
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
          { id: '1', title: 'The Prophetic Character', description: 'Ethics of the Prophet (PBUH).', price: 15, image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80' },
          { id: '2', title: 'Digital Productivity', description: 'Work smarter, not harder.', price: 12, image: 'https://images.unsplash.com/photo-1532012197267-da84d0279c6d?auto=format&fit=crop&q=80' },
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
    <div className="pt-20 pb-32 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Digital Bookstore</h1>
          <p className="text-gray-500 max-w-xl mx-auto">Expand your knowledge with our exclusive collection of e-books and study guides.</p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
             [1,2,3,4].map(i => <div key={i} className="aspect-[3/5] bg-gray-50 rounded-2xl animate-pulse" />)
          ) : (
            books.map(book => (
              <Card 
                key={book.id} 
                {...book} 
                subtitle={book.author}
                image={book.coverImage ? getThumbnailUrl(book.coverImage) : (book.image ? getThumbnailUrl(book.image) : undefined)}
                badge={book.bookType || 'PDF'}
                buttonText="Buy Now"
                imageClassName="aspect-[3/4]"
                onClick={() => handlePurchase(book)}
              />
            ))
          )}
        </div>

        <div className="mt-20 flex justify-center">
          <Button variant="outline">Load More Books</Button>
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
