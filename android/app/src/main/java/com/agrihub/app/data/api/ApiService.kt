package com.agrihub.app.data.api

import com.agrihub.app.data.model.*
import retrofit2.http.*

// ─── Auth API ──────────────────────────────────────────────
interface AuthApi {
    @POST("api/auth/send-otp")
    suspend fun sendOtp(@Body request: OtpRequest): OtpResponse

    @POST("api/auth/verify-otp")
    suspend fun verifyOtp(@Body request: VerifyOtpRequest): AuthResponse

    @GET("api/auth/me")
    suspend fun getProfile(): UserWrapper

    @PATCH("api/auth/me")
    suspend fun updateProfile(@Body body: Map<String, String>): UserWrapper

    @POST("api/auth/logout")
    suspend fun logout(@Body body: Map<String, String>): MessageResponse

    @GET("api/auth/notifications")
    suspend fun getNotifications(
        @Query("limit") limit: Int = 30,
        @Query("offset") offset: Int = 0,
        @Query("unread_only") unreadOnly: String? = null,
    ): NotificationsResponse

    @PATCH("api/auth/notifications/{id}/read")
    suspend fun markNotificationRead(@Path("id") id: String): MessageResponse

    @POST("api/auth/notifications/read-all")
    suspend fun markAllNotificationsRead(): MessageResponse
}

// ─── AgriFlow API ──────────────────────────────────────────
interface AgriFlowApi {
    @GET("api/agriflow/crops")
    suspend fun getCrops(): CropsResponse

    @GET("api/agriflow/districts")
    suspend fun getDistricts(): DistrictsResponse

    @GET("api/agriflow/listings")
    suspend fun getListings(
        @Query("crop_id") cropId: Int? = null,
        @Query("district_id") districtId: Int? = null,
        @Query("limit") limit: Int = 20,
        @Query("offset") offset: Int = 0,
    ): ListingsResponse

    @GET("api/agriflow/listings/{id}")
    suspend fun getListingById(@Path("id") id: String): ListingWrapper

    @POST("api/agriflow/listings")
    suspend fun createListing(@Body body: Map<String, @JvmSuppressWildcards Any?>): ListingWrapper

    @GET("api/agriflow/declarations")
    suspend fun getDeclarations(@Query("limit") limit: Int = 20): DeclarationsResponse

    @POST("api/agriflow/declarations")
    suspend fun createDeclaration(@Body body: Map<String, @JvmSuppressWildcards Any?>): MessageResponse

    @GET("api/agriflow/inquiries")
    suspend fun getInquiries(@Query("limit") limit: Int = 20): InquiriesResponse

    @POST("api/agriflow/inquiries")
    suspend fun sendInquiry(@Body body: Map<String, String>): MessageResponse
}

// ─── AquaOS API ────────────────────────────────────────────
interface AquaOSApi {
    @GET("api/aquaos/ponds")
    suspend fun getPonds(): PondsResponse

    @POST("api/aquaos/ponds")
    suspend fun createPond(@Body body: Map<String, @JvmSuppressWildcards Any?>): PondWrapper

    @PATCH("api/aquaos/ponds/{id}")
    suspend fun updatePond(@Path("id") id: String, @Body body: Map<String, @JvmSuppressWildcards Any?>): PondWrapper

    @GET("api/aquaos/ponds/{id}/water-logs")
    suspend fun getWaterLogs(@Path("id") pondId: String): WaterLogsResponse

    @POST("api/aquaos/ponds/{id}/water-log")
    suspend fun addWaterLog(@Path("id") pondId: String, @Body body: Map<String, @JvmSuppressWildcards Any?>): MessageResponse

    @GET("api/aquaos/harvest-listings")
    suspend fun getHarvestListings(
        @Query("species") species: String? = null,
        @Query("limit") limit: Int = 20,
    ): HarvestListingsResponse

