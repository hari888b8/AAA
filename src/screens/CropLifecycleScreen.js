import { api } from '../api.js';
import { navigate } from '../main.js';

/**
 * CropLifecycleScreen — Closed-Loop Ecosystem
 * Input credit → Grow → Sell → Repay → Repeat
 * Ties finance + trade + inputs into one continuous loop
 */
export function renderCropLifecycle(container) {
  let activeStep = null;

  function render() {
    container.innerHTML = `
      <div style="background:linear-gradient(135deg,#2E7D32,#43A047);color:white;padding:24px 16px 32px;border-radius:0 0 20px 20px">
        <h1 style="margin:0;font-size:1.4rem">🔄 Crop Lifecycle</h1>
        <p style="margin:4px 0 0;opacity:0.85;font-size:0.85rem">Complete loop: Buy Inputs → Grow → Sell → Get Paid → Repeat</p>
      </div>

      <div style="padding:16px">
        <!-- Lifecycle Visual -->
        <div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.08);margin-bottom:16px">
          <h3 style="margin:0 0 16px;font-size:0.95rem;text-align:center">🔄 Your Active Crop Cycles</h3>
          
          <div style="position:relative;display:flex;flex-direction:column;gap:0">
            ${[
              { step: 1, icon: '🌱', title: 'Buy Inputs (Credit)', desc: 'Seeds, fertilizer on input credit', status: 'completed', value: '₹45,000 credit used' },
              { step: 2, icon: '🚜', title: 'Growing Phase', desc: 'Monitor crop with satellite + diary', status: 'active', value: 'Day 65 of 120' },
              { step: 3, icon: '🌾', title: 'Harvest & Sell', desc: 'Sell via demand engine or local market', status: 'upcoming', value: 'Est. ₹1,80,000' },
              { step: 4, icon: '💰', title: 'Get Paid', desc: 'Escrow releases payment to wallet', status: 'upcoming', value: '' },
              { step: 5, icon: '🏦', title: 'Auto-Repay Credit', desc: 'Input credit deducted automatically', status: 'upcoming', value: 'Auto-debit ₹45,000' },
              { step: 6, icon: '🔄', title: 'Next Cycle', desc: 'Higher credit limit for next season', status: 'upcoming', value: 'New limit: ₹60,000' },
            ].map(s => `
              <div onclick="window._cycleStep(${s.step})" style="display:flex;gap:12px;padding:12px;border-radius:10px;cursor:pointer;background:${activeStep === s.step ? '#E8F5E9' : 'transparent'};border:${s.status === 'active' ? '2px solid #43A047' : '1px solid #f0f0f0'};margin-bottom:8px;position:relative">
                <div style="width:40px;height:40px;border-radius:50%;background:${s.status === 'completed' ? '#43A047' : s.status === 'active' ? '#FFA726' : '#E0E0E0'};display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;color:${s.status === 'upcoming' ? '#999' : '#fff'}">
                  ${s.status === 'completed' ? '✓' : s.icon}
                </div>
                <div style="flex:1">
                  <div style="font-weight:600;font-size:0.85rem;color:${s.status === 'upcoming' ? '#999' : '#333'}">${s.title}</div>
                  <div style="font-size:0.75rem;color:#888">${s.desc}</div>
                  ${s.value ? `<div style="font-size:0.75rem;color:${s.status === 'active' ? '#E65100' : '#2E7D32'};font-weight:600;margin-top:2px">${s.value}</div>` : ''}
                </div>
                <span style="font-size:0.7rem;padding:2px 8px;border-radius:10px;align-self:center;background:${s.status === 'completed' ? '#E8F5E9' : s.status === 'active' ? '#FFF3E0' : '#f5f5f5'};color:${s.status === 'completed' ? '#1B5E20' : s.status === 'active' ? '#E65100' : '#999'}">${s.status}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Active Cycle Summary -->
        <div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06);margin-bottom:16px">
          <h3 style="margin:0 0 12px;font-size:0.95rem">📊 Current Cycle: Paddy (Kharif 2026)</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div style="background:#E8F5E9;padding:12px;border-radius:10px;text-align:center">
              <div style="font-size:0.7rem;color:#555">Input Cost</div>
              <div style="font-size:1.1rem;font-weight:700;color:#1B5E20">₹45,000</div>
            </div>
            <div style="background:#FFF3E0;padding:12px;border-radius:10px;text-align:center">
              <div style="font-size:0.7rem;color:#555">Expected Revenue</div>
              <div style="font-size:1.1rem;font-weight:700;color:#E65100">₹1,80,000</div>
            </div>
            <div style="background:#E3F2FD;padding:12px;border-radius:10px;text-align:center">
              <div style="font-size:0.7rem;color:#555">Expected Profit</div>
              <div style="font-size:1.1rem;font-weight:700;color:#1565C0">₹1,35,000</div>
            </div>
            <div style="background:#F3E5F5;padding:12px;border-radius:10px;text-align:center">
              <div style="font-size:0.7rem;color:#555">Days to Harvest</div>
              <div style="font-size:1.1rem;font-weight:700;color:#6A1B9A">55</div>
            </div>
          </div>
        </div>

        <!-- Input Credit Section -->
        <div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06);margin-bottom:16px">
          <h3 style="margin:0 0 8px;font-size:0.95rem">🌱 Input Credit (Buy Now, Pay After Harvest)</h3>
          <p style="font-size:0.8rem;color:#666;margin:0 0 12px">Get seeds, fertilizer, pesticides on credit. Auto-repay from crop sale.</p>
          
          <div style="background:#E8F5E9;border-radius:10px;padding:14px;margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-size:0.8rem;color:#555">Available Input Credit</div>
                <div style="font-size:1.3rem;font-weight:700;color:#1B5E20">₹60,000</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:0.8rem;color:#555">Used</div>
                <div style="font-size:1rem;font-weight:600;color:#E65100">₹45,000</div>
              </div>
            </div>
            <div style="margin-top:8px;background:#C8E6C9;border-radius:6px;height:8px;overflow:hidden">
              <div style="height:100%;width:75%;background:#2E7D32;border-radius:6px"></div>
            </div>
            <div style="font-size:0.72rem;color:#888;margin-top:4px">75% utilized · Auto-repay on next sale</div>
          </div>

          <button style="width:100%;padding:12px;background:#1B5E20;color:#fff;border:none;border-radius:10px;font-size:0.9rem;font-weight:600;cursor:pointer">
            🛒 Buy Inputs on Credit
          </button>
        </div>

        <!-- Connected Services -->
        <div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
          <h3 style="margin:0 0 12px;font-size:0.95rem">🔗 Connected to Your Cycle</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            ${[
              { icon: '📓', label: 'Farm Diary', desc: 'Track activities', route: 'farmdiary' },
              { icon: '🛰️', label: 'Satellite', desc: 'Monitor health', route: 'satellite' },
              { icon: '🎯', label: 'Demand Engine', desc: 'Pre-sell crop', route: 'demandengine' },
              { icon: '💰', label: 'Finance', desc: 'Loans & credit', route: 'finance' },
              { icon: '🌤️', label: 'Weather', desc: 'Alerts & forecast', route: 'weather' },
              { icon: '🚚', label: 'Logistics', desc: 'Book transport', route: 'logistics' },
            ].map(s => `
              <button onclick="window._navTo && window._navTo('${s.route}')" style="padding:12px;background:#f9f9f9;border:1px solid #eee;border-radius:10px;cursor:pointer;text-align:left">
                <div style="font-size:1.1rem;margin-bottom:4px">${s.icon}</div>
                <div style="font-weight:600;font-size:0.8rem">${s.label}</div>
                <div style="font-size:0.7rem;color:#888">${s.desc}</div>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Start New Cycle -->
        <button style="width:100%;margin-top:16px;padding:14px;background:linear-gradient(135deg,#2E7D32,#43A047);color:#fff;border:none;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(46,125,50,0.3)">
          🔄 Start New Crop Cycle
        </button>
      </div>
    `;
  }

  window._cycleStep = (step) => { activeStep = step; render(); };
  window._navTo = (route) => { navigate(route); };
  render();
}
