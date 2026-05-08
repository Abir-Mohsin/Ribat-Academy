import { getThumbnailUrl } from '@/src/lib/drive';
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  query,
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Loader2, 
  X, 
  Image as ImageIcon,
  Tag,
  Book as BookIcon,
  Upload
} from 'lucide-react';
import { Button } from '@/src/components/Button';
import { cn } from '@/src/lib/utils';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/src/lib/firebase';

interface Book {
  id?: string;
  title: string;
  description: string;
  price: number;
  coverImage: string;
  author: string;
  bookType: 'hardcover' | 'pdf';
  fileUrl?: string;
  status: 'draft' | 'published';
  createdAt?: any;
}

export function BookManager() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingBook, setEditingBook] = useState<Partial<Book> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPdf(true);
    try {
      const storageRef = ref(storage, `books/pdfs/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setEditingBook(prev => ({ ...prev, fileUrl: url }));
    } catch (error) {
      console.error("PDF Upload Error:", error);
      alert("Failed to upload PDF. Please try again.");
    } finally {
      setUploadingPdf(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'books'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setBooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'books');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook?.title || !editingBook?.description) return;

    setSaving(true);
    try {
      const data = {
        ...editingBook,
        updatedAt: serverTimestamp(),
      };

      if (editingBook.id) {
        await updateDoc(doc(db, 'books', editingBook.id), data);
      } else {
        await addDoc(collection(db, 'books'), {
          ...data,
          createdAt: serverTimestamp(),
          status: 'draft',
        });
      }
      setIsEditing(false);
      setEditingBook(null);
      fetchBooks();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'books');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    try {
      await deleteDoc(doc(db, 'books', id));
      setBooks(books.filter(b => b.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `books/${id}`);
    }
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author?.toLowerCase().includes(search.toLowerCase())
  );

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold">
            {editingBook?.id ? 'Edit Book' : 'Add New Book'}
          </h3>
          <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6 max-w-2xl">
          <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Book Title</label>
                <input 
                  type="text" 
                  value={editingBook?.title || ''}
                  onChange={e => setEditingBook({...editingBook, title: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-sans"
                  placeholder="e.g. Arabic Grammar Made Easy"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2 text-sans">Author Name</label>
                  <input 
                    type="text" 
                    value={editingBook?.author || ''}
                    onChange={e => setEditingBook({...editingBook, author: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-sans"
                    placeholder="e.g. Dr. Abdur Rahim"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Book Type</label>
                  <select 
                    value={editingBook?.bookType || 'pdf'}
                    onChange={e => setEditingBook({...editingBook, bookType: e.target.value as any})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-sans"
                    required
                  >
                    <option value="pdf">PDF (Digital)</option>
                    <option value="hardcover">Hardcover (Physical)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Price (BDT)</label>
                <input 
                  type="number" 
                  value={editingBook?.price || ''}
                  onChange={e => setEditingBook({...editingBook, price: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-sans"
                  required
                />
              </div>
              {editingBook?.bookType === 'pdf' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">PDF File Source</label>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="relative group">
                        <input 
                          type="file" 
                          accept="application/pdf"
                          onChange={handlePdfUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          disabled={uploadingPdf}
                        />
                        <div className="w-full py-6 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center gap-2 bg-gray-50/50 group-hover:bg-gray-50 transition-colors">
                          {uploadingPdf ? (
                            <Loader2 className="animate-spin text-[#0EA5E9]" size={24} />
                          ) : (
                            <Upload className="text-gray-400" size={24} />
                          )}
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {uploadingPdf ? "Uploading..." : "Click to upload PDF file"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold uppercase">OR</div>
                        <input 
                          type="text" 
                          value={editingBook?.fileUrl || ''}
                          onChange={e => setEditingBook({...editingBook, fileUrl: e.target.value})}
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-sans text-sm"
                          placeholder="Paste PDF URL (e.g. Google Drive link)"
                        />
                      </div>
                    </div>
                    {editingBook?.fileUrl && (
                      <p className="mt-2 text-[10px] text-green-600 font-bold flex items-center gap-1">
                        <Tag size={10} /> File linked: {editingBook.fileUrl.substring(0, 50)}...
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Cover Image URL</label>
                <input 
                  type="text" 
                  value={editingBook?.coverImage || ''}
                  onChange={e => setEditingBook({...editingBook, coverImage: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 font-sans"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description</label>
                <textarea 
                  value={editingBook?.description || ''}
                  onChange={e => setEditingBook({...editingBook, description: e.target.value})}
                  className="w-full h-32 px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100 resize-none font-sans"
                  placeholder="Book summary..."
                  required
                />
              </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {editingBook?.id ? 'Update Book' : 'Add Book'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div className="relative max-w-sm flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search books..." 
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-100 focus:outline-none shadow-sm font-sans"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
         </div>
         <Button className="gap-2" onClick={() => {
           setEditingBook({
             title: '',
             description: '',
             price: 0,
             author: '',
             coverImage: '',
             bookType: 'pdf',
             status: 'draft'
           });
           setIsEditing(true);
         }}>
           <Plus size={18} /> Add New Book
         </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden font-sans">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
              <th className="px-6 py-4">Title & Author</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-20 text-center">
                  <Loader2 className="animate-spin mx-auto text-gray-300" size={32} />
                </td>
              </tr>
            ) : filteredBooks.map(book => (
              <tr key={book.id} className="hover:bg-gray-50/50 transition-colors text-sans">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden shrink-0">
                      {book.coverImage ? (
                        <img src={getThumbnailUrl(book.coverImage)} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><BookIcon size={20} /></div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm block">{book.title}</p>
                      <p className="text-xs text-gray-400 font-medium">By {book.author || 'Unknown'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-bold uppercase text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {book.bookType || 'pdf'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold text-sm text-sans tracking-tight">৳{book.price}</span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={async () => {
                      const newStatus = book.status === 'published' ? 'draft' : 'published';
                      await updateDoc(doc(db, 'books', book.id!), { status: newStatus });
                      setBooks(books.map(b => b.id === book.id ? { ...b, status: newStatus } : b));
                    }}
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase transition-colors hover:ring-1",
                      book.status === 'published' ? "bg-green-100 text-green-700 ring-green-200" : "bg-gray-100 text-gray-600 ring-gray-200"
                    )}
                  >
                    {book.status}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setEditingBook(book);
                        setIsEditing(true);
                      }}
                      className="p-2 text-gray-400 hover:text-black transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => book.id && handleDelete(book.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredBooks.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-20 text-center text-gray-400">
                   No books found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
