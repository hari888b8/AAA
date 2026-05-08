import { api } from '../api.js';
import { navigate } from '../main.js';

export function renderFPOStorefront(container) {
  container.innerHTML = `
    <div class="screen-container">
      <header class="screen-header">
        <button class="back-btn" onclick="navigateBack()">←</button>
        <h1>🏪 FPO Storefront</h1>
      </header>

      <div class="tab-bar">
        <button class="tab active" data-tab="store">My Store</button>
        <button class="tab" data-tab="products">Products</button>
        <button class="tab" data-tab="inquiries">Inquiries</button>
        <button class="tab" data-tab="analytics">Analytics</button>
      </div>

      <div id="storefront-content" class="content-area">
        <div class="loading-spinner">Loading...</div>
      </div>
    </div>
  `;

  const tabs = container.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadStorefrontTab(tab.dataset.tab, container);
    });
  });

  loadStorefrontTab('store', container);
}

async function loadStorefrontTab(tab, container) {
  const content = container.querySelector('#storefront-content');

  if (tab === 'store') {
    try {
      const res = await api('/api/fpo/storefront');
      const store = res.store || {};
      content.innerHTML = `
        <form id="store-form" class="form-container">
          <div class="form-group"><label>Store Slug</label><input type="text" name="slug" value="${store.slug || ''}" required /></div>
          <div class="form-group"><label>Store Name</label><input type="text" name="name" value="${store.name || ''}" required /></div>
          <div class="form-group"><label>Description</label><textarea name="description" rows="3">${store.description || ''}</textarea></div>
          <div class="form-group"><label>Theme Color</label><input type="color" name="theme_color" value="${store.theme_color || '#2e7d32'}" /></div>
          <div class="form-group"><label>Banner URL</label><input type="url" name="banner_url" value="${store.banner_url || ''}" /></div>
          <button type="submit" class="btn btn-primary btn-block">Save Storefront</button>
          <button type="button" id="preview-btn" class="btn btn-block" style="margin-top:8px;background:#f5f5f5;color:#333;">Preview Store</button>
        </form>
      `;
      content.querySelector('#store-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
          await api('/api/fpo/storefront', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
          alert('Storefront saved!');
        } catch (err) { alert('Error: ' + err.message); }
      });
      content.querySelector('#preview-btn').addEventListener('click', () => {
        const slug = content.querySelector('[name="slug"]').value;
        if (slug) window.open('/store/' + slug, '_blank');
      });
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'products') {
    try {
      const res = await api('/api/fpo/storefront/products');
      const products = res.products || [];
      content.innerHTML = `
        <button id="add-product-btn" class="btn btn-primary" style="margin-bottom:12px;">+ Add Product</button>
        <div id="product-list">
          ${products.length ? products.map(p => `
            <div class="card" style="margin-bottom:10px;">
              <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                <strong>${p.name}</strong>
                <span style="color:${p.available ? '#2e7d32' : '#c62828'}">${p.available ? 'Available' : 'Unavailable'}</span>
              </div>
              <div class="card-body">
                <p>₹${p.price}/${p.unit || 'kg'}</p>
              </div>
              <div style="display:flex;gap:8px;padding:8px;">
                <button class="btn edit-prod" data-id="${p.id}" style="flex:1;background:#fff3e0;color:#e65100;">Edit</button>
                <button class="btn del-prod" data-id="${p.id}" style="flex:1;background:#ffebee;color:#c62828;">Delete</button>
              </div>
            </div>
          `).join('') : '<div class="empty-state"><p>No products listed yet.</p></div>'}
        </div>
        <div id="product-form-area"></div>
      `;
      content.querySelector('#add-product-btn').addEventListener('click', () => {
        showProductForm(content, container);
      });
      content.querySelectorAll('.del-prod').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await api('/api/fpo/storefront/products/' + btn.dataset.id, { method: 'DELETE' });
            loadStorefrontTab('products', container);
          } catch (err) { alert('Error: ' + err.message); }
        });
      });
      content.querySelectorAll('.edit-prod').forEach(btn => {
        btn.addEventListener('click', () => {
          const p = products.find(x => String(x.id) === btn.dataset.id);
          if (p) showProductForm(content, container, p);
        });
      });
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'inquiries') {
    try {
      const res = await api('/api/fpo/storefront/inquiries');
      const inquiries = res.inquiries || [];
      if (!inquiries.length) {
        content.innerHTML = '<div class="empty-state"><p>No inquiries received yet.</p></div>';
        return;
      }
      const badgeColor = { new: '#1565c0', responded: '#2e7d32', closed: '#757575' };
      content.innerHTML = inquiries.map(inq => `
        <div class="card" style="margin-bottom:10px;">
          <div class="card-header" style="display:flex;justify-content:space-between;">
            <strong>${inq.buyer_name || 'Buyer'}</strong>
            <span style="background:${badgeColor[inq.status] || '#757575'};color:#fff;padding:2px 8px;border-radius:12px;font-size:0.75rem;">${inq.status}</span>
          </div>
          <div class="card-body">
            <p>${inq.message || 'No message'}</p>
            <p style="font-size:0.8rem;color:#666;">${inq.product_name || ''} — ${inq.created_at ? new Date(inq.created_at).toLocaleDateString() : ''}</p>
          </div>
          ${inq.status === 'new' ? `<button class="btn respond-btn" data-id="${inq.id}" style="margin:8px;background:#e8f5e9;color:#2e7d32;">Respond</button>` : ''}
        </div>
      `).join('');
      content.querySelectorAll('.respond-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const msg = prompt('Enter your response:');
          if (!msg) return;
          try {
            await api('/api/fpo/storefront/inquiries/' + btn.dataset.id + '/respond', { method: 'POST', body: JSON.stringify({ response: msg }) });
            loadStorefrontTab('inquiries', container);
          } catch (err) { alert('Error: ' + err.message); }
        });
      });
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'analytics') {
    try {
      const res = await api('/api/fpo/storefront/analytics');
      const a = res.analytics || {};
      content.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="card" style="text-align:center;padding:16px;"><p style="font-size:2rem;font-weight:bold;color:#2e7d32;">${a.views || 0}</p><p>Total Views</p></div>
          <div class="card" style="text-align:center;padding:16px;"><p style="font-size:2rem;font-weight:bold;color:#1565c0;">${a.inquiries || 0}</p><p>Inquiries</p></div>
          <div class="card" style="text-align:center;padding:16px;"><p style="font-size:2rem;font-weight:bold;color:#e65100;">${a.conversion_rate || 0}%</p><p>Conversion Rate</p></div>
          <div class="card" style="text-align:center;padding:16px;"><p style="font-size:1.2rem;font-weight:bold;color:#4a148c;">${a.top_product || 'N/A'}</p><p>Top Product</p></div>
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  }
}

