import React from 'react';

const AboutUs = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>About CloudLiteracy</h1>
        
        <div style={styles.section}>
          <h2 style={styles.subtitle}>Our Mission</h2>
          <p style={styles.text}>
            CloudLiteracy is dedicated to empowering aspiring DevOps professionals with comprehensive, 
            accessible, and practical education. We bridge the gap between traditional IT knowledge and 
            modern cloud-native practices.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.subtitle}>Our Vision</h2>
          <p style={styles.text}>
            To become the leading platform for Pre-DevOps education in Africa and beyond, creating a 
            community of skilled professionals ready to tackle the challenges of modern infrastructure 
            and software delivery.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.subtitle}>What We Offer</h2>
          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.icon}>📚</span>
              <h3 style={styles.featureTitle}>Comprehensive Modules</h3>
              <p style={styles.featureText}>7 carefully crafted modules covering essential DevOps foundations</p>
            </div>
            <div style={styles.feature}>
              <span style={styles.icon}>🎥</span>
              <h3 style={styles.featureTitle}>Video Lessons</h3>
              <p style={styles.featureText}>High-quality video content with practical demonstrations</p>
            </div>
            <div style={styles.feature}>
              <span style={styles.icon}>✅</span>
              <h3 style={styles.featureTitle}>Interactive Quizzes</h3>
              <p style={styles.featureText}>Test your knowledge and track your progress</p>
            </div>
            <div style={styles.feature}>
              <span style={styles.icon}>💳</span>
              <h3 style={styles.featureTitle}>Flexible Payments</h3>
              <p style={styles.featureText}>Multiple payment options including mobile money</p>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.subtitle}>Why Choose Us?</h2>
          <ul style={styles.list}>
            <li style={styles.listItem}>✓ Affordable pricing tailored for African markets</li>
            <li style={styles.listItem}>✓ Self-paced learning that fits your schedule</li>
            <li style={styles.listItem}>✓ Practical, hands-on content from industry experts</li>
            <li style={styles.listItem}>✓ Lifetime access to purchased modules</li>
            <li style={styles.listItem}>✓ Regular content updates and improvements</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
    padding: '60px 20px'
  },
  content: {
    maxWidth: '1000px',
    margin: '0 auto'
  },
  title: {
    color: '#FFD700',
    fontSize: '48px',
    textAlign: 'center',
    marginBottom: '50px',
    fontWeight: 'bold'
  },
  section: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '15px',
    padding: '40px',
    marginBottom: '30px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
  },
  subtitle: {
    color: '#FFD700',
    fontSize: '28px',
    marginBottom: '20px',
    fontWeight: 'bold'
  },
  text: {
    color: '#ccc',
    fontSize: '18px',
    lineHeight: '1.8'
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  feature: {
    backgroundColor: '#0d0d0d',
    padding: '25px',
    borderRadius: '10px',
    border: '1px solid #333',
    textAlign: 'center'
  },
  icon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '15px'
  },
  featureTitle: {
    color: '#FFD700',
    fontSize: '18px',
    marginBottom: '10px',
    fontWeight: 'bold'
  },
  featureText: {
    color: '#999',
    fontSize: '14px',
    lineHeight: '1.6'
  },
  list: {
    listStyle: 'none',
    padding: 0,
    marginTop: '20px'
  },
  listItem: {
    color: '#ccc',
    fontSize: '18px',
    padding: '12px 0',
    borderBottom: '1px solid #333'
  }
};

export default AboutUs;
