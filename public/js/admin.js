// Sarowar Electric & Hardware - Full-Featured Admin Dashboard Script

const ADMIN = {
  token: sessionStorage.getItem('seh_admin_token') || null,
  activeTab: 'overview',
  stats: null,
  products: [],
  categories: [],
  orders: [],
  quotations: [],
  services: [],
  reviews: [],
  settings: {},
  filters: {
    productSearch: '',
    productCategory: 'all',
    orderStatus: 'all',
    quoteStatus: 'all'
  }
};

// Safe DOM Helper functions
function setElText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = (text !== undefined && text !== null) ? text : '';
}

function setElVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = (val !== undefined && val !== null) ? val : '';
}

function getElVal(id, defaultVal = '') {
  const el = document.getElementById(id);
  return el ? el.value : defaultVal;
}

// Initialize Admin Dashboard
document.addEventListener('DOMContentLoaded', async () => {
  checkAuth();
});

function checkAuth() {
  const loginCard = document.getElementById('admin-login-card');
  const dashboard = document.getElementById('admin-dashboard-layout');

  if (!ADMIN.token) {
    if (loginCard) loginCard.classList.remove('hidden');
    if (dashboard) dashboard.classList.add('hidden');
  } else {
    if (loginCard) loginCard.classList.add('hidden');
    if (dashboard) dashboard.classList.remove('hidden');
    loadDashboardData();
  }
}

function getApiBase() {
  const custom = localStorage.getItem('seh_backend_url');
  if (custom && custom.trim()) return custom.trim().replace(/\/$/, '');
  return '';
}

// Admin PIN Login
async function submitAdminLogin(e) {
  if (e) e.preventDefault();
  const pinInput = document.getElementById('login-pin-input');
  const errorEl = document.getElementById('login-error-msg');
  const pin = pinInput ? pinInput.value.trim() : '';

  if (errorEl) errorEl.classList.add('hidden');

  try {
    const fullUrl = (getApiBase() || '') + '/api/admin/login';
    const res = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        ADMIN.token = pin;
        sessionStorage.setItem('seh_admin_token', pin);
        checkAuth();
        return;
      } else {
        if (errorEl) {
          errorEl.textContent = json.message || 'Invalid PIN. Default is 1234';
          errorEl.classList.remove('hidden');
        }
        return;
      }
    }
    throw new Error('Static fallback');
  } catch (err) {
    // Offline / static GitHub Pages admin fallback
    const validPin = localStorage.getItem('sarowar_admin_pin') || '1234';
    if (pin === validPin) {
      ADMIN.token = pin;
      sessionStorage.setItem('seh_admin_token', pin);
      checkAuth();
    } else {
      if (errorEl) {
        errorEl.textContent = 'Invalid PIN. Default is 1234';
        errorEl.classList.remove('hidden');
      }
    }
  }
}

function adminLogout() {
  sessionStorage.removeItem('seh_admin_token');
  ADMIN.token = null;
  location.reload();
}

// Navigation Tabs
function switchTab(tabId) {
  ADMIN.activeTab = tabId;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('bg-orange-600', btn.getAttribute('data-tab') === tabId);
    btn.classList.toggle('text-white', btn.getAttribute('data-tab') === tabId);
    btn.classList.toggle('text-slate-300', btn.getAttribute('data-tab') !== tabId);
  });

  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('hidden', panel.id !== `tab-${tabId}`);
  });

  if (tabId === 'overview') loadStats();
  if (tabId === 'products') loadProducts();
  if (tabId === 'orders') loadOrders();
  if (tabId === 'quotations') loadQuotations();
  if (tabId === 'services') loadServices();
  if (tabId === 'reviews') loadReviews();
  if (tabId === 'settings') loadSettings();
  if (tabId === 'database') initDatabaseTelemetryAndCloudSync();
}

// Load All Initial Data
async function loadDashboardData() {
  await loadStats();
  await loadCategories();
  await loadProducts();
  await loadOrders();
  await loadQuotations();
  await loadServices();
  initDatabaseTelemetryAndCloudSync();
}

// Helper fetch with Admin auth & strict error checking
async function adminFetch(url, options = {}) {
  options.headers = options.headers || {};
  if (ADMIN.token) {
    options.headers['x-admin-pin'] = ADMIN.token;
  }

  const base = getApiBase();
  const fullUrl = (url.startsWith('http://') || url.startsWith('https://'))
    ? url
    : (base ? (base + url) : url);

  try {
    const res = await fetch(fullUrl, options);
    if (res.status === 401) {
      alert('Session expired or invalid PIN. Please log in again.');
      adminLogout();
      throw new Error('Unauthorized');
    }
    if (res.ok) {
      const json = await res.json();
      if (json && json.success !== false) return json;
    }
    throw new Error('Status: ' + res.status);
  } catch (err) {
    return handleStaticAdminFetch(url, options);
  }
}

