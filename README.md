# M&A OS Portal

Plateforme SaaS sécurisée pour banquiers d'affaires — Deal Execution Platform.

## Stack technique

- **Framework** : Next.js 16 (App Router)
- **UI** : Tailwind CSS v4 + shadcn/ui (base-ui v4)
- **Auth & BDD** : Supabase (Auth + PostgreSQL + RLS)
- **3D/Shader** : Three.js (animation WebGL sur la page de login)
- **Déploiement** : Vercel

## Règle métier absolue

`Login → Signature NDA → Dashboard`. Le middleware applique ce flux sur chaque route.

## Setup local

### 1. Variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 2. Base de données Supabase

Exécuter le SQL de `docs/schema.sql` dans **Supabase > SQL Editor**.

Tables créées :
- `profiles` — lié à `auth.users` via trigger automatique
- `nda_signatures` — traçabilité des signatures NDA
- `os_modules` — registre des micro-applications (3 seedées)

### 3. Installation et lancement

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Structure des dossiers

```
src/
├── app/
│   ├── (auth)/          # login, register, callback
│   ├── (protected)/     # dashboard, nda, os/[slug], profile
│   ├── error.tsx        # page d'erreur globale
│   └── not-found.tsx    # page 404
├── components/
│   ├── auth/            # LoginForm, RegisterForm
│   ├── dashboard/       # ModuleCard
│   ├── layout/          # Sidebar, Header, MobileSidebar
│   └── ui/              # composants shadcn + ShaderAnimation
├── lib/
│   ├── supabase/        # client, server, middleware, admin
│   └── nda-content.ts
├── types/
│   └── database.ts
└── middleware.ts        # protection des routes
```

## Déploiement Vercel

1. Connecter le repo GitHub à Vercel
2. Ajouter les 3 variables d'environnement dans Vercel > Settings > Environment Variables
3. Chaque `git push origin main` déclenche un déploiement automatique

## Commandes

```bash
npm run dev    # serveur de développement
npm run build  # build de production
npm run lint   # linting ESLint
```
