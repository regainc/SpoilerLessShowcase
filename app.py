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
            # Limit overview to 150 characters
            if 'overview' in result:
                result['overview'] = result['overview'][:147] + '...' if len(result['overview']) > 150 else result['overview']
            
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
                    
                    # Add tagline for movies or name for TV shows
                    if result['media_type'] == 'movie':
                        result['tagline'] = genre_data.get('tagline', '')
                    else:
                        result['tagline'] = genre_data.get('name', '')
            
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

@app.route('/autocomplete', methods=['GET'])
def autocomplete():
    query = request.args.get('query', '')
    if len(query) < 2:
        return jsonify([])

    search_url = f"{TMDB_BASE_URL}/search/multi"
    params = {
        'api_key': TMDB_API_KEY,
        'query': query,
        'language': 'tr-TR'
    }
    response = requests.get(search_url, params=params)
    
    if response.status_code == 200:
        results = response.json()['results']
        suggestions = [result['title'] if 'title' in result else result['name'] for result in results[:5]]
        return jsonify(suggestions)
    
    return jsonify([])

@app.route('/details/<id>', methods=['GET'])
def get_details(id):
    media_type = request.args.get('media_type', 'movie')
    details_url = f"{TMDB_BASE_URL}/{media_type}/{id}"
    params = {
        'api_key': TMDB_API_KEY,
        'language': 'tr-TR'
    }
    response = requests.get(details_url, params=params)
    
    if response.status_code == 200:
        details = response.json()
        return jsonify(details)
    
    return jsonify({'error': 'Details not found'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