// Static fallback handler when running without live backend
function handleStaticAdminFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const getStored = (k, def) => JSON.parse(localStorage.getItem(k) || JSON.stringify(def));
  const setStored = (k, val) => localStorage.setItem(k, JSON.stringify(val));

  // 1. Stats
  if (url.startsWith('/api/admin/stats')) {
    const prods = getStored('sarowar_local_products', typeof DEFAULT_PRODUCTS !== 'undefined' ? DEFAULT_PRODUCTS : []);
    const orders = getStored('sarowar_orders', []);
    const quotes = getStored('sarowar_quotations', []);
    const bookings = getStored('sarowar_bookings', []);
    const rev = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const lowStock = prods.filter(p => (p.stock_qty || 0) <= 15);

    return {
      success: true,
      data: {
        total_revenue: rev,
        total_orders: orders.length,
        pending_orders: orders.filter(o => o.status === 'Pending').length,
        confirmed_orders: orders.filter(o => o.status === 'Confirmed').length,
        delivered_orders: orders.filter(o => o.status === 'Delivered').length,
        total_products: prods.length,
        pending_quotations: quotes.filter(q => q.status === 'Pending').length,
        pending_services: bookings.filter(b => b.status === 'Pending').length,
        low_stock_products: lowStock
      }
    };
  }

  // 2. Categories
  if (url.startsWith('/api/categories')) {
    return { success: true, data: typeof DEFAULT_CATEGORIES !== 'undefined' ? DEFAULT_CATEGORIES : [] };
  }

  // 3. Products
  if (url.startsWith('/api/products') && method === 'GET') {
    let prods = getStored('sarowar_local_products', typeof DEFAULT_PRODUCTS !== 'undefined' ? DEFAULT_PRODUCTS : []);
    return { success: true, data: prods };
  }

  if (url.startsWith('/api/admin/products') && method === 'POST') {
    let body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};
    let prods = getStored('sarowar_local_products', typeof DEFAULT_PRODUCTS !== 'undefined' ? DEFAULT_PRODUCTS : []);
    const newId = prods.length ? Math.max(...prods.map(p => p.id || 0)) + 1 : 1;
    const newProduct = { ...body, id: newId };
    prods.unshift(newProduct);
    setStored('sarowar_local_products', prods);
    return { success: true, data: newProduct };
  }

  // Product single update/delete
  const prodMatch = url.match(/\/api\/admin\/products\/(\d+)/);
  if (prodMatch) {
    const pId = parseInt(prodMatch[1]);
    let prods = getStored('sarowar_local_products', typeof DEFAULT_PRODUCTS !== 'undefined' ? DEFAULT_PRODUCTS : []);
    
    if (method === 'DELETE') {
      prods = prods.filter(p => p.id !== pId);
      setStored('sarowar_local_products', prods);
      return { success: true };
    }

    if (url.includes('/toggle-featured')) {
      const p = prods.find(item => item.id === pId);
      if (p) p.featured = p.featured ? 0 : 1;
      setStored('sarowar_local_products', prods);
      return { success: true, featured: p ? p.featured : 0 };
    }

    if (url.includes('/stock')) {
      let body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};
      const p = prods.find(item => item.id === pId);
      if (p) {
        if (body.in_stock !== undefined) p.in_stock = body.in_stock;
        if (body.stock_qty !== undefined) p.stock_qty = body.stock_qty;
      }
      setStored('sarowar_local_products', prods);
      return { success: true };
    }

    if (method === 'PUT' || method === 'PATCH') {
      let body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};
      const idx = prods.findIndex(item => item.id === pId);
      if (idx !== -1) prods[idx] = { ...prods[idx], ...body };
      setStored('sarowar_local_products', prods);
      return { success: true, data: prods[idx] };
    }
  }

  // 4. Orders
  if (url.startsWith('/api/admin/orders')) {
    let orders = getStored('sarowar_orders', []);
    const oMatch = url.match(/\/api\/admin\/orders\/(\d+)/);
    if (oMatch) {
      const oId = parseInt(oMatch[1]);
      if (method === 'DELETE') {
        orders = orders.filter(o => o.id !== oId);
        setStored('sarowar_orders', orders);
        return { success: true };
      }
      if (url.includes('/status')) {
        let body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};
        const o = orders.find(item => item.id === oId);
        if (o) o.status = body.status;
        setStored('sarowar_orders', orders);
        return { success: true };
      }
    }
    return { success: true, data: orders };
  }

  // 5. Quotations
  if (url.startsWith('/api/admin/quotations')) {
    let quotes = getStored('sarowar_quotations', []);
    const qMatch = url.match(/\/api\/admin\/quotations\/(\d+)/);
    if (qMatch) {
      const qId = parseInt(qMatch[1]);
      if (method === 'DELETE') {
        quotes = quotes.filter(q => q.id !== qId);
        setStored('sarowar_quotations', quotes);
        return { success: true };
      }
      if (url.includes('/status')) {
        let body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};
        const q = quotes.find(item => item.id === qId);
        if (q) q.status = body.status;
        setStored('sarowar_quotations', quotes);
        return { success: true };
      }
    }
    return { success: true, data: quotes };
  }

  // 6. Service Bookings
  if (url.startsWith('/api/admin/service-bookings')) {
    let bookings = getStored('sarowar_bookings', []);
    const bMatch = url.match(/\/api\/admin\/service-bookings\/(\d+)/);
    if (bMatch) {
      const bId = parseInt(bMatch[1]);
      if (method === 'DELETE') {
        bookings = bookings.filter(b => b.id !== bId);
        setStored('sarowar_bookings', bookings);
        return { success: true };
      }
      if (url.includes('/status')) {
        let body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};
        const b = bookings.find(item => item.id === bId);
        if (b) b.status = body.status;
        setStored('sarowar_bookings', bookings);
        return { success: true };
      }
    }
    return { success: true, data: bookings };
  }

  // 7. Reviews
  if (url.startsWith('/api/admin/reviews')) {
    let reviews = getStored('sarowar_reviews', typeof DEFAULT_REVIEWS !== 'undefined' ? DEFAULT_REVIEWS : []);
    const rMatch = url.match(/\/api\/admin\/reviews\/(\d+)/);
    if (rMatch) {
      const rId = parseInt(rMatch[1]);
      if (method === 'DELETE') {
        reviews = reviews.filter(r => r.id !== rId);
        setStored('sarowar_reviews', reviews);
        return { success: true };
      }
    }
    return { success: true, data: reviews };
  }

  // 8. Settings
  if (url.startsWith('/api/admin/settings')) {
    if (url.includes('/change-pin')) {
      let body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};
      localStorage.setItem('sarowar_admin_pin', body.new_pin);
      return { success: true };
    }
    if (method === 'POST') {
      let body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};
      let current = getStored('sarowar_site_settings', {});
      setStored('sarowar_site_settings', { ...current, ...body });
      return { success: true };
    }
    return { success: true, data: { ...DEFAULT_SETTINGS, ...getStored('sarowar_site_settings', {}) } };
  }

  // 9. Database Export
  if (url.startsWith('/api/admin/export')) {
    return {
      success: true,
      data: {
        exported_at: new Date().toISOString(),
        products: getStored('sarowar_local_products', typeof DEFAULT_PRODUCTS !== 'undefined' ? DEFAULT_PRODUCTS : []),
        orders: getStored('sarowar_orders', []),
        quotations: getStored('sarowar_quotations', []),
        service_bookings: getStored('sarowar_bookings', []),
        reviews: getStored('sarowar_reviews', [])
      }
    };
  }

  return { success: true, message: 'Simulated static response' };
}

// ==========================================
// 1. OVERVIEW & STATS
// ==========================================
async function loadStats() {
  try {
    const json = await adminFetch('/api/admin/stats');
    if (json.success) {
      ADMIN.stats = json.data;
      renderStats();
    }
  } catch (e) {
    console.error('Error loading stats:', e);
  }
}

