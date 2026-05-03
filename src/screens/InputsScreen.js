import { api } from '../api.js';
import { showToast, navigate } from '../app-shell.js';
import { getState } from '../store.js';
import { t } from '../i18n.js';

/**
 * InputsScreen — Seeds, Fertilizers, Pesticides, Tools Marketplace
 * Browse products, order from nearby sellers, get AI recommendations
 */

export function renderInputs(container) {
  let tab = 'browse'; // browse | orders | dealers | recommend
  let categories = [];
  let products = [];
  let orders = [];
  let recommendations = [];
  let selectedCategory = null;
  let searchQuery = '';
  let loading = true;
  let cart = [];

  async function loadData() {
    loading = true;
    render();
    try {
      if (tab === 'browse') {
        if (!categories.length) {
          const catRes = await api.get('/inputs/categories');
          categories = catRes.categories || [];
        }
        let url = '/inputs/products?limit=20';
        if (selectedCategory) url += `&category_id=${selectedCategory}`;
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
        const res = await api.get(url);
        products = res.products || [];
      } else if (tab === 'orders') {
        const res = await api.get('/inputs/orders');
        orders = res.orders || [];
      } else if (tab === 'recommend') {
        const res = await api.get('/inputs/recommendations');
        recommendations = res.recommendations || [];
      }
    } catch (err) {
      products = []; orders = []; recommendations = [];
    }
    loading = false;
    render();
  }

  function render() {
    container.innerHTML = `
      <div class="hero-v2" role="banner" style="background:linear-gradient(135deg,#2E7D32,#1B5E20);color:white">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:2rem">🌱</span>
          <div><h1 style="margin:0;font-size:1.3rem">Agri Inputs</h1>
          <p style="margin:2px 0 0;opacity:.85;font-size:.85rem">Seeds • Fertilizers • Pesticides • Tools</p></div>
        </div>
        ${cart.length ? `<div style="position:absolute;right:16px;top:16px;background:#FF6F00;padding:6px 12px;border-radius:20px;font-size:.8rem">🛒 ${cart.length} items</div>` : ''}
      </div>

      <div style="display:flex;gap:0;border-bottom:2px solid #E8F5E9;background:#fff;position:sticky;top:0;z-index:10">
        ${['browse', 'orders', 'dealers', 'recommend'].map(t => `
          <button onclick="window._inputTab('${t}')" style="flex:1;padding:12px 8px;border:none;background:${tab===t?'#2E7D32':'transparent'};color:${tab===t?'#fff':'#555'};font-weight:${tab===t?'700':'400'};font-size:.8rem;cursor:pointer;border-radius:${tab===t?'8px 8px 0 0':'0'}">
            ${{browse:'🛒 Browse',orders:'📋 Orders',dealers:'📍 Dealers',recommend:'🧠 For You'}[t]}
          </button>
        `).join('')}
      </div>

      <div style="padding:16px">
        ${loading ? '<div style="text-align:center;padding:40px">⏳ Loading...</div>' : renderTab()}
      </div>
    `;
  }

  function renderTab() {
    if (tab === 'browse') return renderBrowse();
    if (tab === 'orders') return renderOrders();
    if (tab === 'dealers') return renderDealers();
    if (tab === 'recommend') return renderRecommendations();
    return '';
  }

  function renderBrowse() {
    return `
      <!-- Search -->
      <div style="margin-bottom:16px">
        <input id="inputSearch" type="text" value="${searchQuery}" placeholder="🔍 Search seeds, fertilizers, pesticides..."
          style="width:100%;padding:12px 16px;border:1px solid #ddd;border-radius:10px;font-size:.9rem"
          onchange="window._inputSearch(this.value)">
      </div>

      <!-- Categories -->
      <div style="display:flex;gap:8px;overflow-x:auto;margin-bottom:16px;padding-bottom:4px">
        <button onclick="window._inputCat(null)" style="padding:8px 14px;border-radius:20px;border:1px solid ${!selectedCategory?'#2E7D32':'#ddd'};background:${!selectedCategory?'#E8F5E9':'#fff'};font-size:.8rem;white-space:nowrap;cursor:pointer">All</button>
        ${categories.map(c => `
          <button onclick="window._inputCat('${c.id}')" style="padding:8px 14px;border-radius:20px;border:1px solid ${selectedCategory===c.id?'#2E7D32':'#ddd'};background:${selectedCategory===c.id?'#E8F5E9':'#fff'};font-size:.8rem;white-space:nowrap;cursor:pointer">
            ${c.icon_emoji || '📦'} ${c.name}
          </button>
        `).join('')}
      </div>

      <!-- Products -->
      ${products.length ? `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          ${products.map(p => `
            <div style="background:#fff;border-radius:12px;padding:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
              <div style="font-size:1.5rem;text-align:center;padding:12px">${p.icon_emoji || '📦'}</div>
              <div style="font-size:.85rem;font-weight:600;margin-bottom:4px">${p.name}</div>
              <div style="font-size:.75rem;color:#666">${p.brand || ''} ${p.category_name ? '• ' + p.category_name : ''}</div>
              ${p.mrp ? `<div style="margin-top:6px;font-size:.9rem;font-weight:700;color:#2E7D32">₹${p.mrp}/${p.unit || 'kg'}</div>` : ''}
              ${p.rating ? `<div style="font-size:.75rem;color:#FF8F00">⭐ ${p.rating}</div>` : ''}
              <button onclick="window._addToCart('${p.id}','${p.name}',${p.mrp || 0})" style="width:100%;margin-top:8px;padding:8px;background:#2E7D32;color:#fff;border:none;border-radius:8px;font-size:.8rem;cursor:pointer">Add to Cart</button>
            </div>
          `).join('')}
        </div>
      ` : '<div style="text-align:center;padding:40px;color:#888">No products found</div>'}
    `;
  }

  function renderOrders() {
    if (!orders.length) return '<div style="text-align:center;padding:40px;color:#888">📭 No orders yet.<br><small>Browse inputs and place your first order!</small></div>';
    return orders.map(o => `
      <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:600">${o.shop_name || 'Order'}</span>
          <span style="background:${o.status==='delivered'?'#4CAF50':'#FFA726'};color:#fff;padding:4px 10px;border-radius:20px;font-size:.75rem">${o.status}</span>
        </div>
        <div style="margin-top:8px;font-size:.85rem;color:#555">
          <div>💰 Total: ₹${o.total_amount}</div>
          <div>📅 ${new Date(o.created_at).toLocaleDateString()}</div>
          ${o.items ? `<div>📦 ${JSON.parse(typeof o.items === 'string' ? o.items : JSON.stringify(o.items)).length} items</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  function renderDealers() {
    return `
      <div style="text-align:center;padding:40px">
        <p style="font-size:1.2rem">📍 Nearby Dealers</p>
        <p style="color:#666;font-size:.85rem">Find verified input sellers near your village</p>
        <p style="color:#888;margin-top:20px;font-size:.8rem">Enable location to see dealers on map</p>
      </div>
    `;
  }

  function renderRecommendations() {
    if (!recommendations.length) return '<div style="text-align:center;padding:40px;color:#888">🧠 Add crops to your profile for personalized recommendations</div>';
    return `
      <h3 style="margin:0 0 12px;font-size:1rem">🧠 Recommended for Your Farm</h3>
      ${recommendations.map(p => `
        <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);display:flex;gap:12px;align-items:center">
          <div style="font-size:2rem">${p.icon_emoji || '📦'}</div>
          <div style="flex:1">
            <div style="font-weight:600;font-size:.9rem">${p.name}</div>
            <div style="font-size:.8rem;color:#666">${p.brand || ''} • ${p.category_name || ''}</div>
            ${p.mrp ? `<div style="font-size:.9rem;font-weight:700;color:#2E7D32;margin-top:4px">₹${p.mrp}/${p.unit || 'kg'}</div>` : ''}
          </div>
          <button onclick="window._addToCart('${p.id}','${p.name}',${p.mrp || 0})" style="padding:8px 12px;background:#2E7D32;color:#fff;border:none;border-radius:8px;font-size:.8rem;cursor:pointer">Add</button>
        </div>
      `).join('')}
    `;
  }

  // Event handlers
  window._inputTab = (t) => { tab = t; loadData(); };
  window._inputCat = (id) => { selectedCategory = id; loadData(); };
  window._inputSearch = (q) => { searchQuery = q; loadData(); };
  window._addToCart = (id, name, price) => {
    cart.push({ product_id: id, name, price, quantity: 1 });
    showToast(`${name} added to cart`, 'success');
    render();
  };

  loadData();
}
