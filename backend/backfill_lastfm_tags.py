import time
import requests
from urllib.parse import urlencode

from app import app, db, Artist

LASTFM_URL = "https://ws.audioscrobbler.com/2.0/"
LASTFM_API_KEY = "b815462da6f9ac389158d977639c0cd8"


def parse_pipe_genres(genres_str: str | None) -> set[str]:
    """
    Converts '|dubstep|future bass|' -> {'dubstep', 'future bass'}
    Handles None/empty safely.
    """
    if not genres_str:
        return set()
    parts = [p.strip() for p in genres_str.split("|") if p.strip()]
    return set(parts)


def to_pipe_genres(genres_set: set[str]) -> str | None:
    """
    Converts {'dubstep','future bass'} -> '|dubstep|future bass|'
    Returns None if empty set (keeps DB clean).
    """
    if not genres_set:
        return None
    # stable output helps diffs/logging
    ordered = sorted(genres_set, key=lambda s: s.lower())
    return "|" + "|".join(ordered) + "|"


def lastfm_get_artist_tags(artist_name: str) -> list[str]:
    """
    Calls Last.fm artist.getinfo and returns tag names (lowercased as-is from API).
    """
    params = {
        "method": "artist.getinfo",
        "artist": artist_name,
        "api_key": LASTFM_API_KEY,
        "format": "json",
        # autocorrect=1 can help with minor spelling differences; optional
        "autocorrect": 1,
    }

    resp = requests.get(LASTFM_URL, params=params, timeout=30)

    # Handle basic rate limiting / transient errors gently
    if resp.status_code == 429:
        retry_after = int(resp.headers.get("Retry-After", "2"))
        time.sleep(retry_after)
        return []

    resp.raise_for_status()
    data = resp.json()

    # Expected structure from your payload:
    # data["artist"]["tags"]["tag"] -> list[{ "name": "..."}]
    artist_obj = data.get("artist") or {}
    tags_obj = artist_obj.get("tags") or {}
    tag_list = tags_obj.get("tag") or []

    tags = []
    if isinstance(tag_list, list):
        for t in tag_list:
            if isinstance(t, dict):
                name = t.get("name")
                if isinstance(name, str) and name.strip():
                    tags.append(name.strip())
    return tags


def main(batch_size: int = 200, sleep_ms: int = 150):
    """
    For each artist:
      - fetch Last.fm tags
      - compare vs current artists.genres (pipe delimited)
      - append any missing tags
    """
    with app.app_context():
        q = Artist.query.order_by(Artist.id.asc())
        total = q.count()
        print(f"Artists to process: {total}")

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

                try:
                    tags = lastfm_get_artist_tags(name)
                except requests.HTTPError as e:
                    # If Last.fm has no artist, it sometimes returns an error payload.
                    # We log and move on.
                    misses += 1
                    print(f"[MISS] {artist.id} '{name}' -> Last.fm error: {e}")
                    time.sleep(sleep_ms / 1000)
                    continue
                except Exception as e:
                    misses += 1
                    print(f"[MISS] {artist.id} '{name}' -> Unexpected error: {e}")
                    time.sleep(sleep_ms / 1000)
                    continue

                if not tags:
                    misses += 1
                    print(f"[NO TAGS] {artist.id} '{name}'")
                    time.sleep(sleep_ms / 1000)
                    continue

                existing = parse_pipe_genres(artist.genres)

                # Compare case-insensitively but preserve original tag text.
                # We'll treat 'Dubstep' and 'dubstep' as the same.
                existing_lower = {g.lower() for g in existing}

                new_tags = []
                for t in tags:
                    tl = t.lower()
                    if tl not in existing_lower:
                        new_tags.append(t)

                if not new_tags:
                    skipped += 1
                    print(f"[OK-NOCHANGE] {artist.id} '{name}'")
                    time.sleep(sleep_ms / 1000)
                    continue

                # Add missing tags
                for t in new_tags:
                    existing.add(t)

                artist.genres = to_pipe_genres(existing)
                db.session.add(artist)
                db.session.commit()

                updated += 1
                print(
                    f"[UPDATED] {artist.id} '{name}' -> added {len(new_tags)} tag(s): {new_tags}"
                )

                time.sleep(sleep_ms / 1000)

            offset += batch_size

        print(f"Done. Updated={updated}, Skipped={skipped}, Misses={misses}")


if __name__ == "__main__":
    main()
