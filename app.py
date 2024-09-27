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
            return results[0]  # Return the first result
    return None

def generate_instant_analysis(item):
    analysis = ""
    if item['media_type'] == 'tv':
        analysis += "Bu dizi, "
    else:
        analysis += "Bu film, "

    if item.get('vote_average', 0) >= 8.0:
        analysis += "izleyiciler tarafından oldukça beğenilen "
    elif item.get('vote_average', 0) >= 6.0:
        analysis += "izleyiciler tarafından genel olarak olumlu karşılanan "
    else:
        analysis += "izleyiciler arasında çeşitli tepkiler alan "

    genres = item.get('genre_ids', [])
    if 28 in genres:  # Action
        analysis += "aksiyon dolu sahneleriyle dikkat çeken "
    if 18 in genres:  # Drama
        analysis += "duygusal derinliği olan "
    if 35 in genres:  # Comedy
        analysis += "eğlenceli ve gülümseten "
    if 878 in genres:  # Science Fiction
        analysis += "geleceğe dair ilginç fikirler sunan "

    analysis += f"bir yapım. {item.get('vote_average', 0)} puanlık değerlendirmesiyle, "
    analysis += "izleyicilerin ilgisini çekmeyi başarıyor."

    return analysis

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search():
    query = request.json.get('query')
    
    result = search_external_api(query)
    
    if result:
        result['ai_analysis'] = generate_instant_analysis(result)
        return jsonify(result)
    
    return jsonify({'error': 'No results found'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
