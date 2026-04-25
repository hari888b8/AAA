package com.agrihub.app.ui.buyer

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.agrihub.app.data.model.*
import com.agrihub.app.data.repository.BuyerRepository
import com.agrihub.app.data.repository.AgriFlowRepository
import com.agrihub.app.ui.components.*
import com.agrihub.app.ui.navigation.Routes
import com.agrihub.app.ui.theme.AppColor
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

// ─── Buyer ViewModel ───────────────────────────────────────
@HiltViewModel
class BuyerViewModel @Inject constructor(
    private val buyerRepo: BuyerRepository,
    private val agriFlowRepo: AgriFlowRepository,
) : ViewModel() {
    private val _stats = MutableStateFlow(BuyerStats())
    val stats: StateFlow<BuyerStats> = _stats.asStateFlow()
    private val _searchResults = MutableStateFlow<List<FpoSupplyListing>>(emptyList())
    val searchResults: StateFlow<List<FpoSupplyListing>> = _searchResults.asStateFlow()
    private val _inquiries = MutableStateFlow<List<BuyerInquiry>>(emptyList())
    val inquiries: StateFlow<List<BuyerInquiry>> = _inquiries.asStateFlow()
    private val _watchlist = MutableStateFlow<List<WatchlistItem>>(emptyList())
    val watchlist: StateFlow<List<WatchlistItem>> = _watchlist.asStateFlow()
    private val _intelligence = MutableStateFlow<List<SupplyIntelligenceItem>>(emptyList())
    val intelligence: StateFlow<List<SupplyIntelligenceItem>> = _intelligence.asStateFlow()
    private val _crops = MutableStateFlow<List<Crop>>(emptyList())
    val crops: StateFlow<List<Crop>> = _crops.asStateFlow()
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _loading.value = true
            try {
                _stats.value = buyerRepo.getStats()
                _inquiries.value = buyerRepo.getInquiries()
                _watchlist.value = buyerRepo.getWatchlist()
                _crops.value = agriFlowRepo.refreshCrops()
            } catch (_: Exception) {}
            _loading.value = false
        }
    }

    fun searchSupply(cropId: Int? = null, state: String? = null, quality: String? = null) {
        viewModelScope.launch {
            _loading.value = true
            try { _searchResults.value = buyerRepo.searchSupply(cropId = cropId, state = state, quality = quality) } catch (_: Exception) {}
            _loading.value = false
        }
    }

    fun loadIntelligence(cropId: Int? = null, state: String? = null) {
        viewModelScope.launch {
            try { _intelligence.value = buyerRepo.getIntelligence(cropId, state) } catch (_: Exception) {}
        }
    }

    fun sendInquiry(body: Map<String, Any?>, onDone: () -> Unit) {
        viewModelScope.launch {
            try { buyerRepo.sendInquiry(body); load(); onDone() } catch (_: Exception) {}
        }
    }

    fun addWatchlist(body: Map<String, Any?>, onDone: () -> Unit) {
        viewModelScope.launch {
            try { buyerRepo.addToWatchlist(body); load(); onDone() } catch (_: Exception) {}
        }
    }

    fun removeWatchlist(id: String) {
        viewModelScope.launch {
            try { buyerRepo.removeFromWatchlist(id); load() } catch (_: Exception) {}
        }
    }
}

