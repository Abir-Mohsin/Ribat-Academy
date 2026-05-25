import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, BookOpen, GraduationCap, User, LogOut, Bell, Home as HomeIcon, Library, Video, Info } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from './Button';
import { NotificationCenter } from './NotificationCenter';
import { getDownloadUrl } from '@/src/lib/drive';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, userData, signOut, signInWithGoogle, loading } = useAuth();
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState("https://drive.google.com/file/d/12XB27N6Taj_Ljm8kbnUdsjuSCJDGn-63/view?usp=drive_link");

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().siteLogo) {
        setLogoUrl(docSnap.data().siteLogo);
      }
    });
    return unsub;
  }, []);

  const navLinks = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Courses', href: '/courses', icon: Video },
    { name: 'Books', href: '/books', icon: Library },
    { name: 'About', href: '/about', icon: Info },
  ];

  const mobileNavLinks = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Courses', href: '/courses', icon: Video },
    { name: 'Books', href: '/books', icon: Library },
    { name: 'About', href: '/about', icon: Info },
    { name: user ? 'Profile' : 'Sign In', href: user ? '/dashboard' : null, icon: User, action: !user ? signInWithGoogle : undefined },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#002D34]/95 backdrop-blur-xl border-b border-white/5 font-sans">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative">
          
          {/* Left spacer for mobile to keep logo centered */}
          <div className="w-10 sm:w-12 md:hidden"></div>

          {/* Logo */}
          <Link to="/" className="flex items-center group transition-transform active:scale-95 absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
            <div className="h-10 sm:h-12 overflow-hidden shrink-0 flex items-center justify-center">
               <img referrerPolicy="no-referrer" 
                 src={getDownloadUrl(logoUrl)} 
                 alt="Ribat Academy Logo" 
                 className="w-auto h-full object-contain"
                 />
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-10">
            <div className="flex items-center gap-8 pr-8 border-r border-white/10">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={cn(
                    "text-xs font-black uppercase tracking-[2px] transition-all duration-300 hover:text-white",
                    isActive(link.href) ? "text-white" : "text-white/40"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {user ? (
              <div className="flex items-center gap-6">
                <NotificationCenter />
                <Link to="/dashboard" className="flex items-center gap-3 p-1 pr-4 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-all group">
                  <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center font-black text-sm uppercase group-hover:scale-105 transition-transform">
                    {userData?.name?.[0] || user?.displayName?.[0] || user.email?.[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-white/80">{userData?.name?.split(' ')[0] || user?.displayName?.split(' ')[0] || (loading ? '...' : 'Dashboard')}</span>
                </Link>
                <button 
                  onClick={() => signOut()}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/10"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Button onClick={signInWithGoogle} size="sm" className="px-8 rounded-full font-black text-[10px] tracking-widest">ENROLL NOW</Button>
            )}
          </div>

          {/* Mobile Right Icons */}
          <div className="md:hidden flex items-center justify-end w-10 sm:w-12">
            {user && <NotificationCenter />}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#002D34]/95 backdrop-blur-xl border-t border-white/5 pb-safe">
        <div className="flex items-center justify-around h-16">
          {mobileNavLinks.map((link) => {
            const Icon = link.icon;
            const active = link.href && isActive(link.href);
            
            const content = (
              <div className="flex flex-col items-center justify-center w-full h-full gap-1">
                <Icon size={20} className={cn("transition-colors", active ? "text-white" : "text-white/40")} />
                <span className={cn("text-[9px] font-bold uppercase tracking-wider transition-colors", active ? "text-white" : "text-white/40")}>
                  {link.name}
                </span>
              </div>
            );

            if (link.action) {
              return (
                <button
                  key={link.name}
                  onClick={link.action}
                  className="flex-1 h-full active:scale-95 transition-transform"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={link.name}
                to={link.href!}
                className="flex-1 h-full active:scale-95 transition-transform"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
