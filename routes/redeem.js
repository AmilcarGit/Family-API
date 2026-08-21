const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');

const ADMIN_KEY = process.env.ADMIN_KEY || 'familybot-md';

// ============== "BASE DE DATOS" DE CÓDIGOS (JSON local) ==============
const codesPath = path.join(__dirname, '..', 'database', 'codes.json');
if (!fs.existsSync(path.dirname(codesPath))) fs.mkdirSync(path.dirname(codesPath), { recursive: true });
if (!fs.existsSync(codesPath)) fs.writeFileSync(codesPath, '[]', 'utf-8');

function getCodes() {
    try {
        return JSON.parse(fs.readFileSync(codesPath, 'utf-8'));
    } catch {
        return [];
    }
}
function saveCodes(codes) {
    fs.writeFileSync(codesPath, JSON.stringify(codes, null, 2), 'utf-8');
}

// ============== CANJEAR CÓDIGO (usuario) ==============
// POST /api/auth/redeem
router.post('/redeem', (req, res) => {
    const { apiKey, code } = req.body;

    if (!apiKey || !code) {
        return res.status(400).json({ status: false, error: 'Faltan parámetros' });
    }

    try {
        const user = db.findUser('key', apiKey);
        if (!user) return res.status(404).json({ status: false, error: 'Usuario no encontrado' });

        const normalizedCode = code.trim().toUpperCase();
        const codes = getCodes();
        const redeemCode = codes.find(c => c.code === normalizedCode);

        if (!redeemCode) return res.status(404).json({ status: false, error: 'Código no válido' });
        if (!redeemCode.active) return res.status(400).json({ status: false, error: 'Este código ya no está activo' });
        if (redeemCode.uses >= redeemCode.maxUses) return res.status(400).json({ status: false, error: 'Este código ya alcanzó su límite de usos' });
        if (redeemCode.usedBy.includes(user.email)) return res.status(400).json({ status: false, error: 'Ya canjeaste este código anteriormente' });

        // Sumar solicitudes al usuario
        const newLimit = (user.limit || 100) + redeemCode.requests;
        db.updateUserBy('id', user.id, { limit: newLimit });

        // Registrar el canje
        redeemCode.uses += 1;
        redeemCode.usedBy.push(user.email);
        if (redeemCode.uses >= redeemCode.maxUses) redeemCode.active = false;
        saveCodes(codes);

        return res.json({
            status: true,
            creator: 'familybot-md',
            message: `¡Código canjeado! +${redeemCode.requests} solicitudes agregadas`,
            requests_added: redeemCode.requests,
            new_limit: newLimit
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, error: 'Error interno del servidor' });
    }
});

// ============== CREAR CÓDIGO (admin) ==============
// POST /api/auth/admin/create-code
router.post('/admin/create-code', (req, res) => {
    const { adminKey, code, requests, maxUses } = req.body;

    if (adminKey !== ADMIN_KEY) return res.status(403).json({ status: false, error: 'No autorizado' });
    if (!code || !requests || !maxUses) return res.status(400).json({ status: false, error: 'Faltan parámetros' });

    try {
        const normalizedCode = code.trim().toUpperCase();
        const codes = getCodes();
        if (codes.find(c => c.code === normalizedCode)) {
            return res.status(400).json({ status: false, error: 'Este código ya existe' });
        }

        const newCode = {
            code: normalizedCode,
            requests: parseInt(requests),
            maxUses: parseInt(maxUses),
            uses: 0,
            usedBy: [],
            createdBy: 'admin',
            createdAt: new Date().toISOString(),
            active: true
        };
        codes.push(newCode);
        saveCodes(codes);

        res.json({
            status: true,
            creator: 'familybot-md',
            message: 'Código creado exitosamente',
            data: { code: newCode.code, requests: newCode.requests, maxUses: newCode.maxUses }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, error: 'Error interno' });
    }
});

// ============== VER CÓDIGOS (admin) ==============
// GET /api/auth/admin/codes
router.get('/admin/codes', (req, res) => {
    const { apiKey } = req.query;
    if (apiKey !== ADMIN_KEY) return res.status(403).json({ status: false, error: 'No autorizado' });

    try {
        const codes = getCodes().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json({ status: true, total: codes.length, data: codes });
    } catch (err) {
        res.status(500).json({ status: false, error: 'Error interno' });
    }
});

// ============== ELIMINAR CÓDIGO (admin) ==============
// POST /api/auth/admin/delete-code
router.post('/admin/delete-code', (req, res) => {
    const { adminKey, code } = req.body;
    if (adminKey !== ADMIN_KEY) return res.status(403).json({ status: false, error: 'No autorizado' });

    try {
        const normalizedCode = (code || '').trim().toUpperCase();
        const codes = getCodes().filter(c => c.code !== normalizedCode);
        saveCodes(codes);
        res.json({ status: true, message: 'Código eliminado' });
    } catch (err) {
        res.status(500).json({ status: false, error: 'Error interno' });
    }
});

module.exports = router;