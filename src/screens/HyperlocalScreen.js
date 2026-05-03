import { api } from '../api.js';
import { navigate } from '../main.js';

/**
 * HyperlocalScreen — District-Level Hyperlocal Marketplace
 * Solves liquidity problem: matches nearby buyers/sellers for instant deals
 */
export function renderHyperlocal(container) {
  let tab = 'nearby';
  let selectedDistrict = 'Guntur';

  const districts = ['Guntur', 'Krishna', 'Prakasam', 'Nellore', 'Kurnool', 'Anantapur', 'Chittoor', 'West Godavari', 'East Godavari', 'Vizag'];

  function render() {
    container.innerHTML = `
      <div style="background:linear-gradient(135deg,#0D47A1,#1565C0);color:white;padding:24px 16px 32px;border-radius:0 0 20px 20px">
        <h1 style="margin:0;font-size:1.4rem">📍 Hyperlocal Market</h1>
        <p style="margin:4px 0 0;opacity:0.85;font-size:0.85rem">Instant deals with buyers & sellers near you</p>
        <div style="margin-top:12px">
          <select id="districtSelect" style="width:100%;padding:10px;border-radius:8px;border:none;font-size:0.9rem;background:rgba(255,255,255,0.9);color:#333">
            ${districts.map(d => `<option ${d === selectedDistrict ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px">
          <div style="background:rgba(255,255,255,0.15);padding:10px;border-radius:10px;text-align:center">
            <div style="font-size:1.2rem;font-weight:700">34</div>
            <div style="font-size:0.68rem;opacity:0.8">Active Sellers</div>
          </div>
          <div style="background:rgba(255,255,255,0.15);padding:10px;border-radius:10px;text-align:center">
            <div style="font-size:1.2rem;font-weight:700">18</div>
            <div style="font-size:0.68rem;opacity:0.8">Active Buyers</div>
          </div>
          <div style="background:rgba(255,255,255,0.15);padding:10px;border-radius:10px;text-align:center">
            <div style="font-size:1.2rem;font-weight:700">7</div>
            <div style="font-size:0.68rem;opacity:0.8">Deals Today</div>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:0;border-bottom:2px solid #E3F2FD;background:#fff;position:sticky;top:0;z-index:10">
        ${['nearby','instant','traders','post'].map(t => `
          <button onclick="window._hyperTab('${t}')" style="flex:1;padding:12px 4px;border:none;background:${tab===t?'#0D47A1':'transparent'};color:${tab===t?'#fff':'#555'};font-weight:${tab===t?'700':'400'};font-size:0.76rem;cursor:pointer;border-radius:${tab===t?'8px 8px 0 0':'0'}">
            ${{nearby:'📍 Nearby',instant:'⚡ Instant',traders:'🤝 Traders',post:'📢 Post'}[t]}
          </button>
        `).join('')}
      </div>

      <div style="padding:16px" id="hyper-content">
        ${renderTabContent()}
      </div>
    `;

    container.querySelector('#districtSelect')?.addEventListener('change', (e) => {
      selectedDistrict = e.target.value;
      render();
    });
  }

  function renderTabContent() {
    if (tab === 'nearby') return renderNearby();
    if (tab === 'instant') return renderInstant();
    if (tab === 'traders') return renderTraders();
    if (tab === 'post') return renderPost();
    return '';
  }

  function renderNearby() {
    const listings = [
      { type: 'sell', farmer: 'Ramesh (Pedakakani)', crop: 'Paddy Sona Masoori', qty: '40 qtl', price: '₹2,180/qtl', distance: '3 km', time: '2 hrs ago' },
      { type: 'sell', farmer: 'Suresh FPO (Mangalagiri)', crop: 'Cotton MCU-5', qty: '120 qtl', price: '₹6,900/qtl', distance: '8 km', time: '5 hrs ago' },
      { type: 'buy', farmer: 'Krishna Traders', crop: 'Groundnut', qty: '200 qtl', price: '₹5,600/qtl', distance: '5 km', time: '1 hr ago' },
      { type: 'sell', farmer: 'Lakshmi (Tadepalli)', crop: 'Chilli Teja', qty: '15 qtl', price: '₹14,200/qtl', distance: '6 km', time: '30 min ago' },
      { type: 'buy', farmer: 'Balaji Oil Mill', crop: 'Groundnut Bold', qty: '500 qtl', price: '₹5,500/qtl', distance: '12 km', time: '4 hrs ago' },
    ];

    return `
      <div style="margin-bottom:12px;display:flex;gap:8px;overflow-x:auto;padding-bottom:4px">
        ${['All','Paddy','Cotton','Groundnut','Chilli','Vegetables'].map(c => `
          <button style="padding:6px 14px;border-radius:20px;border:1px solid #ddd;background:#fff;font-size:0.78rem;white-space:nowrap;cursor:pointer">${c}</button>
        `).join('')}
      </div>

      ${listings.map(l => `
        <div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);border-left:4px solid ${l.type === 'sell' ? '#43A047' : '#1565C0'}">
          <div style="display:flex;justify-content:space-between;align-items:start">
            <div>
              <span style="padding:2px 8px;border-radius:4px;font-size:0.68rem;font-weight:700;background:${l.type === 'sell' ? '#E8F5E9' : '#E3F2FD'};color:${l.type === 'sell' ? '#1B5E20' : '#0D47A1'}">${l.type === 'sell' ? '🌾 SELLING' : '🛒 BUYING'}</span>
              <div style="font-weight:600;font-size:0.9rem;margin-top:6px">${l.crop}</div>
              <div style="font-size:0.78rem;color:#666;margin-top:2px">${l.farmer}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:700;font-size:0.95rem;color:#E65100">${l.price}</div>
              <div style="font-size:0.72rem;color:#888">${l.qty}</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
            <span style="font-size:0.72rem;color:#888">📍 ${l.distance} away · ${l.time}</span>
            <button style="padding:6px 14px;background:${l.type === 'sell' ? '#1B5E20' : '#0D47A1'};color:#fff;border:none;border-radius:6px;font-size:0.78rem;font-weight:600;cursor:pointer">
              ${l.type === 'sell' ? '🛒 Buy Now' : '🤝 Offer'}
            </button>
          </div>
        </div>
      `).join('')}
    `;
  }

  function renderInstant() {
    return `
      <div style="background:#FFF8E1;border-radius:10px;padding:14px;margin-bottom:16px;border-left:4px solid #FFA000">
        <strong style="font-size:0.85rem">⚡ Instant Match</strong>
        <p style="font-size:0.8rem;color:#555;margin:6px 0 0">AI matches you with the best buyer/seller in your district. Deal closes within hours, not days.</p>
      </div>

      <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <h3 style="margin:0 0 16px;font-size:1rem">Find Instant Match</h3>
        <form id="instantMatchForm">
          <div style="display:flex;gap:12px;margin-bottom:12px">
            <label style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;border:2px solid #1B5E20;border-radius:10px;cursor:pointer;font-size:0.85rem;font-weight:600;color:#1B5E20">
              <input type="radio" name="matchType" value="sell" checked> I want to SELL
            </label>
            <label style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;border:2px solid #1565C0;border-radius:10px;cursor:pointer;font-size:0.85rem;font-weight:600;color:#1565C0">
              <input type="radio" name="matchType" value="buy"> I want to BUY
            </label>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Crop</label>
            <input type="text" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="e.g., Paddy, Cotton">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Quantity (qtl)</label>
              <input type="number" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="50">
            </div>
            <div>
              <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Max Distance (km)</label>
              <input type="number" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="25" value="25">
            </div>
          </div>
          <button type="submit" style="width:100%;padding:14px;background:linear-gradient(135deg,#E65100,#F57C00);color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer">
            ⚡ Find Instant Match
          </button>
        </form>
      </div>
    `;
  }

  function renderTraders() {
    const traders = [
      { name: 'Krishna Traders', type: 'Commission Agent', crops: 'Paddy, Groundnut', deals: 245, rating: 4.7, verified: true },
      { name: 'Sai Balaji Trading', type: 'Direct Buyer', crops: 'Cotton, Chilli', deals: 189, rating: 4.5, verified: true },
      { name: 'Vijaya Lakshmi Mills', type: 'Processor', crops: 'Paddy', deals: 320, rating: 4.8, verified: true },
      { name: 'Raju & Sons', type: 'Wholesaler', crops: 'Vegetables, Fruits', deals: 156, rating: 4.3, verified: false },
    ];

    return `
      <h3 style="margin:0 0 4px;font-size:0.95rem">🤝 Local Traders in ${selectedDistrict}</h3>
      <p style="color:#666;font-size:0.8rem;margin:0 0 16px">Verified traders with proven track records. Relationship-first.</p>
      
      ${traders.map(t => `
        <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05)">
          <div style="display:flex;justify-content:space-between;align-items:start">
            <div>
              <div style="font-weight:600;font-size:0.9rem">${t.name} ${t.verified ? '<span style="background:#E8F5E9;color:#1B5E20;padding:2px 6px;border-radius:4px;font-size:0.65rem;font-weight:700">✓ KYC Verified</span>' : ''}</div>
              <div style="font-size:0.78rem;color:#666;margin-top:2px">${t.type} · Crops: ${t.crops}</div>
              <div style="font-size:0.75rem;color:#888;margin-top:2px">⭐ ${t.rating} · ${t.deals} deals completed</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button style="flex:1;padding:8px;background:#E8F5E9;color:#1B5E20;border:none;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer">📞 Call</button>
            <button style="flex:1;padding:8px;background:#E3F2FD;color:#1565C0;border:none;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer">💬 Message</button>
            <button style="flex:1;padding:8px;background:#FFF3E0;color:#E65100;border:none;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer">📊 History</button>
          </div>
        </div>
      `).join('')}
    `;
  }

  function renderPost() {
    return `
      <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <h3 style="margin:0 0 4px;font-size:1rem">📢 Post to Local Market</h3>
        <p style="color:#666;font-size:0.82rem;margin:0 0 16px">Visible to all buyers/sellers in your district instantly</p>
        <form id="localPostForm">
          <div style="display:flex;gap:12px;margin-bottom:12px">
            <label style="flex:1;text-align:center;padding:12px;border:2px solid #ddd;border-radius:10px;cursor:pointer;font-size:0.85rem">
              <input type="radio" name="postType" value="sell" checked style="display:none"> 🌾 Sell
            </label>
            <label style="flex:1;text-align:center;padding:12px;border:2px solid #ddd;border-radius:10px;cursor:pointer;font-size:0.85rem">
              <input type="radio" name="postType" value="buy" style="display:none"> 🛒 Buy
            </label>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Crop Name</label>
            <input type="text" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="e.g., Paddy Sona Masoori" required>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Quantity (qtl)</label>
              <input type="number" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="50">
            </div>
            <div>
              <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Price (₹/qtl)</label>
              <input type="number" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="2200">
            </div>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Available From</label>
            <input type="date" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px">
          </div>
          <div style="margin-bottom:16px">
            <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">📍 Location / Village</label>
            <input type="text" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="Your village name">
          </div>
          <button type="submit" style="width:100%;padding:14px;background:#0D47A1;color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer">
            📢 Post to ${selectedDistrict} Market
          </button>
        </form>
      </div>
    `;
  }

  window._hyperTab = (t) => { tab = t; render(); };
  render();
}
