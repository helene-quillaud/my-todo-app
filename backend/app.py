from flask import Flask, jsonify, request
from flask_cors import CORS

from database import db, init_db
from models import Todo


def create_app(config: dict = None) -> Flask:
    """Crée et configure l'application Flask.

    Example:
        app = create_app()
        app.run(port=5000)
    """
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///todos.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    if config:
        app.config.update(config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    init_db(app)

    @app.get("/api/todos")
    def get_todos():
        """Retourne la liste de toutes les tâches."""
        todos = Todo.query.order_by(Todo.created_at.desc()).all()
        return jsonify([t.to_dict() for t in todos]), 200

    @app.post("/api/todos")
    def create_todo():
        """Crée une nouvelle tâche. Body JSON : {title, description?}."""
        data = request.get_json(silent=True) or {}
        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"error": "Le champ 'title' est requis."}), 400
        todo = Todo(title=title, description=data.get("description"))
        db.session.add(todo)
        db.session.commit()
        return jsonify(todo.to_dict()), 201

    @app.patch("/api/todos/<int:todo_id>")
    def update_todo(todo_id: int):
        """Met à jour title, description et/ou completed d'une tâche."""
        todo = db.session.get(Todo, todo_id)
        if todo is None:
            return jsonify({"error": "Tâche introuvable."}), 404
        data = request.get_json(silent=True) or {}
        if "title" in data:
            title = (data["title"] or "").strip()
            if not title:
                return jsonify({"error": "Le champ 'title' ne peut pas être vide."}), 400
            todo.title = title
        if "description" in data:
            todo.description = data["description"]
        if "completed" in data:
            todo.completed = bool(data["completed"])
        db.session.commit()
        return jsonify(todo.to_dict()), 200

    @app.delete("/api/todos/<int:todo_id>")
    def delete_todo(todo_id: int):
        """Supprime une tâche par son id."""
        todo = db.session.get(Todo, todo_id)
        if todo is None:
            return jsonify({"error": "Tâche introuvable."}), 404
        db.session.delete(todo)
        db.session.commit()
        return "", 204

    return app


if __name__ == "__main__":
    create_app().run(port=5000, debug=True)
