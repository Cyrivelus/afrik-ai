const { run, all } = require('./database');

async function initialize() {
    console.log('🚀 Initialisation de la base de données...');
    
    try {
        // Créer utilisateur admin
        await run(
            'INSERT OR IGNORE INTO users (name, email, phone, location, role, preferences) VALUES (?, ?, ?, ?, ?, ?)',
            ['Cyrille Steve Tamboug', 'cyrillestevetamboug@gmail.com', '696197525', 'Cameroun', 'admin', '{"theme":"dark"}']
        );
        console.log('✅ Utilisateur admin créé');
        
        // Créer agents
        await run(
            'INSERT OR IGNORE INTO agents (name, type, status, config) VALUES (?, ?, ?, ?)',
            ['KAYADE Pro', 'commercial', 'active', '{"languages":["fr","en"]}']
        );
        console.log('✅ Agent commercial créé');
        
        await run(
            'INSERT OR IGNORE INTO agents (name, type, status, config) VALUES (?, ?, ?, ?)',
            ['AFRIK-Finance', 'financial', 'active', '{"currencies":["XOF","CDF","GNF","USD"]}']
        );
        console.log('✅ Agent financier créé');
        
        // Créer produits
        const products = [
            ['Smartphone Samsung A14', 'Smartphone 4G, 128Go', 150000, 50, 'Smartphones'],
            ['Ordinateur HP Pavilion', 'Intel Core i5, 8Go RAM', 350000, 30, 'Ordinateurs'],
            ['Casque Bluetooth', 'Casque sans fil', 25000, 100, 'Accessoires']
        ];
        
        for (const p of products) {
            await run(
                'INSERT OR IGNORE INTO products (name, description, price, stock, category) VALUES (?, ?, ?, ?, ?)',
                p
            );
        }
        console.log('✅ Produits créés');
        
        console.log('🎉 Initialisation terminée avec succès !');
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

initialize();
