import React from 'react';
import { Map } from 'pigeon-maps'; // Removed standard 'Marker' since we made a custom one
import { getAirportCoordinates } from '../utils/airportUtils';

// 1. THEME: Use CartoDB Light tiles for that clean gray look
const cartoProvider = (x, y, z, dpr) => {
  return `https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}.png`;
};

// 2. MARKER: Custom "Luggage Tag" style marker
const TagMarker = ({ left, top, style, code, city }) => {
  return (
    <div
      style={{
        position: "absolute",
        transform: `translate(${left}px, ${top}px)`,
        pointerEvents: "none",
        ...style,
      }}
    >
      {/* The visible tag container */}
      <div style={{
        transform: 'translate(-50%, -100%)', // Centers the bottom of the tag on the coordinate
        paddingBottom: '12px', // Space for the arrow/dot
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        
        {/* The Black Box */}
        <div style={{
          backgroundColor: '#1a1a1a',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          whiteSpace: 'nowrap',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', lineHeight: '1.2' }}>{code}</div>
          {/* If city data isn't available, we hide this line or repeat code */}
          <div style={{ fontSize: '10px', opacity: 0.8, lineHeight: '1.2' }}>{city || code}</div>

           {/* The little arrow pointing down */}
          <div style={{
            position: 'absolute',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0, 
            height: 0, 
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #1a1a1a',
          }} />
        </div>

        {/* The White/Orange Dot */}
        <div style={{
          width: '10px',
          height: '10px',
          backgroundColor: 'white',
          border: '2px solid #ea580c', // Orange border
          borderRadius: '50%',
          marginTop: '2px',
          zIndex: 1
        }} />
      </div>
    </div>
  );
};

// 3. LINE: Updated to be Orange and Dotted
const RouteLine = ({ mapState, latLngToPixel, coords }) => {
  if (coords.length < 2) return null;
  const { width, height } = mapState;
  const [start, end] = coords.map(coord => latLngToPixel(coord));

  return (
    <svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      <line
        x1={start[0]}
        y1={start[1]}
        x2={end[0]}
        y2={end[1]}
        stroke="#ea580c"       /* Changed to Burnt Orange */
        strokeWidth={3}
        strokeDasharray="10, 10" /* Looser dash for the 'flight path' look */
        strokeLinecap="round"
        opacity={0.8}
      />
    </svg>
  );
};

const RouteMap = ({ originIATA, destinationIATA }) => {
  const origin = getAirportCoordinates(originIATA);
  const dest = getAirportCoordinates(destinationIATA);

  // DIAGNOSTIC CHECK
  if (!origin || !dest) {
    return (
      <div style={{ 
        padding: '1rem', 
        background: '#fff3cd', 
        color: '#856404', 
        borderRadius: '8px', 
        border: '1px solid #ffeeba',
        marginTop: '1rem',
        textAlign: 'center'
      }}>
        <strong>Map Unavailable:</strong> Missing coordinates for 
        {!origin ? ` Origin (${originIATA})` : ''} 
        {!dest ? ` Destination (${destinationIATA})` : ''}
      </div>
    );
  }

  const centerLat = (origin.lat + dest.lat) / 2;
  const centerLng = (origin.lng + dest.lng) / 2;

  return (
    <div style={{ 
      height: '350px', // Increased height slightly for better visibility
      width: '100%', 
      borderRadius: '12px', 
      overflow: 'hidden', 
      border: '1px solid #e2e8f0', 
      marginTop: '1rem' 
    }}>
      <Map 
        height={350} 
        defaultCenter={[centerLat, centerLng]} 
        defaultZoom={4} // Zoomed out slightly to ensure tags fit
        provider={cartoProvider} // Applying the new theme
        mouseEvents={false} 
        touchEvents={false}
      >
        <RouteLine coords={[[origin.lat, origin.lng], [dest.lat, dest.lng]]} />
        
        {/* Replaced standard Markers with TagMarkers */}
        {/* Note: I added a check for origin.city in case your utility returns it. 
            If not, it defaults to showing the IATA code twice. */}
        <TagMarker 
          anchor={[origin.lat, origin.lng]} 
          code={originIATA} 
          city={origin.city} 
        />
        <TagMarker 
          anchor={[dest.lat, dest.lng]} 
          code={destinationIATA} 
          city={dest.city} 
        />
      </Map>
    </div>
  );
};

export default RouteMap;