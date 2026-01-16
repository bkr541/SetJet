import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  LogIn, 
  UserPlus,
  ArrowRight,
  Sparkles,
  LogInIcon,
  Calendar,
  AtSign,
  Check,
  UserRoundPlus,
  UserRound,
  X,
  UserRoundPlusIcon
} from 'lucide-react';
import './LoginSignup.css';

function LoginSignup({ onLogin, onDemoLogin, onSignupSuccess }) {
  const [mode, setMode] = useState('login'); 
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    dob: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  
  // State for password strength
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    criteria: {
      hasUpper: false,
      hasNumber: false,
      hasSpecial: false,
      noName: true
    }
  });

  // Calculate password strength whenever password or name changes
  useEffect(() => {
    if (mode === 'signup') {
      const { password, name } = formData;
      
      // Check for sequential characters from name in password
      let hasNameSequence = false;
      
      // Only check if name has enough characters to form a sequence > 4 (i.e., 5+)
      if (name && name.length >= 5) {
        const lowerName = name.toLowerCase();
        const lowerPass = password.toLowerCase();
        
        // Iterate through name to find any 5-character substring
        for (let i = 0; i <= lowerName.length - 5; i++) {
          const sequence = lowerName.substring(i, i + 5);
          // If the password contains this 5-char sequence
          if (lowerPass.includes(sequence)) {
            hasNameSequence = true;
            break;
          }
        }
      }

      const criteria = {
        hasUpper: /[A-Z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        // Pass if no sequence was found
        noName: !hasNameSequence 
      };

      // Calculate score (0 to 4)
      let score = 0;
      if (criteria.hasUpper) score++;
      if (criteria.hasNumber) score++;
      if (criteria.hasSpecial) score++;
      if (criteria.noName && password.length > 0) score++; 

      setPasswordStrength({ score, criteria });
    }
  }, [formData.password, formData.name, mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'dob') {
      // 1. Strip non-numeric characters to get raw numbers
      const numericValue = value.replace(/\D/g, '');

      // 2. Limit to 8 digits (MMDDYYYY)
      if (numericValue.length > 8) return;

      // 3. Apply mask logic (MM/DD/YYYY)
      let formattedValue = numericValue;
      if (numericValue.length > 2) {
        formattedValue = `${numericValue.slice(0, 2)}/${numericValue.slice(2)}`;
      }
      if (numericValue.length > 4) {
        formattedValue = `${formattedValue.slice(0, 5)}/${numericValue.slice(4)}`;
      }

      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFocus = (field) => setFocusedField(field);
  const handleBlur = () => setFocusedField(null);

  // Helper to determine Icon styling based on state
  const getIconProps = (fieldName) => {
    const isFocused = focusedField === fieldName;
    const hasValue = formData[fieldName] && formData[fieldName].length > 0;
    const hasError = !!errors[fieldName]; 

    // Priority 1: Error State (Red)
    if (hasError) {
        return { color: '#FF2C2C', fill: 'none' };
    }

    // Priority 2: Focus State (Teal)
    if (isFocused) {
      return { color: '#0096a6', fill: 'none' };
    }

    // Priority 3: Valid Value (Dark Teal)
    if (hasValue) {
      return { color: '#004e5a', fill: 'none' }; 
    }

    // Default (Dark Grey)
    return { color: '#161616', fill: 'none' };
  };

  const validate = () => {
    let tempErrors = {};
    let isValid = true;

    if (mode === 'login') {
      if (!formData.email) { tempErrors.email = "Email is required"; isValid = false; }
      if (!formData.password) { tempErrors.password = "Password is required"; isValid = false; }
    }

    if (mode === 'signup') {
      if (!formData.name) { tempErrors.name = "Full Name is required"; isValid = false; }
      if (!formData.username) { tempErrors.username = "Username is required"; isValid = false; }
      
      // --- DATE OF BIRTH VALIDATION ---
      if (!formData.dob) { 
        tempErrors.dob = "Date of Birth is required"; 
        isValid = false; 
      } else if (formData.dob.length < 10) {
        // Check for complete format
        tempErrors.dob = "Enter a valid date (mm/dd/yyyy)"; 
        isValid = false;
      } else {
        const parts = formData.dob.split('/');
        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        // 1. Check strict ranges
        if (month < 1 || month > 12) {
          tempErrors.dob = "Invalid month";
          isValid = false;
        } else if (day < 1 || day > 31) {
          tempErrors.dob = "Invalid day";
          isValid = false;
        } else {
          // 2. Check strict date validity using JS Date rollover behavior
          const dobDate = new Date(year, month - 1, day);
          
          if (dobDate.getMonth() !== month - 1 || dobDate.getDate() !== day) {
             tempErrors.dob = "Invalid date provided";
             isValid = false;
          } else {
            // 3. Future Check
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison

            if (dobDate > today) {
              tempErrors.dob = "Date cannot be in the future";
              isValid = false;
            }
          }
        }
      }

      if (!formData.email) { tempErrors.email = "Email is required"; isValid = false; }
      if (!formData.password) { tempErrors.password = "Password is required"; isValid = false; }
      if (!formData.confirmPassword) { tempErrors.confirmPassword = "Confirm Password is required"; isValid = false; }
      
      if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
        tempErrors.password = "Passwords do not match";
        isValid = false;
      }

      // Password Strength Validation on Submit
      if (formData.password) {
        if (!passwordStrength.criteria.noName) {
            tempErrors.password = "Password cannot contain part of your name";
            isValid = false;
        } else if (passwordStrength.score < 4) {
            tempErrors.password = "Password is not strong enough";
            isValid = false;
        }
      }
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      
      const payload = new FormData();
      payload.append('email', formData.email);
      payload.append('password', formData.password);

      if (mode === 'signup') {
        payload.append('name', formData.name);
        payload.append('username', formData.username);
        payload.append('dob', formData.dob);
      }

      const endpoint = mode === 'signup' 
        ? 'http://127.0.0.1:5001/api/signup' 
        : 'http://127.0.0.1:5001/api/login';

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: payload, 
        });

        const result = await response.json();

        if (response.ok) {
          if (mode === 'signup') {
            if (onSignupSuccess) onSignupSuccess(); 
          } else {
            // --- LOGIN SUCCESS LOGIC ---
            console.log('Login successful. Onboarding complete?', result.onboarding_complete);
            
            // Check onboarding status
            if (result.onboarding_complete === 'No') {
              // Redirect to Onboarding Flow
              if (onSignupSuccess) onSignupSuccess(); 
            } else {
              // Redirect to Flight Search / Dashboard
              if (onLogin) onLogin(); 
            }
          }
        } else {
          alert(result.error || 'An error occurred');
        }
      } catch (error) {
        console.error('Connection Error:', error);
        alert('Failed to connect to the server.');
      }
    }
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setErrors({});
    setFocusedField(null);
    setFormData({ name: '', username: '', dob: '', email: '', password: '', confirmPassword: '' });
  };

  // Helper to determine strength bar colors
  const getStrengthColor = () => {
    const { score } = passwordStrength;
    if (score < 2) return '#FF2C2C'; // Red (Weak)
    if (score < 4) return '#FFB800'; // Yellow (Average)
    return '#10b981'; // Green (Strong)
  };

  // Helper to render strength bars
  const renderStrengthBars = () => {
    const { score } = passwordStrength;
    let filledBars = 0;
    
    if (formData.password.length > 0) {
      if (score < 2) filledBars = 1;
      else if (score < 4) filledBars = 2;
      else filledBars = 3;
    }

    const color = getStrengthColor();

    return (
      <div className="strength-bars">
        {[1, 2, 3].map((barNum) => (
          <div 
            key={barNum} 
            className="strength-bar-segment"
            style={{ 
              backgroundColor: barNum <= filledBars ? color : '#e2e8f0'
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="login-container">
      <div className="logo-container">
        <img src="/logos/logo5.png" alt="SetJet Logo" className="auth-logo" />
      </div>

      <div className="auth-mode-toggle">
        <button
          type="button"
          className={`auth-mode-option ${mode === 'login' ? 'active' : ''}`}
          onClick={() => handleModeSwitch('login')}
        >
          <LogIn size={18} className="option-icon" />
          <span>Login</span>
        </button>
        <button
          type="button"
          className={`auth-mode-option ${mode === 'signup' ? 'active' : ''}`}
          onClick={() => handleModeSwitch('signup')}
        >
          <UserRoundPlus size={18} className="option-icon" />
          <span>Sign Up</span>
        </button>
      </div>

      <div className="auth-header">
        <h2 className="auth-title">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        {mode === 'signup' && (
          <p className="auth-subtitle">
            Fill out the below fields to start your jet setting journey
          </p>
        )}
        {mode === 'login' && (
          <p className="auth-subtitle">
            Ready to jet set to another adventure?
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {mode === 'signup' && (
          <div className="fade-in">
            <div className="form-section-group">
              <h3 className="section-heading">Personal</h3>
              <div className="form-group">
                <div className={`auth-input-wrapper ${errors.name ? 'error' : ''}`}>
                  <UserRound className="auth-icon" size={22} {...getIconProps('name')} />
                  <div className="input-stack">
                    <span className="input-label-small" style={{ color: getIconProps('name').color }}>
                      Full Name {!formData.name && <span className="required-star">*</span>}
                    </span>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} onFocus={() => handleFocus('name')} onBlur={handleBlur} placeholder="Set McJetson" className="auth-input stacked" />
                  </div>
                </div>
                {errors.name && <span className="error-msg">{errors.name}</span>}
              </div>

              <div className="form-group">
                <div className={`auth-input-wrapper ${errors.username ? 'error' : ''}`}>
                  <AtSign className="auth-icon" size={22} {...getIconProps('username')} />
                  <div className="input-stack">
                    <span className="input-label-small" style={{ color: getIconProps('username').color }}>
                      Username {!formData.username && <span className="required-star">*</span>}
                    </span>
                    <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} onFocus={() => handleFocus('username')} onBlur={handleBlur} placeholder="bobby_mcb" className="auth-input stacked" />
                  </div>
                </div>
                {errors.username && <span className="error-msg">{errors.username}</span>}
              </div>

              <div className="form-group">
                <div className={`auth-input-wrapper ${errors.dob ? 'error' : ''}`}>
                  <Calendar 
                    className="auth-icon" 
                    size={22} 
                    {...getIconProps('dob')} 
                  />
                  <div className="input-stack">
                    <span className="input-label-small" style={{ color: getIconProps('dob').color }}>
                      Date of Birth {!formData.dob && <span className="required-star">*</span>}
                    </span>
                    <input 
                      type="text" 
                      id="dob" 
                      name="dob" 
                      maxLength={10} 
                      value={formData.dob} 
                      onChange={handleChange} 
                      onFocus={() => handleFocus('dob')} 
                      onBlur={handleBlur} 
                      placeholder="mm/dd/yyyy" 
                      className="auth-input stacked" 
                    />
                  </div>
                </div>
                {errors.dob && <span className="error-msg">{errors.dob}</span>}
              </div>
            </div>

            <div className="form-section-group" style={{ marginTop: '0.5rem' }}>
              <h3 className="section-heading">Account</h3>
              <div className="form-group">
                <div className={`auth-input-wrapper ${errors.email ? 'error' : ''}`}>
                  <Mail className="auth-icon" size={22} {...getIconProps('email')} />
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} onFocus={() => handleFocus('email')} onBlur={handleBlur} placeholder="Your E-mail" className="auth-input" />
                </div>
                {errors.email && <span className="error-msg">{errors.email}</span>}
              </div>

              <div className="form-group">
                <div className={`auth-input-wrapper ${errors.password ? 'error' : ''}`}>
                  <Lock className="auth-icon" size={22} {...getIconProps('password')} />
                  <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} onFocus={() => handleFocus('password')} onBlur={handleBlur} placeholder="Password" className="auth-input" />
                </div>
                {errors.password && <span className="error-msg">{errors.password}</span>}

                {/* --- PASSWORD STRENGTH METER --- */}
                {/* Collapses when score >= 4 */}
                {formData.password && passwordStrength.score < 4 && (
                  <div className="strength-meter-container">
                    {renderStrengthBars()}
                    <div className="strength-criteria">
                      <div className={`criteria-item ${passwordStrength.criteria.hasUpper ? 'met' : ''}`}>
                        {passwordStrength.criteria.hasUpper ? <Check className="criteria-icon" /> : <X className="criteria-icon" />}
                        1 Uppercase Letter
                      </div>
                      <div className={`criteria-item ${passwordStrength.criteria.hasNumber ? 'met' : ''}`}>
                        {passwordStrength.criteria.hasNumber ? <Check className="criteria-icon" /> : <X className="criteria-icon" />}
                        1 Number
                      </div>
                      <div className={`criteria-item ${passwordStrength.criteria.hasSpecial ? 'met' : ''}`}>
                        {passwordStrength.criteria.hasSpecial ? <Check className="criteria-icon" /> : <X className="criteria-icon" />}
                        1 Special Character
                      </div>
                      <div className={`criteria-item ${passwordStrength.criteria.noName ? 'met' : ''}`}>
                        {passwordStrength.criteria.noName ? <Check className="criteria-icon" /> : <X className="criteria-icon" />}
                        Cannot contain part of name
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <div className={`auth-input-wrapper ${errors.confirmPassword ? 'error' : ''}`}>
                  <Lock className="auth-icon" size={22} {...getIconProps('confirmPassword')} />
                  <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} onFocus={() => handleFocus('confirmPassword')} onBlur={handleBlur} placeholder="Confirm Password" className="auth-input" />
                </div>
                {errors.confirmPassword && <span className="error-msg">{errors.confirmPassword}</span>}
              </div>
            </div>
          </div>
        )}

        {mode === 'login' && (
          <div className="fade-in">
            <div className="form-group">
              <div className={`auth-input-wrapper ${errors.email ? 'error' : ''}`}>
                <Mail className="auth-icon" size={22} {...getIconProps('email')} />
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} onFocus={() => handleFocus('email')} onBlur={handleBlur} placeholder="Your E-mail" className="auth-input" />
              </div>
              {errors.email && <span className="error-msg">{errors.email}</span>}
            </div>
            <div className="form-group">
              <div className={`auth-input-wrapper ${errors.password ? 'error' : ''}`}>
                <Lock className="auth-icon" size={22} {...getIconProps('password')} />
                <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} onFocus={() => handleFocus('password')} onBlur={handleBlur} placeholder="Password" className="auth-input" />
              </div>
              {errors.password && <span className="error-msg">{errors.password}</span>}
            </div>
          </div>
        )}

        <button type="submit" className="auth-button">
          <span>{mode === 'login' ? 'Login' : 'Create Account'}</span>
          <LogInIcon size={20} />
        </button>
      </form>

      <div className="auth-footer">
        {mode === 'login' ? (
          <p>Don't have an account? <button type="button" className="link-button" onClick={() => handleModeSwitch('signup')}>Sign up</button></p>
        ) : (
          <p>Already have an account? <button type="button" className="link-button" onClick={() => handleModeSwitch('login')}>Login</button></p>
        )}
      </div>

      {mode === 'login' && (
        <div className="demo-section">
          <div className="divider"><span>or try without account</span></div>
          <button type="button" className="demo-button" onClick={onDemoLogin}>
            <Sparkles size={18} /><span>Demo Login</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default LoginSignup;