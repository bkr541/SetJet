import React, { useState } from 'react';
import { 
  User, 
  ArrowRight,
} from 'lucide-react';
import './InitProfileCities.css';

function LoginSignup({ onLogin }) {
  const [formData, setFormData] = useState({
    name: '',
  });

  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFocus = (field) => setFocusedField(field);
  const handleBlur = () => setFocusedField(null);

  // Helper to determine Icon styling
  const getIconProps = (fieldName) => {
    const isFocused = focusedField === fieldName;
    const hasValue = formData[fieldName] && formData[fieldName].length > 0;

    if (isFocused) {
      // Focused
      return { color: '#0096a6', fill: 'none' };
    }
    if (hasValue) {
      // Valid/Not Null (Not Focused) - Defaulting to fill behavior for the single input
      return { color: '#004e5a', fill: '#004e5a' };
    }
    // Default
    return { color: '#161616', fill: 'none' };
  };

  const validate = () => {
    let tempErrors = {};
    let isValid = true;

    if (!formData.name) { 
        tempErrors.name = "Full Name is required"; 
        isValid = false; 
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Simply log and proceed as per stripped down requirements
      console.log('Submitting name:', formData.name);
      if (onLogin) onLogin(); 
    }
  };

  return (
    <div className="login-container">
      
      {/* LOGO SECTION */}
      <div className="logo-container">
        <img src="/logos/setjet_logoa.png" alt="SetJet Logo" className="auth-logo" />
      </div>

      <div className="auth-header">
        <h2 className="auth-title">
          Welcome Back
        </h2>
        <p className="auth-subtitle">
            Enter your credentials to access your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        
        <div className="fade-in">
          
          {/* FULL NAME */}
          <div className="form-group">
            <div className={`auth-input-wrapper ${errors.name ? 'error' : ''}`}>
              <User className="auth-icon" size={22} {...getIconProps('name')} />
              <div className="input-stack">
                <span 
                    className="input-label-small"
                    style={{ color: getIconProps('name').color }}
                >
                    Full Name
                </span>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => handleFocus('name')}
                  onBlur={handleBlur}
                  placeholder="Set McJetson"
                  className="auth-input stacked"
                />
              </div>
            </div>
            {errors.name && <span className="error-msg">{errors.name}</span>}
          </div>

        </div>

        {/* SUBMIT BUTTON */}
        <button type="submit" className="auth-button">
          <span>Login</span>
          <ArrowRight size={20} />
        </button>
      </form>

    </div>
  );
}

export default LoginSignup;