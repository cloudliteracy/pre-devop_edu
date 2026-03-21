import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { moduleAPI, paymentAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import ProgressBar from '../components/ProgressBar';
import axios from 'axios';

const ModuleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);
  const [totals, setTotals] = useState({ videos: 0, pdfs: 0, hasQuiz: false });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchModule = async () => {
      try {
        // Try to fetch module details (will succeed if purchased)
        const { data } = await moduleAPI.getById(id);
        setModule(data);
        setHasAccess(true);
        await fetchProgress();
      } catch (error) {
        // If 403, user hasn't purchased - fetch basic info from list
        if (error.response?.status === 403) {
          try {
            const { data: modules } = await moduleAPI.getAll();
            const foundModule = modules.find(m => m._id === id);
            setModule(foundModule);
            setHasAccess(false);
          } catch (err) {
            setError('Module not found');
          }
        } else {
          setError('Error loading module');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchModule();
  }, [id, isAuthenticated, navigate]);

  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:5000/api/progress/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProgress(data.progress);
      setTotals(data.totals);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

  const trackProgress = async (type, itemId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/progress/track', {
        moduleId: id,
        type,
        itemId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchProgress();
    } catch (error) {
      console.error('Failed to track progress:', error);
    }
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    if ((paymentMethod === 'mtn_momo' || paymentMethod === 'orange_money') && !phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const { data } = await paymentAPI.initiate({
        moduleId: id,
        paymentMethod,
        phoneNumber
      });

      if ((paymentMethod === 'stripe' || paymentMethod === 'paypal') && data.url) {
        // Redirect to Stripe or PayPal checkout
        window.location.href = data.url;
      } else {
        alert('Payment initiated: ' + JSON.stringify(data));
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <p style={styles.loadingText}>Loading module...</p>
      </div>
    );
  }

  if (!module) {
    return (
      <div style={styles.errorContainer}>
        <h2 style={styles.errorTitle}>Module Not Found</h2>
        <button onClick={() => navigate('/modules')} style={styles.backButton}>
          ← Back to Modules
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Module Info Section */}
        <div style={styles.moduleCard}>
          <div style={styles.moduleHeader}>
            <span style={styles.moduleNumber}>Module {module.order}</span>
            <span style={styles.price}>${module.price}</span>
          </div>
          
          <h1 style={styles.title}>{module.title}</h1>
          <p style={styles.description}>{module.description}</p>

          <div style={styles.contentInfo}>
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>📄</span>
              <span style={styles.infoText}>{module.pdfs?.length || 0} PDF Resources</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>🎥</span>
              <span style={styles.infoText}>{module.videos?.length || 0} Video Lessons</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>✅</span>
              <span style={styles.infoText}>{module.quiz?.questions?.length || 0} Quiz Questions</span>
            </div>
          </div>
        </div>

        {/* Show Payment Section if user doesn't have access */}
        {!hasAccess && (
          <div style={styles.paymentCard}>
            <h2 style={styles.paymentTitle}>Select Payment Method</h2>
            <p style={styles.paymentSubtitle}>Choose your preferred payment option to unlock this module</p>

            {error && <div style={styles.errorMessage}>{error}</div>}

            <div style={styles.paymentMethods}>
            {/* MTN Mobile Money */}
            <div
              onClick={() => setPaymentMethod('mtn_momo')}
              style={{
                ...styles.paymentOption,
                border: paymentMethod === 'mtn_momo' ? '2px solid #FFD700' : '1px solid #333',
                backgroundColor: paymentMethod === 'mtn_momo' ? '#2d2d1a' : '#1a1a1a'
              }}
            >
              <div style={styles.mtnLogo}>
                <span style={styles.mtnText}>MTN</span>
              </div>
              <div>
                <div style={styles.paymentName}>MTN Mobile Money</div>
                <div style={styles.paymentDesc}>Pay with MTN MoMo Cameroon</div>
              </div>
              {paymentMethod === 'mtn_momo' && <span style={styles.checkmark}>✓</span>}
            </div>

            {/* Orange Money */}
            <div
              onClick={() => setPaymentMethod('orange_money')}
              style={{
                ...styles.paymentOption,
                border: paymentMethod === 'orange_money' ? '2px solid #FFD700' : '1px solid #333',
                backgroundColor: paymentMethod === 'orange_money' ? '#2d2d1a' : '#1a1a1a'
              }}
            >
              <div style={styles.orangeLogo}>
                <span style={styles.orangeText}>Orange</span>
              </div>
              <div>
                <div style={styles.paymentName}>Orange Money</div>
                <div style={styles.paymentDesc}>Pay with Orange Money Cameroon</div>
              </div>
              {paymentMethod === 'orange_money' && <span style={styles.checkmark}>✓</span>}
            </div>

            {/* Visa/Mastercard */}
            <div
              onClick={() => setPaymentMethod('stripe')}
              style={{
                ...styles.paymentOption,
                border: paymentMethod === 'stripe' ? '2px solid #FFD700' : '1px solid #333',
                backgroundColor: paymentMethod === 'stripe' ? '#2d2d1a' : '#1a1a1a'
              }}
            >
              <div style={styles.cardLogosContainer}>
                <div style={styles.visaLogo}>VISA</div>
                <div style={styles.mastercardContainer}>
                  <div style={styles.mcCircleRed}></div>
                  <div style={styles.mcCircleYellow}></div>
                </div>
              </div>
              <div>
                <div style={styles.paymentName}>Visa / Mastercard</div>
                <div style={styles.paymentDesc}>Pay with credit/debit card</div>
              </div>
              {paymentMethod === 'stripe' && <span style={styles.checkmark}>✓</span>}
            </div>

            {/* PayPal */}
            <div
              onClick={() => setPaymentMethod('paypal')}
              style={{
                ...styles.paymentOption,
                border: paymentMethod === 'paypal' ? '2px solid #FFD700' : '1px solid #333',
                backgroundColor: paymentMethod === 'paypal' ? '#2d2d1a' : '#1a1a1a'
              }}
            >
              <div style={styles.paypalLogo}>
                <span style={styles.paypalText}>PayPal</span>
              </div>
              <div>
                <div style={styles.paymentName}>PayPal</div>
                <div style={styles.paymentDesc}>Pay with PayPal account</div>
              </div>
              {paymentMethod === 'paypal' && <span style={styles.checkmark}>✓</span>}
            </div>
          </div>

          {/* Phone Number Input for Mobile Money */}
          {(paymentMethod === 'mtn_momo' || paymentMethod === 'orange_money') && (
            <div style={styles.phoneInputContainer}>
              <label style={styles.phoneLabel}>Phone Number</label>
              <input
                type="tel"
                placeholder="e.g., 237XXXXXXXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={styles.phoneInput}
              />
            </div>
          )}

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={!paymentMethod || processing}
            style={{
              ...styles.payButton,
              opacity: !paymentMethod || processing ? 0.5 : 1,
              cursor: !paymentMethod || processing ? 'not-allowed' : 'pointer'
            }}
          >
            {processing ? 'Processing...' : `Pay $${module.price} Now`}
          </button>

          <div style={styles.secureNote}>
            🔒 Secure payment powered by industry-leading providers
          </div>
        </div>
        )}

        {/* Show Module Content if user has access */}
        {hasAccess && (
          <>
            {/* Progress Bar */}
            {progress && <ProgressBar progress={progress} totals={totals} />}

            <div style={styles.contentCard}>
              <div style={styles.accessBadge}>
                ✓ You have access to this module
              </div>

              {/* PDFs Section */}
              {module.pdfs && module.pdfs.length > 0 && (
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>📄 PDF Resources</h3>
                  <div style={styles.resourceList}>
                    {module.pdfs.map((pdf, index) => (
                      <div key={index} style={styles.resourceItem}>
                        <span style={styles.resourceName}>{pdf.title || `PDF ${index + 1}`}</span>
                        <a 
                          href={`http://localhost:5000/${pdf.path}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={styles.downloadButton}
                          onClick={() => trackProgress('pdf', pdf._id || `pdf-${index}`)}
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos Section */}
              {module.videos && module.videos.length > 0 && (
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>🎥 Video Lessons</h3>
                  <div style={styles.resourceList}>
                    {module.videos.map((video, index) => (
                      <div key={index} style={styles.resourceItem}>
                        <span style={styles.resourceName}>{video.title || `Video ${index + 1}`}</span>
                        <span style={styles.duration}>{video.duration || 'N/A'}</span>
                        <a 
                          href={`http://localhost:5000/${video.path}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={styles.downloadButton}
                          onClick={() => trackProgress('video', video._id || `video-${index}`)}
                        >
                          Watch
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Quiz Section */}
            {module.quiz && module.quiz.questions && module.quiz.questions.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>✅ Quiz</h3>
                <p style={styles.quizInfo}>
                  {module.quiz.questions.length} questions | Passing score: {module.quiz.passingScore}%
                </p>
                <button style={styles.quizButton}>
                  Start Quiz
                </button>
              </div>
            )}

            {/* Empty State */}
            {(!module.pdfs || module.pdfs.length === 0) && 
             (!module.videos || module.videos.length === 0) && 
             (!module.quiz || !module.quiz.questions || module.quiz.questions.length === 0) && (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>
                  🚧 Content is being prepared. Check back soon!
                </p>
              </div>
            )}
          </div>
        )}
      </>
        )}
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
  errorContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorTitle: {
    color: '#FFD700',
    marginBottom: '20px'
  },
  backButton: {
    padding: '12px 30px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  content: {
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'grid',
    gap: '30px'
  },
  moduleCard: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '15px',
    padding: '30px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
  },
  moduleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  moduleNumber: {
    backgroundColor: '#FFD700',
    color: '#000',
    padding: '8px 20px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  price: {
    color: '#FFD700',
    fontSize: '32px',
    fontWeight: 'bold'
  },
  title: {
    color: '#FFD700',
    fontSize: '32px',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  description: {
    color: '#ccc',
    fontSize: '18px',
    lineHeight: '1.6',
    marginBottom: '30px'
  },
  contentInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#0d0d0d',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid #333'
  },
  infoIcon: {
    fontSize: '24px'
  },
  infoText: {
    color: '#999',
    fontSize: '14px'
  },
  paymentCard: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #FFD700',
    borderRadius: '15px',
    padding: '30px',
    boxShadow: '0 8px 32px rgba(255, 215, 0, 0.2)'
  },
  paymentTitle: {
    color: '#FFD700',
    fontSize: '28px',
    marginBottom: '10px',
    fontWeight: 'bold'
  },
  paymentSubtitle: {
    color: '#999',
    fontSize: '16px',
    marginBottom: '30px'
  },
  errorMessage: {
    backgroundColor: '#2d1a1a',
    color: '#ff4444',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  paymentMethods: {
    display: 'grid',
    gap: '15px',
    marginBottom: '25px'
  },
  paymentOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '20px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    position: 'relative'
  },
  mtnLogo: {
    width: '60px',
    height: '60px',
    backgroundColor: '#FFCC00',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    boxShadow: '0 2px 8px rgba(255, 204, 0, 0.3)'
  },
  mtnText: {
    color: '#000',
    fontSize: '20px',
    fontWeight: 'bold',
    letterSpacing: '1px'
  },
  orangeLogo: {
    width: '60px',
    height: '60px',
    background: 'linear-gradient(135deg, #FF6600 0%, #FF8800 100%)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(255, 102, 0, 0.3)'
  },
  orangeText: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  cardLogosContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'center',
    justifyContent: 'center'
  },
  visaLogo: {
    backgroundColor: '#1A1F71',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    fontStyle: 'italic'
  },
  mastercardContainer: {
    position: 'relative',
    width: '50px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mcCircleRed: {
    position: 'absolute',
    left: '0',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#EB001B',
    opacity: 0.9
  },
  mcCircleYellow: {
    position: 'absolute',
    right: '0',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#F79E1B',
    opacity: 0.9
  },
  paypalLogo: {
    width: '60px',
    height: '60px',
    background: 'linear-gradient(135deg, #003087 0%, #0070BA 100%)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0, 112, 186, 0.3)'
  },
  paypalText: {
    color: '#fff',
    fontSize: '13px',
    fontWeight: 'bold'
  },
  paymentName: {
    color: '#FFD700',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  paymentDesc: {
    color: '#999',
    fontSize: '14px'
  },
  checkmark: {
    position: 'absolute',
    right: '20px',
    color: '#FFD700',
    fontSize: '24px',
    fontWeight: 'bold'
  },
  phoneInputContainer: {
    marginBottom: '25px'
  },
  phoneLabel: {
    color: '#FFD700',
    display: 'block',
    marginBottom: '10px',
    fontSize: '16px',
    fontWeight: '500'
  },
  phoneInput: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  payButton: {
    width: '100%',
    padding: '18px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '15px',
    transition: 'all 0.3s'
  },
  secureNote: {
    textAlign: 'center',
    color: '#999',
    fontSize: '14px'
  },
  contentCard: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #4CAF50',
    borderRadius: '15px',
    padding: '30px',
    boxShadow: '0 4px 15px rgba(76, 175, 80, 0.2)'
  },
  accessBadge: {
    backgroundColor: '#2d5016',
    color: '#4CAF50',
    padding: '12px 20px',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '30px',
    border: '1px solid #4CAF50'
  },
  section: {
    marginBottom: '35px'
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: '24px',
    marginBottom: '20px',
    fontWeight: 'bold'
  },
  resourceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  resourceItem: {
    backgroundColor: '#0d0d0d',
    padding: '15px 20px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #333'
  },
  resourceName: {
    color: '#ccc',
    fontSize: '16px',
    flex: 1
  },
  duration: {
    color: '#999',
    fontSize: '14px',
    marginRight: '15px'
  },
  downloadButton: {
    backgroundColor: '#FFD700',
    color: '#000',
    padding: '8px 20px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s'
  },
  quizInfo: {
    color: '#999',
    fontSize: '16px',
    marginBottom: '20px'
  },
  quizButton: {
    backgroundColor: '#FFD700',
    color: '#000',
    padding: '15px 40px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  emptyText: {
    color: '#999',
    fontSize: '18px'
  }
};

export default ModuleDetail;
