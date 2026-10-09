import request from 'supertest';
import { describe, expect, it } from 'vitest';
import './setup.js';
import { app, createUser } from './helpers.js';
import { Product } from '../src/models/Product.js';

async function makeProduct(stock = 5, price = 1000) {
  return Product.create({ name: `Thing ${Math.random()}`, slug: `thing-${Math.random().toString(36).slice(2)}`, brand: 'B', category: 'Audio', description: 'A very nice thing indeed.', price, stock });
}

describe('products', () => {
  it('lists, filters and paginates', async () => {
    await Promise.all([makeProduct(5, 500), makeProduct(5, 1500), makeProduct(0, 2500)]);
    const all = await request(app).get('/api/products?limit=2');
    expect(all.status).toBe(200);
    expect(all.body.total).toBe(3);
    expect(all.body.items).toHaveLength(2);
    expect(all.body.pages).toBe(2);

    const cheap = await request(app).get('/api/products?maxPrice=1000');
    expect(cheap.body.total).toBe(1);
    const inStock = await request(app).get('/api/products?inStock=true&sort=price-desc');
    expect(inStock.body.items[0].price).toBe(1500);
  });

  it('only lets admins create products', async () => {
    const shopper = await createUser();
    const body = { name: 'New Gadget', brand: 'X', category: 'Audio', description: 'Ten chars at least', price: 100, stock: 3 };
    const denied = await request(app).post('/api/products').set(shopper.auth).send(body);
    expect(denied.status).toBe(403);

    const admin = await createUser({ role: 'admin' });
    const ok = await request(app).post('/api/products').set(admin.auth).send(body);
    expect(ok.status).toBe(201);
    expect(ok.body.product.slug).toBe('new-gadget');
  });
});

describe('orders', () => {
  it('prices on the server, reserves stock and takes mock payment', async () => {
    const p = await makeProduct(3, 2000);
    const { auth } = await createUser();
    const address = { fullName: 'Fayaz', phone: '+91 9876543210', line1: '12 Lake View Road', city: 'Hyderabad', state: 'Telangana', postalCode: '500081' };

    const res = await request(app).post('/api/orders').set(auth).send({ items: [{ product: p.id, qty: 2 }], shippingAddress: address, paymentMethod: 'card' });
    expect(res.status).toBe(201);
    expect(res.body.order.itemsPrice).toBe(4000);
    expect(res.body.order.shippingPrice).toBe(0);
    expect(res.body.order.taxPrice).toBe(720);
    expect(res.body.order.totalPrice).toBe(4720);
    expect((await Product.findById(p.id))!.stock).toBe(1);

    const tooMany = await request(app).post('/api/orders').set(auth).send({ items: [{ product: p.id, qty: 2 }], shippingAddress: address, paymentMethod: 'card' });
    expect(tooMany.status).toBe(400);

    const declined = await request(app).post(`/api/orders/${res.body.order.id}/pay`).set(auth).send({ method: 'card', cardNumber: '4000 0000 0000 0002' });
    expect(declined.status).toBe(402);
    const paid = await request(app).post(`/api/orders/${res.body.order.id}/pay`).set(auth).send({ method: 'card', cardNumber: '4242 4242 4242 4242' });
    expect(paid.status).toBe(200);
    expect(paid.body.order.status).toBe('paid');
  });

  it('hides other customers\' orders', async () => {
    const p = await makeProduct(3, 500);
    const a = await createUser();
    const b = await createUser();
    const address = { fullName: 'Asha', phone: '+91 9876543210', line1: '12 Lake View Road', city: 'Pune', state: 'MH', postalCode: '411014' };
    const order = await request(app).post('/api/orders').set(a.auth).send({ items: [{ product: p.id, qty: 1 }], shippingAddress: address, paymentMethod: 'cod' });
    const peek = await request(app).get(`/api/orders/${order.body.order.id}`).set(b.auth);
    expect(peek.status).toBe(404);
  });
});