// ─── Buyer Dashboard ───────────────────────────────────────
@OptIn(ExperimentalMaterialApi::class)
@Composable
fun BuyerDashboardScreen(navController: NavController) {
    val vm: BuyerViewModel = hiltViewModel()
    val stats by vm.stats.collectAsState()
    val loading by vm.loading.collectAsState()
    val pullState = rememberPullRefreshState(loading, { vm.load() })

    Box(Modifier.fillMaxSize().pullRefresh(pullState)) {
        LazyColumn(Modifier.fillMaxSize()) {
            item {
                GradientHeader(
                    title = "Buyer Intelligence",
                    subtitle = "Supply discovery & market insights",
                    colors = listOf(AppColor.BuyerOrange, AppColor.BuyerOrange.copy(alpha = 0.7f)),
                )
            }
            item {
                Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Card(Modifier.weight(1f), shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = AppColor.BuyerOrange.copy(alpha = 0.1f))) {
                        Column(Modifier.padding(12.dp)) {
                            Text("${stats.available_listings}", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = AppColor.BuyerOrange)
                            Text("Available Listings", fontSize = 11.sp, color = AppColor.TextSecondary)
                        }
                    }
                    Card(Modifier.weight(1f), shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = AppColor.Primary.copy(alpha = 0.1f))) {
                        Column(Modifier.padding(12.dp)) {
                            Text("${stats.total_inquiries}", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = AppColor.Primary)
                            Text("My Inquiries", fontSize = 11.sp, color = AppColor.TextSecondary)
                        }
                    }
                    Card(Modifier.weight(1f), shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = AppColor.AquaTeal.copy(alpha = 0.1f))) {
                        Column(Modifier.padding(12.dp)) {
                            Text("${stats.active_watchlists}", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = AppColor.AquaTeal)
                            Text("Watchlists", fontSize = 11.sp, color = AppColor.TextSecondary)
                        }
                    }
                }
            }
            item { Spacer(Modifier.height(8.dp)) }
            item {
                SectionTitle("Quick Actions")
                Column(Modifier.padding(horizontal = 16.dp)) {
                    ActionCard("🔍 Search Supply", "Find crops by state, district, quality, quantity") {
                        navController.navigate(Routes.BUYER_SEARCH)
                    }
                    ActionCard("📬 My Inquiries", "Track all sent inquiries and responses") {
                        navController.navigate(Routes.BUYER_INQUIRIES)
                    }
                    ActionCard("📋 Watchlist & Alerts", "Get notified when matching supply appears") {
                        navController.navigate(Routes.BUYER_WATCHLIST)
                    }
                    ActionCard("📊 Supply Intelligence", "Crop heatmaps, forecasts & trends") {
                        navController.navigate(Routes.BUYER_INTELLIGENCE)
                    }
                }
            }
            item { Spacer(Modifier.height(80.dp)) }
        }
        PullRefreshIndicator(loading, pullState, Modifier.align(Alignment.TopCenter))
    }
}

// ─── Supply Search Screen ──────────────────────────────────
@Composable
fun BuyerSearchScreen(navController: NavController) {
    val vm: BuyerViewModel = hiltViewModel()
    val results by vm.searchResults.collectAsState()
    val crops by vm.crops.collectAsState()
    val loading by vm.loading.collectAsState()
    var selectedCropId by remember { mutableStateOf<Int?>(null) }
    var stateFilter by remember { mutableStateOf("") }
    var qualityFilter by remember { mutableStateOf<String?>(null) }
    var showFilters by remember { mutableStateOf(true) }

    Column(Modifier.fillMaxSize()) {
        GradientHeader(title = "Supply Search", subtitle = "Find crops across India",
            colors = listOf(AppColor.BuyerOrange, AppColor.BuyerOrange.copy(alpha = 0.7f)))

        // Search Filters
        if (showFilters) {
            Column(Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                // Crop filter
                Text("Crop", fontSize = 12.sp, color = AppColor.TextSecondary)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    item {
                        FilterChip(selected = selectedCropId == null, onClick = { selectedCropId = null },
                            label = { Text("All", fontSize = 11.sp) })
                    }
                    items(crops.take(15)) { c ->
                        FilterChip(selected = selectedCropId == c.id,
                            onClick = { selectedCropId = if (selectedCropId == c.id) null else c.id },
                            label = { Text("${c.emoji ?: ""} ${c.name}", fontSize = 11.sp) })
                    }
                }
                Spacer(Modifier.height(6.dp))

                // State filter
                OutlinedTextField(value = stateFilter, onValueChange = { stateFilter = it },
                    label = { Text("State (e.g. Andhra Pradesh)") }, modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp), singleLine = true)
                Spacer(Modifier.height(6.dp))

                // Quality filter
                Text("Quality Grade", fontSize = 12.sp, color = AppColor.TextSecondary)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf(null, "A+", "A", "B").forEach { g ->
                        FilterChip(selected = qualityFilter == g,
                            onClick = { qualityFilter = g },
                            label = { Text(g ?: "Any", fontSize = 11.sp) })
                    }
                }
                Spacer(Modifier.height(8.dp))

                Button(
                    onClick = { vm.searchSupply(selectedCropId, stateFilter.ifBlank { null }, qualityFilter); showFilters = false },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AppColor.BuyerOrange),
                ) { Text("Search Supply", fontWeight = FontWeight.Bold) }
            }
        } else {
            TextButton(onClick = { showFilters = true }, modifier = Modifier.padding(horizontal = 16.dp)) {
                Icon(Icons.Default.FilterList, "Filter"); Spacer(Modifier.width(4.dp)); Text("Modify Filters")
            }
        }

        if (loading) {
            LoadingScreen("Searching supply...")
        } else {
            LazyColumn(Modifier.weight(1f).padding(horizontal = 16.dp)) {
                item {
                    if (results.isNotEmpty()) Text("${results.size} results found", fontSize = 12.sp, color = AppColor.TextSecondary,
                        modifier = Modifier.padding(vertical = 4.dp))
                }
                items(results) { listing ->
                    SupplyResultCard(listing, onInquiry = {
                        navController.navigate(Routes.buyerInquiryForm(listing.id))
                    })
                }
            }
        }
    }
}

