// Onboarding_1.js
import React, { useState, useEffect } from 'react';
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
import Onboarding_2 from './Onboarding_2'; 
import Onboarding_3 from './Onboarding_3'; // ✅ ADDED

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
    subtitle: "SetJet is made to simplify doing one thing - find a set you can't miss, then get you there"
  },
  {
    title: "Designed For You",
    subtitle: "Give SetJet some information about you and watch it tailor your experiences"
  },
  {
    title: "Explore New Sets In New Places",
    subtitle: "Get detailed information on thousands of sets, with custom itineraries on how to get there."
  },
  {
    title: "Your Music, Your Style",
    subtitle: "Customize your music taste with your favorite artists, genres, and more."
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
  
  // State for Flow Navigation (1 = Pic/Bio, 2 = Flights, 3 = Music)
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

  // ✅ NEW: Suggestions from DB locations table
  const [homeSuggestions, setHomeSuggestions] = useState([]);

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
          
          // Populate all fields if data exists
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

  // ✅ NEW: Fetch home city suggestions from DB when user types
  useEffect(() => {
    const q = formData.homeAirport;

    if (!q || q.length < 2) {
      setHomeSuggestions([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const url = `http://127.0.0.1:5001/api/db_locations?keyword=${encodeURIComponent(q)}&limit=25`;
        const res = await fetch(url);
        const data = await res.json();
        setHomeSuggestions(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error fetching locations:", e);
        setHomeSuggestions([]);
      }
    }, 150);

    return () => clearTimeout(t);
  }, [formData.homeAirport]);

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

  // ✅ UPDATED: Works with DB rows
  const handleSelectHomeAirport = (loc) => {
    const locationStr = (loc && (loc.displayLabel || loc.name)) ? (loc.displayLabel || loc.name) : '';
    
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

  // ✅ STEP 2: Flights
  if (step === 2) {
    return (
      <Onboarding_2 
        onNext={() => setStep(3)} // Move to Step 3 instead of completing
        onBack={() => setStep(1)} 
        homeCity={formData.homeAirport} 
      />
    );
  }

  // ✅ STEP 3: Music (Complete on success)
  if (step === 3) {
    return (
      <Onboarding_3
        onNext={onComplete} 
        onBack={() => setStep(2)}
      />
    );
  }

  // Otherwise render Step 1 (Pic and Socials/Bio)
  return (
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
            
            {errors.homeAirport && (
                <span className="error-msg" style={{color: '#FF2C2C', fontSize: '0.8rem', fontWeight: 600, marginLeft: '0.5rem'}}>
                    {errors.homeAirport}
                </span>
            )}

            {/* FLOATING DROPDOWN */}
            {isHomeSearchFocused && homeSuggestions.length > 0 && (
              <div className="city-dropdown">
                {homeSuggestions.map((loc) => (
                  <div 
                    key={loc.id || (loc.displayLabel || loc.name)} 
                    className="city-dropdown-item"
                    onMouseDown={() => handleSelectHomeAirport(loc)}
                  >
                    <MapPin size={16} className="city-icon" style={{ marginRight: '10px', color: '#94a3b8' }} />
                    <div className="city-main">
                      {loc.displayLabel || loc.name}
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
            style={{ backgroundImage: `url('${MODAL_IMAGES[modalStep]}')`, transition: 'background-image 0.4s ease-in-out' }}
          >
            <div className="welcome-modal-gradient">
              <div className="welcome-text-container">
                
                <h2 className="welcome-title">{MODAL_CONTENT[modalStep].title}</h2>
                <p className="welcome-subtitle">
                  {MODAL_CONTENT[modalStep].subtitle}
                </p>

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
