import os
import json
import requests
from pathlib import Path

TINYFISH_API_KEY = os.getenv('TINYFISH_API_KEY')
SEARCH_ENDPOINT = 'https://api.search.tinyfish.ai'
FETCH_ENDPOINT = 'https://api.fetch.tinyfish.ai'

HEADERS = {'X-API-Key': TINYFISH_API_KEY} if TINYFISH_API_KEY else {}

def ensure_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)

def save_json(data, filepath: Path):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def search_spike(query: str, location: str = None, language: str = None):
    params = {'query': query}
    if location:
        params['location'] = location
    if language:
        params['language'] = language
    resp = requests.get(SEARCH_ENDPOINT, headers=HEADERS, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()

def fetch_spike(urls):
    payload = {
        "urls": urls,
        "format": "markdown",
        "ttl": 0
    }
    resp = requests.post(FETCH_ENDPOINT, headers=HEADERS, json=payload, timeout=120)
    resp.raise_for_status()
    return resp.json()

def main():
    fixture_dir = Path(__file__).parent.parent.parent / 'fixtures'
    ensure_dir(fixture_dir)
    # Example search
    try:
        search_res = search_spike('tinyfish API documentation')
        save_json(search_res, fixture_dir / 'tinyfish_search_example.json')
        print('Saved search fixture')
    except Exception as e:
        print('Search failed:', e)
    # Example fetch
    try:
        fetch_res = fetch_spike(['https://docs.tinyfish.ai/'])
        save_json(fetch_res, fixture_dir / 'tinyfish_fetch_example.json')
        print('Saved fetch fixture')
    except Exception as e:
        print('Fetch failed:', e)

if __name__ == '__main__':
    main()
