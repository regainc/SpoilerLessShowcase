import os

# Flask configuration
DEBUG = True
SECRET_KEY = os.urandom(24)

# Database configuration
SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
SQLALCHEMY_TRACK_MODIFICATIONS = False

# TheMovieDB API configuration
TMDB_API_KEY = os.environ.get('TMDB_API_KEY')
