@file:OptIn(ExperimentalMaterial3Api::class, ExperimentalMaterialApi::class)
package com.agrihub.app.ui.fpo

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.material3.ExperimentalMaterial3Api
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
import com.agrihub.app.data.repository.FpoRepository
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

// ─── FPO ViewModel ─────────────────────────────────────────
@HiltViewModel
class FpoViewModel @Inject constructor(
    private val fpoRepo: FpoRepository,
    private val agriFlowRepo: AgriFlowRepository,
) : ViewModel() {
    private val _stats = MutableStateFlow(FpoStats())
    val stats: StateFlow<FpoStats> = _stats.asStateFlow()
    private val _members = MutableStateFlow<List<FpoMember>>(emptyList())
    val members: StateFlow<List<FpoMember>> = _members.asStateFlow()
    private val _procurement = MutableStateFlow<List<ProcurementRecord>>(emptyList())
    val procurement: StateFlow<List<ProcurementRecord>> = _procurement.asStateFlow()
    private val _inventory = MutableStateFlow<List<FpoInventoryItem>>(emptyList())
    val inventory: StateFlow<List<FpoInventoryItem>> = _inventory.asStateFlow()
    private val _supplyListings = MutableStateFlow<List<FpoSupplyListing>>(emptyList())
    val supplyListings: StateFlow<List<FpoSupplyListing>> = _supplyListings.asStateFlow()
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()
    private val _crops = MutableStateFlow<List<Crop>>(emptyList())
    val crops: StateFlow<List<Crop>> = _crops.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _loading.value = true
            try {
                _stats.value = fpoRepo.getStats()
                _members.value = fpoRepo.getMembers().members
                _procurement.value = fpoRepo.getProcurement()
                _inventory.value = fpoRepo.getInventory()
                _supplyListings.value = fpoRepo.getSupplyListings()
                _crops.value = agriFlowRepo.refreshCrops()
            } catch (_: Exception) {}
            _loading.value = false
        }
    }

    fun addMember(phone: String, onDone: () -> Unit) {
        viewModelScope.launch {
            try { fpoRepo.addMember(phone); load(); onDone() } catch (_: Exception) {}
        }
    }

    fun recordProcurement(body: Map<String, Any?>, onDone: () -> Unit) {
        viewModelScope.launch {
            try { fpoRepo.recordProcurement(body); load(); onDone() } catch (_: Exception) {}
        }
    }

    fun createListing(body: Map<String, Any?>, onDone: () -> Unit) {
        viewModelScope.launch {
            try { fpoRepo.createSupplyListing(body); load(); onDone() } catch (_: Exception) {}
        }
    }
}

// ─── FPO Dashboard ─────────────────────────────────────────
@OptIn(ExperimentalMaterialApi::class)
@Composable
fun FpoDashboardScreen(navController: NavController) {
    val vm: FpoViewModel = hiltViewModel()
    val stats by vm.stats.collectAsState()
    val loading by vm.loading.collectAsState()
    val pullState = rememberPullRefreshState(loading, { vm.load() })

    Box(Modifier.fillMaxSize().pullRefresh(pullState)) {
        LazyColumn(Modifier.fillMaxSize()) {
            item {
                GradientHeader(
                    title = "FPO Dashboard",
                    subtitle = "Manage your farmer organization",
                    colors = listOf(AppColor.FpoBlue, AppColor.FpoBlue.copy(alpha = 0.7f)),
                )
            }
            item {
                Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatCard(Modifier.weight(1f), "Members", "${stats.member_count}", AppColor.FpoBlue)
                    StatCard(Modifier.weight(1f), "Procurement", "₹${formatAmount(stats.procurement_total)}", AppColor.Primary)
                }
            }
            item {
                Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatCard(Modifier.weight(1f), "Inventory", "${(stats.inventory_kg / 1000).toInt()} Tons", AppColor.AquaTeal)
                    StatCard(Modifier.weight(1f), "Active Listings", "${stats.active_listings}", AppColor.KisanOrange)
                }
            }
            item { Spacer(Modifier.height(16.dp)) }
            item {
                SectionTitle("Quick Actions")
                Column(Modifier.padding(horizontal = 16.dp)) {
                    ActionCard("👥 Manage Members", "Add farmers, view member directory") {
                        navController.navigate(Routes.FPO_MEMBERS)
                    }
                    ActionCard("📦 Record Procurement", "Record crop purchases from farmers") {
                        navController.navigate(Routes.FPO_PROCUREMENT)
                    }
                    ActionCard("🏪 View Inventory", "Check stock levels across locations") {
                        navController.navigate(Routes.FPO_INVENTORY)
                    }
                    ActionCard("📢 Supply Listings", "Publish supply for buyer discovery") {
                        navController.navigate(Routes.FPO_SUPPLY_LISTINGS)
                    }
                    ActionCard("📊 Create Supply Listing", "List available produce for buyers") {
                        navController.navigate(Routes.FPO_CREATE_LISTING)
                    }
                }
            }
            item { Spacer(Modifier.height(80.dp)) }
        }
        PullRefreshIndicator(loading, pullState, Modifier.align(Alignment.TopCenter))
    }
}

