import os
from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

TMDB_API_KEY = os.environ.get('TMDB_API_KEY')
TMDB_BASE_URL = "https://api.themoviedb.org/3"

def generate_custom_description(title, media_type):
    descriptions = {
        "Game of Thrones": "Yedi krallığın kontrolü için mücadele eden aileler, entrikalar, savaşlar ve ejderhalar. Epik bir fantezi dünyasında geçen bu dizi, izleyiciyi büyüleyici bir maceraya sürüklüyor.",
        "Stranger Things": "1980'lerde geçen bu dizi, küçük bir kasabada kaybolan bir çocuğu arayan arkadaşlarının, doğaüstü güçlere sahip gizemli bir kızla tanışmasını konu alıyor.",
        "Breaking Bad": "Kanser teşhisi konan bir kimya öğretmeninin, ailesinin geleceğini güvence altına almak için uyuşturucu işine girmesini anlatan, gerilim dolu bir dizi.",
        "The Crown": "İngiliz Kraliyet ailesinin yaşamını ve kraliçe II. Elizabeth'in hükümdarlığını konu alan tarihi bir drama.",
        "Black Mirror": "Teknolojinin insan hayatı üzerindeki karanlık ve beklenmedik etkilerini işleyen, her bölümü bağımsız bir hikaye anlatan bilim kurgu antoloji dizisi.",
        "Inception": "Rüyalara girip bilinçaltından bilgi çalabilen bir hırsızın, bir CEO'nun zihnine bir fikir yerleştirme görevini konu alan, zihin bükücü bir bilim kurgu filmi.",
        "The Shawshank Redemption": "Haksız yere müebbet hapse mahkum edilen bir bankacının, hapishane yaşamı ve özgürlük arayışını anlatan, umut ve dostluk temalı bir dram filmi.",
        "Pulp Fiction": "İç içe geçmiş hikayeleriyle, Los Angeles'ın yeraltı dünyasından çeşitli karakterlerin hayatlarını konu alan, kült statüsüne ulaşmış bir suç filmi.",
        "The Matrix": "Gerçek dünyanın aslında bir simülasyon olduğunu keşfeden bir bilgisayar programcısının, insanlığı kurtarma mücadelesini anlatan devrim niteliğinde bir bilim kurgu filmi.",
        "Forrest Gump": "Saf ve iyi kalpli bir adamın, 20. yüzyılın önemli olaylarına tanıklık ederken yaşadığı olağanüstü hayat hikayesini anlatan, duygu yüklü bir komedi-dram filmi."
    }
    return descriptions.get(title, f"Bu {'dizi' if media_type == 'tv' else 'film'} hakkında kısa ve spoiler içermeyen bir açıklama.")

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
            # Replace the overview with a custom, spoiler-free description
            result['overview'] = generate_custom_description(result.get('title') or result.get('name'), result['media_type'])
            
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
