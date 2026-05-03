import { api } from '../api.js';
import { navigate } from '../main.js';

/**
 * VoiceAssistScreen — Voice & WhatsApp Workflows
 * Handles offline reality: voice input, WhatsApp-first, assisted mode
 * Farmers don't type — they speak
 */
export function renderVoiceAssist(container) {
  let tab = 'voice';
  let isListening = false;
  let transcript = '';

  function render() {
    container.innerHTML = `
      <div style="background:linear-gradient(135deg,#4527A0,#7B1FA2);color:white;padding:24px 16px 32px;border-radius:0 0 20px 20px">
        <h1 style="margin:0;font-size:1.4rem">🎙️ Voice & Assist</h1>
        <p style="margin:4px 0 0;opacity:0.85;font-size:0.85rem">Speak to trade, check prices, or get help</p>
        <div style="margin-top:16px;display:flex;gap:12px">
          <div style="flex:1;background:rgba(255,255,255,0.15);padding:10px;border-radius:10px;text-align:center">
            <div style="font-size:1.1rem">🗣️</div>
            <div style="font-size:0.7rem;opacity:0.8">Voice Input</div>
          </div>
          <div style="flex:1;background:rgba(255,255,255,0.15);padding:10px;border-radius:10px;text-align:center">
            <div style="font-size:1.1rem">💬</div>
            <div style="font-size:0.7rem;opacity:0.8">WhatsApp</div>
          </div>
          <div style="flex:1;background:rgba(255,255,255,0.15);padding:10px;border-radius:10px;text-align:center">
            <div style="font-size:1.1rem">🤝</div>
            <div style="font-size:0.7rem;opacity:0.8">Agent Assist</div>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:0;border-bottom:2px solid #F3E5F5;background:#fff;position:sticky;top:0;z-index:10">
        ${['voice','whatsapp','assisted','ivr'].map(t => `
          <button onclick="window._voiceTab('${t}')" style="flex:1;padding:12px 4px;border:none;background:${tab===t?'#4527A0':'transparent'};color:${tab===t?'#fff':'#555'};font-weight:${tab===t?'700':'400'};font-size:0.76rem;cursor:pointer;border-radius:${tab===t?'8px 8px 0 0':'0'}">
            ${{voice:'🎙️ Voice',whatsapp:'💬 WhatsApp',assisted:'🤝 Assisted',ivr:'📞 IVR'}[t]}
          </button>
        `).join('')}
      </div>

      <div style="padding:16px" id="voice-content">
        ${renderTabContent()}
      </div>
    `;
  }

  function renderTabContent() {
    if (tab === 'voice') return renderVoice();
    if (tab === 'whatsapp') return renderWhatsApp();
    if (tab === 'assisted') return renderAssisted();
    if (tab === 'ivr') return renderIVR();
    return '';
  }

  function renderVoice() {
    return `
      <div style="text-align:center;padding:20px 0">
        <div id="voiceBtn" style="width:120px;height:120px;border-radius:50%;background:${isListening ? 'linear-gradient(135deg,#C62828,#EF5350)' : 'linear-gradient(135deg,#4527A0,#7B1FA2)'};margin:0 auto;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,0.2);animation:${isListening ? 'pulse 1.5s infinite' : 'none'}">
          <span style="font-size:3rem">${isListening ? '⏹️' : '🎙️'}</span>
        </div>
        <p style="margin-top:16px;font-size:0.9rem;color:#555">${isListening ? 'Listening... speak now' : 'Tap to speak in Telugu, Hindi, or English'}</p>
        ${transcript ? `<div style="margin-top:12px;background:#f5f5f5;padding:12px;border-radius:10px;text-align:left;font-size:0.85rem">"${transcript}"</div>` : ''}
      </div>

      <div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06);margin-top:16px">
        <h3 style="margin:0 0 12px;font-size:0.95rem">🗣️ What you can say:</h3>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${[
            { text: '"నా వరి ధర ఎంత?" (What is paddy price?)', lang: 'Telugu' },
            { text: '"మేరా कपास बेचना है" (I want to sell cotton)', lang: 'Hindi' },
            { text: '"Book a pickup for tomorrow"', lang: 'English' },
            { text: '"నా లోన్ స్టేటస్ చెప్పు" (Tell my loan status)', lang: 'Telugu' },
            { text: '"मौसम कैसा रहेगा?" (How will weather be?)', lang: 'Hindi' },
          ].map(ex => `
            <div style="padding:10px;background:#F3E5F5;border-radius:8px;font-size:0.82rem">
              <span style="color:#4527A0">${ex.text}</span>
              <span style="float:right;font-size:0.7rem;color:#888">${ex.lang}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="background:#E8F5E9;border-radius:12px;padding:16px;margin-top:12px">
        <h4 style="margin:0 0 8px;font-size:0.9rem">✅ Voice Actions Available</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.78rem">
          <div>📊 Check market prices</div>
          <div>🛒 Place sell/buy orders</div>
          <div>🚚 Schedule pickups</div>
          <div>💰 Check wallet balance</div>
          <div>🌤️ Weather updates</div>
          <div>🏛️ Scheme eligibility</div>
          <div>📝 Log farm activity</div>
          <div>🆘 Raise support ticket</div>
        </div>
      </div>

      <style>
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(198,40,40,0.4); }
          70% { box-shadow: 0 0 0 20px rgba(198,40,40,0); }
          100% { box-shadow: 0 0 0 0 rgba(198,40,40,0); }
        }
      </style>
    `;
  }

  function renderWhatsApp() {
    return `
      <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <div style="text-align:center;margin-bottom:16px">
          <div style="font-size:3rem;margin-bottom:8px">💬</div>
          <h3 style="margin:0 0 4px;font-size:1.1rem">WhatsApp-First Workflows</h3>
          <p style="color:#666;font-size:0.82rem">Trade, track orders, get prices — all via WhatsApp</p>
        </div>

        <div style="background:#DCF8C6;border-radius:12px;padding:16px;margin-bottom:12px">
          <p style="font-size:0.82rem;margin:0 0 8px"><strong>How it works:</strong></p>
          <p style="font-size:0.8rem;color:#333;margin:0">Save our number → Send any message → Get instant response</p>
        </div>

        <h4 style="margin:16px 0 8px;font-size:0.9rem">📱 WhatsApp Commands:</h4>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${[
            { cmd: 'PRICE paddy', desc: 'Get latest paddy mandi price' },
            { cmd: 'SELL cotton 50qtl', desc: 'List cotton for sale' },
            { cmd: 'TRACK order123', desc: 'Track your delivery' },
            { cmd: 'BALANCE', desc: 'Check wallet balance' },
            { cmd: 'WEATHER', desc: 'Get 5-day forecast' },
            { cmd: 'HELP', desc: 'Get all command list' },
          ].map(c => `
            <div style="display:flex;gap:12px;align-items:center;padding:10px;background:#f9f9f9;border-radius:8px">
              <code style="background:#E8F5E9;padding:4px 8px;border-radius:4px;font-size:0.78rem;font-weight:600;white-space:nowrap">${c.cmd}</code>
              <span style="font-size:0.8rem;color:#555">${c.desc}</span>
            </div>
          `).join('')}
        </div>

        <a href="https://wa.me/919876543210?text=HELP" target="_blank" style="display:block;margin-top:16px;padding:14px;background:#25D366;color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:600;text-align:center;text-decoration:none;cursor:pointer">
          💬 Open WhatsApp Bot
        </a>
      </div>
    `;
  }

  function renderAssisted() {
    return `
      <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.06);margin-bottom:16px">
        <h3 style="margin:0 0 4px;font-size:1rem">🤝 Agent-Assisted Mode</h3>
        <p style="color:#666;font-size:0.82rem;margin:0 0 16px">Village agent does the transaction on behalf of the farmer</p>

        <div style="background:#FFF8E1;border-radius:10px;padding:14px;margin-bottom:16px;border-left:4px solid #FFA000">
          <strong style="font-size:0.82rem">How Agent-Assisted works:</strong>
          <ol style="margin:8px 0 0;padding-left:18px;font-size:0.8rem;color:#555">
            <li>Farmer tells agent what to do (verbally)</li>
            <li>Agent logs into assisted mode</li>
            <li>Agent executes transaction for farmer</li>
            <li>Farmer confirms via OTP/thumbprint</li>
            <li>Both get transaction receipt</li>
          </ol>
        </div>

        <h4 style="margin:0 0 12px;font-size:0.9rem">Quick Assisted Actions:</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${[
            { icon: '🌾', label: 'Sell Crop', desc: 'List farmer crop' },
            { icon: '🛒', label: 'Buy Inputs', desc: 'Order seeds/fert' },
            { icon: '💰', label: 'Check Balance', desc: 'Wallet + dues' },
            { icon: '📝', label: 'Apply Scheme', desc: 'Govt schemes' },
            { icon: '🚚', label: 'Book Pickup', desc: 'Transport' },
            { icon: '🏦', label: 'Loan Apply', desc: 'Credit request' },
          ].map(a => `
            <button style="padding:14px;background:#f9f9f9;border:1px solid #eee;border-radius:10px;cursor:pointer;text-align:left">
              <div style="font-size:1.2rem;margin-bottom:4px">${a.icon}</div>
              <div style="font-weight:600;font-size:0.82rem">${a.label}</div>
              <div style="font-size:0.72rem;color:#888">${a.desc}</div>
            </button>
          `).join('')}
        </div>
      </div>

      <div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <h4 style="margin:0 0 8px;font-size:0.9rem">📋 Assisted Transaction Log</h4>
        ${[
          { farmer: 'Ramesh Kumar', action: 'Sold Paddy 20qtl', time: '2 hrs ago', status: 'confirmed' },
          { farmer: 'Lakshmi Devi', action: 'Applied PM-KISAN', time: '3 hrs ago', status: 'pending' },
          { farmer: 'Suresh Reddy', action: 'Booked Pickup', time: '5 hrs ago', status: 'confirmed' },
        ].map(t => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f0f0f0">
            <div>
              <div style="font-size:0.82rem;font-weight:600">${t.farmer}</div>
              <div style="font-size:0.75rem;color:#666">${t.action} · ${t.time}</div>
            </div>
            <span style="padding:4px 8px;border-radius:4px;font-size:0.68rem;background:${t.status === 'confirmed' ? '#E8F5E9' : '#FFF3E0'};color:${t.status === 'confirmed' ? '#1B5E20' : '#E65100'}">${t.status}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderIVR() {
    return `
      <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <div style="text-align:center;margin-bottom:16px">
          <div style="font-size:3rem;margin-bottom:8px">📞</div>
          <h3 style="margin:0 0 4px;font-size:1.1rem">IVR / Missed Call Services</h3>
          <p style="color:#666;font-size:0.82rem">No internet? No problem. Just give a missed call.</p>
        </div>

        <h4 style="margin:16px 0 8px;font-size:0.9rem">📱 Missed Call Numbers:</h4>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${[
            { number: '1800-XXX-0001', service: 'Mandi Prices (SMS back)', icon: '📊' },
            { number: '1800-XXX-0002', service: 'Weather Alert', icon: '🌤️' },
            { number: '1800-XXX-0003', service: 'Sell Crop (agent callback)', icon: '🌾' },
            { number: '1800-XXX-0004', service: 'Scheme Status', icon: '🏛️' },
            { number: '1800-XXX-0005', service: 'Loan Status', icon: '💰' },
          ].map(s => `
            <div style="display:flex;gap:12px;align-items:center;padding:12px;background:#f9f9f9;border-radius:10px">
              <span style="font-size:1.3rem">${s.icon}</span>
              <div style="flex:1">
                <div style="font-weight:600;font-size:0.85rem">${s.service}</div>
                <div style="font-size:0.78rem;color:#4527A0;font-family:monospace">${s.number}</div>
              </div>
              <button style="padding:8px 12px;background:#4527A0;color:#fff;border:none;border-radius:8px;font-size:0.75rem;cursor:pointer">Call</button>
            </div>
          `).join('')}
        </div>

        <div style="margin-top:16px;background:#F3E5F5;border-radius:10px;padding:14px">
          <p style="margin:0;font-size:0.82rem;color:#4527A0"><strong>📡 Works without internet!</strong></p>
          <p style="margin:6px 0 0;font-size:0.78rem;color:#555">Give missed call → Get SMS with info within 30 seconds. Available in Telugu, Hindi, English.</p>
        </div>
      </div>
    `;
  }

  window._voiceTab = (t) => { tab = t; render(); };

  // Handle voice button click
  container.addEventListener('click', (e) => {
    if (e.target.closest('#voiceBtn')) {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        isListening = !isListening;
        if (isListening) {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.lang = 'te-IN'; // Telugu default, can be changed
          recognition.continuous = false;
          recognition.onresult = (event) => {
            transcript = event.results[0][0].transcript;
            isListening = false;
            render();
          };
          recognition.onerror = () => { isListening = false; render(); };
          recognition.onend = () => { isListening = false; render(); };
          recognition.start();
        }
        render();
      } else {
        alert('Voice recognition not supported in this browser. Use Chrome or Edge.');
      }
    }
  });

  render();
}