@Composable
private fun StatCard(modifier: Modifier, label: String, value: String, color: Color) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.1f)),
    ) {
        Column(Modifier.padding(12.dp)) {
            Text(value, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = color)
            Text(label, fontSize = 12.sp, color = AppColor.TextSecondary)
        }
    }
}

private fun formatAmount(amount: Double): String {
    return when {
        amount >= 10_000_000 -> String.format("%.1f Cr", amount / 10_000_000)
        amount >= 100_000 -> String.format("%.1f L", amount / 100_000)
        amount >= 1000 -> String.format("%.1fK", amount / 1000)
        else -> String.format("%.0f", amount)
    }
}

// ─── Members Screen ────────────────────────────────────────
@Composable
fun FpoMembersScreen(navController: NavController) {
    val vm: FpoViewModel = hiltViewModel()
    val members by vm.members.collectAsState()
    var showDialog by remember { mutableStateOf(false) }
    var phone by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize()) {
        GradientHeader(title = "Member Directory", subtitle = "${members.size} active members",
            colors = listOf(AppColor.FpoBlue, AppColor.FpoBlue.copy(alpha = 0.7f)))

        LazyColumn(Modifier.weight(1f).padding(horizontal = 16.dp)) {
            items(members) { m ->
                Card(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    shape = RoundedCornerShape(12.dp),
                ) {
                    Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(m.farmer_name ?: "Unknown", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                            Text("${m.village ?: ""} • ${m.total_land_acres ?: 0} acres", fontSize = 12.sp, color = AppColor.TextSecondary)
                        }
                        StatusBadge(m.status)
                    }
                }
            }
        }

        FloatingActionButton(
            onClick = { showDialog = true },
            modifier = Modifier.align(Alignment.End).padding(16.dp),
            containerColor = AppColor.FpoBlue,
        ) { Icon(Icons.Default.PersonAdd, "Add Member", tint = Color.White) }
    }

    if (showDialog) {
        AlertDialog(
            onDismissRequest = { showDialog = false },
            title = { Text("Add Farmer Member") },
            text = {
                OutlinedTextField(value = phone, onValueChange = { phone = it },
                    label = { Text("Farmer's Phone Number") }, singleLine = true)
            },
            confirmButton = {
                TextButton(onClick = { vm.addMember(phone) { showDialog = false; phone = "" } }) { Text("Add") }
            },
            dismissButton = { TextButton(onClick = { showDialog = false }) { Text("Cancel") } },
        )
    }
}

