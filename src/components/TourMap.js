import React from 'react';
import { Map, Marker } from 'pigeon-maps';

// CartoDB Light theme provider
const cartoProvider = (x, y, z, dpr) => {
  return `https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}.png`;
};

// Simplified Pin for Events
const EventPin = ({ left, top, label }) => (
  <div style={{
    position: 'absolute',
    transform: `translate(${left}px, ${top}px)`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'default'
  }}>
    <div style={{
      transform: 'translate(-50%, -100%)',
      paddingBottom: '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        color: 'white',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '700',
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        position: 'relative'
      }}>
        {label}
        <div style={{
          position: 'absolute',
          bottom: '-4px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '5px solid #1a1a1a'
        }} />
      </div>
      <div style={{
        width: '10px',
        height: '10px',
        backgroundColor: 'white',
        border: '2px solid #0096a6', // Teal border for events
        borderRadius: '50%',
        marginTop: '2px'
      }} />
    </div>
  </div>
);

const TourMap = ({ events = [] }) => {
  // Filter for events with coordinates and parse them to numbers
  const validPins = events
    .filter(e => e.venue?.latitude && e.venue?.longitude)
    .map(e => ({
      id: e.id || Math.random(),
      lat: parseFloat(e.venue.latitude),
      lng: parseFloat(e.venue.longitude),
      label: e.venue.city || e.venue.name || 'Set'
    }));

  // Default to US center if no pins; otherwise center on the first pin
  const center = validPins.length > 0 
    ? [validPins[0].lat, validPins[0].lng] 
    : [39.82, -98.57];

  return (
    <div style={{ height: '100%', width: '100%', background: '#f8fafc' }}>
      <Map 
        defaultCenter={center} 
        defaultZoom={4} 
        provider={cartoProvider}
      >
        {validPins.map(pin => (
          <EventPin 
            key={pin.id} 
            anchor={[pin.lat, pin.lng]} 
            label={pin.label} 
          />
        ))}
      </Map>
    </div>
  );
};

export default TourMap;