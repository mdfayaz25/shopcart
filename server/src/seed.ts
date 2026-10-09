import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Product } from './models/Product.js';
import { Review } from './models/Review.js';
import { Order } from './models/Order.js';
import { Wishlist } from './models/Wishlist.js';
import { computeTotals, slugify } from './lib/pricing.js';

type Seed = {
  name: string; brand: string; category: string; price: number; compareAtPrice?: number; stock: number;
  icon: string; tone: string; featured?: boolean; tags: string[]; description: string; specs: [string, string][];
};

const products: Seed[] = [
  { name: 'Aura Pro Wireless Headphones', brand: 'Sonique', category: 'Audio', price: 12999, compareAtPrice: 16999, stock: 34, icon: 'headphones', tone: '#FF5A1F', featured: true, tags: ['anc', 'bluetooth', 'over-ear'], description: 'Adaptive noise cancelling over-ear headphones with 40-hour battery life, plush memory-foam cushions and a tuned 40 mm driver that keeps bass tight at any volume.', specs: [['Battery', '40 hours'], ['Driver', '40 mm dynamic'], ['Connectivity', 'Bluetooth 5.3, USB-C audio'], ['Weight', '254 g']] },
  { name: 'Pulse Buds ANC', featured: true, brand: 'Sonique', category: 'Audio', price: 5499, compareAtPrice: 6999, stock: 58, icon: 'earbuds', tone: '#7C3AED', tags: ['earbuds', 'anc'], description: 'Compact true-wireless earbuds with hybrid noise cancelling, transparency mode and a pocketable wireless-charging case.', specs: [['Battery', '8 h + 24 h case'], ['Water resistance', 'IPX5'], ['Codec', 'AAC, LDAC']] },
  { name: 'Boom Mini Speaker', brand: 'Decibel', category: 'Audio', price: 3299, stock: 4, icon: 'speaker', tone: '#0EA5E9', tags: ['speaker', 'portable'], description: 'A palm-sized speaker with surprising low end, IP67 dust and water protection and stereo pairing for two.', specs: [['Output', '10 W'], ['Battery', '14 hours'], ['Rating', 'IP67']] },
  { name: 'Studio Monitor 5', brand: 'Decibel', category: 'Audio', price: 18999, stock: 12, icon: 'speaker', tone: '#111827', tags: ['studio', 'monitor'], description: 'Bi-amped studio monitors with a flat response curve for mixing, room-correction switches and balanced XLR inputs.', specs: [['Woofer', '5 inch'], ['Inputs', 'XLR, TRS, RCA'], ['Frequency', '48 Hz – 22 kHz']] },
  { name: 'Orbit Smartwatch S2', brand: 'Kinetic', category: 'Wearables', price: 15999, compareAtPrice: 18999, stock: 22, icon: 'watch', tone: '#10B981', featured: true, tags: ['smartwatch', 'fitness', 'amoled'], description: 'An always-on AMOLED smartwatch with dual-band GPS, SpO2 and heart-rate tracking, and seven days of battery between charges.', specs: [['Display', '1.43" AMOLED'], ['Battery', '7 days'], ['GPS', 'Dual-band L1 + L5'], ['Water', '5 ATM']] },
  { name: 'Stride Fitness Band', brand: 'Kinetic', category: 'Wearables', price: 2999, stock: 80, icon: 'activity', tone: '#F59E0B', tags: ['fitness', 'band'], description: 'A featherweight fitness band that tracks steps, sleep stages and workouts, with 14-day battery life.', specs: [['Battery', '14 days'], ['Sensors', 'HR, SpO2, accelerometer'], ['Weight', '22 g']] },
  { name: 'Vision Smart Glasses', brand: 'Lumen', category: 'Wearables', price: 24999, stock: 3, icon: 'glasses', tone: '#334155', tags: ['glasses', 'audio'], description: 'Open-ear audio glasses with blue-light lenses, touch controls on the arm and a voice assistant one tap away.', specs: [['Audio', 'Open-ear speakers'], ['Battery', '6 hours'], ['Lens', 'Blue-light filter']] },
  { name: 'Nimbus 14 Ultrabook', brand: 'Arcline', category: 'Computing', price: 84999, compareAtPrice: 94999, stock: 9, icon: 'laptop', tone: '#2563EB', featured: true, tags: ['laptop', 'ultrabook'], description: 'A 1.2 kg aluminium ultrabook with a 2.8K 120 Hz display, 16 GB RAM, 1 TB SSD and an all-day battery for real work away from the desk.', specs: [['Display', '14" 2.8K 120 Hz'], ['Memory', '16 GB LPDDR5'], ['Storage', '1 TB NVMe'], ['Weight', '1.2 kg']] },
  { name: 'Keystone 75 Mechanical Keyboard', brand: 'Arcline', category: 'Computing', price: 7999, stock: 41, icon: 'keyboard', tone: '#EF4444', featured: true, tags: ['keyboard', 'mechanical', 'hot-swap'], description: 'A gasket-mounted 75% keyboard with hot-swap switches, PBT keycaps and tri-mode connectivity across three devices.', specs: [['Layout', '75%, 82 keys'], ['Switches', 'Linear, hot-swap'], ['Connectivity', '2.4 GHz, Bluetooth, USB-C']] },
  { name: 'Glide Ergonomic Mouse', brand: 'Arcline', category: 'Computing', price: 3499, stock: 66, icon: 'mouse', tone: '#14B8A6', tags: ['mouse', 'ergonomic'], description: 'A sculpted vertical-tilt mouse with a silent click, an 8K DPI sensor and a scroll wheel that switches to free-spin.', specs: [['Sensor', '8000 DPI'], ['Battery', '70 days'], ['Buttons', '6 programmable']] },
  { name: 'Clarity 27" 4K Monitor', brand: 'Lumen', category: 'Computing', price: 32999, stock: 14, icon: 'monitor', tone: '#6366F1', tags: ['monitor', '4k'], description: 'A factory-calibrated 27-inch 4K IPS display with 98% DCI-P3, USB-C 90 W power delivery and a fully adjustable stand.', specs: [['Panel', '27" IPS 4K'], ['Colour', '98% DCI-P3'], ['Ports', 'USB-C 90 W, HDMI 2.1, DP']] },
  { name: 'Snap Mirrorless Camera Z50', brand: 'Optica', category: 'Cameras', price: 68999, compareAtPrice: 74999, stock: 7, icon: 'camera', tone: '#F97316', featured: true, tags: ['camera', 'mirrorless', '4k'], description: 'A compact mirrorless body with a 26 MP APS-C sensor, in-body stabilisation and 4K 60p video for creators who travel light.', specs: [['Sensor', '26 MP APS-C'], ['Video', '4K 60p, 10-bit'], ['Stabilisation', '5-axis IBIS']] },
  { name: 'Action Cam 4K', brand: 'Optica', category: 'Cameras', price: 21999, stock: 19, icon: 'video', tone: '#0F766E', tags: ['action', 'waterproof'], description: 'A rugged, waterproof action camera with horizon-lock stabilisation and a front screen for vlogging.', specs: [['Video', '4K 120 fps'], ['Waterproof', '10 m'], ['Screens', 'Front + rear']] },
  { name: 'Prism Instant Camera', brand: 'Optica', category: 'Cameras', price: 6499, stock: 0, icon: 'aperture', tone: '#EC4899', tags: ['instant', 'film'], description: 'An instant film camera with auto exposure, a selfie mirror and a close-up mode for credit-card sized prints.', specs: [['Film', 'Instant mini'], ['Flash', 'Auto'], ['Batteries', '2 × AA']] },
  { name: 'Nova Wireless Controller', brand: 'Respawn', category: 'Gaming', price: 4999, stock: 47, icon: 'gamepad', tone: '#8B5CF6', featured: true, tags: ['controller', 'gaming'], description: 'Hall-effect sticks that never drift, remappable back paddles and a low-latency 2.4 GHz dongle for PC and console.', specs: [['Sticks', 'Hall-effect'], ['Latency', '< 2 ms (2.4 GHz)'], ['Battery', '30 hours']] },
  { name: 'Apex Gaming Headset', brand: 'Respawn', category: 'Gaming', price: 6999, compareAtPrice: 8499, stock: 25, icon: 'headset', tone: '#DC2626', tags: ['headset', 'gaming'], description: 'A lightweight wireless headset with spatial audio, a detachable broadcast mic and swappable cooling ear cushions.', specs: [['Audio', 'Spatial 7.1'], ['Mic', 'Detachable, noise-gate'], ['Battery', '50 hours']] },
  { name: 'Power Bank 20K Fast', brand: 'Voltix', category: 'Accessories', price: 2499, stock: 120, icon: 'battery', tone: '#16A34A', tags: ['power bank', 'usb-c'], description: '20,000 mAh of 65 W USB-C power delivery: enough to top up a laptop, with a display that shows the exact charge left.', specs: [['Capacity', '20,000 mAh'], ['Output', '65 W PD'], ['Ports', '2 × USB-C, 1 × USB-A']] },
  { name: 'Trek Laptop Backpack', brand: 'Northgear', category: 'Accessories', price: 3999, stock: 2, icon: 'backpack', tone: '#475569', tags: ['backpack', 'travel'], description: 'A weatherproof 24 L commuter pack with a padded 16-inch laptop sleeve, luggage pass-through and hidden passport pocket.', specs: [['Capacity', '24 L'], ['Laptop', 'Up to 16"'], ['Material', 'Recycled 600D nylon']] },
  { name: 'MagCharge 3-in-1 Stand', brand: 'Voltix', category: 'Accessories', price: 4599, stock: 37, icon: 'charger', tone: '#0284C7', tags: ['charger', 'wireless'], description: 'Charge a phone, watch and earbuds from one weighted aluminium stand with a single USB-C cable.', specs: [['Output', '15 W + 5 W + 3 W'], ['Input', 'USB-C 30 W'], ['Finish', 'Anodised aluminium']] },
  { name: 'Halo Smart Desk Lamp', featured: true, brand: 'Lumen', category: 'Home', price: 4299, stock: 28, icon: 'lamp', tone: '#EAB308', tags: ['lamp', 'smart home'], description: 'A flicker-free desk lamp with adjustable colour temperature, an ambient back-light and app or voice control.', specs: [['Brightness', '1000 lux'], ['Colour temp', '2700 – 6500 K'], ['Control', 'Touch, app, voice']] },
  { name: 'Brew Smart Coffee Maker', brand: 'Kettlr', category: 'Home', price: 9999, compareAtPrice: 11999, stock: 16, icon: 'coffee', tone: '#92400E', tags: ['coffee', 'kitchen'], description: 'A pour-over style drip brewer with precise temperature control, a bloom cycle and a schedule you set from your phone.', specs: [['Capacity', '1.25 L'], ['Temperature', '92 – 96 °C'], ['Carafe', 'Thermal steel']] },
  { name: 'Aero Air Purifier', brand: 'Kettlr', category: 'Home', price: 13499, stock: 11, icon: 'wind', tone: '#0891B2', tags: ['air purifier', 'hepa'], description: 'A True HEPA purifier for rooms up to 45 m² with a live PM2.5 readout and a whisper-quiet night mode.', specs: [['Coverage', '45 m²'], ['Filter', 'True HEPA H13'], ['Noise', '22 dB night mode']] },
];

