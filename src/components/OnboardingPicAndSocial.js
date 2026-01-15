import React, { useState } from 'react';
import { 
  ArrowRight,
  Upload
} from 'lucide-react';
import './OnboardingPicAndSocial.css';

function OnboardingPicAndSocial({ onComplete }) {
  const [formData, setFormData] = useState({
    instagram: '',
    facebook: '',
    x: '',
    soundcloud: ''
  });
  
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleFocus = (field) => setFocusedField(field);
  const handleBlur = () => setFocusedField(null);

  // Helper for input styling
  const getInputWrapperClass = (fieldName) => {
    const isFocused = focusedField === fieldName;
    return `auth-input-wrapper ${isFocused ? 'focused' : ''}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return; // Prevent submit if no file
    
    console.log('Submitting:', { 
      file, 
      socials: formData 
    });
    
    if (onComplete) onComplete(); 
  };

  return (
    <div className="login-container">
      
      {/* STEPPER PROGRESS BAR */}
      <div className="stepper-container">
        {/* Step 1: User (Active) */}
        <div className="step-item active">
          <div className="step-circle">1</div>
          <span className="step-label">User</span>
        </div>
        <div className="step-line"></div>
        
        {/* Step 2 */}
        <div className="step-item">
          <div className="step-circle">2</div>
        </div>
        <div className="step-line"></div>
        
        {/* Step 3 */}
        <div className="step-item">
          <div className="step-circle">3</div>
        </div>
        <div className="step-line"></div>
        
        {/* Step 4 */}
        <div className="step-item">
          <div className="step-circle">4</div>
        </div>
      </div>
      
      <div className="logo-container">
        <img src="/logos/setjet_logoa.png" alt="SetJet Logo" className="auth-logo" />
      </div>

      <div className="auth-header">
        <h2 className="auth-title">
          Add Your Style
        </h2>
        <p className="auth-subtitle">
            Upload a profile picture and connect your socials.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        
        <div className="fade-in">
          
          {/* PROFILE PICTURE UPLOAD */}
          <div className="profile-upload-section">
            <div className="profile-pic-wrapper">
              <img 
                src={previewUrl || "/artifacts/defaultprofilepic.png"} 
                alt="Profile" 
                className="profile-preview" 
              />
              
              <label htmlFor="file-upload" className="upload-btn">
                <Upload size={16} />
              </label>
              <input 
                id="file-upload" 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                style={{ display: 'none' }} 
              />
            </div>
            <p className="upload-label">Upload Profile Photo</p>
          </div>

          {/* SOCIAL INPUTS */}
          <div className="socials-group">
            
            {/* INSTAGRAM */}
            <div className="form-group">
              <div className={getInputWrapperClass('instagram')}>
                <img src="/logos/logo_instagram.jpeg" alt="IG" className="social-icon-img" />
                <div className="input-stack">
                  <span className="input-label-small">Instagram</span>
                  <input
                    type="text"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    onFocus={() => handleFocus('instagram')}
                    onBlur={handleBlur}
                    placeholder="@username"
                    className="auth-input stacked"
                  />
                </div>
              </div>
            </div>

            {/* FACEBOOK */}
            <div className="form-group">
              <div className={getInputWrapperClass('facebook')}>
                <img src="/logos/logo_facebook.png" alt="FB" className="social-icon-img" />
                <div className="input-stack">
                  <span className="input-label-small">Facebook</span>
                  <input
                    type="text"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleChange}
                    onFocus={() => handleFocus('facebook')}
                    onBlur={handleBlur}
                    placeholder="@username"
                    className="auth-input stacked"
                  />
                </div>
              </div>
            </div>

            {/* X (Twitter) */}
            <div className="form-group">
              <div className={getInputWrapperClass('x')}>
                <img src="/logos/logo_x.png" alt="X" className="social-icon-img" />
                <div className="input-stack">
                  <span className="input-label-small">X (Twitter)</span>
                  <input
                    type="text"
                    name="x"
                    value={formData.x}
                    onChange={handleChange}
                    onFocus={() => handleFocus('x')}
                    onBlur={handleBlur}
                    placeholder="@username"
                    className="auth-input stacked"
                  />
                </div>
              </div>
            </div>

            {/* SOUNDCLOUD */}
            <div className="form-group">
              <div className={getInputWrapperClass('soundcloud')}>
                <img src="/logos/logo_soundcloud.jpg" alt="SC" className="social-icon-img" />
                <div className="input-stack">
                  <span className="input-label-small">SoundCloud</span>
                  <input
                    type="text"
                    name="soundcloud"
                    value={formData.soundcloud}
                    onChange={handleChange}
                    onFocus={() => handleFocus('soundcloud')}
                    onBlur={handleBlur}
                    placeholder="@username"
                    className="auth-input stacked"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* SUBMIT BUTTON - Disabled until file exists */}
        <button 
          type="submit" 
          className="auth-button"
          disabled={!file} 
        >
          <span>Continue</span>
          <ArrowRight size={20} />
        </button>
      </form>

    </div>
  );
}

export default OnboardingPicAndSocial;