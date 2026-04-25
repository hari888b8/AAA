package com.agrihub.app.data.repository

import com.agrihub.app.data.api.*
import com.agrihub.app.data.local.CropDao
import com.agrihub.app.data.local.DistrictDao
import com.agrihub.app.data.local.OfflineQueueDao
import com.agrihub.app.data.model.*
import com.agrihub.app.util.TokenManager
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val api: AuthApi,
    private val tokenManager: TokenManager,
) {
    val tokenFlow: Flow<String?> = tokenManager.tokenFlow

    suspend fun sendOtp(phone: String) = api.sendOtp(OtpRequest(phone))

    suspend fun verifyOtp(phone: String, otp: String, name: String?, role: String?): AuthResponse {
        val response = api.verifyOtp(VerifyOtpRequest(phone, otp, name, role))
        tokenManager.saveTokens(response.token, response.refreshToken)
        tokenManager.saveUser(response.user.id, response.user.name, response.user.role, response.user.phone)
        return response
    }

    suspend fun getProfile() = api.getProfile().user
    suspend fun updateProfile(name: String?, role: String?): User {
        val body = mutableMapOf<String, String>()
        name?.let { body["name"] = it }
        role?.let { body["role"] = it }
        return api.updateProfile(body).user
    }

    suspend fun logout() {
        val rt = tokenManager.getRefreshToken() ?: ""
        try { api.logout(mapOf("refreshToken" to rt)) } catch (_: Exception) {}
        tokenManager.clear()
    }

    suspend fun isLoggedIn() = tokenManager.getToken() != null
    suspend fun getUserName() = tokenManager.getUserName()
    suspend fun getUserRole() = tokenManager.getUserRole()
    suspend fun getUserPhone() = tokenManager.getUserPhone()
    suspend fun getUserId() = tokenManager.getUserId()
    suspend fun saveUserName(name: String) = tokenManager.saveUserName(name)
}

@Singleton
class AgriFlowRepository @Inject constructor(
    private val api: AgriFlowApi,
    private val cropDao: CropDao,
    private val districtDao: DistrictDao,
) {
    fun cachedCrops(): Flow<List<Crop>> = cropDao.getAll()
    fun cachedDistricts(): Flow<List<District>> = districtDao.getAll()

    suspend fun refreshCrops(): List<Crop> {
        val crops = api.getCrops().crops
        cropDao.insertAll(crops)
        return crops
    }

    suspend fun refreshDistricts(): List<District> {
        val districts = api.getDistricts().districts
        districtDao.insertAll(districts)
        return districts
    }

    suspend fun getListings(cropId: Int? = null, districtId: Int? = null, limit: Int = 20, offset: Int = 0) =
        api.getListings(cropId, districtId, limit, offset).listings

    suspend fun getListingById(id: String) = api.getListingById(id).listing

    suspend fun createListing(body: Map<String, Any?>) = api.createListing(body).listing

    suspend fun getDeclarations(limit: Int = 20) = api.getDeclarations(limit).declarations

    suspend fun createDeclaration(body: Map<String, Any?>) = api.createDeclaration(body)

    suspend fun getInquiries(limit: Int = 20) = api.getInquiries(limit).inquiries

    suspend fun sendInquiry(listingId: String, message: String) =
        api.sendInquiry(mapOf("listing_id" to listingId, "message" to message))
}

@Singleton
class AquaOSRepository @Inject constructor(private val api: AquaOSApi) {
    suspend fun getPonds() = api.getPonds().ponds
    suspend fun createPond(body: Map<String, Any?>) = api.createPond(body).pond
    suspend fun getWaterLogs(pondId: String) = api.getWaterLogs(pondId).logs
    suspend fun addWaterLog(pondId: String, body: Map<String, Any?>) = api.addWaterLog(pondId, body)
    suspend fun getHarvestListings(species: String? = null) = api.getHarvestListings(species).listings
    suspend fun createHarvestListing(body: Map<String, Any?>) = api.createHarvestListing(body)
    suspend fun getAdvisories(species: String? = null) = api.getAdvisories(species).advisories
    suspend fun getStats() = api.getStats().stats
}

@Singleton
class KisanConnectRepository @Inject constructor(private val api: KisanConnectApi) {
    suspend fun getEquipment(type: String? = null) = api.getEquipment(type).equipment
    suspend fun bookEquipment(id: String, date: String, hours: String) =
        api.bookEquipment(id, mapOf("booking_date" to date, "duration_hours" to hours))
    suspend fun getJobs(type: String? = null) = api.getJobs(type).jobs
    suspend fun postJob(body: Map<String, Any?>) = api.postJob(body)
    suspend fun getStats() = api.getStats().stats
}

@Singleton
class FarmerConnectRepository @Inject constructor(private val api: FarmerConnectApi) {
    suspend fun getProperties(type: String? = null) = api.getProperties(type).properties
    suspend fun createProperty(body: Map<String, Any?>) = api.createProperty(body).property
    suspend fun contactOwner(id: String, message: String) =
        api.contactOwner(id, mapOf("message" to message))
    suspend fun getStats() = api.getStats().stats
}

