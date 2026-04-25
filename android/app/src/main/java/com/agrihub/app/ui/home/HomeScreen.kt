package com.agrihub.app.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.agrihub.app.data.model.ActivityItem
import com.agrihub.app.data.model.PriceFeed
import com.agrihub.app.data.repository.AuthRepository
import com.agrihub.app.data.repository.IntelligenceRepository
import com.agrihub.app.ui.components.GradientHeader
import com.agrihub.app.ui.components.StatRow
import com.agrihub.app.ui.navigation.Routes
import com.agrihub.app.ui.theme.AppColor
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val authRepo: AuthRepository,
    private val intelligenceRepo: IntelligenceRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(HomeState())
    val state: StateFlow<HomeState> = _state.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(refreshing = true)
            val name = authRepo.getUserName() ?: "Friend"
            val role = authRepo.getUserRole() ?: "farmer"
            try {
                val prices = intelligenceRepo.getPrices()
                val feed = intelligenceRepo.getActivityFeed()
                _state.value = HomeState(userName = name, userRole = role, prices = prices, activity = feed, refreshing = false)
            } catch (_: Exception) {
                _state.value = _state.value.copy(userName = name, userRole = role, refreshing = false)
            }
        }
    }
}

data class HomeState(
    val userName: String = "",
    val userRole: String = "farmer",
    val prices: List<PriceFeed> = emptyList(),
    val activity: List<ActivityItem> = emptyList(),
    val refreshing: Boolean = false,
)

data class PlatformItem(
    val key: String, val name: String, val desc: String, val emoji: String,
    val color: Color, val lightColor: Color, val route: String,
)

val platforms = listOf(
    PlatformItem("agriflow", "AgriFlow", "Supply listings & crop declarations", "🌾", AppColor.AgriFlow, AppColor.AgriFlowLight, Routes.AGRIFLOW),
    PlatformItem("aquaos", "AquaOS", "Pond management & fish marketplace", "🐟", AppColor.AquaOS, AppColor.AquaOSLight, Routes.AQUAOS),
    PlatformItem("kisan", "KisanConnect", "Equipment rental & rural jobs", "🤝", AppColor.KisanConnect, AppColor.KisanConnectLight, Routes.KISAN),
    PlatformItem("farmerconnect", "FarmerConnect", "Agricultural housing & rentals", "🏠", AppColor.FarmerConnect, AppColor.FarmerConnectLight, Routes.FARMER_CONNECT_HOME),
    PlatformItem("intelligence", "Intelligence", "Price radar & market analytics", "📊", AppColor.Intelligence, AppColor.IntelligenceLight, Routes.INTELLIGENCE_HOME),
    PlatformItem("fpo", "FPO Dashboard", "Members, procurement & supply", "🏢", AppColor.FpoBlue, AppColor.AquaOSLight, Routes.FPO_DASHBOARD),
    PlatformItem("buyer", "Buyer Intelligence", "Supply search & market insights", "🛒", AppColor.BuyerOrange, AppColor.FarmerConnectLight, Routes.BUYER_DASHBOARD),
    PlatformItem("weather", "Weather & Advisory", "Crop advisories & price forecast", "⛅", Color(0xFF1565C0), Color(0xFFE3F2FD), Routes.WEATHER_HOME),
)