@Composable
private fun SupplyResultCard(listing: FpoSupplyListing, onInquiry: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Row {
                    Text(listing.crop_name ?: "Crop", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Spacer(Modifier.width(6.dp))
                    StatusBadge("Grade ${listing.quality_grade}")
                }
                if (listing.source_type == "fpo") {
                    Text("✅ FPO", fontSize = 11.sp, color = AppColor.Primary)
                }
            }
            Spacer(Modifier.height(4.dp))
            Text("Volume: ~${(listing.quantity_available / 1000).toInt()} Tons", fontSize = 13.sp)
            listing.district_name?.let { Text("📍 $it, ${listing.state_name ?: ""}", fontSize = 12.sp, color = AppColor.TextSecondary) }
            listing.fpo_name?.let { Text("FPO: $it (${listing.member_count ?: 0} members)", fontSize = 12.sp, color = AppColor.TextSecondary) }
            listing.price_per_kg?.let { Text("₹$it/kg (Negotiable)", fontWeight = FontWeight.SemiBold, color = AppColor.Primary) }
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = onInquiry, modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(8.dp)) { Text("Send Inquiry", fontSize = 12.sp) }
                OutlinedButton(onClick = {}, modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(8.dp)) { Text("+ Watchlist", fontSize = 12.sp) }
            }
        }
    }
}

// ─── Buyer Inquiry Form ────────────────────────────────────
@Composable
fun BuyerInquiryFormScreen(navController: NavController, listingId: String) {
    val vm: BuyerViewModel = hiltViewModel()
    var quantity by remember { mutableStateOf("") }
    var requiredBy by remember { mutableStateOf("") }
    var delivery by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        GradientHeader(title = "Send Inquiry", subtitle = "Contact the supplier",
            colors = listOf(AppColor.BuyerOrange, AppColor.BuyerOrange.copy(alpha = 0.7f)))
        Column(Modifier.padding(16.dp)) {
            OutlinedTextField(value = quantity, onValueChange = { quantity = it },
                label = { Text("Quantity Needed (kg)") }, modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp), singleLine = true)
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(value = requiredBy, onValueChange = { requiredBy = it },
                label = { Text("Required By (YYYY-MM-DD)") }, modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp), singleLine = true)
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(value = delivery, onValueChange = { delivery = it },
                label = { Text("Delivery Location") }, modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp), singleLine = true)
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(value = message, onValueChange = { message = it },
                label = { Text("Message to Supplier") }, modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp), minLines = 3)
            Spacer(Modifier.height(16.dp))
            Button(
                onClick = {
                    vm.sendInquiry(mapOf(
                        "fpo_listing_id" to listingId,
                        "quantity_needed" to quantity.toDoubleOrNull(),
                        "required_by_date" to requiredBy,
                        "delivery_location" to delivery,
                        "message" to message,
                    )) { navController.popBackStack() }
                },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AppColor.BuyerOrange),
            ) { Text("Send Inquiry", fontWeight = FontWeight.Bold) }
        }
    }
}

