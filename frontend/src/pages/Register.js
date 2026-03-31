import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', country: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [draggedText, setDraggedText] = useState('');
  const [csrCode, setCsrCode] = useState('');
  const [isCsrRegistration, setIsCsrRegistration] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const csr = params.get('csr');
    const code = params.get('code');
    const ref = params.get('ref');
    
    if (csr === 'true' && code) {
      setIsCsrRegistration(true);
      setCsrCode(code);
    }
    
    // Capture referral code from URL and store in localStorage
    if (ref) {
      setReferralCode(ref);
      localStorage.setItem('referralCode', ref);
    }
  }, [location]);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text', 'cloudliteracy');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const text = e.dataTransfer.getData('text');
    if (text === 'cloudliteracy') {
      setDraggedText(text);
      setCaptchaVerified(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaVerified) {
      setError('Please complete the captcha verification');
      return;
    }
    if (!profilePhoto) {
      setError('Profile photo is required');
      return;
    }
    try {
      const registrationData = new FormData();
      registrationData.append('name', formData.name);
      registrationData.append('email', formData.email);
      registrationData.append('password', formData.password);
      registrationData.append('country', formData.country);
      if (isCsrRegistration && csrCode) {
        registrationData.append('csrCode', csrCode);
      }
      if (profilePhoto) {
        registrationData.append('profilePhoto', profilePhoto);
      }
      
      const { data } = await authAPI.register(registrationData);
      login(data.token, data.user);
      
      if (data.message) {
        alert(data.message);
      }
      
      // Keep referral code in localStorage for payment
      // It will be used when user makes first purchase
      
      navigate('/modules');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h2 style={styles.title}>{isCsrRegistration ? '🎓 CSR Registration' : 'Join CloudLiteracy'}</h2>
        {isCsrRegistration && (
          <div style={styles.csrBanner}>
            <p>✓ CSR Access Code Verified</p>
            <p>You will get FREE access to all modules!</p>
          </div>
        )}
        {referralCode && (
          <div style={styles.referralBanner}>
            <p>🎉 Referral Code Applied: <strong>{referralCode}</strong></p>
            <p>You'll get 10% discount on your first purchase!</p>
          </div>
        )}
        {error && <p style={styles.error}>{error}</p>}
        
        <form onSubmit={handleSubmit}>
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
              onChange={(e) => {
                const file = e.target.files[0];
                if (file && file.size > 5 * 1024 * 1024) {
                  alert('File size must be less than 5MB');
                  return;
                }
                setProfilePhoto(file);
              }}
              style={styles.fileInput}
            />
            {profilePhoto && (
              <div style={styles.filePreview}>
                <img src={URL.createObjectURL(profilePhoto)} alt="Preview" style={styles.imagePreview} />
                <span>Selected: {profilePhoto.name}</span>
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

          <button type="submit" style={styles.submitButton}>
            Create Account
          </button>
        </form>
        
        <p style={styles.footer}>
          Already have an account? <Link to="/login" style={styles.link}>Login</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  },
  formCard: {
    backgroundColor: '#1a1a1a',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 8px 32px rgba(255, 215, 0, 0.2)',
    border: '1px solid #FFD700',
    maxWidth: '450px',
    width: '100%'
  },
  title: {
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '28px',
    fontWeight: 'bold'
  },
  error: {
    color: '#ff4444',
    backgroundColor: '#2d1a1a',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  csrBanner: {
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))',
    border: '2px solid #FFD700',
    borderRadius: '10px',
    padding: '15px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  referralBanner: {
    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1))',
    border: '2px solid #4CAF50',
    borderRadius: '10px',
    padding: '15px',
    marginBottom: '20px',
    textAlign: 'center',
    color: '#4CAF50'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    color: '#FFD700',
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    transition: 'border 0.3s',
    boxSizing: 'border-box'
  },
  passwordContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  passwordInput: {
    width: '100%',
    padding: '12px',
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
    width: '100%',
    color: '#ccc',
    padding: '10px 0'
  },
  filePreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#FFD700',
    fontSize: '14px'
  },
  imagePreview: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #FFD700'
  },
  captchaContainer: {
    marginBottom: '25px'
  },
  captchaLabel: {
    color: '#FFD700',
    marginBottom: '10px',
    fontSize: '14px'
  },
  captchaBox: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  draggableText: {
    backgroundColor: '#FFD700',
    color: '#000',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'move',
    fontWeight: 'bold',
    userSelect: 'none'
  },
  dropZone: {
    flex: 1,
    minWidth: '200px',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#FFD700',
    fontSize: '14px',
    minHeight: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginBottom: '15px'
  },
  link: {
    color: '#FFD700',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'color 0.3s'
  },
  footer: {
    textAlign: 'center',
    color: '#999',
    fontSize: '14px'
  }
};

export default Register;
