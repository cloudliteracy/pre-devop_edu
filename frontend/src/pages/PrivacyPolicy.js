import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Privacy Policy</h1>
        <p style={styles.lastUpdated}>Last Updated: January 2025</p>

        <div style={styles.section}>
          <h2 style={styles.subtitle}>1. Information We Collect</h2>
          <p style={styles.text}>
            We collect information you provide directly to us, including your name, email address, 
            payment information, and learning progress data. We also collect information about your 
            device and how you interact with our platform.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.subtitle}>2. How We Use Your Information</h2>
          <p style={styles.text}>
            We use the information we collect to:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Provide, maintain, and improve our services</li>
            <li style={styles.listItem}>Process your payments and transactions</li>
            <li style={styles.listItem}>Send you technical notices and support messages</li>
            <li style={styles.listItem}>Track your learning progress and quiz scores</li>
            <li style={styles.listItem}>Respond to your comments and questions</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.subtitle}>3. Information Sharing</h2>
          <p style={styles.text}>
            We do not sell, trade, or rent your personal information to third parties. We may share 
            your information with payment processors (Stripe, PayPal, MTN, Orange) to complete 
            transactions, and with service providers who assist in operating our platform.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.subtitle}>4. Data Security</h2>
          <p style={styles.text}>
            We implement appropriate security measures to protect your personal information. However, 
            no method of transmission over the Internet is 100% secure, and we cannot guarantee 
            absolute security.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.subtitle}>5. Your Rights</h2>
          <p style={styles.text}>
            You have the right to access, update, or delete your personal information. You can do 
            this by contacting us at support@cloudliteracy.com. You also have the right to opt-out 
            of marketing communications.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.subtitle}>6. Cookies</h2>
          <p style={styles.text}>
            We use cookies and similar tracking technologies to track activity on our platform and 
            store certain information. You can instruct your browser to refuse all cookies or to 
            indicate when a cookie is being sent.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.subtitle}>7. Children's Privacy</h2>
          <p style={styles.text}>
            Our service is not intended for children under 13 years of age. We do not knowingly 
            collect personal information from children under 13.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.subtitle}>8. Changes to This Policy</h2>
          <p style={styles.text}>
            We may update our Privacy Policy from time to time. We will notify you of any changes 
            by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.subtitle}>9. Contact Us</h2>
          <p style={styles.text}>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p style={styles.contactInfo}>
            Email: support@cloudliteracy.com<br />
            Address: Cameroon, Africa
          </p>
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
    maxWidth: '900px',
    margin: '0 auto'
  },
  title: {
    color: '#FFD700',
    fontSize: '48px',
    textAlign: 'center',
    marginBottom: '10px',
    fontWeight: 'bold'
  },
  lastUpdated: {
    color: '#999',
    fontSize: '16px',
    textAlign: 'center',
    marginBottom: '50px'
  },
  section: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '15px',
    padding: '30px',
    marginBottom: '25px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
  },
  subtitle: {
    color: '#FFD700',
    fontSize: '24px',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  text: {
    color: '#ccc',
    fontSize: '16px',
    lineHeight: '1.8',
    marginBottom: '10px'
  },
  list: {
    color: '#ccc',
    fontSize: '16px',
    lineHeight: '1.8',
    marginLeft: '20px',
    marginTop: '10px'
  },
  listItem: {
    marginBottom: '8px'
  },
  contactInfo: {
    color: '#FFD700',
    fontSize: '16px',
    lineHeight: '1.8',
    marginTop: '15px'
  }
};

export default PrivacyPolicy;
