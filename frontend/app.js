/**
 * app.js — Logique frontend de l'application Todo
 *
 * Ce fichier gère toute la communication avec l'API Flask (backend)
 * et la mise à jour de l'interface utilisateur (UI).
 *
 * Architecture générale :
 *   1. On charge les todos depuis l'API au démarrage
 *   2. L'utilisateur interagit (ajouter, cocher, supprimer)
 *   3. Chaque interaction envoie une requête HTTP à l'API
 *   4. On met à jour le tableau local `todos` avec la réponse
 *   5. On re-génère l'affichage à partir de ce tableau
 */


// ── Configuration ────────────────────────────────────────────────────────────

/**
 * URL de base de l'API.
 * Toutes les requêtes seront envoyées vers cette adresse.
 * Si le backend tourne sur un autre port, c'est ici qu'on change.
 */
const API = "http://127.0.0.1:5000/api/todos";


// ── État de l'application ────────────────────────────────────────────────────

/**
 * `todos` est le tableau qui contient toutes les tâches chargées depuis l'API.
 * C'est la "source de vérité" côté frontend : l'affichage est toujours
 * généré à partir de ce tableau, jamais lu directement depuis le DOM.
 */
let todos = [];

/**
 * `currentFilter` détermine quelles tâches afficher.
 * Valeurs possibles : "all" | "active" | "completed"
 */
let currentFilter = "all";


// ── Références DOM ───────────────────────────────────────────────────────────
//
// On récupère une seule fois les éléments HTML dont on a besoin.
// C'est plus performant que d'appeler document.getElementById() à chaque rendu.

const form         = document.getElementById("todo-form");
const titleInput   = document.getElementById("title-input");
const descInput    = document.getElementById("description-input");
const todoList     = document.getElementById("todo-list");
const countEl      = document.getElementById("count");
const errorBanner  = document.getElementById("error-banner");
const filterBtns   = document.querySelectorAll(".filter-btn");


// ── Couche API ───────────────────────────────────────────────────────────────

/**
 * apiFetch — Fonction utilitaire pour tous les appels HTTP vers le backend.
 *
 * Pourquoi cette fonction existe :
 *   Plutôt que de répéter `fetch(...)` avec les mêmes options (headers,
 *   gestion d'erreur) dans chaque action, on centralise tout ici.
 *   Chaque action (créer, modifier, supprimer) appelle juste `apiFetch`.
 *
 * Pourquoi async/await :
 *   `fetch()` est une opération réseau — elle prend du temps (quelques ms
 *   à quelques secondes). En JavaScript, on ne peut pas "bloquer" et attendre :
 *   le navigateur deviendrait figé. `async/await` permet d'écrire du code
 *   qui *paraît* séquentiel mais qui s'exécute de façon asynchrone :
 *   le mot-clé `await` dit "attend que cette promesse se résolve avant
 *   de continuer", sans bloquer le reste du navigateur.
 *
 * @param {string} url     - L'URL à appeler (ex: "http://...//api/todos/1")
 * @param {object} options - Options fetch optionnelles (method, body, etc.)
 * @returns {Promise<object|null>} - La réponse JSON parsée, ou null si 204
 * @throws {Error} - Lance une erreur si la réponse HTTP n'est pas OK (2xx)
 */