function showProductForm(content, container, product) {
  const area = content.querySelector('#product-form-area');
  area.innerHTML = `
    <form id="prod-form" class="form-container" style="margin-top:12px;border-top:1px solid #e0e0e0;padding-top:12px;">
      <div class="form-group"><label>Name</label><input type="text" name="name" value="${product ? product.name : ''}" required /></div>
      <div class="form-group"><label>Price (₹)</label><input type="number" name="price" step="0.01" value="${product ? product.price : ''}" required /></div>
      <div class="form-group"><label>Unit</label><input type="text" name="unit" value="${product ? product.unit || 'kg' : 'kg'}" /></div>
      <div class="form-group"><label>Available</label><select name="available"><option value="true" ${!product || product.available ? 'selected' : ''}>Yes</option><option value="false" ${product && !product.available ? 'selected' : ''}>No</option></select></div>
      <button type="submit" class="btn btn-primary btn-block">${product ? 'Update' : 'Add'} Product</button>
    </form>
  `;
  area.querySelector('#prod-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    data.available = data.available === 'true';
    try {
      const url = product ? '/api/fpo/storefront/products/' + product.id : '/api/fpo/storefront/products';
      await api(url, { method: product ? 'PUT' : 'POST', body: JSON.stringify(data) });
      loadStorefrontTab('products', container);
    } catch (err) { alert('Error: ' + err.message); }
  });
}
