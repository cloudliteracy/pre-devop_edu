import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ModuleList from './pages/ModuleList';
import ModuleDetail from './pages/ModuleDetail';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AdminDashboard from './pages/AdminDashboard';
import ForcePasswordChange from './pages/ForcePasswordChange';
import ResetPassword from './pages/ResetPassword';
import Chat from './pages/Chat';
import Polls from './pages/Polls';
import Announcements from './pages/Announcements';
import Vouchers from './pages/Vouchers';
import Testimonials from './pages/Testimonials';
import Profile from './pages/Profile';
import PartnerPackages from './pages/PartnerPackages';
import socketService from './services/socket';

function AppContent() {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user) {
      socketService.connect({
        userId: user.id,
        userName: user.name,
        userEmail: user.email
      });

      // Listen for admin suspension
      socketService.onAdminSuspended((data) => {
        if (data.email === user.email) {
          alert('Your account has been suspended by the administrator. You will be logged out.');
          logout();
          window.location.href = '/login';
        }
      });

      // Listen for user suspension
      socketService.onUserSuspended((data) => {
        if (data.email === user.email) {
          alert('Your account has been suspended by the administrator. You will be logged out.');
          logout();
          window.location.href = '/login';
        }
      });
    }

    return () => {
      if (user) {
        socketService.offAdminSuspended();
        socketService.offUserSuspended();
        socketService.disconnect();
      }
    };
  }, [user, logout]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/modules" element={<ModuleList />} />
          <Route path="/module/:id" element={<ModuleDetail />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/polls" element={<Polls />} />
          <Route path="/vouchers" element={<Vouchers />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/announcements-management" element={<Announcements />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/change-password-required" element={<ForcePasswordChange />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/partner-packages" element={<PartnerPackages />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