async function apiFetch(url, options = {}) {
  // On fusionne les options par défaut avec celles passées en paramètre.
  // `Content-Type: application/json` indique au serveur qu'on envoie du JSON.
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options, // spread : écrase ou complète les headers si besoin
  });

  // Gestion des erreurs HTTP :
  // fetch() ne lance PAS d'erreur pour les codes 4xx/5xx — il faut le faire
  // manuellement. On vérifie `res.ok` (true si status entre 200 et 299).
  // Exception : 204 (No Content) est OK mais n'a pas de corps JSON.
  if (!res.ok && res.status !== 204) {
    // On tente de lire le message d'erreur renvoyé par l'API Flask,
    // ex: { "error": "Le champ 'title' est requis." }
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erreur ${res.status}`);
  }

  // 204 No Content : la requête a réussi mais le serveur ne renvoie rien.
  // C'est ce que retourne DELETE. On retourne null pour le signaler.
  if (res.status === 204) return null;

  // Sinon, on parse et retourne le JSON de la réponse.
  return res.json();
}


// ── Gestion des erreurs UI ───────────────────────────────────────────────────

/**
 * showError — Affiche un message d'erreur temporaire à l'utilisateur.
 *
 * Quand un appel API échoue (réseau coupé, serveur arrêté, validation...),
 * on attrape l'erreur dans le bloc `catch` de chaque action et on appelle
 * cette fonction. Elle affiche la bannière rouge et la cache après 4 secondes.
 *
 * @param {string} msg - Le message à afficher
 */
function showError(msg) {
  errorBanner.textContent = msg;
  errorBanner.classList.remove("hidden"); // rend la bannière visible

  // setTimeout planifie une action dans le futur (ici, 4000ms = 4 secondes).
  // C'est non-bloquant : le reste du code continue de s'exécuter pendant ce délai.
  setTimeout(() => errorBanner.classList.add("hidden"), 4000);
}


// ── Rendu (affichage) ────────────────────────────────────────────────────────

/**
 * getFiltered — Retourne le sous-ensemble de todos à afficher selon le filtre actif.
 *
 * Le filtrage se fait côté client sur le tableau `todos`, sans requête API
 * supplémentaire — c'est instantané et évite des allers-retours réseau inutiles.
 *
 * @returns {Array} - Tableau filtré de todos
 */
function getFiltered() {
  if (currentFilter === "active")    return todos.filter((t) => !t.completed);
  if (currentFilter === "completed") return todos.filter((t) => t.completed);
  return todos; // "all" : on retourne tout
}

/**
 * render — Regénère complètement l'affichage de la liste.
 *
 * Principe : plutôt que de modifier chirurgicalement le DOM (ce qui est
 * complexe à maintenir), on vide la liste et on la reconstruit entièrement
 * à partir du tableau `todos`. C'est simple et fiable pour cette taille
 * d'application.
 *
 * Cette fonction est appelée après chaque modification du tableau `todos`
 * (chargement, création, modification, suppression).
 */
function render() {
  const filtered = getFiltered();

  // On vide le contenu actuel de la liste
  todoList.innerHTML = "";

  if (filtered.length === 0) {
    // Aucun todo à afficher : on montre un message vide
    todoList.innerHTML = '<li class="empty-state">Aucune tâche ici.</li>';
  } else {
    filtered.forEach((todo) => {
      const li = document.createElement("li");
      li.className = `todo-item${todo.completed ? " completed" : ""}`;
      li.dataset.id = todo.id; // stocke l'id pour les actions

      // On génère le HTML de chaque todo.
      // escapeHtml() est utilisé sur les données venant de l'API pour éviter
      // les injections HTML (sécurité XSS).
      li.innerHTML = `
        <input type="checkbox" ${todo.completed ? "checked" : ""} title="Marquer comme ${todo.completed ? "en cours" : "terminée"}" />
        <div class="todo-content">
          <div class="todo-title">${escapeHtml(todo.title)}</div>
          ${todo.description ? `<div class="todo-description">${escapeHtml(todo.description)}</div>` : ""}
        </div>
        <div class="todo-actions">
          <button class="btn-icon btn-delete" title="Supprimer">🗑</button>
        </div>`;

      // On attache les écouteurs d'événements directement sur les éléments
      // nouvellement créés (pas sur le document entier).
      li.querySelector("input[type=checkbox]").addEventListener("change", () =>
        toggleTodo(todo.id, !todo.completed)
      );
      li.querySelector(".btn-delete").addEventListener("click", () =>
        deleteTodo(todo.id)
      );

      todoList.appendChild(li);
    });
  }

  // Mise à jour du compteur de tâches en cours
  const active = todos.filter((t) => !t.completed).length;
  countEl.textContent = `${active} tâche${active !== 1 ? "s" : ""} en cours`;
}

/**
 * escapeHtml — Protège contre les injections HTML (XSS).
 *
 * Sans cette fonction, un titre comme "<script>alert('hack')</script>"
 * serait interprété comme du HTML et exécuté par le navigateur.
 * On remplace les caractères spéciaux par leurs équivalents HTML inoffensifs.
 *
 * @param {string} str - La chaîne à sécuriser
 * @returns {string} - La chaîne avec les caractères dangereux échappés
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


// ── Actions (CRUD) ───────────────────────────────────────────────────────────

/**
 * loadTodos — Charge toutes les tâches depuis l'API au démarrage.
 *
 * Appel : GET /api/todos
 * Réponse attendue : tableau JSON de todos, ex: [{id:1, title:"...", ...}, ...]
 *
 * Le try/catch encadre l'appel async : si apiFetch lance une erreur
 * (réseau indisponible, serveur arrêté...), on l'attrape et on affiche
 * un message à l'utilisateur au lieu de laisser l'app planter silencieusement.
 */
async function loadTodos() {
  try {
    todos = await apiFetch(API); // GET (méthode par défaut de fetch)
    render();
  } catch (e) {
    showError("Impossible de charger les tâches : " + e.message);
  }
}

/**
 * createTodo — Crée une nouvelle tâche via l'API.
 *
 * Appel : POST /api/todos  avec body { title, description }
 * Réponse attendue : le todo créé avec son id assigné par la base de données.
 *
 * On ajoute le nouveau todo au début du tableau (unshift) pour qu'il
 * apparaisse en tête de liste, cohérent avec l'ordre retourné par l'API
 * (ORDER BY created_at DESC).
 *
 * @param {string} title       - Titre de la tâche (obligatoire)
 * @param {string} description - Description optionnelle
 */
async function createTodo(title, description) {
  try {
    const todo = await apiFetch(API, {
      method: "POST",
      // JSON.stringify convertit l'objet JS en chaîne JSON pour l'envoi
      body: JSON.stringify({ title, description: description || undefined }),
    });
    todos.unshift(todo); // ajoute en tête de tableau
    render();
  } catch (e) {
    showError(e.message);
  }
}

/**
 * toggleTodo — Bascule l'état completed d'une tâche (cochée / non cochée).
 *
 * Appel : PATCH /api/todos/<id>  avec body { completed: true|false }
 * Réponse attendue : le todo mis à jour.
 *
 * On remplace le todo modifié dans le tableau en mappant dessus :
 * pour chaque todo, si c'est celui qu'on vient de modifier on prend
 * la version retournée par l'API, sinon on garde l'existant.
 *
 * @param {number}  id        - L'identifiant du todo à modifier
 * @param {boolean} completed - Le nouvel état souhaité
 */
async function toggleTodo(id, completed) {
  try {
    const updated = await apiFetch(`${API}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    });
    // map() crée un nouveau tableau — on ne mute jamais `todos` directement
    todos = todos.map((t) => (t.id === id ? updated : t));
    render();
  } catch (e) {
    showError(e.message);
  }
}

