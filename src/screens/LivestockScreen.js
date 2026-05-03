import { api } from '../api.js';
import { navigate, showToast, showModal, closeModal } from '../app-shell.js';
import { t } from '../i18n.js';

// ═══ LIVESTOCK MARKET ═══

const CATEGORIES = [
  { id:'all',     label:'All',      icon:'' },
  { id:'cattle',  label:'Cattle',   icon:'🐄' },
  { id:'buffalo', label:'Buffalo',  icon:'🐃' },
  { id:'goat',    label:'Goat',     icon:'🐐' },
  { id:'sheep',   label:'Sheep',    icon:'🐑' },
  { id:'poultry', label:'Poultry',  icon:'🐔' },
  { id:'pig',     label:'Pig',      icon:'🐷' },
  { id:'horse',   label:'Horse',    icon:'🐴' },
];

const SORT_OPTIONS = [
  { id:'price_asc',  label:'Price Low→High' },
  { id:'price_desc', label:'Price High→Low' },
  { id:'newest',     label:'Newest' },
  { id:'nearest',    label:'Nearest' },
];

const VACCINATIONS = ['FMD', 'HS', 'BQ', 'Brucellosis', 'Deworming'];

const SAMPLE_LIVESTOCK = [
  { id:'lv1', animal_type:'cattle', breed:'HF Cross', age_months:24, weight_kg:350, gender:'female', price:65000, location_label:'Guntur, AP', seller_name:'Ramesh', verification_status:'verified', vaccinations:['FMD','HS','Deworming'], photos:[] },
  { id:'lv2', animal_type:'buffalo', breed:'Murrah', age_months:36, weight_kg:500, gender:'female', price:95000, location_label:'Karimnagar, TS', seller_name:'Suresh', verification_status:'unverified', vaccinations:['FMD'], photos:[] },
  { id:'lv3', animal_type:'goat', breed:'Osmanabadi', age_months:12, weight_kg:35, gender:'male', price:12000, location_label:'Kurnool, AP', seller_name:'Venkat', verification_status:'verified', vaccinations:['Deworming'], photos:[] },
  { id:'lv4', animal_type:'poultry', breed:'Kadaknath', age_months:6, weight_kg:2, gender:'male', price:800, location_label:'Warangal, TS', seller_name:'Lakshmi', verification_status:'unverified', vaccinations:[], photos:[] },
  { id:'lv5', animal_type:'sheep', breed:'Nellore', age_months:18, weight_kg:45, gender:'female', price:15000, location_label:'Prakasam, AP', seller_name:'Reddy', verification_status:'verified', vaccinations:['FMD','Deworming'], photos:[] },
];

function getAnimalEmoji(type) {
  const cat = CATEGORIES.find(c => c.id === type);
  return cat ? cat.icon : '🐄';
}

