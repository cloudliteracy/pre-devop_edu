import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const location = useLocation();
  const [hoveredLink, setHoveredLink] = React.useState(null);

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
            <div style={styles.cloudLiteracyLogo}>
              <div style={styles.cloudIconWrapper}>
                <span style={styles.mainCloudIcon}>☁️</span>
                <span style={styles.sparkle1}>✨</span>
                <span style={styles.sparkle2}>✨</span>
              </div>
              <div style={styles.logoTextWrapper}>
                <span style={styles.cloudText}>Cloud</span>
                <span style={styles.literacyText}>Literacy</span>
              </div>
              <div style={styles.tagline}>Elevate Your DevOps Journey</div>
            </div>
          </Link>
        </div>
        <div style={styles.menu}>
          <Link 
            to="/" 
            style={getLinkStyle('home')}
            onMouseEnter={() => setHoveredLink('home')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            Home
          </Link>
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
          {isAuthenticated && user?.role !== 'admin' && !user?.isSuperAdmin && user?.role !== 'partner' && (
            <Link 
              to={location.pathname === '/vouchers' ? '/' : '/vouchers'} 
              style={getLinkStyle('vouchers')}
              onMouseEnter={() => setHoveredLink('vouchers')}
              onMouseLeave={() => setHoveredLink(null)}
            >
              🎓 AWS Vouchers
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
                {user?.profilePhoto ? (
                  <img 
                    src={`http://localhost:5000${user.profilePhoto.startsWith('/') ? '' : '/'}${user.profilePhoto.replace(/\\/g, '/')}`} 
                    alt="Profile" 
                    style={styles.navProfileImage} 
                  />
                ) : (
                  <div style={styles.navProfilePlaceholder}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
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
            </>
          )}
        </div>
      </div>
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
    gap: '15px',
    marginBottom: '5px'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  logoIcon: {
    fontSize: '28px'
  },
  cloudLiteracyLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    position: 'relative'
  },
  cloudIconWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mainCloudIcon: {
    fontSize: '42px',
    filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))',
    animation: 'pulse 2s ease-in-out infinite'
  },
  sparkle1: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    fontSize: '14px',
    animation: 'sparkle 1.5s ease-in-out infinite'
  },
  sparkle2: {
    position: 'absolute',
    bottom: '-5px',
    left: '-5px',
    fontSize: '12px',
    animation: 'sparkle 1.5s ease-in-out infinite 0.75s'
  },
  logoTextWrapper: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: '1.2'
  },
  cloudText: {
    fontSize: '28px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '1px',
    fontFamily: 'Arial Black, sans-serif',
    textShadow: '0 2px 10px rgba(255, 215, 0, 0.3)'
  },
  literacyText: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: '1px',
    fontFamily: 'Arial Black, sans-serif',
    textShadow: '0 2px 8px rgba(255, 255, 255, 0.3)'
  },
  tagline: {
    position: 'absolute',
    bottom: '-18px',
    left: '54px',
    fontSize: '10px',
    color: '#FFD700',
    fontStyle: 'italic',
    letterSpacing: '0.5px',
    opacity: 0.9
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
  },
  navProfileImage: {
    width: '35px',
    height: '35px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #FFD700',
    marginRight: '8px'
  },
  navProfilePlaceholder: {
    width: '35px',
    height: '35px',
    borderRadius: '50%',
    backgroundColor: '#FFD700',
    color: '#000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
    marginRight: '8px'
  }
};

// Add floating animation for clouds
const styleSheet = document.styleSheets[0];
const keyframes = `
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes sparkle {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}`;

if (styleSheet) {
  try {
    styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
  } catch (e) {
    // Animation already exists
  }
}

export default Navbar;
