import os
import time
import requests

from app import app, db, Artist

SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_SEARCH_URL = "https://api.spotify.com/v1/search"


def is_empty(val: str | None) -> bool:
    return val is None or (isinstance(val, str) and val.strip() == "")


def get_spotify_access_token() -> str:
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")

    if not client_id or not client_secret:
        raise RuntimeError("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET")

    resp = requests.post(
        SPOTIFY_TOKEN_URL,
        data={"grant_type": "client_credentials"},
        auth=(client_id, client_secret),
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def spotify_search_top_artist(token: str, query: str) -> dict | None:
    headers = {"Authorization": f"Bearer {token}"}
    params = {"q": query, "type": "artist", "limit": 1}

    resp = requests.get(SPOTIFY_SEARCH_URL, headers=headers, params=params, timeout=30)

    if resp.status_code == 401:
        return {"_error": "TOKEN_EXPIRED"}

    if resp.status_code == 429:
        retry_after = int(resp.headers.get("Retry-After", "2"))
        time.sleep(retry_after)
        return {"_error": "RATE_LIMIT"}

    resp.raise_for_status()
    data = resp.json()

    items = (data.get("artists") or {}).get("items") or []
    if not items:
        return None

    return items[0]


def first_image_url(artist_item: dict) -> str | None:
    images = artist_item.get("images") or []
    if not isinstance(images, list) or not images:
        return None
    first = images[0]
    if not isinstance(first, dict):
        return None
    url = first.get("url")
    return url.strip() if isinstance(url, str) and url.strip() else None


def main(batch_size: int = 200, sleep_ms: int = 120):
    token = get_spotify_access_token()

    with app.app_context():
        q = (
            Artist.query
            .filter((Artist.image_url.is_(None)) | (Artist.image_url == ""))
            .order_by(Artist.id.asc())
        )

        total = q.count()
        print(f"Artists missing image_url: {total}")

        offset = 0
        updated = 0
        skipped = 0
        misses = 0

        while True:
            batch = q.limit(batch_size).offset(offset).all()
            if not batch:
                break

            for artist in batch:
                name = artist.display_name  # EXACT, no manipulation
                if not name or not name.strip():
                    skipped += 1
                    print(f"[SKIP] {artist.id} -> empty display_name")
                    continue

                # Spotify lookup (retry on token expiry / rate limit)
                while True:
                    result = spotify_search_top_artist(token, name.strip())

                    if isinstance(result, dict) and result.get("_error") == "TOKEN_EXPIRED":
                        token = get_spotify_access_token()
                        continue

                    if isinstance(result, dict) and result.get("_error") == "RATE_LIMIT":
                        continue

                    break

                if not result:
                    misses += 1
                    print(f"[MISS] {artist.id} '{name}' -> no Spotify match")
                    time.sleep(sleep_ms / 1000)
                    continue

                img_url = first_image_url(result)
                if not img_url:
                    misses += 1
                    print(f"[NO IMAGE] {artist.id} '{name}' -> Spotify returned no images")
                    time.sleep(sleep_ms / 1000)
                    continue

                artist.image_url = img_url
                db.session.add(artist)
                db.session.commit()

                updated += 1
                print(f"[UPDATED] {artist.id} '{name}' -> image_url set")

                time.sleep(sleep_ms / 1000)

            offset += batch_size

        print(f"Done. Updated={updated}, Skipped={skipped}, Misses={misses}")


if __name__ == "__main__":
    main()
