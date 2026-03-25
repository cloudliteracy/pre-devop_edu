import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import CSRCodeEntry from './CSRCodeEntry';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const location = useLocation();
  const [hoveredLink, setHoveredLink] = React.useState(null);
  const [showCSRModal, setShowCSRModal] = React.useState(false);

  const getLinkStyle = (linkName) => ({
    ...styles.link,
    color: hoveredLink === linkName ? '#fff' : '#FFD700',
    textShadow: hoveredLink === linkName ? '0 0 10px rgba(255, 215, 0, 0.8)' : 'none',
    transform: hoveredLink === linkName ? 'translateY(-2px)' : 'translateY(0)'
  });

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <div style={styles.logoContainer}>
          <Link to="/" style={styles.logo}>
            <span style={styles.logoIcon}>☁️</span>
            CloudLiteracy
          </Link>
          <Link 
            to="/" 
            style={getLinkStyle('home')}
            onMouseEnter={() => setHoveredLink('home')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            Home
          </Link>
        </div>
        <div style={styles.menu}>
          <Link 
            to={location.pathname === '/modules' ? '/' : '/modules'} 
            style={getLinkStyle('modules')}
            onMouseEnter={() => setHoveredLink('modules')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            Modules
          </Link>
          <Link 
            to={location.pathname === '/chat' ? '/' : '/chat'} 
            style={getLinkStyle('chat')}
            onMouseEnter={() => setHoveredLink('chat')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            Chat
          </Link>
          <Link 
            to={location.pathname === '/polls' ? '/' : '/polls'}  
            style={getLinkStyle('polls')}
            onMouseEnter={() => setHoveredLink('polls')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            Polls
          </Link>
          {isAuthenticated && user?.role !== 'admin' && !user?.isSuperAdmin && (
            <Link 
              to={location.pathname === '/vouchers' ? '/' : '/vouchers'} 
              style={getLinkStyle('vouchers')}
              onMouseEnter={() => setHoveredLink('vouchers')}
              onMouseLeave={() => setHoveredLink(null)}
            >
              🎓 AWS Vouchers
            </Link>
          )}
          {user && (user.role === 'admin' || user.isSuperAdmin) && (user.isSuperAdmin || user.canManageAnnouncements) && (
            <Link 
              to={location.pathname === '/announcements-management' ? '/' : '/announcements-management'} 
              style={getLinkStyle('announcements')}
              onMouseEnter={() => setHoveredLink('announcements')}
              onMouseLeave={() => setHoveredLink(null)}
            >
              Announcements
            </Link>
          )}
          <Link 
            to={location.pathname === '/about' ? '/' : '/about'} 
            style={getLinkStyle('about')}
            onMouseEnter={() => setHoveredLink('about')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            About Us
          </Link>

          <Link 
            to={location.pathname === '/contact' ? '/' : '/contact'} 
            style={getLinkStyle('contact')}
            onMouseEnter={() => setHoveredLink('contact')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            Contact Us
          </Link>
          {isAuthenticated ? (
            <>
              <button 
                onClick={() => setShowCSRModal(true)}
                style={getLinkStyle('csr')}
                onMouseEnter={() => setHoveredLink('csr')}
                onMouseLeave={() => setHoveredLink(null)}
              >
                🎓 CSR Access Code
              </button>
              {user?.role === 'admin' && (
                <Link 
                  to={location.pathname === '/admin' ? '/' : '/admin'} 
                  style={getLinkStyle('admin')}
                  onMouseEnter={() => setHoveredLink('admin')}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  Admin
                </Link>
              )}
              <Link to={location.pathname === '/profile' ? '/' : '/profile'} style={styles.profileLink}>
                <span style={styles.userName}>Hello, {user?.name}</span>
              </Link>
              <button onClick={logout} style={styles.logoutButton}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to={location.pathname === '/login' ? '/' : '/login'} 
                style={getLinkStyle('login')}
                onMouseEnter={() => setHoveredLink('login')}
                onMouseLeave={() => setHoveredLink(null)}
              >
                Login
              </Link>
              <Link 
                to={location.pathname === '/register' ? '/' : '/register'} 
                style={getLinkStyle('register')}
                onMouseEnter={() => setHoveredLink('register')}
                onMouseLeave={() => setHoveredLink(null)}
              >
                Register
              </Link>
              <button 
                onClick={() => setShowCSRModal(true)}
                style={getLinkStyle('csr')}
                onMouseEnter={() => setHoveredLink('csr')}
                onMouseLeave={() => setHoveredLink(null)}
              >
                🎓 CSR Access Code
              </button>
            </>
          )}
        </div>
      </div>
      {showCSRModal && <CSRCodeEntry onClose={() => setShowCSRModal(false)} />}
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: '#000',
    borderBottom: '2px solid #FFD700',
    padding: '15px 0',
    boxShadow: '0 2px 10px rgba(255, 215, 0, 0.1)'
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    color: '#FFD700',
    textDecoration: 'none',
    fontSize: '24px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '5px'
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px'
  },
  logoIcon: {
    fontSize: '28px'
  },
  menu: {
    display: 'flex',
    alignItems: 'center',
    gap: '25px'
  },
  link: {
    color: '#FFD700',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.3s',
    cursor: 'pointer',
    background: 'none',
    border: 'none'
  },
  userName: {
    color: '#ccc',
    fontSize: '15px'
  },
  profileLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    cursor: 'pointer'
  },
  logoutButton: {
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  }
};

export default Navbar;
