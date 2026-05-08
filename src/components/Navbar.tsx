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
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight">Ribat Academy</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-black",
                isActive(link.href) ? "text-black" : "text-gray-500"
              )}
            >
              {link.name}
            </Link>
          ))}

          {user ? (
            <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
              <NotificationCenter />
              <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs">
                  {userData?.name?.[0] || user.email?.[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium">{userData?.name || 'Dashboard'}</span>
              </Link>
              <button 
                onClick={() => signOut()}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Button onClick={signInWithGoogle} size="sm">Get Started</Button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-gray-500"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block text-lg font-medium",
                    isActive(link.href) ? "text-black" : "text-gray-500"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-100">
                {user ? (
                  <div className="space-y-4">
                    <Link
                      to="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 text-lg font-medium text-black"
                    >
                      <User size={20} />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 text-lg font-medium text-red-500"
                    >
                      <LogOut size={20} />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Button 
                    onClick={() => {
                      signInWithGoogle();
                      setIsOpen(false);
                    }} 
                    fullWidth
                  >
                    Login / Sign Up
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
