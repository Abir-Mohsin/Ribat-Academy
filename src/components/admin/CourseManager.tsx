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
import { RichTextEditor } from '@/src/components/RichTextEditor';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Loader2, 
  Video, 
  X, 
  GripVertical,
  CheckCircle,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/src/components/Button';
import { cn } from '@/src/lib/utils';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  videoId: string;
  duration: string;
  icon?: string;
}

interface Course {
  id?: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  instructor: {
    name: string;
    role: string;
    bio: string;
  };
  objectives: string[];
  lessons: Lesson[];
  status: 'draft' | 'published';
  createdAt?: any;
}

export function CourseManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse?.title || !editingCourse?.description) return;

    setSaving(true);
    try {
      const data = {
        ...editingCourse,
        updatedAt: serverTimestamp(),
      };

      if (editingCourse.id) {
        await updateDoc(doc(db, 'courses', editingCourse.id), data);
      } else {
        await addDoc(collection(db, 'courses'), {
          ...data,
          createdAt: serverTimestamp(),
          status: 'published',
          lessons: editingCourse.lessons || [],
          objectives: editingCourse.objectives || [],
        });
      }
      setIsEditing(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'courses');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'courses', id));
      setCourses(courses.filter(c => c.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `courses/${id}`);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold">
            {editingCourse?.id ? 'Edit Course' : 'Create New Course'}
          </h3>
          <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-8 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Course Title</label>
                <input 
                  type="text" 
                  value={editingCourse?.title || ''}
                  onChange={e => setEditingCourse({...editingCourse, title: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100"
                  placeholder="e.g. Arabic Foundations"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Price (BDT)</label>
                <input 
                  type="number" 
                  value={editingCourse?.price || ''}
                  onChange={e => setEditingCourse({...editingCourse, price: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Thumbnail URL</label>
                <input 
                  type="text" 
                  value={editingCourse?.thumbnail || ''}
                  onChange={e => setEditingCourse({...editingCourse, thumbnail: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description</label>
              <RichTextEditor 
                value={editingCourse?.description || ''}
                onChange={content => setEditingCourse({...editingCourse, description: content})}
                placeholder="Course overview..."
                className="h-[350px] mb-16"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-50">
            <h4 className="font-bold text-sm">Instructor Details</h4>
            <div className="grid md:grid-cols-2 gap-4">
               <input 
                 type="text" 
                 value={editingCourse?.instructor?.name || ''}
                 onChange={e => setEditingCourse({
                   ...editingCourse, 
                   instructor: { ...editingCourse?.instructor!, name: e.target.value, bio: editingCourse?.instructor?.bio || '', role: editingCourse?.instructor?.role || '' } 
                 })}
                 placeholder="Instructor Name"
                 className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100"
               />
               <input 
                 type="text" 
                 value={editingCourse?.instructor?.role || ''}
                 onChange={e => setEditingCourse({
                   ...editingCourse, 
                   instructor: { ...editingCourse?.instructor!, role: e.target.value, bio: editingCourse?.instructor?.bio || '', name: editingCourse?.instructor?.name || '' } 
                 })}
                 placeholder="Role (e.g. Arabic Lingust)"
                 className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none border border-gray-100"
               />
            </div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Instructor Bio</label>
            <RichTextEditor
                 value={editingCourse?.instructor?.bio || ''}
                 onChange={content => setEditingCourse({
                   ...editingCourse, 
                   instructor: { ...editingCourse?.instructor!, bio: content, role: editingCourse?.instructor?.role || '', name: editingCourse?.instructor?.name || '' } 
                 })}
                 placeholder="Instructor Bio..."
                 className="h-[250px] mb-14"
             />
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-50">
             <h4 className="font-bold text-sm">Detailed Learning Objectives</h4>
             <p className="text-[10px] text-gray-400 -mt-2">Use the rich text editor to format your learning objectives.</p>
             <RichTextEditor
                value={typeof editingCourse?.objectives === 'string' ? editingCourse.objectives : (editingCourse?.objectives?.join('<br />') || '')}
                onChange={content => setEditingCourse({...editingCourse, objectives: [content] as any})}
                placeholder="What will the students learn?"
                className="h-[250px] mb-14"
             />
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-50">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm">Course Content (Lessons)</h4>
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const lessons = editingCourse?.lessons || [];
                  setEditingCourse({
                    ...editingCourse,
                    lessons: [...lessons, { id: Date.now().toString(), title: '', videoId: '', duration: '' }]
                  });
                }}
              >
                Add Lesson
              </Button>
            </div>
            <div className="space-y-6">
              {editingCourse?.lessons?.map((lesson, index) => (
                <div key={lesson.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 group">
                  <div className="flex gap-3 mb-4">
                    <div className="mt-3 text-gray-300">
                      <GripVertical size={16} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-grow">
                       <input 
                         type="text" 
                         value={lesson.title}
                         onChange={e => {
                           const lessons = [...(editingCourse.lessons || [])];
                           lessons[index].title = e.target.value;
                           setEditingCourse({ ...editingCourse, lessons });
                         }}
                         placeholder="Lesson Title"
                         className="px-3 py-2 bg-white rounded-lg border border-gray-100 text-sm"
                       />
                       <input 
                         type="text" 
                         value={lesson.videoId}
                         onChange={e => {
                           const lessons = [...(editingCourse.lessons || [])];
                           lessons[index].videoId = e.target.value;
                           setEditingCourse({ ...editingCourse, lessons });
                         }}
                         placeholder="YouTube/Vimeo ID"
                         className="px-3 py-2 bg-white rounded-lg border border-gray-100 text-sm"
                       />
                       <input 
                         type="text" 
                         value={lesson.duration}
                         onChange={e => {
                           const lessons = [...(editingCourse.lessons || [])];
                           lessons[index].duration = e.target.value;
                           setEditingCourse({ ...editingCourse, lessons });
                         }}
                         placeholder="Duration (e.g. 10:00)"
                         className="px-3 py-2 bg-white rounded-lg border border-gray-100 text-sm"
                       />
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const lessons = editingCourse.lessons?.filter((_, i) => i !== index);
                        setEditingCourse({ ...editingCourse, lessons });
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="ml-7 space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Lesson Icon</label>
                      <select
                        value={lesson.icon || 'PlayCircle'}
                        onChange={e => {
                          const lessons = [...(editingCourse.lessons || [])];
                          lessons[index].icon = e.target.value;
                          setEditingCourse({ ...editingCourse, lessons });
                        }}
                        className="px-3 py-2 bg-white rounded-lg border border-gray-100 text-sm w-full md:w-auto"
                      >
                        <option value="PlayCircle">Play Icon</option>
                        <option value="Video">Video Icon</option>
                        <option value="BookOpen">Document Icon</option>
                        <option value="Headphones">Audio Icon</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Lesson Content/Description</label>
                      <RichTextEditor
                         value={lesson.description || ''}
                         onChange={content => {
                           const lessons = [...(editingCourse.lessons || [])];
                           lessons[index].description = content;
                           setEditingCourse({ ...editingCourse, lessons });
                         }}
                         placeholder="Detail about this lesson..."
                         className="h-[120px] mb-10"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!editingCourse?.lessons || editingCourse.lessons.length === 0) && (
                <div className="text-center p-8 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 text-sm">
                  No lessons added yet. Click 'Add Lesson' to begin.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-8 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {editingCourse?.id ? 'Update Course' : 'Create Course'}
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
              placeholder="Search courses..." 
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-100 focus:outline-none shadow-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
         </div>
         <Button className="gap-2" onClick={() => {
           setEditingCourse({
             title: '',
             description: '',
             price: 0,
             thumbnail: '',
             instructor: { name: '', role: '', bio: '' },
             lessons: [],
             objectives: [],
             status: 'published'
           });
           setIsEditing(true);
         }}>
           <Plus size={18} /> Add New Course
         </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4 w-1/3">Course Details</th>
                <th className="px-6 py-4 whitespace-nowrap">Price</th>
                <th className="px-6 py-4 whitespace-nowrap">Lessons</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-gray-300" size={32} />
                  </td>
                </tr>
              ) : filteredCourses.map(course => (
                <tr key={course.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 max-w-[300px]">
                    <div className="flex items-center gap-4">
                      <div className="w-20 aspect-video bg-gray-100 rounded-lg overflow-hidden shrink-0 shadow-sm border border-gray-100">
                        {course.thumbnail ? (
                          <img src={getThumbnailUrl(course.thumbnail)} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={20} /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <p className="font-bold text-sm truncate text-black">{course.title}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5" title={course.description.replace(/<[^>]+>/g, '') || 'No description'}>
                          {course.description ? course.description.replace(/<[^>]+>/g, '') : 'No description'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-sm select-none">৳{course.price}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                      <Video size={14} className="text-blue-500" />
                      {course.lessons?.length || 0} Lessons
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={async () => {
                        const newStatus = course.status === 'published' ? 'draft' : 'published';
                        await updateDoc(doc(db, 'courses', course.id!), { status: newStatus });
                        setCourses(courses.map(c => c.id === course.id ? { ...c, status: newStatus } : c));
                      }}
                      className={cn(
                        "text-[10px] font-bold px-3 py-1 rounded-full uppercase transition-colors hover:ring-1 whitespace-nowrap",
                        course.status === 'published' ? "bg-green-100 text-green-700 ring-green-200" : "bg-gray-100 text-gray-600 ring-gray-200"
                      )}
                    >
                      {course.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setEditingCourse(course);
                          setIsEditing(true);
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:text-white hover:bg-blue-500 transition-all shadow-sm group"
                        title="Edit Course"
                      >
                        <Edit2 size={16} className="group-hover:scale-110 transition-transform" />
                      </button>
                      <button 
                        onClick={() => course.id && handleDelete(course.id)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white transition-all shadow-sm group"
                        title="Delete Course"
                      >
                        <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCourses.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-gray-400">
                     No courses found. Add your first course to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