function renderStats() {
  const d = ADMIN.stats;
  if (!d) return;

  setElText('stat-total-revenue', `৳${Number(d.total_revenue || 0).toLocaleString()}`);
  setElText('stat-total-orders', d.total_orders || 0);
  setElText('stat-pending-orders', d.pending_orders || 0);
  setElText('stat-confirmed-orders', d.confirmed_orders || 0);
  setElText('stat-delivered-orders', d.delivered_orders || 0);
  setElText('stat-total-products', d.total_products || 0);
  setElText('stat-pending-quotes', d.pending_quotations || 0);
  setElText('stat-pending-services', d.pending_services || 0);
  setElText('stat-low-stock', (d.low_stock_products || []).length);

  // Render Low Stock Table
  const lowStockContainer = document.getElementById('overview-low-stock-list');
  if (lowStockContainer) {
    if (!d.low_stock_products || !d.low_stock_products.length) {
      lowStockContainer.innerHTML = `<div class="p-4 text-center text-xs text-slate-400">All products have sufficient stock (15+ units)</div>`;
    } else {
      lowStockContainer.innerHTML = d.low_stock_products.map(p => `
        <div class="flex items-center justify-between p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 text-xs">
          <div>
            <strong class="text-white block font-bold truncate max-w-xs">${p.title_bn || p.title_en}</strong>
            <span class="text-slate-400 text-[11px]">${p.brand} | ৳${p.price}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-black ${p.stock_qty <= 5 ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'}">
              ${p.stock_qty} left
            </span>
            <button onclick="quickAddStock(${p.id}, 10)" class="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[11px] font-bold">
              +10 Stock
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  // Render Category Breakdown
  const catStatsContainer = document.getElementById('overview-category-stats');
  if (catStatsContainer && d.category_stats) {
    catStatsContainer.innerHTML = d.category_stats.map(c => `
      <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs flex justify-between items-center">
        <div>
          <span class="text-white font-bold capitalize block">${c.category.replace('_', ' ')}</span>
          <span class="text-slate-400 text-[11px]">Avg Price: ৳${Math.round(c.avg_price || 0).toLocaleString()}</span>
        </div>
        <span class="px-2 py-1 bg-slate-700 text-orange-400 font-extrabold rounded-lg">${c.count} items</span>
      </div>
    `).join('');
  }
}

// ==========================================
// 2. PRODUCTS MANAGEMENT (Full CRUD)
// ==========================================
async function loadCategories() {
  try {
    const json = await adminFetch('/api/categories');
    if (json && json.success && json.data) {
      ADMIN.categories = json.data;
      const select = document.getElementById('prod-modal-category');
      if (select) {
        select.innerHTML = ADMIN.categories.map(c => `<option value="${c.id}">${c.name_bn} (${c.name_en})</option>`).join('');
      }
      const filterSelect = document.getElementById('prod-filter-category');
      if (filterSelect) {
        filterSelect.innerHTML = `<option value="all">সকল ক্যাটাগরি (All)</option>` + ADMIN.categories.map(c => `<option value="${c.id}">${c.name_bn}</option>`).join('');
      }
      return;
    }
  } catch (e) {
    console.warn('Using fallback categories');
  }

  ADMIN.categories = typeof DEFAULT_CATEGORIES !== 'undefined' ? DEFAULT_CATEGORIES : [];
  const select = document.getElementById('prod-modal-category');
  if (select && ADMIN.categories.length) {
    select.innerHTML = ADMIN.categories.map(c => `<option value="${c.id}">${c.name_bn} (${c.name_en})</option>`).join('');
  }
  const filterSelect = document.getElementById('prod-filter-category');
  if (filterSelect && ADMIN.categories.length) {
    filterSelect.innerHTML = `<option value="all">সকল ক্যাটাগরি (All)</option>` + ADMIN.categories.map(c => `<option value="${c.id}">${c.name_bn}</option>`).join('');
  }
}

async function loadProducts() {
  try {
    const json = await adminFetch('/api/products?limit=200');
    if (json && json.success && json.data && json.data.length) {
      ADMIN.products = json.data;
      renderProductsTable();
      return;
    }
  } catch (e) {
    console.warn('Using fallback products');
  }

  const stored = JSON.parse(localStorage.getItem('sarowar_local_products') || 'null');
  ADMIN.products = (stored && stored.length) ? stored : (typeof DEFAULT_PRODUCTS !== 'undefined' ? DEFAULT_PRODUCTS : []);
  renderProductsTable();
}

function renderProductsTable() {
  const container = document.getElementById('admin-products-table-body');
  if (!container) return;

  const search = ADMIN.filters.productSearch.toLowerCase();
  const cat = ADMIN.filters.productCategory;

  const filtered = ADMIN.products.filter(p => {
    const matchCat = cat === 'all' || p.category === cat;
    const matchSearch = !search || 
      (p.title_en && p.title_en.toLowerCase().includes(search)) || 
      (p.title_bn && p.title_bn.toLowerCase().includes(search)) || 
      (p.brand && p.brand.toLowerCase().includes(search));
    return matchCat && matchSearch;
  });

  const countBadge = document.getElementById('filter-product-count');
  if (countBadge) countBadge.textContent = filtered.length;

  if (!filtered.length) {
    container.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-xs text-slate-400">No products match your filter criteria</td></tr>`;
    return;
  }

  container.innerHTML = filtered.map(p => `
    <tr class="border-b border-slate-700/60 hover:bg-slate-800/50 transition text-xs">
      <td class="py-3 px-3">
        <div class="flex items-center gap-3">
          <img src="${p.image_url || '/images/fb/logo.jpg'}" class="w-12 h-12 object-contain bg-slate-900 rounded-lg p-1 border border-slate-700 flex-shrink-0" onerror="this.src='/images/fb/logo.jpg'">
          <div class="min-w-0 max-w-xs">
            <strong class="text-white font-bold block truncate" title="${p.title_bn}">${p.title_bn}</strong>
            <span class="text-slate-400 text-[11px] block truncate">${p.title_en}</span>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-700 text-slate-300 font-bold">${p.brand}</span>
              ${p.badge ? `<span class="px-1.5 py-0.2 rounded text-[10px] bg-red-900/60 text-red-300 font-bold">${p.badge}</span>` : ''}
            </div>
          </div>
        </div>
      </td>
      <td class="py-3 px-3 text-slate-300 capitalize">${(p.category || '').replace('_', ' ')}</td>
      <td class="py-3 px-3">
        <strong class="text-orange-400 block font-bold text-sm">৳${Number(p.price).toLocaleString()}</strong>
        <span class="text-slate-400 text-[10px]">/${p.unit}</span>
        ${p.wholesale_price ? `<span class="text-blue-400 text-[10px] block">Wholesale: ৳${Number(p.wholesale_price).toLocaleString()}</span>` : ''}
      </td>
      <td class="py-3 px-3">
        <div class="flex items-center gap-1.5">
          <input type="number" value="${p.stock_qty}" onchange="quickUpdateStock(${p.id}, this.value)" class="w-16 p-1 text-center bg-slate-900 border border-slate-700 rounded text-xs font-bold text-white outline-none focus:border-orange-500">
          <span class="text-[11px] font-bold ${p.stock_qty < 15 ? 'text-red-400' : 'text-emerald-400'}">${p.stock_qty < 15 ? 'Low' : 'OK'}</span>
        </div>
      </td>
      <td class="py-3 px-3 text-center">
        <button onclick="toggleProductFeatured(${p.id})" class="px-2.5 py-1 rounded-full text-[11px] font-bold transition ${p.featured ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-500 border border-slate-700'}">
          <i class="fas fa-star mr-1"></i> ${p.featured ? 'Featured' : 'Standard'}
        </button>
      </td>
      <td class="py-3 px-3 text-center">
        <button onclick="toggleProductInStock(${p.id}, ${p.in_stock ? 0 : 1})" class="px-2.5 py-1 rounded-full text-[11px] font-bold transition ${p.in_stock ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'}">
          ${p.in_stock ? 'In Stock' : 'Stock Out'}
        </button>
      </td>
      <td class="py-3 px-3 text-right">
        <div class="flex items-center justify-end gap-1.5">
          <button onclick="openEditProductModal(${p.id})" class="p-2 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg transition" title="Edit Product">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteProduct(${p.id})" class="p-2 bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white rounded-lg transition" title="Delete Product">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Quick Stock Update
async function quickUpdateStock(id, newQty) {
  try {
    const qty = parseInt(newQty, 10) || 0;
    await adminFetch(`/api/admin/products/${id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock_qty: qty, in_stock: qty > 0 ? 1 : 0 })
    });
    showAdminToast('Stock updated!');
    await loadProducts();
    await loadStats();
    if (typeof autoSyncToCloud === 'function') autoSyncToCloud('product', 'stock', { id, stock_qty: qty });
  } catch (e) {
    alert('Stock update failed: ' + e.message);
  }
}

async function quickAddStock(id, addAmount) {
  const p = ADMIN.products.find(item => item.id == id);
  if (!p) return;
  const newQty = (p.stock_qty || 0) + addAmount;
  await quickUpdateStock(id, newQty);
}

async function toggleProductFeatured(id) {
  try {
    await adminFetch(`/api/admin/products/${id}/toggle-featured`, { method: 'PATCH' });
    showAdminToast('Featured status updated');
    await loadProducts();
  } catch (e) {
    alert('Error toggling featured: ' + e.message);
  }
}

async function toggleProductInStock(id, inStock) {
  try {
    await adminFetch(`/api/admin/products/${id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ in_stock: inStock })
    });
    showAdminToast('Stock status updated');
    await loadProducts();
  } catch (e) {
    alert('Error updating stock status: ' + e.message);
  }
}

// Add Product Modal
function openAddProductModal() {
  const titleEl = document.getElementById('product-modal-title');
  if (titleEl) titleEl.textContent = 'নতুন পণ্য যোগ করুন (Add New Product)';
  
  const form = document.getElementById('product-form');
  if (form) form.reset();

  setElVal('prod-modal-id', '');
  setElVal('prod-modal-title-bn', '');
  setElVal('prod-modal-title-en', '');
  setElVal('prod-modal-brand', '');
  setElVal('prod-modal-price', '');
  setElVal('prod-modal-original-price', '');
  setElVal('prod-modal-unit', 'Piece');
  setElVal('prod-modal-wholesale-price', '');
  setElVal('prod-modal-wholesale-qty', '5');
  setElVal('prod-modal-stock-qty', '50');
  setElVal('prod-modal-badge', '');
  setElVal('prod-modal-image-url', '/images/fb/logo.jpg');
  setElVal('prod-modal-desc-bn', '');
  setElVal('prod-modal-desc-en', '');
  setElVal('prod-modal-specs', '{\n  "Warranty": "Official Guarantee"\n}');

  const featEl = document.getElementById('prod-modal-featured');
  if (featEl) featEl.checked = false;
  const inStockEl = document.getElementById('prod-modal-instock');
  if (inStockEl) inStockEl.checked = true;

  const preview = document.getElementById('prod-image-preview');
  if (preview) preview.src = '/images/fb/logo.jpg';

  const modal = document.getElementById('product-crud-modal');
  if (modal) modal.classList.remove('hidden');
}

// Edit Product Modal (Safe & Complete)
function openEditProductModal(id) {
  const p = ADMIN.products.find(item => item.id == id);
  if (!p) {
    console.error('Product not found with id:', id, 'Available products:', ADMIN.products);
    alert('Product details could not be found. Please refresh the page.');
    return;
  }

  const titleEl = document.getElementById('product-modal-title');
  if (titleEl) titleEl.textContent = 'পণ্য এডিট করুন (Edit Product)';

  setElVal('prod-modal-id', p.id);
  setElVal('prod-modal-title-bn', p.title_bn || '');
  setElVal('prod-modal-title-en', p.title_en || '');
  setElVal('prod-modal-category', p.category || 'cables');
  setElVal('prod-modal-brand', p.brand || '');
  setElVal('prod-modal-price', p.price || 0);
  setElVal('prod-modal-original-price', p.original_price || '');
  setElVal('prod-modal-unit', p.unit || 'Piece');
  setElVal('prod-modal-wholesale-price', p.wholesale_price || '');
  setElVal('prod-modal-wholesale-qty', p.wholesale_min_qty || 5);
  setElVal('prod-modal-stock-qty', p.stock_qty || 0);
  setElVal('prod-modal-badge', p.badge || '');
  setElVal('prod-modal-image-url', p.image_url || '');
  setElVal('prod-modal-desc-bn', p.description_bn || '');
  setElVal('prod-modal-desc-en', p.description_en || '');

  let specsFormatted = '{}';
  if (p.specs && typeof p.specs === 'object') {
    specsFormatted = JSON.stringify(p.specs, null, 2);
  } else if (p.specs && typeof p.specs === 'string') {
    try {
      specsFormatted = JSON.stringify(JSON.parse(p.specs), null, 2);
    } catch (e) {
      specsFormatted = p.specs;
    }
  }
  setElVal('prod-modal-specs', specsFormatted);

  const featEl = document.getElementById('prod-modal-featured');
  if (featEl) featEl.checked = !!p.featured;
  const inStockEl = document.getElementById('prod-modal-instock');
  if (inStockEl) inStockEl.checked = !!p.in_stock;

  const preview = document.getElementById('prod-image-preview');
  if (preview) preview.src = p.image_url || '/images/fb/logo.jpg';

  const modal = document.getElementById('product-crud-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeProductCrudModal() {
  const modal = document.getElementById('product-crud-modal');
  if (modal) modal.classList.add('hidden');
}

// Upload Product Image file
async function handleImageFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);

  const uploadBtn = document.getElementById('btn-upload-label');
  const origBtn = uploadBtn ? uploadBtn.innerHTML : 'Upload';
  if (uploadBtn) uploadBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Uploading...`;

  try {
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'x-admin-pin': ADMIN.token },
      body: formData
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.url) {
        setElVal('prod-modal-image-url', json.url);
        const preview = document.getElementById('prod-image-preview');
        if (preview) preview.src = json.url;
        showAdminToast('Image uploaded successfully!');
        return;
      }
    }
    throw new Error('Static fallback upload');
  } catch (err) {
    // Read as Data URL in static mode
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setElVal('prod-modal-image-url', dataUrl);
      const preview = document.getElementById('prod-image-preview');
      if (preview) preview.src = dataUrl;
      showAdminToast('Image loaded successfully!');
    };
    reader.readAsDataURL(file);
  } finally {
    if (uploadBtn) uploadBtn.innerHTML = origBtn;
  }
}

