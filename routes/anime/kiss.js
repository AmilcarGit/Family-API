const express = require('express');
const router = express.Router();

const videos = [
    // URLs anteriores (solo .mp4)
    'https://files.catbox.moe/9klm6t.mp4',
    'https://files.catbox.moe/0ltn0t.mp4',
    'https://files.catbox.moe/4ghg0x.mp4',

    // Nuevas URLs de las capturas (agregadas)
    'https://files.catbox.moe/wf2vj1.mp4', // WA0042
    'https://files.catbox.moe/4mae9o.mp4', // WA0043
    'https://files.catbox.moe/85jv3h.mp4', // WA0044
    'https://files.catbox.moe/vt3whw.mp4', // WA0045
    'https://files.catbox.moe/5lf11a.mp4', // WA0046
    'https://files.catbox.moe/naduhn.mp4', // WA0047
    'https://files.catbox.moe/8k8o28.mp4', // WA0048
    'https://files.catbox.moe/t8ogre.mp4', // WA0049
    'https://files.catbox.moe/y8lxml.mp4', // WA0051
    'https://files.catbox.moe/zkxouq.mp4', // WA0052
    'https://files.catbox.moe/ik9ggq.mp4', // WA0053
    'https://files.catbox.moe/ckidsp.mp4', // WA0055
    'https://files.catbox.moe/yjftf7.mp4', // WA0056
    'https://files.catbox.moe/j0hdxx.mp4'  // WA0057
];

router.get('/', (req, res) => {
    const video = videos[Math.floor(Math.random() * videos.length)];

    res.json({
        status: true,
        creator: 'familybot-md',
        tipo: 'anime-kiss',
        url: video,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;