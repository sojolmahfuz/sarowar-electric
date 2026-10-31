const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload folders exist
const uploadDir = path.join(__dirname, '..', 'public', 'images', 'products');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, 'prod_' + Date.now() + '_' + safeName);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Serve static frontend assets
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.use(express.static(rootDir));

// Admin Page Direct Routes
app.get('/admin', (req, res) => {
  const p = fs.existsSync(path.join(rootDir, 'admin.html')) ? path.join(rootDir, 'admin.html') : path.join(publicDir, 'admin.html');
  res.sendFile(p);
});
app.get('/admin.html', (req, res) => {
  const p = fs.existsSync(path.join(rootDir, 'admin.html')) ? path.join(rootDir, 'admin.html') : path.join(publicDir, 'admin.html');
  res.sendFile(p);
});

// Admin Auth Middleware
async function checkAdminAuth(req, res, next) {
  const authHeader = req.headers['x-admin-pin'] || req.query.admin_pin || req.body.admin_pin;
  const pinSetting = await db.get("SELECT value FROM site_settings WHERE key = 'admin_pin'");
  const validPin = pinSetting ? pinSetting.value : '1234';

  if (authHeader === validPin) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Invalid or missing Admin PIN' });
}

// ==========================================
// PUBLIC API ROUTES
// ==========================================

