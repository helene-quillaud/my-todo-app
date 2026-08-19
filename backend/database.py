from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def init_db(app: Flask) -> None:
    """Initialise l'instance SQLAlchemy et crée les tables.

    Example:
        app = Flask(__name__)
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///todos.db"
        init_db(app)
    """
    db.init_app(app)
    with app.app_context():
        db.create_all()