// ─── Procurement Screen ────────────────────────────────────
@Composable
fun FpoProcurementScreen(navController: NavController) {
    val vm: FpoViewModel = hiltViewModel()
    val records by vm.procurement.collectAsState()
    val members by vm.members.collectAsState()
    val crops by vm.crops.collectAsState()
    var showForm by remember { mutableStateOf(false) }

    if (showForm) {
        ProcurementForm(members, crops, onSubmit = { body ->
            vm.recordProcurement(body) { showForm = false }
        }, onDismiss = { showForm = false })
        return
    }

    Column(Modifier.fillMaxSize()) {
        GradientHeader(title = "Procurement Records", subtitle = "${records.size} purchases recorded",
            colors = listOf(AppColor.FpoBlue, AppColor.FpoBlue.copy(alpha = 0.7f)))
        LazyColumn(Modifier.weight(1f).padding(horizontal = 16.dp)) {
            items(records) { r ->
                Card(Modifier.fillMaxWidth().padding(vertical = 4.dp), shape = RoundedCornerShape(12.dp)) {
                    Column(Modifier.padding(12.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(r.crop_name ?: "Crop", fontWeight = FontWeight.SemiBold)
                            StatusBadge(r.payment_status)
                        }
                        Text("Farmer: ${r.farmer_name ?: "Unknown"}", fontSize = 12.sp, color = AppColor.TextSecondary)
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("${r.quantity_kg} kg @ ₹${r.price_per_kg}/kg", fontSize = 12.sp)
                            Text("₹${r.net_payable}", fontWeight = FontWeight.Bold, color = AppColor.Primary)
                        }
                    }
                }
            }
        }
        FloatingActionButton(
            onClick = { showForm = true },
            modifier = Modifier.align(Alignment.End).padding(16.dp),
            containerColor = AppColor.FpoBlue,
        ) { Icon(Icons.Default.Add, "Record Procurement", tint = Color.White) }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProcurementForm(members: List<FpoMember>, crops: List<Crop>, onSubmit: (Map<String, Any?>) -> Unit, onDismiss: () -> Unit) {
    var selectedFarmer by remember { mutableStateOf<FpoMember?>(null) }
    var selectedCrop by remember { mutableStateOf<Crop?>(null) }
    var quantity by remember { mutableStateOf("") }
    var pricePerKg by remember { mutableStateOf("") }
    var grade by remember { mutableStateOf("A") }
    var center by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        GradientHeader(title = "Record Procurement", subtitle = "Step-by-step procurement entry",
            colors = listOf(AppColor.FpoBlue, AppColor.FpoBlue.copy(alpha = 0.7f)))
        Column(Modifier.padding(16.dp)) {
            Text("Step 1: Select Farmer", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Spacer(Modifier.height(4.dp))
            members.take(10).forEach { m ->
                Row(
                    Modifier.fillMaxWidth().clickable { selectedFarmer = m }
                        .padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    RadioButton(selected = selectedFarmer?.id == m.id, onClick = { selectedFarmer = m })
                    Text("${m.farmer_name} - ${m.village ?: ""}", fontSize = 13.sp)
                }
            }

            Spacer(Modifier.height(12.dp))
            Text("Step 2: Crop & Quantity", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Spacer(Modifier.height(4.dp))
            // Crop selection
            var cropExpanded by remember { mutableStateOf(false) }
            ExposedDropdownMenuBox(expanded = cropExpanded, onExpandedChange = { cropExpanded = !cropExpanded }) {
                OutlinedTextField(
                    value = selectedCrop?.name ?: "Select Crop", onValueChange = {},
                    readOnly = true, modifier = Modifier.fillMaxWidth().menuAnchor(),
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(cropExpanded) },
                    shape = RoundedCornerShape(12.dp),
                )
                ExposedDropdownMenu(expanded = cropExpanded, onDismissRequest = { cropExpanded = false }) {
                    crops.take(20).forEach { c ->
                        DropdownMenuItem(text = { Text("${c.emoji ?: ""} ${c.name}") },
                            onClick = { selectedCrop = c; cropExpanded = false })
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = quantity, onValueChange = { quantity = it },
                    label = { Text("Quantity (kg)") }, modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp), singleLine = true)
                OutlinedTextField(value = pricePerKg, onValueChange = { pricePerKg = it },
                    label = { Text("₹ per kg") }, modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp), singleLine = true)
            }

            Spacer(Modifier.height(8.dp))
            Text("Quality: ${grade}", fontSize = 13.sp)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("A+", "A", "B", "C").forEach { g ->
                    FilterChip(selected = grade == g, onClick = { grade = g }, label = { Text(g) })
                }
            }

            Spacer(Modifier.height(8.dp))
            OutlinedTextField(value = center, onValueChange = { center = it },
                label = { Text("Collection Center") }, modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp), singleLine = true)

            // Summary
            val qty = quantity.toDoubleOrNull() ?: 0.0
            val price = pricePerKg.toDoubleOrNull() ?: 0.0
            val gross = qty * price
            if (gross > 0) {
                Spacer(Modifier.height(12.dp))
                Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = AppColor.Primary.copy(alpha = 0.08f))) {
                    Column(Modifier.padding(12.dp)) {
                        Text("Summary", fontWeight = FontWeight.Bold)
                        StatRow("Gross Amount", "₹${String.format("%.2f", gross)}")
                        StatRow("Net Payable", "₹${String.format("%.2f", gross)}")
                    }
                }
            }

            Spacer(Modifier.height(16.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Cancel") }
                Button(
                    onClick = {
                        onSubmit(mapOf(
                            "farmer_id" to selectedFarmer?.farmer_id,
                            "crop_id" to selectedCrop?.id,
                            "quantity_kg" to qty, "quality_grade" to grade,
                            "price_per_kg" to price, "collection_center" to center,
                        ))
                    },
                    enabled = selectedFarmer != null && selectedCrop != null && qty > 0 && price > 0,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = AppColor.FpoBlue),
                ) { Text("Record", fontWeight = FontWeight.Bold) }
            }
        }
    }
}

