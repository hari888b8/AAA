import { api } from '../api.js';
import { showToast, navigate } from '../app-shell.js';
import { getState } from '../store.js';
import { t } from '../i18n.js';

/**
 * VehiclesScreen — Register & find transport vehicles
 * Browse vehicles, register new ones, manage availability
 */

const SAMPLE_VEHICLES = [
  { id:'sv1', vehicle_type:'tractor', registration_number:'AP-09-AB-1234', capacity_kg:2000, pricing_per_km:15, rating:4.7, availability_status:'available', location_label:'Guntur, AP', owner_name:'Ramesh' },
  { id:'sv2', vehicle_type:'mini_truck', registration_number:'AP-07-CD-5678', capacity_kg:3000, pricing_per_km:12, rating:4.5, availability_status:'available', location_label:'Krishna, AP', owner_name:'Suresh' },
  { id:'sv3', vehicle_type:'pickup', registration_number:'AP-05-EF-9012', capacity_kg:800, pricing_per_km:10, rating:4.8, availability_status:'busy', location_label:'Prakasam, AP', owner_name:'Venkat' },
  { id:'sv4', vehicle_type:'bike', registration_number:'AP-39-GH-3456', capacity_kg:20, pricing_per_km:5, rating:4.9, availability_status:'available', location_label:'Nellore, AP', owner_name:'Raju' },
  { id:'sv5', vehicle_type:'truck', registration_number:'AP-02-IJ-7890', capacity_kg:8000, pricing_per_km:20, rating:4.3, availability_status:'available', location_label:'Kurnool, AP', owner_name:'Krishna' },
  { id:'sv6', vehicle_type:'three_wheeler', registration_number:'AP-11-KL-2345', capacity_kg:500, pricing_per_km:7, rating:4.6, availability_status:'available', location_label:'Chittoor, AP', owner_name:'Anil' },
];

