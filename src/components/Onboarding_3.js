import React, { useState } from 'react';
import { Check } from 'lucide-react';
import './Onboarding_3.css';

import OnboardingGenreStep from './OnboardingGenreStep';
import OnboardingArtistStep from './OnboardingArtistStep';

function Onboarding_3({ onNext, onBack }) {
  // Step order: Genres -> Artists
  const [step, setStep] = useState('genres'); // 'genres' | 'artists'

  // Selections live here so they persist across steps
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);

  const MAX_SELECTION = 5;

  // Final submit (same endpoint + payload as your current Onboarding_3)
  const handleFinish = async () => {
    const email = localStorage.getItem('current_email');

    const artistIds = (selectedArtists || []).map(a => a.id).filter(Boolean);
    const genreIds = (selectedGenres || []).map(g => g.id).filter(Boolean);

    try {
      const response = await fetch('/api/save_favorite_artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          artist_ids: artistIds,
          genre_ids: genreIds,
        }),
      });

      if (response.ok) {
        if (onNext) onNext({ selectedArtists, selectedGenres });
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save preferences.');
      }
    } catch (error) {
      console.error('Error saving favorites:', error);
      alert('Server error. Please try again.');
    }
  };

  // Back behavior:
  // - If on Genres step, go back to Onboarding_2 (parent handler)
  // - If on Artists step, go back to Genres step
  const handleBack = () => {
    if (step === 'artists') {
      setStep('genres');
    } else {
      onBack && onBack();
    }
  };

  return (
    <div className="login-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '640px' }}>
      {/* Stepper */}
      <div className="stepper-container">
        <div className="step-item completed">
          <div className="step-circle">
            <Check size={18} strokeWidth={3} />
          </div>
        </div>

        <div className="step-line filled"></div>

        <div className="step-item completed">
          <div className="step-circle">
            <Check size={18} strokeWidth={3} />
          </div>
        </div>

        <div className="step-line filled"></div>

        <div className="step-item active">
          <div className="step-circle">3</div>
          <span className="step-label">Music</span>
        </div>

        <div className="step-line filled"></div>

        <div className={`step-item ${step === 'artists' ? 'active' : ''}`}>
          <div className="step-circle">4</div>
          <span className="step-label">{step === 'artists' ? 'Artists' : ''}</span>
        </div>
      </div>

      {/* Body */}
      {step === 'genres' ? (
        <OnboardingGenreStep
          selectedGenres={selectedGenres}
          setSelectedGenres={setSelectedGenres}
          onBack={handleBack}
          onNext={() => setStep('artists')}
          maxSelection={MAX_SELECTION}
        />
      ) : (
        <OnboardingArtistStep
          selectedArtists={selectedArtists}
          setSelectedArtists={setSelectedArtists}
          onBack={handleBack}
          onFinish={handleFinish}
          maxSelection={MAX_SELECTION}
        />
      )}
    </div>
  );
}

export default Onboarding_3;
