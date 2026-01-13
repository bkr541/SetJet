import React from 'react';
import { Map } from 'pigeon-maps'; 
import { getAirportCoordinates } from '../utils/airportUtils';

// --- HELPER FUNCTIONS ---

// 1. THEME: Use CartoDB Light tiles
const cartoProvider = (x, y, z, dpr) => {
  return `https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}.png`;
};

// 2. MATH: Calculate distance in miles between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// 3. ZOOM LOGIC: Determine best zoom based on distance
const getSmartZoom = (miles) => {
  if (miles < 400) return 6;  // Close neighbors (e.g. ATL -> CLT)
  if (miles < 1000) return 5; // Regional (e.g. ATL -> MIA)
  if (miles < 2200) return 4; // Mid-Long (e.g. ATL -> LAS)
  return 3;                   // Cross Country (e.g. MIA -> SEA)
};

// --- COMPONENTS ---

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
      <div style={{
        transform: 'translate(-50%, -100%)', 
        paddingBottom: '12px', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
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
          <div style={{ fontSize: '10px', opacity: 0.8, lineHeight: '1.2' }}>{city || code}</div>
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
        <div style={{
          width: '10px',
          height: '10px',
          backgroundColor: 'white',
          border: '2px solid #ea580c',
          borderRadius: '50%',
          marginTop: '2px',
          zIndex: 1
        }} />
      </div>
    </div>
  );
};

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
        stroke="#ea580c"
        strokeWidth={3}
        strokeDasharray="10, 10"
        strokeLinecap="round"
        opacity={0.8}
      />
    </svg>
  );
};

// --- MAIN COMPONENT ---

const RouteMap = ({ originIATA, destinationIATA }) => {
  const origin = getAirportCoordinates(originIATA);
  const dest = getAirportCoordinates(destinationIATA);

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
        <strong>Map Unavailable:</strong> Missing coordinates.
      </div>
    );
  }

  // Calculate Center
  const centerLat = (origin.lat + dest.lat) / 2;
  const centerLng = (origin.lng + dest.lng) / 2;

  // Calculate Distance & Zoom
  const distanceMiles = calculateDistance(origin.lat, origin.lng, dest.lat, dest.lng);
  const smartZoom = getSmartZoom(distanceMiles);

  return (
    <div style={{ 
      height: '180px', 
      width: '100%', 
      borderRadius: '12px', 
      overflow: 'hidden', 
      border: '1px solid #e2e8f0', 
      marginTop: '1rem' 
    }}>
      <Map 
        key={`${originIATA}-${destinationIATA}`} // Forces re-render when route changes to apply new zoom
        height={180} 
        defaultCenter={[centerLat, centerLng]} 
        defaultZoom={smartZoom} // Using our dynamic zoom
        provider={cartoProvider} 
        mouseEvents={false} 
        touchEvents={false}
      >
        <RouteLine coords={[[origin.lat, origin.lng], [dest.lat, dest.lng]]} />
        
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