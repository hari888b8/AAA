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
    val language: String = "en",
    val district_id: Int? = null,
    val state_code: String? = null,
    val is_verified: Boolean = false,
    val onboarding_completed: Boolean? = null,
    val created_at: String? = null,
)

// ─── Farmer Profile (PRD Section 6) ───────────────────────
data class FarmerProfileResponse(val profile: FarmerProfile?)
data class FarmerProfile(
    val id: String = "",
    val user_id: String = "",
    val state: String? = null,
    val district_id: Int? = null,
    val district_name: String? = null,
    val state_name: String? = null,
    val mandal: String? = null,
    val village: String? = null,
    val pincode: String? = null,
    val total_land_acres: Double? = null,
    val land_unit: String = "acres",
    val irrigation_type: List<String>? = null,
    val farming_method: String = "conventional",
    val soil_type: List<String>? = null,
    val organic_certified: Boolean = false,
    val primary_crops: List<String>? = null,
    val contact_consent: String = "fpo_only",
    val data_quality_score: Int = 50,
)

data class FarmerStatsResponse(val stats: FarmerStats)
data class FarmerStats(
    val total_declarations: Int = 0,
    val active_listings: Int = 0,
    val total_inquiries: Int = 0,
    val land_acres: Double = 0.0,
)

data class HarvestCalendarResponse(val calendar: List<HarvestCalendarItem>)
data class HarvestCalendarItem(
    val id: String = "",
    val crop_id: Int = 0,
    val crop_name: String = "",
    val icon_emoji: String? = null,
    val area_acres: Double = 0.0,
    val expected_yield: Double? = null,
    val sow_date: String = "",
    val expected_harvest_date: String = "",
    val days_to_harvest: Double? = null,
    val quality_grade: String = "ungraded",
    val is_organic: Boolean = false,
)

// ─── FPO Profile (PRD Section 7) ──────────────────────────
data class FpoProfileResponse(val profile: FpoProfile?)
data class FpoProfile(
    val id: String = "",
    val user_id: String = "",
    val fpo_name: String = "",
    val fpo_type: String = "FPO",
    val registration_number: String? = null,
    val state: String? = null,
    val district_id: Int? = null,
    val district_name: String? = null,
    val state_name: String? = null,
    val block: String? = null,
    val office_address: String? = null,
    val ceo_name: String? = null,
    val whatsapp_number: String? = null,
    val member_count: Int = 0,
    val active_member_count: Int = 0,
    val primary_crops: List<String>? = null,
    val subscription_plan: String = "starter",
    val verification_status: String = "pending",
    val trust_score: Int = 50,
    val response_rate: Double = 0.0,
    val year_established: Int? = null,
)

data class FpoMembersResponse(val members: List<FpoMember>, val total: Int = 0)
data class FpoMember(
    val id: String = "",
    val fpo_id: String = "",
    val farmer_id: String = "",
    val farmer_name: String? = null,
    val farmer_phone: String? = null,
    val village: String? = null,
    val total_land_acres: Double? = null,
    val farmer_crops: List<String>? = null,
    val status: String = "active",
    val joined_at: String? = null,
)

data class ProcurementResponse(val records: List<ProcurementRecord>)
data class ProcurementRecord(
    val id: String = "",
    val fpo_id: String = "",
    val farmer_id: String = "",
    val farmer_name: String? = null,
    val crop_id: Int? = null,
    val crop_name: String? = null,
    val quantity_kg: Double = 0.0,
    val quality_grade: String = "ungraded",
    val moisture_content: Double? = null,
    val price_per_kg: Double = 0.0,
    val gross_amount: Double = 0.0,
    val deduction_transport: Double = 0.0,
    val deduction_other: Double = 0.0,
    val net_payable: Double = 0.0,
    val payment_status: String = "pending",
    val collection_center: String? = null,
    val procurement_date: String? = null,
)

data class FpoInventoryResponse(val inventory: List<FpoInventoryItem>)
data class FpoInventoryItem(
    val id: String = "",
    val fpo_id: String = "",
    val crop_id: Int? = null,
    val crop_name: String? = null,
    val storage_location: String? = null,
    val storage_type: String? = null,
    val quantity_kg: Double = 0.0,
    val quality_grade: String = "ungraded",
    val entry_date: String? = null,
    val freshness_status: String = "fresh",
)

