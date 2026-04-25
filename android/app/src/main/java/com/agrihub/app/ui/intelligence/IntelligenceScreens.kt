package com.agrihub.app.ui.intelligence

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.agrihub.app.data.model.*
import com.agrihub.app.data.repository.IntelligenceRepository
import com.agrihub.app.ui.components.*
import com.agrihub.app.ui.navigation.Routes
import com.agrihub.app.ui.theme.AppColor
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class IntelligenceViewModel @Inject constructor(private val repo: IntelligenceRepository) : ViewModel() {
    private val _prices = MutableStateFlow<List<PriceFeed>>(emptyList())
    val prices: StateFlow<List<PriceFeed>> = _prices.asStateFlow()
    private val _supplyDemand = MutableStateFlow<List<SupplyDemandItem>>(emptyList())
    val supplyDemand: StateFlow<List<SupplyDemandItem>> = _supplyDemand.asStateFlow()
    private val _platformStats = MutableStateFlow(PlatformStats())
    val platformStats: StateFlow<PlatformStats> = _platformStats.asStateFlow()
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun loadPrices() = viewModelScope.launch {
        _loading.value = true
        try { _prices.value = repo.getPrices() } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }
    fun loadSupplyDemand() = viewModelScope.launch {
        try { _supplyDemand.value = repo.getSupplyDemand() } catch (_: Exception) {}
    }
    fun loadPlatformStats() = viewModelScope.launch {
        try { _platformStats.value = repo.getPlatformStats() } catch (_: Exception) {}
    }

    private val _recommendations = MutableStateFlow<CropRecommendationsResponse?>(null)
    val recommendations: StateFlow<CropRecommendationsResponse?> = _recommendations.asStateFlow()

    fun loadRecommendations(districtId: Int? = null) = viewModelScope.launch {
        try { _recommendations.value = repo.getCropRecommendations(districtId) } catch (_: Exception) {}
    }
}

// ─── Intelligence Home ─────────────────────────────────────
@Composable
fun IntelligenceHomeScreen(navController: NavController, viewModel: IntelligenceViewModel = hiltViewModel()) {
    val supplyDemand by viewModel.supplyDemand.collectAsState()
    val platformStats by viewModel.platformStats.collectAsState()
    LaunchedEffect(Unit) { viewModel.loadSupplyDemand(); viewModel.loadPlatformStats() }

    LazyColumn(Modifier.fillMaxSize().background(AppColor.Background)) {
        item {
            GradientHeader("Intelligence", "Price Radar & Market Analytics", Color(0xFFB91C1C), AppColor.Intelligence) {
                StatRow(listOf(
                    Triple("👥", "${platformStats.total_users ?: 0}", "Users"),
                    Triple("📋", "${platformStats.active_listings ?: 0}", "Listings"),
                    Triple("📦", "${platformStats.total_volume_tons ?: 0}T", "Volume"),
                    Triple("🗺️", "${platformStats.districts_covered ?: 0}", "Districts"),
                ))
            }
        }
        item { Spacer(Modifier.height(12.dp)) }
        item { ActionCard("💰", "Live Prices", "Real-time crop prices across mandis", AppColor.Intelligence) { navController.navigate(Routes.PRICES) } }
        item { ActionCard("🗺️", "District Heatmap", "Activity distribution by district", AppColor.Intelligence) { navController.navigate(Routes.HEATMAP) } }
        item { ActionCard("🌱", "Crop Recommendations", "Best crops for current season", AppColor.Intelligence) { navController.navigate(Routes.CROP_RECS) } }

        if (supplyDemand.isNotEmpty()) {
            item { Spacer(Modifier.height(16.dp)); SectionTitle("Supply vs Demand") }
            items(supplyDemand) { item ->
                Card(
                    Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 3.dp),
                    shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color.White),
                ) {
                    Column(Modifier.padding(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(item.crop_name, fontWeight = FontWeight.Bold, fontSize = 14.sp, modifier = Modifier.weight(1f))
                            val signalColor = when (item.signal) { "surplus" -> AppColor.Success; "deficit" -> AppColor.Error; else -> AppColor.Warning }
                            StatusBadge(item.signal ?: "balanced", signalColor)
                        }
                        Spacer(Modifier.height(8.dp))
                        // Simple bar visualization
                        val maxVal = maxOf(item.supply_tons, item.demand_tons, 1.0)
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                            Text("Supply", fontSize = 11.sp, color = AppColor.TextMuted, modifier = Modifier.width(52.dp))
                            Box(
                                Modifier
                                    .height(14.dp)
                                    .weight(1f)
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(AppColor.Border)
                            ) {
                                Box(
                                    Modifier
                                        .fillMaxHeight()
                                        .fillMaxWidth((item.supply_tons / maxVal).toFloat())
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(AppColor.Success)
                                )
                            }
                            Text("${item.supply_tons.toInt()}T", fontSize = 11.sp, modifier = Modifier.padding(start = 6.dp).width(40.dp))
                        }
                        Spacer(Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                            Text("Demand", fontSize = 11.sp, color = AppColor.TextMuted, modifier = Modifier.width(52.dp))
                            Box(
                                Modifier
                                    .height(14.dp)
                                    .weight(1f)
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(AppColor.Border)
                            ) {
                                Box(
                                    Modifier
                                        .fillMaxHeight()
                                        .fillMaxWidth((item.demand_tons / maxVal).toFloat())
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(AppColor.Intelligence)
                                )
                            }
                            Text("${item.demand_tons.toInt()}T", fontSize = 11.sp, modifier = Modifier.padding(start = 6.dp).width(40.dp))
                        }
                    }
                }
            }
        }
        item { Spacer(Modifier.height(24.dp)) }
    }
}

