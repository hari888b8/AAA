const API = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('agrihub_token');
  }

  setToken(t) {
    this.token = t;
    if (t) localStorage.setItem('agrihub_token', t);
    else localStorage.removeItem('agrihub_token');
  }

  async req(method, path, body) {
    const h = { 'Content-Type': 'application/json' };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    const opts = { method, headers: h };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(`${API}${path}`, opts);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `Error ${r.status}`);
    return data;
  }

  get(p) { return this.req('GET', p); }
  post(p, b) { return this.req('POST', p, b); }
  patch(p, b) { return this.req('PATCH', p, b); }
  del(p) { return this.req('DELETE', p); }

  // Auth
  sendOtp(phone) { return this.post('/auth/send-otp', { phone }); }
  verifyOtp(phone, otp, name, role) { return this.post('/auth/verify-otp', { phone, otp, name, role }); }
  getMe() { return this.get('/auth/me'); }
  updateMe(d) { return this.patch('/auth/me', d); }
  logout() { return this.post('/auth/logout', { refreshToken: localStorage.getItem('agrihub_refresh') }).catch(() => {}); }

  // AgriFlow
  getListings(params = '') { return this.get(`/agriflow/listings${params}`); }
  getListing(id) { return this.get(`/agriflow/listings/${id}`); }
  createListing(d) { return this.post('/agriflow/listings', d); }
  getCrops() { return this.get('/agriflow/crops'); }
  getDistricts() { return this.get('/agriflow/districts'); }
  getDeclarations() { return this.get('/agriflow/declarations'); }
  createDeclaration(d) { return this.post('/agriflow/declarations', d); }
  getInquiries() { return this.get('/agriflow/inquiries'); }
  createInquiry(d) { return this.post('/agriflow/inquiries', d); }

  // AquaOS
  getPonds() { return this.get('/aquaos/ponds'); }
  createPond(d) { return this.post('/aquaos/ponds', d); }
  updatePond(id, d) { return this.patch(`/aquaos/ponds/${id}`, d); }
  logWater(id, d) { return this.post(`/aquaos/ponds/${id}/water-log`, d); }
  getWaterLogs(id) { return this.get(`/aquaos/ponds/${id}/water-logs`); }
  getAdvisories(params = '') { return this.get(`/aquaos/advisories${params}`); }
  getAquaStats() { return this.get('/aquaos/stats'); }
  getHarvestListings(params = '') { return this.get(`/aquaos/harvest-listings${params}`); }
  createHarvestListing(d) { return this.post('/aquaos/harvest-listings', d); }

  // KisanConnect
  getEquipment(params = '') { return this.get(`/kisanconnect/equipment${params}`); }
  createEquipment(d) { return this.post('/kisanconnect/equipment', d); }
  bookEquipment(id, d) { return this.post(`/kisanconnect/equipment/${id}/book`, d); }
  getJobs(params = '') { return this.get(`/kisanconnect/jobs${params}`); }
  createJob(d) { return this.post('/kisanconnect/jobs', d); }
  applyJob(id, d) { return this.post(`/kisanconnect/jobs/${id}/apply`, d); }
  getKisanStats() { return this.get('/kisanconnect/stats'); }

  // FarmerConnect
  getProperties(params = '') { return this.get(`/farmerconnect/properties${params}`); }
  createProperty(d) { return this.post('/farmerconnect/properties', d); }
  getProperty(id) { return this.get(`/farmerconnect/properties/${id}`); }
  updateProperty(id, d) { return this.patch(`/farmerconnect/properties/${id}`, d); }
  getFCStats() { return this.get('/farmerconnect/stats'); }

  // Intelligence
  getPrices(params = '') { return this.get(`/intelligence/prices${params}`); }
  getSupplyDemand() { return this.get('/intelligence/supply-demand'); }
  getDistrictHeatmap() { return this.get('/intelligence/district-heatmap'); }
  getPlatformStats() { return this.get('/intelligence/platform-stats'); }
  getCropRecommendations(params = '') { return this.get(`/intelligence/crop-recommendations${params}`); }
  getActivityFeed() { return this.get('/intelligence/activity-feed'); }

  // Community
  getPosts(params = '') { return this.get(`/community/posts${params}`); }
  getPost(id) { return this.get(`/community/posts/${id}`); }
  createPost(d) { return this.post('/community/posts', d); }
  likePost(id) { return this.post(`/community/posts/${id}/like`); }
  getComments(id) { return this.get(`/community/posts/${id}/comments`); }
  addComment(id, d) { return this.post(`/community/posts/${id}/comments`, d); }

  // Orders
  getOrders(params = '') { return this.get(`/orders${params}`); }
  getOrder(id) { return this.get(`/orders/${id}`); }
  createOrder(d) { return this.post('/orders', d); }
  updateOrderStatus(id, d) { return this.patch(`/orders/${id}/status`, d); }

  // Weather
  getForecast(params = '') { return this.get(`/weather/forecast${params}`); }
  getWeatherAdvisory() { return this.get('/weather/advisory'); }
  getCropHealth(params = '') { return this.get(`/weather/crop-health${params}`); }

  // Notifications (dedicated router)
  getNotifications(params = '') { return this.get(`/notifications${params}`); }
  markRead(id) { return this.patch(`/notifications/${id}/read`); }
  markAllRead() { return this.patch('/notifications/mark-all-read'); }

  // Farmer profile & dashboard
  getFarmerProfile() { return this.get('/farmer/profile'); }
  updateFarmerProfile(d) { return this.post('/farmer/profile', d); }
  getFarmerStats() { return this.get('/farmer/stats'); }
  getHarvestCalendar() { return this.get('/farmer/harvest-calendar'); }
  getMyListings() { return this.get('/farmer/my-listings'); }
  getMyInquiries() { return this.get('/farmer/my-inquiries'); }

  // FPO management
  getFPOProfile() { return this.get('/fpo/profile'); }
  updateFPOProfile(d) { return this.post('/fpo/profile', d); }
  getFPOMembers() { return this.get('/fpo/members'); }
  addFPOMember(d) { return this.post('/fpo/members', d); }
  getFPOProcurement() { return this.get('/fpo/procurement'); }
  recordProcurement(d) { return this.post('/fpo/procurement', d); }
  getFPOInventory() { return this.get('/fpo/inventory'); }
  addInventory(d) { return this.post('/fpo/inventory', d); }
  getFPOSupplyListings() { return this.get('/fpo/supply-listings'); }
  createSupplyListing(d) { return this.post('/fpo/supply-listings', d); }
  getFPOStats() { return this.get('/fpo/stats'); }

  // Buyer intelligence
  getBuyerProfile() { return this.get('/buyer/profile'); }
  updateBuyerProfile(d) { return this.post('/buyer/profile', d); }
  supplySearch(params = '') { return this.get(`/buyer/supply-search${params}`); }
  getBuyerInquiries() { return this.get('/buyer/inquiries'); }
  createBuyerInquiry(d) { return this.post('/buyer/inquiries', d); }
  getWatchlist() { return this.get('/buyer/watchlist'); }
  addWatchlist(d) { return this.post('/buyer/watchlist', d); }
  removeWatchlist(id) { return this.del(`/buyer/watchlist/${id}`); }
  getBuyerIntelligence() { return this.get('/buyer/intelligence'); }
  getBuyerStats() { return this.get('/buyer/stats'); }
}

export const api = new ApiClient();
