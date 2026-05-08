import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <span className="font-bold text-xl">Ribat Academy</span>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Empowering students with Islamic wisdom and modern skills. Quality education accessible to everyone, everywhere.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all">
              <Facebook size={18} />
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all">
              <Twitter size={18} />
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all">
              <Instagram size={18} />
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all">
              <Youtube size={18} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider mb-6">Platform</h4>
          <ul className="space-y-4">
            <li><Link to="/courses" className="text-gray-500 hover:text-black transition-colors">All Courses</Link></li>
            <li><Link to="/books" className="text-gray-500 hover:text-black transition-colors">Digital Books</Link></li>
            <li><Link to="/about" className="text-gray-500 hover:text-black transition-colors">About Us</Link></li>
            <li><Link to="/enroll" className="text-gray-500 hover:text-black transition-colors">How to Enroll</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider mb-6">Support</h4>
          <ul className="space-y-4">
            <li><Link to="/dashboard" className="text-gray-500 hover:text-black transition-colors">Student Login</Link></li>
            <li><Link to="/contact" className="text-gray-500 hover:text-black transition-colors">Contact Support</Link></li>
            <li><Link to="/faq" className="text-gray-500 hover:text-black transition-colors">FAQ</Link></li>
            <li><Link to="/terms" className="text-gray-500 hover:text-black transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider mb-6">Contact Us</h4>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <Mail className="text-gray-400 w-5 h-5 shrink-0" />
              <span className="text-gray-500">info@ribatacademy.com</span>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="text-gray-400 w-5 h-5 shrink-0" />
              <span className="text-gray-500">01788876206</span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="text-gray-400 w-5 h-5 shrink-0" />
              <span className="text-gray-500">Global Online Campus</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-20 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-gray-400 text-xs text-center md:text-left">
          © {new Date().getFullYear()} Ribat Academy. All rights reserved.
        </p>
        <p className="text-gray-400 text-xs">
          Built with ❤️ for the Ummah.
        </p>
      </div>
    </footer>
  );
}
