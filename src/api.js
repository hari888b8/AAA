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
  updateProfile(d) { return this.patch('/auth/me', d); }
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

  // AquaOS — Farms
  getAquaFarms() { return this.get('/aquaos/farms'); }
  createAquaFarm(d) { return this.post('/aquaos/farms', d); }
  updateAquaFarm(id, d) { return this.patch(`/aquaos/farms/${id}`, d); }

  // AquaOS — Crop Cycles
  getCropCycles(pondId) { return this.get(`/aquaos/ponds/${pondId}/crop-cycles`); }
  startCropCycle(pondId, d) { return this.post(`/aquaos/ponds/${pondId}/crop-cycles`, d); }
  updateCropCycle(id, d) { return this.patch(`/aquaos/crop-cycles/${id}`, d); }

  // AquaOS — Mortality
  logMortality(pondId, d) { return this.post(`/aquaos/ponds/${pondId}/mortality`, d); }
  getMortalityLogs(pondId) { return this.get(`/aquaos/ponds/${pondId}/mortality`); }

  // AquaOS — Dashboard & Advisory
  getAquaDashboard() { return this.get('/aquaos/dashboard'); }
  getAquaAdvisory() { return this.get('/aquaos/advisory'); }

  // AquaOS — Offers
  getAquaOffers(params = '') { return this.get(`/aquaos/offers${params}`); }
  createAquaOffer(d) { return this.post('/aquaos/offers', d); }
  respondAquaOffer(id, d) { return this.patch(`/aquaos/offers/${id}`, d); }

  // AquaOS — Prices & Supply
  getAquaPrices(params = '') { return this.get(`/aquaos/prices${params}`); }
  getAquaSupplyForecast() { return this.get('/aquaos/supply-forecast'); }
  getMyAquaListings() { return this.get('/aquaos/my-listings'); }

  // AquaOS — Messaging
  getAquaConversations() { return this.get('/aquaos/conversations'); }
  getAquaMessages(listingId, withUser) { return this.get(`/aquaos/messages?listing_id=${listingId}&with_user=${withUser}`); }
  sendAquaMessage(d) { return this.post('/aquaos/messages', d); }

  // AquaOS — Supplier products
  getMyAquaProducts() { return this.get('/aquaos/my-products'); }
  createAquaProduct(d) { return this.post('/aquaos/products', d); }
  updateAquaProduct(id, d) { return this.patch(`/aquaos/products/${id}`, d); }
  deleteAquaProduct(id) { return this.del(`/aquaos/products/${id}`); }

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
  getMarketOutlook() { return this.get('/weather/market-outlook'); }

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
  updateFPOProcurement(id, d) { return this.patch(`/fpo/procurement/${id}`, d); }
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

  // AgriFlow CRUD management
  updateListing(id, d) { return this.patch(`/agriflow/listings/${id}`, d); }
  deleteListing(id) { return this.del(`/agriflow/listings/${id}`); }
  updateDeclaration(id, d) { return this.patch(`/agriflow/declarations/${id}`, d); }
  deleteDeclaration(id) { return this.del(`/agriflow/declarations/${id}`); }
  respondInquiry(id, d) { return this.patch(`/agriflow/inquiries/${id}`, d); }

  // AquaOS extended
  getWaterLogs(pondId) { return this.get(`/aquaos/ponds/${pondId}/water-logs`); }
  updatePond(id, d) { return this.patch(`/aquaos/ponds/${id}`, d); }
  deletePond(id) { return this.del(`/aquaos/ponds/${id}`); }
  createOffer(d) { return this.post('/aquaos/offers', d); }
  // Feed & Growth
  addFeedLog(pondId, d) { return this.post(`/aquaos/ponds/${pondId}/feed-logs`, d); }
  getFeedLogs(pondId) { return this.get(`/aquaos/ponds/${pondId}/feed-logs`); }
  addGrowthSample(pondId, d) { return this.post(`/aquaos/ponds/${pondId}/growth-samples`, d); }
  getGrowthSamples(pondId) { return this.get(`/aquaos/ponds/${pondId}/growth-samples`); }
  getAquaProducts() { return this.get('/aquaos/products'); }
  // KYC
  getAquaKYC() { return this.get('/aquaos/kyc'); }
  submitAquaKYC(d) { return this.post('/aquaos/kyc', d); }
  // Price Alerts
  getAquaPriceAlerts() { return this.get('/aquaos/price-alerts'); }
  createAquaPriceAlert(d) { return this.post('/aquaos/price-alerts', d); }
  deleteAquaPriceAlert(id) { return this.del(`/aquaos/price-alerts/${id}`); }
  // Saved Searches
  getAquaSavedSearches() { return this.get('/aquaos/saved-searches'); }
  createAquaSavedSearch(d) { return this.post('/aquaos/saved-searches', d); }
  deleteAquaSavedSearch(id) { return this.del(`/aquaos/saved-searches/${id}`); }
  // Referral
  getAquaReferral() { return this.get('/aquaos/referral'); }
  applyAquaReferral(d) { return this.post('/aquaos/referral/apply', d); }
  // Subscription
  getAquaSubscription() { return this.get('/aquaos/subscription'); }
  upgradeAquaSubscription(d) { return this.post('/aquaos/subscription/upgrade', d); }
  // Notification Prefs
  getAquaNotificationPrefs() { return this.get('/aquaos/notification-prefs'); }
  updateAquaNotificationPrefs(d) { return this.patch('/aquaos/notification-prefs', d); }
  // Privacy Settings
  getAquaPrivacySettings() { return this.get('/aquaos/privacy-settings'); }
  updateAquaPrivacySettings(d) { return this.patch('/aquaos/privacy-settings', d); }
  // Data Export (DPDP)
  exportAquaData() { return this.get('/aquaos/data-export'); }
  // IoT Sensor Readings
  getIoTReadings(pondId) { return this.get(`/aquaos/ponds/${pondId}/iot-readings`); }
  submitIoTReadings(pondId, d) { return this.post(`/aquaos/ponds/${pondId}/iot-readings`, d); }

  // KisanConnect extended
  getMyBookings() { return this.get('/kisanconnect/bookings'); }
  getMyApplications() { return this.get('/kisanconnect/applications'); }
  updateBooking(id, d) { return this.patch(`/kisanconnect/bookings/${id}`, d); }
  updateEquipment(id, d) { return this.patch(`/kisanconnect/equipment/${id}`, d); }
  deleteEquipment(id) { return this.del(`/kisanconnect/equipment/${id}`); }
  updateJob(id, d) { return this.patch(`/kisanconnect/jobs/${id}`, d); }
  deleteJob(id) { return this.del(`/kisanconnect/jobs/${id}`); }

  // FarmerConnect extended
  updateProperty(id, d) { return this.patch(`/farmerconnect/properties/${id}`, d); }
  deleteProperty(id) { return this.del(`/farmerconnect/properties/${id}`); }
  getSavedProperties() { return this.get('/farmerconnect/saved'); }
  saveProperty(d) { return this.post('/farmerconnect/saved', d); }
  unsaveProperty(id) { return this.del(`/farmerconnect/saved/${id}`); }
  createPropertyInquiry(d) { return this.post('/farmerconnect/inquiries', d); }
  getPropertyInquiries() { return this.get('/farmerconnect/inquiries'); }
  getMatchScore(params = '') { return this.get(`/farmerconnect/match-score${params}`); }

  // FarmerConnect Societies (B2B)
  getSocieties() { return this.get('/farmerconnect/societies'); }
  createSociety(d) { return this.post('/farmerconnect/societies', d); }
  logVisitor(societyId, d) { return this.post(`/farmerconnect/societies/${societyId}/visitors`, d); }
  checkoutVisitor(id) { return this.patch(`/farmerconnect/visitors/${id}/checkout`); }
  createMaintenance(societyId, d) { return this.post(`/farmerconnect/societies/${societyId}/maintenance`, d); }
  payMaintenance(id) { return this.patch(`/farmerconnect/maintenance/${id}/pay`); }
  logComplaint(societyId, d) { return this.post(`/farmerconnect/societies/${societyId}/complaints`, d); }
  createAgreement(d) { return this.post('/farmerconnect/agreements', d); }

  // AquaOS extended
  getFeedLogs(pondId) { return this.get(`/aquaos/ponds/${pondId}/feed-logs`); }
  addFeedLog(pondId, d) { return this.post(`/aquaos/ponds/${pondId}/feed-logs`, d); }
  getGrowthSamples(pondId) { return this.get(`/aquaos/ponds/${pondId}/growth-samples`); }
  addGrowthSample(pondId, d) { return this.post(`/aquaos/ponds/${pondId}/growth-samples`, d); }
  getHarvestPlan(pondId) { return this.get(`/aquaos/ponds/${pondId}/harvest-plan`); }
  getAquaProducts(params = '') { return this.get(`/aquaos/products${params}`); }

  // KisanConnect extended — Crop Listings
  getCropListings(params = '') { return this.get(`/kisanconnect/crops${params}`); }
  createCropListing(d) { return this.post('/kisanconnect/crops', d); }

  // KisanConnect extended — Services
  getServices(params = '') { return this.get(`/kisanconnect/services${params}`); }
  createService(d) { return this.post('/kisanconnect/services', d); }
  requestService(id, d) { return this.post(`/kisanconnect/services/${id}/request`, d); }

  // KisanConnect extended — Reviews
  createReview(d) { return this.post('/kisanconnect/reviews', d); }

  // Intelligence extended
  getPriceHistory(params = '') { return this.get(`/intelligence/price-history${params}`); }
  getSupplyForecast(params = '') { return this.get(`/intelligence/forecast${params}`); }
  getSubscriptionPlans() { return this.get('/intelligence/subscriptions'); }

  // AgriGalaxy — Stores & Products
  getAgriGalaxyStores(params = '') { return this.get(`/agrigalaxy/stores${params}`); }
  createAgriGalaxyStore(d) { return this.post('/agrigalaxy/stores', d); }
  updateAgriGalaxyStore(id, d) { return this.patch(`/agrigalaxy/stores/${id}`, d); }
  getMyAgriGalaxyStores() { return this.get('/agrigalaxy/my-stores'); }
  getAgriGalaxyProducts(params = '') { return this.get(`/agrigalaxy/products${params}`); }
  createAgriGalaxyProduct(d) { return this.post('/agrigalaxy/products', d); }
  updateAgriGalaxyProduct(id, d) { return this.patch(`/agrigalaxy/products/${id}`, d); }
  deleteAgriGalaxyProduct(id) { return this.delete(`/agrigalaxy/products/${id}`); }
  getAgriGalaxyCategories() { return this.get('/agrigalaxy/categories'); }
  createAgriGalaxyOrder(d) { return this.post('/agrigalaxy/orders', d); }
  getAgriGalaxyStats() { return this.get('/agrigalaxy/stats'); }

  // BhoomiOS — Land Marketplace
  getBhoomiListings(params = '') { return this.get(`/bhoomios/listings${params}`); }
  getBhoomiListing(id) { return this.get(`/bhoomios/listings/${id}`); }
  createBhoomiListing(d) { return this.post('/bhoomios/listings', d); }
  updateBhoomiListing(id, d) { return this.patch(`/bhoomios/listings/${id}`, d); }
  deleteBhoomiListing(id) { return this.delete(`/bhoomios/listings/${id}`); }
  getMyBhoomiListings() { return this.get('/bhoomios/my-listings'); }
  createBhoomiInquiry(d) { return this.post('/bhoomios/inquiries', d); }
  getBhoomiInquiries() { return this.get('/bhoomios/inquiries'); }
  saveBhoomiListing(listing_id) { return this.post('/bhoomios/saved', { listing_id }); }
  getSavedBhoomiListings() { return this.get('/bhoomios/saved'); }
  unsaveBhoomiListing(id) { return this.delete(`/bhoomios/saved/${id}`); }
  getBhoomiStats() { return this.get('/bhoomios/stats'); }

  // Upload
  uploadImage(formData) {
    return fetch(this.base + '/upload/image', {
      method: 'POST',
      headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {},
      body: formData
    }).then(r => r.json());
  }

  // Payments
  createPaymentOrder(d) { return this.post('/payments/create-order', d); }
  verifyPayment(d) { return this.post('/payments/verify', d); }
  getPaymentHistory(params = '') { return this.get(`/payments/history${params}`); }
  getPaymentReceipt(id) { return this.get(`/payments/receipt/${id}`); }
  getWallet() { return this.get('/payments/wallet'); }
  addWalletMoney(d) { return this.post('/payments/wallet/add', d); }
  requestRefund(d) { return this.post('/payments/refund', d); }

  // KYC
  getKYCStatus() { return this.get('/auth/kyc'); }
  submitKYCDocument(d) { return this.post('/auth/kyc/submit', d); }
  verifyKYC() { return this.post('/auth/kyc/verify', {}); }

  // Language
  updateLanguage(language) { return this.patch('/auth/language', { language }); }

  // Reviews
  submitReview(d) { return this.post('/reviews', d); }
  getReviews(type, id) { return this.get(`/reviews/${type}/${id}`); }
  getMyReviews() { return this.get('/reviews/my/all'); }
  deleteReview(id) { return this.delete(`/reviews/${id}`); }
  markReviewHelpful(id) { return this.post(`/reviews/${id}/helpful`, {}); }

  // Chat / Messaging
  getConversations() { return this.get('/chat/conversations'); }
  startConversation(d) { return this.post('/chat/conversations', d); }
  getMessages(conversationId, offset = 0) { return this.get(`/chat/messages/${conversationId}?offset=${offset}`); }
  sendMessage(d) { return this.post('/chat/messages', d); }
  getUnreadCount() { return this.get('/chat/unread'); }

  // Order Tracking
  getOrderTracking(type, id) { return this.get(`/tracking/${type}/${id}`); }
  addTrackingEvent(d) { return this.post('/tracking', d); }
  getMyTracking() { return this.get('/tracking/my/all'); }

  // Equipment Availability
  getEquipmentAvailability(id, year, month) { return this.get(`/kisanconnect/equipment/${id}/availability?year=${year}&month=${month}`); }
}

export const api = new ApiClient();