// ─── Buyer Inquiries Screen ────────────────────────────────
@Composable
fun BuyerInquiriesScreen(navController: NavController) {
    val vm: BuyerViewModel = hiltViewModel()
    val inquiries by vm.inquiries.collectAsState()

    Column(Modifier.fillMaxSize()) {
        GradientHeader(title = "My Inquiries", subtitle = "${inquiries.size} total",
            colors = listOf(AppColor.BuyerOrange, AppColor.BuyerOrange.copy(alpha = 0.7f)))
        LazyColumn(Modifier.weight(1f).padding(horizontal = 16.dp)) {
            items(inquiries) { inq ->
                Card(Modifier.fillMaxWidth().padding(vertical = 4.dp), shape = RoundedCornerShape(12.dp)) {
                    Column(Modifier.padding(12.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(inq.crop_name ?: "Inquiry", fontWeight = FontWeight.SemiBold)
                            StatusBadge(inq.status)
                        }
                        inq.fpo_name?.let { Text("To: $it", fontSize = 12.sp, color = AppColor.TextSecondary) }
                        Text("Qty: ${inq.quantity_needed ?: "N/A"} kg", fontSize = 12.sp)
                        inq.message?.let { Text(it, fontSize = 12.sp, color = AppColor.TextSecondary, maxLines = 2) }
                        inq.response_message?.let {
                            Text("Reply: $it", fontSize = 12.sp, color = AppColor.Primary, fontWeight = FontWeight.Medium)
                        }
                    }
                }
            }
        }
    }
}

// ─── Watchlist Screen ──────────────────────────────────────
@Composable
fun BuyerWatchlistScreen(navController: NavController) {
    val vm: BuyerViewModel = hiltViewModel()
    val watchlist by vm.watchlist.collectAsState()
    val crops by vm.crops.collectAsState()
    var showAdd by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxSize()) {
        GradientHeader(title = "Watchlist & Alerts", subtitle = "${watchlist.size} active alerts",
            colors = listOf(AppColor.BuyerOrange, AppColor.BuyerOrange.copy(alpha = 0.7f)))
        LazyColumn(Modifier.weight(1f).padding(horizontal = 16.dp)) {
            items(watchlist) { item ->
                Card(Modifier.fillMaxWidth().padding(vertical = 4.dp), shape = RoundedCornerShape(12.dp)) {
                    Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(item.crop_name ?: "Crop", fontWeight = FontWeight.SemiBold)
                            Text("${item.state ?: ""} ${item.district_name ?: ""}", fontSize = 12.sp, color = AppColor.TextSecondary)
                            item.min_quantity_kg?.let { Text("Min: ${it}kg", fontSize = 11.sp) }
                            item.max_price_per_kg?.let { Text("Max: ₹$it/kg", fontSize = 11.sp) }
                        }
                        IconButton(onClick = { vm.removeWatchlist(item.id) }) {
                            Icon(Icons.Default.Delete, "Remove", tint = AppColor.Error)
                        }
                    }
                }
            }
            if (watchlist.isEmpty()) {
                item { EmptyState("No watchlist items yet", "Add crops to get alerted when supply matches") }
            }
        }
        FloatingActionButton(
            onClick = { showAdd = true },
            modifier = Modifier.align(Alignment.End).padding(16.dp),
            containerColor = AppColor.BuyerOrange,
        ) { Icon(Icons.Default.Add, "Add", tint = Color.White) }
    }

    if (showAdd) @OptIn(ExperimentalMaterial3Api::class) {
        var selectedCropId by remember { mutableStateOf<Int?>(null) }
        var stateVal by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showAdd = false },
            title = { Text("Add to Watchlist") },
            text = {
                Column {
                    var expanded by remember { mutableStateOf(false) }
                    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
                        OutlinedTextField(
                            value = crops.find { it.id == selectedCropId }?.name ?: "Select Crop",
                            onValueChange = {}, readOnly = true,
                            modifier = Modifier.fillMaxWidth().menuAnchor(),
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                        )
                        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                            crops.take(15).forEach { c ->
                                DropdownMenuItem(text = { Text("${c.emoji ?: ""} ${c.name}") },
                                    onClick = { selectedCropId = c.id; expanded = false })
                            }
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(value = stateVal, onValueChange = { stateVal = it },
                        label = { Text("State") }, singleLine = true)
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    vm.addWatchlist(mapOf("crop_id" to selectedCropId, "state" to stateVal)) { showAdd = false }
                }) { Text("Add") }
            },
            dismissButton = { TextButton(onClick = { showAdd = false }) { Text("Cancel") } },
        )
    }
}

