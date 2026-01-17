import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowRight,
  Upload,
  MapPin,
  FileText,
  AtSign,
  Calendar,
  ChevronLeft 
} from 'lucide-react';
import './Onboarding_1.css';
import cityData from '../data/FrontierDestinationInfo_numeric.json';
import Onboarding_2 from './Onboarding_2'; 

// Carousel Assets
const MODAL_IMAGES = [
  "/artifacts/onboardingmodal1.png",
  "/artifacts/onboardingmodal2.png",
  "/artifacts/onboardingmodal3.png",
  "/artifacts/onboardingmodal4.png",
  "/artifacts/onboardingmodal5.png"
];

const MODAL_CONTENT = [
  {
    title: "Welcome to SetJet",
    subtitle: "SetJet is made to simplify doing one thing - find a set you can't miss, then get you there."
  },
  {
    title: "Discover New Places",
    subtitle: "Explore destinations you've never seen before with our curated flight lists."
  },
  {
    title: "Track Your Adventures",
    subtitle: "Keep a log of your favorite cities and get notified when prices drop."
  },
  {
    title: "Plan Your Journey",
    subtitle: "Organize your upcoming trips and keep all your travel details in one place."
  },
  {
    title: "Ready for Takeoff?",
    subtitle: "Your journey begins now. Let's get your profile ready to fly."
  }
];

function Onboarding_1({ onComplete }) {
  // State for the Welcome Modal
  const [showModal, setShowModal] = useState(true);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [modalStep, setModalStep] = useState(0); // 0 to 4
  
  // State for Flow Navigation (1 = Pic/Bio, 2 = Flights)
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');

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

  // Fetch First Name from DB using Email
  useEffect(() => {
    const fetchUserData = async () => {
      const email = localStorage.getItem('current_email');
      if (!email) return;

      try {
        const response = await fetch('http://127.0.0.1:5001/api/get_user_info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.first_name) {
            setFirstName(data.first_name);
          }
          
          // ✅ UPDATED: Populate all fields if data exists
          setFormData(prev => ({
            ...prev,
            username: data.username || '',
            dob: data.dob || '',
            bio: data.bio || '',
            homeAirport: data.home_city || ''
          }));
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserData();
  }, []);

  // Handle Modal Primary Button
  const handleModalPrimary = () => {
    if (modalStep < MODAL_IMAGES.length - 1) {
      setModalStep(prev => prev + 1);
    } else {
      setIsModalClosing(true);
      setTimeout(() => {
        setShowModal(false);
        setIsModalClosing(false);
        setModalStep(0); 
      }, 300);
    }
  };

  // Handle Modal Back Button
  const handleModalBack = () => {
    if (modalStep > 0) {
      setModalStep(prev => prev - 1);
    }
  };

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
    
    // Clear error on selection
    if (errors.homeAirport) {
        setErrors(prev => ({...prev, homeAirport: ''}));
    }
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

    // ✅ ADDED: Home City Validation
    if (!formData.homeAirport) {
        tempErrors.homeAirport = "Home City is required";
        isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
    
    if (file) {
      payload.append('profile_photo', file);
    }

    try {
      const response = await fetch('http://127.0.0.1:5001/api/update_profile', {
        method: 'POST',
        body: payload,
      });

      const result = await response.json();

      if (response.ok) {
        setStep(2);
      } else {
        alert(result.error || 'Failed to update profile.');
      }
    } catch (error) {
      console.error("Error submitting profile:", error);
      alert("Failed to connect to server.");
    }
  };

  // If we have advanced to Step 2, render Onboarding_2
  if (step === 2) {
    return (
      <Onboarding_2 
        onNext={onComplete} 
        onBack={() => setStep(1)} 
        homeCity={formData.homeAirport} 
      />
    );
  }

  // Otherwise render Step 1 (Pic and Socials/Bio)
  return (
    // ✅ CHANGED: Increased minHeight to 640px for consistency
    <div className="login-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '640px' }}>
      
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
          {firstName ? `${firstName}'s` : "Add Your"} Style
        </h2>
        <p className="auth-subtitle">
            Upload a profile picture and tell us about yourself.
        </p>
      </div>

      <form 
        onSubmit={handleSubmit} 
        className="auth-form" 
        noValidate 
        style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
      >
        
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
            </p>
          </div>

          {/* USERNAME AND DOB SIDE-BY-SIDE CONTAINER */}
          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            
            {/* USERNAME INPUT */}
            <div className="form-group" style={{ flex: 1 }}>
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
            <div className="form-group" style={{ flex: 1 }}>
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
            {/* ✅ UPDATED: Added error class logic */}
            <div className={`auth-input-wrapper ${errors.homeAirport ? 'error' : ''} ${focusedField === 'homeAirport' ? 'focused' : ''}`}>
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
            
            {/* ✅ ADDED: Error Message */}
            {errors.homeAirport && (
                <span className="error-msg" style={{color: '#FF2C2C', fontSize: '0.8rem', fontWeight: 600, marginLeft: '0.5rem'}}>
                    {errors.homeAirport}
                </span>
            )}

            {/* FLOATING DROPDOWN */}
            {isHomeSearchFocused && filteredHomeAirports.length > 0 && (
              <div className="city-dropdown">
                {filteredHomeAirports.map((city, index) => (
                  <div 
                    key={index} 
                    className="city-dropdown-item"
                    onMouseDown={() => handleSelectHomeAirport(city)}
                  >
                    <MapPin size={16} className="city-icon" style={{ marginRight: '10px', color: '#94a3b8' }} />
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
          style={{ marginTop: 'auto' }}
        >
          <span>Continue</span>
          <ArrowRight size={20} />
        </button>
      </form>

      {/* --- WELCOME MODAL (CAROUSEL) --- */}
      {showModal && (
        <div className={`welcome-modal-overlay ${isModalClosing ? 'closing' : ''}`}>
          <div 
            className={`welcome-modal-content ${isModalClosing ? 'closing' : ''}`}
            // Dynamically set image based on step
            style={{ backgroundImage: `url('${MODAL_IMAGES[modalStep]}')`, transition: 'background-image 0.4s ease-in-out' }}
          >
            {/* Gradient Overlay for Text Readability */}
            <div className="welcome-modal-gradient">
              <div className="welcome-text-container">
                
                {/* Modal Title/Subtitle */}
                <h2 className="welcome-title">{MODAL_CONTENT[modalStep].title}</h2>
                <p className="welcome-subtitle">
                  {MODAL_CONTENT[modalStep].subtitle}
                </p>

                {/* Dot Indicators */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  marginBottom: '1.5rem' 
                }}>
                  {MODAL_IMAGES.map((_, idx) => (
                    <div 
                      key={idx}
                      style={{
                        width: idx === modalStep ? '24px' : '8px',
                        height: '8px',
                        borderRadius: '4px',
                        backgroundColor: idx === modalStep ? '#ffffff' : 'rgba(255,255,255,0.4)',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </div>

                {/* Button Group */}
                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                  
                  {modalStep > 0 && (
                    <button
                      onClick={handleModalBack}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.3)',
                        padding: '0 1.25rem',
                        borderRadius: '50px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '1rem',
                        backdropFilter: 'blur(5px)',
                        transition: 'background 0.2s',
                        width: 'auto'
                      }}
                    >
                      <ChevronLeft size={24} />
                    </button>
                  )}

                  {/* Primary Button */}
                  <button 
                    className="welcome-button"
                    onClick={handleModalPrimary}
                    style={{ flex: 1 }}
                  >
                    {modalStep === MODAL_IMAGES.length - 1 ? "Let's Start" : "Continue"}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Onboarding_1;