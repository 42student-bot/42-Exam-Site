# Examen42 Portal

Site statique (HTML/CSS/JS) au thème **noir & blanc** avec une page de **connexion** soignée et intégration du logo `42.jpg`.

## Déployer sur GitHub Pages
1. Crée un repo GitHub et copie le contenu de ce dossier à la racine du repo.
2. Vérifie que `42.jpg` est bien à la racine (à côté de `index.html`).
3. GitHub → **Settings** → **Pages**
   - **Build and deployment** → **Source**: *Deploy from a branch*
   - **Branch**: `main` / `(root)`
4. Ouvre l’URL fournie par GitHub Pages.

## GitHub Pages: point important (chemins)
Ton site est servi ici:
- https://42student-bot.github.io/42-Exam-Site/

Donc dans `index.html`, tu dois avoir:
```html
<base href="/42-Exam-Site/" />
```

Si tu changes le nom du repo, mets à jour cette valeur, sinon `assets/styles.css`, `assets/app.js` et `42.jpg` partiront en 404.

## Notes
- La connexion est une **démo** (pas d’API, pas de backend).
- L’état “rester connecté” utilise `localStorage` (sinon `sessionStorage`).
