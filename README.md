<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&pause=1000&color=FF2D95&center=true&vCenter=true&width=435&lines=¡Hola!+👋;Bienvenido+a+FamilyBot--MD+API" alt="Animación de saludo" />
</p>

<h1 align="center">
  <img src="https://img.shields.io/badge/FamilyBot--MD-API-ff2d95?style=for-the-badge&logo=whatsapp&logoColor=white" alt="FamilyBot-MD API" />
</h1>

<h3 align="center">Multi-tool REST API oficial para FamilyBot-MD</h3>
<p align="center">Una familia • Un bot • Sin límites 🖤</p>

---

## 📖 Sobre el Proyecto

**FamilyBot-MD API** es el backend REST oficial que da soporte a los bots de la familia **FamilyBot-MD** (ElyssiaBot-MD, TheKael-MD, TheYui-MD, TheEly-MD), hecho en **Node.js + Express**. Incluye:

- Descargas de redes sociales (YouTube, TikTok, Instagram, Facebook, Twitter/X, Pinterest, Mega, MediaFire, Reddit, APK)
- Herramientas útiles (QR, TTS, Screenshot, Base64, acortador de URLs, traductor, catbox)
- Contenido de anime y diversión (hug, pat, slap, kiss, sad, solo, gacha)
- Integración con Gemini AI
- Búsquedas (Wikipedia, MyAnimeList, letras de canciones, GitHub, memes, TikTok, YouTube, Pinterest)
- Sistema de usuarios con API keys, planes, límites diarios y panel de administración

Repositorio del bot: https://github.com/AmilcarGit/FamilyBot-MD

---

## 🚀 Instalación local

```bash
git clone https://github.com/AmilcarGit/familybot-md-api.git
cd familybot-md-api
npm install
cp .env.example .env   # completa tus propios valores
npm start
```

Para un VPS propio con Nginx + SSL automático puedes usar el instalador incluido:

```bash
bash install.sh
```

---

## ⚙️ Configuración (.env)

Copia `.env.example` a `.env` y completa tus propios valores. **El servidor no arranca sin `MONGODB_URI`** — no hay credenciales de ejemplo hardcodeadas en el código.

```bash
cp .env.example .env
```

| Variable | Descripción | Obligatoria |
|---|---|---|
| `MONGODB_URI` | Cadena de conexión de tu cluster de MongoDB Atlas | ✅ |
| `MONGODB_DB` | Nombre de la base de datos | No (default `familybotmd_api`) |
| `PORT` | Puerto local (Render lo asigna automáticamente en producción) | No |
| `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_KEY` | Cuenta admin usada solo si no existe un admin en Mongo | Recomendado |
| `GEMINI_COOKIE` | Necesaria solo si usas `/api/ai/gemini` | No |
| `GLOBAL_RATE_LIMIT_MAX` / `AUTH_RATE_LIMIT_MAX` | Límites de peticiones por IP | No |

> ⚠️ Si en algún momento tuviste credenciales reales de Mongo escritas directamente en el código y las llegaste a subir a un repositorio público, **rótalas cuanto antes desde MongoDB Atlas** — quedan en el historial de git aunque borres el archivo.

---

## ☁️ Despliegue en Render

Esta API necesita un **servidor Node.js corriendo permanentemente** (auth con sesiones, conexión a MongoDB, rate limiting), así que debe desplegarse como **Web Service**, **no como Static Site**. Los Static Sites de Render solo sirven HTML/CSS/JS estático y no pueden ejecutar `index.js` ni exponer los endpoints `/api/*`.

### Opción A — con `render.yaml` (recomendado, Blueprint)

1. Sube este proyecto a un repositorio de GitHub.
2. En Render: **New → Blueprint** y selecciona el repo (ya incluye `render.yaml`).
3. Render creará el Web Service automáticamente. Solo te pedirá rellenar las variables de entorno marcadas como `sync: false` (`MONGODB_URI`, `ADMIN_PASSWORD`, `ADMIN_KEY`, etc).
4. Deploy.

### Opción B — manual

1. **New → Web Service** → conecta tu repo de GitHub.
2. Configura:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (o el que prefieras)
3. En **Environment → Add Environment Variable** agrega al menos `MONGODB_URI` (obligatoria), y opcionalmente `MONGODB_DB`, `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_KEY`, `GEMINI_COOKIE`.
4. Deploy. Render te dará una URL tipo `https://familybot-md-api.onrender.com`.

> 💡 En el plan Free, Render "duerme" el servicio tras ~15 min sin tráfico y la primera petición después tarda unos segundos en despertar. Si tu bot necesita respuesta instantánea 24/7, considera un plan de pago o un servicio externo de "ping" cada pocos minutos.

---

## 📦 Endpoints principales

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/api/status` | Health check (uptime, estado de DB, memoria) | No |
| POST | `/api/auth/register` | Crea una cuenta y genera API key | No |
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/change-password` | Cambia la contraseña verificando la actual | Sí |
| GET | `/api/auth/admin/all` | Lista usuarios paginada (`?page=&limit=`) | Admin |
| GET | `/api/tools/qr` · `/ssweb` · `/tts` · `/base64` · `/shorturl` · `/translate` · `/catbox` · `/gacha` | Herramientas varias | Sí |
| GET | `/api/search/pinterest` · `/tiktok` · `/youtube` · `/meme` · `/wikipedia` · `/anime` · `/lyrics` · `/github` | Búsquedas | Sí |
| GET | `/api/download/facebook` · `/instagram` · `/twitter` · `/pinterest` · `/tiktok` · `/ytaudio` · `/ytvideo` · `/mega` · `/apkmod` · `/mediafire` · `/reddit` | Descargas | Sí |
| GET | `/api/anime/kiss` · `/hug` · `/pat` · `/slap` · `/sad` · `/solo` | GIFs de anime | Sí |
| POST | `/api/auth/redeem` | Canjea un código de recompensa | Sí |

Todas las rutas con **Auth: Sí** requieren el parámetro de query `?apiKey=TU_API_KEY` (la key que recibes al registrarte en `/api/auth/register`).

---

## 🔒 Seguridad

- Contraseñas hasheadas con **bcrypt** (las cuentas antiguas se migran automáticamente al hash en su próximo login).
- **Sin credenciales hardcodeadas**: `MONGODB_URI` es obligatoria por variable de entorno; el servidor no arranca sin ella.
- **Rate limiting**: límite general por IP para toda la API y uno más estricto para `/api/auth/login` y `/api/auth/register`.
- **Helmet** (cabeceras HTTP seguras) y **Morgan** (logging de requests).
- `admin/all` no expone el hash de la contraseña y pagina resultados.
- Manejo de errores centralizado en formato JSON consistente; las rutas `/api/*` inexistentes devuelven 404 JSON.

---

## 🖥️ Panel web (`/public`)

- `/` — Landing con info de la API
- `/login`, `/register`, `/profile` — Autenticación y perfil de usuario
- `/dash` — Dashboard del usuario (API key, uso, plan)
- `/admin` — Panel de staff (gestión de usuarios y códigos de canje)
- `/endpoints/*.html` — Documentación por categoría (search, download, tools, anime, ai)

---

## 👑 Créditos

Proyecto creado por **AmilcarGit** para la familia de bots **FamilyBot-MD**.