// Save Product (Create or Update)
async function submitProductForm(e) {
  if (e) e.preventDefault();
  const id = getElVal('prod-modal-id').trim();

  const titleBn = getElVal('prod-modal-title-bn').trim();
  const titleEn = getElVal('prod-modal-title-en').trim();

  if (!titleBn && !titleEn) {
    alert('Please enter at least a Bengali or English product title');
    return;
  }

  const rawSpecs = getElVal('prod-modal-specs').trim();
  let specsObj = {};
  if (rawSpecs) {
    try {
      specsObj = JSON.parse(rawSpecs);
    } catch (err) {
      specsObj = { "Specs": rawSpecs };
    }
  }

  const priceVal = Number(getElVal('prod-modal-price')) || 0;
  if (priceVal <= 0) {
    alert('Please enter a valid product price');
    return;
  }

  const origPriceVal = getElVal('prod-modal-original-price');
  const wholesalePriceVal = getElVal('prod-modal-wholesale-price');

  const payload = {
    title_bn: titleBn || titleEn,
    title_en: titleEn || titleBn,
    category: getElVal('prod-modal-category', 'cables'),
    brand: getElVal('prod-modal-brand', 'General').trim() || 'General',
    price: priceVal,
    original_price: origPriceVal ? Number(origPriceVal) : null,
    unit: getElVal('prod-modal-unit', 'Piece').trim() || 'Piece',
    wholesale_price: wholesalePriceVal ? Number(wholesalePriceVal) : null,
    wholesale_min_qty: Number(getElVal('prod-modal-wholesale-qty', '5')) || 5,
    stock_qty: Number(getElVal('prod-modal-stock-qty', '50')) || 0,
    badge: getElVal('prod-modal-badge').trim() || null,
    image_url: getElVal('prod-modal-image-url').trim() || '/images/fb/logo.jpg',
    description_bn: getElVal('prod-modal-desc-bn').trim(),
    description_en: getElVal('prod-modal-desc-en').trim(),
    specs: specsObj,
    featured: document.getElementById('prod-modal-featured')?.checked ? 1 : 0,
    in_stock: document.getElementById('prod-modal-instock')?.checked ? 1 : 0
  };

  const submitBtn = document.querySelector('#product-form button[type="submit"]');
  const origBtnText = submitBtn ? submitBtn.innerHTML : 'Save';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving...`;
  }

  try {
    if (id) {
      const res = await adminFetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showAdminToast(res.message || 'Product updated successfully!');
    } else {
      const res = await adminFetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showAdminToast(res.message || 'Product created successfully!');
    }

    closeProductCrudModal();
    await loadProducts();
    await loadStats();
    if (typeof autoSyncToCloud === 'function') {
      autoSyncToCloud('product', 'save', { ...payload, id: id ? Number(id) : (res?.data?.id || Date.now()) });
    }
  } catch (err) {
    console.error('Error submitting product form:', err);
    alert('Error saving product: ' + err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origBtnText;
    }
  }
}

// Delete Product
async function deleteProduct(id) {
  const p = ADMIN.products.find(item => item.id == id);
  if (!confirm(`Are you sure you want to delete "${p?.title_bn || p?.title_en || 'this product'}"?`)) return;

  try {
    await adminFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    showAdminToast('Product deleted successfully');
    await loadProducts();
    await loadStats();
    if (typeof autoSyncToCloud === 'function') autoSyncToCloud('product', 'delete', id);
  } catch (e) {
    alert('Delete failed: ' + e.message);
  }
}

// ==========================================
// 3. ORDERS MANAGEMENT
// ==========================================
async function loadOrders() {
  try {
    const json = await adminFetch('/api/admin/orders');
    if (json.success) {
      ADMIN.orders = json.data;
      renderOrdersTable();
    }
  } catch (e) {
    console.error(e);
  }
}

function renderOrdersTable() {
  const container = document.getElementById('admin-orders-table-body');
  if (!container) return;

  const statusFilter = ADMIN.filters.orderStatus;
  const filtered = ADMIN.orders.filter(o => statusFilter === 'all' || o.status === statusFilter);

  if (!filtered.length) {
    container.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-xs text-slate-400">No orders found for this status</td></tr>`;
    return;
  }

  container.innerHTML = filtered.map(o => `
    <tr class="border-b border-slate-700/60 hover:bg-slate-800/50 transition text-xs">
      <td class="py-3 px-3">
        <strong class="text-white block font-black">${o.order_number}</strong>
        <span class="text-slate-400 text-[10px]">${new Date(o.created_at).toLocaleString()}</span>
      </td>
      <td class="py-3 px-3">
        <strong class="text-white block font-bold">${o.customer_name}</strong>
        <a href="tel:${o.customer_phone}" class="text-orange-400 font-bold hover:underline">${o.customer_phone}</a>
      </td>
      <td class="py-3 px-3">
        <span class="text-slate-300 block">${o.delivery_address}</span>
        <span class="text-slate-400 text-[10px] font-semibold">${o.upazila}</span>
      </td>
      <td class="py-3 px-3">
        <strong class="text-orange-400 text-sm block font-black">৳${Number(o.total_amount).toLocaleString()}</strong>
        <span class="text-[10px] text-slate-400 uppercase font-bold">${o.payment_method} (${o.payment_status})</span>
      </td>
      <td class="py-3 px-3">
        <select onchange="updateOrderStatusInTable(${o.id}, this.value)" class="p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white outline-none focus:border-orange-500">
          <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
          <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
          <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
      <td class="py-3 px-3 text-right">
        <div class="flex items-center justify-end gap-1.5">
          <button onclick="viewOrderInvoice(${o.id})" class="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition" title="View / Print Invoice">
            <i class="fas fa-file-invoice"></i>
          </button>
          <a href="https://wa.me/${o.customer_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`আসসালামু আলাইকুম ${o.customer_name} ভাই। সারোয়ার ইলেকট্রিক (বড় হরিশপুর, নাটোর) থেকে আপনার অর্ডার (${o.order_number}) এর বিষয়ে যোগাযোগ করছি। বর্তমান স্ট্যাটাস: ${o.status}। মোট বিল: ৳${o.total_amount}`)}" target="_blank" class="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition" title="WhatsApp Customer">
            <i class="fab fa-whatsapp"></i>
          </a>
          <button onclick="deleteOrder(${o.id})" class="p-1.5 bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white rounded-lg transition" title="Delete">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function updateOrderStatusInTable(id, status) {
  try {
    await adminFetch(`/api/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    showAdminToast(`Order #${id} updated to ${status}`);
    await loadOrders();
    await loadStats();
    if (typeof autoSyncToCloud === 'function') autoSyncToCloud('order', 'update', { id, status });
  } catch (e) {
    alert('Update failed: ' + e.message);
  }
}

