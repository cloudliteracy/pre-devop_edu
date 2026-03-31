import React, { useState, useContext } from 'react';

import axios from 'axios';
import { authAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const packages = [
  { id: 'Gold', name: 'Gold Partner', price: 1000, description: 'Enhance regional CSR drives.', icon: '🥇', color: '#FFD700' },
  { id: 'Platinum', name: 'Platinum Partner', price: 2000, description: 'Sponsor dedicated learning events.', icon: '💎', color: '#E5E4E2' },
  { id: 'Diamond', name: 'Diamond Partner', price: 5000, description: 'Global CSR campaign leadership.', icon: '👑', color: '#b9f2ff' }
];

const PartnerPackages = () => {
  const [selectedTier, setSelectedTier] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', country: '' });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useContext(AuthContext);

  const handleBuyClick = (tier) => {
    setSelectedTier(tier);
    setError('');
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text', 'cloudliteracy');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const text = e.dataTransfer.getData('text');
    if (text === 'cloudliteracy') {
      setCaptchaVerified(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const closeModal = () => {
    setSelectedTier(null);
    setError('');
  };

  const handleRegisterAndCheckout = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      if (!captchaVerified) {
        setError('Please complete the captcha verification');
        return;
      }
      if (!profilePhoto) {
        setError('Profile photo is required for new accounts.');
        return;
      }
    }

    setLoading(true);
    let token = localStorage.getItem('token');

    try {
      if (!isAuthenticated) {
        // Step 1: Register User
        const registrationData = new FormData();
        registrationData.append('name', formData.name);
        registrationData.append('email', formData.email);
        registrationData.append('password', formData.password);
        registrationData.append('country', formData.country);
        registrationData.append('profilePhoto', profilePhoto);

        const { data } = await authAPI.register(registrationData);
        login(data.token, data.user);
        token = data.token;
      }

      // Step 2: Initiate Payment via Stripe
      const paymentData = {
        paymentMethod: 'stripe',
        isPartnerPurchase: true,
        partnerTier: selectedTier.id
      };

      const response = await axios.post('http://localhost:5000/api/payments/initiate', paymentData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.url) {
        window.location.href = response.data.url;
      } else {
        setError('Failed to securely initiate checkout session.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration or Payment initiation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Become A Partner</h1>
        <p style={styles.subtitle}>
          Invest in our Corporate Social Responsibility (CSR) initiatives by becoming a tiered partner. 
          Your contributions grant you a lifetime Access Code and help shape the future of tech education!
        </p>
      </div>

      <div style={styles.grid}>
        {packages.map((pkg) => (
          <div key={pkg.id} style={{ ...styles.card, borderColor: pkg.color }}>
            <div style={styles.icon}>{pkg.icon}</div>
            <h2 style={{ ...styles.packageName, color: pkg.color }}>{pkg.name}</h2>
            <div style={styles.price}>${pkg.price}</div>
            <p style={styles.description}>{pkg.description}</p>
            <button 
              style={{ ...styles.buyButton, backgroundColor: pkg.color, color: '#000' }}
              onClick={() => handleBuyClick(pkg)}
            >
              Buy Package
            </button>
          </div>
        ))}
      </div>

      {selectedTier && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button onClick={closeModal} style={styles.closeButton}>×</button>
            <h2 style={styles.modalTitle}>Join as {selectedTier.name}</h2>
            <p style={styles.modalSubtitle}>Total: ${selectedTier.price}</p>
            
            {error && <p style={styles.error}>{error}</p>}

            <form onSubmit={handleRegisterAndCheckout} style={styles.form}>
              {!isAuthenticated && (
                <>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Email</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Country</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      required
                      style={styles.input}
                    >
                      <option value="">Select your country</option>
                      <option value="Afghanistan">Afghanistan</option>
                      <option value="Albania">Albania</option>
                      <option value="Algeria">Algeria</option>
                      <option value="Andorra">Andorra</option>
                      <option value="Angola">Angola</option>
                      <option value="Argentina">Argentina</option>
                      <option value="Armenia">Armenia</option>
                      <option value="Australia">Australia</option>
                      <option value="Austria">Austria</option>
                      <option value="Azerbaijan">Azerbaijan</option>
                      <option value="Bahamas">Bahamas</option>
                      <option value="Bahrain">Bahrain</option>
                      <option value="Bangladesh">Bangladesh</option>
                      <option value="Barbados">Barbados</option>
                      <option value="Belarus">Belarus</option>
                      <option value="Belgium">Belgium</option>
                      <option value="Belize">Belize</option>
                      <option value="Benin">Benin</option>
                      <option value="Bhutan">Bhutan</option>
                      <option value="Bolivia">Bolivia</option>
                      <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
                      <option value="Botswana">Botswana</option>
                      <option value="Brazil">Brazil</option>
                      <option value="Brunei">Brunei</option>
                      <option value="Bulgaria">Bulgaria</option>
                      <option value="Burkina Faso">Burkina Faso</option>
                      <option value="Burundi">Burundi</option>
                      <option value="Cambodia">Cambodia</option>
                      <option value="Cameroon">Cameroon</option>
                      <option value="Canada">Canada</option>
                      <option value="Cape Verde">Cape Verde</option>
                      <option value="Central African Republic">Central African Republic</option>
                      <option value="Chad">Chad</option>
                      <option value="Chile">Chile</option>
                      <option value="China">China</option>
                      <option value="Colombia">Colombia</option>
                      <option value="Comoros">Comoros</option>
                      <option value="Congo">Congo</option>
                      <option value="Costa Rica">Costa Rica</option>
                      <option value="Croatia">Croatia</option>
                      <option value="Cuba">Cuba</option>
                      <option value="Cyprus">Cyprus</option>
                      <option value="Czech Republic">Czech Republic</option>
                      <option value="Denmark">Denmark</option>
                      <option value="Djibouti">Djibouti</option>
                      <option value="Dominica">Dominica</option>
                      <option value="Dominican Republic">Dominican Republic</option>
                      <option value="Ecuador">Ecuador</option>
                      <option value="Egypt">Egypt</option>
                      <option value="El Salvador">El Salvador</option>
                      <option value="Equatorial Guinea">Equatorial Guinea</option>
                      <option value="Eritrea">Eritrea</option>
                      <option value="Estonia">Estonia</option>
                      <option value="Eswatini">Eswatini</option>
                      <option value="Ethiopia">Ethiopia</option>
                      <option value="Fiji">Fiji</option>
                      <option value="Finland">Finland</option>
                      <option value="France">France</option>
                      <option value="Gabon">Gabon</option>
                      <option value="Gambia">Gambia</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Germany">Germany</option>
                      <option value="Ghana">Ghana</option>
                      <option value="Greece">Greece</option>
                      <option value="Grenada">Grenada</option>
                      <option value="Guatemala">Guatemala</option>
                      <option value="Guinea">Guinea</option>
                      <option value="Guinea-Bissau">Guinea-Bissau</option>
                      <option value="Guyana">Guyana</option>
                      <option value="Haiti">Haiti</option>
                      <option value="Honduras">Honduras</option>
                      <option value="Hungary">Hungary</option>
                      <option value="Iceland">Iceland</option>
                      <option value="India">India</option>
                      <option value="Indonesia">Indonesia</option>
                      <option value="Iran">Iran</option>
                      <option value="Iraq">Iraq</option>
                      <option value="Ireland">Ireland</option>
                      <option value="Israel">Israel</option>
                      <option value="Italy">Italy</option>
                      <option value="Jamaica">Jamaica</option>
                      <option value="Japan">Japan</option>
                      <option value="Jordan">Jordan</option>
                      <option value="Kazakhstan">Kazakhstan</option>
                      <option value="Kenya">Kenya</option>
                      <option value="Kiribati">Kiribati</option>
                      <option value="Kuwait">Kuwait</option>
                      <option value="Kyrgyzstan">Kyrgyzstan</option>
                      <option value="Laos">Laos</option>
                      <option value="Latvia">Latvia</option>
                      <option value="Lebanon">Lebanon</option>
                      <option value="Lesotho">Lesotho</option>
                      <option value="Liberia">Liberia</option>
                      <option value="Libya">Libya</option>
                      <option value="Liechtenstein">Liechtenstein</option>
                      <option value="Lithuania">Lithuania</option>
                      <option value="Luxembourg">Luxembourg</option>
                      <option value="Madagascar">Madagascar</option>
                      <option value="Malawi">Malawi</option>
                      <option value="Malaysia">Malaysia</option>
                      <option value="Maldives">Maldives</option>
                      <option value="Mali">Mali</option>
                      <option value="Malta">Malta</option>
                      <option value="Marshall Islands">Marshall Islands</option>
                      <option value="Mauritania">Mauritania</option>
                      <option value="Mauritius">Mauritius</option>
                      <option value="Mexico">Mexico</option>
                      <option value="Micronesia">Micronesia</option>
                      <option value="Moldova">Moldova</option>
                      <option value="Monaco">Monaco</option>
                      <option value="Mongolia">Mongolia</option>
                      <option value="Montenegro">Montenegro</option>
                      <option value="Morocco">Morocco</option>
                      <option value="Mozambique">Mozambique</option>
                      <option value="Myanmar">Myanmar</option>
                      <option value="Namibia">Namibia</option>
                      <option value="Nauru">Nauru</option>
                      <option value="Nepal">Nepal</option>
                      <option value="Netherlands">Netherlands</option>
                      <option value="New Zealand">New Zealand</option>
                      <option value="Nicaragua">Nicaragua</option>
                      <option value="Niger">Niger</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="North Korea">North Korea</option>
                      <option value="North Macedonia">North Macedonia</option>
                      <option value="Norway">Norway</option>
                      <option value="Oman">Oman</option>
                      <option value="Pakistan">Pakistan</option>
                      <option value="Palau">Palau</option>
                      <option value="Palestine">Palestine</option>
                      <option value="Panama">Panama</option>
                      <option value="Papua New Guinea">Papua New Guinea</option>
                      <option value="Paraguay">Paraguay</option>
                      <option value="Peru">Peru</option>
                      <option value="Philippines">Philippines</option>
                      <option value="Poland">Poland</option>
                      <option value="Portugal">Portugal</option>
                      <option value="Qatar">Qatar</option>
                      <option value="Romania">Romania</option>
                      <option value="Russia">Russia</option>
                      <option value="Rwanda">Rwanda</option>
                      <option value="Saint Kitts and Nevis">Saint Kitts and Nevis</option>
                      <option value="Saint Lucia">Saint Lucia</option>
                      <option value="Saint Vincent and the Grenadines">Saint Vincent and the Grenadines</option>
                      <option value="Samoa">Samoa</option>
                      <option value="San Marino">San Marino</option>
                      <option value="Sao Tome and Principe">Sao Tome and Principe</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="Senegal">Senegal</option>
                      <option value="Serbia">Serbia</option>
                      <option value="Seychelles">Seychelles</option>
                      <option value="Sierra Leone">Sierra Leone</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Slovakia">Slovakia</option>
                      <option value="Slovenia">Slovenia</option>
                      <option value="Solomon Islands">Solomon Islands</option>
                      <option value="Somalia">Somalia</option>
                      <option value="South Africa">South Africa</option>
                      <option value="South Korea">South Korea</option>
                      <option value="South Sudan">South Sudan</option>
                      <option value="Spain">Spain</option>
                      <option value="Sri Lanka">Sri Lanka</option>
                      <option value="Sudan">Sudan</option>
                      <option value="Suriname">Suriname</option>
                      <option value="Sweden">Sweden</option>
                      <option value="Switzerland">Switzerland</option>
                      <option value="Syria">Syria</option>
                      <option value="Taiwan">Taiwan</option>
                      <option value="Tajikistan">Tajikistan</option>
                      <option value="Tanzania">Tanzania</option>
                      <option value="Thailand">Thailand</option>
                      <option value="Timor-Leste">Timor-Leste</option>
                      <option value="Togo">Togo</option>
                      <option value="Tonga">Tonga</option>
                      <option value="Trinidad and Tobago">Trinidad and Tobago</option>
                      <option value="Tunisia">Tunisia</option>
                      <option value="Turkey">Turkey</option>
                      <option value="Turkmenistan">Turkmenistan</option>
                      <option value="Tuvalu">Tuvalu</option>
                      <option value="Uganda">Uganda</option>
                      <option value="Ukraine">Ukraine</option>
                      <option value="United Arab Emirates">United Arab Emirates</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="United States">United States</option>
                      <option value="Uruguay">Uruguay</option>
                      <option value="Uzbekistan">Uzbekistan</option>
                      <option value="Vanuatu">Vanuatu</option>
                      <option value="Vatican City">Vatican City</option>
                      <option value="Venezuela">Venezuela</option>
                      <option value="Vietnam">Vietnam</option>
                      <option value="Yemen">Yemen</option>
                      <option value="Zambia">Zambia</option>
                      <option value="Zimbabwe">Zimbabwe</option>
                    </select>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Password</label>
                    <div style={styles.passwordContainer}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        style={styles.passwordInput}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                      >
                        {showPassword ? '👁️' : '👁️🗨️'}
                      </button>
                    </div>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Profile Photo *</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProfilePhoto(e.target.files[0])}
                      required
                      style={styles.fileInput}
                    />
                    {profilePhoto && (
                      <div style={styles.filePreview}>
                        <img src={URL.createObjectURL(profilePhoto)} alt="Preview" style={styles.imagePreview} />
                        <span style={{ color: '#ccc', marginLeft: '10px' }}>Selected: {profilePhoto.name}</span>
                      </div>
                    )}
                  </div>

                  <div style={styles.captchaContainer}>
                    <p style={styles.captchaLabel}>Verify you're human:</p>
                    <div style={styles.captchaBox}>
                      <div
                        draggable
                        onDragStart={handleDragStart}
                        style={styles.draggableText}
                      >
                        cloudliteracy
                      </div>
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        style={{
                          ...styles.dropZone,
                          backgroundColor: captchaVerified ? '#2d5016' : '#1a1a1a',
                          border: captchaVerified ? '2px solid #FFD700' : '2px dashed #FFD700'
                        }}
                      >
                        {captchaVerified ? '✓ Verified' : 'Drag "cloudliteracy" here'}
                      </div>
                    </div>
                  </div>

                </>
              )}
              {isAuthenticated && (
                <p style={{ color: '#ccc', marginBottom: '20px', textAlign: 'center' }}>
                  You are already logged in. Proceeding will instantly forward you to the secure checkout!
                </p>
              )}

              <button type="submit" style={styles.submitButton} disabled={loading}>
                {loading ? 'Processing...' : 'Submit & Pay via Stripe'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    padding: '60px 20px',
    backgroundColor: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  header: {
    textAlign: 'center',
    maxWidth: '800px',
    marginBottom: '60px'
  },
  title: {
    color: '#FFD700',
    fontSize: '48px',
    marginBottom: '20px'
  },
  subtitle: {
    color: '#ccc',
    fontSize: '20px',
    lineHeight: '1.6'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '30px',
    width: '100%',
    maxWidth: '1200px'
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: '15px',
    padding: '40px 30px',
    textAlign: 'center',
    border: '2px solid',
    transition: 'transform 0.3s, box-shadow 0.3s',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  icon: {
    fontSize: '60px',
    marginBottom: '20px'
  },
  packageName: {
    fontSize: '28px',
    marginBottom: '10px'
  },
  price: {
    color: '#fff',
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '20px'
  },
  description: {
    color: '#aaa',
    fontSize: '16px',
    marginBottom: '30px',
    minHeight: '48px'
  },
  buyButton: {
    padding: '15px 30px',
    fontSize: '18px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    transition: 'opacity 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start', // Changed from center for better scrolling
    zIndex: 1000,
    padding: '40px 20px',
    overflowY: 'auto' // Ensure scrolling for long forms
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    padding: '40px',
    borderRadius: '15px',
    width: '100%',
    maxWidth: '500px',
    position: 'relative',
    border: '1px solid #FFD700', // Highlighted border
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.2)',
    margin: 'auto 0' // Vertically center if possible, but allow flex-start to work
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: '#333',
    border: '2px solid #FFD700',
    color: '#FFD700',
    width: '35px',
    height: '35px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    zIndex: 1001
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: '28px',
    marginBottom: '10px',
    textAlign: 'center'
  },
  modalSubtitle: {
    color: '#ccc',
    fontSize: '20px',
    marginBottom: '30px',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    color: '#ccc',
    fontSize: '14px'
  },
  input: {
    padding: '15px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box'
  },
  passwordContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  passwordInput: {
    width: '100%',
    padding: '15px',
    paddingRight: '45px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  eyeButton: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    padding: '5px'
  },
  fileInput: {
    padding: '10px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff'
  },
  submitButton: {
    padding: '16px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px'
  },
  error: {
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: '20px'
  },
  captchaContainer: {
    marginBottom: '20px'
  },
  captchaLabel: {
    color: '#ccc',
    marginBottom: '8px',
    fontSize: '14px'
  },
  captchaBox: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  draggableText: {
    backgroundColor: '#FFD700',
    color: '#000',
    padding: '8px 15px',
    borderRadius: '6px',
    cursor: 'move',
    fontWeight: 'bold',
    userSelect: 'none',
    fontSize: '14px'
  },
  dropZone: {
    flex: 1,
    padding: '10px',
    borderRadius: '6px',
    textAlign: 'center',
    color: '#FFD700',
    fontSize: '14px',
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  filePreview: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '10px',
    padding: '8px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px'
  },
  imagePreview: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid #FFD700'
  }
};

export default PartnerPackages;
