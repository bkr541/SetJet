import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowRight,
  Upload,
  MapPin,
  FileText,
  AtSign,
  Calendar 
} from 'lucide-react';
import './OnboardingPicAndSocial.css';
import cityData from '../data/FrontierDestinationInfo_numeric.json';

function OnboardingPicAndSocial({ onComplete }) {
  // State for the Welcome Modal
  const [showModal, setShowModal] = useState(true);

  const [formData, setFormData] = useState({
    username: '',
    dob: '', 
    bio: '',
    homeAirport: ''
  });
  
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});
  
  const [isHomeSearchFocused, setIsHomeSearchFocused] = useState(false);

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const filteredHomeAirports = useMemo(() => {
    if (!formData.homeAirport || formData.homeAirport.length < 2) return [];
    
    const lowerInput = formData.homeAirport.toLowerCase();
    const uniqueCities = new Set();
    const distinctResults = [];

    for (const item of cityData) {
      if (item.City && item.City.toLowerCase().includes(lowerInput)) {
        const locationStr = item['State Abbreviation'] 
          ? `${item.City}, ${item['State Abbreviation']}`
          : `${item.City}, ${item.Country}`;

        if (!uniqueCities.has(locationStr)) {
          uniqueCities.add(locationStr);
          distinctResults.push({
            ...item,
            displayLabel: locationStr
          });
        }
      }
    }
    
    return distinctResults;
  }, [formData.homeAirport]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'dob') {
        const numericValue = value.replace(/\D/g, '');
        if (numericValue.length > 8) return;
  
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
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
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
    const locationStr = cityRecord.displayLabel || (cityRecord['State Abbreviation'] 
      ? `${cityRecord.City}, ${cityRecord['State Abbreviation']}`
      : `${cityRecord.City}, ${cityRecord.Country}`);
    
    setFormData(prev => ({ ...prev, homeAirport: locationStr }));
    setIsHomeSearchFocused(false);
  };

  const getIconProps = (fieldName) => {
    const isFocused = focusedField === fieldName;
    const hasValue = formData[fieldName] && formData[fieldName].length > 0;
    const hasError = !!errors[fieldName];

    if (hasError) return { color: '#FF2C2C', fill: 'none' };
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

    if (!formData.username) {
        tempErrors.username = 'Username is required';
        isValid = false;
    }

    if (!formData.dob) { 
        tempErrors.dob = "Date of Birth is required"; 
        isValid = false; 
    } else if (formData.dob.length < 10) {
        tempErrors.dob = "Enter a valid date (mm/dd/yyyy)"; 
        isValid = false;
    } else {
        const parts = formData.dob.split('/');
        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        if (month < 1 || month > 12) {
            tempErrors.dob = "Invalid month";
            isValid = false;
        } else if (day < 1 || day > 31) {
            tempErrors.dob = "Invalid day";
            isValid = false;
        } else {
            const dobDate = new Date(year, month - 1, day);
            if (dobDate.getMonth() !== month - 1 || dobDate.getDate() !== day) {
                tempErrors.dob = "Invalid date provided";
                isValid = false;
            } else {
                const today = new Date();
                today.setHours(0, 0, 0, 0); 
                if (dobDate > today) {
                    tempErrors.dob = "Date cannot be in the future";
                    isValid = false;
                }
            }
        }
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert("Please upload a profile photo.");
      return;
    }

    if (!validate()) {
        return;
    }

    const email = localStorage.getItem('current_email');
    if (!email) {
      alert("No account found. Please restart the signup process.");
      return;
    }
    
    const payload = new FormData();
    payload.append('email', email);
    payload.append('username', formData.username);
    payload.append('dob', formData.dob); 
    payload.append('bio', formData.bio);
    payload.append('home_city', formData.homeAirport);
    payload.append('profile_photo', file);

    try {
      const response = await fetch('http://127.0.0.1:5001/api/update_profile', {
        method: 'POST',
        body: payload,
      });

      const result = await response.json();

      if (response.ok) {
        if (onComplete) onComplete(); 
      } else {
        alert(result.error || 'Failed to update profile.');
      }
    } catch (error) {
      console.error("Error submitting profile:", error);
      alert("Failed to connect to server.");
    }
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
      
      <div className="auth-header">
        <h2 className="auth-title">
          Add Your Style
        </h2>
        <p className="auth-subtitle">
            Upload a profile picture and tell us about yourself.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        
        <div className="fade-in" style={{ position: 'relative' }}>
          
          {/* PROFILE PICTURE UPLOAD */}
          <div className="profile-upload-section">
            <div className="profile-pic-wrapper">
              <img 
                src={previewUrl || "/artifacts/defaultprofileillenium2.png"} 
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
              {!file && <span style={{ color: '#FF2C2C', marginLeft: '4px', fontWeight: 'bold' }}>*</span>}
            </p>
          </div>

          {/* USERNAME INPUT */}
          <div className="form-group">
            <div className={`auth-input-wrapper ${errors.username ? 'error' : ''} ${focusedField === 'username' ? 'focused' : ''}`}>
              <AtSign className="auth-icon" size={22} {...getIconProps('username')} />
              <div className="input-stack">
                <span 
                  className="input-label-small"
                  style={{ color: getIconProps('username').color }}
                >
                  Username
                  {!formData.username && <span style={{ color: '#FF2C2C', marginLeft: '3px', fontWeight: '700' }}>*</span>}
                </span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onFocus={() => handleFocus('username')}
                  onBlur={() => handleBlur('username')}
                  placeholder="bobby_mcb"
                  className="auth-input stacked"
                />
              </div>
            </div>
            {errors.username && <span className="error-msg" style={{color: '#FF2C2C', fontSize: '0.8rem', fontWeight: 600, marginLeft: '0.5rem'}}>{errors.username}</span>}
          </div>

          {/* DOB INPUT */}
          <div className="form-group">
            <div className={`auth-input-wrapper ${errors.dob ? 'error' : ''} ${focusedField === 'dob' ? 'focused' : ''}`}>
                <Calendar className="auth-icon" size={22} {...getIconProps('dob')} />
                <div className="input-stack">
                <span className="input-label-small" style={{ color: getIconProps('dob').color }}>
                    Date of Birth {!formData.dob && <span style={{ color: '#FF2C2C', marginLeft: '3px', fontWeight: '700' }}>*</span>}
                </span>
                <input 
                    type="text" 
                    name="dob" 
                    maxLength={10} 
                    value={formData.dob} 
                    onChange={handleChange} 
                    onFocus={() => handleFocus('dob')} 
                    onBlur={() => handleBlur('dob')} 
                    placeholder="mm/dd/yyyy" 
                    className="auth-input stacked" 
                />
                </div>
            </div>
            {errors.dob && <span className="error-msg" style={{color: '#FF2C2C', fontSize: '0.8rem', fontWeight: 600, marginLeft: '0.5rem'}}>{errors.dob}</span>}
            </div>

          {/* BIO INPUT */}
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

          {/* HOME CITY SEARCH */}
          <div className="form-group" style={{ position: 'relative' }}>
            <div className={`auth-input-wrapper ${focusedField === 'homeAirport' ? 'focused' : ''}`}>
              <MapPin className="auth-icon" size={22} {...getIconProps('homeAirport')} />
              <div className="input-stack">
                <span 
                  className="input-label-small"
                  style={{ color: getIconProps('homeAirport').color }}
                >
                  Home City
                  {!formData.homeAirport && <span style={{ color: '#FF2C2C', marginLeft: '4px', fontWeight: 'bold' }}>*</span>}
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
                      {city.displayLabel}
                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {/* --- WELCOME MODAL --- */}
      {showModal && (
        <div className="welcome-modal-overlay">
          <div 
            className="welcome-modal-content"
            style={{ backgroundImage: "url('/artifacts/onboardingmodal1.png')" }}
          >
            {/* Gradient Overlay for Text Readability */}
            <div className="welcome-modal-gradient">
              <div className="welcome-text-container">
                <h2 className="welcome-title">Welcome to SetJet!</h2>
                <p className="welcome-subtitle">
                  We're excited to help you find the best flights. Let's finish setting up your profile.
                </p>
                <button 
                  className="welcome-button"
                  onClick={() => setShowModal(false)}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default OnboardingPicAndSocial;