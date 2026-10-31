// Sarowar Electric & Hardware - Full-Featured Client App

// Universal asset URL resolver for GitHub Pages & Localhost
function fixAssetUrl(url) {
  if (!url || typeof url !== 'string') return 'images/fb/logo.jpg';
  url = url.trim();
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const clean = url.replace(/^\/+/, '');
  return clean || 'images/fb/logo.jpg';
}

const STATE = {
  lang: localStorage.getItem('seh_lang') || 'bn', // default to Bengali for Natore local audience
  products: [],
  categories: [],
  cart: JSON.parse(localStorage.getItem('seh_cart') || '[]'),
  currentCategory: 'all',
  currentBrand: 'all',
  searchQuery: '',
  currentSort: 'featured',
  adminToken: sessionStorage.getItem('seh_admin_token') || null,
  storeSettings: {
    phone_primary: '01780-904878',
    phone_secondary: '01714-246866',
    whatsapp: '8801780904878',
    email: 'sarowarelectrics@gmail.com',
    address_bn: 'মিশন হাসপাতালের পূর্ব পার্শ্বে, ঢাকা রোড, বড় হরিশপুর, নাটোর।',
    address_en: 'East of Mission Hospital, Dhaka Road, Boro Horishpur, Natore - 6400, Bangladesh'
  }
};

// UI Translations
const I18N = {
  bn: {
    store_title: 'সারোয়ার ইলেকট্রিক এন্ড হার্ডওয়্যার',
    store_subtitle: 'খুচরা ও পাইকারি বিক্রেতা | *আমরা হামকো অথোরাইজড ডিলার ও আর আর কেবল পার্টনার',
    address_short: 'বড় হরিশপুর (মিশন হাসপাতাল সংলগ্ন), ঢাকা রোড, নাটোর',
    nav_home: 'হোম',
    nav_products: 'পণ্যসমূহ',
    nav_hamko: 'হামকো আইপিএস ও ব্যাটারি',
    nav_estimator: 'ওয়্যারিং ক্যালকুলেটর',
    nav_wholesale: 'হোলসেল / ঠিকাদার কোটেশন',
    nav_services: 'ইলেকট্রিশিয়ান সার্ভিস',
    nav_about: 'দোকান পরিচিতি',
    nav_reviews: 'গ্রাহক রিভিউ',
    nav_track: 'অর্ডার ট্র্যাকিং',
    nav_admin: 'এডমিন পোর্টাল',
    search_placeholder: 'পণ্য খুঁজুন (যেমন: কেবল, ব্যাটারি, সুইচ, আইপিএস)...',
    btn_call: 'সরাসরি কল করুন',
    btn_whatsapp: 'হোয়াটসঅ্যাপে অর্ডার',
    btn_add_cart: 'কার্টে যোগ করুন',
    btn_buy_now: 'সরাসরি অর্ডার',
    btn_view_details: 'বিস্তারিত দেখুন',
    cart_title: 'আপনার শপিং কার্ট',
    cart_empty: 'আপনার কার্ট বর্তমানে খালি আছে',
    cart_checkout: 'অর্ডার সম্পন্ন করুন',
    cart_subtotal: 'উপমোট',
    cart_delivery: 'ডেলিভারি চার্জ',
    cart_total: 'সর্বমোট',
    tk: '৳',
    in_stock: 'স্টকে আছে',
    out_of_stock: 'স্টক শেষ',
    all_categories: 'সকল ক্যাটাগরি',
    wholesale_eligible: 'হোলসেল রেট প্রযোজ্য',
    official_dealer: 'অথোরাইজড ডিলার'
  },
  en: {
    store_title: 'Sarowar Electric & Hardware',
    store_subtitle: 'Retail & Wholesale Supplier | Authorized Hamko Dealer & RR Kabel Partner',
    address_short: 'Near Mission Hospital, Dhaka Road, Boro Horishpur, Natore',
    nav_home: 'Home',
    nav_products: 'Products',
    nav_hamko: 'Hamko IPS & Battery',
    nav_estimator: 'Wiring Estimator',
    nav_wholesale: 'Wholesale / Quotes',
    nav_services: 'Electrician Service',
    nav_about: 'About Store',
    nav_reviews: 'Reviews',
    nav_track: 'Track Order',
    nav_admin: 'Admin Portal',
    search_placeholder: 'Search products (e.g. cable, battery, switch, IPS)...',
    btn_call: 'Call Directly',
    btn_whatsapp: 'Order on WhatsApp',
    btn_add_cart: 'Add to Cart',
    btn_buy_now: 'Order Now',
    btn_view_details: 'View Specs',
    cart_title: 'Your Shopping Cart',
    cart_empty: 'Your cart is currently empty',
    cart_checkout: 'Proceed to Checkout',
    cart_subtotal: 'Subtotal',
    cart_delivery: 'Delivery Charge',
    cart_total: 'Total Amount',
    tk: 'BDT ৳',
    in_stock: 'In Stock',
    out_of_stock: 'Out of Stock',
    all_categories: 'All Categories',
    wholesale_eligible: 'Wholesale Available',
    official_dealer: 'Authorized Dealer'
  }
};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  renderLanguage();
  initLanguageSwitcher();
  await loadStoreSettings();
  await loadCategories();
  await loadProducts();
  await loadReviews();
  initCart();
  initWiringCalculator();
  initForms();
  initAdminDashboard();
  setupEventListeners();
});

// Switch Language
function toggleLanguage() {
  STATE.lang = STATE.lang === 'bn' ? 'en' : 'bn';
  localStorage.setItem('seh_lang', STATE.lang);
  renderLanguage();
  renderCategories();
  STATE.products = (STATE.products || []).map(p => {
    p.image_url = fixAssetUrl(p.image_url);
    return p;
  });

  renderProducts();
}

function renderLanguage() {
  const dict = I18N[STATE.lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });
  const langToggleBtn = document.getElementById('lang-toggle-text');
  if (langToggleBtn) {
    langToggleBtn.textContent = STATE.lang === 'bn' ? 'English' : 'বাংলা';
  }
}

function initLanguageSwitcher() {
  const btn = document.getElementById('btn-lang-toggle');
  if (btn) btn.addEventListener('click', toggleLanguage);
}

function getApiBase() {
  const custom = localStorage.getItem('seh_backend_url');
  if (custom && custom.trim()) return custom.trim().replace(/\/$/, '');
  return '';
}

function apiFetch(url, options = {}) {
  const base = getApiBase();
  const fullUrl = (url.startsWith('http://') || url.startsWith('https://')) ? url : (base + url);
  return fetch(fullUrl, options);
}

// Load Store Settings
async function loadStoreSettings() {
  try {
    const res = await apiFetch('/api/settings');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        STATE.storeSettings = { ...STATE.storeSettings, ...json.data };
        return;
      }
    }
  } catch (e) {
    // Network or static hosting fallback
  }

  if (typeof DEFAULT_SETTINGS !== 'undefined') {
    const local = JSON.parse(localStorage.getItem('sarowar_site_settings') || '{}');
    STATE.storeSettings = { ...STATE.storeSettings, ...DEFAULT_SETTINGS, ...local };
  }
}

// Load Categories
async function loadCategories() {
  try {
    const res = await apiFetch('/api/categories');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        STATE.categories = json.data;
        renderCategories();
        return;
      }
    }
  } catch (e) {
    // Fallback to static seed
  }

  if (typeof DEFAULT_CATEGORIES !== 'undefined') {
    STATE.categories = DEFAULT_CATEGORIES;
    renderCategories();
  }
}

