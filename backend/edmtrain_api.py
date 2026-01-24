import os
import requests
import logging
import re
from typing import Any, Dict, Iterable, Optional, Union

# Configure logger to match app style
logger = logging.getLogger(__name__)

JsonDict = Dict[str, Any]
IdLike = Union[str, int]
IdListLike = Union[IdLike, Iterable[IdLike]]


class EDMTrainAPI:
    def __init__(self, client_key: Optional[str] = None):
        # Allow passing key directly or fetching from environment
        self.client_key = client_key or os.environ.get("EDMTRAIN_CLIENT_KEY")
        self.base_url = "https://edmtrain.com/api"

        if not self.client_key:
            logger.warning("Warning: Missing EDMTRAIN_CLIENT_KEY")

    def _get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> JsonDict:
        """Internal helper to handle requests and authentication"""
        if not self.client_key:
            return {"error": "EDMTrain API key not configured"}

        if params is None:
            params = {}

        # Always inject the client key
        params["client"] = self.client_key

        try:
            response = requests.get(f"{self.base_url}/{endpoint}", params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"EDMTrain API Request Error: {e}")
            return {"error": str(e), "data": []}

    # ==============================
    # Small param helpers
    # ==============================
    @staticmethod
    def _csv(value: Optional[IdListLike]) -> Optional[str]:
        """Turn 123 or [1,2,3] into '123' or '1,2,3'."""
        if value is None:
            return None
        if isinstance(value, (list, tuple, set)):
            return ",".join(str(v) for v in value)
        return str(value)

    @staticmethod
    def _bool_param(value: Optional[Union[bool, str, int]]) -> Optional[str]:
        """Normalize boolean-ish values to 'true'/'false' strings (EDMTrain style)."""
        if value is None:
            return None
        if isinstance(value, bool):
            return "true" if value else "false"
        v = str(value).strip().lower()
        if v in ("true", "false"):
            return v
        if v in ("1", "yes", "y", "t"):
            return "true"
        if v in ("0", "no", "n", "f"):
            return "false"
        return v  # passthrough if already a doc-acceptable string

    # ==========================================
    # Endpoint: GetLocations
    # ==========================================
    def get_locations(self, state: Optional[str] = None, city: Optional[str] = None) -> JsonDict:
        """Returns list of supported cities/states (optionally filtered)."""
        params: Dict[str, Any] = {}
        if state:
            params["state"] = state
        if city:
            params["city"] = city
        return self._get("locations", params if params else None)

    # ==========================================
    # Unified Endpoint: Events (search + nearby)
    # ==========================================
    def events(
        self,
        *,
        artist_ids: Optional[IdListLike] = None,
        venue_ids: Optional[IdListLike] = None,
        location_ids: Optional[IdListLike] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        state: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        event_name: Optional[str] = None,
        created_start_date: Optional[str] = None,
        created_end_date: Optional[str] = None,
        festival_ind: Optional[Union[bool, str, int]] = None,
        livestream_ind: Optional[Union[bool, str, int]] = None,
        include_electronic_genre_ind: Optional[Union[bool, str, int]] = None,
        include_other_genre_ind: Optional[Union[bool, str, int]] = None,
    ) -> JsonDict:
        """
        Unified event query.

        - Standard search uses: artistIds, venueIds, locationIds, startDate/endDate, eventName, createdStartDate/createdEndDate
        - Nearby search uses: latitude, longitude, (optional) state

        Notes:
        - IDs can be a single id (int/str) or an iterable (list/tuple/set) which becomes comma-separated.
        - Boolean-ish params are normalized to 'true'/'false' strings.
        """
        params: Dict[str, Any] = {}

        # IDs
        csv_artist = self._csv(artist_ids)
        if csv_artist:
            params["artistIds"] = csv_artist

        csv_venue = self._csv(venue_ids)
        if csv_venue:
            params["venueIds"] = csv_venue

        csv_location = self._csv(location_ids)
        if csv_location:
            params["locationIds"] = csv_location

        # Nearby (lat/long required together)
        if latitude is not None:
            params["latitude"] = latitude
        if longitude is not None:
            params["longitude"] = longitude
        if state:
            params["state"] = state

        # Date / name filters
        if start_date:
            params["startDate"] = start_date
        if end_date:
            params["endDate"] = end_date
        if event_name:
            params["eventName"] = event_name
        if created_start_date:
            params["createdStartDate"] = created_start_date
        if created_end_date:
            params["createdEndDate"] = created_end_date

        # Flags
        b = self._bool_param(festival_ind)
        if b is not None:
            params["festivalInd"] = b

        b = self._bool_param(livestream_ind)
        if b is not None:
            params["livestreamInd"] = b

        b = self._bool_param(include_electronic_genre_ind)
        if b is not None:
            params["includeElectronicGenreInd"] = b

        b = self._bool_param(include_other_genre_ind)
        if b is not None:
            params["includeOtherGenreInd"] = b

        return self._get("events", params if params else None)

    # ==========================================
    # Backwards-compatible wrappers (optional)
    # ==========================================
    def get_venue_events(self, venue_ids: IdListLike) -> JsonDict:
        """Get events for specific venues."""
        return self.events(venue_ids=venue_ids)

    def get_artist_events(self, artist_ids: IdListLike) -> JsonDict:
        """Get events for specific artists."""
        return self.events(artist_ids=artist_ids)

    def get_city_events(
        self, location_ids: IdListLike, start_date: Optional[str] = None, end_date: Optional[str] = None
    ) -> JsonDict:
        """Get events for a specific EDMTrain location ID (or list of IDs)."""
        return self.events(location_ids=location_ids, start_date=start_date, end_date=end_date)

    def get_nearby_events(
        self,
        latitude: float,
        longitude: float,
        state: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> JsonDict:
        """
        Get events near a specific coordinate.

        Kept signature compatible with your existing code.
        (If start/end are provided, they'll be forwarded to events().)
        """
        return self.events(
            latitude=latitude,
            longitude=longitude,
            state=state,
            start_date=start_date,
            end_date=end_date,
        )
    # ==========================================
    # Helper: Extract Event Image (Scraping)
    # ==========================================
    @staticmethod
    def extract_event_image(event_url: str) -> Optional[str]:
        """
        Scrapes the EDMTrain event page to find the og:image or twitter:image.
        Returns None if scraping fails or no image is found.
        """
        if not event_url:
            return None

        try:
            # Use a browser-like user agent to avoid being blocked
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            response = requests.get(event_url, headers=headers, timeout=5)
            response.raise_for_status()
            html = response.text

            match = re.search(
                r'<meta\s+(?:property=["\']og:image["\']|name=["\']twitter:image["\'])\s+content=["\']([^"\']+)["\']',
                html,
                re.IGNORECASE
            )
            return match.group(1) if match else None
        except Exception as e:
            logger.error(f"Error extracting image from {event_url}: {e}")
            return None
    
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
