import React from 'react';
import { Map } from 'pigeon-maps';
import { getAirportCoordinates } from '../utils/airportUtils';

// 1. THEME: CartoDB Light
const cartoProvider = (x, y, z, dpr) => {
  return `https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}.png`;
};

// 2. MARKER: TagMarker
const TagMarker = ({ left, top, style, code, subtext, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        transform: `translate(${left}px, ${top}px)`,
        cursor: onClick ? 'pointer' : 'default',
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
          {/* Main Code */}
          <div style={{ fontWeight: 'bold', fontSize: '14px', lineHeight: '1.2' }}>{code}</div>
          
          {/* Subtext */}
          <div style={{ fontSize: '10px', opacity: 0.8, lineHeight: '1.2' }}>{subtext}</div>

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

// 3. LINES: HubLines
const HubLines = ({ mapState, latLngToPixel, originCoords, destCoordsArray }) => {
  if (!originCoords || !destCoordsArray || destCoordsArray.length === 0) return null;

  const { width, height } = mapState;
  const [startX, startY] = latLngToPixel(originCoords);

  return (
    <svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      {destCoordsArray.map((dest, index) => {
        const [endX, endY] = latLngToPixel(dest);
        return (
          <line
            key={index}
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke="#ea580c"         
            strokeWidth={2}          
            strokeDasharray="10, 10" 
            strokeLinecap="round"
            opacity={0.6}
          />
        );
      })}
    </svg>
  );
};

const HubMap = ({ originIATA, destinations = [] }) => {
  const origin = getAirportCoordinates(originIATA);

  const validDestinations = destinations
    .map(d => {
      const coords = getAirportCoordinates(d.iata);
      return coords ? { ...d, ...coords } : null;
    })
    .filter(Boolean);

  if (!origin) return null;

  const destCoordsArray = validDestinations.map(d => [d.lat, d.lng]);

  return (
    <div style={{ 
      height: '100%', 
      width: '100%', 
      borderRadius: '12px', 
      overflow: 'hidden', 
      border: '1px solid #e2e8f0',
      background: '#f8fafc'
    }}>
      <Map 
        defaultCenter={[39, -96]} 
        defaultZoom={4}     // CHANGED: Zoom level 4 fits the US view perfectly
        provider={cartoProvider}
        mouseEvents={true}
        touchEvents={true}
      >
        <HubLines 
          originCoords={[origin.lat, origin.lng]} 
          destCoordsArray={destCoordsArray} 
        />
        
        <TagMarker 
          anchor={[origin.lat, origin.lng]} 
          code={originIATA} 
          subtext={origin.city || "Origin"} 
          style={{ zIndex: 20 }}
        />

        {validDestinations.map((dest) => (
          <TagMarker
            key={dest.iata}
            anchor={[dest.lat, dest.lng]}
            code={dest.iata}
            subtext={`$${dest.price}`} 
            style={{ zIndex: 10 }}
          />
        ))}
      </Map>
    </div>
  );
};

export default HubMap;