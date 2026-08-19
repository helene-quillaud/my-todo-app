// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * Chaque test reçoit un `page` — un onglet de navigateur isolé.
 * Playwright ouvre la page, interagit avec elle et vérifie le résultat.
 *
 * Prérequis : le backend Flask doit tourner sur http://127.0.0.1:5000
 * et le frontend doit être servi sur http://127.0.0.1:5500
 * (ex: extension VS Code "Live Server", ou `npx serve .`)
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Crée un todo via le formulaire et retourne son titre.
 * Réutilisé dans plusieurs tests pour éviter la répétition.
 */
async function createTodo(page, title, description = "") {
  await page.fill("#title-input", title);
  if (description) await page.fill("#description-input", description);
  await page.click("button[type=submit]");
  // On attend que l'élément apparaisse dans la liste (l'API peut prendre un instant)
  await expect(page.locator(".todo-title").first()).toContainText(title);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  // Chaque test commence sur la page d'accueil avec la liste fraîchement chargée
  await page.goto("/");
  // On attend que le chargement initial soit terminé (le spinner "Chargement..." disparaît)
  await expect(page.locator("#title-input")).toBeVisible();
});

// ── Affichage initial ─────────────────────────────────────────────────────────

test("la page se charge et affiche le formulaire", async ({ page }) => {
  await expect(page.locator("h1")).toContainText("Mes tâches");
  await expect(page.locator("#title-input")).toBeVisible();
  await expect(page.locator("#description-input")).toBeVisible();
  await expect(page.locator("button[type=submit]")).toBeVisible();
});

test("les boutons de filtre sont présents", async ({ page }) => {
  await expect(page.locator(".filter-btn[data-filter='all']")).toBeVisible();
  await expect(page.locator(".filter-btn[data-filter='active']")).toBeVisible();
  await expect(page.locator(".filter-btn[data-filter='completed']")).toBeVisible();
});

// ── Création ──────────────────────────────────────────────────────────────────

test("créer un todo avec titre seulement", async ({ page }) => {
  await createTodo(page, "Tâche test Playwright");
  await expect(page.locator(".todo-title").first()).toContainText("Tâche test Playwright");
});

test("créer un todo avec titre et description", async ({ page }) => {
  await createTodo(page, "Tâche avec description", "Détails ici");
  await expect(page.locator(".todo-description").first()).toContainText("Détails ici");
});

test("le formulaire se vide après soumission", async ({ page }) => {
  await page.fill("#title-input", "Tâche à vider");
  await page.click("button[type=submit]");
  // Après soumission, le champ titre doit être vide
  await expect(page.locator("#title-input")).toHaveValue("");
});

test("ne peut pas créer un todo sans titre", async ({ page }) => {
  // On compte le nombre de todos avant
  const countBefore = await page.locator(".todo-item").count();
  // On clique sans remplir le titre
  await page.click("button[type=submit]");
  // La liste ne doit pas avoir changé
  await expect(page.locator(".todo-item")).toHaveCount(countBefore);
});

// ── Complétion ────────────────────────────────────────────────────────────────

test("cocher un todo le marque comme terminé", async ({ page }) => {
  await createTodo(page, "Tâche à cocher");
  const item = page.locator(".todo-item").first();
  // On coche la checkbox
  await item.locator("input[type=checkbox]").check();
  // L'élément doit avoir la classe CSS "completed"
  await expect(item).toHaveClass(/completed/);
  // Le titre doit être barré
  await expect(item.locator(".todo-title")).toHaveCSS(
    "text-decoration-line",
    "line-through"
  );
});

test("décocher un todo le remet en cours", async ({ page }) => {
  await createTodo(page, "Tâche à décocher");
  const item = page.locator(".todo-item").first();
  await item.locator("input[type=checkbox]").check();
  await item.locator("input[type=checkbox]").uncheck();
  await expect(item).not.toHaveClass(/completed/);
});

// ── Suppression ───────────────────────────────────────────────────────────────

test("supprimer un todo le retire de la liste", async ({ page }) => {
  await createTodo(page, "Tâche à supprimer");
  const countBefore = await page.locator(".todo-item").count();
  // On clique sur le bouton supprimer du premier todo
  await page.locator(".btn-delete").first().click();
  // La liste doit avoir un élément de moins
  await expect(page.locator(".todo-item")).toHaveCount(countBefore - 1);
});

// ── Filtres ───────────────────────────────────────────────────────────────────

test("le filtre 'En cours' n'affiche que les todos non complétés", async ({ page }) => {
  await createTodo(page, "Tâche active");
  await createTodo(page, "Tâche terminée");
  // On coche la deuxième tâche créée
  const items = page.locator(".todo-item");
  await items.first().locator("input[type=checkbox]").check();
  // On applique le filtre "En cours"
  await page.click(".filter-btn[data-filter='active']");
  // Tous les todos visibles doivent être non cochés
  const checkboxes = page.locator(".todo-item input[type=checkbox]");
  const count = await checkboxes.count();
  for (let i = 0; i < count; i++) {
    await expect(checkboxes.nth(i)).not.toBeChecked();
  }
});

test("le filtre 'Terminées' n'affiche que les todos complétés", async ({ page }) => {
  await createTodo(page, "Tâche à terminer");
  await page.locator(".todo-item").first().locator("input[type=checkbox]").check();
  await page.click(".filter-btn[data-filter='completed']");
  // Tous les todos visibles doivent avoir la classe completed
  const items = page.locator(".todo-item");
  const count = await items.count();
  for (let i = 0; i < count; i++) {
    await expect(items.nth(i)).toHaveClass(/completed/);
  }
});

// ── Compteur ──────────────────────────────────────────────────────────────────

test("le compteur diminue quand on coche un todo", async ({ page }) => {
  await createTodo(page, "Tâche pour compteur");
  // On lit le compteur avant
  const countText = await page.locator("#count").textContent();
  const before = parseInt(countText ?? "0");
  // On coche
  await page.locator(".todo-item").first().locator("input[type=checkbox]").check();
  // Le compteur doit avoir diminué de 1
  await expect(page.locator("#count")).toContainText(String(before - 1));
});