// ─── Prices Screen ─────────────────────────────────────────
@OptIn(ExperimentalMaterialApi::class)
@Composable
fun PricesScreen(navController: NavController, viewModel: IntelligenceViewModel = hiltViewModel()) {
    val prices by viewModel.prices.collectAsState()
    val loading by viewModel.loading.collectAsState()
    LaunchedEffect(Unit) { viewModel.loadPrices() }
    val pullRefreshState = rememberPullRefreshState(loading, { viewModel.loadPrices() })

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("Live Prices", "${prices.size} crops tracked", Color(0xFFB91C1C), AppColor.Intelligence, onBack = { navController.popBackStack() })
        Box(Modifier.weight(1f).pullRefresh(pullRefreshState)) {
            when {
                loading && prices.isEmpty() -> LoadingScreen()
                prices.isEmpty() -> EmptyState("💰", "No price data", "Price feeds will appear here")
                else -> LazyColumn(contentPadding = PaddingValues(vertical = 8.dp)) {
                    items(prices) { price ->
                        Card(
                            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color.White), elevation = CardDefaults.cardElevation(2.dp),
                        ) {
                            Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(price.crop_name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    price.mandi_name?.let { Text(it, fontSize = 12.sp, color = AppColor.TextMuted) }
                                    price.district_name?.let { Text("📍 $it", fontSize = 11.sp, color = AppColor.TextMuted) }
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text("₹${price.modal_price?.toInt() ?: "--"}", fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = AppColor.Intelligence)
                                    Text("per ${price.unit ?: "qtl"}", fontSize = 10.sp, color = AppColor.TextMuted)
                                    if (price.min_price != null && price.max_price != null) {
                                        Text("₹${price.min_price.toInt()}–${price.max_price.toInt()}", fontSize = 10.sp, color = AppColor.TextSecondary)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            PullRefreshIndicator(loading, pullRefreshState, Modifier.align(Alignment.TopCenter), contentColor = AppColor.Intelligence)
        }
    }
}

// ─── Heatmap Screen (District Activity) ────────────────────
@Composable
fun HeatmapScreen(navController: NavController, viewModel: IntelligenceViewModel = hiltViewModel()) {
    val supplyDemand by viewModel.supplyDemand.collectAsState()
    val platformStats by viewModel.platformStats.collectAsState()
    LaunchedEffect(Unit) { viewModel.loadSupplyDemand(); viewModel.loadPlatformStats() }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("District Heatmap", "Activity distribution", Color(0xFFB91C1C), AppColor.Intelligence, onBack = { navController.popBackStack() })

        LazyColumn(Modifier.weight(1f), contentPadding = PaddingValues(16.dp)) {
            item {
                Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(Modifier.padding(16.dp)) {
                        Text("Platform Overview", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Spacer(Modifier.height(12.dp))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                            OverviewStat("👥", "${platformStats.total_users ?: 0}", "Total Users")
                            OverviewStat("📋", "${platformStats.active_listings ?: 0}", "Active Listings")
                            OverviewStat("🗺️", "${platformStats.districts_covered ?: 0}", "Districts")
                        }
                    }
                }
            }
            if (supplyDemand.isNotEmpty()) {
                item { Spacer(Modifier.height(16.dp)); Text("Crop Activity", fontWeight = FontWeight.Bold, fontSize = 16.sp) }
                items(supplyDemand) { item ->
                    Card(
                        Modifier.fillMaxWidth().padding(vertical = 3.dp),
                        shape = RoundedCornerShape(10.dp), colors = CardDefaults.cardColors(containerColor = Color.White),
                    ) {
                        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text(item.crop_name, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, modifier = Modifier.weight(1f))
                            Column(horizontalAlignment = Alignment.End) {
                                Text("S: ${item.supply_tons.toInt()}T", fontSize = 11.sp, color = AppColor.Success)
                                Text("D: ${item.demand_tons.toInt()}T", fontSize = 11.sp, color = AppColor.Intelligence)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun OverviewStat(emoji: String, value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(emoji, fontSize = 20.sp)
        Text(value, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = AppColor.TextPrimary)
        Text(label, fontSize = 10.sp, color = AppColor.TextMuted)
    }
}

// ─── Crop Recommendations Screen ──────────────────────────
@Composable
fun CropRecommendationsScreen(navController: NavController, viewModel: IntelligenceViewModel = hiltViewModel()) {
    val recommendations by viewModel.recommendations.collectAsState()
    LaunchedEffect(Unit) { viewModel.loadRecommendations() }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("Crop Recommendations", "Best crops for this season", Color(0xFF1B5E20), AppColor.Intelligence, onBack = { navController.popBackStack() })

        if (recommendations == null) {
            LoadingScreen()
        } else {
            val recs = recommendations!!
            LazyColumn(contentPadding = PaddingValues(vertical = 8.dp)) {
                item {
                    Card(
                        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFF0FDF4)),
                    ) {
                        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text("🌱", fontSize = 24.sp)
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text("${recs.season.replaceFirstChar { it.uppercase() }} Season", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF166534))
                                Text("${recs.recommendations.size} crops recommended based on market data", fontSize = 12.sp, color = AppColor.TextSecondary)
                            }
                        }
                    }
                }
                items(recs.recommendations) { rec ->
                    Card(
                        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(2.dp),
                    ) {
                        Column(Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(rec.icon_emoji ?: "🌾", fontSize = 28.sp)
                                Spacer(Modifier.width(10.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(rec.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    rec.category?.let { Text(it.replaceFirstChar { c -> c.uppercase() }, fontSize = 12.sp, color = AppColor.TextMuted) }
                                }
                                // Score circle
                                Box(
                                    modifier = Modifier
                                        .size(48.dp)
                                        .clip(androidx.compose.foundation.shape.CircleShape)
                                        .background(
                                            when {
                                                rec.recommendation_score >= 80 -> AppColor.Success.copy(0.15f)
                                                rec.recommendation_score >= 60 -> AppColor.Warning.copy(0.15f)
                                                else -> AppColor.Error.copy(0.15f)
                                            }
                                        ),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(
                                            "${rec.recommendation_score}",
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 14.sp,
                                            color = when {
                                                rec.recommendation_score >= 80 -> AppColor.Success
                                                rec.recommendation_score >= 60 -> AppColor.Warning
                                                else -> AppColor.Error
                                            },
                                        )
                                        Text("score", fontSize = 8.sp, color = AppColor.TextMuted)
                                    }
                                }
                            }
                            Spacer(Modifier.height(8.dp))
                            Text(rec.reason, fontSize = 12.sp, color = AppColor.TextSecondary)
                            Spacer(Modifier.height(8.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                rec.avg_market_price?.let {
                                    MetricTag("💰", "₹${it.toInt()}/qtl")
                                }
                                rec.avg_yield_per_acre?.let {
                                    MetricTag("📦", "${it}T/acre")
                                }
                                rec.growing_days?.let {
                                    MetricTag("📅", "${it} days")
                                }
                            }
                        }
                    }
                }
                item { Spacer(Modifier.height(24.dp)) }
            }
        }
    }
}

@Composable
private fun MetricTag(icon: String, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(icon, fontSize = 12.sp)
        Spacer(Modifier.width(3.dp))
        Text(label, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = AppColor.TextSecondary)
    }
}