// 1. Get Categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.query(`
      SELECT c.*, COUNT(p.id) AS product_count 
      FROM categories c 
      LEFT JOIN products p ON c.id = p.category 
      GROUP BY c.id
    `);
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Get Products (with Search, Category, Brand, Sorting)
app.get('/api/products', async (req, res) => {
  try {
    const { category, brand, search, featured, sort, limit } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (brand && brand !== 'all') {
      sql += ' AND brand = ?';
      params.push(brand);
    }

    if (featured === '1' || featured === 'true') {
      sql += ' AND featured = 1';
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      sql += ' AND (LOWER(title_en) LIKE ? OR LOWER(title_bn) LIKE ? OR LOWER(description_en) LIKE ? OR LOWER(description_bn) LIKE ? OR LOWER(brand) LIKE ?)';
      params.push(term, term, term, term, term);
    }

    if (sort === 'price_asc') {
      sql += ' ORDER BY price ASC';
    } else if (sort === 'price_desc') {
      sql += ' ORDER BY price DESC';
    } else if (sort === 'rating') {
      sql += ' ORDER BY rating DESC';
    } else {
      sql += ' ORDER BY featured DESC, id DESC';
    }

    if (limit) {
      sql += ' LIMIT ' + parseInt(limit, 10);
    }

    const products = await db.query(sql, params);
    
    const mapped = products.map(p => {
      try {
        p.specs = p.specs ? JSON.parse(p.specs) : {};
      } catch (e) {
        p.specs = {};
      }
      return p;
    });

    res.json({ success: true, data: mapped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Get Single Product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    try {
      product.specs = product.specs ? JSON.parse(product.specs) : {};
    } catch (e) {
      product.specs = {};
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Submit Order
app.post('/api/orders', async (req, res) => {
  try {
    const { 
      customer_name, 
      customer_phone, 
      customer_email, 
      delivery_address, 
      upazila, 
      payment_method, 
      transaction_id, 
      items, 
      delivery_fee, 
      notes 
    } = req.body;

    if (!customer_name || !customer_phone || !delivery_address || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Missing required customer or items details' });
    }

    let subtotal = 0;
    items.forEach(item => {
      subtotal += Number(item.price) * Number(item.quantity);
    });

    const fee = Number(delivery_fee) || 0;
    const total_amount = subtotal + fee;
    const order_number = 'SEH-' + Date.now().toString().slice(-6);

    const result = await db.run(`
      INSERT INTO orders (
        order_number, customer_name, customer_phone, customer_email, 
        delivery_address, upazila, payment_method, transaction_id, 
        subtotal, delivery_fee, total_amount, items_json, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      order_number,
      customer_name,
      customer_phone,
      customer_email || '',
      delivery_address,
      upazila || 'Natore Sadar',
      payment_method || 'cod',
      transaction_id || '',
      subtotal,
      fee,
      total_amount,
      JSON.stringify(items),
      notes || ''
    ]);

    res.json({ 
      success: true, 
      message: 'Order placed successfully! সারোয়ার ইলেকট্রিক থেকে দ্রুত আপনার সাথে যোগাযোগ করা হবে।',
      order: {
        id: result.lastInsertRowid,
        order_number,
        total_amount,
        customer_name,
        customer_phone
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Track Order
app.get('/api/orders/track/:query', async (req, res) => {
  try {
    const q = req.params.query.trim();
    const order = await db.get(
      'SELECT * FROM orders WHERE order_number = ? OR customer_phone = ? ORDER BY id DESC LIMIT 1', 
      [q, q]
    );
    if (!order) {
      return res.status(404).json({ success: false, message: 'No order found with this Order Number or Phone' });
    }
    try {
      order.items = JSON.parse(order.items_json);
    } catch(e) {
      order.items = [];
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Submit Wholesale Quotation Request
app.post('/api/quotations', async (req, res) => {
  try {
    const { 
      client_name, 
      client_type, 
      phone, 
      email, 
      project_type, 
      location, 
      materials_needed, 
      estimated_budget, 
      notes 
    } = req.body;

    if (!client_name || !phone || !materials_needed) {
      return res.status(400).json({ success: false, message: 'Name, phone, and required materials are mandatory' });
    }

    const quote_number = 'QUOTE-' + Date.now().toString().slice(-5);

    await db.run(`
      INSERT INTO quotations (
        quote_number, client_name, client_type, phone, email, 
        project_type, location, materials_needed, estimated_budget, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      quote_number,
      client_name,
      client_type || 'Contractor / Electrician',
      phone,
      email || '',
      project_type || 'Residential Building Wiring',
      location || 'Natore',
      materials_needed,
      estimated_budget || 'Negotiable',
      notes || ''
    ]);

    res.json({ 
      success: true, 
      message: 'Quotation request submitted! Our wholesale team will send customized pricing shortly.',
      quote_number 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Request Electrician & Technician Service
app.post('/api/service-bookings', async (req, res) => {
  try {
    const { 
      customer_name, 
      phone, 
      service_type, 
      preferred_date, 
      address, 
      urgency, 
      details 
    } = req.body;

    if (!customer_name || !phone || !service_type || !address) {
      return res.status(400).json({ success: false, message: 'Customer name, phone, service type, and address are required' });
    }

    const booking_number = 'SRV-' + Date.now().toString().slice(-5);

    await db.run(`
      INSERT INTO service_bookings (
        booking_number, customer_name, phone, service_type, 
        preferred_date, address, urgency, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      booking_number,
      customer_name,
      phone,
      service_type,
      preferred_date || 'Earliest Available',
      address,
      urgency || 'Standard',
      details || ''
    ]);

    res.json({ 
      success: true, 
      message: 'Electrician service booked! Our expert technician in Natore will contact you.',
      booking_number 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Public Reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await db.query('SELECT * FROM reviews WHERE verified = 1 ORDER BY id DESC LIMIT 20');
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { author_name, location, rating, comment, product_id } = req.body;
    if (!author_name || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Name, rating, and feedback are required' });
    }

    await db.run(`
      INSERT INTO reviews (author_name, location, rating, comment, product_id, verified) 
      VALUES (?, ?, ?, ?, ?, 1)
    `, [author_name, location || 'Natore', parseInt(rating, 10), comment, product_id || null]);

    res.json({ success: true, message: 'Thank you for your review!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. Public Site Settings
app.get('/api/settings', async (req, res) => {
  try {
    const rows = await db.query('SELECT key, value FROM site_settings');
    const settings = {};
    rows.forEach(r => {
      if (r.key !== 'admin_pin') settings[r.key] = r.value;
    });
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// FULL ADMIN CONTROL API
// ==========================================

// 1. Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { pin } = req.body;
    const pinSetting = await db.get("SELECT value FROM site_settings WHERE key = 'admin_pin'");
    const currentPin = pinSetting ? pinSetting.value : '1234';

    if (pin === currentPin) {
      res.json({ success: true, token: currentPin, message: 'Admin authentication successful' });
    } else {
      res.status(401).json({ success: false, message: 'Incorrect Admin PIN. Default is 1234' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Change Admin PIN
app.post('/api/admin/settings/change-pin', checkAdminAuth, async (req, res) => {
  try {
    const { current_pin, new_pin } = req.body;
    const pinSetting = await db.get("SELECT value FROM site_settings WHERE key = 'admin_pin'");
    const validPin = pinSetting ? pinSetting.value : '1234';

    if (current_pin !== validPin) {
      return res.status(400).json({ success: false, message: 'Current PIN is incorrect' });
    }
    if (!new_pin || new_pin.length < 4) {
      return res.status(400).json({ success: false, message: 'New PIN must be at least 4 digits' });
    }

    await db.run("UPDATE site_settings SET value = ? WHERE key = 'admin_pin'", [new_pin]);
    res.json({ success: true, message: 'Admin PIN updated successfully! Remember your new PIN.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Admin Overview Stats
app.get('/api/admin/stats', checkAdminAuth, async (req, res) => {
  try {
    const totalOrdersRes = await db.get("SELECT COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS revenue FROM orders");
    const pendingOrdersRes = await db.get("SELECT COUNT(*) AS count FROM orders WHERE status = 'Pending'");
    const confirmedOrdersRes = await db.get("SELECT COUNT(*) AS count FROM orders WHERE status = 'Confirmed'");
    const deliveredOrdersRes = await db.get("SELECT COUNT(*) AS count FROM orders WHERE status = 'Delivered'");
    const totalProductsRes = await db.get("SELECT COUNT(*) AS count FROM products");
    const quotationsRes = await db.get("SELECT COUNT(*) AS count FROM quotations WHERE status = 'Pending'");
    const serviceBookingsRes = await db.get("SELECT COUNT(*) AS count FROM service_bookings WHERE status = 'Pending'");
    const reviewsRes = await db.get("SELECT COUNT(*) AS count FROM reviews");
    const lowStockRes = await db.query("SELECT id, title_en, title_bn, brand, stock_qty, price FROM products WHERE stock_qty < 15 ORDER BY stock_qty ASC");
    const categoryStats = await db.query("SELECT category, COUNT(id) AS count, AVG(price) as avg_price FROM products GROUP BY category");

    res.json({
      success: true,
      data: {
        total_orders: totalOrdersRes.count,
        total_revenue: totalOrdersRes.revenue,
        pending_orders: pendingOrdersRes.count,
        confirmed_orders: confirmedOrdersRes.count,
        delivered_orders: deliveredOrdersRes.count,
        total_products: totalProductsRes.count,
        pending_quotations: quotationsRes.count,
        pending_services: serviceBookingsRes.count,
        total_reviews: reviewsRes.count,
        low_stock_products: lowStockRes,
        category_stats: categoryStats
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Image Upload for Products
app.post('/api/admin/upload', checkAdminAuth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    const publicUrl = '/images/products/' + req.file.filename;
    res.json({ success: true, url: publicUrl, message: 'Image uploaded successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Products Full CRUD & Controls
app.post('/api/admin/products', checkAdminAuth, async (req, res) => {
  try {
    const {
      title_en, title_bn, category, brand, price, original_price, unit,
      wholesale_price, wholesale_min_qty, in_stock, stock_qty, featured,
      badge, image_url, description_en, description_bn, specs
    } = req.body;

    if (!title_en || !title_bn || !category || !price) {
      return res.status(400).json({ success: false, message: 'Title, category, and price are required' });
    }

    const result = await db.run(`
      INSERT INTO products (
        title_en, title_bn, category, brand, price, original_price, unit,
        wholesale_price, wholesale_min_qty, in_stock, stock_qty, featured,
        badge, image_url, description_en, description_bn, specs
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title_en, title_bn, category, brand || 'General', Number(price), 
      original_price ? Number(original_price) : null, unit || 'Piece',
      wholesale_price ? Number(wholesale_price) : null, Number(wholesale_min_qty) || 5,
      in_stock ? 1 : 0, Number(stock_qty) || 50, featured ? 1 : 0,
      badge || null, image_url || '/images/fb/logo.jpg',
      description_en || '', description_bn || '', 
      typeof specs === 'object' ? JSON.stringify(specs) : (specs || '{}')
    ]);

    res.json({ success: true, message: 'Product added successfully', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/products/:id', checkAdminAuth, async (req, res) => {
  try {
    const prodId = parseInt(req.params.id, 10);
    if (!prodId) return res.status(400).json({ success: false, message: 'Invalid product ID' });

    const {
      title_en, title_bn, category, brand, price, original_price, unit,
      wholesale_price, wholesale_min_qty, in_stock, stock_qty, featured,
      badge, image_url, description_en, description_bn, specs
    } = req.body;

    if (!title_bn && !title_en) {
      return res.status(400).json({ success: false, message: 'Product title is required' });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, message: 'Valid price is required' });
    }

    const numOrigPrice = original_price ? (Number(original_price) || null) : null;
    const numWholesalePrice = wholesale_price ? (Number(wholesale_price) || null) : null;
    const numWholesaleMinQty = wholesale_min_qty ? (Number(wholesale_min_qty) || 5) : 5;
    const numStockQty = stock_qty !== undefined ? (Number(stock_qty) || 0) : 50;
    const numInStock = in_stock ? 1 : 0;
    const numFeatured = featured ? 1 : 0;

    let specsStr = '{}';
    if (typeof specs === 'object' && specs !== null) {
      specsStr = JSON.stringify(specs);
    } else if (typeof specs === 'string') {
      specsStr = specs;
    }

    await db.run(`
      UPDATE products SET
        title_en = ?, title_bn = ?, category = ?, brand = ?, price = ?, 
        original_price = ?, unit = ?, wholesale_price = ?, wholesale_min_qty = ?, 
        in_stock = ?, stock_qty = ?, featured = ?, badge = ?, image_url = ?, 
        description_en = ?, description_bn = ?, specs = ?
      WHERE id = ?
    `, [
      title_en || title_bn, 
      title_bn || title_en, 
      category || 'cables', 
      brand || 'General', 
      numPrice,
      numOrigPrice, 
      unit || 'Piece',
      numWholesalePrice, 
      numWholesaleMinQty,
      numInStock, 
      numStockQty, 
      numFeatured, 
      badge || null,
      image_url || '/images/fb/logo.jpg', 
      description_en || '', 
      description_bn || '',
      specsStr,
      prodId
    ]);

    res.json({ success: true, message: 'Product updated successfully' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

app.patch('/api/admin/products/:id/stock', checkAdminAuth, async (req, res) => {
  try {
    const { stock_qty, in_stock } = req.body;
    await db.run(
      'UPDATE products SET stock_qty = COALESCE(?, stock_qty), in_stock = COALESCE(?, in_stock) WHERE id = ?',
      [stock_qty !== undefined ? Number(stock_qty) : null, in_stock !== undefined ? (in_stock ? 1 : 0) : null, req.params.id]
    );
    res.json({ success: true, message: 'Stock updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/admin/products/:id/toggle-featured', checkAdminAuth, async (req, res) => {
  try {
    await db.run('UPDATE products SET featured = (CASE WHEN featured = 1 THEN 0 ELSE 1 END) WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Featured status toggled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/products/:id', checkAdminAuth, async (req, res) => {
  try {
    await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Orders Management (List, Status Update, Delete)
app.get('/api/admin/orders', checkAdminAuth, async (req, res) => {
  try {
    const orders = await db.query('SELECT * FROM orders ORDER BY id DESC');
    orders.forEach(o => {
      try { o.items = JSON.parse(o.items_json); } catch(e) { o.items = []; }
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/orders/:id/status', checkAdminAuth, async (req, res) => {
  try {
    const { status, payment_status, notes } = req.body;
    await db.run(
      'UPDATE orders SET status = COALESCE(?, status), payment_status = COALESCE(?, payment_status), notes = COALESCE(?, notes) WHERE id = ?',
      [status || null, payment_status || null, notes || null, req.params.id]
    );
    res.json({ success: true, message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/orders/:id', checkAdminAuth, async (req, res) => {
  try {
    await db.run('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Wholesale Quotations
app.get('/api/admin/quotations', checkAdminAuth, async (req, res) => {
  try {
    const list = await db.query('SELECT * FROM quotations ORDER BY id DESC');
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/quotations/:id/status', checkAdminAuth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    await db.run(
      'UPDATE quotations SET status = COALESCE(?, status), notes = COALESCE(?, notes) WHERE id = ?',
      [status || null, notes || null, req.params.id]
    );
    res.json({ success: true, message: 'Quotation updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/quotations/:id', checkAdminAuth, async (req, res) => {
  try {
    await db.run('DELETE FROM quotations WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Quotation deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Service Bookings
app.get('/api/admin/service-bookings', checkAdminAuth, async (req, res) => {
  try {
    const list = await db.query('SELECT * FROM service_bookings ORDER BY id DESC');
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/service-bookings/:id/status', checkAdminAuth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    await db.run('UPDATE service_bookings SET status = ?, details = COALESCE(?, details) WHERE id = ?', [status, notes || null, req.params.id]);
    res.json({ success: true, message: 'Booking status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/service-bookings/:id', checkAdminAuth, async (req, res) => {
  try {
    await db.run('DELETE FROM service_bookings WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Service booking deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. Reviews Full Management
app.get('/api/admin/reviews', checkAdminAuth, async (req, res) => {
  try {
    const reviews = await db.query('SELECT * FROM reviews ORDER BY id DESC');
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/reviews', checkAdminAuth, async (req, res) => {
  try {
    const { author_name, location, rating, comment, verified } = req.body;
    await db.run(
      'INSERT INTO reviews (author_name, location, rating, comment, verified) VALUES (?, ?, ?, ?, ?)',
      [author_name, location || 'Natore', parseInt(rating, 10) || 5, comment, verified ? 1 : 0]
    );
    res.json({ success: true, message: 'Review added' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/reviews/:id/status', checkAdminAuth, async (req, res) => {
  try {
    const { verified } = req.body;
    await db.run('UPDATE reviews SET verified = ? WHERE id = ?', [verified ? 1 : 0, req.params.id]);
    res.json({ success: true, message: 'Review status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/reviews/:id', checkAdminAuth, async (req, res) => {
  try {
    await db.run('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 10. Store Settings Management
app.get('/api/admin/settings', checkAdminAuth, async (req, res) => {
  try {
    const rows = await db.query('SELECT key, value FROM site_settings');
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/settings', checkAdminAuth, async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      if (key !== 'admin_pin') {
        await db.run('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)', [key, String(value)]);
      }
    }
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 11. Database Tools (Export, Import, Reset, Raw SQL)
app.get('/api/admin/export', checkAdminAuth, async (req, res) => {
  try {
    const products = await db.query('SELECT * FROM products');
    const orders = await db.query('SELECT * FROM orders');
    const quotations = await db.query('SELECT * FROM quotations');
    const services = await db.query('SELECT * FROM service_bookings');
    const reviews = await db.query('SELECT * FROM reviews');
    const settings = await db.query('SELECT * FROM site_settings');
    const categories = await db.query('SELECT * FROM categories');

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        categories,
        products,
        orders,
        quotations,
        services,
        reviews,
        settings
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/import', checkAdminAuth, async (req, res) => {
  try {
    const { database } = req.body;
    if (!database) return res.status(400).json({ success: false, message: 'Invalid backup file structure' });

    // Rebuild tables if needed
    if (database.products && Array.isArray(database.products)) {
      await db.run('DELETE FROM products');
      const stmt = (await db.getDb()).prepare(`
        INSERT INTO products (
          id, title_en, title_bn, category, brand, price, original_price, unit, 
          wholesale_price, wholesale_min_qty, in_stock, stock_qty, featured, 
          rating, reviews_count, badge, image_url, description_en, description_bn, specs
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      database.products.forEach(p => {
        stmt.run([
          p.id, p.title_en, p.title_bn, p.category, p.brand, p.price, p.original_price, p.unit,
          p.wholesale_price, p.wholesale_min_qty, p.in_stock, p.stock_qty, p.featured,
          p.rating, p.reviews_count, p.badge, p.image_url, p.description_en, p.description_bn,
          typeof p.specs === 'object' ? JSON.stringify(p.specs) : p.specs
        ]);
      });
      stmt.free();
    }

    if (database.orders && Array.isArray(database.orders)) {
      await db.run('DELETE FROM orders');
      database.orders.forEach(async o => {
        await db.run(`
          INSERT INTO orders (
            id, order_number, customer_name, customer_phone, customer_email,
            delivery_address, upazila, payment_method, payment_status, transaction_id,
            subtotal, delivery_fee, total_amount, status, items_json, notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          o.id, o.order_number, o.customer_name, o.customer_phone, o.customer_email,
          o.delivery_address, o.upazila, o.payment_method, o.payment_status, o.transaction_id,
          o.subtotal, o.delivery_fee, o.total_amount, o.status,
          typeof o.items_json === 'object' ? JSON.stringify(o.items_json) : o.items_json,
          o.notes, o.created_at
        ]);
      });
    }

    db.saveDb();
    res.json({ success: true, message: 'Database successfully imported & restored!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/reset-db', checkAdminAuth, async (req, res) => {
  try {
    await db.resetDb();
    res.json({ success: true, message: 'Database reset to default store seed data successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/sql', checkAdminAuth, async (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql || !sql.trim()) return res.status(400).json({ success: false, message: 'No SQL provided' });

    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const rows = await db.query(sql);
      res.json({ success: true, rows });
    } else {
      const result = await db.exec(sql);
      res.json({ success: true, result });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Frontend Routing Fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`======================================================`);
  console.log(`⚡ Sarowar Electric & Hardware Server is running!`);
  console.log(`🌐 Public Website:  http://localhost:${PORT}`);
  console.log(`🔧 Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`📦 Database:        SQLite (data/sarowar.sqlite)`);
  console.log(`======================================================`);
});
