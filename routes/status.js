const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/status
// Endpoint público (sin apiKey) pensado para monitores de uptime / balanceadores.
router.get('/', (req, res) => {
    const uptimeMs = global.startTime ? Date.now() - global.startTime : 0;

    res.json({
        status: true,
        creator: 'familybot-md',
        service: 'familybot-md-api',
        database: 'json-file',
        registeredUsers: db.countUsers(),
        uptime_seconds: Math.floor(uptimeMs / 1000),
        memory_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        node_version: process.version,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;