// ─── Inventory Screen ──────────────────────────────────────
@Composable
fun FpoInventoryScreen(navController: NavController) {
    val vm: FpoViewModel = hiltViewModel()
    val inventory by vm.inventory.collectAsState()

    Column(Modifier.fillMaxSize()) {
        GradientHeader(title = "Inventory", subtitle = "${inventory.size} items in stock",
            colors = listOf(AppColor.FpoBlue, AppColor.FpoBlue.copy(alpha = 0.7f)))
        LazyColumn(Modifier.weight(1f).padding(horizontal = 16.dp)) {
            items(inventory) { item ->
                Card(Modifier.fillMaxWidth().padding(vertical = 4.dp), shape = RoundedCornerShape(12.dp)) {
                    Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(item.crop_name ?: "Crop", fontWeight = FontWeight.SemiBold)
                            Text("${item.storage_location ?: "Unknown"} • ${item.storage_type ?: ""}", fontSize = 12.sp, color = AppColor.TextSecondary)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("${(item.quantity_kg / 1000)} T", fontWeight = FontWeight.Bold, color = AppColor.Primary)
                            StatusBadge(item.freshness_status)
                        }
                    }
                }
            }
        }
    }
}

// ─── Supply Listings Screen ────────────────────────────────
@Composable
fun FpoSupplyListingsScreen(navController: NavController) {
    val vm: FpoViewModel = hiltViewModel()
    val listings by vm.supplyListings.collectAsState()

    Column(Modifier.fillMaxSize()) {
        GradientHeader(title = "Supply Listings", subtitle = "${listings.size} active listings",
            colors = listOf(AppColor.FpoBlue, AppColor.FpoBlue.copy(alpha = 0.7f)))
        LazyColumn(Modifier.weight(1f).padding(horizontal = 16.dp)) {
            items(listings) { l ->
                Card(Modifier.fillMaxWidth().padding(vertical = 4.dp), shape = RoundedCornerShape(12.dp)) {
                    Column(Modifier.padding(12.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(l.crop_name ?: "Crop", fontWeight = FontWeight.SemiBold)
                            Text("${l.inquiry_count} inquiries", fontSize = 11.sp, color = AppColor.Primary)
                        }
                        Text("${(l.quantity_available / 1000)} Tons • Grade ${l.quality_grade}", fontSize = 12.sp, color = AppColor.TextSecondary)
                        l.price_per_kg?.let { Text("₹$it/kg", fontWeight = FontWeight.Bold, color = AppColor.Primary) }
                        StatusBadge(l.status)
                    }
                }
            }
        }
        FloatingActionButton(
            onClick = { navController.navigate(Routes.FPO_CREATE_LISTING) },
            modifier = Modifier.align(Alignment.End).padding(16.dp),
            containerColor = AppColor.FpoBlue,
        ) { Icon(Icons.Default.Add, "Create Listing", tint = Color.White) }
    }
}

