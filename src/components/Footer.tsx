import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[var(--color-footer-bg)] border-t border-[var(--color-footer-bg)] text-[var(--color-footer-text)] pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-[var(--color-footer-bg)] font-bold text-lg">R</span>
            </div>
            <span className="font-bold text-xl text-[var(--color-footer-text)]">Ribat Academy</span>
          </div>
          <p className="text-[var(--color-footer-text)] opacity-80 text-sm leading-relaxed mb-6">
            Empowering students with Islamic wisdom and modern skills. Quality education accessible to everyone, everywhere.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[var(--color-footer-text)] opacity-70 hover:opacity-100 hover:bg-white hover:text-[var(--color-footer-bg)] transition-all">
              <Facebook size={18} />
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[var(--color-footer-text)] opacity-70 hover:opacity-100 hover:bg-white hover:text-[var(--color-footer-bg)] transition-all">
              <Twitter size={18} />
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[var(--color-footer-text)] opacity-70 hover:opacity-100 hover:bg-white hover:text-[var(--color-footer-bg)] transition-all">
              <Instagram size={18} />
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[var(--color-footer-text)] opacity-70 hover:opacity-100 hover:bg-white hover:text-[var(--color-footer-bg)] transition-all">
              <Youtube size={18} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider mb-6 text-[var(--color-footer-text)] opacity-90">Platform</h4>
          <ul className="space-y-4">
            <li><Link to="/courses" className="text-[var(--color-footer-text)] opacity-60 hover:opacity-100 transition-colors">All Courses</Link></li>
            <li><Link to="/books" className="text-[var(--color-footer-text)] opacity-60 hover:opacity-100 transition-colors">Digital Books</Link></li>
            <li><Link to="/about" className="text-[var(--color-footer-text)] opacity-60 hover:opacity-100 transition-colors">About Us</Link></li>
            <li><Link to="/enroll" className="text-[var(--color-footer-text)] opacity-60 hover:opacity-100 transition-colors">How to Enroll</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider mb-6 text-[var(--color-footer-text)] opacity-90">Support</h4>
          <ul className="space-y-4">
            <li><Link to="/dashboard" className="text-[var(--color-footer-text)] opacity-60 hover:opacity-100 transition-colors">Student Login</Link></li>
            <li><Link to="/contact" className="text-[var(--color-footer-text)] opacity-60 hover:opacity-100 transition-colors">Contact Support</Link></li>
            <li><Link to="/faq" className="text-[var(--color-footer-text)] opacity-60 hover:opacity-100 transition-colors">FAQ</Link></li>
            <li><Link to="/terms" className="text-[var(--color-footer-text)] opacity-60 hover:opacity-100 transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider mb-6 text-[var(--color-footer-text)] opacity-90">Contact Us</h4>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <Mail className="text-[var(--color-footer-text)] opacity-60 w-5 h-5 shrink-0" />
              <span className="text-[var(--color-footer-text)] opacity-60">info@ribatacademy.com</span>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="text-[var(--color-footer-text)] opacity-60 w-5 h-5 shrink-0" />
              <span className="text-[var(--color-footer-text)] opacity-60">01788876206</span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="text-[var(--color-footer-text)] opacity-60 w-5 h-5 shrink-0" />
              <span className="text-[var(--color-footer-text)] opacity-60">Global Online Campus</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-20 pt-8 border-t border-[var(--color-footer-text)]/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[var(--color-footer-text)] opacity-40 text-xs text-center md:text-left">
          © {new Date().getFullYear()} Ribat Academy. All rights reserved.
        </p>
        <p className="text-[var(--color-footer-text)] opacity-40 text-xs">
          Built with ❤️ for the Ummah.
        </p>
      </div>
    </footer>
  );
}
