import React from 'react';
import { Map, Marker } from 'pigeon-maps';
import { getAirportCoordinates } from '../utils/airportUtils';

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
        stroke="#0096a6"
        strokeWidth={3}
        strokeDasharray="8, 8"
        opacity={0.8}
      />
    </svg>
  );
};

const RouteMap = ({ originIATA, destinationIATA }) => {
  const origin = getAirportCoordinates(originIATA);
  const dest = getAirportCoordinates(destinationIATA);

  // DIAGNOSTIC: If data is missing, show a warning box instead of nothing
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
      height: '250px', 
      width: '100%', 
      borderRadius: '12px', 
      overflow: 'hidden', 
      border: '1px solid #e2e8f0', 
      marginTop: '1rem' 
    }}>
      <Map 
        height={250} 
        defaultCenter={[centerLat, centerLng]} 
        defaultZoom={3} 
        mouseEvents={false} 
        touchEvents={false}
      >
        <RouteLine coords={[[origin.lat, origin.lng], [dest.lat, dest.lng]]} />
        <Marker width={40} anchor={[origin.lat, origin.lng]} color="#004e5a" />
        <Marker width={40} anchor={[dest.lat, dest.lng]} color="#0096a6" />
      </Map>
    </div>
  );
};

export default RouteMap;