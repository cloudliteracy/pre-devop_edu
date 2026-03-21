import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>☁️</span>
          CloudLiteracy
        </Link>
        <div style={styles.menu}>
          <Link to="/modules" style={styles.link}>
            Modules
          </Link>
          {isAuthenticated ? (
            <>
              <span style={styles.userName}>Hello, {user?.name}</span>
              <button onClick={logout} style={styles.logoutButton}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.link}>
                Login
              </Link>
              <Link to="/register" style={styles.registerButton}>
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
    gap: '10px'
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
    transition: 'color 0.3s'
  },
  userName: {
    color: '#ccc',
    fontSize: '15px'
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
  registerButton: {
    backgroundColor: '#FFD700',
    color: '#000',
    textDecoration: 'none',
    padding: '8px 20px',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 'bold',
    transition: 'all 0.3s'
  }
};

export default Navbar;