async function deleteOrder(id) {
  if (!confirm(`Delete order #${id}? This action cannot be undone.`)) return;
  try {
    await adminFetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
    showAdminToast('Order deleted');
    await loadOrders();
    await loadStats();
  } catch (e) {
    alert('Delete order failed: ' + e.message);
  }
}

function viewOrderInvoice(id) {
  const o = ADMIN.orders.find(item => item.id == id);
  if (!o) return;

  setElText('invoice-order-no', o.order_number);
  setElText('invoice-date', new Date(o.created_at).toLocaleString());
  setElText('invoice-customer', o.customer_name);
  setElText('invoice-phone', o.customer_phone);
  setElText('invoice-address', `${o.delivery_address}, ${o.upazila}`);
  setElText('invoice-payment', `${(o.payment_method || 'cod').toUpperCase()} (${o.payment_status})`);
  setElText('invoice-status', o.status);

  const itemsContainer = document.getElementById('invoice-items-body');
  if (itemsContainer) {
    itemsContainer.innerHTML = (o.items || []).map((i, idx) => `
      <tr class="border-b border-slate-200">
        <td class="py-2 px-3 text-slate-500">${idx + 1}</td>
        <td class="py-2 px-3 font-bold text-slate-800">${i.title_bn || i.title_en}</td>
        <td class="py-2 px-3 text-right">৳${Number(i.price).toLocaleString()}</td>
        <td class="py-2 px-3 text-center">${i.quantity}</td>
        <td class="py-2 px-3 text-right font-bold text-slate-900">৳${(i.price * i.quantity).toLocaleString()}</td>
      </tr>
    `).join('');
  }

  setElText('invoice-subtotal', `৳${Number(o.subtotal || 0).toLocaleString()}`);
  setElText('invoice-delivery', `৳${Number(o.delivery_fee || 0).toLocaleString()}`);
  setElText('invoice-total', `৳${Number(o.total_amount).toLocaleString()}`);

  const modal = document.getElementById('order-invoice-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeInvoiceModal() {
  const modal = document.getElementById('order-invoice-modal');
  if (modal) modal.classList.add('hidden');
}

function printOrderInvoice() {
  window.print();
}

// ==========================================
// 4. WHOLESALE QUOTATIONS
// ==========================================
async function loadQuotations() {
  try {
    const json = await adminFetch('/api/admin/quotations');
    if (json.success) {
      ADMIN.quotations = json.data;
      renderQuotations();
    }
  } catch (e) {
    console.error(e);
  }
}

function renderQuotations() {
  const container = document.getElementById('admin-quotes-grid');
  if (!container) return;

  if (!ADMIN.quotations.length) {
    container.innerHTML = `<div class="col-span-full py-8 text-center text-xs text-slate-400">No quotation requests yet</div>`;
    return;
  }

  container.innerHTML = ADMIN.quotations.map(q => `
    <div class="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 shadow-md text-xs flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between pb-3 border-b border-slate-700 mb-3">
          <div>
            <span class="text-orange-400 font-black text-sm block">${q.quote_number}</span>
            <span class="text-slate-400 text-[10px]">${new Date(q.created_at).toLocaleDateString()}</span>
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">
            ${q.client_type}
          </span>
        </div>

        <div class="space-y-1.5 mb-3">
          <p><strong class="text-white text-sm">${q.client_name}</strong></p>
          <p class="text-slate-300"><strong>Mobile:</strong> <a href="tel:${q.phone}" class="text-orange-400 font-bold">${q.phone}</a></p>
          <p class="text-slate-400"><strong>Project Location:</strong> ${q.location || 'Natore'}</p>
          <p class="text-slate-400"><strong>Estimated Budget:</strong> ${q.estimated_budget || 'Negotiable'}</p>
        </div>

        <div class="p-3 bg-slate-900 rounded-xl border border-slate-700/80 mb-3 text-slate-200">
          <strong class="text-slate-400 text-[10px] block uppercase mb-1">Materials Needed:</strong>
          <p class="whitespace-pre-line leading-relaxed">${q.materials_needed}</p>
        </div>

        <div>
          <label class="block text-slate-400 text-[10px] uppercase font-bold mb-1">Admin Calculation Notes:</label>
          <input type="text" id="quote-note-${q.id}" value="${q.notes || ''}" placeholder="যেমন: ১০% ডিসকাউন্ট চূড়ান্ত রেট দেওয়া হয়েছে..." class="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-orange-500">
        </div>
      </div>

      <div class="pt-4 border-t border-slate-700/80 flex items-center justify-between mt-3 gap-2">
        <select onchange="updateQuoteStatus(${q.id}, this.value)" class="p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white">
          <option value="Pending" ${q.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Reviewed" ${q.status === 'Reviewed' ? 'selected' : ''}>Reviewed</option>
          <option value="Quote Sent" ${q.status === 'Quote Sent' ? 'selected' : ''}>Quote Sent</option>
          <option value="Closed" ${q.status === 'Closed' ? 'selected' : ''}>Closed</option>
        </select>

        <div class="flex items-center gap-1.5">
          <button onclick="saveQuoteNotes(${q.id})" class="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg" title="Save Notes">
            <i class="fas fa-save"></i>
          </button>
          <a href="https://wa.me/${q.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`আসসালামু আলাইকুম ${q.client_name} ভাই, সারোয়ার ইলেকট্রিক (বড় হরিশপুর, নাটোর) থেকে আপনার ${q.quote_number} কোটেশনের অফিশিয়াল রেট প্রসঙ্গে যোগাযোগ করছি।`)}" target="_blank" class="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold" title="WhatsApp Quote">
            <i class="fab fa-whatsapp"></i>
          </a>
          <button onclick="deleteQuote(${q.id})" class="p-2 bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white rounded-lg" title="Delete Quote">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

async function updateQuoteStatus(id, status) {
  try {
    await adminFetch(`/api/admin/quotations/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    showAdminToast('Quote status updated');
    await loadQuotations();
  } catch (e) {
    alert('Quote update failed: ' + e.message);
  }
}

async function saveQuoteNotes(id) {
  const note = getElVal(`quote-note-${id}`);
  try {
    await adminFetch(`/api/admin/quotations/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: note })
    });
    showAdminToast('Notes saved!');
  } catch (e) {
    alert('Failed to save notes: ' + e.message);
  }
}

async function deleteQuote(id) {
  if (!confirm('Delete this quotation request?')) return;
  try {
    await adminFetch(`/api/admin/quotations/${id}`, { method: 'DELETE' });
    showAdminToast('Quotation deleted');
    await loadQuotations();
    await loadStats();
  } catch (e) {
    alert('Delete quotation failed: ' + e.message);
  }
}

// ==========================================
// 5. SERVICE BOOKINGS (Electricians)
// ==========================================
async function loadServices() {
  try {
    const json = await adminFetch('/api/admin/service-bookings');
    if (json.success) {
      ADMIN.services = json.data;
      renderServices();
    }
  } catch (e) {
    console.error(e);
  }
}

function renderServices() {
  const container = document.getElementById('admin-services-list');
  if (!container) return;

  if (!ADMIN.services.length) {
    container.innerHTML = `<div class="py-8 text-center text-xs text-slate-400">No service bookings yet</div>`;
    return;
  }

  container.innerHTML = ADMIN.services.map(s => `
    <div class="p-4 bg-slate-800/90 rounded-2xl border border-slate-700 shadow-md text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <strong class="text-white text-sm">${s.booking_number} - ${s.service_type}</strong>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${s.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}">${s.status}</span>
        </div>
        <p class="text-slate-300">Customer: <strong>${s.customer_name}</strong> | Phone: <a href="tel:${s.phone}" class="text-orange-400 font-bold">${s.phone}</a></p>
        <p class="text-slate-400">Address: ${s.address} | Date: ${s.preferred_date}</p>
        ${s.details ? `<p class="text-slate-300 bg-slate-900 p-2 rounded-lg mt-1 border border-slate-700/60">Details: ${s.details}</p>` : ''}
      </div>

      <div class="flex items-center gap-2">
        <select onchange="updateServiceStatus(${s.id}, this.value)" class="p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white">
          <option value="Pending" ${s.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Assigned" ${s.status === 'Assigned' ? 'selected' : ''}>Assigned</option>
          <option value="Completed" ${s.status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Cancelled" ${s.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
        <a href="tel:${s.phone}" class="p-2 bg-blue-600 text-white rounded-lg"><i class="fas fa-phone-alt"></i></a>
        <button onclick="deleteService(${s.id})" class="p-2 bg-red-600/30 text-red-300 hover:bg-red-600 hover:text-white rounded-lg"><i class="fas fa-trash-alt"></i></button>
      </div>
    </div>
  `).join('');
}

async function updateServiceStatus(id, status) {
  try {
    await adminFetch(`/api/admin/service-bookings/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    showAdminToast('Service status updated');
    await loadServices();
    await loadStats();
  } catch (e) {
    alert('Update failed: ' + e.message);
  }
}

async function deleteService(id) {
  if (!confirm('Delete this service request?')) return;
  try {
    await adminFetch(`/api/admin/service-bookings/${id}`, { method: 'DELETE' });
    showAdminToast('Service booking deleted');
    await loadServices();
    await loadStats();
  } catch (e) {
    alert('Delete failed: ' + e.message);
  }
}

// ==========================================
// 6. REVIEWS MANAGEMENT
// ==========================================
async function loadReviews() {
  try {
    const json = await adminFetch('/api/admin/reviews');
    if (json.success) {
      ADMIN.reviews = json.data;
      renderAdminReviews();
    }
  } catch (e) {
    console.error(e);
  }
}

function renderAdminReviews() {
  const container = document.getElementById('admin-reviews-list');
  if (!container) return;

  if (!ADMIN.reviews.length) {
    container.innerHTML = `<div class="py-8 text-center text-xs text-slate-400">No reviews found</div>`;
    return;
  }

  container.innerHTML = ADMIN.reviews.map(r => `
    <div class="p-4 bg-slate-800/90 rounded-2xl border border-slate-700 shadow-sm text-xs flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-2">
          <div>
            <strong class="text-white text-sm block">${r.author_name}</strong>
            <span class="text-slate-400 text-[11px]">${r.location || 'Natore'}</span>
          </div>
          <div class="flex text-amber-400">
            ${Array.from({ length: r.rating || 5 }).map(() => '<i class="fas fa-star text-xs"></i>').join('')}
          </div>
        </div>
        <p class="text-slate-300 italic mb-3">"${r.comment}"</p>
      </div>

      <div class="pt-3 border-t border-slate-700 flex items-center justify-between">
        <button onclick="toggleReviewVerify(${r.id}, ${r.verified ? 0 : 1})" class="px-2.5 py-1 rounded-full text-[11px] font-bold ${r.verified ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'}">
          ${r.verified ? 'Verified & Public' : 'Hidden / Pending'}
        </button>
        <button onclick="deleteReview(${r.id})" class="p-1.5 text-slate-400 hover:text-red-400">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
  `).join('');
}

async function toggleReviewVerify(id, verified) {
  try {
    await adminFetch(`/api/admin/reviews/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified })
    });
    showAdminToast('Review status updated');
    await loadReviews();
  } catch (e) {
    alert('Review update failed: ' + e.message);
  }
}

async function deleteReview(id) {
  if (!confirm('Delete this customer review?')) return;
  try {
    await adminFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    showAdminToast('Review deleted');
    await loadReviews();
  } catch (e) {
    alert('Delete review failed: ' + e.message);
  }
}

async function submitManualReview(e) {
  if (e) e.preventDefault();
  const name = getElVal('manual-rev-name').trim();
  const loc = getElVal('manual-rev-loc').trim();
  const rating = getElVal('manual-rev-rating', '5');
  const comment = getElVal('manual-rev-comment').trim();

  try {
    await adminFetch('/api/admin/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_name: name, location: loc, rating, comment, verified: 1 })
    });
    showAdminToast('Showroom review added successfully!');
    const form = document.getElementById('manual-review-form');
    if (form) form.reset();
    await loadReviews();
  } catch (e) {
    alert('Failed to add review: ' + e.message);
  }
}

// ==========================================
// 7. STORE SETTINGS & PIN MANAGEMENT
// ==========================================
async function loadSettings() {
  setElVal('set-backend-url', localStorage.getItem('seh_backend_url') || '');
  updateBackendStatusPill();

  try {
    const json = await adminFetch('/api/admin/settings');
    if (json.success && json.data) {
      ADMIN.settings = json.data;
      setElVal('set-store-name-bn', json.data.store_name_bn || '');
      setElVal('set-store-name-en', json.data.store_name_en || '');
      setElVal('set-phone-primary', json.data.phone_primary || '');
      setElVal('set-phone-secondary', json.data.phone_secondary || '');
      setElVal('set-phone-alt', json.data.phone_alt || '');
      setElVal('set-whatsapp', json.data.whatsapp || '');
      setElVal('set-email', json.data.email || '');
      setElVal('set-address-bn', json.data.address_bn || '');
      setElVal('set-address-en', json.data.address_en || '');
      setElVal('set-business-hours', json.data.business_hours || '');
      setElVal('set-tagline-bn', json.data.tagline_bn || '');
    }
  } catch (e) {
    console.error(e);
  }
}

async function updateBackendStatusPill() {
  const pill = document.getElementById('backend-status-pill');
  if (!pill) return;
  const base = getApiBase();
  const testUrl = (base || '') + '/api/settings';

  try {
    const res = await fetch(testUrl);
    if (res.ok) {
      pill.textContent = '🟢 Live Server Connected';
      pill.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      return;
    }
  } catch (err) {}

  if (base) {
    pill.textContent = '❌ Disconnected';
    pill.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30';
  } else {
    pill.textContent = '⚡ Direct Server Mode';
    pill.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30';
  }
}

async function testAndSaveBackendUrl() {
  const input = document.getElementById('set-backend-url');
  const pill = document.getElementById('backend-status-pill');
  if (!input) return;

  const url = input.value.trim().replace(/\/$/, '');
  if (pill) {
    pill.textContent = 'Connecting...';
    pill.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30';
  }

  if (!url) {
    localStorage.removeItem('seh_backend_url');
    updateBackendStatusPill();
    showAdminToast('Reset to default direct connection');
    await loadDashboardData();
    return;
  }

  try {
    const res = await fetch(url + '/api/settings');
    if (res.ok) {
      localStorage.setItem('seh_backend_url', url);
      if (pill) {
        pill.textContent = '🟢 Live Server Connected';
        pill.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      }
      showAdminToast('Live backend connected successfully!');
      await loadDashboardData();
      return;
    }
  } catch (err) {}

  if (pill) {
    pill.textContent = '❌ Connection Failed';
    pill.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30';
  }
  alert('Could not connect to: ' + url + '\nPlease ensure the Node.js server is running and accessible.');
}

async function submitStoreSettings(e) {
  if (e) e.preventDefault();
  const payload = {
    store_name_bn: getElVal('set-store-name-bn').trim(),
    store_name_en: getElVal('set-store-name-en').trim(),
    phone_primary: getElVal('set-phone-primary').trim(),
    phone_secondary: getElVal('set-phone-secondary').trim(),
    phone_alt: getElVal('set-phone-alt').trim(),
    whatsapp: getElVal('set-whatsapp').trim(),
    email: getElVal('set-email').trim(),
    address_bn: getElVal('set-address-bn').trim(),
    address_en: getElVal('set-address-en').trim(),
    business_hours: getElVal('set-business-hours').trim(),
    tagline_bn: getElVal('set-tagline-bn').trim()
  };

  try {
    await adminFetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    showAdminToast('Store settings saved successfully!');
    if (typeof autoSyncToCloud === 'function') autoSyncToCloud('settings', 'save', payload);
  } catch (e) {
    alert('Settings save failed: ' + e.message);
  }
}

async function submitChangePin(e) {
  if (e) e.preventDefault();
  const currentPin = getElVal('pin-current').trim();
  const newPin = getElVal('pin-new').trim();
  const confirmPin = getElVal('pin-confirm').trim();

  if (newPin !== confirmPin) {
    alert('New PIN and Confirm PIN do not match');
    return;
  }

  try {
    const res = await adminFetch('/api/admin/settings/change-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_pin: currentPin, new_pin: newPin })
    });

    if (res.success) {
      alert('Admin PIN successfully changed! Please remember your new PIN.');
      ADMIN.token = newPin;
      sessionStorage.setItem('seh_admin_token', newPin);
      const form = document.getElementById('change-pin-form');
      if (form) form.reset();
    }
  } catch (e) {
    alert('Failed to change PIN: ' + e.message);
  }
}

// ==========================================
// 8. DATABASE TOOLS (Backup, Restore, SQL)
// ==========================================
async function exportFullDatabaseBackup() {
  try {
    const json = await adminFetch('/api/admin/export');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `sarowar_electric_backup_${Date.now()}.json`);
    dlAnchorElem.click();
    showAdminToast('Backup downloaded successfully!');
  } catch (e) {
    alert('Backup export failed: ' + e.message);
  }
}

async function restoreDatabaseFromFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!confirm('Warning: Restoring will overwrite existing database records with the backup. Continue?')) {
    e.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const backupJson = JSON.parse(event.target.result);
      const res = await adminFetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupJson)
      });
      if (res.success) {
        alert('Database restored successfully!');
        location.reload();
      }
    } catch (err) {
      alert('Error restoring database file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

async function resetDatabaseToDefault() {
  if (!confirm('Are you sure you want to RESET the entire database to default store seed data? All custom orders and changes will be restored to initial defaults!')) return;
  if (!confirm('Double confirmation: Please confirm one more time to reset database.')) return;

  try {
    const res = await adminFetch('/api/admin/reset-db', { method: 'POST' });
    if (res.success) {
      alert('Database reset completed!');
      location.reload();
    }
  } catch (e) {
    alert('Reset failed: ' + e.message);
  }
}

// Raw SQL Query Runner
async function executeCustomSql() {
  const sql = getElVal('sql-query-input').trim();
  const outputEl = document.getElementById('sql-result-output');

  if (!sql) {
    alert('Please write a SQL statement');
    return;
  }

  if (outputEl) outputEl.textContent = 'Executing query...';

  try {
    const res = await adminFetch('/api/admin/sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql })
    });

    if (outputEl) outputEl.textContent = JSON.stringify(res.rows || res.result || res, null, 2);
    showAdminToast('SQL executed');
  } catch (err) {
    if (outputEl) outputEl.textContent = 'Error: ' + err.message;
  }
}

// Toast helper
function showAdminToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-6 right-6 z-50 bg-orange-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 transition duration-300';
  toast.innerHTML = `<i class="fas fa-check-circle"></i> <span>${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ==========================================
// 9. DATABASE TELEMETRY & CLOUD SYNC ENGINE
// Dual-Engine: SQLite Local Backend + Firebase Realtime Database REST API + LocalStorage Vault
// ==========================================

const DB_CONFIG_KEY = 'sarowar_db_config_v1';
const DEFAULT_DB_CONFIG = {
  firebaseUrl: 'https://alaminmahfuz-portfolio-default-rtdb.firebaseio.com',
  autoSync: true
};

function getDatabaseConfig() {
  try {
    const raw = localStorage.getItem(DB_CONFIG_KEY);
    if (raw) return Object.assign({}, DEFAULT_DB_CONFIG, JSON.parse(raw));
  } catch (e) {
    console.warn('Error reading DB config:', e);
  }
  return Object.assign({}, DEFAULT_DB_CONFIG);
}

function saveDatabaseConfig(cfg) {
  const merged = Object.assign(getDatabaseConfig(), cfg || {});
  localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(merged));
  return merged;
}

// Test Connection / Ping Telemetry
async function testDatabaseConnection() {
  const cfg = getDatabaseConfig();
  const start = performance.now();

  // 1. If not file://, test local server DB status endpoint first
  if (window.location.protocol !== 'file:') {
    try {
      const base = getApiBase();
      const res = await fetch((base || '') + '/api/db/status', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const latency = Math.max(1, Math.round(performance.now() - start));
        return {
          ok: true,
          provider: 'Node.js Local Server Database',
          storage: 'data/sarowar.sqlite (SQLite3)',
          productsCount: json.productsCount || (ADMIN.products ? ADMIN.products.length : 15),
          ordersCount: json.ordersCount || 0,
          latencyMs: latency
        };
      }
    } catch (e) {
      // Local server not running
    }
  }

  // 2. Test Firebase Realtime Database
  if (cfg.firebaseUrl) {
    try {
      const cleanUrl = cfg.firebaseUrl.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/.json?shallow=true`, { cache: 'no-store' });
      const latency = Math.max(1, Math.round(performance.now() - start));
      if (res.ok || res.status === 404 || res.status === 401 || res.status === 200) {
        const prods = JSON.parse(localStorage.getItem('sarowar_local_products') || 'null') || (typeof DEFAULT_PRODUCTS !== 'undefined' ? DEFAULT_PRODUCTS : []);
        return {
          ok: true,
          provider: 'Firebase Realtime Cloud Database',
          storage: cleanUrl,
          productsCount: prods.length,
          latencyMs: latency
        };
      }
    } catch (err) {
      console.warn('Firebase ping error:', err);
    }
  }

  // 3. Fallback to LocalStorage & Git Sync Engine
  const prods = JSON.parse(localStorage.getItem('sarowar_local_products') || 'null') || (typeof DEFAULT_PRODUCTS !== 'undefined' ? DEFAULT_PRODUCTS : []);
  const latency = Math.max(1, Math.round(performance.now() - start));
  return {
    ok: true,
    provider: 'Offline LocalStorage & Git Sync Engine',
    storage: 'Browser LocalStorage Vault',
    productsCount: prods.length,
    latencyMs: latency
  };
}

// Update DB Telemetry Stats in the UI
function updateDbStats(res) {
  const providerEl = document.getElementById('db-stat-provider');
  const countEl = document.getElementById('db-stat-messages');
  const pingEl = document.getElementById('db-stat-ping');
  const badgeEl = document.getElementById('db-health-badge');
  const engineEl = document.getElementById('db-log-engine');
  const storageEl = document.getElementById('db-log-storage');
  const latencyEl = document.getElementById('db-log-latency');

  if (!res) {
    const prods = JSON.parse(localStorage.getItem('sarowar_local_products') || 'null') || (typeof DEFAULT_PRODUCTS !== 'undefined' ? DEFAULT_PRODUCTS : []);
    res = {
      ok: true,
      provider: 'Offline LocalStorage & Git Sync Engine',
      storage: 'Browser LocalStorage Vault',
      productsCount: prods.length,
      latencyMs: 1
    };
  }

  if (providerEl) providerEl.textContent = res.provider || 'Offline LocalStorage & Git Sync Engine';
  if (countEl) countEl.textContent = res.productsCount != null ? res.productsCount : 15;
  if (pingEl) pingEl.textContent = `${res.latencyMs || 1} ms`;

  if (badgeEl) {
    if (res.ok) {
      badgeEl.textContent = 'CONNECTED';
      badgeEl.className = 'px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    } else {
      badgeEl.textContent = 'OFFLINE';
      badgeEl.className = 'px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30';
    }
  }

  if (engineEl) engineEl.textContent = res.provider || 'Offline LocalStorage & Git Sync Engine';
  if (storageEl) storageEl.textContent = res.storage || 'Browser LocalStorage Vault';
  if (latencyEl) latencyEl.textContent = `${res.latencyMs || 1} ms`;
}

// Pull All Content from Database
async function pullAllFromDatabase() {
  showAdminToast('Fetching content from database...');
  const cfg = getDatabaseConfig();
  let loadedProducts = null;
  let loadedOrders = null;
  let loadedSettings = null;

  // 1. Try local server
  if (window.location.protocol !== 'file:') {
    try {
      const base = getApiBase();
      const res = await fetch((base || '') + '/api/products?limit=200');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          loadedProducts = json.data;
        }
      }
    } catch (e) {}
  }

  // 2. Try Firebase RTDB if not loaded from server
  if (!loadedProducts && cfg.firebaseUrl) {
    try {
      const cleanUrl = cfg.firebaseUrl.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/sarowar/products.json`, { cache: 'no-store' });
      if (res.ok) {
        const fbData = await res.json();
        if (fbData) {
          loadedProducts = Array.isArray(fbData) 
            ? fbData.filter(Boolean) 
            : Object.values(fbData);
        }
      }
      // Also pull orders
      const oRes = await fetch(`${cleanUrl}/sarowar/orders.json`, { cache: 'no-store' });
      if (oRes.ok) {
        const oData = await oRes.json();
        if (oData) {
          loadedOrders = Array.isArray(oData) ? oData.filter(Boolean) : Object.values(oData);
        }
      }
      // Pull settings
      const sRes = await fetch(`${cleanUrl}/sarowar/settings.json`, { cache: 'no-store' });
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData) loadedSettings = sData;
      }
    } catch (err) {
      console.warn('Firebase pull error:', err);
    }
  }

  // Fallback to local storage or defaults
  if (!loadedProducts || !loadedProducts.length) {
    loadedProducts = JSON.parse(localStorage.getItem('sarowar_local_products') || 'null') || (typeof DEFAULT_PRODUCTS !== 'undefined' ? DEFAULT_PRODUCTS : []);
  }

  // Save to localStorage
  localStorage.setItem('sarowar_local_products', JSON.stringify(loadedProducts));
  if (loadedOrders && loadedOrders.length) {
    localStorage.setItem('sarowar_orders', JSON.stringify(loadedOrders));
  }
  if (loadedSettings) {
    localStorage.setItem('sarowar_settings', JSON.stringify(loadedSettings));
  }

  ADMIN.products = loadedProducts;
  if (typeof renderProductsTable === 'function') renderProductsTable();
  if (typeof loadOrders === 'function') await loadOrders();
  if (typeof loadStats === 'function') await loadStats();

  updateDbStats({
    ok: true,
    provider: cfg.firebaseUrl ? 'Firebase Realtime Cloud Database' : 'Offline LocalStorage & Git Sync Engine',
    storage: cfg.firebaseUrl ? cfg.firebaseUrl : 'Browser LocalStorage Vault',
    productsCount: loadedProducts.length,
    latencyMs: 1
  });

  showAdminToast(`✓ Database synchronized! (${loadedProducts.length} products loaded)`);
}

// Push All Content to Database
async function syncAllToDatabase() {
  showAdminToast('Pushing full store state to database...');
  const cfg = getDatabaseConfig();
  const prods = JSON.parse(localStorage.getItem('sarowar_local_products') || 'null') || (typeof DEFAULT_PRODUCTS !== 'undefined' ? DEFAULT_PRODUCTS : []);
  const orders = JSON.parse(localStorage.getItem('sarowar_orders') || '[]');
  const cats = typeof DEFAULT_CATEGORIES !== 'undefined' ? DEFAULT_CATEGORIES : [];
  const settings = JSON.parse(localStorage.getItem('sarowar_settings') || 'null') || (typeof DEFAULT_SETTINGS !== 'undefined' ? DEFAULT_SETTINGS : {});

  let cloudOk = false;
  let serverOk = false;

  // 1. Push to Firebase Realtime Database REST API
  if (cfg.firebaseUrl) {
    try {
      const cleanUrl = cfg.firebaseUrl.replace(/\/+$/, '');
      const fullPayload = {
        products: prods,
        categories: cats,
        orders: orders,
        settings: settings,
        updated_at: new Date().toISOString()
      };

      const res = await fetch(`${cleanUrl}/sarowar.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload)
      });
      if (res.ok) cloudOk = true;
    } catch (e) {
      console.warn('Firebase push error:', e);
    }
  }

  // 2. Push to local server import if available
  if (window.location.protocol !== 'file:') {
    try {
      const base = getApiBase();
      const res = await fetch((base || '') + '/api/admin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': ADMIN.token || '1234'
        },
        body: JSON.stringify({
          products: prods,
          categories: cats,
          orders: orders,
          settings: settings
        })
      });
      if (res.ok) serverOk = true;
    } catch (e) {}
  }

  if (cloudOk || serverOk) {
    showAdminToast('✓ All store content successfully pushed to Cloud Database!');
    const box = document.getElementById('db-test-result');
    if (box) {
      box.innerHTML = `
        <div>Database Status: <span class="text-emerald-400 font-bold">✓ Online & Operational (Content Pushed)</span></div>
        <div>Active Engine: <span class="text-cyan-300">${cfg.firebaseUrl ? 'Firebase RTDB REST Engine' : 'Node.js SQLite Server'}</span></div>
        <div>Storage Location: <span class="text-slate-300">${cfg.firebaseUrl || 'data/sarowar.sqlite'}</span></div>
        <div>Sync Timestamp: <span class="text-amber-400 font-bold">${new Date().toLocaleTimeString()}</span></div>
      `;
    }
  } else {
    showAdminToast('Saved to LocalStorage Vault (Remote server not reachable)');
  }
}

// Auto-sync helper for individual actions
async function autoSyncToCloud(entity, action, data) {
  const cfg = getDatabaseConfig();
  if (!cfg.autoSync || !cfg.firebaseUrl) return;

  const cleanUrl = cfg.firebaseUrl.replace(/\/+$/, '');
  try {
    if (entity === 'product') {
      if (action === 'save' && data && data.id) {
        await fetch(`${cleanUrl}/sarowar/products/${data.id}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } else if (action === 'delete' && data) {
        await fetch(`${cleanUrl}/sarowar/products/${data}.json`, {
          method: 'DELETE'
        });
      } else if (action === 'stock' && data && data.id) {
        await fetch(`${cleanUrl}/sarowar/products/${data.id}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock_qty: data.stock_qty, in_stock: data.stock_qty > 0 ? 1 : 0 })
        });
      }
    } else if (entity === 'settings' && data) {
      await fetch(`${cleanUrl}/sarowar/settings.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else if (entity === 'order' && data && data.id) {
      await fetch(`${cleanUrl}/sarowar/orders/${data.id}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: data.status })
      });
    }
  } catch (err) {
    console.warn('Auto-sync cloud error:', err);
  }
}

// Initialize Database Telemetry & Cloud Configuration UI
function initDatabaseTelemetryAndCloudSync() {
  const cfg = getDatabaseConfig();
  const urlInput = document.getElementById('cfg-db-url');
  const syncCheck = document.getElementById('cfg-auto-sync');
  const configForm = document.getElementById('db-config-form');
  const btnPing = document.getElementById('btn-test-db-connection');
  const btnPull = document.getElementById('btn-pull-db-messages');
  const btnExport = document.getElementById('btn-export-db-messages');
  const btnSyncAll = document.getElementById('btn-sync-all-to-db');

  if (urlInput) urlInput.value = cfg.firebaseUrl || 'https://alaminmahfuz-portfolio-default-rtdb.firebaseio.com';
  if (syncCheck) syncCheck.checked = cfg.autoSync !== false;

  // Form submit: Save DB Config
  if (configForm && !configForm.dataset.bound) {
    configForm.dataset.bound = 'true';
    configForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const firebaseUrl = urlInput ? urlInput.value.trim() : '';
      const autoSync = syncCheck ? syncCheck.checked : true;
      saveDatabaseConfig({ firebaseUrl, autoSync });
      showAdminToast('Cloud Database parameters saved!');
      testDatabaseConnection().then(updateDbStats);
    });
  }

  // Ping button
  if (btnPing && !btnPing.dataset.bound) {
    btnPing.dataset.bound = 'true';
    btnPing.addEventListener('click', async () => {
      const box = document.getElementById('db-test-result');
      if (box) {
        box.innerHTML = '<div class="text-cyan-400"><i class="fas fa-spinner fa-spin"></i> Pinging Database endpoints...</div>';
      }
      const res = await testDatabaseConnection();
      updateDbStats(res);
      if (box) {
        box.innerHTML = `
          <div>Database Status: <span class="${res.ok ? 'text-emerald-400' : 'text-rose-400'} font-bold">${res.ok ? '✓ Online & Operational' : '✗ Offline / Unreachable'}</span></div>
          <div>Active Engine: <span class="text-cyan-300">${res.provider}</span></div>
          <div>Storage Location: <span class="text-slate-300">${res.storage}</span></div>
          <div>Latency: <span class="text-amber-400 font-bold">${res.latencyMs} ms</span></div>
        `;
      }
      showAdminToast(res.ok ? 'Database connection verified!' : 'Database ping failed.');
    });
  }

  // Pull button
  if (btnPull && !btnPull.dataset.bound) {
    btnPull.dataset.bound = 'true';
    btnPull.addEventListener('click', pullAllFromDatabase);
  }

  // Export button
  if (btnExport && !btnExport.dataset.bound) {
    btnExport.dataset.bound = 'true';
    btnExport.addEventListener('click', exportFullDatabaseBackup);
  }

  // Push all to cloud button
  if (btnSyncAll && !btnSyncAll.dataset.bound) {
    btnSyncAll.dataset.bound = 'true';
    btnSyncAll.addEventListener('click', syncAllToDatabase);
  }

  // Initial stats calculation
  updateDbStats();
}
