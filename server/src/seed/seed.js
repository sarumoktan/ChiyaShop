    /**
 * Seeds the Chiya Shop catalogue.
 *   npm run seed            → wipes and repopulates (safe in development)
 *   node src/seed/seed.js   → same
 */
const { sequelize, User, Category, Product, Review } = require('../models');
const { slugify } = require('../utils/slugify');

const CATEGORIES = [
  {
    name: 'Milk Chiya',
    tagline: 'The everyday classics, brewed strong',
    icon: '🥛',
    sortOrder: 1,
    description: 'Full-bodied black tea simmered with milk, sugar and patience.',
  },
  {
    name: 'Masala & Spiced',
    tagline: 'Cardamom, ginger, cinnamon, clove',
    icon: '🌿',
    sortOrder: 2,
    description: 'Hand-ground Himalayan spice blends that warm you from the inside out.',
  },
  {
    name: 'Black & Green',
    tagline: 'Single-origin leaves, no milk',
    icon: '🍃',
    sortOrder: 3,
    description: 'First and second flush leaves from Ilam and Darjeeling gardens.',
  },
  {
    name: 'Iced & Cold Brew',
    tagline: 'Slow-steeped, served over ice',
    icon: '🧊',
    sortOrder: 4,
    description: 'Twelve-hour cold brews and shaken iced teas for warm afternoons.',
  },
  {
    name: 'Snacks',
    tagline: 'Because chiya needs company',
    icon: '🥟',
    sortOrder: 5,
    description: 'Momo, samosa, sel roti and other companions to your cup.',
  },
];

const SIZE_SETS = {
  cup: [
    { label: 'Small', priceDelta: -15 },
    { label: 'Regular', priceDelta: 0 },
    { label: 'Large', priceDelta: 30 },
  ],
  glass: [
    { label: 'Regular', priceDelta: 0 },
    { label: 'Large', priceDelta: 40 },
  ],
  plate: [
    { label: 'Half plate', priceDelta: -40 },
    { label: 'Full plate', priceDelta: 0 },
  ],
};

