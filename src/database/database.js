const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

let db = null;

async function initDatabase() {
    const SQL = await initSqlJs();
    const dbPath = path.join(__dirname, '../../database/afrik-ai.sqlite');
    
    // Charger ou créer la base de données
    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
        
        // Créer les tables
        db.run(`
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                location TEXT,
                role TEXT DEFAULT 'user',
                preferences TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE agents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT,
                status TEXT DEFAULT 'idle',
                config TEXT,
                performance TEXT,
                lastActive DATETIME
            );

            CREATE TABLE conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                agentId INTEGER,
                messages TEXT,
                context TEXT,
                sentiment REAL,
                resolved INTEGER DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL,
                stock INTEGER DEFAULT 0,
                category TEXT,
                images TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Sauvegarder
        const data = db.export();
        fs.writeFileSync(dbPath, Buffer.from(data));
    }
    
    return db;
}

// Fonctions utilitaires
async function query(sql, params = []) {
    if (!db) await initDatabase();
    const stmt = db.prepare(sql);
    const result = stmt.getAsObject(params);
    stmt.free();
    return result;
}

async function run(sql, params = []) {
    if (!db) await initDatabase();
    db.run(sql, params);
    // Sauvegarder après modification
    const data = db.export();
    fs.writeFileSync(path.join(__dirname, '../../database/afrik-ai.sqlite'), Buffer.from(data));
}

async function all(sql, params = []) {
    if (!db) await initDatabase();
    const stmt = db.prepare(sql);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

module.exports = {
    initDatabase,
    query,
    run,
    all
};
