import { api } from '../api.js';
import { navigate } from '../main.js';

/**
 * ExecutionNetworkScreen — Agri Execution Network Layer
 * Village agents, pickup verification, quality inspection, collection centers
 * This bridges Digital Platform ↔ Real World
 */
export function renderExecutionNetwork(container) {
  let tab = 'overview';

  function render() {
    container.innerHTML = `
      <div style="background:linear-gradient(135deg,#1B5E20,#2E7D32);color:white;padding:24px 16px 32px;border-radius:0 0 20px 20px">
        <h1 style="margin:0;font-size:1.4rem">🌾 Execution Network</h1>
        <p style="margin:4px 0 0;opacity:0.85;font-size:0.85rem">Bridging digital platform with ground reality</p>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:16px">
          <div style="background:rgba(255,255,255,0.15);padding:12px;border-radius:10px;text-align:center">
            <div style="font-size:1.3rem;font-weight:700">248</div>
            <div style="font-size:0.7rem;opacity:0.8">Village Agents</div>
          </div>
          <div style="background:rgba(255,255,255,0.15);padding:12px;border-radius:10px;text-align:center">
            <div style="font-size:1.3rem;font-weight:700">42</div>
            <div style="font-size:0.7rem;opacity:0.8">Collection Centers</div>
          </div>
          <div style="background:rgba(255,255,255,0.15);padding:12px;border-radius:10px;text-align:center">
            <div style="font-size:1.3rem;font-weight:700">96%</div>
            <div style="font-size:0.7rem;opacity:0.8">Pickup Success</div>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:0;border-bottom:2px solid #E8F5E9;background:#fff;position:sticky;top:0;z-index:10">
        ${['overview','verify','quality','centers'].map(t => `
          <button onclick="window._execTab('${t}')" style="flex:1;padding:12px 6px;border:none;background:${tab===t?'#1B5E20':'transparent'};color:${tab===t?'#fff':'#555'};font-weight:${tab===t?'700':'400'};font-size:0.78rem;cursor:pointer;border-radius:${tab===t?'8px 8px 0 0':'0'}">
            ${{overview:'📋 Overview',verify:'✅ Verify Pickup',quality:'🔍 Quality Check',centers:'🏪 Centers'}[t]}
          </button>
        `).join('')}
      </div>

      <div style="padding:16px" id="exec-content">
        ${renderTabContent()}
      </div>
    `;
  }

  function renderTabContent() {
    if (tab === 'overview') return renderOverview();
    if (tab === 'verify') return renderVerifyPickup();
    if (tab === 'quality') return renderQualityCheck();
    if (tab === 'centers') return renderCenters();
    return '';
  }

  function renderOverview() {
    return `
      <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <h3 style="margin:0 0 12px;font-size:1rem">🤝 How It Works</h3>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;gap:12px;align-items:center">
            <div style="width:36px;height:36px;border-radius:50%;background:#E8F5E9;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">1</div>
            <div><strong>Village Agent Assigned</strong><br><span style="font-size:0.82rem;color:#666">Local agent visits farmer for pickup</span></div>
          </div>
          <div style="display:flex;gap:12px;align-items:center">
            <div style="width:36px;height:36px;border-radius:50%;background:#E8F5E9;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">2</div>
            <div><strong>Pickup Verified with OTP + Photo</strong><br><span style="font-size:0.82rem;color:#666">Agent confirms quantity & takes photos</span></div>
          </div>
          <div style="display:flex;gap:12px;align-items:center">
            <div style="width:36px;height:36px;border-radius:50%;background:#E8F5E9;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">3</div>
            <div><strong>Quality Inspection at Center</strong><br><span style="font-size:0.82rem;color:#666">Moisture, grade, weight verified</span></div>
          </div>
          <div style="display:flex;gap:12px;align-items:center">
            <div style="width:36px;height:36px;border-radius:50%;background:#E8F5E9;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">4</div>
            <div><strong>Dispute Resolution</strong><br><span style="font-size:0.82rem;color:#666">Physical verification for any conflicts</span></div>
          </div>
        </div>
      </div>

      <h3 style="margin:16px 0 8px;font-size:0.95rem">📍 Nearby Agents</h3>
      ${[
        { name: 'Rajesh Kumar', village: 'Pedakakani', type: 'Pickup', rating: 4.8, tasks: 156 },
        { name: 'Suresh Reddy', village: 'Mangalagiri', type: 'Quality', rating: 4.6, tasks: 89 },
        { name: 'Lakshmi Devi', village: 'Tadepalli', type: 'Onboarding', rating: 4.9, tasks: 234 },
      ].map(agent => `
        <div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:600;font-size:0.9rem">${agent.name}</div>
            <div style="font-size:0.78rem;color:#666">📍 ${agent.village} · ${agent.type} Agent</div>
            <div style="font-size:0.75rem;color:#888">⭐ ${agent.rating} · ${agent.tasks} tasks done</div>
          </div>
          <button style="padding:8px 14px;background:#1B5E20;color:#fff;border:none;border-radius:8px;font-size:0.78rem;cursor:pointer">Request</button>
        </div>
      `).join('')}

      <h3 style="margin:16px 0 8px;font-size:0.95rem">📊 Today's Execution</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="background:#E8F5E9;padding:14px;border-radius:10px;text-align:center">
          <div style="font-size:1.4rem;font-weight:700;color:#1B5E20">18</div>
          <div style="font-size:0.75rem;color:#555">Pickups Verified</div>
        </div>
        <div style="background:#E3F2FD;padding:14px;border-radius:10px;text-align:center">
          <div style="font-size:1.4rem;font-weight:700;color:#1565C0">12</div>
          <div style="font-size:0.75rem;color:#555">Quality Checks</div>
        </div>
        <div style="background:#FFF3E0;padding:14px;border-radius:10px;text-align:center">
          <div style="font-size:1.4rem;font-weight:700;color:#E65100">3</div>
          <div style="font-size:0.75rem;color:#555">Disputes Raised</div>
        </div>
        <div style="background:#F3E5F5;padding:14px;border-radius:10px;text-align:center">
          <div style="font-size:1.4rem;font-weight:700;color:#6A1B9A">7</div>
          <div style="font-size:0.75rem;color:#555">Assisted Txns</div>
        </div>
      </div>
    `;
  }

  function renderVerifyPickup() {
    return `
      <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <h3 style="margin:0 0 4px">✅ Pickup Verification</h3>
        <p style="color:#666;font-size:0.82rem;margin:0 0 16px">Agent verifies physical pickup with OTP, photos & weight</p>
        <form id="verifyPickupForm">
          <div style="margin-bottom:12px">
            <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Order / Delivery ID</label>
            <input type="text" id="vfOrderId" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:0.9rem" placeholder="Enter order ID" required>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Farmer OTP (shared by farmer)</label>
            <input type="text" id="vfOtp" maxlength="6" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:0.9rem;letter-spacing:4px;text-align:center" placeholder="● ● ● ● ● ●" required>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Actual Weight (kg)</label>
              <input type="number" id="vfWeight" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="500">
            </div>
            <div>
              <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">No. of Bags</label>
              <input type="number" id="vfBags" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="10">
            </div>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">📸 Upload Pickup Photo</label>
            <input type="file" accept="image/*" capture="environment" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:8px">
          </div>
          <div style="margin-bottom:16px">
            <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Notes</label>
            <textarea rows="2" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:0.9rem" placeholder="Any observations..."></textarea>
          </div>
          <button type="submit" style="width:100%;padding:14px;background:#1B5E20;color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer">
            ✅ Verify & Confirm Pickup
          </button>
        </form>
      </div>

      <div style="margin-top:16px;background:#FFF8E1;border-radius:10px;padding:14px;border-left:4px solid #FFA000">
        <strong style="font-size:0.85rem">💡 Verification ensures:</strong>
        <ul style="margin:6px 0 0;padding-left:18px;font-size:0.8rem;color:#555">
          <li>Farmer confirms pickup happened (OTP)</li>
          <li>Weight matches order quantity (±5% tolerance)</li>
          <li>Photo evidence for dispute prevention</li>
          <li>GPS location logged automatically</li>
        </ul>
      </div>
    `;
  }

  function renderQualityCheck() {
    return `
      <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <h3 style="margin:0 0 4px">🔍 Quality Inspection</h3>
        <p style="color:#666;font-size:0.82rem;margin:0 0 16px">Physical quality verification at collection center</p>
        <form id="qualityForm">
          <div style="margin-bottom:12px">
            <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Delivery / Lot ID</label>
            <input type="text" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:0.9rem" placeholder="Enter lot ID" required>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Crop Type</label>
            <select style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:0.9rem">
              <option>Paddy</option><option>Cotton</option><option>Groundnut</option>
              <option>Chilli</option><option>Maize</option><option>Tomato</option>
              <option>Shrimp</option><option>Other</option>
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Moisture %</label>
              <input type="number" step="0.1" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="14.5">
            </div>
            <div>
              <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Foreign Matter %</label>
              <input type="number" step="0.1" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="1.2">
            </div>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">Grade Assigned</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${['A (Premium)','B (Good)','C (Fair)','D (Below Avg)'].map(g => `
                <label style="display:flex;align-items:center;gap:4px;padding:8px 12px;border:1px solid #ddd;border-radius:8px;cursor:pointer;font-size:0.82rem">
                  <input type="radio" name="grade" value="${g.split(' ')[0]}"> ${g}
                </label>
              `).join('')}
            </div>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:0.82rem;color:#555;display:block;margin-bottom:4px">📸 Sample Photos</label>
            <input type="file" accept="image/*" multiple capture="environment" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:8px">
          </div>
          <div style="margin-bottom:16px">
            <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem">
              <input type="checkbox" checked> Quality meets buyer requirements
            </label>
          </div>
          <button type="submit" style="width:100%;padding:14px;background:#1565C0;color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer">
            🔍 Submit Quality Report
          </button>
        </form>
      </div>
    `;
  }

  function renderCenters() {
    const centers = [
      { name: 'Guntur Collection Hub', type: 'Primary', capacity: '500 MT', utilization: 72, crops: 'Paddy, Cotton, Chilli' },
      { name: 'Mangalagiri Center', type: 'Secondary', capacity: '200 MT', utilization: 45, crops: 'Groundnut, Maize' },
      { name: 'Tenali FPO Warehouse', type: 'FPO', capacity: '150 MT', utilization: 88, crops: 'Paddy' },
      { name: 'Vijayawada Cold Storage', type: 'Cold Chain', capacity: '100 MT', utilization: 65, crops: 'Vegetables, Fruits' },
    ];

    return `
      <h3 style="margin:0 0 12px;font-size:0.95rem">🏪 Collection Centers & Warehouses</h3>
      ${centers.map(c => `
        <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05)">
          <div style="display:flex;justify-content:space-between;align-items:start">
            <div>
              <div style="font-weight:600;font-size:0.9rem">${c.name}</div>
              <div style="font-size:0.78rem;color:#666;margin-top:2px">${c.type} · Capacity: ${c.capacity}</div>
              <div style="font-size:0.75rem;color:#888;margin-top:2px">Crops: ${c.crops}</div>
            </div>
            <span style="padding:4px 10px;border-radius:12px;font-size:0.72rem;font-weight:600;background:${c.utilization > 80 ? '#FFEBEE' : c.utilization > 60 ? '#FFF3E0' : '#E8F5E9'};color:${c.utilization > 80 ? '#C62828' : c.utilization > 60 ? '#E65100' : '#2E7D32'}">${c.utilization}% full</span>
          </div>
          <div style="margin-top:10px;background:#f5f5f5;border-radius:6px;height:8px;overflow:hidden">
            <div style="height:100%;width:${c.utilization}%;background:${c.utilization > 80 ? '#EF5350' : c.utilization > 60 ? '#FFA726' : '#66BB6A'};border-radius:6px"></div>
          </div>
        </div>
      `).join('')}

      <button style="width:100%;padding:14px;background:#fff;border:2px dashed #1B5E20;color:#1B5E20;border-radius:10px;font-size:0.9rem;font-weight:600;cursor:pointer;margin-top:8px">
        + Register New Collection Center
      </button>
    `;
  }

  window._execTab = (t) => { tab = t; render(); };
  render();
}