    @POST("api/aquaos/harvest-listings")
    suspend fun createHarvestListing(@Body body: Map<String, @JvmSuppressWildcards Any?>): MessageResponse

    @GET("api/aquaos/advisories")
    suspend fun getAdvisories(@Query("species") species: String? = null): AdvisoriesResponse

    @GET("api/aquaos/stats")
    suspend fun getStats(): AquaStatsResponse
}

// ─── KisanConnect API ──────────────────────────────────────
interface KisanConnectApi {
    @GET("api/kisanconnect/equipment")
    suspend fun getEquipment(
        @Query("type") type: String? = null,
        @Query("limit") limit: Int = 20,
    ): EquipmentResponse

    @POST("api/kisanconnect/equipment/{id}/book")
    suspend fun bookEquipment(@Path("id") id: String, @Body body: Map<String, String>): MessageResponse

    @GET("api/kisanconnect/jobs")
    suspend fun getJobs(
        @Query("type") type: String? = null,
        @Query("limit") limit: Int = 20,
    ): JobsResponse

    @POST("api/kisanconnect/jobs")
    suspend fun postJob(@Body body: Map<String, @JvmSuppressWildcards Any?>): MessageResponse

    @GET("api/kisanconnect/stats")
    suspend fun getStats(): KisanStatsResponse
}

// ─── FarmerConnect API ─────────────────────────────────────
interface FarmerConnectApi {
    @GET("api/farmerconnect/properties")
    suspend fun getProperties(
        @Query("type") type: String? = null,
        @Query("limit") limit: Int = 20,
    ): PropertiesResponse

    @POST("api/farmerconnect/properties")
    suspend fun createProperty(@Body body: Map<String, @JvmSuppressWildcards Any?>): PropertyWrapper

    @POST("api/farmerconnect/properties/{id}/contact")
    suspend fun contactOwner(@Path("id") id: String, @Body body: Map<String, String>): MessageResponse

    @GET("api/farmerconnect/stats")
    suspend fun getStats(): FarmerConnectStatsResponse
}

// ─── Intelligence API ──────────────────────────────────────
interface IntelligenceApi {
    @GET("api/intelligence/prices")
    suspend fun getPrices(
        @Query("crop") crop: String? = null,
        @Query("limit") limit: Int = 30,
    ): PricesResponse

    @GET("api/intelligence/supply-demand")
    suspend fun getSupplyDemand(): SupplyDemandResponse

    @GET("api/intelligence/platform-stats")
    suspend fun getPlatformStats(): PlatformStatsResponse

    @GET("api/intelligence/activity-feed")
    suspend fun getActivityFeed(@Query("limit") limit: Int = 20): ActivityFeedResponse
}

// ─── Community API ─────────────────────────────────────────
interface CommunityApi {
    @GET("api/community/posts")
    suspend fun getPosts(
        @Query("category") category: String? = null,
        @Query("limit") limit: Int = 20,
    ): CommunityPostsResponse

    @POST("api/community/posts")
    suspend fun createPost(@Body body: Map<String, @JvmSuppressWildcards Any?>): CommunityPostWrapper

    @POST("api/community/posts/{id}/like")
    suspend fun likePost(@Path("id") id: String): MessageResponse
}

// ─── Orders API ────────────────────────────────────────────
interface OrdersApi {
    @GET("api/orders")
    suspend fun getOrders(
        @Query("role") role: String = "buyer",
        @Query("status") status: String? = null,
        @Query("limit") limit: Int = 20,
    ): OrdersResponse

    @GET("api/orders/{id}")
    suspend fun getOrderById(@Path("id") id: String): OrderWrapper

    @POST("api/orders")
    suspend fun createOrder(@Body body: Map<String, @JvmSuppressWildcards Any?>): OrderWrapper

    @PATCH("api/orders/{id}/status")
    suspend fun updateOrderStatus(@Path("id") id: String, @Body body: Map<String, String>): OrderWrapper
}