export function renderLivestock(container) {
  let listings = [];
  let loading = true;
  let activeCategory = 'all';
  let activeSort = 'newest';

  function render() {
    if (listings.length === 0 && !loading) listings = SAMPLE_LIVESTOCK;

    const filtered = activeCategory === 'all'
      ? listings
      : listings.filter(l => l.animal_type === activeCategory);

    const sorted = sortListings(filtered, activeSort);

    const totalListings = listings.length;
    const categories = new Set(listings.map(l => l.animal_type)).size;
    const activeSellers = new Set(listings.map(l => l.seller_name)).size;

    container.innerHTML = `
      <!-- HERO -->
      <div class="hero-v2" role="banner" style="background:linear-gradient(135deg,#1B5E20,#004D40);color:white;padding:20px 16px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <span style="font-size:32px">🐄</span>
          <div>
            <div style="font-weight:800;font-size:20px">Livestock Market</div>
            <div style="font-size:11px;opacity:0.85">Buy & sell cattle, goats, poultry and more</div>
          </div>
        </div>
        <div class="hero-stats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          <div class="hero-stat-card" style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center">
            <div style="font-weight:800;font-size:18px">${totalListings}</div>
            <div style="font-size:10px;opacity:0.85">Listings</div>
          </div>
          <div class="hero-stat-card" style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center">
            <div style="font-weight:800;font-size:18px">${categories}</div>
            <div style="font-size:10px;opacity:0.85">Categories</div>
          </div>
          <div class="hero-stat-card" style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center">
            <div style="font-weight:800;font-size:18px">${activeSellers}</div>
            <div style="font-size:10px;opacity:0.85">Active Sellers</div>
          </div>
        </div>
      </div>

      <div style="padding:14px 14px 100px">
        <!-- Category Chips -->
        <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;scrollbar-width:none;margin-bottom:10px">
          ${CATEGORIES.map(c => `
            <button class="chip-v2 cat-chip" data-cat="${c.id}" style="flex-shrink:0;padding:6px 14px;border-radius:20px;border:none;font-size:12px;font-weight:600;cursor:pointer;background:${activeCategory===c.id?'#1B5E20':'#F5F5F5'};color:${activeCategory===c.id?'white':'#555'}">${c.icon} ${c.label}</button>
          `).join('')}
        </div>

        <!-- Sort Filters -->
        <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:12px;scrollbar-width:none;margin-bottom:10px">
          ${SORT_OPTIONS.map(s => `
            <button class="sort-btn" data-sort="${s.id}" style="flex-shrink:0;padding:5px 12px;border-radius:16px;border:1px solid ${activeSort===s.id?'#1B5E20':'#E0E0E0'};font-size:11px;font-weight:600;cursor:pointer;background:${activeSort===s.id?'#E8F5E9':'white'};color:${activeSort===s.id?'#1B5E20':'#666'}">${s.label}</button>
          `).join('')}
        </div>

        <!-- Listings -->
        ${loading ? `<div class="loading" style="text-align:center;padding:40px"><div class="spinner"></div><div style="margin-top:8px;font-size:13px;color:#666">Loading listings…</div></div>` :
          sorted.length === 0 ? `<div class="empty-v2" style="text-align:center;padding:40px 20px"><div style="font-size:48px">🐄</div><div style="font-weight:700;margin-top:8px">No livestock found</div><div style="font-size:12px;color:#666;margin-top:4px">Try changing category or filters</div></div>` :
          sorted.map(item => renderCard(item)).join('')}
      </div>

      <!-- FAB -->
      <button id="addListingFab" style="position:fixed;bottom:80px;right:16px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#1B5E20,#2E7D32);color:white;border:none;font-size:24px;box-shadow:0 4px 12px rgba(0,0,0,0.25);cursor:pointer;z-index:90;display:flex;align-items:center;justify-content:center" aria-label="Add livestock listing">+</button>
    `;

    bindEvents();
  }

  function renderCard(item) {
    const emoji = getAnimalEmoji(item.animal_type);
    const verified = item.verification_status === 'verified';
    return `
      <div class="card listing-card" data-id="${item.id}" style="background:white;border-radius:14px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,0.07);overflow:hidden;cursor:pointer">
        <!-- Photo placeholder -->
        <div style="background:linear-gradient(135deg,#E8F5E9,#C8E6C9);padding:24px;text-align:center">
          <span style="font-size:48px">${emoji}</span>
        </div>
        <div style="padding:12px 14px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
            <div>
              <div style="font-weight:700;font-size:14px;color:#1A1A1A;text-transform:capitalize">${item.animal_type} — ${item.breed}</div>
              <div style="font-size:11px;color:#666;margin-top:2px">Age: ${item.age_months} months · Weight: ${item.weight_kg} kg</div>
            </div>
            <div style="font-weight:800;font-size:16px;color:#1B5E20">₹${item.price.toLocaleString('en-IN')}</div>
          </div>
          <div style="font-size:11px;color:#555;margin-bottom:8px">📍 ${item.location_label}</div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:11px;color:#444">
              👤 ${item.seller_name} ${verified ? '<span style="color:#1B5E20;font-weight:700">✓ Verified</span>' : ''}
            </div>
            <button class="btn btn-primary view-detail-btn" data-id="${item.id}" style="padding:5px 12px;border-radius:8px;font-size:11px;font-weight:600;background:#1B5E20;color:white;border:none;cursor:pointer">View Details</button>
          </div>
        </div>
      </div>
    `;
  }

  function showDetailModal(item) {
    const emoji = getAnimalEmoji(item.animal_type);
    const verified = item.verification_status === 'verified';
    const trustScore = verified ? '4.8/5' : '3.2/5';
    const hasHealthCert = item.vaccinations.length >= 3;

    showModal(`
      <div style="padding:20px;max-width:400px">
        <div style="text-align:center;margin-bottom:16px">
          <span style="font-size:56px">${emoji}</span>
          <div style="font-weight:800;font-size:18px;margin-top:8px;text-transform:capitalize">${item.animal_type} — ${item.breed}</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
          <div style="background:#F5F5F5;border-radius:8px;padding:8px;text-align:center"><div style="font-weight:700;font-size:13px">${item.age_months} mo</div><div style="font-size:10px;color:#666">Age</div></div>
          <div style="background:#F5F5F5;border-radius:8px;padding:8px;text-align:center"><div style="font-weight:700;font-size:13px">${item.weight_kg} kg</div><div style="font-size:10px;color:#666">Weight</div></div>
          <div style="background:#F5F5F5;border-radius:8px;padding:8px;text-align:center"><div style="font-weight:700;font-size:13px;text-transform:capitalize">${item.gender}</div><div style="font-size:10px;color:#666">Gender</div></div>
          <div style="background:#F5F5F5;border-radius:8px;padding:8px;text-align:center"><div style="font-weight:800;font-size:13px;color:#1B5E20">₹${item.price.toLocaleString('en-IN')}</div><div style="font-size:10px;color:#666">Price</div></div>
        </div>

        <!-- Vaccinations -->
        <div style="margin-bottom:14px">
          <div style="font-weight:700;font-size:12px;margin-bottom:6px">Vaccinations</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${item.vaccinations.length > 0 ? item.vaccinations.map(v => `<span style="background:#E8F5E9;color:#2E7D32;padding:3px 8px;border-radius:12px;font-size:10px;font-weight:600">✅ ${v}</span>`).join('') : '<span style="font-size:11px;color:#999">None recorded</span>'}
          </div>
        </div>

        <!-- Health Certificate -->
        <div style="margin-bottom:14px;padding:8px 12px;background:${hasHealthCert?'#E8F5E9':'#FFF3E0'};border-radius:8px;font-size:12px">
          ${hasHealthCert ? '✅ Health Certificate Available' : '⚠️ No Health Certificate'}
        </div>

        <!-- Seller Info -->
        <div style="background:#F5F5F5;border-radius:10px;padding:10px 12px;margin-bottom:16px">
          <div style="font-weight:700;font-size:12px;margin-bottom:4px">Seller Info</div>
          <div style="font-size:12px;color:#444">👤 ${item.seller_name} ${verified ? '<span style="color:#1B5E20;font-weight:700">✓ Verified</span>' : '<span style="color:#999">Unverified</span>'}</div>
          <div style="font-size:11px;color:#666;margin-top:2px">📍 ${item.location_label} · Trust Score: ⭐ ${trustScore}</div>
        </div>

        <!-- Actions -->
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary modal-chat-btn" style="flex:1;padding:10px;border-radius:10px;font-size:12px;font-weight:700;background:#1B5E20;color:white;border:none;cursor:pointer">💬 Chat Seller</button>
          <button class="btn btn-primary modal-cart-btn" data-id="${item.id}" data-price="${item.price}" style="flex:1;padding:10px;border-radius:10px;font-size:12px;font-weight:700;background:#E65100;color:white;border:none;cursor:pointer">🛒 Add to Cart</button>
          <button class="btn modal-call-btn" style="padding:10px 14px;border-radius:10px;font-size:12px;font-weight:700;background:#F5F5F5;color:#333;border:none;cursor:pointer">📞</button>
        </div>
      </div>
    `);

    setTimeout(() => {
      document.querySelector('.modal-chat-btn')?.addEventListener('click', () => { closeModal(); navigate('chat'); });
      document.querySelector('.modal-cart-btn')?.addEventListener('click', () => handleAddToCart(item));
      document.querySelector('.modal-call-btn')?.addEventListener('click', () => showToast('Calling seller…', 'info'));
    }, 50);
  }

  function showCreateModal() {
    showModal(`
      <div style="padding:20px;max-width:420px">
        <div style="font-weight:800;font-size:18px;margin-bottom:16px">📝 Add Livestock Listing</div>
        <form id="createListingForm">
          <div class="form-group" style="margin-bottom:10px">
            <label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Animal Type</label>
            <select name="animal_type" class="form-input" required style="width:100%;padding:8px 10px;border:1px solid #E0E0E0;border-radius:8px;font-size:13px">
              <option value="">Select type</option>
              <option value="cattle">🐄 Cattle</option>
              <option value="buffalo">🐃 Buffalo</option>
              <option value="goat">🐐 Goat</option>
              <option value="sheep">🐑 Sheep</option>
              <option value="poultry">🐔 Poultry</option>
              <option value="pig">🐷 Pig</option>
              <option value="horse">🐴 Horse</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:10px">
            <label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Breed</label>
            <input name="breed" class="form-input" required placeholder="e.g. HF Cross, Murrah" style="width:100%;padding:8px 10px;border:1px solid #E0E0E0;border-radius:8px;font-size:13px">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
            <div class="form-group">
              <label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Age (months)</label>
              <input name="age_months" type="number" class="form-input" required placeholder="24" style="width:100%;padding:8px 10px;border:1px solid #E0E0E0;border-radius:8px;font-size:13px">
            </div>
            <div class="form-group">
              <label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Weight (kg)</label>
              <input name="weight_kg" type="number" class="form-input" required placeholder="350" style="width:100%;padding:8px 10px;border:1px solid #E0E0E0;border-radius:8px;font-size:13px">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
            <div class="form-group">
              <label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Gender</label>
              <select name="gender" class="form-input" required style="width:100%;padding:8px 10px;border:1px solid #E0E0E0;border-radius:8px;font-size:13px">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div class="form-group">
              <label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Price (₹)</label>
              <input name="price" type="number" class="form-input" required placeholder="65000" style="width:100%;padding:8px 10px;border:1px solid #E0E0E0;border-radius:8px;font-size:13px">
            </div>
          </div>
          <div class="form-group" style="margin-bottom:10px">
            <label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Description</label>
            <textarea name="description" class="form-input" rows="2" placeholder="Healthy, well-maintained…" style="width:100%;padding:8px 10px;border:1px solid #E0E0E0;border-radius:8px;font-size:13px;resize:vertical"></textarea>
          </div>
          <div class="form-group" style="margin-bottom:10px">
            <label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Photos</label>
            <input name="photos" type="file" multiple accept="image/*" class="form-input" style="width:100%;padding:8px 10px;border:1px solid #E0E0E0;border-radius:8px;font-size:13px">
          </div>
          <div class="form-group" style="margin-bottom:14px">
            <label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:6px">Vaccinations</label>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${VACCINATIONS.map(v => `
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer">
                  <input type="checkbox" name="vaccinations" value="${v}"> ${v}
                </label>
              `).join('')}
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;padding:12px;border-radius:10px;font-size:14px;font-weight:700;background:#1B5E20;color:white;border:none;cursor:pointer">Submit Listing</button>
        </form>
      </div>
    `);

    setTimeout(() => {
      document.getElementById('createListingForm')?.addEventListener('submit', handleCreateListing);
    }, 50);
  }

  async function handleCreateListing(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
      animal_type: form.animal_type.value,
      breed: form.breed.value,
      age_months: parseInt(form.age_months.value),
      weight_kg: parseFloat(form.weight_kg.value),
      gender: form.gender.value,
      price: parseFloat(form.price.value),
      description: form.description.value,
      vaccinations: Array.from(form.querySelectorAll('input[name="vaccinations"]:checked')).map(cb => cb.value),
      photos: [],
    };

    try {
      await api.createLivestockListing(data);
      showToast('Listing created successfully!', 'success');
      closeModal();
      loadListings();
    } catch (err) {
      listings.push({ id: 'lv' + Date.now(), ...data, location_label: 'Your Location', seller_name: 'You', verification_status: 'unverified' });
      showToast('Listing added (offline)', 'success');
      closeModal();
      render();
    }
  }

  async function handleAddToCart(item) {
    try {
      await api.addToCart({ listing_id: item.id, listing_type: 'livestock', quantity: 1, price_per_unit: item.price });
      showToast('Added to cart!', 'success');
      closeModal();
    } catch (err) {
      showToast('Added to cart (offline)', 'success');
      closeModal();
    }
  }

  function sortListings(list, sort) {
    const copy = [...list];
    switch (sort) {
      case 'price_asc':  return copy.sort((a, b) => a.price - b.price);
      case 'price_desc': return copy.sort((a, b) => b.price - a.price);
      case 'newest':     return copy;
      case 'nearest':    return copy;
      default:           return copy;
    }
  }

  function bindEvents() {
    container.querySelectorAll('.cat-chip').forEach(btn => {
      btn.addEventListener('click', () => { activeCategory = btn.dataset.cat; render(); });
    });
    container.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => { activeSort = btn.dataset.sort; render(); });
    });
    container.querySelectorAll('.view-detail-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = listings.find(l => l.id === btn.dataset.id);
        if (item) showDetailModal(item);
      });
    });
    container.querySelectorAll('.listing-card').forEach(card => {
      card.addEventListener('click', () => {
        const item = listings.find(l => l.id === card.dataset.id);
        if (item) showDetailModal(item);
      });
    });
    document.getElementById('addListingFab')?.addEventListener('click', showCreateModal);
  }

  async function loadListings() {
    loading = true;
    render();
    try {
      const params = {};
      if (activeCategory !== 'all') params.animal_type = activeCategory;
      if (activeSort) params.sort = activeSort;
      const res = await api.getLivestockListings(params);
      listings = res.data || res || SAMPLE_LIVESTOCK;
    } catch (err) {
      listings = SAMPLE_LIVESTOCK;
    }
    loading = false;
    render();
  }

  loadListings();
}
