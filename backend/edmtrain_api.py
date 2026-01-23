import os
import requests
import logging

# Configure logger to match app style
logger = logging.getLogger(__name__)

class EDMTrainAPI:
    def __init__(self, client_key=None):
        # Allow passing key directly or fetching from environment
        self.client_key = client_key or os.environ.get('EDMTRAIN_CLIENT_KEY')
        self.base_url = "https://edmtrain.com/api"

        if not self.client_key:
            logger.warning("Warning: Missing EDMTRAIN_CLIENT_KEY")

    def _get(self, endpoint, params=None):
        """Internal helper to handle requests and authentication"""
        if not self.client_key:
            return {'error': 'EDMTrain API key not configured'}

        if params is None:
            params = {}
        
        # Always inject the client key
        params['client'] = self.client_key

        try:
            response = requests.get(f"{self.base_url}/{endpoint}", params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"EDMTrain API Request Error: {e}")
            return {'error': str(e), 'data': []}

    # ==========================================
    # Endpoint: GetLocations
    # ==========================================
    def get_locations(self):
        """Returns list of supported cities/states"""
        return self._get("locations")

    # ==========================================
    # Endpoint: GetVenue (Events by Venue)
    # ==========================================
    def get_venue_events(self, venue_ids):
        """
        Get events for specific venues.
        Args:
            venue_ids (str or int): Comma separated IDs or single ID
        """
        params = {'venueIds': venue_ids}
        return self._get("events", params)

    # ==========================================
    # Endpoint: GetNearbyEvents
    # ==========================================
    def get_nearby_events(self, latitude, longitude, state=None, start_date=None, end_date=None):
        """
        Get events near a specific coordinate.
        """
        params = {
            'latitude': latitude,
            'longitude': longitude
        }
        
        # Add optional filters if they exist
        if state:
            params['state'] = state
        if start_date:
            params['startDate'] = start_date
        if end_date:
            params['endDate'] = end_date

        return self._get("events", params)

    # ==========================================
    # Endpoint: singleArtistEvents
    # ==========================================
    def get_artist_events(self, artist_ids):
        """
        Get events for specific artists.
        Args:
            artist_ids (str or int): Comma separated IDs or single ID (e.g. 3776)
        """
        params = {'artistIds': artist_ids}
        return self._get("events", params)

    # ==========================================
    # Endpoint: singleCityEvents
    # ==========================================
    def get_city_events(self, location_ids, start_date=None, end_date=None):
        """
        Get events for a specific EDMTrain location ID.
        Args:
            location_ids (str or int): e.g. 81 (Atlanta)
        """
        params = {'locationIds': location_ids}
        
        if start_date:
            params['startDate'] = start_date
        if end_date:
            params['endDate'] = end_date
            
        return self._get("events", params)

    # ==========================================
    # Endpoint: GetTours
    # ==========================================
    def get_tours(self, include_electronic=True, include_other=False):
        """
        Get all tours.
        Note: This endpoint differs from the standard API (no /api/ prefix, no client key).
        """
        url = "https://edmtrain.com/get-tours"
        
        # Manually construct params to ensure lowercase 'true'/'false' matches screenshot
        params = {
            "includeElectronic": "true" if include_electronic else "false",
            "includeOther": "true" if include_other else "false"
        }

        try:
            # We use requests.get directly here because this endpoint 
            # does not share the same base_url or auth requirements
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"EDMTrain Tours Request Error: {e}")
            return {'error': str(e), 'data': []}    