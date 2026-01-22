import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  LogIn, 
  UserPlus,
  ArrowRight,
  Sparkles,
  LogInIcon,
  Check,
  UserRound,
  X,
  UserRoundPlus,
  Eye, 
  EyeOff
} from 'lucide-react';
import './LoginSignup.css';

function LoginSignup({ onLogin, onDemoLogin, onSignupSuccess }) {
  const [mode, setMode] = useState('login'); 
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  
  // State for password toggle in Login mode
  const [showPassword, setShowPassword] = useState(false);
  
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

  // Calculate password strength
  useEffect(() => {
    if (mode === 'signup') {
      const { password, firstName, lastName } = formData;
      
      // Check for sequential characters from name in password
      let hasNameSequence = false;
      
      // Check against First Name
      if (firstName && firstName.length >= 4) {
         const lowerFirst = firstName.toLowerCase();
         const lowerPass = password.toLowerCase();
         if (lowerPass.includes(lowerFirst)) hasNameSequence = true;
      }
      // Check against Last Name
      if (lastName && lastName.length >= 4) {
         const lowerLast = lastName.toLowerCase();
         const lowerPass = password.toLowerCase();
         if (lowerPass.includes(lowerLast)) hasNameSequence = true;
      }

      const criteria = {
        hasUpper: /[A-Z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        noName: !hasNameSequence 
      };

      let score = 0;
      if (criteria.hasUpper) score++;
      if (criteria.hasNumber) score++;
      if (criteria.hasSpecial) score++;
      if (criteria.noName && password.length > 0) score++; 

      setPasswordStrength({ score, criteria });
    }
  }, [formData.password, formData.firstName, formData.lastName, mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFocus = (field) => setFocusedField(field);
  const handleBlur = () => setFocusedField(null);

  const getIconProps = (fieldName) => {
    const isFocused = focusedField === fieldName;
    const hasValue = formData[fieldName] && formData[fieldName].length > 0;
    const hasError = !!errors[fieldName]; 

    if (hasError) return { color: '#FF2C2C', fill: 'none' };
    if (isFocused) return { color: '#0096a6', fill: 'none' };
    if (hasValue) return { color: '#004e5a', fill: 'none' }; 
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
      if (!formData.firstName) { tempErrors.firstName = "First Name is required"; isValid = false; }
      if (!formData.lastName) { tempErrors.lastName = "Last Name is required"; isValid = false; }
      
      // Email Validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
      if (!formData.email) { 
        tempErrors.email = "Email is required"; 
        isValid = false; 
      } else if (!emailRegex.test(formData.email)) {
        tempErrors.email = "Please enter a valid email address (e.g. name@site.com)";
        isValid = false;
      }

      if (!formData.password) { tempErrors.password = "Password is required"; isValid = false; }
      if (!formData.confirmPassword) { tempErrors.confirmPassword = "Confirm Password is required"; isValid = false; }
      
      if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
        tempErrors.password = "Passwords do not match";
        isValid = false;
      }

      if (formData.password) {
        if (!passwordStrength.criteria.noName) {
            tempErrors.password = "Password cannot contain your name";
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
        // ✅ CHANGED: Send split First and Last name
        payload.append('first_name', formData.firstName);
        payload.append('last_name', formData.lastName);
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
            localStorage.setItem('current_email', formData.email);
            if (onSignupSuccess) onSignupSuccess(); 
          } else {
            localStorage.setItem('current_email', formData.email);
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
    setFormData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
    setShowPassword(false); // Reset password visibility
  };

  const getStrengthColor = () => {
    const { score } = passwordStrength;
    if (score < 2) return '#FF2C2C'; 
    if (score < 4) return '#FFB800'; 
    return '#10b981'; 
  };

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
              
              {/* FIRST NAME */}
              <div className="form-group">
                <div className={`auth-input-wrapper ${errors.firstName ? 'error' : ''}`}>
                  <UserRound className="auth-icon" size={22} {...getIconProps('firstName')} />
                  <div className="input-stack">
                    <span className="input-label-small" style={{ color: getIconProps('firstName').color }}>
                      First Name {!formData.firstName && <span className="required-star">*</span>}
                    </span>
                    <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} onFocus={() => handleFocus('firstName')} onBlur={handleBlur} placeholder="Set" className="auth-input stacked" />
                  </div>
                </div>
                {errors.firstName && <span className="error-msg">{errors.firstName}</span>}
              </div>

              {/* LAST NAME */}
              <div className="form-group">
                <div className={`auth-input-wrapper ${errors.lastName ? 'error' : ''}`}>
                  <UserRound className="auth-icon" size={22} {...getIconProps('lastName')} />
                  <div className="input-stack">
                    <span className="input-label-small" style={{ color: getIconProps('lastName').color }}>
                      Last Name {!formData.lastName && <span className="required-star">*</span>}
                    </span>
                    <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} onFocus={() => handleFocus('lastName')} onBlur={handleBlur} placeholder="McJetson" className="auth-input stacked" />
                  </div>
                </div>
                {errors.lastName && <span className="error-msg">{errors.lastName}</span>}
              </div>

              {/* EMAIL */}
              <div className="form-group">
                <div className={`auth-input-wrapper ${errors.email ? 'error' : ''}`}>
                  <Mail className="auth-icon" size={22} {...getIconProps('email')} />
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} onFocus={() => handleFocus('email')} onBlur={handleBlur} placeholder="Email" className="auth-input" />
                </div>
                {errors.email && <span className="error-msg">{errors.email}</span>}
              </div>

              {/* PASSWORD */}
              <div className="form-group">
                <div className={`auth-input-wrapper ${errors.password ? 'error' : ''}`}>
                  <Lock className="auth-icon" size={22} {...getIconProps('password')} />
                  <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} onFocus={() => handleFocus('password')} onBlur={handleBlur} placeholder="Password" className="auth-input" />
                </div>
                {errors.password && <span className="error-msg">{errors.password}</span>}

                {/* --- PASSWORD STRENGTH METER --- */}
                {formData.password && passwordStrength.score < 4 && (
                  <div className="strength-meter-container">
                    {renderStrengthBars()}
                    <div className="strength-criteria">
                      <div className={`criteria-item ${passwordStrength.criteria.hasUpper ? 'met' : 'not-met'}`}>
                        {passwordStrength.criteria.hasUpper ? <Check className="criteria-icon" /> : <X className="criteria-icon" />}
                        1 Uppercase Letter
                      </div>
                      <div className={`criteria-item ${passwordStrength.criteria.hasNumber ? 'met' : 'not-met'}`}>
                        {passwordStrength.criteria.hasNumber ? <Check className="criteria-icon" /> : <X className="criteria-icon" />}
                        1 Number
                      </div>
                      <div className={`criteria-item ${passwordStrength.criteria.hasSpecial ? 'met' : 'not-met'}`}>
                        {passwordStrength.criteria.hasSpecial ? <Check className="criteria-icon" /> : <X className="criteria-icon" />}
                        1 Special Character
                      </div>
                      <div className={`criteria-item ${passwordStrength.criteria.noName ? 'met' : 'not-met'}`}>
                        {passwordStrength.criteria.noName ? <Check className="criteria-icon" /> : <X className="criteria-icon" />}
                        Cannot contain part of name
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="form-group">
                <div className={`auth-input-wrapper ${errors.confirmPassword ? 'error' : ''}`}>
                  <Lock className="auth-icon" size={22} {...getIconProps('confirmPassword')} />
                  <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} onFocus={() => handleFocus('confirmPassword')} onBlur={handleBlur} placeholder="Confirm Password" className="auth-input" />
                </div>
                {errors.confirmPassword && <span className="error-msg">{errors.confirmPassword}</span>}
              </div>
          </div>
        )}

        {mode === 'login' && (
          <div className="fade-in">
            <div className="form-group">
              <div className={`auth-input-wrapper ${errors.email ? 'error' : ''}`}>
                <Mail className="auth-icon" size={22} {...getIconProps('email')} />
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} onFocus={() => handleFocus('email')} onBlur={handleBlur} placeholder="Email or Username" className="auth-input" />
              </div>
              {errors.email && <span className="error-msg">{errors.email}</span>}
            </div>
            
            {/* Login Password with Toggle */}
            <div className="form-group">
              <div className={`auth-input-wrapper ${errors.password ? 'error' : ''}`}>
                <Lock className="auth-icon" size={22} {...getIconProps('password')} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  onFocus={() => handleFocus('password')} 
                  onBlur={handleBlur} 
                  placeholder="Password" 
                  className="auth-input" 
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
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