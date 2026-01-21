import os
import time
import requests

from app import app, db, Artist


SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_SEARCH_URL = "https://api.spotify.com/v1/search"


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


def search_artist(token: str, artist_name: str) -> dict | None:
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "q": artist_name,   # EXACT display_name, no manipulation
        "type": "artist",
        "limit": 1,
    }

    resp = requests.get(
        SPOTIFY_SEARCH_URL,
        headers=headers,
        params=params,
        timeout=30,
    )

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


def format_genres(genres: list[str]) -> str | None:
    if not genres:
        return None
    cleaned = [g.strip() for g in genres if isinstance(g, str) and g.strip()]
    if not cleaned:
        return None
    return "|" + "|".join(cleaned) + "|"


def first_image_url(images: list[dict]) -> str | None:
    if not images or not isinstance(images, list):
        return None
    first = images[0]
    if not isinstance(first, dict):
        return None
    url = first.get("url")
    return url if isinstance(url, str) and url.strip() else None


def main(batch_size: int = 200, sleep_ms: int = 120):
    token = get_spotify_access_token()

    with app.app_context():
        q = (
            Artist.query
            .filter(Artist.spotify_id.is_(None))
            .order_by(Artist.id.asc())
        )

        print(f"Artists to update: {q.count()}")

        offset = 0
        updated = 0
        skipped = 0

        while True:
            batch = q.limit(batch_size).offset(offset).all()
            if not batch:
                break

            for artist in batch:
                name = artist.display_name

                if not name:
                    skipped += 1
                    print(f"[SKIP] {artist.id} -> empty display_name")
                    continue

                # Spotify lookup
                while True:
                    result = search_artist(token, name)

                    if isinstance(result, dict) and result.get("_error") == "TOKEN_EXPIRED":
                        token = get_spotify_access_token()
                        continue

                    if isinstance(result, dict) and result.get("_error") == "RATE_LIMIT":
                        continue

                    break

                if not result:
                    skipped += 1
                    print(f"[MISS] {artist.id} '{name}' -> no match")
                    continue

                spotify_id = result.get("id")
                genres_list = result.get("genres", [])
                images_list = result.get("images", [])

                # Prevent UNIQUE constraint crash
                existing = Artist.query.filter(
                    Artist.spotify_id == spotify_id
                ).first()

                if existing and existing.id != artist.id:
                    skipped += 1
                    print(
                        f"[DUPLICATE] {artist.id} '{name}' -> "
                        f"spotify_id already used by artist {existing.id}"
                    )
                    continue

                artist.spotify_id = spotify_id
                artist.genres = format_genres(genres_list)
                artist.image_url = first_image_url(images_list)

                db.session.add(artist)
                db.session.commit()

                updated += 1
                print(
                    f"[OK] {artist.id} '{name}' -> "
                    f"spotify_id={spotify_id}"
                )

                time.sleep(sleep_ms / 1000)

            offset += batch_size

        print(f"Done. Updated={updated}, Skipped={skipped}")


if __name__ == "__main__":
    main()