@Singleton
class IntelligenceRepository @Inject constructor(private val api: IntelligenceApi) {
    suspend fun getPrices(crop: String? = null) = api.getPrices(crop).prices
    suspend fun getSupplyDemand() = api.getSupplyDemand().data
    suspend fun getPlatformStats() = api.getPlatformStats().stats
    suspend fun getActivityFeed(limit: Int = 20) = api.getActivityFeed(limit).feed
    suspend fun getCropRecommendations(districtId: Int? = null) = api.getCropRecommendations(districtId)
}

@Singleton
class CommunityRepository @Inject constructor(private val api: CommunityApi) {
    suspend fun getPosts(category: String? = null) = api.getPosts(category).posts
    suspend fun createPost(body: Map<String, Any?>) = api.createPost(body).post
    suspend fun likePost(id: String) = api.likePost(id)
    suspend fun getComments(postId: String) = api.getComments(postId).comments
    suspend fun addComment(postId: String, content: String) = api.addComment(postId, mapOf("content" to content)).comment
    suspend fun likeComment(postId: String, commentId: String) = api.likeComment(postId, commentId)
}

@Singleton
class OrdersRepository @Inject constructor(private val api: OrdersApi) {
    suspend fun getOrders(role: String = "buyer", status: String? = null) = api.getOrders(role, status).orders
    suspend fun getOrderById(id: String) = api.getOrderById(id).order
    suspend fun createOrder(body: Map<String, Any?>) = api.createOrder(body).order
    suspend fun updateOrderStatus(id: String, status: String) = api.updateOrderStatus(id, mapOf("status" to status)).order
}

@Singleton
class NotificationsRepository @Inject constructor(private val api: AuthApi) {
    suspend fun getNotifications(unreadOnly: Boolean = false) =
        api.getNotifications(unreadOnly = if (unreadOnly) "true" else null)
    suspend fun markAsRead(id: String) = api.markNotificationRead(id)
    suspend fun markAllRead() = api.markAllNotificationsRead()
}

@Singleton
class FarmerProfileRepository @Inject constructor(private val api: FarmerProfileApi) {
    suspend fun getProfile() = api.getProfile().profile
    suspend fun saveProfile(body: Map<String, Any?>) = api.saveProfile(body).profile
    suspend fun getHarvestCalendar() = api.getHarvestCalendar().calendar
    suspend fun getMyListings() = api.getMyListings().listings
    suspend fun getMyInquiries(limit: Int = 20) = api.getMyInquiries(limit).inquiries
    suspend fun getStats() = api.getStats().stats
}

@Singleton
class FpoRepository @Inject constructor(private val api: FpoApi) {
    suspend fun getProfile() = api.getProfile().profile
    suspend fun saveProfile(body: Map<String, Any?>) = api.saveProfile(body).profile
    suspend fun getMembers() = api.getMembers()
    suspend fun addMember(phone: String) = api.addMember(mapOf("farmer_phone" to phone))
    suspend fun getProcurement(limit: Int = 20) = api.getProcurement(limit).records
    suspend fun recordProcurement(body: Map<String, Any?>) = api.recordProcurement(body)
    suspend fun getInventory() = api.getInventory().inventory
    suspend fun addInventory(body: Map<String, Any?>) = api.addInventory(body)
    suspend fun getSupplyListings(cropId: Int? = null) = api.getSupplyListings(cropId).listings
    suspend fun createSupplyListing(body: Map<String, Any?>) = api.createSupplyListing(body).listing
    suspend fun getStats() = api.getStats().stats
}

@Singleton
class BuyerRepository @Inject constructor(private val api: BuyerApi) {
    suspend fun getProfile() = api.getProfile().profile
    suspend fun saveProfile(body: Map<String, Any?>) = api.saveProfile(body).profile
    suspend fun searchSupply(cropId: Int? = null, state: String? = null, districtId: Int? = null,
                             quality: String? = null, minQty: Double? = null, sourceType: String? = null) =
        api.searchSupply(cropId, state, districtId, quality, minQty, sourceType).results
    suspend fun getInquiries(limit: Int = 20) = api.getInquiries(limit).inquiries
    suspend fun sendInquiry(body: Map<String, Any?>) = api.sendInquiry(body)
    suspend fun getWatchlist() = api.getWatchlist().watchlist
    suspend fun addToWatchlist(body: Map<String, Any?>) = api.addToWatchlist(body)
    suspend fun removeFromWatchlist(id: String) = api.removeFromWatchlist(id)
    suspend fun getIntelligence(cropId: Int? = null, state: String? = null) = api.getIntelligence(cropId, state).intelligence
    suspend fun getStats() = api.getStats().stats
}

@Singleton
class WeatherRepository @Inject constructor(private val api: WeatherApi) {
    suspend fun getForecast(districtId: Int? = null, days: Int = 7) = api.getForecast(districtId, days)
    suspend fun getAdvisory(districtId: Int? = null) = api.getAdvisory(districtId)
    suspend fun getCropHealth(cropId: Int? = null, districtId: Int? = null) = api.getCropHealth(cropId, districtId)
    suspend fun getMarketOutlook() = api.getMarketOutlook().market_outlook
}

@Singleton
class UploadRepository @Inject constructor(private val api: UploadApi) {
    suspend fun uploadImage(base64: String, context: String = "general") =
        api.uploadImage(mapOf("image" to base64, "context" to context))
    suspend fun getMyFiles(context: String? = null) = api.getMyFiles(context).files
    suspend fun deleteFile(id: String) = api.deleteFile(id)
}
