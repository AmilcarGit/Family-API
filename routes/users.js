const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { generateKey } = require('../middlewares/auth');
const db = require('../db');

const SALT_ROUNDS = 10;
const isBcryptHash = (value) => typeof value === 'string' && /^\$2[aby]\$/.test(value);

// ============== ADMIN (solo por variables de entorno) ==============
const ADMIN = {
    username: process.env.ADMIN_USERNAME || 'admin',
    email: process.env.ADMIN_EMAIL || 'admin@familybot-md.com',
    password: process.env.ADMIN_PASSWORD || 'familybot-md',
    key: process.env.ADMIN_KEY || 'familybot-md',
    role: 'admin',
    plan: 'ADMIN VIP',
    limit: 100000,
    requestToday: 0,
    totalRequest: 0,
    profile_img: process.env.ADMIN_IMG || 'https://i.ibb.co/jPzxnp6x/NAGI-REO-RIN-SAE-ISAGI.jpg'
};

// ============== HELPERS ==============
function isAdmin(apiKey) {
    return apiKey === ADMIN.key;
}

function verificarExpiracion(user) {
    if (user.vipExpires && new Date() > new Date(user.vipExpires)) {
        db.updateUserBy('id', user.id, { role: 'user', plan: 'free', limit: 100, vipSince: null, vipExpires: null });
        return true;
    }
    return false;
}

// ============== REGISTRO ==============
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ status: false, message: 'Faltan datos obligatorios' });
    }

    if (email === ADMIN.email) {
        return res.status(400).json({ status: false, message: 'Este email no puede ser registrado' });
    }

    try {
        const exists = db.findUser('email', email) || db.findUser('username', username);
        if (exists) {
            return res.status(400).json({ status: false, message: 'El correo o usuario ya existe' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const newUser = db.createUser({
            username,
            email,
            password: hashedPassword,
            key: generateKey()
        });

        res.json({ status: true, creator: 'familybot-md', message: 'Registro exitoso', key: newUser.key });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: 'Error en el servidor durante el registro' });
    }
});

// ============== LOGIN ==============
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ status: false, message: 'Email y contraseña requeridos' });
    }

    try {
        if (email === ADMIN.email && password === ADMIN.password) {
            return res.json({
                status: true,
                creator: 'familybot-md',
                data: {
                    username: ADMIN.username,
                    email: ADMIN.email,
                    key: ADMIN.key,
                    role: 'admin',
                    plan: 'ADMIN VIP',
                    limit: ADMIN.limit,
                    profileImg: ADMIN.profile_img
                }
            });
        }

        const user = db.findUser('email', email);
        if (!user) {
            return res.status(401).json({ status: false, message: 'Credenciales incorrectas' });
        }

        let passwordOk;
        if (isBcryptHash(user.password)) {
            passwordOk = await bcrypt.compare(password, user.password);
        } else {
            // Cuenta antigua con contraseña en texto plano: migramos a bcrypt si coincide
            passwordOk = user.password === password;
            if (passwordOk) {
                db.updateUserBy('id', user.id, { password: await bcrypt.hash(password, SALT_ROUNDS) });
            }
        }

        if (!passwordOk) {
            return res.status(401).json({ status: false, message: 'Credenciales incorrectas' });
        }

        verificarExpiracion(user);

        res.json({
            status: true,
            creator: 'familybot-md',
            data: {
                username: user.username,
                email: user.email,
                key: user.key,
                role: user.role,
                plan: user.plan,
                limit: user.limit,
                profileImg: user.profile_img
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: 'Error interno en el servidor' });
    }
});

