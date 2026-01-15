import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  LogIn, 
  UserPlus,
  ArrowRight,
  Sparkles,
  Calendar,
  AtSign,
  Check,
  X
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
      const criteria = {
        hasUpper: /[A-Z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        // Pass if name is empty OR if password does NOT include name
        noName: !name || name.trim() === '' || !password.toLowerCase().includes(name.toLowerCase())
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

    // DOB Restriction: Prevent typing more than standard date format length (10 chars: YYYY-MM-DD)
    if (name === 'dob' && value.length > 10) {
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    
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
    
    if (isFocused) {
      return { color: '#0096a6', fill: 'none' };
    }
    if (hasValue) {
      return { color: '#004e5a', fill: 'none' }; 
    }
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
      if (!formData.dob) { tempErrors.dob = "Date of Birth is required"; isValid = false; }
      if (!formData.email) { tempErrors.email = "Email is required"; isValid = false; }
      if (!formData.password) { tempErrors.password = "Password is required"; isValid = false; }
      if (!formData.confirmPassword) { tempErrors.confirmPassword = "Confirm Password is required"; isValid = false; }
      
      if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
        tempErrors.password = "Passwords do not match";
        isValid = false;
      }

      // Password Strength Validation on Submit
      if (passwordStrength.score < 4 && formData.password) {
        tempErrors.password = "Password is not strong enough";
        isValid = false;
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
            alert('Account created successfully!');
            if (onSignupSuccess) onSignupSuccess(); 
          } else {
            if (result.onboarding_complete === 'No') {
              if (onSignupSuccess) onSignupSuccess(); 
            } else {
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
        <img src="/logos/setjet_logoa.png" alt="SetJet Logo" className="auth-logo" />
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
          <UserPlus size={18} className="option-icon" />
          <span>Sign Up</span>
        </button>
      </div>

      <div className="auth-header">
        <h2 className="auth-title">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        {mode === 'signup' && (
          <p className="auth-subtitle">
            Fill out the below fields to create your SetJet account today
          </p>
        )}
        {mode === 'login' && (
          <p className="auth-subtitle">
            Enter your credentials to access your account
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
                  <User className="auth-icon" size={22} {...getIconProps('name')} />
                  <div className="input-stack">
                    <span className="input-label-small" style={{ color: getIconProps('name').color }}>Full Name</span>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} onFocus={() => handleFocus('name')} onBlur={handleBlur} placeholder="Set McJetson" className="auth-input stacked" />
                  </div>
                </div>
                {errors.name && <span className="error-msg">{errors.name}</span>}
              </div>

              <div className="form-group">
                <div className={`auth-input-wrapper ${errors.username ? 'error' : ''}`}>
                  <AtSign className="auth-icon" size={22} {...getIconProps('username')} />
                  <div className="input-stack">
                    <span className="input-label-small" style={{ color: getIconProps('username').color }}>Username</span>
                    <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} onFocus={() => handleFocus('username')} onBlur={handleBlur} placeholder="bobby_mcb" className="auth-input stacked" />
                  </div>
                </div>
                {errors.username && <span className="error-msg">{errors.username}</span>}
              </div>

              <div className="form-group">
                <div className={`auth-input-wrapper ${errors.dob ? 'error' : ''}`}>
                  {/* CHANGED: Moved Icon to the RIGHT by placing it after input-stack */}
                  <div className="input-stack">
                    <span className="input-label-small" style={{ color: getIconProps('dob').color }}>Date of Birth</span>
                    <input 
                      type="text" 
                      id="dob" 
                      name="dob" 
                      maxLength={10} 
                      value={formData.dob} 
                      onChange={handleChange} 
                      onFocus={(e) => { handleFocus('dob'); e.target.type = 'date'; }} 
                      onBlur={(e) => { handleBlur(); if (!e.target.value) e.target.type = 'text'; }} 
                      placeholder="mm/dd/yyyy" 
                      className="auth-input stacked" 
                    />
                  </div>
                  {/* Icon now on the right side with adjusted margins */}
                  <Calendar 
                    className="auth-icon" 
                    size={22} 
                    {...getIconProps('dob')} 
                    style={{ marginRight: 0, marginLeft: '1rem' }} 
                  />
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
                {formData.password && (
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
                        Cannot contain Full Name
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
          <ArrowRight size={20} />
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