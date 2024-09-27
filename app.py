import os
from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

TMDB_API_KEY = os.environ.get('TMDB_API_KEY')
TMDB_BASE_URL = "https://api.themoviedb.org/3"

def search_external_api(query):
    search_url = f"{TMDB_BASE_URL}/search/multi"
    params = {
        'api_key': TMDB_API_KEY,
        'query': query,
        'language': 'tr-TR'
    }
    response = requests.get(search_url, params=params)
    if response.status_code == 200:
        results = response.json()['results']
        if results:
            result = results[0]
            # Increase overview character limit to 560
            if 'overview' in result:
                result['overview'] = (result['overview'][:557] + '...') if len(result['overview']) > 560 else result['overview']
            
            # Include genre information
            if result['media_type'] in ['movie', 'tv']:
                genre_url = f"{TMDB_BASE_URL}/{result['media_type']}/{result['id']}"
                genre_params = {
                    'api_key': TMDB_API_KEY,
                    'language': 'tr-TR'
                }
                genre_response = requests.get(genre_url, params=genre_params)
                if genre_response.status_code == 200:
                    genre_data = genre_response.json()
                    result['genres'] = [genre['name'] for genre in genre_data.get('genres', [])]
            
            return result
    return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search():
    query = request.json.get('query')
    
    result = search_external_api(query)
    
    if result:
        return jsonify(result)
    
    return jsonify({'error': 'No results found'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