@OptIn(ExperimentalMaterialApi::class)
@Composable
fun HomeScreen(navController: NavController, viewModel: HomeViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    val pullRefreshState = rememberPullRefreshState(state.refreshing, { viewModel.load() })

    Box(Modifier.pullRefresh(pullRefreshState)) {
        LazyColumn(Modifier.fillMaxSize().background(AppColor.Background)) {
            // Banner
            item {
                Column(
                    Modifier
                        .fillMaxWidth()
                        .background(Brush.verticalGradient(listOf(AppColor.PrimaryDark, AppColor.Primary)))
                        .statusBarsPadding()
                        .padding(horizontal = 20.dp, vertical = 16.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text("नमस्ते, ${state.userName.split(" ").first()} 👋", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold)
                            Text(
                                when (state.userRole) {
                                    "fpo" -> "FPO Command Center"
                                    "buyer" -> "Procurement Intelligence"
                                    "aqua_farmer" -> "Aqua Farm Overview"
                                    else -> "Today's Farm Dashboard"
                                },
                                color = Color.White.copy(alpha = 0.75f), fontSize = 13.sp,
                            )
                        }
                        IconButton(onClick = { navController.navigate(Routes.NOTIFICATIONS) }) {
                            Icon(Icons.Default.Notifications, "Notifications", tint = Color.White)
                        }
                    }
                    StatRow(
                        listOf(
                            Triple("👨‍🌾", "12.4L+", "Farmers"),
                            Triple("🏢", "2,400+", "FPOs"),
                            Triple("🛒", "8,600+", "Buyers"),
                            Triple("🗺️", "18", "States"),
                        )
                    )
                }
            }

            // Platforms
            item {
                Spacer(Modifier.height(20.dp))
                Text(
                    "Our Platforms", fontWeight = FontWeight.ExtraBold, fontSize = 17.sp,
                    color = AppColor.TextPrimary, modifier = Modifier.padding(horizontal = 20.dp),
                )
                Text(
                    "Tap to explore each platform", fontSize = 12.sp,
                    color = AppColor.TextSecondary, modifier = Modifier.padding(horizontal = 20.dp, vertical = 2.dp),
                )
            }

            items(platforms) { p ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 5.dp)
                        .clickable { navController.navigate(p.route) },
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(2.dp),
                ) {
                    Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            Modifier
                                .size(44.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(p.lightColor),
                            contentAlignment = Alignment.Center,
                        ) { Text(p.emoji, fontSize = 22.sp) }
                        Spacer(Modifier.width(14.dp))
                        Column(Modifier.weight(1f)) {
                            Text(p.name, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = p.color)
                            Text(p.desc, fontSize = 12.sp, color = AppColor.TextSecondary)
                        }
                        Text("›", fontSize = 22.sp, color = p.color)
                    }
                }
            }

            // Market Pulse
            if (state.prices.isNotEmpty()) {
                item {
                    Spacer(Modifier.height(16.dp))
                    Text("📈 Market Pulse", fontWeight = FontWeight.ExtraBold, fontSize = 17.sp, color = AppColor.TextPrimary, modifier = Modifier.padding(horizontal = 20.dp))
                    Spacer(Modifier.height(8.dp))
                    LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        items(state.prices) { price ->
                            Card(
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                elevation = CardDefaults.cardElevation(2.dp),
                                modifier = Modifier.width(150.dp),
                            ) {
                                Column(Modifier.padding(14.dp)) {
                                    Text(price.crop_name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    price.district_name?.let { Text(it, fontSize = 11.sp, color = AppColor.TextMuted) }
                                    Spacer(Modifier.height(6.dp))
                                    Text("₹${price.modal_price?.toInt() ?: "--"}/${price.unit ?: "qtl"}", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = AppColor.Primary)
                                }
                            }
                        }
                    }
                }
            }

            // Quick links row
            item {
                Spacer(Modifier.height(16.dp))
                Text("🔗 Quick Actions", fontWeight = FontWeight.ExtraBold, fontSize = 17.sp, color = AppColor.TextPrimary, modifier = Modifier.padding(horizontal = 20.dp))
                Spacer(Modifier.height(8.dp))
                Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(
                        Triple("📦", "Orders", Routes.ORDERS),
                        Triple("💬", "Community", Routes.COMMUNITY),
                        Triple("🔔", "Alerts", Routes.NOTIFICATIONS),
                        Triple("📅", "Calendar", Routes.HARVEST_CALENDAR),
                    ).forEach { (emoji, label, route) ->
                        Card(
                            Modifier.weight(1f).clickable { navController.navigate(route) },
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(2.dp),
                        ) {
                            Column(Modifier.padding(14.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(emoji, fontSize = 24.sp)
                                Text(label, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = AppColor.TextPrimary)
                            }
                        }
                    }
                }
            }

            // Activity Feed
            if (state.activity.isNotEmpty()) {
                item {
                    Spacer(Modifier.height(16.dp))
                    Text("🔔 Recent Activity", fontWeight = FontWeight.ExtraBold, fontSize = 17.sp, color = AppColor.TextPrimary, modifier = Modifier.padding(horizontal = 20.dp))
                }
                items(state.activity) { item ->
                    Row(Modifier.padding(horizontal = 20.dp, vertical = 8.dp), verticalAlignment = Alignment.Top) {
                        Box(
                            Modifier.size(36.dp).clip(CircleShape).background(AppColor.Primary.copy(alpha = 0.1f)),
                            contentAlignment = Alignment.Center,
                        ) { Text("📋", fontSize = 16.sp) }
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text(item.description, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = AppColor.TextPrimary)
                            item.actor_name?.let { Text("by $it", fontSize = 11.sp, color = AppColor.TextMuted) }
                        }
                    }
                }
            }

            item { Spacer(Modifier.height(24.dp)) }
        }

        PullRefreshIndicator(state.refreshing, pullRefreshState, Modifier.align(Alignment.TopCenter), contentColor = AppColor.Primary)
    }
}
