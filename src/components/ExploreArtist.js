import React, { useEffect, useMemo, useState } from 'react';
import { Flame, Music, CloudMoon } from 'lucide-react';
import './ExploreArtist.css';

const API_BASE_URL = "";

const ExploreArtist = ({ onBack, onArtistClick }) => {
  const normalizeArtistForDetails = (a) => ({
    id: a?.id,
    name: a?.display_name || a?.name || a?.artist_name || '',
    display_name: a?.display_name || a?.name || a?.artist_name || '',
    edmtrain_id: a?.edmtrain_id ?? a?.edmtrainId ?? a?.edmtrainID ?? null,
    genres: a?.genres ?? null,
    image: a?.image || a?.image_url || a?.photo || a?.photo_url || null,
    image_url: a?.image_url || null,
  });

  const [loading, setLoading] = useState(false);
  const [dbArtists, setDbArtists] = useState([]);
  const [tourData, setTourData] = useState({});

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const artRes = await fetch(`${API_BASE_URL}/api/db_artists?limit=1000`);
        if (artRes.ok) {
          const json = await artRes.json();
          setDbArtists(json || []);
        }

        const tourRes = await fetch(`${API_BASE_URL}/api/edmtrain/tours`);
        if (tourRes.ok) {
          const json = await tourRes.json();
          const map = json?.data?.artistIdEventCountMap || {};
          setTourData(map);
        }
      } catch (err) {
        console.error('Failed to initialize ExploreArtist data', err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  const heavyBassKeywords = useMemo(() => (['tearout', 'dubstep', 'riddim']), []);
  const houseHeadsKeywords = useMemo(() => (['tech house', 'melodic house']), []);
  const sadboiFeelsKeywords = useMemo(() => (['future bass']), []);

  const MAX_PER_GROUP = 15;

  const genreTextLower = (artist) => {
    const g = artist?.genres;
    const text = Array.isArray(g) ? g.join(' ') : (g ?? '').toString();
    return text.toLowerCase();
  };

  const hasAnyGenreKeyword = (artist, keywords) => {
    const lower = genreTextLower(artist);
    return keywords.some((k) => lower.includes(k));
  };

  const applyCountsSortAndLimit = (artists) => {
    const processed = (artists || []).map((localArtist) => {
      const count = tourData?.[localArtist.edmtrain_id] || 0;
      return { ...localArtist, eventCount: count };
    });

    processed.sort((a, b) => (b.eventCount || 0) - (a.eventCount || 0));
    return processed.slice(0, MAX_PER_GROUP);
  };

  const heavyBassArtists = useMemo(() => {
    const filtered = (dbArtists || []).filter((a) =>
      hasAnyGenreKeyword(a, heavyBassKeywords)
    );
    return applyCountsSortAndLimit(filtered);
  }, [dbArtists, tourData, heavyBassKeywords]);

  const houseHeadsArtists = useMemo(() => {
    const filtered = (dbArtists || []).filter((a) =>
      hasAnyGenreKeyword(a, houseHeadsKeywords)
    );
    return applyCountsSortAndLimit(filtered);
  }, [dbArtists, tourData, houseHeadsKeywords]);

  const sadboiFeelsArtists = useMemo(() => {
    const filtered = (dbArtists || []).filter((a) =>
      hasAnyGenreKeyword(a, sadboiFeelsKeywords)
    );
    return applyCountsSortAndLimit(filtered);
  }, [dbArtists, tourData, sadboiFeelsKeywords]);

  const renderArtistCard = (artist) => (
    <div
      key={artist.id}
      className="explore-card artist-card fade-in"
      role="button"
      tabIndex={0}
      onClick={() => onArtistClick?.(normalizeArtistForDetails(artist))}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onArtistClick?.(normalizeArtistForDetails(artist));
        }
      }}
    >
      <div
        className="explore-card-bg"
        style={{
          backgroundImage: artist.image_url ? `url(${artist.image_url})` : undefined,
          backgroundColor: '#0f172a',
        }}
      />
      <div className="explore-card-overlay" />

      <div className="artist-card-center-overlay">
        <h3 className="artist-card-name">{artist.display_name}</h3>

        {artist.eventCount > 0 && (
          <div className="artist-card-count">
            {artist.eventCount} EVENTS
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="dashboard-panel full explore-events-container">
      <div className="explore-header">
        <div className="explore-title-row">
          <h3 className="section-title">
            <span>EXPLORE </span>
            <span className="accent">ARTISTS</span>
          </h3>
        </div>
      </div>

      <div className="explore-content-scroll">
        {loading && (
          <div className="explore-loading">
            <div className="spinner" />
            <p>Loading artists...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* HEAVY BASS */}
            <div className="artist-section">
              <div className="artist-rail-header">
                <div className="artist-rail-title-row">
                  <div className="icon-badge icon-badge--red" aria-hidden="true">
                    <Flame size={20} />
                  </div>

                  <div className="artist-rail-text">
                    <h4 className="artist-rail-title">
                      <span>HEAVY </span>
                      <span className="accent">BASS</span>
                    </h4>
                    <div className="artist-rail-subtitle">
                      Hard-hitting low end for the rail-riders and headbangers
                    </div>
                  </div>
                </div>
              </div>

              <div className="explore-horizontal-scroll" role="list" aria-label="Heavy Bass Artists">
                {heavyBassArtists.map(renderArtistCard)}
              </div>

              {heavyBassArtists.length === 0 && (
                <div className="explore-empty">
                  No artists found with genres containing Tearout, Dubstep, or Riddim.
                </div>
              )}
            </div>

            {/* HOUSE HEADS */}
            <div className="artist-section">
              <div className="artist-rail-header">
                <div className="artist-rail-title-row">
                  <div className="icon-badge icon-badge--blue" aria-hidden="true">
                    <Music size={20} />
                  </div>

                  <div className="artist-rail-text">
                    <h4 className="artist-rail-title">
                      <span>HOUSE </span>
                      <span className="accent">HEADS</span>
                    </h4>
                    <div className="artist-rail-subtitle">
                      Happy and soulful grooves for the shuffle and dance crew
                    </div>
                  </div>
                </div>
              </div>

              <div className="explore-horizontal-scroll" role="list" aria-label="House Heads Artists">
                {houseHeadsArtists.map(renderArtistCard)}
              </div>

              {houseHeadsArtists.length === 0 && (
                <div className="explore-empty">
                  No artists found with genres containing Tech House or Melodic House.
                </div>
              )}
            </div>

            {/* SADBOI FEELS */}
            <div className="artist-section">
              <div className="artist-rail-header">
                <div className="artist-rail-title-row">
                  <div className="icon-badge icon-badge--yellow" aria-hidden="true">
                    <CloudMoon size={20} />
                  </div>

                  <div className="artist-rail-text">
                    <h4 className="artist-rail-title">
                      <span>SADBOI </span>
                      <span className="accent">FEELS</span>
                    </h4>
                    <div className="artist-rail-subtitle">
                      Emotional melodic drops for a proper mid-set cry-bang
                    </div>
                  </div>
                </div>
              </div>

              <div className="explore-horizontal-scroll" role="list" aria-label="Sadboi Feels Artists">
                {sadboiFeelsArtists.map(renderArtistCard)}
              </div>

              {sadboiFeelsArtists.length === 0 && (
                <div className="explore-empty">
                  No artists found with genres containing Future Bass.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExploreArtist;