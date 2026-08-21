const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, 'database');
const dbPath = path.join(dbDir, 'registered_users.json');

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '[]', 'utf-8');

function getAllUsers() {
    try {
        const data = fs.readFileSync(dbPath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(dbPath, JSON.stringify(users, null, 2), 'utf-8');
}

function findUser(field, value) {
    const users = getAllUsers();
    return users.find(u => u[field] === value) || null;
}

function createUser(userData) {
    const users = getAllUsers();
    const newUser = {
        id: Date.now().toString(),
        role: 'user',
        plan: 'free',
        limit: 100,
        requestToday: 0,
        totalRequest: 0,
        lastRequestDate: new Date().toISOString().split('T')[0],
        profile_img: 'https://i.ibb.co/chJXMd0q/NAGI-REO-RIN-SAE-ISAGI.jpg',
        createdAt: new Date().toISOString(),
        vipSince: null,
        vipExpires: null,
        ...userData
    };
    users.push(newUser);
    saveUsers(users);
    return newUser;
}

// Actualiza un usuario ya sea por id o por otro campo (ej: 'email', 'key')
function updateUserBy(field, value, newData) {
    const users = getAllUsers();
    const index = users.findIndex(u => u[field] === value);
    if (index === -1) return null;
    users[index] = { ...users[index], ...newData };
    saveUsers(users);
    return users[index];
}

function deleteUserBy(field, value) {
    const users = getAllUsers();
    const filtered = users.filter(u => u[field] !== value);
    if (filtered.length === users.length) return false;
    saveUsers(filtered);
    return true;
}

function countUsers() {
    return getAllUsers().length;
}

module.exports = {
    getAllUsers,
    findUser,
    createUser,
    updateUserBy,
    deleteUserBy,
    countUsers
};