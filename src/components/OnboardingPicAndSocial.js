import React, { useState, useMemo } from 'react';
import { 
  ArrowRight,
  Upload,
  MapPin,
  FileText
} from 'lucide-react';
import './OnboardingPicAndSocial.css';
// Ensure this path matches your project structure
import cityData from '../data/FrontierDestinationInfo_numeric.json';

function OnboardingPicAndSocial({ onComplete }) {
  const [formData, setFormData] = useState({
    bio: '',
    homeAirport: '',
    instagram: '',
    facebook: '',
    x: '',
    soundcloud: ''
  });
  
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  
  // Home Airport Search State
  const [isHomeSearchFocused, setIsHomeSearchFocused] = useState(false);

  // Filter Home Airports
  const filteredHomeAirports = useMemo(() => {
    if (!formData.homeAirport || formData.homeAirport.length < 2) return [];
    
    return cityData.filter(item => 
      item.City && item.City.toLowerCase().includes(formData.homeAirport.toLowerCase())
    );
  }, [formData.homeAirport]);

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
  
  const handleBlur = (field) => {
    setFocusedField(null);
    if (field === 'homeAirport') {
      setTimeout(() => setIsHomeSearchFocused(false), 200);
    }
  };

  const handleSelectHomeAirport = (cityRecord) => {
    const locationStr = cityRecord['State Abbreviation'] 
      ? `${cityRecord.City}, ${cityRecord['State Abbreviation']}`
      : `${cityRecord.City}, ${cityRecord.Country}`;
    
    setFormData(prev => ({ ...prev, homeAirport: locationStr }));
    setIsHomeSearchFocused(false);
  };

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

  const getInputWrapperClass = (fieldName) => {
    const isFocused = focusedField === fieldName;
    return `auth-input-wrapper ${isFocused ? 'focused' : ''}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return; 
    
    console.log('Submitting:', { 
      file, 
      data: formData 
    });
    
    if (onComplete) onComplete(); 
  };

  return (
    <div className="login-container">
      
      {/* STEPPER PROGRESS BAR */}
      <div className="stepper-container">
        <div className="step-item active">
          <div className="step-circle">1</div>
          <span className="step-label">User</span>
        </div>
        <div className="step-line"></div>
        <div className="step-item">
          <div className="step-circle">2</div>
        </div>
        <div className="step-line"></div>
        <div className="step-item">
          <div className="step-circle">3</div>
        </div>
        <div className="step-line"></div>
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
        
        <div className="fade-in" style={{ position: 'relative' }}>
          
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
            <p className="upload-label">
              Upload Profile Photo
              {/* Red Asterisk */}
              {!file && <span style={{ color: '#FF2C2C', marginLeft: '4px' }}>*</span>}
            </p>
          </div>

          {/* BIO INPUT (Reverted to simple expandable behavior) */}
          <div className="form-group">
            <div className={`auth-input-wrapper bio-wrapper ${focusedField === 'bio' ? 'focused' : ''}`}>
              <FileText className="auth-icon" size={22} {...getIconProps('bio')} />
              <div className="input-stack">
                <span 
                  className="input-label-small"
                  style={{ color: getIconProps('bio').color }}
                >
                  Bio
                </span>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  onFocus={() => handleFocus('bio')}
                  onBlur={() => handleBlur('bio')}
                  placeholder="Tell us about yourself..."
                  className="auth-input stacked bio-textarea"
                />
              </div>
            </div>
          </div>

          {/* HOME AIRPORT SEARCH */}
          <div className="form-group" style={{ position: 'relative' }}>
            <div className={`auth-input-wrapper ${focusedField === 'homeAirport' ? 'focused' : ''}`}>
              <MapPin className="auth-icon" size={22} {...getIconProps('homeAirport')} />
              <div className="input-stack">
                <span 
                  className="input-label-small"
                  style={{ color: getIconProps('homeAirport').color }}
                >
                  Home Airport
                  {/* Red Asterisk */}
                  {!formData.homeAirport && <span style={{ color: '#FF2C2C', marginLeft: '4px' }}>*</span>}
                </span>
                <input
                  type="text"
                  name="homeAirport"
                  value={formData.homeAirport}
                  onChange={handleChange}
                  onFocus={() => {
                    handleFocus('homeAirport');
                    setIsHomeSearchFocused(true);
                  }}
                  onBlur={() => handleBlur('homeAirport')}
                  placeholder="e.g. Denver, CO"
                  className="auth-input stacked"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* FLOATING DROPDOWN */}
            {isHomeSearchFocused && filteredHomeAirports.length > 0 && (
              <div className="city-dropdown">
                {filteredHomeAirports.map((city, index) => (
                  <div 
                    key={index} 
                    className="city-dropdown-item"
                    onMouseDown={() => handleSelectHomeAirport(city)}
                  >
                    <div className="city-main">
                      {city.City}, {city['State Abbreviation'] || city.Country}
                    </div>
                    <div className="city-sub">
                      {city['Airport Name']} ({city['IATA Code']})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SOCIAL INPUTS */}
          <div className="socials-group">
            
            {/* INSTAGRAM */}
            <div className="form-group">
              <div className={getInputWrapperClass('instagram')}>
                <img src="/logos/logo_instagram.jpeg" alt="IG" className="social-icon-img" />
                <div className="input-stack">
                  <span 
                    className="input-label-small"
                    style={{ color: getIconProps('instagram').color }}
                  >
                    Instagram
                  </span>
                  <input
                    type="text"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    onFocus={() => handleFocus('instagram')}
                    onBlur={() => handleBlur('instagram')}
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
                  <span 
                    className="input-label-small"
                    style={{ color: getIconProps('facebook').color }}
                  >
                    Facebook
                  </span>
                  <input
                    type="text"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleChange}
                    onFocus={() => handleFocus('facebook')}
                    onBlur={() => handleBlur('facebook')}
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
                  <span 
                    className="input-label-small"
                    style={{ color: getIconProps('x').color }}
                  >
                    X (Twitter)
                  </span>
                  <input
                    type="text"
                    name="x"
                    value={formData.x}
                    onChange={handleChange}
                    onFocus={() => handleFocus('x')}
                    onBlur={() => handleBlur('x')}
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
                  <span 
                    className="input-label-small"
                    style={{ color: getIconProps('soundcloud').color }}
                  >
                    SoundCloud
                  </span>
                  <input
                    type="text"
                    name="soundcloud"
                    value={formData.soundcloud}
                    onChange={handleChange}
                    onFocus={() => handleFocus('soundcloud')}
                    onBlur={() => handleBlur('soundcloud')}
                    placeholder="@username"
                    className="auth-input stacked"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* SUBMIT BUTTON */}
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