import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { moduleAPI } from '../services/api';

const ModuleList = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const { data } = await moduleAPI.getAll();
        setModules(data);
      } catch (error) {
        console.error('Error fetching modules:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <p style={styles.loadingText}>Loading modules...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Pre-DevOps Learning Modules</h1>
        <p style={styles.subtitle}>Master the fundamentals before diving into DevOps</p>
      </div>
      
      <div style={styles.grid}>
        {modules.map((module) => (
          <div key={module._id} style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.moduleNumber}>Module {module.order}</span>
              <span style={styles.price}>${module.price}</span>
            </div>
            
            <h3 style={styles.moduleTitle}>{module.title}</h3>
            <p style={styles.description}>{module.description}</p>
            
            <div style={styles.cardFooter}>
              <Link to={`/module/${module._id}`} style={{ textDecoration: 'none' }}>
                <button style={styles.button}>
                  View Module →
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
    padding: '40px 20px'
  },
  loadingContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loader: {
    border: '4px solid #333',
    borderTop: '4px solid #FFD700',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    color: '#FFD700',
    marginTop: '20px',
    fontSize: '18px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '50px'
  },
  title: {
    color: '#FFD700',
    fontSize: '42px',
    fontWeight: 'bold',
    marginBottom: '15px',
    textShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
  },
  subtitle: {
    color: '#999',
    fontSize: '18px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '30px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  card: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '15px',
    padding: '25px',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  moduleNumber: {
    backgroundColor: '#FFD700',
    color: '#000',
    padding: '5px 15px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  price: {
    color: '#FFD700',
    fontSize: '24px',
    fontWeight: 'bold'
  },
  moduleTitle: {
    color: '#FFD700',
    fontSize: '22px',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  description: {
    color: '#ccc',
    fontSize: '15px',
    lineHeight: '1.6',
    marginBottom: '25px',
    minHeight: '60px'
  },
  cardFooter: {
    borderTop: '1px solid #333',
    paddingTop: '20px'
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  }
};

export default ModuleList;
