require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SEED_PRODUCTS = [
  // PASTA
  { id: 1, name: "Moringa Pasta Penne", category: "Pasta", price: 180, image: "https://plus.unsplash.com/premium_photo-1705404738201-8904bca55e2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Moringa Pasta Penne - Premium healthy organic millet product by Flavor House." },
  { id: 2, name: "Beetroot Pasta Penne", category: "Pasta", price: 180, image: "https://images.unsplash.com/photo-1598720290281-9f26ae6d6f81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Beetroot Pasta Penne - Premium healthy organic millet product by Flavor House." },
  { id: 3, name: "Little Grain Pasta Penne", category: "Pasta", price: 170, image: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Little Grain Pasta Penne - Premium healthy organic millet product." },
  { id: 4, name: "Foxtail Pasta Penne", category: "Pasta", price: 170, image: "https://images.unsplash.com/photo-1612966893103-790e549a2ab1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Foxtail Pasta Penne - Premium healthy organic millet product." },
  { id: 5, name: "Multi Grain Pasta Penne", category: "Pasta", price: 190, image: "https://plus.unsplash.com/premium_photo-1705404738522-9fbccb624cf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Multi Grain Pasta Penne - Premium healthy organic product." },
  { id: 6, name: "Ragi Pasta Penne", category: "Pasta", price: 170, image: "https://images.unsplash.com/photo-1587682725980-b9ac16626266?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Ragi Pasta Penne - Premium healthy organic millet product." },
  { id: 7, name: "Jackfruit Pasta Penne", category: "Pasta", price: 210, image: "https://images.unsplash.com/photo-1646953568310-8def6eb5a317?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Jackfruit Pasta Penne - Premium healthy organic millet product." },

  // VERMICELLI
  { id: 8, name: "Quinoa Vermicelli", category: "Vermicelli", price: 160, image: "https://plus.unsplash.com/premium_photo-1674025753567-48b817c5b62c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Quinoa Vermicelli - Premium healthy organic product." },
  { id: 9, name: "Little Vermicelli", category: "Vermicelli", price: 140, image: "https://images.unsplash.com/photo-1646338118864-6976f8182717?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Little Vermicelli - Premium healthy organic millet product." },
  { id: 10, name: "Foxtail Vermicelli", category: "Vermicelli", price: 140, image: "https://images.unsplash.com/photo-1722032393693-691b59565eaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Foxtail Vermicelli - Premium healthy organic millet product." },
  { id: 11, name: "Multi Grain Vermicelli", category: "Vermicelli", price: 150, image: "https://images.unsplash.com/photo-1710508803646-88f4fba75c11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Multi Grain Vermicelli - Premium healthy organic product." },
  { id: 12, name: "Ragi Vermicelli", category: "Vermicelli", price: 140, image: "https://plus.unsplash.com/premium_photo-1675338317134-cf4a9ee1f869?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Ragi Vermicelli - Premium healthy organic millet product." },
  { id: 13, name: "Moringa Vermicelli", category: "Vermicelli", price: 150, image: "https://images.unsplash.com/photo-1701480254009-53c2bf8a82ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Moringa Vermicelli - Premium healthy organic millet product." },
  { id: 14, name: "Horsegram Vermicelli", category: "Vermicelli", price: 150, image: "https://images.unsplash.com/photo-1677657094943-35ff0718211b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Horsegram Vermicelli - Premium healthy organic millet product." },

  // NOODLES
  { id: 15, name: "Multi Grain Noodles", category: "Noodles", price: 160, image: "https://plus.unsplash.com/premium_photo-1694670234085-4f38b261ce5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Multi Grain Noodles - Premium healthy organic product." },
  { id: 16, name: "Ragi Noodles", category: "Noodles", price: 150, image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Ragi Noodles - Premium healthy organic millet product." },
  { id: 17, name: "Moringa Noodles", category: "Noodles", price: 160, image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Moringa Noodles - Premium healthy organic millet product." },
  { id: 18, name: "Beetroot Noodles", category: "Noodles", price: 160, image: "https://images.unsplash.com/photo-1600490036275-35f5f1656861?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Beetroot Noodles - Premium healthy organic millet product." },
  { id: 19, name: "Horsegram Noodles", category: "Noodles", price: 150, image: "https://plus.unsplash.com/premium_photo-1694547926001-f2151e4a476b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Horsegram Noodles - Premium healthy organic product." },
  { id: 20, name: "Quinoa Noodles", category: "Noodles", price: 180, image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Quinoa Noodles - Premium healthy organic product." },
  { id: 21, name: "Little Noodles", category: "Noodles", price: 150, image: "https://images.unsplash.com/photo-1633352615955-f0c99e8b7e5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Little Noodles - Premium healthy organic millet product." },
  { id: 22, name: "Foxtail Noodles", category: "Noodles", price: 150, image: "https://images.unsplash.com/photo-1555126634-323283e090fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Foxtail Noodles - Premium healthy organic millet product." },

  // COOKIES
  { id: 23, name: "Jowar Jaggery Cookies", category: "Cookies", price: 120, image: "https://plus.unsplash.com/premium_photo-1668772704254-c4c4798b0e5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Jowar Jaggery Cookies - Premium healthy organic product." },
  { id: 24, name: "Choco Oats Nutrigen Cookies", category: "Cookies", price: 140, image: "https://images.unsplash.com/photo-1598839950984-034f6dc7b495?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Choco Oats Nutrigen Cookies - Premium healthy organic product." },
  { id: 25, name: "Multi Grain Jaggery Cookies", category: "Cookies", price: 130, image: "https://images.unsplash.com/photo-1557310717-d6bea9f36682?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Multi Grain Jaggery Cookies - Premium healthy organic product." },
  { id: 26, name: "Vanilla Oats Nutrigen Cookies", category: "Cookies", price: 130, image: "https://images.unsplash.com/photo-1576717585968-8ea8166b89b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Vanilla Oats Nutrigen Cookies - Premium healthy organic product." },
  { id: 27, name: "Fruit and Nuts Oats Nutrigen Cookies", category: "Cookies", price: 160, image: "https://plus.unsplash.com/premium_photo-1670895801135-858a7d167ea4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Fruit and Nuts Oats Nutrigen Cookies - Premium healthy organic product." },
  { id: 28, name: "Mocha Oats Nutrigen Cookies", category: "Cookies", price: 150, image: "https://images.unsplash.com/photo-1664854678365-ad59da72356c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Mocha Oats Nutrigen Cookies - Premium healthy organic product." },
  { id: 29, name: "Little Grain Jaggery Cookies", category: "Cookies", price: 120, image: "https://images.unsplash.com/photo-1571165841024-2ce92069301d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Little Grain Jaggery Cookies - Premium healthy organic product." },
  { id: 30, name: "Barnyard Jaggery Cookies", category: "Cookies", price: 120, image: "https://images.unsplash.com/photo-1673886089869-a9b1c71a8138?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Barnyard Jaggery Cookies - Premium healthy organic product." },
  { id: 31, name: "Foxtail Jaggery Cookies", category: "Cookies", price: 120, image: "https://plus.unsplash.com/premium_photo-1670895802275-ed748ced4309?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Foxtail Jaggery Cookies - Premium healthy organic product." },
  { id: 32, name: "Kodo Jaggery Cookies", category: "Cookies", price: 120, image: "https://images.unsplash.com/photo-1600147573971-a2135dbff47e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Kodo Jaggery Cookies - Premium healthy organic product." },
  { id: 33, name: "Ragi Jaggery Cookies", category: "Cookies", price: 120, image: "https://images.unsplash.com/photo-1505252784141-72a7a8073787?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Ragi Jaggery Cookies - Premium healthy organic product." },
  { id: 34, name: "Pearl Grain Jaggery Cookies", category: "Cookies", price: 120, image: "https://images.unsplash.com/photo-1554175231-8367073ba4e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Pearl Grain Jaggery Cookies - Premium healthy organic product." },
];

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@flavorhousefoods.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Fh@2026#SecureAdmin!';
  const adminName = process.env.ADMIN_NAME || 'Flavour House Admin';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash: passwordHash,
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash: passwordHash,
    },
  });
  console.log('👤 Admin configured:', admin.email);

  // 2. Categories
  const categoryNames = ['Pasta', 'Vermicelli', 'Noodles', 'Cookies'];
  const categoryMap = {};

  for (const catName of categoryNames) {
    const slug = slugify(catName);
    const cat = await prisma.category.upsert({
      where: { name: catName },
      update: {},
      create: {
        name: catName,
        slug: slug,
        description: `Premium organic ${catName.toLowerCase()} crafted from nutritious ancient grains and millets.`,
      },
    });
    categoryMap[catName] = cat.id;
  }
  console.log('📦 Categories created:', Object.keys(categoryMap));

  // 3. Products
  for (const item of SEED_PRODUCTS) {
    const slug = slugify(item.name);
    const categoryId = categoryMap[item.category] || null;

    await prisma.product.upsert({
      where: { slug: slug },
      update: {
        name: item.name,
        price: item.price,
        image: item.image,
        description: item.description,
        categoryId: categoryId,
        isActive: true,
      },
      create: {
        name: item.name,
        slug: slug,
        description: item.description,
        image: item.image,
        categoryId: categoryId,
        price: item.price,
        discountPrice: null,
        stock: 50,
        SKU: `FH-${slug.toUpperCase().slice(0, 8)}-${item.id}`,
        isActive: true,
        isFeatured: item.id <= 4,
      },
    });
  }
  console.log(`🌾 Seeded ${SEED_PRODUCTS.length} products.`);

  // 4. Store Settings
  const settingsCount = await prisma.storeSettings.count();
  if (settingsCount === 0) {
    await prisma.storeSettings.create({
      data: {
        storeName: 'Flavour House',
        logo: '/logo.png',
        email: 'support@flavorhousefoods.com',
        phone: '+91 9876543210',
        address: 'Flavour House, Food Processing Zone, Kochi, Kerala, India',
        deliveryCharge: 50,
        minFreeDelivery: 500,
        storeAvailability: true,
        facebookUrl: 'https://www.facebook.com/share/17rmar29kM/?mibextid=wwXIfr',
        instagramUrl: 'https://www.instagram.com/flavorhouse.in?igsh=bGY2aWhpeWM1NHBj&utm_source=qr',
        youtubeUrl: 'https://youtube.com/@flavorhousefoods?si=nwsDzLaJsmPDj0rD',
      },
    });
    console.log('⚙️ Default store settings initialized.');
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
