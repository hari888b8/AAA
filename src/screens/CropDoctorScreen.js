import { api } from '../api.js';
import { showToast, showModal, closeModal } from '../app-shell.js';
import { t } from '../i18n.js';

// ═══════════════════════════════════════════════════════════════
// CROP DOCTOR — AI Disease Detection Screen
// Camera-based crop disease identification with treatment advice
// ═══════════════════════════════════════════════════════════════
export function renderCropDoctor(container) {
  let loading = false;
  let tab = 'scan'; // scan | history | outbreaks | guide
  let detectionResult = null;
  let history = [];
  let outbreaks = [];
  let availableCrops = [];
  let selectedCrop = 'rice';

  async function loadCrops() {
    try {
      const data = await api.getCropDoctorCrops();
      availableCrops = data.crops || [];
      draw();
    } catch (e) { /* use defaults */ }
  }

  async function loadHistory() {
    try {
      const data = await api.getCropDoctorHistory();
      history = data.detections || [];
      draw();
    } catch (e) { showToast('Failed to load history', 'error'); }
  }

  async function loadOutbreaks() {
    try {
      const data = await api.getCropDoctorOutbreaks();
      outbreaks = data.outbreaks || [];
      draw();
    } catch (e) { showToast('Failed to load outbreaks', 'error'); }
  }

  async function analyzeDisease(symptoms) {
    try {
      loading = true; detectionResult = null; draw();
      const result = await api.analyzeCropDisease({
        crop_name: selectedCrop,
        symptoms_text: symptoms,
      });
      detectionResult = result.detection;
      loading = false;
      tab = 'scan';
      draw();
    } catch (e) { loading = false; showToast('Analysis failed', 'error'); draw(); }
  }

  function showScanModal() {
    showModal(`
      <div style="padding:20px;">
        <h3 style="margin:0 0 16px;font-size:18px;color:#333;">🔬 Describe Symptoms</h3>
        <div style="margin-bottom:12px;">
          <label style="font-size:12px;color:#666;display:block;margin-bottom:6px;">Select Crop</label>
          <select id="cropSelect" style="width:100%;padding:10px;border-radius:8px;border:1px solid #ddd;font-size:14px;">
            ${(availableCrops.length ? availableCrops : [
              { id: 'rice', name: 'Rice' },
              { id: 'tomato', name: 'Tomato' },
              { id: 'cotton', name: 'Cotton' },
              { id: 'chilli', name: 'Chilli' },
              { id: 'groundnut', name: 'Groundnut' },
            ]).map(c => `<option value="${c.id}" ${c.id === selectedCrop ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div style="margin-bottom:12px;">
          <label style="font-size:12px;color:#666;display:block;margin-bottom:6px;">Describe what you see (symptoms)</label>
          <textarea id="symptomsInput" rows="4" placeholder="e.g., Yellow spots on leaves, wilting, brown edges..."
            style="width:100%;padding:10px;border-radius:8px;border:1px solid #ddd;font-size:14px;resize:none;box-sizing:border-box;"></textarea>
        </div>
        <div style="background:#FFF3E0;border-radius:8px;padding:10px;margin-bottom:16px;font-size:11px;color:#E65100;">
          💡 Tip: Describe leaf color changes, spot shapes, affected plant parts, and any insects you see
        </div>
        <button onclick="window._cdAnalyze()" style="width:100%;padding:14px;border:none;border-radius:10px;background:#2E7D32;color:#fff;font-size:15px;font-weight:600;cursor:pointer;">
          🔬 Analyze Disease
        </button>
      </div>
    `);
  }

  function showReportModal() {
    showModal(`
      <div style="padding:20px;">
        <h3 style="margin:0 0 16px;font-size:18px;color:#333;">⚠️ Report Disease in Your Area</h3>
        <div style="margin-bottom:12px;">
          <label style="font-size:12px;color:#666;display:block;margin-bottom:6px;">Crop</label>
          <input id="reportCrop" value="${selectedCrop}" style="width:100%;padding:10px;border-radius:8px;border:1px solid #ddd;font-size:14px;box-sizing:border-box;">
        </div>
        <div style="margin-bottom:12px;">
          <label style="font-size:12px;color:#666;display:block;margin-bottom:6px;">Disease Name</label>
          <input id="reportDisease" placeholder="e.g., Blast, Blight, Thrips..." style="width:100%;padding:10px;border-radius:8px;border:1px solid #ddd;font-size:14px;box-sizing:border-box;">
        </div>
        <div style="margin-bottom:12px;">
          <label style="font-size:12px;color:#666;display:block;margin-bottom:6px;">Description</label>
          <textarea id="reportDesc" rows="3" placeholder="Describe severity and spread..."
            style="width:100%;padding:10px;border-radius:8px;border:1px solid #ddd;font-size:14px;resize:none;box-sizing:border-box;"></textarea>
        </div>
        <button onclick="window._cdReport()" style="width:100%;padding:14px;border:none;border-radius:10px;background:#D32F2F;color:#fff;font-size:15px;font-weight:600;cursor:pointer;">
          📢 Alert Community
        </button>
      </div>
    `);
  }

  function switchTab(newTab) {
    tab = newTab;
    if (newTab === 'history' && !history.length) loadHistory();
    if (newTab === 'outbreaks' && !outbreaks.length) loadOutbreaks();
    draw();
  }

  function draw() {
    container.innerHTML = `
      <div style="padding:16px;max-width:600px;margin:0 auto;">
        <!-- Hero -->
        <div style="background:linear-gradient(135deg,#2E7D32,#66BB6A);border-radius:16px;padding:24px;color:#fff;margin-bottom:16px;">
          <div style="font-size:20px;font-weight:700;">🩺 Crop Doctor</div>
          <div style="font-size:13px;margin-top:6px;opacity:0.9;">AI-powered disease detection & treatment advice</div>
          <div style="display:flex;gap:8px;margin-top:16px;">
            <button onclick="window._cdScan()" style="flex:1;padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.95);color:#2E7D32;font-weight:600;font-size:13px;cursor:pointer;">
              📸 Scan Crop
            </button>
            <button onclick="window._cdReportModal()" style="flex:1;padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.2);color:#fff;font-weight:600;font-size:13px;cursor:pointer;border:1px solid rgba(255,255,255,0.4);">
              ⚠️ Report Disease
            </button>
          </div>
        </div>

        <!-- Tabs -->
        <div style="display:flex;gap:4px;margin-bottom:16px;overflow-x:auto;">
          ${['scan', 'history', 'outbreaks', 'guide'].map(t => `
            <button onclick="window._cdTab('${t}')" style="flex:1;min-width:75px;padding:10px 6px;border-radius:10px;border:none;font-size:11px;font-weight:600;cursor:pointer;
              background:${tab === t ? '#E8F5E9' : '#f5f5f5'};color:${tab === t ? '#2E7D32' : '#666'};">
              ${{ scan: '🔬 Results', history: '📜 History', outbreaks: '🚨 Alerts', guide: '📖 Guide' }[t]}
            </button>
          `).join('')}
        </div>

        <!-- Content -->
        ${loading ? '<div style="text-align:center;padding:40px;"><div style="font-size:40px;animation:pulse 1s infinite;">🔬</div><div style="color:#888;margin-top:8px;">Analyzing...</div></div>' : ''}
        ${!loading && tab === 'scan' ? renderScanResult() : ''}
        ${tab === 'history' ? renderHistoryTab() : ''}
        ${tab === 'outbreaks' ? renderOutbreaksTab() : ''}
        ${tab === 'guide' ? renderGuide() : ''}
      </div>
      <style>@keyframes pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.1); } }</style>
    `;
  }

  function renderScanResult() {
    if (!detectionResult) return `
      <div style="text-align:center;padding:40px;">
        <div style="font-size:56px;">🌱</div>
        <div style="font-size:15px;font-weight:500;color:#333;margin-top:12px;">Ready to Diagnose</div>
        <div style="font-size:13px;color:#888;margin-top:4px;">Tap "Scan Crop" to identify diseases</div>
      </div>
    `;

    const d = detectionResult;
    const severityColors = { critical: '#D32F2F', high: '#E65100', medium: '#F57F17', low: '#388E3C' };

    return `
      <!-- Detection Result -->
      <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);border-top:4px solid ${severityColors[d.disease.severity]};">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:16px;font-weight:700;color:#333;">🦠 ${d.disease.name}</div>
            ${d.disease.name_te ? `<div style="font-size:12px;color:#888;">${d.disease.name_te}</div>` : ''}
          </div>
          <div style="text-align:right;">
            <div style="font-size:20px;font-weight:700;color:${severityColors[d.disease.severity]};">${d.disease.confidence}%</div>
            <div style="font-size:10px;color:#888;">confidence</div>
          </div>
        </div>
        <div style="margin-top:8px;display:inline-block;background:${severityColors[d.disease.severity]}15;color:${severityColors[d.disease.severity]};font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;">
          ${d.disease.severity.toUpperCase()} SEVERITY
        </div>
      </div>

      ${d.outbreak_alert ? `
        <div style="background:#FFEBEE;border-radius:10px;padding:12px;margin-bottom:12px;border:1px solid #FFCDD2;">
          <div style="font-size:13px;font-weight:600;color:#C62828;">🚨 ${d.outbreak_alert.message}</div>
        </div>
      ` : ''}

      <!-- Symptoms -->
      <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <h4 style="margin:0 0 8px;font-size:14px;color:#333;">🔍 Symptoms</h4>
        ${d.symptoms.map(s => `<div style="font-size:12px;color:#555;padding:4px 0;">• ${s}</div>`).join('')}
      </div>

      <!-- Treatment -->
      <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <h4 style="margin:0 0 10px;font-size:14px;color:#333;">💊 Treatment</h4>
        ${d.treatment.map(t => `
          <div style="background:${t.type === 'organic' ? '#F1F8E9' : '#FFF8E1'};border-radius:8px;padding:10px;margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;">
              <div style="font-size:13px;font-weight:600;color:#333;">${t.name}</div>
              <span style="font-size:10px;background:${t.type === 'organic' ? '#81C784' : '#FFB74D'};color:#fff;padding:2px 6px;border-radius:4px;">${t.type}</span>
            </div>
            <div style="font-size:11px;color:#666;margin-top:4px;">📏 ${t.dosage}</div>
            <div style="font-size:11px;color:#888;margin-top:2px;">⏰ ${t.timing}</div>
          </div>
        `).join('')}
      </div>

      <!-- Prevention -->
      <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <h4 style="margin:0 0 8px;font-size:14px;color:#333;">🛡️ Prevention</h4>
        ${d.prevention.map(p => `<div style="font-size:12px;color:#555;padding:4px 0;">✓ ${p}</div>`).join('')}
      </div>

      <!-- Local Products -->
      ${d.local_products?.length ? `
        <div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <h4 style="margin:0 0 8px;font-size:14px;color:#333;">🏪 Available Products</h4>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${d.local_products.map(p => `<span style="background:#E3F2FD;color:#1565C0;font-size:11px;padding:5px 10px;border-radius:6px;">${p}</span>`).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }

  function renderHistoryTab() {
    if (!history.length) return '<div style="text-align:center;padding:40px;color:#888;">No previous scans. Diagnose your first crop!</div>';
    return history.map(det => `
      <div style="background:#fff;border-radius:10px;padding:12px;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,0.06);display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:13px;font-weight:500;color:#333;">${det.disease_name || 'Unknown'}</div>
          <div style="font-size:11px;color:#888;">${det.crop_name} • ${new Date(det.created_at).toLocaleDateString('en-IN')}</div>
        </div>
        <div style="font-size:12px;font-weight:600;color:${{ critical:'#D32F2F', high:'#E65100', medium:'#F57F17', low:'#388E3C' }[det.severity] || '#888'};">
          ${det.confidence || '-'}%
        </div>
      </div>
    `).join('');
  }

  function renderOutbreaksTab() {
    if (!outbreaks.length) return '<div style="text-align:center;padding:40px;color:#888;">🎉 No active outbreaks in your area!</div>';
    return outbreaks.map(ob => `
      <div style="background:#fff;border-radius:10px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.08);border-left:4px solid ${{ critical:'#D32F2F', high:'#E65100', medium:'#F57F17' }[ob.severity] || '#888'};">
        <div style="font-size:14px;font-weight:600;color:#333;">🦠 ${ob.disease_name}</div>
        <div style="font-size:12px;color:#666;margin-top:4px;">Crop: ${ob.crop_name} • ${ob.district_name || 'Your area'}</div>
        <div style="display:flex;gap:12px;margin-top:8px;font-size:11px;color:#888;">
          <span>👥 ${ob.affected_farmers} farmers affected</span>
          <span>📅 ${new Date(ob.latest_report).toLocaleDateString('en-IN')}</span>
        </div>
      </div>
    `).join('');
  }

  function renderGuide() {
    return `
      <div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <h3 style="margin:0 0 12px;font-size:15px;color:#333;">📖 How to Use Crop Doctor</h3>
        ${[
          { step: '1', icon: '📸', title: 'Capture or Describe', desc: 'Take a photo or describe symptoms of affected plant' },
          { step: '2', icon: '🔬', title: 'AI Analysis', desc: 'Our AI identifies the disease with confidence score' },
          { step: '3', icon: '💊', title: 'Get Treatment', desc: 'Receive specific treatment and prevention advice' },
          { step: '4', icon: '🏪', title: 'Buy Products', desc: 'Find recommended products at local agri-input shops' },
          { step: '5', icon: '📢', title: 'Alert Others', desc: 'Report outbreaks to warn nearby farmers' },
        ].map(s => `
          <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #f5f5f5;">
            <div style="width:32px;height:32px;border-radius:50%;background:#E8F5E9;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">${s.icon}</div>
            <div>
              <div style="font-size:13px;font-weight:500;color:#333;">${s.title}</div>
              <div style="font-size:11px;color:#888;">${s.desc}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Expose handlers
  window._cdTab = switchTab;
  window._cdScan = showScanModal;
  window._cdReportModal = showReportModal;
  window._cdAnalyze = () => {
    const crop = document.getElementById('cropSelect')?.value || 'rice';
    const symptoms = document.getElementById('symptomsInput')?.value;
    if (!symptoms) { showToast('Please describe symptoms', 'error'); return; }
    selectedCrop = crop;
    closeModal();
    analyzeDisease(symptoms);
  };
  window._cdReport = async () => {
    const crop = document.getElementById('reportCrop')?.value;
    const disease = document.getElementById('reportDisease')?.value;
    const desc = document.getElementById('reportDesc')?.value;
    if (!crop || !disease) { showToast('Crop and disease name required', 'error'); return; }
    try {
      await api.reportCropDisease({ crop_name: crop, disease_name: disease, description: desc });
      closeModal();
      showToast('✅ Disease reported. Community alerted!', 'success');
    } catch (e) { showToast(e.message || 'Report failed', 'error'); }
  };

  loadCrops();
  draw();
}
