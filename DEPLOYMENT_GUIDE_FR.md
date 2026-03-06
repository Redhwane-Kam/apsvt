# Guide de déploiement — APSVT
## Application de trésorerie en ligne

---

## ÉTAPE 1 — Créer les tables dans Supabase

1. Allez sur **supabase.com** et connectez-vous
2. Ouvrez votre projet **asso-APSVT**
3. Dans le menu à gauche, cliquez sur **SQL Editor**
4. Cliquez sur **New query**
5. Ouvrez le fichier **`supabase_tables.sql`** avec un éditeur de texte (Bloc-notes sur Windows, TextEdit sur Mac)
6. Sélectionnez tout le texte (Ctrl+A) et copiez-le (Ctrl+C)
7. Collez-le dans la fenêtre SQL de Supabase (Ctrl+V)
8. Cliquez sur le bouton **Run** (en bas à droite)
9. Le message **"Success. No rows returned"** doit apparaître ✅

---

## ÉTAPE 2 — Installer Node.js sur votre ordinateur

Node.js est un outil indispensable pour construire et publier l'application.

1. Allez sur **https://nodejs.org**
2. Téléchargez la version **LTS** (recommandée, bouton vert à gauche)
3. Installez-la avec les paramètres par défaut (cliquez "Suivant" à chaque étape)
4. **Vérification** : ouvrez le Terminal (voir ci-dessous) et tapez :
   ```
   node --version
   ```
   Vous devez voir quelque chose comme : `v20.x.x`

**Comment ouvrir le Terminal :**
- **Windows** : touche Windows → tapez "cmd" → Entrée
- **Mac** : Finder → Applications → Utilitaires → Terminal

---

## ÉTAPE 3 — Préparer le projet

1. Téléchargez le fichier **`apsvt-project.zip`**
2. Faites un clic droit → **Extraire tout** (Windows) ou double-clic (Mac)
3. Vous obtenez un dossier nommé **`apsvt`**
4. Placez ce dossier sur votre Bureau (pour le retrouver facilement)

**Ouvrir le Terminal dans ce dossier :**
- **Windows** : ouvrez le dossier `apsvt`, puis dans la barre d'adresse en haut tapez `cmd` et appuyez sur Entrée
- **Mac** : clic droit sur le dossier → "Nouveau terminal au dossier"

5. Dans le Terminal, tapez la commande suivante et appuyez sur **Entrée** :
   ```
   npm install
   ```
   ⏳ Attendez 2 à 3 minutes. Des messages défileront — c'est normal.

---

## ÉTAPE 4 — Créer le dépôt sur GitHub

1. Allez sur **github.com** et connectez-vous
2. Cliquez sur le bouton **"New"** (ou le "+" en haut à droite → "New repository")
3. Remplissez :
   - **Repository name** : `apsvt`
   - Cochez **Public**
   - Ne cochez rien d'autre
4. Cliquez **"Create repository"**
5. **Notez votre nom d'utilisateur GitHub** — il est visible dans l'URL de la page (ex: `github.com/MonNom`)

---

## ÉTAPE 5 — Modifier le fichier package.json

1. Ouvrez le fichier **`package.json`** (dans le dossier `apsvt`) avec le Bloc-notes
2. Trouvez la ligne :
   ```
   "homepage": ".",
   ```
3. Remplacez-la par (en mettant votre vrai nom d'utilisateur GitHub) :
   ```
   "homepage": "https://VOTRE_NOM_UTILISATEUR.github.io/apsvt",
   ```
4. Sauvegardez le fichier (Ctrl+S)

---

## ÉTAPE 6 — Publier sur GitHub

Dans le Terminal (toujours dans le dossier `apsvt`), tapez ces commandes **une par une**, en appuyant sur **Entrée** après chaque ligne :

```
git init
```
```
git add .
```
```
git commit -m "premiere version APSVT"
```
```
git branch -M main
```
```
git remote add origin https://github.com/VOTRE_NOM_UTILISATEUR/apsvt.git
```
```
git push -u origin main
```
```
npm run deploy
```

⚠️ Remplacez **VOTRE_NOM_UTILISATEUR** par votre vrai nom d'utilisateur GitHub.

La dernière commande peut prendre 2 à 3 minutes. Attendez le message **"Published"** ✅

---

## ÉTAPE 7 — Activer GitHub Pages

1. Sur github.com, ouvrez votre dépôt `apsvt`
2. Cliquez sur **Settings** (en haut à droite)
3. Dans le menu à gauche, cliquez sur **Pages**
4. Sous **"Branch"**, sélectionnez **`gh-pages`** puis **`/ (root)`**
5. Cliquez **Save**
6. Attendez 2 minutes puis rafraîchissez la page
7. Un bandeau vert apparaît avec votre lien ✅

---

## ✅ Votre application est en ligne !

L'adresse de votre application sera :
```
https://VOTRE_NOM_UTILISATEUR.github.io/apsvt
```

Partagez cette adresse avec les membres de votre association.

---

## Pour mettre à jour l'application plus tard

À chaque modification du code, il suffit de retaper dans le Terminal :
```
npm run deploy
```

---

## En cas de problème

Revenez ici et donnez-moi le message d'erreur exact qui s'est affiché.
Nous le résoudrons ensemble étape par étape.
