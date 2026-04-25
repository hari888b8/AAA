package com.agrihub.app.ui.farmer

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.agrihub.app.data.repository.FarmerProfileRepository
import com.agrihub.app.ui.components.*
import com.agrihub.app.ui.theme.AppColor
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class FarmerDashViewModel @Inject constructor(
    private val farmerRepo: FarmerProfileRepository,
) : ViewModel() {
    private val _calendar = MutableStateFlow<List<HarvestCalendarItem>>(emptyList())
    val calendar: StateFlow<List<HarvestCalendarItem>> = _calendar.asStateFlow()
    private val _stats = MutableStateFlow(FarmerStats())
    val stats: StateFlow<FarmerStats> = _stats.asStateFlow()
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _loading.value = true
            try {
                _calendar.value = farmerRepo.getHarvestCalendar()
                _stats.value = farmerRepo.getStats()
            } catch (_: Exception) {}
            _loading.value = false
        }
    }
}

// ─── Harvest Calendar Screen ───────────────────────────────
@Composable
fun HarvestCalendarScreen(navController: NavController) {
    val vm: FarmerDashViewModel = hiltViewModel()
    val calendar by vm.calendar.collectAsState()
    val stats by vm.stats.collectAsState()
    val loading by vm.loading.collectAsState()

    Column(Modifier.fillMaxSize()) {
        GradientHeader(title = "Harvest Calendar", subtitle = "${calendar.size} crops tracked")

        // Stats row
        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Card(Modifier.weight(1f), shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = AppColor.Primary.copy(alpha = 0.1f))) {
                Column(Modifier.padding(10.dp)) {
                    Text("${stats.total_declarations}", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = AppColor.Primary)
                    Text("Declarations", fontSize = 11.sp, color = AppColor.TextSecondary)
                }
            }
            Card(Modifier.weight(1f), shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = AppColor.KisanOrange.copy(alpha = 0.1f))) {
                Column(Modifier.padding(10.dp)) {
                    Text("${stats.active_listings}", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = AppColor.KisanOrange)
                    Text("Active Listings", fontSize = 11.sp, color = AppColor.TextSecondary)
                }
            }
            Card(Modifier.weight(1f), shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = AppColor.AquaTeal.copy(alpha = 0.1f))) {
                Column(Modifier.padding(10.dp)) {
                    Text("${stats.total_inquiries}", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = AppColor.AquaTeal)
                    Text("Inquiries", fontSize = 11.sp, color = AppColor.TextSecondary)
                }
            }
        }

        if (loading) {
            LoadingScreen("Loading harvest data...")
        } else if (calendar.isEmpty()) {
            EmptyState("No crop declarations yet", "Declare your crops to see harvest timeline")
        } else {
            LazyColumn(Modifier.weight(1f).padding(horizontal = 16.dp)) {
                items(calendar) { item ->
                    HarvestCalendarCard(item)
                }
            }
        }
    }
}

@Composable
private fun HarvestCalendarCard(item: HarvestCalendarItem) {
    val daysToHarvest = item.days_to_harvest?.toInt() ?: 0
    val statusColor = when {
        daysToHarvest <= 0 -> AppColor.KisanOrange  // Harvest now
        daysToHarvest <= 15 -> AppColor.Primary      // Upcoming
        daysToHarvest <= 30 -> AppColor.AquaTeal    // Soon
        else -> AppColor.TextSecondary               // Future
    }
    val statusText = when {
        daysToHarvest <= 0 -> "Ready to Harvest"
        daysToHarvest <= 7 -> "$daysToHarvest days left"
        daysToHarvest <= 30 -> "$daysToHarvest days"
        else -> "${daysToHarvest}d"
    }

    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            // Harvest indicator dot
            Box(
                Modifier.size(44.dp).clip(CircleShape).background(statusColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center,
            ) {
                Text(item.icon_emoji ?: "🌱", fontSize = 20.sp)
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(item.crop_name, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                Text("${item.area_acres} acres • ${item.expected_yield ?: "?"} tons expected", fontSize = 12.sp, color = AppColor.TextSecondary)
                Text("Harvest: ${item.expected_harvest_date}", fontSize = 11.sp, color = AppColor.TextSecondary)
                if (item.is_organic) Text("🌿 Organic", fontSize = 11.sp, color = AppColor.Primary)
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(statusText, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = statusColor)
                Text("Grade: ${item.quality_grade}", fontSize = 10.sp, color = AppColor.TextSecondary)
            }
        }
    }
}
