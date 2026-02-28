# app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

# Do NOT define db or migrate here anymore

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = 'dev-secret-key-change-in-production'
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL',
        'postgresql://budget_user:budget_pass_change_me@localhost:5432/budget_app')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = '/app/uploads'
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

    # Initialize extensions **inside** the factory
    db = SQLAlchemy()
    db.init_app(app)
    
    migrate = Migrate()
    migrate.init_app(app, db)

    # Now safe to import models (no circularity risk)
    from .models import Category, CategoryGroup   # or import .models

    # Register blueprints
    from .routes import main
    app.register_blueprint(main)
    
    # Optional: attach db and migrate to app for easy access elsewhere
    app.db = db
    app.migrate = migrate
    
    return app