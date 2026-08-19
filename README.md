# My Todo App

Application de gestion de tâches avec un backend Python Flask et un frontend JavaScript vanilla.

## Structure du projet

```
my-todo-app/
├── backend/
│   ├── app.py            # Application Flask — routes API
│   ├── models.py         # Modèle SQLAlchemy Todo
│   ├── database.py       # Initialisation SQLAlchemy
│   ├── requirements.txt  # Dépendances Python
│   └── test_app.py       # Tests pytest
└── frontend/
    ├── index.html        # Interface utilisateur
    ├── styles.css        # Styles responsives
    ├── app.js            # Logique JS + appels API
    ├── playwright.config.js
    └── tests/
        └── todo.spec.js  # Tests end-to-end Playwright
```

## Prérequis

- Python 3.11+
- Node.js 18+

## Installation et lancement

### Backend

```bash
cd backend

# Créer et activer l'environnement virtuel
python3 -m venv .venv
source .venv/bin/activate   # macOS/Linux

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur (http://127.0.0.1:5000)
python app.py
```

### Frontend

Ouvrir `frontend/index.html` dans un navigateur, ou utiliser un serveur statique :

```bash
cd frontend
npx serve . --listen 5500
```

## API

| Méthode | URL | Description |
|---|---|---|
| `GET` | `/api/todos` | Lister toutes les tâches |
| `POST` | `/api/todos` | Créer une tâche `{ title, description? }` |
| `PATCH` | `/api/todos/<id>` | Modifier `title`, `description`, `completed` |
| `DELETE` | `/api/todos/<id>` | Supprimer une tâche |

## Tests

### Backend (pytest)

```bash
cd backend
../.venv/bin/pytest test_app.py -v
```

### Frontend (Playwright)

Le backend et un serveur statique doivent tourner en parallèle.

```bash
cd frontend
npm test
```

## Stack technique

| Couche | Technologie |
|---|---|
| Backend | Python 3.11, Flask 3, Flask-SQLAlchemy |
| Base de données | SQLite |
| Frontend | HTML, CSS, JavaScript vanilla |
| Tests backend | pytest |
| Tests frontend | Playwright |
