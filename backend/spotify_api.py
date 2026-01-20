import os
import time
import base64
import requests


class SpotifyAPI:
    """
    Spotify API wrapper using Client Credentials flow.
    Safe to import even if Spotify env vars are missing.
    """

    TOKEN_URL = "https://accounts.spotify.com/api/token"
    API_BASE = "https://api.spotify.com/v1"

    def __init__(self):
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID")
        self.client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")

        self.access_token = None
        self.token_expires_at = 0

    # ----------------------------------------------------
    # INTERNAL HELPERS
    # ----------------------------------------------------

    def _require_credentials(self):
        if not self.client_id or not self.client_secret:
            raise RuntimeError(
                "Spotify API credentials missing. "
                "Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET."
            )

    def _get_access_token(self):
        """
        Fetches or reuses a valid Spotify access token
        """
        self._require_credentials()

        now = int(time.time())
        if self.access_token and now < self.token_expires_at:
            return self.access_token

        auth_string = f"{self.client_id}:{self.client_secret}"
        auth_base64 = base64.b64encode(auth_string.encode("utf-8")).decode("utf-8")

        headers = {
            "Authorization": f"Basic {auth_base64}",
            "Content-Type": "application/x-www-form-urlencoded",
        }

        data = {"grant_type": "client_credentials"}

        response = requests.post(
            self.TOKEN_URL,
            headers=headers,
            data=data,
            timeout=15,
        )

        if response.status_code != 200:
            raise RuntimeError(f"Spotify token error: {response.text}")

        payload = response.json()
        self.access_token = payload.get("access_token")
        expires_in = int(payload.get("expires_in", 3600))

        self.token_expires_at = now + expires_in - 60
        return self.access_token

    def _headers(self):
        return {
            "Authorization": f"Bearer {self._get_access_token()}"
        }

    # ----------------------------------------------------
    # PUBLIC API METHODS
    # ----------------------------------------------------

    def search_artist(self, query, limit=1):
        """
        GET /v1/search
        """
        if not query:
            return []

        params = {
            "q": query,
            "type": "artist",
            "limit": limit
        }

        response = requests.get(
            f"{self.API_BASE}/search",
            headers=self._headers(),
            params=params,
            timeout=15,
        )

        if response.status_code != 200:
            raise RuntimeError(f"Spotify search error: {response.text}")

        items = response.json().get("artists", {}).get("items", [])
        results = []

        for artist in items:
            image_url = artist["images"][0]["url"] if artist.get("images") else None

            results.append({
                "id": artist.get("id"),
                "name": artist.get("name"),
                "genres": artist.get("genres", []),
                "popularity": artist.get("popularity"),
                "followers": artist.get("followers", {}).get("total"),
                "image_url": image_url,
            })

        return results

    def get_artist_info(self, artist_id):
        """
        GET /v1/artists/{artist_id}
        """
        if not artist_id:
            raise ValueError("artist_id is required")

        response = requests.get(
            f"{self.API_BASE}/artists/{artist_id}",
            headers=self._headers(),
            timeout=15,
        )

        if response.status_code != 200:
            raise RuntimeError(f"Spotify artist error: {response.text}")

        artist = response.json()
        image_url = artist["images"][0]["url"] if artist.get("images") else None

        return {
            "id": artist.get("id"),
            "name": artist.get("name"),
            "genres": artist.get("genres", []),
            "popularity": artist.get("popularity"),
            "followers": artist.get("followers", {}).get("total"),
            "image_url": image_url,
            "spotify_url": artist.get("external_urls", {}).get("spotify"),
        }
