// UPDATED: Correct filename (Info vs Information)
import airportData from '../data/FrontierDestinationInfo_numeric.json';

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
  return airportLookup[iataCode] || null;
};