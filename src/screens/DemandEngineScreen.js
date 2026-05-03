import { api } from '../api.js';
import { navigate } from '../main.js';

/**
 * DemandEngineScreen — Demand Guarantee Engine
 * Pre-harvest contracts, demand aggregation, institutional buyer matching
 * Solves: "Who will BUY my crop for sure?"
 */
export function renderDemandEngine(container) {
  let tab = 'guaranteed';

  function render() {
    container.innerHTML = `
      <div style="background:linear-gradient(135deg,#E65100,#F57C00);color:white;padding:24px 16px 32px;border-radius:0 0 20px 20px">
        <h1 style="margin:0;font-size:1.4rem">🎯 Demand Engine</h1>
        <p style="margin:4px 0 0;opacity:0.85;font-size:0.85rem">Guaranteed buyers before you harvest</p>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:16px">
          <div style="background:rgba(255,255,255,0.15);padding:12px;border-radius:10px;text-align:center">
            <div style="font-size:1.3rem;font-weight:700">₹2.4Cr</div>
            <div style="font-size:0.7rem;opacity:0.8">Pre-Booked</div>
          </div>
          <div style="background:rgba(255,255,255,0.15);padding:12px;border-radius:10px;text-align:center">
            <div style="font-size:1.3rem;font-weight:700">156</div>
            <div style="font-size:0.7rem;opacity:0.8">Active Buyers</div>
          </div>
          <div style="background:rgba(255,255,255,0.15);padding:12px;border-radius:10px;text-align:center">
            <div style="font-size:1.3rem;font-weight:700">89%</div>
            <div style="font-size:0.7rem;opacity:0.8">Fulfillment</div>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:0;border-bottom:2px solid #FFF3E0;background:#fff;position:sticky;top:0;z-index:10">
        ${['guaranteed','aggregate','institutional','mydemands'].map(t => `
          <button onclick="window._demandTab('${t}')" style="flex:1;padding:12px 4px;border:none;background:${tab===t?'#E65100':'transparent'};color:${tab===t?'#fff':'#555'};font-weight:${tab===t?'700':'400'};font-size:0.72rem;cursor:pointer;border-radius:${tab===t?'8px 8px 0 0':'0'}">
            ${{guaranteed:'🎯 Guaranteed',aggregate:'📦 Aggregate',institutional:'🏢 Buyers',mydemands:'📋 My Demands'}[t]}
          </button>
        `).join('')}
      </div>

      <div style="padding:16px" id="demand-content">
        ${renderTabContent()}
      </div>
    `;
  }

  function renderTabContent() {
    if (tab === 'guaranteed') return renderGuaranteed();
    if (tab === 'aggregate') return renderAggregate();
    if (tab === 'institutional') return renderInstitutional();
    if (tab === 'mydemands') return renderMyDemands();
    return '';
  }

  function renderGuaranteed() {
    const demands = [
      { crop: 'Paddy (Sona Masoori)', buyer: 'Sri Lakshmi Rice Mill', qty: '50 tonnes', price: '₹2,200/qtl', deadline: '15 Dec 2026', status: 'open', advance: '20%' },
      { crop: 'Cotton (MCU-5)', buyer: 'AP Cotton Corp', qty: '100 tonnes', price: '₹6,800/qtl', deadline: '20 Jan 2027', status: 'open', advance: '15%' },
      { crop: 'Groundnut', buyer: 'Balaji Oil Exports', qty: '30 tonnes', price: '₹5,500/qtl', deadline: '10 Nov 2026', status: 'filling', advance: '25%' },
      { crop: 'Chilli (Teja)', buyer: 'Spice World Exports', qty: '20 tonnes', price: '₹14,000/qtl', deadline: '05 Feb 2027', status: 'open', advance: '10%' },
    ];

    return `
      <div style="background:#FFF8E1;border-radius:10px;padding:14px;margin-bottom:16px;border-left:4px solid #F57C00">
        <strong style="font-size:0.85rem">🎯 How Guaranteed Demand Works</strong>
        <p style="font-size:0.8rem;color:#555;margin:6px 0 0">Buyers commit to buy your crop BEFORE harvest at a locked price. You get advance payment. No mandi uncertainty.</p>
      </div>

      <h3 style="margin:0 0 12px;font-size:0.95rem">🔥 Open Demands (Commit Now)</h3>
      ${demands.map(d => `
        <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
          <div style="display:flex;justify-content:space-between;align-items:start">
            <div>
              <div style="font-weight:600;font-size:0.9rem">${d.crop}</div>
              <div style="font-size:0.78rem;color:#666;margin-top:2px">🏢 ${d.buyer}</div>
            </div>
            <span style="padding:4px 10px;border-radius:12px;font-size:0.72rem;font-weight:600;background:${d.status === 'open' ? '#E8F5E9' : '#FFF3E0'};color:${d.status === 'open' ? '#2E7D32' : '#E65100'}">${d.status === 'open' ? '✅ Open' : '⏳ Filling'}</span>
          </div>
          <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:0.78rem">
            <div><span style="color:#888">Qty:</span> ${d.qty}</div>
            <div><span style="color:#888">Price:</span> ${d.price}</div>
            <div><span style="color:#888">Advance:</span> ${d.advance}</div>
          </div>
          <div style="margin-top:6px;font-size:0.75rem;color:#888">⏰ Deadline: ${d.deadline}</div>
          <button style="margin-top:10px;width:100%;padding:10px;background:#E65100;color:#fff;border:none;border-radius:8px;font-size:0.85rem;font-weight:600;cursor:pointer">
            🤝 Commit My Crop
          </button>
        </div>
      `).join('')}
    `;
  }

  function renderAggregate() {
    return `
      <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.06);margin-bottom:16px">
        <h3 style="margin:0 0 4px;font-size:1rem">📦 Demand Aggregation</h3>
        <p style="color:#666;font-size:0.82rem;margin:0 0 16px">Small farmers pool together to meet large buyer requirements</p>
        
        <div style="background:#F3E5F5;border-radius:10px;padding:14px;margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:600;font-size:0.9rem">Paddy Pool — Guntur District</div>
              <div style="font-size:0.78rem;color:#666;margin-top:2px">Target: 200 tonnes · Buyer: ITC Agri</div>
            </div>
          </div>
          <div style="margin-top:10px">
            <div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:4px">
              <span>Progress: 156/200 tonnes (78%)</span>
              <span>32 farmers joined</span>
            </div>
            <div style="background:#E1BEE7;border-radius:6px;height:10px;overflow:hidden">
              <div style="height:100%;width:78%;background:#7B1FA2;border-radius:6px"></div>
            </div>
          </div>
          <button style="margin-top:10px;width:100%;padding:10px;background:#6A1B9A;color:#fff;border:none;border-radius:8px;font-size:0.85rem;font-weight:600;cursor:pointer">
            + Join This Pool (add my quantity)
          </button>
        </div>

        <div style="background:#E3F2FD;border-radius:10px;padding:14px;margin-bottom:12px">
          <div style="font-weight:600;font-size:0.9rem">Cotton Pool — Krishna District</div>
          <div style="font-size:0.78rem;color:#666;margin-top:2px">Target: 100 tonnes · Buyer: Vardhman Textiles</div>
          <div style="margin-top:10px">
            <div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:4px">
              <span>Progress: 45/100 tonnes (45%)</span>
              <span>18 farmers joined</span>
            </div>
            <div style="background:#BBDEFB;border-radius:6px;height:10px;overflow:hidden">
              <div style="height:100%;width:45%;background:#1565C0;border-radius:6px"></div>
            </div>
          </div>
          <button style="margin-top:10px;width:100%;padding:10px;background:#1565C0;color:#fff;border:none;border-radius:8px;font-size:0.85rem;font-weight:600;cursor:pointer">
            + Join This Pool
          </button>
        </div>
      </div>
    `;
  }

  function renderInstitutional() {
    const buyers = [
      { name: 'ITC Agri Business', type: 'Processor', crops: 'Paddy, Wheat, Soybean', volume: '5,000 MT/year', verified: true },
      { name: 'Reliance Fresh', type: 'Retail Chain', crops: 'Vegetables, Fruits', volume: '2,000 MT/year', verified: true },
      { name: 'AP Cotton Corp', type: 'Govt Agency', crops: 'Cotton', volume: '10,000 MT/year', verified: true },
      { name: 'Spice World Exports', type: 'Exporter', crops: 'Chilli, Turmeric', volume: '1,500 MT/year', verified: true },
      { name: 'Heritage Foods', type: 'Dairy/Agri', crops: 'Paddy, Maize', volume: '3,000 MT/year', verified: false },
    ];

    return `
      <h3 style="margin:0 0 12px;font-size:0.95rem">🏢 Institutional Buyers Network</h3>
      <p style="color:#666;font-size:0.82rem;margin:0 0 16px">Verified buyers who guarantee offtake. No mandi dependence.</p>
      
      ${buyers.map(b => `
        <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05)">
          <div style="display:flex;justify-content:space-between;align-items:start">
            <div>
              <div style="font-weight:600;font-size:0.9rem">${b.name} ${b.verified ? '<span style="color:#2E7D32;font-size:0.7rem">✓ Verified</span>' : ''}</div>
              <div style="font-size:0.78rem;color:#666;margin-top:2px">${b.type} · ${b.volume}</div>
              <div style="font-size:0.75rem;color:#888;margin-top:2px">Crops: ${b.crops}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button style="flex:1;padding:8px;background:#E8F5E9;color:#1B5E20;border:none;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer">View Demands</button>
            <button style="flex:1;padding:8px;background:#E3F2FD;color:#1565C0;border:none;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer">Connect</button>
          </div>
        </div>
      `).join('')}
    `;
  }

  function renderMyDemands() {
    return `
      <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <h3 style="margin:0 0 4px">📋 Post Your Crop Availability</h3>
        <p style="color:#666;font-size:0.82rem;margin:0 0 16px">Let buyers know what you're growing — get pre-harvest offers</p>
        <form id="postDemandForm">
          <div style="margin-bottom:12px">
            <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Crop</label>
            <select style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:0.9rem">
              <option>Paddy (Sona Masoori)</option><option>Cotton (MCU-5)</option>
              <option>Groundnut</option><option>Chilli (Teja)</option>
              <option>Maize</option><option>Tomato</option><option>Other</option>
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Expected Quantity (qtl)</label>
              <input type="number" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="50">
            </div>
            <div>
              <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Expected Harvest</label>
              <input type="month" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px">
            </div>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Minimum Expected Price (₹/qtl)</label>
            <input type="number" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="2200">
          </div>
          <div style="margin-bottom:16px">
            <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Your District</label>
            <input type="text" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="e.g., Guntur">
          </div>
          <button type="submit" style="width:100%;padding:14px;background:#E65100;color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer">
            📢 Post Availability
          </button>
        </form>
      </div>
    `;
  }

  window._demandTab = (t) => { tab = t; render(); };
  render();
}
