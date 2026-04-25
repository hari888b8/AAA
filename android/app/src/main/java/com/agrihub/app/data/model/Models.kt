package com.agrihub.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName

// ─── Auth ──────────────────────────────────────────────────
data class OtpRequest(val phone: String)

data class OtpResponse(val message: String, val otp: String? = null)

data class VerifyOtpRequest(
    val phone: String,
    val otp: String,
    val name: String? = null,
    val role: String? = null,
)

data class AuthResponse(
    val token: String,
    val refreshToken: String,
    val user: User,
)

data class UserWrapper(val user: User)

data class User(
    val id: String = "",
    val phone: String = "",
    val name: String = "",
    val role: String = "farmer",
    val is_verified: Boolean = false,
    val onboarding_completed: Boolean? = null,
    val created_at: String? = null,
)

// ─── AgriFlow ──────────────────────────────────────────────
data class CropsResponse(val crops: List<Crop>)
data class DistrictsResponse(val districts: List<District>)
data class ListingsResponse(val listings: List<SupplyListing>)
data class ListingWrapper(val listing: SupplyListing)
data class DeclarationsResponse(val declarations: List<Declaration>)
data class InquiriesResponse(val inquiries: List<Inquiry>)

@Entity(tableName = "crops")
data class Crop(
    @PrimaryKey val id: Int = 0,
    val name: String = "",
    val name_telugu: String? = null,
    val name_hindi: String? = null,
    val emoji: String? = null,
    val category: String? = null,
    val msp_per_quintal: Double? = null,
)

@Entity(tableName = "districts")
data class District(
    @PrimaryKey val id: Int = 0,
    val name: String = "",
    val state: String? = null,
    val farmer_count: Int? = null,
    val primary_crops: String? = null,
)

data class SupplyListing(
    val id: String = "",
    val farmer_id: String = "",
    val crop_id: Int? = null,
    val crop_name: String? = null,
    val variety: String? = null,
    val quantity_tons: Double? = null,
    val price_per_ton: Double? = null,
    val grade: String? = null,
    val available_from: String? = null,
    val location_label: String? = null,
    val district_name: String? = null,
    val farmer_name: String? = null,
    val description: String? = null,
    val status: String? = "active",
    val created_at: String? = null,
)

data class Declaration(
    val id: String = "",
    val farmer_id: String = "",
    val crop_id: Int? = null,
    val crop_name: String? = null,
    val expected_yield_tons: Double? = null,
    val sowing_date: String? = null,
    val expected_harvest: String? = null,
    val district_name: String? = null,
    val status: String? = "pending",
    val created_at: String? = null,
)

data class Inquiry(
    val id: String = "",
    val buyer_id: String = "",
    val listing_id: String = "",
    val message: String? = null,
    val buyer_name: String? = null,
    val status: String? = "pending",
    val created_at: String? = null,
)

// ─── AquaOS ────────────────────────────────────────────────
data class PondsResponse(val ponds: List<Pond>)
data class PondWrapper(val pond: Pond)
data class HarvestListingsResponse(val listings: List<HarvestListing>)
data class AdvisoriesResponse(val advisories: List<Advisory>)
data class WaterLogsResponse(val logs: List<WaterLog>)
data class AquaStatsResponse(val stats: AquaStats)

data class Pond(
    val id: String = "",
    val farmer_id: String = "",
    val pond_code: String = "",
    val species: String = "",
    val area_acres: Double = 0.0,
    val status: String = "active",
    val stocked_count: Int? = null,
    val stocked_date: String? = null,
    val survival_pct: Double? = null,
    val avg_weight_g: Double? = null,
    val ph_level: Double? = null,
    val dissolved_o2: Double? = null,
    val temperature_c: Double? = null,
    val doc_computed: Double? = null,
    val created_at: String? = null,
)

data class HarvestListing(
    val id: String = "",
    val farmer_id: String = "",
    val pond_id: String? = null,
    val species: String = "",
    val quantity_kg: Double = 0.0,
    val avg_size_g: Double? = null,
    val price_per_kg: Double? = null,
    val district_name: String? = null,
    val farmer_name: String? = null,
    val location_label: String? = null,
    val status: String = "available",
    val description: String? = null,
    val harvest_date: String? = null,
    val created_at: String? = null,
)

data class Advisory(
    val id: String = "",
    val title: String = "",
    val body: String = "",
    val severity: String = "info",
    val species: String? = null,
    val created_at: String? = null,
)

data class WaterLog(
    val id: String = "",
    val pond_id: String = "",
    val ph: Double? = null,
    val temperature_c: Double? = null,
    val dissolved_o2: Double? = null,
    val turbidity: String? = null,
    val created_at: String? = null,
)

data class AquaStats(
    val active_ponds: Int? = 0,
    val harvested_ponds: Int? = 0,
    val total_area: Double? = 0.0,
    val avg_survival: Double? = null,
    val avg_ph: Double? = null,
    val avg_temp: Double? = null,
)

// ─── KisanConnect ──────────────────────────────────────────
data class EquipmentResponse(val equipment: List<Equipment>)
data class JobsResponse(val jobs: List<Job>)
data class KisanStatsResponse(val stats: KisanStats)

