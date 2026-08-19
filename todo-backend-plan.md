# Plan — Backend Flask Todo App

## Vue d'ensemble

Créer un backend Flask complet pour une application Todo dans `exercices/my_todo_app/`.
L'API expose des endpoints REST avec CORS activé, une persistance SQLite via SQLAlchemy,
et respecte les conventions du projet (snake_case, docstrings, pytest).

---

## Sous-tâche 1 — `requirements.txt`

**Intent** : Déclarer toutes les dépendances Python du projet backend.

**Expected Outcomes** :
- Fichier `requirements.txt` créé avec les 4 dépendances nécessaires.

**Todo List** :
- [ ] Créer `exercices/my_todo_app/requirements.txt` avec :
  - `flask>=3.0.0`
  - `flask-sqlalchemy>=3.1.0`
  - `flask-cors>=4.0.0`
  - `pytest>=8.0.0`

**Relevant Context** :
- `exercices/ex4-commands/requirements.txt` — modèle existant (flask>=3.0.0)

**Status** : [x] done

---

## Sous-tâche 2 — `database.py`

**Intent** : Initialiser l'instance SQLAlchemy partagée et exposer une fonction
`init_db(app)` pour créer les tables au démarrage.

**Expected Outcomes** :
- `db = SQLAlchemy()` exporté et réutilisable dans `models.py` et `app.py`.
- Fonction `init_db(app)` qui enregistre l'instance sur l'app et crée les tables.

**Todo List** :
- [ ] Créer `exercices/my_todo_app/database.py`
- [ ] Instancier `db = SQLAlchemy()` (pattern application factory)
- [ ] Écrire `init_db(app: Flask) -> None` avec docstring
  - Appelle `db.init_app(app)`
  - Appelle `db.create_all()` dans un `app.app_context()`

**Relevant Context** :
- Pattern flask-sqlalchemy : instance partagée, liée à l'app via `init_app()`
- `.bobrules` : docstrings obligatoires sur les fonctions publiques

**Status** : [x] done

---

## Sous-tâche 3 — `models.py`

**Intent** : Définir le modèle SQLAlchemy `Todo` avec tous les champs demandés
et une méthode `to_dict()` pour la sérialisation JSON.

**Expected Outcomes** :
- Classe `Todo` avec colonnes : `id`, `title`, `description`, `completed`, `created_at`
- Méthode `to_dict()` retournant un dict JSON-sérialisable
- `created_at` valorisé automatiquement à `datetime.utcnow`

**Todo List** :
- [ ] Créer `exercices/my_todo_app/models.py`
- [ ] Importer `db` depuis `database.py`
- [ ] Définir `class Todo(db.Model)` avec colonnes :
  - `id` — `Integer`, PK, autoincrement
  - `title` — `String(200)`, not null
  - `description` — `Text`, nullable
  - `completed` — `Boolean`, default `False`, not null
  - `created_at` — `DateTime`, default `datetime.utcnow`
- [ ] Écrire `to_dict(self) -> dict` avec docstring

**Relevant Context** :
- `exercices/ex5/todo.py` — classe `Task` avec `to_dict()` (pattern à aligner)
- `.bobrules` : PascalCase pour les classes, docstrings

**Status** : [x] done

---

## Sous-tâche 4 — `app.py`

**Intent** : Créer l'application Flask avec CORS activé, la configuration SQLite,
et les 4 endpoints REST de l'API Todo.

**Expected Outcomes** :
- Factory `create_app()` retournant une app Flask configurée
- CORS activé sur toutes les routes `/api/*`
- 4 routes fonctionnelles : GET/POST `/api/todos`, PATCH/DELETE `/api/todos/<id>`
- Réponses JSON cohérentes (données + codes HTTP appropriés)
- Lancement direct via `__main__` sur le port 5000

**Todo List** :
- [ ] Créer `exercices/my_todo_app/app.py`
- [ ] Écrire `create_app() -> Flask` avec docstring :
  - Configure `SQLALCHEMY_DATABASE_URI` → `sqlite:///todos.db`
  - Active `CORS(app)`
  - Appelle `init_db(app)`
  - Enregistre les routes
- [ ] Implémenter `GET /api/todos` — retourne la liste de tous les todos
- [ ] Implémenter `POST /api/todos` — crée un todo depuis le JSON body (`title` requis, `description` optionnel)
- [ ] Implémenter `PATCH /api/todos/<int:todo_id>` — met à jour `title`, `description`, `completed`
- [ ] Implémenter `DELETE /api/todos/<int:todo_id>` — supprime et retourne 204
- [ ] Ajouter le bloc `if __name__ == "__main__": app.run(port=5000, debug=True)`

**Relevant Context** :
- `exercices/ex4-commands/app.py` — structure Flask existante (routes, jsonify, port)
- `models.py` — `Todo.to_dict()` pour sérialiser les réponses
- `database.py` — `init_db()` et `db` pour les sessions

**Status** : [x] done

---

## Sous-tâche 5 — `test_app.py`

**Intent** : Vérifier les 4 endpoints via des tests pytest utilisant un client de test Flask
et une base SQLite en mémoire (isolation totale).

**Expected Outcomes** :
- Tests pytest passants pour : création, lecture, mise à jour, suppression
- Base de données in-memory (`:memory:`) — aucun fichier créé sur disque

**Todo List** :
- [ ] Créer `exercices/my_todo_app/test_app.py`
- [ ] Écrire une fixture `client` qui configure l'app en mode test avec `TESTING=True`
  et `SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"`
- [ ] Écrire `test_get_todos_empty()` — GET retourne liste vide
- [ ] Écrire `test_create_todo()` — POST crée un todo, vérifie les champs retournés
- [ ] Écrire `test_patch_todo()` — PATCH modifie `completed` à True
- [ ] Écrire `test_delete_todo()` — DELETE retourne 204 et la tâche n'existe plus

**Relevant Context** :
- `exercices/ex3-code/test_calculator.py` et `exercices/ex4/test_math.py` — style de tests existants
- `.bobrules` : pytest, tests unitaires pour toutes les nouvelles fonctions

**Status** : [x] done
