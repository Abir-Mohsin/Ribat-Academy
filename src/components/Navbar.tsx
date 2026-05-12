import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, BookOpen, GraduationCap, User, LogOut, Bell } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from './Button';
import { NotificationCenter } from './NotificationCenter';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, userData, signOut, signInWithGoogle } = useAuth();
  const location = useLocation();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Courses', href: '/courses' },
    { name: 'Books', href: '/books' },
    { name: 'About', href: '/about' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-[#002D34]/95 backdrop-blur-xl border-b border-white/5 font-sans">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group transition-transform active:scale-95">
          <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-white/10 group-hover:rotate-6 transition-transform duration-500">
            <GraduationCap className="text-[#002D34] w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tight text-white leading-none">Ribat</span>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[3px] leading-none mt-1">Academy</span>
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
                  {userData?.name?.[0] || user.email?.[0].toUpperCase()}
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-white/80">{userData?.name?.split(' ')[0] || 'Dashboard'}</span>
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

        {/* Mobile Toggle & Icons */}
        <div className="md:hidden flex items-center gap-4">
          {user && <NotificationCenter />}
          <button
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white active:scale-90 transition-transform"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 top-20 bg-black/60 backdrop-blur-sm z-[45]"
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-20 left-0 right-0 z-50 p-4"
            >
              <div className="bg-white rounded-[32px] shadow-2xl p-8 border border-gray-100 font-sans">
                <div className="space-y-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "block text-2xl font-black tracking-tight transition-colors",
                        isActive(link.href) ? "text-black" : "text-gray-300 hover:text-black"
                      )}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <div className="pt-8 border-t border-gray-100 space-y-4">
                    {user ? (
                      <>
                        <Link
                          to="/dashboard"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl group active:scale-95 transition-transform"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-black">
                               {userData?.name?.[0] || user.email?.[0].toUpperCase()}
                            </div>
                            <div>
                               <p className="font-black text-black">Member Profile</p>
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Manage Account</p>
                            </div>
                          </div>
                          <User className="text-gray-300 group-hover:text-black transition-colors" size={24} />
                        </Link>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            signOut();
                            setIsOpen(false);
                          }}
                          className="w-full h-16 rounded-[24px] text-red-500 font-black tracking-widest border border-red-50 shadow-sm"
                        >
                          SIGN OUT
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={() => {
                          signInWithGoogle();
                          setIsOpen(false);
                        }} 
                        fullWidth
                        size="lg"
                        className="h-16 rounded-[24px] font-black tracking-widest shadow-2xl shadow-black/10"
                      >
                        ACCESS PORTAL
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