const PRODUCTS = [
  {
    category: 'Milk Chiya',
    name: 'Classic Dudh Chiya',
    tagline: 'Strong black tea, whole milk, just enough sugar',
    price: 60,
    compareAtPrice: 75,
    badge: 'Bestseller',
    isFeatured: true,
    tags: ['classic', 'milk', 'hot'],
    sizes: SIZE_SETS.cup,
    accentFrom: '#e0b07a',
    accentTo: '#8a5a2b',
    caffeineLevel: 'medium',
    calories: 120,
    prepMinutes: 4,
    soldCount: 1840,
    description:
      'The cup that starts every Nepali morning. Assam leaves boiled with fresh milk until the colour turns deep amber.',
    story:
      'Our base blend is a 70/30 mix of Assam and Ilam broken leaf, boiled twice the way the tea shops on Ratna Park have done for fifty years.',
  },
  {
    category: 'Milk Chiya',
    name: 'Malai Chiya',
    tagline: 'Finished with a spoon of clotted cream',
    price: 95,
    badge: 'Rich',
    isFeatured: true,
    tags: ['milk', 'creamy', 'hot'],
    sizes: SIZE_SETS.cup,
    accentFrom: '#f2d6ad',
    accentTo: '#a3703c',
    caffeineLevel: 'medium',
    calories: 210,
    prepMinutes: 6,
    soldCount: 720,
    description:
      'Dudh chiya taken one step further with a thick spoon of malai floated on top. Dessert in a glass.',
  },
  {
    category: 'Milk Chiya',
    name: 'Butter Tea (Suja)',
    tagline: 'Himalayan yak butter and pink salt',
    price: 130,
    tags: ['savoury', 'himalayan', 'hot'],
    sizes: SIZE_SETS.cup,
    accentFrom: '#e8d5b5',
    accentTo: '#7a6142',
    caffeineLevel: 'low',
    calories: 260,
    prepMinutes: 8,
    soldCount: 190,
    description:
      'Churned the traditional way with butter and salt — the drink that keeps Sherpa families warm above 3,000 metres.',
  },
  {
    category: 'Masala & Spiced',
    name: 'Masala Chiya',
    tagline: 'Nine spices, ground the same morning',
    price: 85,
    badge: 'Signature',
    isFeatured: true,
    tags: ['spiced', 'milk', 'hot', 'signature'],
    sizes: SIZE_SETS.cup,
    accentFrom: '#d98f3f',
    accentTo: '#6b3410',
    caffeineLevel: 'medium',
    calories: 150,
    prepMinutes: 7,
    soldCount: 1520,
    description:
      'Green cardamom, ginger, cinnamon, clove, black pepper and fennel simmered into strong milk tea.',
    story:
      'The masala is stone-ground each morning in small batches — never more than a day old, which is why you can smell it from the street.',
  },
  {
    category: 'Masala & Spiced',
    name: 'Adhuwa Chiya',
    tagline: 'Fresh ginger, honey and lemon',
    price: 70,
    tags: ['ginger', 'immunity', 'hot'],
    sizes: SIZE_SETS.cup,
    accentFrom: '#f0c14b',
    accentTo: '#96581a',
    caffeineLevel: 'low',
    calories: 60,
    prepMinutes: 5,
    soldCount: 880,
    isFeatured: true,
    description:
      'A monsoon remedy: hand-pounded ginger steeped with black tea, raw honey and a squeeze of lemon.',
  },
  {
    category: 'Masala & Spiced',
    name: 'Tulsi Ilaichi',
    tagline: 'Holy basil and cardamom, caffeine-free',
    price: 75,
    tags: ['herbal', 'caffeine-free', 'hot'],
    sizes: SIZE_SETS.cup,
    accentFrom: '#a8c686',
    accentTo: '#3d5a2a',
    caffeineLevel: 'none',
    calories: 25,
    prepMinutes: 5,
    soldCount: 410,
    description: 'Garden tulsi leaves and crushed cardamom pods — calm in a cup, no caffeine.',
  },
  {
    category: 'Black & Green',
    name: 'Ilam Golden Tips',
    tagline: 'First flush, hand-plucked in Ilam',
    price: 180,
    badge: 'Premium',
    isFeatured: true,
    tags: ['single-origin', 'black', 'premium'],
    sizes: SIZE_SETS.glass,
    accentFrom: '#e6b566',
    accentTo: '#7c4a12',
    caffeineLevel: 'high',
    calories: 5,
    prepMinutes: 4,
    soldCount: 260,
    description:
      'Golden-tipped first flush with notes of stone fruit and honey. Steeped 3 minutes at 90°C, served without milk.',
    story:
      'Bought direct from a 40-farmer cooperative in Ilam. Every kilo we buy pays roughly twice the auction floor price.',
  },
  {
    category: 'Black & Green',
    name: 'Himalayan Green',
    tagline: 'Grassy, light, endlessly refillable',
    price: 110,
    tags: ['green', 'light'],
    sizes: SIZE_SETS.glass,
    accentFrom: '#bcd98a',
    accentTo: '#43682c',
    caffeineLevel: 'low',
    calories: 3,
    prepMinutes: 3,
    soldCount: 540,
    description: 'Pan-fired green leaf from 2,000m gardens. Sweet, vegetal and forgiving.',
  },
  {
    category: 'Black & Green',
    name: 'Silver Needle White',
    tagline: 'Only the unopened buds',
    price: 240,
    tags: ['white', 'premium', 'delicate'],
    sizes: SIZE_SETS.glass,
    accentFrom: '#f0e6d2',
    accentTo: '#9c8d6e',
    caffeineLevel: 'low',
    calories: 2,
    prepMinutes: 6,
    soldCount: 95,
    description:
      'Downy silver buds picked over two weeks in spring. Impossibly delicate — melon, hay and honey.',
  },
  {
    category: 'Iced & Cold Brew',
    name: 'Iced Lemon Chiya',
    tagline: 'Black tea, lemon, mint, crushed ice',
    price: 120,
    badge: 'Summer',
    isFeatured: true,
    tags: ['iced', 'citrus', 'refreshing'],
    sizes: SIZE_SETS.glass,
    accentFrom: '#f5d35e',
    accentTo: '#a8761c',
    caffeineLevel: 'medium',
    calories: 90,
    prepMinutes: 4,
    soldCount: 1120,
    description: 'Shaken hard with lemon and mint until frost forms on the glass.',
  },
  {
    category: 'Iced & Cold Brew',
    name: 'Cold Brew Ilam',
    tagline: 'Twelve hours, zero bitterness',
    price: 160,
    tags: ['iced', 'cold-brew', 'single-origin'],
    sizes: SIZE_SETS.glass,
    accentFrom: '#d7a86e',
    accentTo: '#6f4218',
    caffeineLevel: 'high',
    calories: 10,
    prepMinutes: 2,
    soldCount: 480,
    description:
      'Ilam black leaf steeped cold overnight, poured over a single clear ice block. Smooth, malty, clean.',
  },
  {
    category: 'Iced & Cold Brew',
    name: 'Peach Iced Green',
    tagline: 'Cold-steeped green tea with real peach',
    price: 140,
    tags: ['iced', 'fruity', 'green'],
    sizes: SIZE_SETS.glass,
    accentFrom: '#f7b7a3',
    accentTo: '#a34d33',
    caffeineLevel: 'low',
    calories: 110,
    prepMinutes: 3,
    soldCount: 630,
    description: 'Himalayan green tea, muddled peach and a whisper of honey over ice.',
  },
  {
    category: 'Snacks',
    name: 'Steamed Chicken Momo',
    tagline: 'Ten pieces, tomato achar',
    price: 220,
    badge: 'Crowd favourite',
    isFeatured: true,
    tags: ['momo', 'savoury', 'popular'],
    sizes: SIZE_SETS.plate,
    accentFrom: '#f0dcc0',
    accentTo: '#8a5f38',
    caffeineLevel: 'none',
    calories: 480,
    prepMinutes: 14,
    soldCount: 1980,
    description:
      'Hand-pleated momo steamed to order, served with fire-roasted tomato and sesame achar.',
  },
  {
    category: 'Snacks',
    name: 'Veg Samosa',
    tagline: 'Two pieces, mint chutney',
    price: 90,
    tags: ['fried', 'vegetarian'],
    sizes: SIZE_SETS.plate,
    accentFrom: '#e9c78a',
    accentTo: '#8f5d1e',
    caffeineLevel: 'none',
    calories: 320,
    prepMinutes: 8,
    soldCount: 860,
    description: 'Spiced potato and pea, folded in a flaky shell and fried to order.',
  },
  {
    category: 'Snacks',
    name: 'Sel Roti',
    tagline: 'Sweet rice ring, fried fresh',
    price: 60,
    tags: ['sweet', 'traditional'],
    sizes: SIZE_SETS.plate,
    accentFrom: '#f2cf9b',
    accentTo: '#97662a',
    caffeineLevel: 'none',
    calories: 240,
    prepMinutes: 10,
    soldCount: 520,
    description:
      'Fermented rice batter piped into hot oil — crisp edge, soft middle, best dunked in chiya.',
  },
  {
    category: 'Snacks',
    name: 'Chatamari',
    tagline: 'Newari rice crêpe with egg',
    price: 180,
    tags: ['newari', 'savoury'],
    sizes: SIZE_SETS.plate,
    accentFrom: '#e8c9a0',
    accentTo: '#7d5327',
    caffeineLevel: 'none',
    calories: 360,
    prepMinutes: 12,
    soldCount: 300,
    description: 'Thin rice-flour crêpe topped with minced meat, egg and fresh herbs.',
  },
];

