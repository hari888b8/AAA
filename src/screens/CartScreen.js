import { api } from '../api.js';
import { navigate, showToast, showModal, closeModal } from '../app-shell.js';
import { t } from '../i18n.js';

export function renderCart(container) {
  let cartItems = [], loading = true;
  let deliveryType = 'self_pickup';
  let deliveryAddress = '';

  const SAMPLE_CART = [
    { id:'sc1', listing_id:'l1', listing_type:'supply', quantity:5, price_per_unit:2180, crop_name:'Paddy BPT 5204', seller_name:'Ramesh Farms' },
    { id:'sc2', listing_id:'l2', listing_type:'agrigalaxy', quantity:2, price_per_unit:1350, crop_name:'DAP Fertilizer 50kg', seller_name:'Sri Sai Seeds' },
    { id:'sc3', listing_id:'l3', listing_type:'supply', quantity:3, price_per_unit:5650, crop_name:'Groundnut Bold', seller_name:'Kurnool Agri FPO' },
  ];

  function getSubtotal() {
    return cartItems.reduce((s, item) => s + (item.price_per_unit * item.quantity), 0);
  }

  function getDeliveryFee() {
    return deliveryType === 'platform_delivery' ? 150 : 0;
  }

  function getSavings() {
    return Math.round(getSubtotal() * 0.05);
  }

  function render() {
    const subtotal = getSubtotal();
    const deliveryFee = getDeliveryFee();
    const total = subtotal + deliveryFee;
    const itemCount = cartItems.reduce((s, item) => s + item.quantity, 0);

    container.innerHTML = `
      <div class="hero-v2" style="background:linear-gradient(135deg,#1B5E20,#2E7D32)" role="banner">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="hero-avatar" aria-hidden="true">🛒</div>
          <div style="flex:1">
            <h1 style="margin:0;font-weight:800;font-size:18px;color:white">My Cart</h1>
            <div style="font-size:11px;opacity:0.85;color:white">${itemCount} items · ₹${Number(subtotal).toLocaleString()} total</div>
          </div>
          ${cartItems.length > 0 ? `<span style="background:rgba(255,255,255,0.2);color:#fff;padding:4px 10px;border-radius:10px;font-size:11px;font-weight:700">₹${getSavings().toLocaleString()} saved</span>` : ''}
        </div>
        <div class="hero-stats" role="list" style="margin-top:12px">
          <div class="hero-stat-card" role="listitem"><div class="v">${itemCount}</div><div class="l">Items</div></div>
          <div class="hero-stat-card" role="listitem"><div class="v">₹${Number(subtotal).toLocaleString()}</div><div class="l">Total</div></div>
          <div class="hero-stat-card" role="listitem"><div class="v">₹${getSavings().toLocaleString()}</div><div class="l">Savings</div></div>
        </div>
      </div>

      <div class="pb-nav">
        ${loading ? '<div class="loading"><div class="spinner"></div></div>' : renderContent()}
      </div>

      ${!loading && cartItems.length > 0 ? renderCheckoutSection(subtotal, deliveryFee, total) : ''}
    `;

    bindEvents();
  }

  function renderContent() {
    if (cartItems.length === 0) {
      return `<div class="empty-v2">
        <div class="ev-icon">🛒</div>
        <div class="ev-title">Your cart is empty</div>
        <div class="ev-text">Browse marketplace to add items</div>
        <button class="btn btn-primary" data-nav="agriflow" style="margin-top:12px">🌾 Browse AgriFlow</button>
      </div>`;
    }

    return `<div class="section" style="padding:8px 14px">
      ${cartItems.map(item => {
        const itemSubtotal = item.price_per_unit * item.quantity;
        const typeColor = { supply:'#2E7D32', agrigalaxy:'#1565C0', kisanconnect:'#6A1B9A' }[item.listing_type] || '#555';
        return `
          <div class="card" style="margin-bottom:10px;padding:12px;position:relative">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div style="flex:1">
                <div style="font-weight:700;font-size:14px;margin-bottom:4px">${item.crop_name || 'Item'}</div>
                <span class="tag" style="background:${typeColor}15;color:${typeColor};font-size:10px;padding:2px 8px;border-radius:6px;font-weight:600">${item.listing_type}</span>
                <div class="text-sm text-muted" style="margin-top:4px">${item.seller_name || 'Seller'}</div>
              </div>
              <button class="remove-item-btn" data-id="${item.id}" style="background:none;border:none;font-size:18px;cursor:pointer;padding:4px" aria-label="Remove item">🗑️</button>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px">
              <div style="display:flex;align-items:center;gap:8px">
                <button class="qty-btn" data-id="${item.id}" data-action="decrease" style="width:28px;height:28px;border-radius:50%;border:1.5px solid #ddd;background:#f5f5f5;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center">−</button>
                <span style="font-weight:700;font-size:14px;min-width:20px;text-align:center">${item.quantity}</span>
                <button class="qty-btn" data-id="${item.id}" data-action="increase" style="width:28px;height:28px;border-radius:50%;border:1.5px solid #ddd;background:#f5f5f5;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center">+</button>
              </div>
              <div style="text-align:right">
                <div class="text-sm text-muted">₹${item.price_per_unit.toLocaleString()} × ${item.quantity}</div>
                <div class="fw-700" style="color:#1B5E20;font-size:15px">₹${itemSubtotal.toLocaleString()}</div>
              </div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
  }

  function renderCheckoutSection(subtotal, deliveryFee, total) {
    return `<div style="position:sticky;bottom:0;background:white;border-top:1px solid #eee;padding:14px;box-shadow:0 -2px 10px rgba(0,0,0,0.06);z-index:10">
      <div class="card" style="margin-bottom:10px;padding:12px;box-shadow:none;background:#f9f9f9">
        <div class="fw-700" style="margin-bottom:8px;font-size:13px">Order Summary</div>
        <div class="flex-between" style="margin-bottom:4px"><span class="text-sm">Subtotal</span><span class="text-sm">₹${subtotal.toLocaleString()}</span></div>
        <div class="flex-between" style="margin-bottom:4px"><span class="text-sm">Delivery Fee</span><span class="text-sm">${deliveryFee === 0 ? 'FREE' : '₹' + deliveryFee.toLocaleString()}</span></div>
        <div class="flex-between" style="border-top:1px solid #eee;padding-top:6px;margin-top:4px"><span class="fw-700">Total</span><span class="fw-700" style="color:#1B5E20;font-size:16px">₹${total.toLocaleString()}</span></div>
      </div>

      <div style="display:flex;gap:6px;margin-bottom:10px">
        <button class="delivery-type-btn chip-v2 ${deliveryType === 'self_pickup' ? 'active' : ''}" data-dtype="self_pickup" type="button">🏪 Self Pickup</button>
        <button class="delivery-type-btn chip-v2 ${deliveryType === 'platform_delivery' ? 'active' : ''}" data-dtype="platform_delivery" type="button">🚚 Platform Delivery</button>
      </div>

      ${deliveryType === 'platform_delivery' ? `
        <div class="form-group" style="margin-bottom:10px">
          <input class="form-input" id="deliveryAddress" type="text" placeholder="Enter delivery address…" value="${deliveryAddress}" aria-label="Delivery address">
        </div>
      ` : ''}

      <button id="proceedPayBtn" class="btn btn-primary" style="width:100%;padding:14px;font-size:15px;font-weight:700;border-radius:12px">
        💳 Proceed to Pay · ₹${total.toLocaleString()}
      </button>
    </div>`;
  }

  function bindEvents() {
    container.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => handleQuantityChange(btn.dataset.id, btn.dataset.action));
    });

    container.querySelectorAll('.remove-item-btn').forEach(btn => {
      btn.addEventListener('click', () => handleRemoveItem(btn.dataset.id));
    });

    container.querySelectorAll('.delivery-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        deliveryType = btn.dataset.dtype;
        render();
      });
    });

    const addressInput = container.querySelector('#deliveryAddress');
    if (addressInput) {
      addressInput.addEventListener('input', e => { deliveryAddress = e.target.value; });
    }

    container.querySelector('#proceedPayBtn')?.addEventListener('click', showCheckoutModal);

    container.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.nav));
    });
  }

  async function handleQuantityChange(id, action) {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;

    const newQty = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
    if (newQty < 1) { handleRemoveItem(id); return; }

    item.quantity = newQty;
    render();

    try {
      await api.updateCartItem(id, { quantity: newQty });
    } catch (e) {
      console.error('Failed to update cart item:', e);
    }
  }

  async function handleRemoveItem(id) {
    cartItems = cartItems.filter(i => i.id !== id);
    render();
    showToast('Item removed from cart', 'info');

    try {
      await api.removeCartItem(id);
    } catch (e) {
      console.error('Failed to remove cart item:', e);
    }
  }

  function showCheckoutModal() {
    if (deliveryType === 'platform_delivery' && !deliveryAddress.trim()) {
      showToast('Please enter a delivery address', 'error');
      return;
    }

    const total = getSubtotal() + getDeliveryFee();

    showModal(`<div class="modal-handle"></div>
      <h3 style="margin-bottom:12px">💳 Checkout</h3>
      <div class="card" style="box-shadow:none;background:#f9f9f9;margin-bottom:12px;padding:10px">
        <div class="flex-between" style="margin-bottom:4px"><span class="text-sm">Items</span><span class="text-sm fw-700">${cartItems.length} items</span></div>
        <div class="flex-between"><span class="text-sm">Total</span><span class="fw-700" style="color:#1B5E20">₹${total.toLocaleString()}</span></div>
      </div>
      <div class="form-group" style="margin-bottom:12px">
        <label style="font-size:12px;font-weight:600;margin-bottom:6px;display:block">Payment Method</label>
        <div style="display:flex;flex-direction:column;gap:8px">
          <label style="display:flex;align-items:center;gap:8px;padding:10px;border:1.5px solid #1B5E20;border-radius:10px;cursor:pointer;background:#f0fff0">
            <input type="radio" name="payMethod" value="wallet" checked style="accent-color:#1B5E20"> <span>💰 Wallet Balance</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;padding:10px;border:1.5px solid #ddd;border-radius:10px;cursor:pointer">
            <input type="radio" name="payMethod" value="upi"> <span>📱 UPI Payment</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;padding:10px;border:1.5px solid #ddd;border-radius:10px;cursor:pointer">
            <input type="radio" name="payMethod" value="cod"> <span>💵 Cash on Delivery</span>
          </label>
        </div>
      </div>
      <button id="confirmCheckoutBtn" style="width:100%;padding:14px;background:#1B5E20;color:white;border:none;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer">✓ Confirm Order · ₹${total.toLocaleString()}</button>
    `);

    document.querySelector('#confirmCheckoutBtn')?.addEventListener('click', handleConfirmOrder);
  }

  async function handleConfirmOrder() {
    const payMethod = document.querySelector('input[name="payMethod"]:checked')?.value || 'wallet';

    try {
      await api.checkout({
        items: cartItems.map(i => ({ listing_id: i.listing_id, quantity: i.quantity })),
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'platform_delivery' ? deliveryAddress : null,
        payment_method: payMethod,
      });
      showToast('🎉 Order placed successfully!', 'success');
      closeModal();
      navigate('orders');
    } catch (e) {
      showToast(e.message || 'Checkout failed', 'error');
    }
  }

  async function loadData() {
    loading = true; render();
    try {
      const res = await api.getCart();
      cartItems = Array.isArray(res) ? res : (res.items || []);
    } catch (e) { console.error(e); }
    if (cartItems.length === 0) cartItems = SAMPLE_CART;
    loading = false; render();
  }

  loadData();
}
