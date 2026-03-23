import React, { useState, useEffect } from 'react';
import './CertificateModal.css';
import logo from '../assets/logo.svg';

const CertificateModal = ({ certificateId, onClose }) => {
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificate();
  }, [certificateId]);

  const fetchCertificate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/progress/certificate/${certificateId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCertificate(data.certificate);
      }
    } catch (error) {
      console.error('Failed to fetch certificate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const certificateElement = document.getElementById('certificate-content');
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate - ${certificate.certificateId}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .certificate { 
              width: 800px; 
              padding: 40px; 
              border: 10px solid #FFD700; 
              background: #fff;
              text-align: center;
            }
            .logo { width: 100px; margin-bottom: 20px; }
            h1 { color: #FFD700; font-size: 48px; margin: 20px 0; }
            h2 { color: #000; font-size: 32px; margin: 10px 0; }
            p { color: #333; font-size: 18px; margin: 10px 0; }
            .score { font-size: 36px; color: #FFD700; font-weight: bold; margin: 20px 0; }
            .qr-code { margin: 20px 0; }
            .cert-id { font-size: 12px; color: #666; margin-top: 20px; }
          </style>
        </head>
        <body>
          ${certificateElement.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (loading) {
    return (
      <div className="certificate-modal">
        <div className="certificate-content">
          <p>Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="certificate-modal">
        <div className="certificate-content">
          <p>Certificate not found</p>
          <button onClick={onClose} className="close-btn">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="certificate-modal">
      <div className="certificate-content">
        <div className="congrats-header">
          <h1>🎉 Congratulations! 🎉</h1>
          <p>You've successfully completed the module and earned your certificate!</p>
        </div>

        <div id="certificate-content" className="certificate">
          <img src={logo} alt="CloudLiteracy Logo" className="logo" />
          <h1>Certificate of Completion</h1>
          <p>This is to certify that</p>
          <h2>{certificate.userName}</h2>
          <p>has successfully completed</p>
          <h2>{certificate.moduleName}</h2>
          <p className="score">Score: {certificate.score}%</p>
          <p>Completed on: {new Date(certificate.completedDate).toLocaleDateString()}</p>
          {certificate.qrCode && (
            <div className="qr-code">
              <img src={certificate.qrCode} alt="Verification QR Code" />
              <p style={{ fontSize: '12px', color: '#666' }}>Scan to verify certificate</p>
            </div>
          )}
          <p className="cert-id">Certificate ID: {certificate.certificateId}</p>
        </div>

        <div className="certificate-actions">
          <button onClick={handleDownload} className="download-btn">
            📥 Download Certificate
          </button>
          <button onClick={onClose} className="close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