// ─── Create Supply Listing Screen ──────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FpoCreateListingScreen(navController: NavController) {
    val vm: FpoViewModel = hiltViewModel()
    val crops by vm.crops.collectAsState()
    var selectedCrop by remember { mutableStateOf<Crop?>(null) }
    var quantity by remember { mutableStateOf("") }
    var grade by remember { mutableStateOf("A") }
    var pricePerKg by remember { mutableStateOf("") }
    var minOrder by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        GradientHeader(title = "Create Supply Listing", subtitle = "Publish your supply for buyers",
            colors = listOf(AppColor.FpoBlue, AppColor.FpoBlue.copy(alpha = 0.7f)))
        Column(Modifier.padding(16.dp)) {
            var cropExpanded by remember { mutableStateOf(false) }
            ExposedDropdownMenuBox(expanded = cropExpanded, onExpandedChange = { cropExpanded = !cropExpanded }) {
                OutlinedTextField(
                    value = selectedCrop?.name ?: "Select Crop", onValueChange = {},
                    readOnly = true, modifier = Modifier.fillMaxWidth().menuAnchor(),
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(cropExpanded) },
                    shape = RoundedCornerShape(12.dp),
                )
                ExposedDropdownMenu(expanded = cropExpanded, onDismissRequest = { cropExpanded = false }) {
                    crops.take(20).forEach { c ->
                        DropdownMenuItem(text = { Text("${c.emoji ?: ""} ${c.name}") },
                            onClick = { selectedCrop = c; cropExpanded = false })
                    }
                }
            }
            Spacer(Modifier.height(8.dp))

            OutlinedTextField(value = quantity, onValueChange = { quantity = it },
                label = { Text("Available Quantity (kg)") }, modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp), singleLine = true)
            Spacer(Modifier.height(8.dp))

            Text("Quality Grade"); Spacer(Modifier.height(4.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("A+", "A", "B", "C").forEach { g ->
                    FilterChip(selected = grade == g, onClick = { grade = g }, label = { Text(g) })
                }
            }
            Spacer(Modifier.height(8.dp))

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = pricePerKg, onValueChange = { pricePerKg = it },
                    label = { Text("Price ₹/kg") }, modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp), singleLine = true)
                OutlinedTextField(value = minOrder, onValueChange = { minOrder = it },
                    label = { Text("Min Order (kg)") }, modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp), singleLine = true)
            }
            Spacer(Modifier.height(8.dp))

            OutlinedTextField(value = notes, onValueChange = { notes = it },
                label = { Text("Special Notes") }, modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp), minLines = 2)
            Spacer(Modifier.height(16.dp))

            Button(
                onClick = {
                    vm.createListing(mapOf(
                        "crop_id" to selectedCrop?.id,
                        "quantity_available" to (quantity.toDoubleOrNull() ?: 0),
                        "quality_grade" to grade,
                        "price_per_kg" to pricePerKg.toDoubleOrNull(),
                        "min_order_kg" to minOrder.toDoubleOrNull(),
                        "special_notes" to notes,
                    )) { navController.popBackStack() }
                },
                enabled = selectedCrop != null && (quantity.toDoubleOrNull() ?: 0.0) > 0,
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AppColor.FpoBlue),
            ) { Text("Publish Listing", fontWeight = FontWeight.Bold) }
        }
    }
}
