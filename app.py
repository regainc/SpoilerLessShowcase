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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search():
    query = request.json.get('query')
    
    result = search_local_data(query)
    
    if result:
        return jsonify(result)
    
    return jsonify({'error': 'No results found'}), 404

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
