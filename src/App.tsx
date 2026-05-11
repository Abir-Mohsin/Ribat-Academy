import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages (to be created)
import { Home } from './pages/Home';
import { Courses } from './pages/Courses';
import { Books } from './pages/Books';
import { About } from './pages/About';
import { Dashboard } from './pages/Dashboard';
import { AdminPanel } from './pages/AdminPanel';
import { CoursePlayer } from './pages/CoursePlayer';
import { CustomPage } from './pages/CustomPage';
import { CourseDetails } from './pages/CourseDetails';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { ScrollToTop } from './components/ScrollToTop';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, userData, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>
  );

  if (!user) return <Navigate to="/" />;
  if (adminOnly && userData?.role !== 'admin') return <Navigate to="/dashboard" />;

  return <>{children}</>;
}

function AppContent() {
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const root = document.documentElement;
        if(data.themePrimaryDark) root.style.setProperty('--theme-primary-dark', data.themePrimaryDark);
        if(data.themePrimaryLight) root.style.setProperty('--theme-primary-light', data.themePrimaryLight);
        if(data.themeButtonBg) root.style.setProperty('--theme-button-bg', data.themeButtonBg);
        if(data.themeButtonHover) root.style.setProperty('--theme-button-hover', data.themeButtonHover);
        if(data.themeCardBg) root.style.setProperty('--theme-card-bg', data.themeCardBg);
        if(data.themeCardBorder) root.style.setProperty('--theme-card-border', data.themeCardBorder);
        if(data.themeTextHeading) root.style.setProperty('--theme-text-heading', data.themeTextHeading);
        if(data.themeTextBody) root.style.setProperty('--theme-text-body', data.themeTextBody);
        if(data.themeFooterBg) root.style.setProperty('--theme-footer-bg', data.themeFooterBg);
        if(data.themeFooterText) root.style.setProperty('--theme-footer-text', data.themeFooterText);
      }
    });
    return unsub;
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetails />} />
          <Route path="/books" element={<Books />} />
          <Route path="/about" element={<About />} />
          <Route path="/enroll" element={<CustomPage type="enroll" title="How to Enroll" />} />
          <Route path="/faq" element={<CustomPage type="faq" title="Frequently Asked Questions" />} />
          <Route path="/privacy" element={<CustomPage type="privacy" title="Privacy Policy" />} />
          <Route path="/terms" element={<CustomPage type="privacy" title="Terms & Privacy Policy" />} />
          <Route path="/contact" element={<Navigate to="/about#contact" />} />
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/watch/:id" 
            element={
              <ProtectedRoute>
                <CoursePlayer />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute adminOnly>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
