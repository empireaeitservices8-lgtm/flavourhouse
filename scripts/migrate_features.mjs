import mysql from 'mysql2/promise';

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'srv1882.hstgr.io',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'u774473556_fhuser',
    password: process.env.DB_PASSWORD || 'FlavorHouse@2026#Db!',
    database: process.env.DB_NAME || 'u774473556_fhdb',
  });

  console.log('Connected to MySQL. Running migrations...');

  // 1. Create combo_offers table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS combo_offers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      subtitle VARCHAR(255) NULL,
      description TEXT NULL,
      originalPrice DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      offerPrice DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      savings VARCHAR(100) NULL,
      tag VARCHAR(100) NULL,
      image TEXT NOT NULL,
      items JSON NULL,
      isActive TINYINT(1) NOT NULL DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ combo_offers table verified/created');

  // Seed default combos if empty
  const [existingCombos] = await conn.query('SELECT COUNT(*) as count FROM combo_offers');
  if (existingCombos[0].count === 0) {
    const DEFAULT_COMBOS = [
      {
        name: "Ultimate Pasta Delight Bundle",
        subtitle: "7 Premium Pasta Varieties",
        description: "Get all 7 signature varieties of our gourmet pasta penne. Perfect for wholesome family meals and gourmet dinners.",
        originalPrice: 1400,
        offerPrice: 1120,
        savings: "20% OFF",
        tag: "POPULAR",
        image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?q=80&w=1080&auto=format&fit=crop",
        items: JSON.stringify([
          "Moringa Pasta Penne",
          "Beetroot Pasta Penne",
          "Little Grain Pasta Penne",
          "Foxtail Pasta Penne",
          "Multi Grain Pasta Penne",
          "Ragi Pasta Penne",
          "Jackfruit Pasta Penne"
        ])
      },
      {
        name: "Wholesome Breakfast Pack",
        subtitle: "Vermicelli + Noodles + Cookies",
        description: "Start your morning with energizing nutrition. Includes rich vermicelli, multi-grain noodles, and delicious jaggery cookies.",
        originalPrice: 950,
        offerPrice: 712,
        savings: "25% OFF",
        tag: "BEST SELLER",
        image: "/images/breakfast_bundle.png",
        items: JSON.stringify([
          "Quinoa Vermicelli",
          "Multi Grain Noodles",
          "Jowar Jaggery Cookies",
          "Choco Oats Nutrigen Cookies"
        ])
      },
      {
        name: "Delight Snacking Box",
        subtitle: "6 Handcrafted Cookie Packs",
        description: "Pure guilt-free indulgence. Made with natural jaggery, whole oats, and zero refined sugar.",
        originalPrice: 1200,
        offerPrice: 1020,
        savings: "15% OFF",
        tag: "NEW",
        image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=1080&auto=format&fit=crop",
        items: JSON.stringify([
          "Choco Oats Cookies",
          "Vanilla Oats Cookies",
          "Fruit & Nuts Cookies",
          "Multi Grain Cookies",
          "Mocha Oats Cookies",
          "Ragi Jaggery Cookies"
        ])
      },
      {
        name: "Family Pantry Mega Bundle",
        subtitle: "Complete Food Assortment",
        description: "The ultimate stock-up package for your home. Includes pasta, noodles, vermicelli, and cookies at an unbeatable discount.",
        originalPrice: 2200,
        offerPrice: 1650,
        savings: "25% OFF",
        tag: "SUPER VALUE",
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1080&auto=format&fit=crop",
        items: JSON.stringify([
          "3x Pasta Packs",
          "3x Noodles Packs",
          "3x Vermicelli Packs",
          "3x Cookie Packs"
        ])
      }
    ];

    for (const c of DEFAULT_COMBOS) {
      await conn.query(
        `INSERT INTO combo_offers (name, subtitle, description, originalPrice, offerPrice, savings, tag, image, items, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [c.name, c.subtitle, c.description, c.originalPrice, c.offerPrice, c.savings, c.tag, c.image, c.items]
      );
    }
    console.log('✓ Seeded default combo offers');
  }

  // 2. Create recipes table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL DEFAULT 'Pasta',
      prepTime VARCHAR(50) NULL DEFAULT '15 mins',
      cookTime VARCHAR(50) NULL DEFAULT '15 mins',
      difficulty VARCHAR(50) NULL DEFAULT 'Easy',
      servings VARCHAR(50) NULL DEFAULT '2-3',
      image TEXT NOT NULL,
      description TEXT NULL,
      ingredients JSON NULL,
      instructions JSON NULL,
      isActive TINYINT(1) NOT NULL DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ recipes table verified/created');

  // Seed default recipes if empty
  const [existingRecipes] = await conn.query('SELECT COUNT(*) as count FROM recipes');
  if (existingRecipes[0].count === 0) {
    const DEFAULT_RECIPES = [
      {
        title: "Creamy Moringa Penne Pasta",
        category: "Pasta",
        prepTime: "15 mins",
        cookTime: "12 mins",
        difficulty: "Easy",
        servings: "2-3",
        image: "/images/pasta.png",
        description: "A rich, vibrant pasta dish featuring our Moringa Penne tossed in a garlic herb olive oil sauce with cherry tomatoes and fresh parmesan.",
        ingredients: JSON.stringify([
          "200g Moringa Pasta Penne",
          "2 tbsp extra virgin olive oil",
          "3 cloves garlic, minced",
          "1 cup cherry tomatoes, halved",
          "Fresh basil leaves & grated parmesan",
          "Salt & freshly cracked black pepper"
        ]),
        instructions: JSON.stringify([
          "Boil Moringa Penne in salted water for 7-8 minutes until al dente.",
          "Heat olive oil in a skillet and sauté minced garlic until fragrant.",
          "Add cherry tomatoes and cook gently for 3-4 minutes.",
          "Toss in cooked penne pasta with 2 tbsp reserved pasta water.",
          "Garnish with basil and parmesan cheese. Serve hot!"
        ])
      },
      {
        title: "Vibrant Beetroot Pasta Primavera",
        category: "Pasta",
        prepTime: "10 mins",
        cookTime: "15 mins",
        difficulty: "Easy",
        servings: "2",
        image: "https://images.unsplash.com/photo-1598720290281-9f26ae6d6f81?q=80&w=1080&auto=format&fit=crop",
        description: "A naturally colorful and sweet beetroot pasta dish loaded with sautéed bell peppers, spinach, and goat cheese.",
        ingredients: JSON.stringify([
          "200g Beetroot Pasta Penne",
          "1 tbsp olive oil",
          "1/2 cup diced bell peppers",
          "1 cup baby spinach",
          "Feta or goat cheese for topping"
        ]),
        instructions: JSON.stringify([
          "Cook Beetroot Penne in boiling water for 8 minutes and drain.",
          "Sauté bell peppers in olive oil until soft.",
          "Add baby spinach until wilted.",
          "Combine pasta, season with pepper, and sprinkle crumbled cheese."
        ])
      },
      {
        title: "Desi Style Spicy Grain Noodles",
        category: "Noodles",
        prepTime: "10 mins",
        cookTime: "10 mins",
        difficulty: "Medium",
        servings: "2",
        image: "/images/noodles.png",
        description: "Flavor-packed stir-fried noodles tossed with crunchy vegetables, soya sauce, and aromatic green chillies.",
        ingredients: JSON.stringify([
          "150g Multi Grain Noodles",
          "1/2 cup shredded cabbage",
          "1/2 cup julienned carrots & capsicum",
          "1 tbsp dark soya sauce & chilli sauce",
          "1 tbsp oil & spring onions"
        ]),
        instructions: JSON.stringify([
          "Boil noodles for 5 minutes, drain and rinse under cold water with a drop of oil.",
          "Stir-fry vegetables in a hot wok for 2-3 minutes.",
          "Add sauces, noodles, and toss vigorously over high heat.",
          "Garnish with fresh spring onions and serve hot."
        ])
      },
      {
        title: "Traditional Sweet Quinoa Vermicelli Kheer",
        category: "Vermicelli",
        prepTime: "10 mins",
        cookTime: "20 mins",
        difficulty: "Easy",
        servings: "4",
        image: "/images/vermicelli.png",
        description: "A fragrant traditional sweet dessert made with roasted Quinoa vermicelli, milk, cardamom, and toasted nuts.",
        ingredients: JSON.stringify([
          "100g Quinoa Vermicelli",
          "1 liter whole milk",
          "1/2 cup jaggery powder or sugar",
          "1/4 tsp cardamom powder",
          "2 tbsp ghee, cashews & raisins"
        ]),
        instructions: JSON.stringify([
          "Roast vermicelli in ghee until golden brown.",
          "Bring milk to a boil and simmer roasted vermicelli until soft.",
          "Add cardamom powder and jaggery powder.",
          "Top with fried cashews and raisins. Serve warm or chilled."
        ])
      },
      {
        title: "Crunchy Oats & Jaggery Parfait",
        category: "Cookies",
        prepTime: "5 mins",
        cookTime: "0 mins",
        difficulty: "Super Easy",
        servings: "1",
        image: "/images/cookies.png",
        description: "A refreshing breakfast layer bowl featuring crushed Oats Nutrigen cookies, Greek yogurt, honey, and fresh berries.",
        ingredients: JSON.stringify([
          "4 Choco Oats Nutrigen Cookies, crushed",
          "1 cup Greek yogurt",
          "1 tbsp raw honey",
          "Fresh blueberries or strawberries"
        ]),
        instructions: JSON.stringify([
          "Layer crushed cookies at the bottom of a glass.",
          "Add a layer of honeyed Greek yogurt.",
          "Top with fresh berries and additional cookie crumbles."
        ])
      }
    ];

    for (const r of DEFAULT_RECIPES) {
      await conn.query(
        `INSERT INTO recipes (title, category, prepTime, cookTime, difficulty, servings, image, description, ingredients, instructions, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [r.title, r.category, r.prepTime, r.cookTime, r.difficulty, r.servings, r.image, r.description, r.ingredients, r.instructions]
      );
    }
    console.log('✓ Seeded default recipes');
  }

  // 3. Create homepage_settings table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS homepage_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      heroImage TEXT NULL,
      heroBadge VARCHAR(255) NULL,
      heroTitlePart1 VARCHAR(255) NULL,
      heroTitlePart2 VARCHAR(255) NULL,
      heroDescription TEXT NULL,
      heroButton1Text VARCHAR(255) NULL,
      heroButton1Link VARCHAR(255) NULL,
      heroButton2Text VARCHAR(255) NULL,
      heroButton2Link VARCHAR(255) NULL,
      heroFloatingTitle VARCHAR(255) NULL,
      heroFloatingSubtitle VARCHAR(255) NULL,
      storyImage TEXT NULL,
      storyBadge VARCHAR(255) NULL,
      storyTitlePart1 VARCHAR(255) NULL,
      storyTitlePart2 VARCHAR(255) NULL,
      storyParagraph1 TEXT NULL,
      storyParagraph2 TEXT NULL,
      whyMilletsImage TEXT NULL,
      whyMilletsTitle VARCHAR(255) NULL,
      whyMilletsSubtitle VARCHAR(255) NULL,
      banner1Image TEXT NULL,
      banner1Title VARCHAR(255) NULL,
      banner1Link VARCHAR(255) NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ homepage_settings table verified/created');

  // Seed default homepage settings if empty
  const [existingHome] = await conn.query('SELECT COUNT(*) as count FROM homepage_settings');
  if (existingHome[0].count === 0) {
    await conn.query(
      `INSERT INTO homepage_settings (
        id, heroImage, heroBadge, heroTitlePart1, heroTitlePart2, heroDescription,
        heroButton1Text, heroButton1Link, heroButton2Text, heroButton2Link,
        heroFloatingTitle, heroFloatingSubtitle,
        storyImage, storyBadge, storyTitlePart1, storyTitlePart2, storyParagraph1, storyParagraph2,
        whyMilletsImage, whyMilletsTitle, whyMilletsSubtitle
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop',
        'Premium Organic Food',
        'Rooted in Health.',
        'Rich in Flavour.',
        'Discover premium organic foods made with wholesome ingredients and traditional goodness for modern lifestyles.',
        'Shop Products',
        '/products',
        'Explore Categories',
        '/products',
        '100% Natural',
        'Pure Nutrition',
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=1080&auto=format&fit=crop',
        'Our Roots',
        'Rooted in Health.',
        'Rich in Flavour.',
        'Flavor House was founded with a simple yet powerful mission: to bring wholesome, authentic quality foods to modern dining tables without compromising on taste.',
        "We believe that pure food shouldn't be a compromise. By combining high quality natural ingredients with innovative recipes, we've created a range of products that are as delicious as they are nutritious.",
        'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=1080&auto=format&fit=crop',
        '100%',
        'Pure Organic Ingredients'
      ]
    );
    console.log('✓ Seeded default homepage settings');
  }

  // 4. Add email notification / SMTP columns to store_settings
  const [cols] = await conn.query('DESCRIBE store_settings');
  const existingColNames = cols.map(c => c.Field);

  const newCols = [
    { name: 'orderNotificationEmail', sql: 'ALTER TABLE store_settings ADD COLUMN orderNotificationEmail VARCHAR(255) NULL' },
    { name: 'smtpHost', sql: 'ALTER TABLE store_settings ADD COLUMN smtpHost VARCHAR(255) NULL' },
    { name: 'smtpPort', sql: 'ALTER TABLE store_settings ADD COLUMN smtpPort INT NULL DEFAULT 465' },
    { name: 'smtpUser', sql: 'ALTER TABLE store_settings ADD COLUMN smtpUser VARCHAR(255) NULL' },
    { name: 'smtpPass', sql: 'ALTER TABLE store_settings ADD COLUMN smtpPass VARCHAR(255) NULL' },
    { name: 'smtpSecure', sql: 'ALTER TABLE store_settings ADD COLUMN smtpSecure TINYINT(1) DEFAULT 1' },
    { name: 'emailNotificationsEnabled', sql: 'ALTER TABLE store_settings ADD COLUMN emailNotificationsEnabled TINYINT(1) DEFAULT 1' },
  ];

  for (const nc of newCols) {
    if (!existingColNames.includes(nc.name)) {
      try {
        await conn.query(nc.sql);
        console.log(`✓ Added column ${nc.name} to store_settings`);
      } catch (e) {
        console.warn(`Could not add column ${nc.name}:`, e.message);
      }
    }
  }

  await conn.end();
  console.log('All migrations completed successfully!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
