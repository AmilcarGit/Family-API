const express = require('express');
const router = express.Router();

const images = [
    'https://files.catbox.moe/jgpqy0.webp',
    'https://files.catbox.moe/a8mhle.webp',
    'https://files.catbox.moe/tly9c7.webp',
    'https://files.catbox.moe/4ssi40.webp',
    'https://files.catbox.moe/h4snwg.webp',
    'https://files.catbox.moe/ddb4s3.webp',
    'https://files.catbox.moe/ue412n.webp',
    'https://files.catbox.moe/jj8q6z.webp',
    // Agrega más URLs aquí
];

router.get('/', (req, res) => {
    const image = images[Math.floor(Math.random() * images.length)];

    res.json({
        status: true,
        creator: 'familybot-md',
        tipo: 'anime-sad',
        url: image,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