// ============== MI PERFIL ==============
router.get('/me', (req, res) => {
    const { apiKey } = req.query;
    if (!apiKey) return res.status(400).json({ status: false, message: 'ApiKey requerida' });

    try {
        if (isAdmin(apiKey)) {
            return res.json({
                status: true,
                creator: 'familybot-md',
                data: {
                    username: ADMIN.username,
                    email: ADMIN.email,
                    key: ADMIN.key,
                    role: 'admin',
                    plan: 'ADMIN VIP',
                    profile_img: ADMIN.profile_img,
                    requests: { today: 0, total: 0, limit: ADMIN.limit, remaining: ADMIN.limit }
                }
            });
        }

        const user = db.findUser('key', apiKey);
        if (!user) return res.status(404).json({ status: false, message: 'Usuario no encontrado' });

        verificarExpiracion(user);

        let daysLeft = 0;
        if (user.vipExpires) {
            daysLeft = Math.ceil((new Date(user.vipExpires) - new Date()) / (1000 * 60 * 60 * 24));
        }

        res.json({
            status: true,
            creator: 'familybot-md',
            data: {
                username: user.username,
                email: user.email,
                key: user.key,
                role: user.role,
                plan: user.plan,
                profile_img: user.profile_img,
                vipExpires: user.vipExpires,
                daysLeft,
                requests: {
                    today: user.requestToday,
                    total: user.totalRequest,
                    limit: user.limit,
                    remaining: user.limit - user.requestToday
                }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: 'Error interno' });
    }
});

// ============== ACTUALIZAR PERFIL ==============
router.post('/update-profile', async (req, res) => {
    const { apiKey, type, value } = req.body;

    if (!apiKey || !type || value === undefined) {
        return res.status(400).json({ status: false, message: 'Faltan parámetros' });
    }

    const forbiddenFields = ['role', 'plan', 'limit', 'vipSince', 'vipExpires', 'totalRequest', 'requestToday', 'key'];
    if (forbiddenFields.includes(type)) {
        return res.status(403).json({ status: false, message: 'No puedes modificar este campo' });
    }

    if (isAdmin(apiKey)) {
        return res.status(403).json({ status: false, message: 'El admin se modifica manualmente' });
    }

    try {
        const user = db.findUser('key', apiKey);
        if (!user) return res.status(404).json({ status: false, message: 'Usuario no encontrado' });

        const allowedFields = ['username', 'email', 'password', 'profile_img'];
        if (!allowedFields.includes(type)) {
            return res.status(400).json({ status: false, message: 'Acción no permitida' });
        }

        const newValue = type === 'password' ? await bcrypt.hash(value, SALT_ROUNDS) : value;
        db.updateUserBy('id', user.id, { [type]: newValue });

        res.json({ status: true, message: 'Perfil actualizado', field: type });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: 'Error interno' });
    }
});

// ============== ESTADÍSTICAS ==============
router.get('/stats', (req, res) => {
    try {
        res.json({ status: true, users: db.countUsers() + 1, endpoints: 50 });
    } catch (err) {
        res.status(500).json({ status: false });
    }
});

// ============== DASHBOARD GLOBAL ==============
router.get('/dashboard-global', (req, res) => {
    try {
        const users = db.getAllUsers();
        const totalUsers = users.length + 1;
        const globalRequests = users.reduce((sum, u) => sum + (u.totalRequest || 0), 0);

        const top5 = [...users]
            .filter(u => u.totalRequest > 0)
            .sort((a, b) => b.totalRequest - a.totalRequest)
            .slice(0, 5)
            .map(u => ({
                username: u.username,
                total: u.totalRequest,
                initial: u.username.charAt(0).toUpperCase()
            }));

        res.json({
            status: true,
            totalUsers,
            globalRequests,
            uptime: global.startTime || Date.now(),
            top5
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false });
    }
});

// ============== ADMIN: VER TODOS ==============
router.get('/admin/all', (req, res) => {
    const { apiKey } = req.query;
    if (!isAdmin(apiKey)) return res.status(403).json({ status: false, message: 'No autorizado' });

    try {
        const users = db.getAllUsers().map(({ password, ...safe }) => safe);
        const { password, ...adminSafe } = ADMIN;
        res.json({ status: true, users: [adminSafe, ...users] });
    } catch (err) {
        res.status(500).json({ status: false });
    }
});

// ============== ADMIN: ACTUALIZAR ==============
router.post('/admin/update', (req, res) => {
    const { adminKey, targetEmail, newData } = req.body;
    if (!isAdmin(adminKey)) return res.status(403).json({ status: false });

    try {
        const user = db.updateUserBy('email', targetEmail, newData);
        if (!user) return res.status(404).json({ status: false });
        res.json({ status: true });
    } catch (err) {
        res.status(500).json({ status: false });
    }
});

// ============== ADMIN: ELIMINAR ==============
router.post('/admin/delete', (req, res) => {
    const { adminKey, targetEmail } = req.body;
    if (!isAdmin(adminKey)) return res.status(403).json({ status: false });
    if (targetEmail === ADMIN.email) return res.status(403).json({ status: false, message: 'No se puede eliminar el admin' });

    try {
        const ok = db.deleteUserBy('email', targetEmail);
        if (!ok) return res.status(404).json({ status: false });
        res.json({ status: true });
    } catch (err) {
        res.status(500).json({ status: false });
    }
});

module.exports = router;