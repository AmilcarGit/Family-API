const express = require('express');
const router = express.Router();

const videos = [
    'https://files.catbox.moe/wayv8l.mp4',
    'https://files.catbox.moe/e0tbwm.mp4',
    'https://files.catbox.moe/glhdug.mp4',
    'https://files.catbox.moe/76kb1t.mp4',
    'https://files.catbox.moe/9or7x0.mp4',
    'https://files.catbox.moe/3t000i.mp4',
    'https://files.catbox.moe/fm8wdm.mp4',
    'https://files.catbox.moe/emuz4z.mp4',
    'https://files.catbox.moe/yirarh.mp4',
    'https://files.catbox.moe/ba5zlh.mp4',
    'https://files.catbox.moe/a3wx3c.mp4',
    'https://files.catbox.moe/6xkscn.mp4',
    'https://files.catbox.moe/r0jdn1.mp4',
    'https://files.catbox.moe/dvark3.mp4',
    'https://files.catbox.moe/lls16o.mp4',
    // Agrega más URLs aquí
];

router.get('/', (req, res) => {
    const video = videos[Math.floor(Math.random() * videos.length)];

    res.json({
        status: true,
        creator: 'familybot-md',
        tipo: 'anime-solo',
        url: video,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
