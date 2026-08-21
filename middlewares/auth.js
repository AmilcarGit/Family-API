const db = require('../db');

const getTodayDate = () => new Date().toISOString().split('T')[0];

const ADMIN_KEY = process.env.ADMIN_KEY || 'familybot-md';

const authHandler = (req, res, next) => {
    const { apiKey } = req.query;
    const today = getTodayDate();

    if (!apiKey) {
        return res.status(401).json({ status: false, message: "API Key requerida" });
    }

    try {
        // Admin: misma ADMIN_KEY definida en .env que usa routes/users.js
        if (apiKey === ADMIN_KEY) {
            req.user = { role: 'admin', plan: 'ADMIN VIP', key: ADMIN_KEY };
            return next();
        }

        // Buscar en el archivo JSON local
        let user = db.findUser('key', apiKey);

        if (!user) {
            return res.status(401).json({ status: false, message: "API Key inválida" });
        }

        // Verificar expiración de VIP
        if (user.vipExpires && new Date() > new Date(user.vipExpires)) {
            user = db.updateUserBy('id', user.id, {
                role: 'user',
                plan: 'free',
                limit: 100,
                vipSince: null,
                vipExpires: null
            });
        }

        // Resetear contador diario si es nuevo día
        if (user.lastRequestDate !== today) {
            user = db.updateUserBy('id', user.id, { requestToday: 0, lastRequestDate: today });
        }

        // Verificar límite diario
        if (user.requestToday >= user.limit) {
            return res.status(429).json({
                status: false,
                creator: "familybot-md",
                message: `Límite diario alcanzado (${user.limit}). Mejora tu plan para más requests.`
            });
        }

        // Incrementar contadores
        user = db.updateUserBy('id', user.id, {
            requestToday: user.requestToday + 1,
            totalRequest: user.totalRequest + 1
        });

        req.user = user;
        next();
    } catch (err) {
        console.error('Error en authHandler:', err);
        res.status(500).json({ status: false, message: "Error interno del servidor" });
    }
};

/**
 * Genera una API key con formato FamilyBot-MD + caracteres aleatorios
 * Ejemplo: FamilyBot-MD7aB3cD9fG1h
 */
const generateKey = () => {
    const gen = (len) => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < len; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };
    // Genera 8 caracteres aleatorios después de "FamilyBot-MD"
    return `FamilyBot-MD${gen(8)}`;
};

module.exports = { authHandler, generateKey };