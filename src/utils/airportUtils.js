import airportData from '../data/FrontierDestinationInfo_numeric.json';

// Create lookup object
export const airportLookup = airportData.reduce((acc, airport) => {
  if (airport["IATA Code"]) {
    acc[airport["IATA Code"]] = {
      name: airport["Airport Name"],
      city: airport["City"],
      lat: airport["Latitude"],
      lng: airport["Longitude"],
    };
  }
  return acc;
}, {});

export const getAirportCoordinates = (iataCode) => {
  if (!iataCode) return null;
  // CLEAN THE INPUT: Force uppercase and remove spaces to ensure a match
  const code = iataCode.trim().toUpperCase();
  return airportLookup[code] || null;
};