data class Equipment(
    val id: String = "",
    val owner_id: String = "",
    val equipment_type: String = "",
    val brand: String? = null,
    val model_name: String? = null,
    val rate_per_hour: Double? = null,
    val rate_per_day: Double? = null,
    val location_label: String? = null,
    val district_name: String? = null,
    val owner_name: String? = null,
    val is_available: Boolean = true,
    val description: String? = null,
    val status: String = "active",
    val created_at: String? = null,
)

data class Job(
    val id: String = "",
    val posted_by: String = "",
    val title: String = "",
    val employer_name: String? = null,
    val job_type: String? = null,
    val salary_min: Double? = null,
    val salary_max: Double? = null,
    val salary_period: String? = "month",
    val location_label: String? = null,
    val district_name: String? = null,
    val vacancies: Int? = 1,
    val description: String? = null,
    val skills: List<String>? = null,
    val is_active: Boolean = true,
    val created_at: String? = null,
)

data class KisanStats(
    val total_equipment: Int? = 0,
    val available_equipment: Int? = 0,
    val active_jobs: Int? = 0,
    val total_bookings: Int? = 0,
)

// ─── FarmerConnect ─────────────────────────────────────────
data class PropertiesResponse(val properties: List<Property>)
data class PropertyWrapper(val property: Property)
data class FarmerConnectStatsResponse(val stats: FarmerConnectStats)

data class Property(
    val id: String = "",
    val owner_id: String = "",
    val property_type: String = "",
    val title: String = "",
    val area_acres: Double? = null,
    val price_per_month: Double? = null,
    val price_total: Double? = null,
    val location_label: String? = null,
    val district_name: String? = null,
    val status: String = "active",
    val description: String? = null,
    val amenities: List<String>? = null,
    val owner_name: String? = null,
    val created_at: String? = null,
)

data class FarmerConnectStats(
    val total_properties: Int? = 0,
    val available_properties: Int? = 0,
)

// ─── Intelligence ──────────────────────────────────────────
data class PricesResponse(val prices: List<PriceFeed>)
data class SupplyDemandResponse(val data: List<SupplyDemandItem>)
data class PlatformStatsResponse(val stats: PlatformStats)
data class ActivityFeedResponse(val feed: List<ActivityItem>)

data class PriceFeed(
    val id: String = "",
    val crop_name: String = "",
    val mandi_name: String? = null,
    val district_name: String? = null,
    val min_price: Double? = null,
    val max_price: Double? = null,
    val modal_price: Double? = null,
    val unit: String? = "quintal",
    val trend: String? = null,
    val recorded_at: String? = null,
)

data class SupplyDemandItem(
    val crop_name: String = "",
    val supply_tons: Double = 0.0,
    val demand_tons: Double = 0.0,
    val signal: String? = null,
)

data class PlatformStats(
    val total_users: Int? = 0,
    val active_listings: Int? = 0,
    val total_volume_tons: Double? = 0.0,
    val districts_covered: Int? = 0,
)

data class ActivityItem(
    val id: String = "",
    val event_type: String = "",
    val actor_name: String? = null,
    val description: String = "",
    val created_at: String? = null,
)

// ─── Community ─────────────────────────────────────────────
data class CommunityPostsResponse(val posts: List<CommunityPost>)
data class CommunityPostWrapper(val post: CommunityPost)

data class CommunityPost(
    val id: String = "",
    val author_id: String = "",
    val author_name: String? = null,
    val author_role: String? = null,
    val title: String? = null,
    val content: String = "",
    val category: String = "general",
    val district_name: String? = null,
    val likes: Int = 0,
    val replies: Int = 0,
    val views: Int = 0,
    val created_at: String? = null,
)

// ─── Orders ────────────────────────────────────────────────
data class OrdersResponse(val orders: List<Order>)
data class OrderWrapper(val order: Order)

data class Order(
    val id: String = "",
    val buyer_id: String = "",
    val buyer_name: String? = null,
    val listing_id: String? = null,
    val listing_type: String = "supply",
    val quantity: Double? = null,
    val price_per_unit: Double? = null,
    val total_amount: Double? = null,
    val status: String = "pending",
    val delivery_address: String? = null,
    val notes: String? = null,
    val created_at: String? = null,
    val updated_at: String? = null,
)

// ─── Notifications ─────────────────────────────────────────
data class NotificationsResponse(
    val notifications: List<AppNotification>,
    val unread_count: Int = 0,
)

data class AppNotification(
    val id: String = "",
    val user_id: String = "",
    val title: String = "",
    val body: String = "",
    val type: String? = null,
    val is_read: Boolean = false,
    val created_at: String? = null,
)

// ─── Room Offline Queue ────────────────────────────────────
@Entity(tableName = "offline_queue")
data class OfflineAction(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val action_type: String,
    val payload: String,
    val created_at: Long = System.currentTimeMillis(),
    val synced: Boolean = false,
)

// ─── Generic ───────────────────────────────────────────────
data class MessageResponse(val message: String)