const REVIEW_SEEDS = [
  { rating: 5, comment: 'Tastes exactly like the chiya from my hostel days. Perfect strength.' },
  { rating: 5, comment: 'Arrived hot, cup sealed properly, no spills. Ordering again tomorrow.' },
  { rating: 4, comment: 'Lovely spice balance — could use a touch less sugar for my taste.' },
  { rating: 5, comment: 'The malai on top is unreal. Worth every rupee.' },
  { rating: 4, comment: 'Good value and quick delivery to Lazimpat.' },
];

const run = async () => {
  console.log('🍵 Seeding Chiya Shop…');

  await sequelize.authenticate();
  // Rebuild the schema so seeding is repeatable.
  await sequelize.sync({ force: true });
  console.log('   schema rebuilt');

  const categories = await Category.bulkCreate(
    CATEGORIES.map((c) => ({ ...c, slug: slugify(c.name) })),
    { validate: true }
  );
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
  console.log(`   ${categories.length} categories`);

  const products = await Product.bulkCreate(
    PRODUCTS.map(({ category, ...rest }) => ({
      ...rest,
      slug: slugify(rest.name),
      categoryId: categoryBySlug.get(slugify(category))?.id || null,
      stock: 100,
      isAvailable: true,
    })),
    { validate: true }
  );
  console.log(`   ${products.length} products`);

  // Users are created individually so the bcrypt hook runs per record.
  const admin = await User.create({
    name: 'Sarumo Ktan',
    email: 'admin@chiyashop.com',
    password: 'Chiya@2026',
    role: 'admin',
    phone: '+977 9801000001',
    city: 'Kathmandu',
    address: 'Jhamsikhel, Lalitpur',
  });

  const demo = await User.create({
    name: 'Aarati Sharma',
    email: 'demo@chiyashop.com',
    password: 'Demo@1234',
    phone: '+977 9801000002',
    city: 'Kathmandu',
    address: 'Lazimpat, Kathmandu',
  });

  const extras = await Promise.all(
    ['Bishal Rai', 'Nisha Tamang', 'Kiran Gurung'].map((name, i) =>
      User.create({
        name,
        email: `${slugify(name)}@example.com`,
        password: `Chiya@${1000 + i}`,
        city: 'Kathmandu',
      })
    )
  );
  console.log('   5 users (1 admin, 4 customers)');

  // Spread a few reviews across the featured products.
  const reviewers = [demo, ...extras];
  const reviewed = products.filter((p) => p.isFeatured).slice(0, 6);
  const rows = [];
  reviewed.forEach((product, pIndex) => {
    reviewers.slice(0, 3 + (pIndex % 2)).forEach((user, uIndex) => {
      const seed = REVIEW_SEEDS[(pIndex + uIndex) % REVIEW_SEEDS.length];
      rows.push({ productId: product.id, userId: user.id, ...seed });
    });
  });
  await Review.bulkCreate(rows);

  // Refresh the denormalised rating aggregates.
  const { refreshProductRating } = require('../controllers/review.controller');
  await Promise.all(reviewed.map((p) => refreshProductRating(p.id)));
  console.log(`   ${rows.length} reviews`);

  console.log('\n✅ Done. Sign in with:');
  console.log('   admin  → admin@chiyashop.com / Chiya@2026');
  console.log('   user   → demo@chiyashop.com  / Demo@1234\n');

  await sequelize.close();
};

run().catch(async (err) => {
  console.error('\n✖ Seeding failed:', err.message);
  if (err.name?.startsWith('SequelizeConnection')) {
    console.error('Is PostgreSQL running and does the database exist? See server/.env');
  }
  await sequelize.close().catch(() => {});
  process.exit(1);
});