/**
 * deleteTodo — Supprime une tâche via l'API, puis la retire du tableau local.
 *
 * Appel : DELETE /api/todos/<id>
 * Réponse attendue : 204 No Content (pas de corps JSON).
 *
 * On utilise filter() pour créer un nouveau tableau sans le todo supprimé,
 * ce qui déclenche ensuite un re-rendu propre.
 *
 * @param {number} id - L'identifiant du todo à supprimer
 */
async function deleteTodo(id) {
  try {
    await apiFetch(`${API}/${id}`, { method: "DELETE" });
    todos = todos.filter((t) => t.id !== id); // exclut le todo supprimé
    render();
  } catch (e) {
    showError(e.message);
  }
}


// ── Écouteurs d'événements ───────────────────────────────────────────────────

/**
 * Soumission du formulaire — crée une nouvelle tâche.
 *
 * `e.preventDefault()` empêche le comportement par défaut d'un formulaire HTML
 * (rechargement de la page). On gère nous-mêmes la soumission via l'API.
 */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = titleInput.value.trim(); // .trim() supprime les espaces inutiles
  if (!title) return;                    // sécurité : ne pas envoyer un titre vide
  createTodo(title, descInput.value.trim());
  // On vide les champs et remet le focus sur le titre pour enchaîner les saisies
  titleInput.value = "";
  descInput.value = "";
  titleInput.focus();
});

/**
 * Boutons de filtre — changent le filtre actif et re-rendent la liste.
 *
 * forEach itère sur tous les boutons. Quand l'un est cliqué, on lit
 * son attribut `data-filter` (défini dans le HTML) pour savoir quel
 * filtre appliquer.
 */
filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    // On retire la classe "active" de tous les boutons, puis on l'ajoute
    // uniquement au bouton cliqué (mise en évidence visuelle)
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    render(); // pas d'appel API — on filtre le tableau déjà chargé
  });
});


// ── Initialisation ───────────────────────────────────────────────────────────

/**
 * Point d'entrée : on charge les todos dès que le script est exécuté.
 * Le script est inclus en bas du <body> dans index.html, donc le DOM
 * est déjà chargé à ce moment — pas besoin de DOMContentLoaded.
 */
loadTodos();
