import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  LogIn, 
  UserPlus,
  ArrowRight,
  Sparkles // Added icon for Demo button
} from 'lucide-react';
import './LoginSignup.css';

function LoginSignup({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your authentication logic here
    console.log(`Submitting ${mode} form:`, formData);
    if (onLogin) onLogin(); 
  };

  return (
    <div className="login-container">
      
      {/* MODE TOGGLE SWITCH */}
      <div className="auth-mode-toggle">
        <button
          type="button"
          className={`auth-mode-option ${mode === 'login' ? 'active' : ''}`}
          onClick={() => setMode('login')}
        >
          <LogIn size={18} className="option-icon" />
          <span>Login</span>
        </button>
        <button
          type="button"
          className={`auth-mode-option ${mode === 'signup' ? 'active' : ''}`}
          onClick={() => setMode('signup')}
        >
          <UserPlus size={18} className="option-icon" />
          <span>Sign Up</span>
        </button>
      </div>

      <h2 className="auth-title">
        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
      </h2>

      <form onSubmit={handleSubmit} className="auth-form">
        
        {/* NAME FIELD (Sign Up Only) */}
        {mode === 'signup' && (
          <div className="form-group fade-in">
            <label htmlFor="name">Full Name</label>
            <div className="auth-input-wrapper">
              <User className="auth-icon" size={20} />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Jane Doe"
                className="auth-input"
                required
              />
            </div>
          </div>
        )}

        {/* EMAIL FIELD */}
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <div className="auth-input-wrapper">
            <Mail className="auth-icon" size={20} />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className="auth-input"
              required
            />
          </div>
        </div>

        {/* PASSWORD FIELD */}
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="auth-input-wrapper">
            <Lock className="auth-icon" size={20} />
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="auth-input"
              required
            />
          </div>
        </div>

        {/* CONFIRM PASSWORD (Sign Up Only) */}
        {mode === 'signup' && (
          <div className="form-group fade-in">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="auth-input-wrapper">
              <Lock className="auth-icon" size={20} />
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="auth-input"
                required
              />
            </div>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button type="submit" className="auth-button">
          <span>{mode === 'login' ? 'Login' : 'Create Account'}</span>
          <ArrowRight size={20} />
        </button>

      </form>

      {/* FOOTER LINKS */}
      <div className="auth-footer">
        {mode === 'login' ? (
          <p>
            Don't have an account?{' '}
            <button type="button" className="link-button" onClick={() => setMode('signup')}>
              Sign up
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <button type="button" className="link-button" onClick={() => setMode('login')}>
              Login
            </button>
          </p>
        )}
      </div>

      {/* --- DEMO LOGIN SECTION --- */}
      <div className="demo-section">
        <div className="divider">
          <span>or try without account</span>
        </div>
        <button type="button" className="demo-button" onClick={onLogin}>
          <Sparkles size={18} />
          <span>Demo Login</span>
        </button>
      </div>

    </div>
  );
}

export default LoginSignup;