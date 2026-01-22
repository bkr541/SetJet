import time
import requests

from app import app, db, Artist

LASTFM_URL = "https://ws.audioscrobbler.com/2.0/"
LASTFM_API_KEY = "b815462da6f9ac389158d977639c0cd8"


def is_empty(val: str | None) -> bool:
    return val is None or (isinstance(val, str) and val.strip() == "")


def lastfm_get_extralarge_image_url(artist_name: str) -> str | None:
    """
    Calls Last.fm artist.getinfo and returns the image '#text' for size='extralarge'.
    Response shape matches your sample: data['artist']['image'] is a list of dicts
    with keys '#text' and 'size'. :contentReference[oaicite:2]{index=2}
    """
    params = {
        "method": "artist.getinfo",
        "artist": artist_name,
        "api_key": LASTFM_API_KEY,
        "format": "json",
        "autocorrect": 1,
    }

    resp = requests.get(LASTFM_URL, params=params, timeout=30)

    if resp.status_code == 429:
        retry_after = int(resp.headers.get("Retry-After", "2"))
        time.sleep(retry_after)
        return None

    resp.raise_for_status()
    data = resp.json()

    artist_obj = data.get("artist") or {}
    images = artist_obj.get("image") or []

    if not isinstance(images, list):
        return None

    for img in images:
        if not isinstance(img, dict):
            continue
        if img.get("size") == "extralarge":
            url = img.get("#text")
            if isinstance(url, str) and url.strip():
                return url.strip()

    # Fallback: sometimes 'extralarge' might be missing; try 'mega'
    for img in images:
        if isinstance(img, dict) and img.get("size") == "mega":
            url = img.get("#text")
            if isinstance(url, str) and url.strip():
                return url.strip()

    return None


def main(batch_size: int = 200, sleep_ms: int = 150):
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
                name = (artist.display_name or "").strip()
                if not name:
                    skipped += 1
                    print(f"[SKIP] {artist.id} -> empty display_name")
                    continue

                # If it got updated earlier in this run (rare but safe)
                if not is_empty(artist.image_url):
                    skipped += 1
                    print(f"[SKIP] {artist.id} '{name}' -> already has image_url")
                    continue

                try:
                    img_url = lastfm_get_extralarge_image_url(name)
                except requests.HTTPError as e:
                    misses += 1
                    print(f"[MISS] {artist.id} '{name}' -> Last.fm HTTP error: {e}")
                    time.sleep(sleep_ms / 1000)
                    continue
                except Exception as e:
                    misses += 1
                    print(f"[MISS] {artist.id} '{name}' -> Unexpected error: {e}")
                    time.sleep(sleep_ms / 1000)
                    continue

                if not img_url:
                    misses += 1
                    print(f"[NO IMAGE] {artist.id} '{name}' -> no extralarge image")
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