export function renderVehicles(container) {
  let tab = 'browse'; // browse | register | my_vehicles
  let vehicles = [];
  let myVehicles = [];
  let loading = true;
  let filterType = 'all';

  const VEHICLE_ICONS = {
    tractor: '🚜', mini_truck: '🚛', bike: '🏍️', pickup: '🚗', truck: '🚚', three_wheeler: '🛺'
  };

  const VEHICLE_LABELS = {
    tractor: 'Tractor', mini_truck: 'Mini Truck', bike: 'Bike', pickup: 'Pickup', truck: 'Truck', three_wheeler: 'Three Wheeler'
  };

  function getStatusBadge(status) {
    const map = {
      available: { color: '#4CAF50', bg: '#E8F5E9', label: '● Available' },
      busy: { color: '#FF9800', bg: '#FFF3E0', label: '● Busy' },
      offline: { color: '#9E9E9E', bg: '#F5F5F5', label: '● Offline' }
    };
    const s = map[status] || map.offline;
    return `<span style="background:${s.bg};color:${s.color};padding:3px 10px;border-radius:20px;font-size:.72rem;font-weight:600">${s.label}</span>`;
  }

  function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    return '★'.repeat(full) + (half ? '½' : '') + `<span style="color:#aaa">${'☆'.repeat(5 - full - half)}</span>`;
  }

  async function loadData() {
    loading = true;
    render();
    try {
      if (tab === 'browse') {
        const res = await api.get('/vehicles');
        vehicles = (res.vehicles && res.vehicles.length) ? res.vehicles : SAMPLE_VEHICLES;
      } else if (tab === 'my_vehicles') {
        const res = await api.get('/vehicles/my');
        myVehicles = (res.vehicles && res.vehicles.length) ? res.vehicles : [];
      }
    } catch {
      if (tab === 'browse') vehicles = SAMPLE_VEHICLES;
      if (tab === 'my_vehicles') myVehicles = [];
    }
    loading = false;
    render();
  }

  function render() {
    container.innerHTML = `
      <div class="hero-v2" role="banner" style="background:linear-gradient(135deg,#1976D2,#3949AB);color:white">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:2rem">🚗</span>
          <div><h1 style="margin:0;font-size:1.3rem">Vehicle Network</h1>
          <p style="margin:2px 0 0;opacity:.85;font-size:.85rem">Register & find transport vehicles</p></div>
        </div>
      </div>

      <div style="display:flex;gap:0;border-bottom:2px solid #E3F2FD;background:#fff;position:sticky;top:0;z-index:10">
        ${['browse', 'register', 'my_vehicles'].map(t => `
          <button onclick="window._vehTab('${t}')" style="flex:1;padding:12px 8px;border:none;background:${tab===t?'#1976D2':'transparent'};color:${tab===t?'#fff':'#555'};font-weight:${tab===t?'700':'400'};font-size:.82rem;cursor:pointer;border-radius:${tab===t?'8px 8px 0 0':'0'}">
            ${{browse:'🔍 Browse',register:'➕ Register',my_vehicles:'🚗 My Vehicles'}[t]}
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
    if (tab === 'register') return renderRegister();
    if (tab === 'my_vehicles') return renderMyVehicles();
    return '';
  }

  function renderBrowse() {
    const types = [
      { key: 'all', icon: '🔍', label: 'All' },
      { key: 'tractor', icon: '🚜', label: 'Tractor' },
      { key: 'mini_truck', icon: '🚛', label: 'Mini Truck' },
      { key: 'bike', icon: '🏍️', label: 'Bike' },
      { key: 'pickup', icon: '🚗', label: 'Pickup' },
      { key: 'truck', icon: '🚚', label: 'Truck' },
      { key: 'three_wheeler', icon: '🛺', label: 'Three Wheeler' }
    ];

    const filtered = filterType === 'all' ? vehicles : vehicles.filter(v => v.vehicle_type === filterType);

    return `
      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:12px;margin-bottom:12px">
        ${types.map(tp => `
          <button onclick="window._vehFilter('${tp.key}')" style="white-space:nowrap;padding:8px 14px;border:none;background:${filterType===tp.key?'#1976D2':'#E3F2FD'};color:${filterType===tp.key?'#fff':'#333'};border-radius:20px;font-size:.78rem;cursor:pointer;font-weight:${filterType===tp.key?'600':'400'}">
            ${tp.icon} ${tp.label}
          </button>
        `).join('')}
      </div>
      ${!filtered.length ? '<div style="text-align:center;padding:40px;color:#888">No vehicles found</div>' : filtered.map(v => `
        <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-size:1.8rem">${VEHICLE_ICONS[v.vehicle_type] || '🚗'}</span>
              <div>
                <div style="font-weight:600;font-size:.95rem">${VEHICLE_LABELS[v.vehicle_type] || v.vehicle_type}</div>
                <div style="font-size:.8rem;color:#666">${v.registration_number}</div>
              </div>
            </div>
            ${getStatusBadge(v.availability_status)}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px">
            <div style="text-align:center;padding:8px;background:#F5F5F5;border-radius:8px">
              <div style="font-size:.72rem;color:#888">Capacity</div>
              <div style="font-weight:600;font-size:.85rem">${v.capacity_kg} kg</div>
            </div>
            <div style="text-align:center;padding:8px;background:#F5F5F5;border-radius:8px">
              <div style="font-size:.72rem;color:#888">Price/km</div>
              <div style="font-weight:600;font-size:.85rem">₹${v.pricing_per_km}</div>
            </div>
            <div style="text-align:center;padding:8px;background:#F5F5F5;border-radius:8px">
              <div style="font-size:.72rem;color:#888">Rating</div>
              <div style="font-weight:600;font-size:.85rem">${v.rating} ⭐</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">
            <span style="font-size:.8rem;color:#666">📍 ${v.location_label} • ${v.owner_name}</span>
            ${v.availability_status === 'available' ? `<button onclick="window._vehBook('${v.id}')" style="padding:8px 16px;background:#1976D2;color:#fff;border:none;border-radius:8px;font-size:.8rem;cursor:pointer;font-weight:600">Book Transport</button>` : ''}
          </div>
        </div>
      `).join('')}
    `;
  }

  function renderRegister() {
    return `
      <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <h3 style="margin:0 0 16px">➕ Register Vehicle</h3>
        <form id="vehicleRegForm">
          <div style="margin-bottom:12px">
            <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Vehicle Type</label>
            <select id="vehType" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:.9rem">
              <option value="tractor">🚜 Tractor</option>
              <option value="mini_truck">🚛 Mini Truck</option>
              <option value="bike">🏍️ Bike</option>
              <option value="pickup">🚗 Pickup</option>
              <option value="truck">🚚 Truck</option>
              <option value="three_wheeler">🛺 Three Wheeler</option>
            </select>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Registration Number</label>
            <input id="vehRegNo" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:.9rem" placeholder="AP-09-AB-1234">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Capacity (kg)</label>
              <input id="vehCapacity" type="number" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="2000">
            </div>
            <div>
              <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Price per km (₹)</label>
              <input id="vehPriceKm" type="number" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="15">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Price per hour (₹)</label>
              <input id="vehPriceHr" type="number" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="200">
            </div>
            <div>
              <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Pricing Model</label>
              <select id="vehPricingModel" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:.9rem">
                <option value="per_km">Per Kilometer</option>
                <option value="per_hour">Per Hour</option>
                <option value="fixed">Fixed Rate</option>
              </select>
            </div>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Location</label>
            <input id="vehLocation" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:.9rem" placeholder="Guntur, AP">
          </div>
          <button type="submit" style="width:100%;padding:14px;background:#1976D2;color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer">
            🚗 Register Vehicle
          </button>
        </form>
      </div>
    `;
  }

  function renderMyVehicles() {
    if (!myVehicles.length) return '<div style="text-align:center;padding:40px;color:#888">🚗 No vehicles registered yet.<br><small>Register a vehicle to manage it here.</small></div>';
    return myVehicles.map(v => `
      <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:1.5rem">${VEHICLE_ICONS[v.vehicle_type] || '🚗'}</span>
            <div>
              <div style="font-weight:600">${VEHICLE_LABELS[v.vehicle_type] || v.vehicle_type}</div>
              <div style="font-size:.8rem;color:#666">${v.registration_number}</div>
            </div>
          </div>
          ${getStatusBadge(v.availability_status)}
        </div>
        <div style="margin-top:12px;display:flex;gap:8px">
          <button onclick="window._vehToggle('${v.id}','available')" style="flex:1;padding:10px;border:none;background:${v.availability_status==='available'?'#4CAF50':'#E8F5E9'};color:${v.availability_status==='available'?'#fff':'#4CAF50'};border-radius:8px;font-size:.82rem;cursor:pointer;font-weight:600">
            ✓ Available
          </button>
          <button onclick="window._vehToggle('${v.id}','offline')" style="flex:1;padding:10px;border:none;background:${v.availability_status==='offline'?'#9E9E9E':'#F5F5F5'};color:${v.availability_status==='offline'?'#fff':'#9E9E9E'};border-radius:8px;font-size:.82rem;cursor:pointer;font-weight:600">
            ○ Offline
          </button>
        </div>
      </div>
    `).join('');
  }

  // Event handlers
  window._vehTab = (t) => { tab = t; loadData(); };
  window._vehFilter = (type) => { filterType = type; render(); };

  window._vehBook = async (id) => {
    showToast('Booking request sent! Vehicle owner will confirm shortly.', 'success');
  };

  window._vehToggle = async (id, status) => {
    try {
      await api.patch(`/vehicles/${id}`, { availability_status: status });
      showToast(`Vehicle set to ${status}`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update', 'error');
    }
  };

  container.addEventListener('submit', async (e) => {
    if (e.target.id === 'vehicleRegForm') {
      e.preventDefault();
      const vehicle_type = container.querySelector('#vehType')?.value;
      const registration_number = container.querySelector('#vehRegNo')?.value;
      const capacity_kg = container.querySelector('#vehCapacity')?.value;
      const pricing_per_km = container.querySelector('#vehPriceKm')?.value;
      const pricing_per_hour = container.querySelector('#vehPriceHr')?.value;
      const pricing_model = container.querySelector('#vehPricingModel')?.value;
      const location_label = container.querySelector('#vehLocation')?.value;

      if (!registration_number || !capacity_kg) {
        return showToast('Please fill registration number and capacity', 'error');
      }

      try {
        await api.post('/vehicles', {
          vehicle_type,
          registration_number,
          capacity_kg: Number(capacity_kg),
          pricing_per_km: pricing_per_km ? Number(pricing_per_km) : null,
          pricing_per_hour: pricing_per_hour ? Number(pricing_per_hour) : null,
          pricing_model,
          location_label
        });
        showToast('Vehicle registered successfully!', 'success');
        tab = 'my_vehicles';
        loadData();
      } catch (err) {
        showToast(err.message || 'Registration failed', 'error');
      }
    }
  });

  loadData();
}
