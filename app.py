import json
from flask import Flask, render_template, request, jsonify, send_from_directory
import os

app = Flask(__name__)

def load_data():
    with open('data.json', 'r') as f:
        return json.load(f)

def search_local_data(query):
    data = load_data()
    query = query.lower()
    for item in data['items']:
        if query in item['title'].lower():
            return item
    return None

def generate_ai_analysis(item):
    analysis = ""
    if item['type'] == 'TV Show':
        analysis += "Bu dizi, "
    else:
        analysis += "Bu film, "

    if item['rating'] >= 9.0:
        analysis += "izleyiciler tarafından olağanüstü beğenilen "
    elif item['rating'] >= 8.0:
        analysis += "oldukça popüler ve beğenilen "
    else:
        analysis += "izleyiciler tarafından genel olarak olumlu karşılanan "

    if 'Aksiyon' in item['genres']:
        analysis += "heyecan dolu sahneleriyle dikkat çeken "
    if 'Drama' in item['genres']:
        analysis += "duygusal derinliği olan "
    if 'Komedi' in item['genres']:
        analysis += "eğlenceli ve gülümseten "
    if 'Bilim Kurgu' in item['genres']:
        analysis += "geleceğe dair ilginç fikirler sunan "

    analysis += f"bir yapım. {item['rating']} puanlık değerlendirmesiyle, "

    if len(item['genres']) > 1:
        analysis += f"{', '.join(item['genres'][:-1])} ve {item['genres'][-1]} türlerini başarıyla harmanlıyor."
    else:
        analysis += f"{item['genres'][0]} türünün güzel bir örneği."

    return analysis

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search():
    query = request.json.get('query')
    
    result = search_local_data(query)
    
    if result:
        result['ai_analysis'] = generate_ai_analysis(result)
        return jsonify(result)
    
    return jsonify({'error': 'No results found'}), 404

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