data class FpoSupplyListingsResponse(val listings: List<FpoSupplyListing>)
data class FpoSupplyListingWrapper(val listing: FpoSupplyListing)
data class FpoSupplyListing(
    val id: String = "",
    val fpo_id: String = "",
    val fpo_name: String? = null,
    val crop_id: Int? = null,
    val crop_name: String? = null,
    val district_name: String? = null,
    val quantity_available: Double = 0.0,
    val quality_grade: String = "A",
    val harvest_from_date: String? = null,
    val harvest_to_date: String? = null,
    val price_per_kg: Double? = null,
    val min_order_kg: Double? = null,
    val packaging: List<String>? = null,
    val certifications: List<String>? = null,
    val storage_location: String? = null,
    val special_notes: String? = null,
    val status: String = "active",
    val view_count: Int = 0,
    val inquiry_count: Int = 0,
    val member_count: Int? = null,
    val trust_score: Int? = null,
    val state_name: String? = null,
    val source_type: String? = null,
    val created_at: String? = null,
)

data class FpoStatsResponse(val stats: FpoStats)
data class FpoStats(
    val member_count: Int = 0,
    val active_members: Int = 0,
    val procurement_total: Double = 0.0,
    val inventory_kg: Double = 0.0,
    val active_listings: Int = 0,
    val pending_payments: Double = 0.0,
)

// ─── Buyer Profile (PRD Section 8) ────────────────────────
data class BuyerProfileResponse(val profile: BuyerProfile?)
data class BuyerProfile(
    val id: String = "",
    val user_id: String = "",
    val company_name: String? = null,
    val business_type: String? = null,
    val gstin: String? = null,
    val state: String? = null,
    val city: String? = null,
    val sourcing_states: List<String>? = null,
    val commodities: List<String>? = null,
    val monthly_volume_tons: Double? = null,
    val subscription_plan: String = "explorer",
    val contact_name: String? = null,
    val contact_email: String? = null,
)

data class SupplySearchResponse(val results: List<FpoSupplyListing>, val total: Int = 0)

data class BuyerInquiriesResponse(val inquiries: List<BuyerInquiry>)
data class BuyerInquiry(
    val id: String = "",
    val buyer_id: String = "",
    val fpo_listing_id: String? = null,
    val crop_id: Int? = null,
    val crop_name: String? = null,
    val fpo_name: String? = null,
    val quantity_needed: Double? = null,
    val required_by_date: String? = null,
    val delivery_location: String? = null,
    val message: String? = null,
    val status: String = "pending",
    val response_message: String? = null,
    val created_at: String? = null,
)

data class WatchlistResponse(val watchlist: List<WatchlistItem>)
data class WatchlistItem(
    val id: String = "",
    val buyer_id: String = "",
    val crop_id: Int? = null,
    val crop_name: String? = null,
    val state: String? = null,
    val district_id: Int? = null,
    val district_name: String? = null,
    val min_quantity_kg: Double? = null,
    val max_price_per_kg: Double? = null,
    val alert_enabled: Boolean = true,
)

data class BuyerStatsResponse(val stats: BuyerStats)
data class BuyerStats(
    val total_inquiries: Int = 0,
    val active_watchlists: Int = 0,
    val available_listings: Int = 0,
)

data class SupplyIntelligenceResponse(val intelligence: List<SupplyIntelligenceItem>)
data class SupplyIntelligenceItem(
    val id: String = "",
    val crop_id: Int? = null,
    val crop_name: String? = null,
    val state: String? = null,
    val district_id: Int? = null,
    val district_name: String? = null,
    val total_declared_area: Double? = null,
    val total_declared_yield: Double? = null,
    val farmer_count: Int? = null,
    val forecast_harvest_tons: Double? = null,
    val forecast_confidence: Double? = null,
    val fpo_listed_tons: Double? = null,
    val active_fpo_count: Int? = null,
    val price_trend_7d: Double? = null,
    val price_trend_30d: Double? = null,
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