function renderCategories() {
  const container = document.getElementById('categories-container');
  if (!container) return;

  const isBn = STATE.lang === 'bn';
  let html = `
    <button onclick="filterByCategory('all')" class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition text-sm ${STATE.currentCategory === 'all' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
      <i class="fas fa-th-large"></i>
      <span>${isBn ? 'সকল মালামাল' : 'All Products'}</span>
    </button>
  `;

  STATE.categories.forEach(cat => {
    const active = STATE.currentCategory === cat.id;
    html += `
      <button onclick="filterByCategory('${cat.id}')" class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition text-sm whitespace-nowrap ${active ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
        <i class="fas ${cat.icon || 'fa-bolt'}"></i>
        <span>${isBn ? cat.name_bn : cat.name_en}</span>
        <span class="text-xs px-2 py-0.5 rounded-full ${active ? 'bg-orange-700 text-white' : 'bg-slate-100 text-slate-600'}">${cat.product_count || 0}</span>
      </button>
    `;
  });

  container.innerHTML = html;
}

// Load Products
async function loadProducts() {
  const container = document.getElementById('products-grid');
  if (container) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-500">
        <i class="fas fa-circle-notch fa-spin text-3xl text-orange-500 mb-3"></i>
        <p>${STATE.lang === 'bn' ? 'পণ্য তালিকা লোড হচ্ছে...' : 'Loading products inventory...'}</p>
      </div>
    `;
  }

  let serverLoaded = false;
  try {
    let url = `/api/products?sort=${STATE.currentSort}`;
    if (STATE.currentCategory && STATE.currentCategory !== 'all') url += `&category=${STATE.currentCategory}`;
    if (STATE.currentBrand && STATE.currentBrand !== 'all') url += `&brand=${encodeURIComponent(STATE.currentBrand)}`;
    if (STATE.searchQuery) url += `&search=${encodeURIComponent(STATE.searchQuery)}`;

    const res = await apiFetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        STATE.products = json.data;
        serverLoaded = true;
      }
    }
  } catch (e) {
    // Network or static hosting fallback
  }

  if (!serverLoaded) {
    let cloudLoaded = false;
    try {
      const dbCfg = JSON.parse(localStorage.getItem('sarowar_db_config_v1') || '{}');
      const fbUrl = dbCfg.firebaseUrl || 'https://alaminmahfuz-portfolio-default-rtdb.firebaseio.com';
      if (fbUrl) {
        const cleanUrl = fbUrl.replace(/\/+$/, '');
        const fbRes = await fetch(`${cleanUrl}/sarowar/products.json`, { cache: 'no-store' });
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          if (fbData) {
            let items = Array.isArray(fbData) ? fbData.filter(Boolean) : Object.values(fbData);
            if (items.length > 0) {
              if (STATE.currentCategory && STATE.currentCategory !== 'all') {
                items = items.filter(p => p.category === STATE.currentCategory);
              }
              if (STATE.currentBrand && STATE.currentBrand !== 'all') {
                items = items.filter(p => p.brand && p.brand.toLowerCase() === STATE.currentBrand.toLowerCase());
              }
              if (STATE.searchQuery) {
                const q = STATE.searchQuery.toLowerCase();
                items = items.filter(p => 
                  (p.title_bn && p.title_bn.toLowerCase().includes(q)) || 
                  (p.title_en && p.title_en.toLowerCase().includes(q)) ||
                  (p.brand && p.brand.toLowerCase().includes(q))
                );
              }
              STATE.products = items;
              cloudLoaded = true;
            }
          }
        }
      }
    } catch (e) {}

    if (!cloudLoaded && typeof DEFAULT_PRODUCTS !== 'undefined') {
      const local = JSON.parse(localStorage.getItem('sarowar_local_products') || 'null');
      let prods = (local && local.length) ? local : DEFAULT_PRODUCTS;

    if (STATE.currentCategory && STATE.currentCategory !== 'all') {
      prods = prods.filter(p => p.category === STATE.currentCategory);
    }
    if (STATE.currentBrand && STATE.currentBrand !== 'all') {
      prods = prods.filter(p => p.brand.toLowerCase() === STATE.currentBrand.toLowerCase());
    }
    if (STATE.searchQuery) {
      const q = STATE.searchQuery.toLowerCase();
      prods = prods.filter(p => 
        (p.title_bn && p.title_bn.toLowerCase().includes(q)) || 
        (p.title_en && p.title_en.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    if (STATE.currentSort === 'price_low') {
      prods = [...prods].sort((a,b) => a.price - b.price);
    } else if (STATE.currentSort === 'price_high') {
      prods = [...prods].sort((a,b) => b.price - a.price);
    } else if (STATE.currentSort === 'rating') {
      prods = [...prods].sort((a,b) => (b.rating || 0) - (a.rating || 0));
    } else if (STATE.currentSort === 'newest') {
      prods = [...prods].sort((a,b) => (b.id || 0) - (a.id || 0));
    } else {
      prods = [...prods].sort((a,b) => (b.featured || 0) - (a.featured || 0));
    }

    STATE.products = prods;
    }
  }

  STATE.products = (STATE.products || []).map(p => {
    p.image_url = fixAssetUrl(p.image_url);
    return p;
  });

  renderProducts();
}

function renderProducts() {
  const container = document.getElementById('products-grid');
  if (!container) return;

  const isBn = STATE.lang === 'bn';

  if (!STATE.products.length) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
        <i class="fas fa-box-open text-4xl text-slate-300 mb-3"></i>
        <h4 class="text-lg font-bold text-slate-700 mb-1">${isBn ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}</h4>
        <p class="text-sm text-slate-500 mb-4">${isBn ? 'ভিন্ন কোনো নাম লিখে সার্চ করুন অথবা সরাসরি কল করে স্টক জানতে পারেন।' : 'Try adjusting your search or contact the store directly.'}</p>
        <button onclick="resetFilters()" class="px-5 py-2 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700">
          ${isBn ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = STATE.products.map(p => {
    const title = isBn ? p.title_bn : p.title_en;
    const desc = isBn ? p.description_bn : p.description_en;
    const discount = p.original_price ? Math.round(((p.original_price - p.price) / p.original_price) * 100) : 0;
    const imgUrl = typeof fixAssetUrl === 'function' ? fixAssetUrl(p.image_url) : (p.image_url || 'images/fb/logo.jpg').replace(/^\//, '');
    
    return `
      <div class="product-card bg-white rounded-2xl border border-slate-200/90 overflow-hidden flex flex-col justify-between group shadow-sm hover:border-orange-300">
        <div class="relative overflow-hidden bg-slate-50 aspect-video flex items-center justify-center p-3">
          <img src="${imgUrl}" alt="${title}" class="max-h-full max-w-full object-contain transition duration-500 group-hover:scale-105" onerror="this.src='images/fb/logo.jpg'">
          
          <!-- Badges -->
          <div class="absolute top-3 left-3 flex flex-col gap-1 items-start">
            ${p.badge ? `<span class="px-2.5 py-1 text-xs font-bold rounded-lg ${p.badge.includes('Hamko') ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'} shadow-sm">${p.badge}</span>` : ''}
            ${discount > 0 ? `<span class="px-2 py-0.5 text-xs font-extrabold rounded-md bg-emerald-600 text-white">-${discount}% OFF</span>` : ''}
          </div>

          <div class="absolute top-3 right-3">
            <span class="px-2 py-0.5 text-[11px] font-bold rounded-md bg-slate-800/80 text-white backdrop-blur">
              ${p.brand}
            </span>
          </div>

          <!-- Quick view action -->
          <button onclick="openProductQuickView(${p.id})" class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-medium text-xs gap-1.5 backdrop-blur-[2px]">
            <i class="fas fa-eye text-sm"></i>
            <span>${isBn ? 'স্পেসিফিকেশন দেখুন' : 'Quick View'}</span>
          </button>
        </div>

        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span class="flex items-center gap-1 text-amber-500 font-semibold">
                <i class="fas fa-star text-[11px]"></i> ${p.rating || '4.9'}
                <span class="text-slate-400 font-normal">(${p.reviews_count || 10})</span>
              </span>
              <span class="text-[11px] font-medium ${p.in_stock ? 'text-emerald-600' : 'text-red-500'}">
                <i class="fas ${p.in_stock ? 'fa-check-circle' : 'fa-times-circle'} text-[10px]"></i>
                ${p.in_stock ? (isBn ? 'স্টকে আছে' : 'In Stock') : (isBn ? 'স্টক শেষ' : 'Out of stock')}
              </span>
            </div>

            <h3 class="font-bold text-slate-900 text-base line-clamp-2 mb-1.5 leading-snug group-hover:text-orange-600 transition" title="${title}">
              ${title}
            </h3>

            <p class="text-xs text-slate-500 line-clamp-2 mb-3">
              ${desc}
            </p>
          </div>

          <div class="pt-3 border-t border-slate-100">
            <div class="flex items-baseline justify-between mb-3">
              <div>
                <span class="text-xl font-extrabold text-slate-900">৳${Number(p.price).toLocaleString()}</span>
                <span class="text-xs text-slate-400 font-medium">/${p.unit}</span>
                ${p.original_price ? `<span class="text-xs text-slate-400 line-through ml-1.5">৳${Number(p.original_price).toLocaleString()}</span>` : ''}
              </div>
              ${p.wholesale_price ? `
                <div class="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md text-right" title="হোলসেল মূল্য">
                  ${isBn ? 'হোলসেল:' : 'Wholesale:'} ৳${Number(p.wholesale_price).toLocaleString()}
                </div>
              ` : ''}
            </div>

            <div class="grid grid-cols-2 gap-2 mb-2">
              <button onclick="addToCart(${p.id})" class="w-full py-2 px-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 shadow-sm shadow-orange-600/20" title="${isBn ? 'কার্টে যোগ করুন' : 'Add to Cart'}">
                <i class="fas fa-cart-plus"></i>
                <span>${isBn ? 'কার্ট' : 'Add Cart'}</span>
              </button>

              <button onclick="buyNow(${p.id})" class="w-full py-2 px-2 bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 shadow-sm" title="${isBn ? 'সরাসরি অর্ডার করুন' : 'Buy Now'}">
                <i class="fas fa-bolt text-amber-400"></i>
                <span>${isBn ? 'কিনুন' : 'Buy Now'}</span>
              </button>
            </div>

            <button onclick="orderViaWhatsApp(${p.id})" class="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20">
              <i class="fab fa-whatsapp text-sm"></i>
              <span>${isBn ? 'হোয়াটসঅ্যাপে অর্ডার' : 'Order on WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterByCategory(catId) {
  STATE.currentCategory = catId;
  renderCategories();
  loadProducts();
}

function filterByBrand(brand) {
  STATE.currentBrand = brand;
  loadProducts();
}

function resetFilters() {
  STATE.currentCategory = 'all';
  STATE.currentBrand = 'all';
  STATE.searchQuery = '';
  STATE.currentSort = 'featured';
  const searchInput = document.getElementById('main-search-input');
  if (searchInput) searchInput.value = '';
  renderCategories();
  loadProducts();
}

// Quick View Modal
function openProductQuickView(id) {
  const product = STATE.products.find(p => p.id === id);
  if (!product) return;

  const isBn = STATE.lang === 'bn';
  const modal = document.getElementById('product-modal');
  const title = isBn ? product.title_bn : product.title_en;
  const desc = isBn ? product.description_bn : product.description_en;

  let specsHtml = '';
  if (product.specs && Object.keys(product.specs).length) {
    specsHtml = `
      <div class="my-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
        <h5 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <i class="fas fa-cogs text-orange-600"></i> ${isBn ? 'কারিগরী বৈশিষ্ট্য (Specifications)' : 'Technical Specifications'}
        </h5>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          ${Object.entries(product.specs).map(([k, v]) => `
            <div class="flex justify-between py-1 border-b border-slate-200/60">
              <span class="text-slate-500 font-medium">${k}:</span>
              <span class="text-slate-900 font-semibold text-right">${v}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  document.getElementById('product-modal-content').innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <div class="flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-4 border border-slate-200">
        <img src="${(typeof fixAssetUrl === 'function' ? fixAssetUrl(product.image_url) : (product.image_url || 'images/fb/logo.jpg').replace(/^\//, ''))}" alt="${title}" class="max-h-72 object-contain rounded-lg" onerror="this.src='images/fb/logo.jpg'">
        <div class="mt-4 flex gap-2 w-full justify-center">
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            Brand: ${product.brand}
          </span>
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
            ${isBn ? 'ইউনিট' : 'Unit'}: ${product.unit}
          </span>
        </div>
      </div>

      <div class="flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 mb-2">
            ${product.badge ? `<span class="px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-600 text-white">${product.badge}</span>` : ''}
            <span class="text-xs font-semibold text-emerald-600"><i class="fas fa-shield-alt"></i> ${isBn ? '১০০% জেনুইন গ্যারান্টি' : '100% Genuine Guaranteed'}</span>
          </div>

          <h3 class="text-xl font-extrabold text-slate-900 leading-tight mb-2">${title}</h3>
          
          <div class="flex items-baseline gap-3 mb-3">
            <span class="text-2xl font-black text-orange-600">৳${Number(product.price).toLocaleString()}</span>
            ${product.original_price ? `<span class="text-sm text-slate-400 line-through">৳${Number(product.original_price).toLocaleString()}</span>` : ''}
            <span class="text-xs text-slate-500 font-medium">/${product.unit}</span>
          </div>

          <p class="text-xs text-slate-600 leading-relaxed mb-3">${desc}</p>

          ${specsHtml}

          ${product.wholesale_price ? `
            <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 mb-4">
              <strong>${isBn ? 'হোলসেল রেট:' : 'Wholesale Rate:'}</strong> ৳${Number(product.wholesale_price).toLocaleString()} / ${product.unit} (${isBn ? `নূন্যতম ${product.wholesale_min_qty} টি অর্ডারে প্রযোজ্য` : `Min order ${product.wholesale_min_qty} units`})
            </div>
          ` : ''}
        </div>

        <div class="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-200">
          <button onclick="addToCart(${product.id}); closeProductModal();" class="flex-1 py-3 px-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20">
            <i class="fas fa-cart-plus"></i> ${isBn ? 'কার্টে যোগ' : 'Add to Cart'}
          </button>
          <button onclick="buyNow(${product.id}); closeProductModal();" class="flex-1 py-3 px-3 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md">
            <i class="fas fa-bolt text-amber-400"></i> ${isBn ? 'সরাসরি কিনুন' : 'Buy Now'}
          </button>
          <button onclick="orderViaWhatsApp(${product.id}); closeProductModal();" class="flex-1 py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20">
            <i class="fab fa-whatsapp text-sm"></i> ${isBn ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.add('hidden');
}

// ==========================================
// CART & CHECKOUT MANAGEMENT
// ==========================================
function initCart() {
  updateCartBadge();
  renderCartDrawer();
}

function addToCart(productId, openDrawer = false) {
  const product = STATE.products.find(p => p.id === productId);
  if (!product) return;

  const existing = STATE.cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    STATE.cart.push({
      id: product.id,
      title_en: product.title_en,
      title_bn: product.title_bn,
      brand: product.brand,
      price: product.price,
      unit: product.unit,
      image_url: product.image_url,
      quantity: 1
    });
  }

  saveCart();
  updateCartBadge();
  renderCartDrawer();
  if (openDrawer) {
    toggleCartDrawer(true);
    const details = document.getElementById('checkout-details');
    if (details) details.open = true;
  } else {
    showToast(STATE.lang === 'bn' ? 'পণ্যটি কার্টে যোগ করা হয়েছে!' : 'Product added to cart!');
  }
}

function buyNow(productId) {
  addToCart(productId, true);
}

function updateCartQuantity(productId, delta) {
  const item = STATE.cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    STATE.cart = STATE.cart.filter(i => i.id !== productId);
  }

  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function removeFromCart(productId) {
  STATE.cart = STATE.cart.filter(i => i.id !== productId);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function saveCart() {
  localStorage.setItem('seh_cart', JSON.stringify(STATE.cart));
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  const count = STATE.cart.reduce((sum, item) => sum + item.quantity, 0);
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
  }
}

function toggleCartDrawer(open = null) {
  const drawer = document.getElementById('cart-drawer');
  if (!drawer) return;
  if (open === true) drawer.classList.remove('translate-x-full');
  else if (open === false) drawer.classList.add('translate-x-full');
  else drawer.classList.toggle('translate-x-full');
}

function renderCartDrawer() {
  const container = document.getElementById('cart-items-container');
  const subtotalEl = document.getElementById('cart-subtotal-val');
  const totalEl = document.getElementById('cart-total-val');
  const deliveryEl = document.getElementById('cart-delivery-val');
  const checkoutBtn = document.getElementById('btn-checkout-proceed');

  if (!container) return;

  const isBn = STATE.lang === 'bn';

  if (!STATE.cart.length) {
    container.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
        <i class="fas fa-shopping-bag text-5xl mb-3 text-slate-200"></i>
        <p class="font-bold text-slate-600 mb-1">${isBn ? 'আপনার কার্ট বর্তমানে খালি' : 'Your cart is empty'}</p>
        <p class="text-xs text-slate-400 mb-4">${isBn ? 'ক্যাটালগ থেকে প্রয়োজনীয় তার, ব্যাটারি বা সুইচ যোগ করুন।' : 'Add electrical supplies to start your order.'}</p>
        <button onclick="toggleCartDrawer(false)" class="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold">
          ${isBn ? 'কেনাকাটা শুরু করুন' : 'Start Shopping'}
        </button>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = '৳0';
    if (totalEl) totalEl.textContent = '৳0';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  let subtotal = 0;
  container.innerHTML = STATE.cart.map(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    const title = isBn ? item.title_bn : item.title_en;

    return `
      <div class="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 mb-2 shadow-sm">
        <img src="${(typeof fixAssetUrl === 'function' ? fixAssetUrl(item.image_url) : (item.image_url || 'images/fb/logo.jpg').replace(/^\//, ''))}" alt="${title}" class="w-16 h-16 object-contain bg-slate-50 rounded-lg p-1 border border-slate-100 flex-shrink-0" onerror="this.src='images/fb/logo.jpg'">
        <div class="flex-1 min-w-0">
          <h4 class="font-bold text-slate-900 text-xs truncate leading-snug" title="${title}">${title}</h4>
          <span class="text-[11px] text-slate-400 font-medium">৳${item.price.toLocaleString()} / ${item.unit}</span>
          <div class="flex items-center justify-between mt-1.5">
            <div class="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
              <button onclick="updateCartQuantity(${item.id}, -1)" class="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 text-xs">-</button>
              <span class="w-8 text-center text-xs font-bold text-slate-800">${item.quantity}</span>
              <button onclick="updateCartQuantity(${item.id}, 1)" class="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 text-xs">+</button>
            </div>
            <span class="font-extrabold text-xs text-orange-600">৳${itemTotal.toLocaleString()}</span>
          </div>
        </div>
        <button onclick="removeFromCart(${item.id})" class="text-slate-300 hover:text-red-500 p-1 text-xs transition">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
  }).join('');

  // Delivery calculation based on upazila
  const upazilaSelect = document.getElementById('order-upazila');
  let deliveryFee = 50; // default Natore Sadar
  if (upazilaSelect && upazilaSelect.value === 'store_pickup') deliveryFee = 0;
  else if (upazilaSelect && upazilaSelect.value !== 'Natore Sadar') deliveryFee = 100;

  if (deliveryEl) deliveryEl.textContent = `৳${deliveryFee}`;
  if (subtotalEl) subtotalEl.textContent = `৳${subtotal.toLocaleString()}`;
  if (totalEl) totalEl.textContent = `৳${(subtotal + deliveryFee).toLocaleString()}`;
  if (checkoutBtn) checkoutBtn.disabled = false;
}

// Order via WhatsApp (Single Product or Full Cart)
function orderViaWhatsApp(productId = null) {
  const isBn = STATE.lang === 'bn';
  const phone = STATE.storeSettings.whatsapp || '8801780904878';

  let message = '';
  if (productId) {
    const p = STATE.products.find(item => item.id === productId);
    if (!p) return;
    message = `নমস্কার / আসসালামু আলাইকুম। আমি সারোয়ার ইলেকট্রিক ওয়েবসাইট থেকে এই পণ্যটি অর্ডার করতে চাই:\n\n` +
      `📦 পণ্য: ${p.title_bn} (${p.title_en})\n` +
      `🏷️ ব্র‍্যান্ড: ${p.brand}\n` +
      `💰 মূল্য: ৳${p.price} / ${p.unit}\n\n` +
      `আমার ঠিকানা ও বিস্তারিত জানাতে চাই। অনুগ্রহ করে কনফার্ম করবেন।`;
  } else {
    if (!STATE.cart.length) {
      alert(isBn ? 'আপনার কার্ট খালি আছে' : 'Your cart is empty');
      return;
    }
    let subtotal = 0;
    let itemsText = STATE.cart.map((item, idx) => {
      subtotal += item.price * item.quantity;
      return `${idx + 1}. ${item.title_bn} - ${item.quantity} ${item.unit} x ৳${item.price} = ৳${item.price * item.quantity}`;
    }).join('\n');

    message = `আসসালামু আলাইকুম / নমস্কার। আমি সারোয়ার ইলেকট্রিক ওয়েবসাইট থেকে এই কার্ট লিস্টটি অর্ডার করতে চাই:\n\n` +
      `📋 পণ্যের তালিকা:\n${itemsText}\n\n` +
      `💵 সর্বমোট: ৳${subtotal.toLocaleString()}\n` +
      `বড় হরিশপুর শোরুম বা হোম ডেলিভারির জন্য যোগাযোগ করছি।`;
  }

  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
}

// Submit Checkout Form
async function submitCheckoutOrder(e) {
  e.preventDefault();
  const isBn = STATE.lang === 'bn';

  if (!STATE.cart.length) {
    alert(isBn ? 'আপনার কার্ট খালি আছে' : 'Your cart is empty');
    return;
  }

  const name = document.getElementById('order-name').value.trim();
  const phone = document.getElementById('order-phone').value.trim();
  const address = document.getElementById('order-address').value.trim();
  const upazila = document.getElementById('order-upazila').value;
  const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'cod';
  const trxId = document.getElementById('order-trxid')?.value.trim() || '';
  const notes = document.getElementById('order-notes')?.value.trim() || '';

  if (!name || !phone || !address) {
    alert(isBn ? 'দয়া করে নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা প্রদান করুন।' : 'Please enter your name, phone and complete address.');
    return;
  }

  const btn = document.getElementById('btn-submit-order');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${isBn ? 'অর্ডার প্রসেস হচ্ছে...' : 'Processing Order...'}`;

  const deliveryFee = upazila === 'store_pickup' ? 0 : (upazila === 'Natore Sadar' ? 50 : 100);

  try {
    const res = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: name,
        customer_phone: phone,
        delivery_address: address,
        upazila,
        payment_method: paymentMethod,
        transaction_id: trxId,
        items: STATE.cart,
        delivery_fee: deliveryFee,
        notes
      })
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.order) {
        // Sync to Firebase Cloud if available
        try {
          const dbCfg = JSON.parse(localStorage.getItem('sarowar_db_config_v1') || '{}');
          const fbUrl = dbCfg.firebaseUrl || 'https://alaminmahfuz-portfolio-default-rtdb.firebaseio.com';
          if (fbUrl) {
            const cleanUrl = fbUrl.replace(/\/+$/, '');
            fetch(`${cleanUrl}/sarowar/orders/${json.order.id}.json`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(json.order)
            }).catch(() => {});
          }
        } catch (e) {}

        STATE.cart = [];
        saveCart();
        updateCartBadge();
        renderCartDrawer();
        toggleCartDrawer(false);
        showOrderSuccessModal(json.order);
        return;
      }
    }
    throw new Error('Fallback to local order save');
  } catch (err) {
    // Client-side fallback for static GitHub Pages hosting
    const totalAmount = STATE.cart.reduce((s, i) => s + (i.price * i.qty), 0) + deliveryFee;
    const orderNumber = 'SEH-' + Date.now().toString().slice(-6);
    const localOrder = {
      id: Date.now(),
      order_number: orderNumber,
      customer_name: name,
      customer_phone: phone,
      delivery_address: address,
      upazila,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'cod' ? 'pending' : 'paid_verification',
      transaction_id: trxId,
      subtotal: totalAmount - deliveryFee,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      status: 'Pending',
      items_json: JSON.stringify(STATE.cart),
      notes,
      created_at: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem('sarowar_orders') || '[]');
    existing.unshift(localOrder);
    localStorage.setItem('sarowar_orders', JSON.stringify(existing));

    // Write directly to Firebase Cloud RTDB
    try {
      const dbCfg = JSON.parse(localStorage.getItem('sarowar_db_config_v1') || '{}');
      const fbUrl = dbCfg.firebaseUrl || 'https://alaminmahfuz-portfolio-default-rtdb.firebaseio.com';
      if (fbUrl) {
        const cleanUrl = fbUrl.replace(/\/+$/, '');
        fetch(`${cleanUrl}/sarowar/orders/${localOrder.id}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(localOrder)
        }).catch(() => {});
      }
    } catch (e) {}

    STATE.cart = [];
    saveCart();
    updateCartBadge();
    renderCartDrawer();
    toggleCartDrawer(false);
    showOrderSuccessModal(localOrder);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

function showOrderSuccessModal(order) {
  const isBn = STATE.lang === 'bn';
  const modal = document.getElementById('order-success-modal');
  if (!modal) return;

  document.getElementById('success-order-number').textContent = order.order_number;
  document.getElementById('success-order-amount').textContent = `৳${Number(order.total_amount).toLocaleString()}`;
  document.getElementById('success-order-phone').textContent = order.customer_phone;

  // WhatsApp share link
  const waBtn = document.getElementById('success-whatsapp-btn');
  if (waBtn) {
    const msg = encodeURIComponent(`আসসালামু আলাইকুম। আমি সারোয়ার ইলেকট্রিক্সে নতুন অর্ডার দিয়েছি (অর্ডার নং: ${order.order_number})। মোট: ৳${order.total_amount}। কনফার্ম করার অনুরোধ।`);
    waBtn.href = `https://wa.me/${STATE.storeSettings.whatsapp}?text=${msg}`;
  }

  modal.classList.remove('hidden');
}

// Track Order
async function trackOrder() {
  const input = document.getElementById('track-order-input');
  const resultDiv = document.getElementById('track-order-result');
  const isBn = STATE.lang === 'bn';

  if (!input || !input.value.trim()) {
    alert(isBn ? 'অর্ডার নম্বর বা ফোন নম্বর লিখুন' : 'Please enter Order Number or Phone');
    return;
  }

  const query = input.value.trim();
  resultDiv.innerHTML = `<div class="py-4 text-center text-slate-500"><i class="fas fa-spinner fa-spin text-xl text-orange-500"></i><p class="text-xs mt-2">${isBn ? 'অর্ডার অনুসন্ধান করা হচ্ছে...' : 'Searching order...'}</p></div>`;

  let foundOrder = null;
  try {
    const res = await apiFetch(`/api/orders/track/${encodeURIComponent(query)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        foundOrder = json.data;
      }
    }
  } catch (e) {
    // Local storage fallback
  }

  if (!foundOrder) {
    const orders = JSON.parse(localStorage.getItem('sarowar_orders') || '[]');
    const match = orders.find(o => 
      (o.order_number && o.order_number.toLowerCase() === query.toLowerCase()) || 
      (o.customer_phone && o.customer_phone.includes(query))
    );
    if (match) {
      foundOrder = {
        ...match,
        items: typeof match.items_json === 'string' ? JSON.parse(match.items_json || '[]') : (match.items || [])
      };
    }
  }

  if (foundOrder) {
    const order = foundOrder;
    const statusColors = {
      'Pending': 'bg-amber-100 text-amber-800 border-amber-300',
      'Confirmed': 'bg-blue-100 text-blue-800 border-blue-300',
      'Processing': 'bg-purple-100 text-purple-800 border-purple-300',
      'Shipped': 'bg-indigo-100 text-indigo-800 border-indigo-300',
      'Delivered': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'Cancelled': 'bg-red-100 text-red-800 border-red-300'
    };

    resultDiv.innerHTML = `
      <div class="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <span class="text-slate-400 font-medium">${isBn ? 'অর্ডার নম্বর:' : 'Order No:'}</span>
            <strong class="text-slate-900 block text-sm">${order.order_number}</strong>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold border ${statusColors[order.status] || 'bg-slate-100 text-slate-700'}">
            ${order.status}
          </span>
        </div>

        <div class="py-3 grid grid-cols-2 gap-2 text-slate-600 border-b border-slate-200">
          <div>
            <span class="text-slate-400 block">${isBn ? 'গ্রাহক:' : 'Customer:'}</span>
            <strong>${order.customer_name}</strong> (${order.customer_phone})
          </div>
          <div>
            <span class="text-slate-400 block">${isBn ? 'ঠিকানা:' : 'Address:'}</span>
            <span>${order.delivery_address}, ${order.upazila}</span>
          </div>
          <div>
            <span class="text-slate-400 block">${isBn ? 'পেমেন্ট মেথড:' : 'Payment:'}</span>
            <span class="uppercase font-semibold">${order.payment_method}</span> (${order.payment_status})
          </div>
          <div>
            <span class="text-slate-400 block">${isBn ? 'সর্বমোট বিল:' : 'Total Bill:'}</span>
            <strong class="text-orange-600 text-sm">৳${Number(order.total_amount).toLocaleString()}</strong>
          </div>
        </div>

        <div class="pt-3">
          <span class="font-bold text-slate-800 block mb-2">${isBn ? 'অর্ডারকৃত মালামাল:' : 'Ordered Items:'}</span>
          <ul class="space-y-1 text-slate-600">
            ${(order.items || []).map(i => `
              <li class="flex justify-between py-0.5">
                <span>${isBn ? (i.title_bn || i.title_en) : (i.title_en || i.title_bn)} x ${i.quantity || i.qty || 1}</span>
                <span class="font-semibold">৳${((i.price || 0) * (i.quantity || i.qty || 1)).toLocaleString()}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  } else {
    resultDiv.innerHTML = `
      <div class="mt-4 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs text-center font-bold">
        <i class="fas fa-exclamation-triangle mr-1"></i> ${isBn ? 'এই নম্বর দিয়ে কোনো অর্ডার পাওয়া যায়নি। সঠিক অর্ডার নং দিন অথবা দোকানে কল করুন।' : 'No order found with this tracking ID.'}
      </div>
    `;
  }
}

// ==========================================
// INTERACTIVE WIRING & IPS CALCULATOR
// ==========================================
function initWiringCalculator() {
  const calcBtn = document.getElementById('btn-calc-wiring');
  if (calcBtn) calcBtn.addEventListener('click', calculateWiringCost);

  const ipsBtn = document.getElementById('btn-calc-ips');
  if (ipsBtn) ipsBtn.addEventListener('click', calculateIpsCapacity);
}

function calculateWiringCost() {
  const isBn = STATE.lang === 'bn';
  const size = document.getElementById('calc-building-size').value;
  const grade = document.getElementById('calc-wire-grade').value;

  // Approximate materials estimate table
  const presets = {
    '1bhk': { r15: 2, r25: 1, switches: 8, db: 1, mcb: 3, conduit: 20 },
    '2bhk': { r15: 4, r25: 2, switches: 16, db: 1, mcb: 5, conduit: 40 },
    '3bhk': { r15: 6, r25: 4, switches: 24, db: 1, mcb: 8, conduit: 65 },
    'duplex': { r15: 12, r25: 8, switches: 48, db: 2, mcb: 14, conduit: 130 },
    'shop': { r15: 3, r25: 2, switches: 10, db: 1, mcb: 4, conduit: 25 }
  };

  const item = presets[size] || presets['2bhk'];
  const price15 = grade === 'rrkabel' ? 3850 : 3400;
  const price25 = grade === 'rrkabel' ? 5950 : 5200;
  const switchPrice = 180;
  const dbPrice = 1150;
  const mcbPrice = 450;
  const conduitPrice = 85;

  const wireTotal = (item.r15 * price15) + (item.r25 * price25);
  const switchTotal = item.switches * switchPrice;
  const safetyTotal = (item.db * dbPrice) + (item.mcb * mcbPrice);
  const pipeTotal = item.conduit * conduitPrice;
  const total = wireTotal + switchTotal + safetyTotal + pipeTotal;

  const resultContainer = document.getElementById('wiring-calc-result');
  resultContainer.innerHTML = `
    <div class="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl">
      <div class="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <span class="text-xs uppercase tracking-wider text-orange-400 font-bold">${isBn ? 'আনুমানিক মালামাল এস্টিমেট' : 'Estimated Material Bill'}</span>
          <h4 class="text-xl font-extrabold text-white mt-0.5">${grade === 'rrkabel' ? 'RR Kabel Premium Fire-Retardant' : 'Standard Certified Copper'}</h4>
        </div>
        <div class="text-right">
          <span class="text-xs text-slate-400 block">${isBn ? 'মোট সম্ভাব্য বাজেট' : 'Estimated Total'}</span>
          <span class="text-2xl font-black text-orange-500">৳${total.toLocaleString()}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 text-xs">
        <div class="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
          <span class="text-slate-400 block">${isBn ? '১.৫ আরএম তার (লাইটিং/ফ্যান):' : '1.5 RM Wire:'}</span>
          <strong class="text-white">${item.r15} Coil x ৳${price15.toLocaleString()} = ৳${(item.r15 * price15).toLocaleString()}</strong>
        </div>

        <div class="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
          <span class="text-slate-400 block">${isBn ? '২.৫ আরএম তার (পাওয়ার/এসি/পাম্প):' : '2.5 RM Wire:'}</span>
          <strong class="text-white">${item.r25} Coil x ৳${price25.toLocaleString()} = ৳${(item.r25 * price25).toLocaleString()}</strong>
        </div>

        <div class="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
          <span class="text-slate-400 block">${isBn ? 'সুইচ, সকেট ও মডুলার বোর্ড:' : 'Switches & Boards:'}</span>
          <strong class="text-white">${item.switches} Units ≈ ৳${switchTotal.toLocaleString()}</strong>
        </div>

        <div class="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
          <span class="text-slate-400 block">${isBn ? 'ডিবি বক্স ও সার্কিট ব্রেকার:' : 'DB Box & MCB Protection:'}</span>
          <strong class="text-white">৳${safetyTotal.toLocaleString()}</strong>
        </div>
      </div>

      <div class="pt-2 flex flex-col sm:flex-row gap-3">
        <button onclick="requestWholesaleQuoteFromCalc('${size}', '${grade}', ${total})" class="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2">
          <i class="fas fa-file-invoice"></i> ${isBn ? 'এই তালিকার হোলসেল কোটেশন চান' : 'Request Wholesale Quote for this'}
        </button>

        <a href="tel:${STATE.storeSettings.phone_primary}" class="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2">
          <i class="fas fa-phone-alt text-orange-500"></i> ${isBn ? 'পরামর্শের জন্য কল করুন' : 'Call Consultant'}
        </a>
      </div>
    </div>
  `;
}

function calculateIpsCapacity() {
  const isBn = STATE.lang === 'bn';
  const fans = Number(document.getElementById('ips-fans').value) || 0;
  const lights = Number(document.getElementById('ips-lights').value) || 0;
  const tv = Number(document.getElementById('ips-tv').value) || 0;
  const pc = Number(document.getElementById('ips-pc').value) || 0;

  // Approximate wattage calculation: fan=75W, light=18W, tv=80W, pc=150W
  const totalWatts = (fans * 75) + (lights * 18) + (tv * 80) + (pc * 150);
  const vaRequired = Math.round(totalWatts / 0.8);

  let recommendedModel = '';
  let recommendedBattery = '';
  let approxPrice = 0;

  if (vaRequired <= 600) {
    recommendedModel = 'Hamko 800VA DSP Pure Sine Wave IPS Inverter';
    recommendedBattery = 'Hamko HPD 130Ah Deep Cycle Tubular Battery';
    approxPrice = 32000;
  } else if (vaRequired <= 900) {
    recommendedModel = 'Hamko Combo Supreme 1000VA Digital IPS Inverter';
    recommendedBattery = 'Hamko HPD 165Ah Heavy Duty Tubular Battery';
    approxPrice = 38000;
  } else {
    recommendedModel = 'Hamko 1200VA - 1500VA High Capacity IPS Inverter';
    recommendedBattery = 'Hamko HPD 200Ah Long Backup Tubular Battery';
    approxPrice = 46000;
  }

  const resultContainer = document.getElementById('ips-calc-result');
  resultContainer.innerHTML = `
    <div class="bg-blue-950 text-white rounded-2xl p-6 border border-blue-900 shadow-xl">
      <div class="flex items-center justify-between pb-3 border-b border-blue-900">
        <div>
          <span class="text-xs uppercase tracking-wider text-blue-400 font-bold">${isBn ? 'হামকো অথোরাইজড আইপিএস রিকমেন্ডেশন' : 'Authorized Hamko Recommendation'}</span>
          <h4 class="text-xl font-extrabold text-white mt-0.5">${recommendedModel}</h4>
        </div>
        <div class="text-right">
          <span class="text-xs text-blue-300 block">${isBn ? 'মোট লোড' : 'Total Load'}</span>
          <span class="text-lg font-black text-amber-400">${totalWatts} Watts (~${vaRequired} VA)</span>
        </div>
      </div>

      <div class="py-3 text-xs space-y-2">
        <p class="text-blue-200">
          <i class="fas fa-battery-full text-amber-400 mr-1.5"></i>
          <strong>${isBn ? 'প্রস্তাবিত ব্যাটারি:' : 'Recommended Battery:'}</strong> ${recommendedBattery} (৩০ মাসের অফিসিয়াল রিপ্লেসমেন্ট গ্যারান্টি)
        </p>
        <p class="text-blue-200">
          <i class="fas fa-clock text-blue-400 mr-1.5"></i>
          <strong>${isBn ? 'ব্যাকআপ সময়:' : 'Backup Time:'}</strong> ৩ থেকে ৪+ ঘন্টা নিরবচ্ছিন্ন বিদ্যুৎ
        </p>
        <p class="text-blue-200">
          <i class="fas fa-tag text-emerald-400 mr-1.5"></i>
          <strong>${isBn ? 'সম্পূর্ণ প্যাকেজ মূল্য:' : 'Complete Setup Price:'}</strong> আনুমানিক ৳${approxPrice.toLocaleString()} (ইনভার্টার + ব্যাটারি + ইনস্টলেশন তার)
        </p>
      </div>

      <div class="pt-3 flex gap-2">
        <a href="https://wa.me/${STATE.storeSettings.whatsapp}?text=${encodeURIComponent(`আসসালামু আলাইকুম। আমি হামকো আইপিএস প্যাকেজ (${recommendedModel} + ${recommendedBattery}) নিতে আগ্রহী। বিস্তারিত জানাবেন।`)}" target="_blank" class="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5">
          <i class="fab fa-whatsapp"></i> ${isBn ? 'হোয়াটসঅ্যাপে বুকিং করুন' : 'Book on WhatsApp'}
        </a>
      </div>
    </div>
  `;
}

function requestWholesaleQuoteFromCalc(size, grade, total) {
  const quoteSec = document.getElementById('wholesale-section');
  if (quoteSec) quoteSec.scrollIntoView({ behavior: 'smooth' });
  const matInput = document.getElementById('quote-materials');
  if (matInput) {
    matInput.value = `Estimated ${size.toUpperCase()} wiring package with ${grade} cables. Approximate estimate total: ৳${total.toLocaleString()}`;
  }
}

// ==========================================
// FORM SUBMISSIONS & REVIEWS
// ==========================================
function initForms() {
  // Wholesale quote form
  const quoteForm = document.getElementById('wholesale-quote-form');
  if (quoteForm) {
    quoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const isBn = STATE.lang === 'bn';
      const name = document.getElementById('quote-name').value.trim();
      const phone = document.getElementById('quote-phone').value.trim();
      const clientType = document.getElementById('quote-client-type').value;
      const materials = document.getElementById('quote-materials').value.trim();
      const location = document.getElementById('quote-location').value.trim();
      const budget = document.getElementById('quote-budget').value.trim();

      const btn = quoteForm.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Submitting...`;

      try {
        const res = await apiFetch('/api/quotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_name: name,
            client_type: clientType,
            phone,
            location,
            materials_needed: materials,
            estimated_budget: budget
          })
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            alert(isBn ? `ধন্যবাদ! আপনার কোটেশন রিকোয়েস্ট (নম্বর: ${json.quote_number}) সফলভাবে সংরক্ষিত হয়েছে। সারোয়ার ইলেকট্রিক থেকে দ্রুত যোগাযোগ করা হবে।` : 'Quotation submitted successfully!');
            quoteForm.reset();
            return;
          }
        }
        throw new Error('Local fallback');
      } catch (err) {
        const qNum = 'QT-' + Date.now().toString().slice(-6);
        const localQ = {
          id: Date.now(),
          quote_number: qNum,
          client_name: name,
          client_type: clientType,
          phone,
          location,
          materials_needed: materials,
          estimated_budget: budget,
          status: 'Pending',
          created_at: new Date().toISOString()
        };
        const quotes = JSON.parse(localStorage.getItem('sarowar_quotations') || '[]');
        quotes.unshift(localQ);
        localStorage.setItem('sarowar_quotations', JSON.stringify(quotes));

        try {
          const dbCfg = JSON.parse(localStorage.getItem('sarowar_db_config_v1') || '{}');
          const fbUrl = dbCfg.firebaseUrl || 'https://alaminmahfuz-portfolio-default-rtdb.firebaseio.com';
          if (fbUrl) {
            const cleanUrl = fbUrl.replace(/\/+$/, '');
            fetch(`${cleanUrl}/sarowar/quotations/${localQ.id}.json`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(localQ)
            }).catch(() => {});
          }
        } catch (e) {}

        alert(isBn ? `ধন্যবাদ! আপনার কোটেশন রিকোয়েস্ট (নম্বর: ${qNum}) সংরক্ষিত হয়েছে। সারোয়ার ইলেকট্রিক থেকে দ্রুত যোগাযোগ করা হবে।` : 'Quotation submitted successfully!');
        quoteForm.reset();
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  }

  // Electrician booking form
  const serviceForm = document.getElementById('service-booking-form');
  if (serviceForm) {
    serviceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const isBn = STATE.lang === 'bn';
      const name = document.getElementById('srv-name').value.trim();
      const phone = document.getElementById('srv-phone').value.trim();
      const type = document.getElementById('srv-type').value;
      const date = document.getElementById('srv-date').value;
      const address = document.getElementById('srv-address').value.trim();
      const details = document.getElementById('srv-details').value.trim();

      const btn = serviceForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Booking...`;

      try {
        const res = await apiFetch('/api/service-bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: name,
            phone,
            service_type: type,
            preferred_date: date,
            address,
            details
          })
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            alert(isBn ? `ইলেকট্রিশিয়ান বুকিং সফল হয়েছে (বুকিং নং: ${json.booking_number})। আমাদের অভিজ্ঞ টেকনিশিয়ান নাটোর থেকে শীঘ্রই যোগাযোগ করবেন।` : 'Electrician booked successfully!');
            serviceForm.reset();
            return;
          }
        }
        throw new Error('Local fallback');
      } catch (err) {
        const bNum = 'SRV-' + Date.now().toString().slice(-6);
        const localB = {
          id: Date.now(),
          booking_number: bNum,
          customer_name: name,
          phone,
          service_type: type,
          preferred_date: date,
          address,
          details,
          status: 'Pending',
          created_at: new Date().toISOString()
        };
        const bookings = JSON.parse(localStorage.getItem('sarowar_bookings') || '[]');
        bookings.unshift(localB);
        localStorage.setItem('sarowar_bookings', JSON.stringify(bookings));

        try {
          const dbCfg = JSON.parse(localStorage.getItem('sarowar_db_config_v1') || '{}');
          const fbUrl = dbCfg.firebaseUrl || 'https://alaminmahfuz-portfolio-default-rtdb.firebaseio.com';
          if (fbUrl) {
            const cleanUrl = fbUrl.replace(/\/+$/, '');
            fetch(`${cleanUrl}/sarowar/services/${localB.id}.json`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(localB)
            }).catch(() => {});
          }
        } catch (e) {}

        alert(isBn ? `ইলেকট্রিশিয়ান বুকিং সফল হয়েছে (বুকিং নং: ${bNum})। আমাদের অভিজ্ঞ টেকনিশিয়ান শীঘ্রই যোগাযোগ করবেন।` : 'Electrician booked successfully!');
        serviceForm.reset();
      } finally {
        btn.disabled = false;
        btn.innerHTML = isBn ? 'বুকিং নিশ্চিত করুন' : 'Confirm Booking';
      }
    });
  }

  // Review submission
  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('rev-name').value.trim();
      const location = document.getElementById('rev-loc').value.trim();
      const rating = document.getElementById('rev-rating').value;
      const comment = document.getElementById('rev-comment').value.trim();

      try {
        const res = await apiFetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ author_name: name, location, rating: Number(rating), comment })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            alert('রিভিউ দেওয়ার জন্য ধন্যবাদ!');
            reviewForm.reset();
            await loadReviews();
            return;
          }
        }
        throw new Error('Local fallback');
      } catch (err) {
        const localR = {
          id: Date.now(),
          author_name: name,
          location,
          rating: Number(rating),
          comment,
          created_at: new Date().toISOString()
        };
        const revs = JSON.parse(localStorage.getItem('sarowar_reviews') || '[]');
        revs.unshift(localR);
        localStorage.setItem('sarowar_reviews', JSON.stringify(revs));
        alert('রিভিউ দেওয়ার জন্য ধন্যবাদ!');
        reviewForm.reset();
        await loadReviews();
      }
    });
  }

  // Checkout form
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) checkoutForm.addEventListener('submit', submitCheckoutOrder);
}

// Load Reviews
async function loadReviews() {
  try {
    const res = await apiFetch('/api/reviews');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && json.data.length) {
        renderReviews(json.data);
        return;
      }
    }
  } catch (err) {
    // Static fallback
  }

  if (typeof DEFAULT_REVIEWS !== 'undefined') {
    const local = JSON.parse(localStorage.getItem('sarowar_reviews') || '[]');
    renderReviews([...local, ...DEFAULT_REVIEWS]);
  }
}

function renderReviews(reviews) {
  const container = document.getElementById('reviews-container');
  if (!container) return;

  container.innerHTML = reviews.map(r => `
    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-sm">
              ${r.author_name.charAt(0)}
            </div>
            <div>
              <h5 class="font-bold text-slate-900 text-xs">${r.author_name}</h5>
              <span class="text-[11px] text-slate-400 block">${r.location || 'Natore'}</span>
            </div>
          </div>
          <div class="flex text-amber-400 text-xs">
            ${Array.from({ length: r.rating || 5 }).map(() => '<i class="fas fa-star"></i>').join('')}
          </div>
        </div>
        <p class="text-xs text-slate-600 leading-relaxed italic">"${r.comment}"</p>
      </div>
      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
        <i class="fas fa-check-circle text-xs"></i> <span>ভেরিফাইড কাস্টমার / ঠিকাদার</span>
      </div>
    </div>
  `).join('');
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================
function initAdminDashboard() {
  const loginForm = document.getElementById('admin-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pin = document.getElementById('admin-pin-input').value;
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin })
        });
        const json = await res.json();
        if (json.success) {
          STATE.adminToken = pin;
          sessionStorage.setItem('seh_admin_token', pin);
          showAdminView();
        } else {
          alert(json.message);
        }
      } catch (err) {
        alert('Admin login error');
      }
    });
  }

  // Check if already logged in
  if (window.location.hash === '#admin' || sessionStorage.getItem('seh_admin_token')) {
    if (sessionStorage.getItem('seh_admin_token')) {
      showAdminView();
    } else {
      openAdminLoginModal();
    }
  }
}

function openAdminLoginModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) modal.classList.add('hidden');
}

async function showAdminView() {
  closeAdminModal();
  const adminSection = document.getElementById('admin-portal-section');
  if (adminSection) {
    adminSection.classList.remove('hidden');
    adminSection.scrollIntoView({ behavior: 'smooth' });
    await loadAdminStats();
    await loadAdminOrders();
    await loadAdminQuotations();
    await loadAdminBookings();
  }
}

async function loadAdminStats() {
  try {
    const res = await fetch('/api/admin/stats', {
      headers: { 'x-admin-pin': STATE.adminToken }
    });
    const json = await res.json();
    if (json.success) {
      const d = json.data;
      document.getElementById('stat-orders').textContent = d.total_orders;
      document.getElementById('stat-revenue').textContent = `৳${Number(d.total_revenue).toLocaleString()}`;
      document.getElementById('stat-pending').textContent = d.pending_orders;
      document.getElementById('stat-quotes').textContent = d.pending_quotations;
      document.getElementById('stat-services').textContent = d.pending_services;
      document.getElementById('stat-products').textContent = d.total_products;
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadAdminOrders() {
  try {
    const res = await fetch('/api/admin/orders', {
      headers: { 'x-admin-pin': STATE.adminToken }
    });
    const json = await res.json();
    const container = document.getElementById('admin-orders-list');
    if (!container) return;

    if (!json.data || !json.data.length) {
      container.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs">কোনো অর্ডার এখনো নেই</div>`;
      return;
    }

    container.innerHTML = json.data.map(o => `
      <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="font-extrabold text-sm text-slate-900">${o.order_number}</span>
            <span class="px-2 py-0.5 rounded text-[11px] font-bold ${o.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${o.status}</span>
          </div>
          <p class="text-slate-600 font-medium"><strong>Customer:</strong> ${o.customer_name} (${o.customer_phone})</p>
          <p class="text-slate-500"><strong>Address:</strong> ${o.delivery_address}, ${o.upazila}</p>
          <p class="text-slate-500"><strong>Items:</strong> ${(o.items || []).map(i => `${i.title_bn || i.title_en} (${i.quantity})`).join(', ')}</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right">
            <span class="text-slate-400 block text-[10px]">Total Bill</span>
            <strong class="text-orange-600 text-base">৳${Number(o.total_amount).toLocaleString()}</strong>
          </div>
          <select onchange="updateOrderStatus(${o.id}, this.value)" class="p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium">
            <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
            <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': STATE.adminToken
      },
      body: JSON.stringify({ status })
    });
    const json = await res.json();
    if (json.success) {
      showToast('Order status updated!');
      await loadAdminStats();
    }
  } catch (e) {
    alert('Failed to update order status');
  }
}

async function loadAdminQuotations() {
  try {
    const res = await fetch('/api/admin/quotations', {
      headers: { 'x-admin-pin': STATE.adminToken }
    });
    const json = await res.json();
    const container = document.getElementById('admin-quotes-list');
    if (!container) return;

    if (!json.data || !json.data.length) {
      container.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs">কোনো কোটেশন রিকোয়েস্ট নেই</div>`;
      return;
    }

    container.innerHTML = json.data.map(q => `
      <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-xs">
        <div class="flex items-center justify-between mb-2">
          <span class="font-extrabold text-sm text-slate-900">${q.quote_number} - ${q.client_name}</span>
          <span class="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">${q.client_type}</span>
        </div>
        <p class="text-slate-600 mb-1"><strong>Phone:</strong> <a href="tel:${q.phone}" class="text-orange-600 font-bold underline">${q.phone}</a> | <strong>Location:</strong> ${q.location}</p>
        <p class="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2"><strong>Materials Requested:</strong><br>${q.materials_needed}</p>
        <div class="flex items-center justify-between text-slate-400 text-[11px]">
          <span>Date: ${new Date(q.created_at).toLocaleDateString()}</span>
          <a href="https://wa.me/${q.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`আসসালামু আলাইকুম ${q.client_name} ভাই, সারোয়ার ইলেকট্রিক (বড় হরিশপুর, নাটোর) থেকে আপনার ${q.quote_number} কোটেশনের প্রেক্ষিতে যোগাযোগ করছি।`)}" target="_blank" class="px-3 py-1 bg-emerald-600 text-white rounded-md font-bold">
            <i class="fab fa-whatsapp"></i> WhatsApp Quote
          </a>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

async function loadAdminBookings() {
  try {
    const res = await fetch('/api/admin/service-bookings', {
      headers: { 'x-admin-pin': STATE.adminToken }
    });
    const json = await res.json();
    const container = document.getElementById('admin-bookings-list');
    if (!container) return;

    if (!json.data || !json.data.length) {
      container.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs">কোনো বুকিং নেই</div>`;
      return;
    }

    container.innerHTML = json.data.map(b => `
      <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-xs">
        <div class="flex items-center justify-between mb-1">
          <strong class="text-slate-900">${b.booking_number} - ${b.service_type}</strong>
          <span class="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px] font-bold">${b.status}</span>
        </div>
        <p class="text-slate-600">Customer: ${b.customer_name} | Phone: <a href="tel:${b.phone}" class="text-orange-600 font-bold">${b.phone}</a></p>
        <p class="text-slate-500">Address: ${b.address} | Preferred Date: ${b.preferred_date}</p>
        ${b.details ? `<p class="text-slate-600 bg-slate-50 p-2 rounded mt-1">Details: ${b.details}</p>` : ''}
      </div>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

// Export DB Backup
async function exportDatabaseBackup() {
  try {
    const res = await fetch('/api/admin/export', {
      headers: { 'x-admin-pin': STATE.adminToken }
    });
    const json = await res.json();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `sarowar_electric_backup_${Date.now()}.json`);
    dlAnchorElem.click();
    showToast('Database exported successfully!');
  } catch (e) {
    alert('Export failed');
  }
}

// Toast notification helper
function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 border border-slate-800 transition transform duration-300';
  toast.innerHTML = `<i class="fas fa-check-circle text-orange-500"></i> <span>${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Global Event Listeners
function setupEventListeners() {
  // Search input live search
  const searchInput = document.getElementById('main-search-input');
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        STATE.searchQuery = e.target.value;
        loadProducts();
      }, 300);
    });
  }

  // Sorting
  const sortSelect = document.getElementById('products-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      STATE.currentSort = e.target.value;
      loadProducts();
    });
  }
}