const reviewTexts = [
  ['Worth every rupee', 'Build quality is excellent and it works exactly as described. Delivery was quick too.'],
  ['Great daily driver', 'I have used it every day for a month now. Battery life is better than I expected.'],
  ['Solid, with one small gripe', 'Really good overall. The companion app could be better, but the hardware is great.'],
  ['Exceeded expectations', 'Feels premium in the hand and the performance is noticeably better than my old one.'],
  ['Good value', 'Does the job well for the price. Packaging was neat and everything was included.'],
];

async function run() {
  await connectDB();
  await Promise.all([User.deleteMany({}), Product.deleteMany({}), Review.deleteMany({}), Order.deleteMany({}), Wishlist.deleteMany({})]);

  const admin = await User.create({ name: 'Mohammed Fayaz', email: 'admin@shopcart.dev', password: 'Admin@123', role: 'admin', avatarColor: '#FF5A1F' });
  const demo = await User.create({ name: 'Ananya Rao', email: 'demo@shopcart.dev', password: 'Demo@1234', avatarColor: '#0EA5E9' });
  const shoppers = await User.create([
    { name: 'Rahul Verma', email: 'rahul@example.com', password: 'Password@1' },
    { name: 'Sara Khan', email: 'sara@example.com', password: 'Password@1' },
    { name: 'Vikram Reddy', email: 'vikram@example.com', password: 'Password@1' },
    { name: 'Meera Iyer', email: 'meera@example.com', password: 'Password@1' },
  ]);
  const customers = [demo, ...shoppers];

  const created = [];
  for (const [i, p] of products.entries()) {
    const createdAt = new Date(Date.now() - (products.length - i) * 36e5 * 20);
    created.push(
      await Product.create({ ...p, slug: slugify(p.name), specs: p.specs.map(([label, value]) => ({ label, value })), createdAt, updatedAt: createdAt }),
    );
  }

  // Reviews
  for (const [i, product] of created.entries()) {
    const n = (i % 4) + 1;
    const ratings: number[] = [];
    for (let k = 0; k < n; k++) {
      const rating = [5, 4, 5, 4, 3][(i + k) % 5];
      const [title, comment] = reviewTexts[(i + k) % reviewTexts.length];
      ratings.push(rating);
      await Review.create({ product: product._id, user: customers[(i + k) % customers.length]._id, rating, title, comment, createdAt: new Date(Date.now() - (k + 1) * 864e5 * 3) });
    }
    product.rating = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
    product.numReviews = ratings.length;
    await product.save();
  }

  // Orders spread over the last 14 days for the dashboard chart
  const statuses = ['delivered', 'delivered', 'shipped', 'paid', 'paid', 'pending', 'delivered', 'cancelled'] as const;
  const cities = [['Hyderabad', 'Telangana', '500081'], ['Bengaluru', 'Karnataka', '560034'], ['Pune', 'Maharashtra', '411014'], ['Chennai', 'Tamil Nadu', '600042']];
  for (let i = 0; i < 26; i++) {
    const user = customers[i % customers.length];
    const picks = [created[(i * 3) % created.length], created[(i * 5 + 2) % created.length]].slice(0, (i % 2) + 1);
    const items = picks.map((p, k) => ({ product: p._id, name: p.name, slug: p.slug, price: p.price, qty: (k + i) % 3 === 0 ? 2 : 1, icon: p.icon, tone: p.tone }));
    const createdAt = new Date(Date.now() - (i % 14) * 864e5 - (i * 37 % 600) * 6e4);
    const status = statuses[i % statuses.length];
    const [city, state, postalCode] = cities[i % cities.length];
    await Order.create({
      orderNumber: `SC-${createdAt.toISOString().slice(2, 10).replace(/-/g, '')}-${(1000 + i).toString(16).toUpperCase()}`,
      user: user._id,
      items,
      shippingAddress: { fullName: user.name, phone: '+91 98765 43210', line1: `${12 + i}, Lake View Road`, city, state, postalCode },
      paymentMethod: i % 3 === 0 ? 'upi' : 'card',
      ...computeTotals(items),
      status,
      paidAt: status !== 'pending' && status !== 'cancelled' ? createdAt : undefined,
      shippedAt: status === 'shipped' || status === 'delivered' ? new Date(createdAt.getTime() + 864e5) : undefined,
      deliveredAt: status === 'delivered' ? new Date(createdAt.getTime() + 3 * 864e5) : undefined,
      createdAt,
      updatedAt: createdAt,
    });
  }

  await Wishlist.create({ user: demo._id, products: [created[0]._id, created[4]._id, created[11]._id] });

  console.log(`Seeded ${created.length} products, ${customers.length + 1} users, 26 orders.`);
  console.log('Admin  → admin@shopcart.dev / Admin@123');
  console.log('Shopper → demo@shopcart.dev / Demo@1234');
  void admin;
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
