from datetime import datetime

from database import db


class Todo(db.Model):
    """Modèle SQLAlchemy représentant une tâche Todo."""

    __tablename__ = "todos"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    completed = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        """Retourne une représentation dict JSON-sérialisable de la tâche.

        Example:
            todo = Todo(title="Faire les courses")
            print(todo.to_dict())
            # {"id": 1, "title": "Faire les courses", "description": None,
            #  "completed": False, "created_at": "2024-01-01T00:00:00"}
        """
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "completed": self.completed,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
