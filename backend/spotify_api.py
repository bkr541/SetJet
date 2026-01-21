"""
Spotify API integration
Supports:
- searchArtist
- getArtist

Uses Client Credentials Flow
"""

import os
import time
import base64
import requests


class SpotifyAPI:
    def __init__(self, client_id=None, client_secret=None):
        # ✅ CHANGED: Accept optional params, fallback to env vars
        self.client_id = client_id or os.getenv("SPOTIFY_CLIENT_ID")
        self.client_secret = client_secret or os.getenv("SPOTIFY_CLIENT_SECRET")

        if not self.client_id or not self.client_secret:
            # We don't raise error immediately to allow app to start even if credentials missing
            print("Warning: Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET")

        self.token = None
        self.token_expires_at = 0

        self.accounts_url = "https://accounts.spotify.com/api/token"
        self.api_base = "https://api.spotify.com/v1"

    # ------------------------------------------------------------------
    # Token Handling (Client Credentials)
    # ------------------------------------------------------------------
    def _get_token(self):
        if not self.client_id or not self.client_secret:
            raise ValueError("Spotify credentials not configured.")

        now = int(time.time())

        # Reuse token if still valid
        if self.token and now < self.token_expires_at - 30:
            return self.token

        auth_header = base64.b64encode(
            f"{self.client_id}:{self.client_secret}".encode()
        ).decode()

        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded",
        }

        data = {"grant_type": "client_credentials"}

        response = requests.post(self.accounts_url, headers=headers, data=data)
        response.raise_for_status()

        payload = response.json()
        self.token = payload["access_token"]
        self.token_expires_at = now + payload.get("expires_in", 3600)

        return self.token

    # ✅ ADDED: Public method to prefetch token
    def prefetch_token(self):
        try:
            token = self._get_token()
            return {
                "access_token": token, 
                "expires_at": self.token_expires_at,
                "ready": True
            }
        except Exception as e:
            print(f"Spotify Prefetch Error: {e}")
            return False

    def _headers(self):
        return {
            "Authorization": f"Bearer {self._get_token()}",
            "Content-Type": "application/json",
        }

    # ------------------------------------------------------------------
    # Spotify: Search Artist
    # GET /v1/search?q=&type=artist&limit=
    # ------------------------------------------------------------------
    def search_artist(self, query, limit=1):
        if not query:
            return []

        params = {
            "q": query,
            "type": "artist",
            "limit": limit,
        }

        response = requests.get(
            f"{self.api_base}/search",
            headers=self._headers(),
            params=params,
        )
        response.raise_for_status()

        data = response.json()
        artists = data.get("artists", {}).get("items", [])

        # Bubble-friendly, flattened output
        results = []
        for artist in artists:
            images = artist.get("images", [])
            results.append(
                {
                    "artist_id": artist.get("id"),
                    "name": artist.get("name"),
                    "genres": artist.get("genres", []),
                    "popularity": artist.get("popularity"),
                    "followers": artist.get("followers", {}).get("total"),
                    "image_url": images[0]["url"] if images else None,
                    "spotify_url": artist.get("external_urls", {}).get("spotify"),
                }
            )

        return results

    # ------------------------------------------------------------------
    # Spotify: Get Artist Info
    # GET /v1/artists/{artist_id}
    # ------------------------------------------------------------------
    def get_artist(self, artist_id):
        if not artist_id:
            return None

        response = requests.get(
            f"{self.api_base}/artists/{artist_id}",
            headers=self._headers(),
        )
        response.raise_for_status()

        artist = response.json()
        images = artist.get("images", [])

        return {
            "artist_id": artist.get("id"),
            "name": artist.get("name"),
            "genres": artist.get("genres", []),
            "popularity": artist.get("popularity"),
            "followers": artist.get("followers", {}).get("total"),
            "image_url": images[0]["url"] if images else None,
            "spotify_url": artist.get("external_urls", {}).get("spotify"),
        }