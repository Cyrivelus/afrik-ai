const { sequelize, User, Agent, Product } = require('./database');

async function seed() {
    try {
        console.log('🌱 Début du seeding...');
        
        // Créer utilisateur admin
        await User.create({
            name: 'Cyrille Steve Tamboug',
            email: 'cyrillestevetamboug@gmail.com',
            phone: '696197525',
            location: 'Cameroun',
            role: 'admin',
            preferences: { theme: 'dark', notifications: true }
        });
        
        // Créer agents
        await Agent.create({
            name: 'KAYADE Pro',
            type: 'commercial',
            status: 'active',
            config: { languages: ['fr', 'en'], voice: true }
        });
        
        await Agent.create({
            name: 'AFRIK-Finance',
            type: 'financial',
            status: 'active',
            config: { currencies: ['XOF', 'CDF', 'GNF', 'USD'] }
        });
        
        // Créer produits
        await Product.bulkCreate([
            {
                name: 'Smartphone Samsung A14',
                description: 'Smartphone 4G, 128Go, Triple appareil photo',
                price: 150000,
                stock: 50,
                category: 'Smartphones'
            },
            {
                name: 'Ordinateur HP Pavilion',
                description: 'Intel Core i5, 8Go RAM, 512Go SSD',
                price: 350000,
                stock: 30,
                category: 'Ordinateurs'
            }
        ]);
        
        console.log('✅ Seeding terminé avec succès');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur seeding:', error);
        process.exit(1);
    }
}

seed();