import pytest

from app import create_app
from database import db as _db


@pytest.fixture
def client():
    """Client de test Flask avec base SQLite in-memory isolée."""
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
    })
    with app.test_client() as client:
        yield client


def test_get_todos_empty(client):
    """GET /api/todos retourne une liste vide au départ."""
    response = client.get("/api/todos")
    assert response.status_code == 200
    assert response.get_json() == []


def test_create_todo(client):
    """POST /api/todos crée une tâche et retourne les champs attendus."""
    payload = {"title": "Acheter du lait", "description": "Lait demi-écrémé"}
    response = client.post("/api/todos", json=payload)
    assert response.status_code == 201
    data = response.get_json()
    assert data["title"] == "Acheter du lait"
    assert data["description"] == "Lait demi-écrémé"
    assert data["completed"] is False
    assert "id" in data
    assert "created_at" in data


def test_create_todo_missing_title(client):
    """POST /api/todos sans title retourne 400."""
    response = client.post("/api/todos", json={"description": "Sans titre"})
    assert response.status_code == 400


def test_patch_todo(client):
    """PATCH /api/todos/<id> marque une tâche comme terminée."""
    created = client.post("/api/todos", json={"title": "Tâche à compléter"}).get_json()
    todo_id = created["id"]

    response = client.patch(f"/api/todos/{todo_id}", json={"completed": True})
    assert response.status_code == 200
    assert response.get_json()["completed"] is True


def test_delete_todo(client):
    """DELETE /api/todos/<id> supprime la tâche et retourne 204."""
    created = client.post("/api/todos", json={"title": "À supprimer"}).get_json()
    todo_id = created["id"]

    response = client.delete(f"/api/todos/{todo_id}")
    assert response.status_code == 204

    get_response = client.get("/api/todos")
    todos = get_response.get_json()
    assert all(t["id"] != todo_id for t in todos)


def test_patch_todo_not_found(client):
    """PATCH sur un id inexistant retourne 404."""
    response = client.patch("/api/todos/9999", json={"completed": True})
    assert response.status_code == 404


def test_delete_todo_not_found(client):
    """DELETE sur un id inexistant retourne 404."""
    response = client.delete("/api/todos/9999")
    assert response.status_code == 404
