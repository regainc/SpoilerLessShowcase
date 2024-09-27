import os
from flask import Flask, render_template, request, jsonify
import requests
from urllib.parse import urljoin

app = Flask(__name__)
app.config.from_object('config')

TMDB_API_KEY = os.environ.get('TMDB_API_KEY')
TMDB_BASE_URL = 'https://api.themoviedb.org/3/'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search():
    query = request.json.get('query')
    
    # Search for movies and TV shows
    search_url = urljoin(TMDB_BASE_URL, 'search/multi')
    params = {
        'api_key': TMDB_API_KEY,
        'query': query,
        'language': 'en-US',
        'page': 1,
        'include_adult': 'false'
    }
    
    response = requests.get(search_url, params=params)
    data = response.json()
    
    if response.status_code == 200 and data['results']:
        result = data['results'][0]  # Get the first result
        
        # Fetch additional details based on media type
        if result['media_type'] in ['movie', 'tv']:
            details_url = urljoin(TMDB_BASE_URL, f"{result['media_type']}/{result['id']}")
            details_params = {
                'api_key': TMDB_API_KEY,
                'language': 'en-US'
            }
            details_response = requests.get(details_url, params=details_params)
            details = details_response.json()
            
            # Prepare the response
            response_data = {
                'title': details.get('title') or details.get('name'),
                'overview': details.get('overview'),
                'poster_path': f"https://image.tmdb.org/t/p/w500{details.get('poster_path')}",
                'rating': details.get('vote_average'),
                'type': 'Movie' if result['media_type'] == 'movie' else 'TV Show',
                'genres': [genre['name'] for genre in details.get('genres', [])]
            }
            
            return jsonify(response_data)
    
    return jsonify({'error': 'No results found'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