// ─── Supply Intelligence Screen ────────────────────────────
@Composable
fun BuyerIntelligenceScreen(navController: NavController) {
    val vm: BuyerViewModel = hiltViewModel()
    val intelligence by vm.intelligence.collectAsState()
    val crops by vm.crops.collectAsState()
    var selectedCropId by remember { mutableStateOf<Int?>(null) }

    LaunchedEffect(Unit) { vm.loadIntelligence() }

    Column(Modifier.fillMaxSize()) {
        GradientHeader(title = "Supply Intelligence", subtitle = "Crop heatmaps & forecasts",
            colors = listOf(AppColor.BuyerOrange, AppColor.BuyerOrange.copy(alpha = 0.7f)))

        // Crop filter
        LazyRow(Modifier.padding(horizontal = 16.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            item { FilterChip(selected = selectedCropId == null, onClick = { selectedCropId = null; vm.loadIntelligence() },
                label = { Text("All") }) }
            items(crops.take(10)) { c ->
                FilterChip(selected = selectedCropId == c.id,
                    onClick = { selectedCropId = c.id; vm.loadIntelligence(cropId = c.id) },
                    label = { Text("${c.emoji ?: ""} ${c.name}", fontSize = 11.sp) })
            }
        }

        LazyColumn(Modifier.weight(1f).padding(horizontal = 16.dp)) {
            items(intelligence) { item ->
                Card(Modifier.fillMaxWidth().padding(vertical = 4.dp), shape = RoundedCornerShape(12.dp)) {
                    Column(Modifier.padding(12.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("${item.crop_name ?: ""}", fontWeight = FontWeight.Bold)
                            Text("${item.district_name ?: item.state ?: ""}", fontSize = 12.sp, color = AppColor.TextSecondary)
                        }
                        Spacer(Modifier.height(4.dp))
                        item.total_declared_area?.let { StatRow("Declared Area", "${it} acres") }
                        item.forecast_harvest_tons?.let { StatRow("Forecast Harvest", "${it} tons") }
                        item.forecast_confidence?.let { StatRow("Confidence", "${it}%") }
                        item.farmer_count?.let { StatRow("Farmers Declaring", "$it") }
                        item.fpo_listed_tons?.let { StatRow("FPO Listed", "${it} tons") }
                        item.price_trend_7d?.let {
                            val color = if (it >= 0) AppColor.Primary else AppColor.Error
                            StatRow("7-Day Price Trend", "${if (it >= 0) "+" else ""}${it}%", valueColor = color)
                        }
                    }
                }
            }
            if (intelligence.isEmpty()) {
                item { EmptyState("No intelligence data available", "Data is computed from farmer declarations") }
            }
        }
    }
}
