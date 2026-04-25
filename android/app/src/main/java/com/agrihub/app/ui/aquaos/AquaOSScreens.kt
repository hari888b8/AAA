package com.agrihub.app.ui.aquaos

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.agrihub.app.data.model.*
import com.agrihub.app.data.repository.AquaOSRepository
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
class AquaOSViewModel @Inject constructor(private val repo: AquaOSRepository) : ViewModel() {
    private val _ponds = MutableStateFlow<List<Pond>>(emptyList())
    val ponds: StateFlow<List<Pond>> = _ponds.asStateFlow()
    private val _harvestListings = MutableStateFlow<List<HarvestListing>>(emptyList())
    val harvestListings: StateFlow<List<HarvestListing>> = _harvestListings.asStateFlow()
    private val _advisories = MutableStateFlow<List<Advisory>>(emptyList())
    val advisories: StateFlow<List<Advisory>> = _advisories.asStateFlow()
    private val _waterLogs = MutableStateFlow<List<WaterLog>>(emptyList())
    val waterLogs: StateFlow<List<WaterLog>> = _waterLogs.asStateFlow()
    private val _stats = MutableStateFlow(AquaStats())
    val stats: StateFlow<AquaStats> = _stats.asStateFlow()
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun loadPonds() = viewModelScope.launch {
        _loading.value = true; _error.value = null
        try { _ponds.value = repo.getPonds() } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }

    fun loadStats() = viewModelScope.launch {
        try { _stats.value = repo.getStats() } catch (_: Exception) {}
    }

    fun loadHarvestListings() = viewModelScope.launch {
        _loading.value = true
        try { _harvestListings.value = repo.getHarvestListings() } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }

    fun loadAdvisories() = viewModelScope.launch {
        try { _advisories.value = repo.getAdvisories() } catch (_: Exception) {}
    }

    fun loadWaterLogs(pondId: String) = viewModelScope.launch {
        _loading.value = true
        try { _waterLogs.value = repo.getWaterLogs(pondId) } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }

    fun createPond(body: Map<String, Any?>, onSuccess: () -> Unit) = viewModelScope.launch {
        _loading.value = true; _error.value = null
        try { repo.createPond(body); onSuccess() } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }

    fun addWaterLog(pondId: String, body: Map<String, Any?>, onSuccess: () -> Unit) = viewModelScope.launch {
        _loading.value = true
        try { repo.addWaterLog(pondId, body); onSuccess() } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }
}

// ─── AquaOS Home ───────────────────────────────────────────
@Composable
fun AquaOSHomeScreen(navController: NavController, viewModel: AquaOSViewModel = hiltViewModel()) {
    val stats by viewModel.stats.collectAsState()
    LaunchedEffect(Unit) { viewModel.loadStats() }

    LazyColumn(Modifier.fillMaxSize().background(AppColor.Background)) {
        item {
            GradientHeader("AquaOS", "Smart Aquaculture Management", Color(0xFF003D7A), AppColor.AquaOS) {
                StatRow(listOf(
                    Triple("🏊", "${stats.active_ponds ?: 0}", "Active"),
                    Triple("📐", "${stats.total_area ?: 0}", "Acres"),
                    Triple("📊", "${stats.avg_survival ?: 0}%", "Survival"),
                ))
            }
        }
        item { Spacer(Modifier.height(12.dp)) }
        item { ActionCard("🏊", "My Ponds", "Manage & monitor ponds", AppColor.AquaOS) { navController.navigate(Routes.PONDS) } }
        item { ActionCard("➕", "Add Pond", "Register a new pond", AppColor.AquaOS) { navController.navigate(Routes.ADD_POND) } }
        item { ActionCard("🐟", "Harvest Marketplace", "Buy/sell harvested fish", AppColor.AquaOS) { navController.navigate(Routes.HARVEST_LISTINGS) } }
        item { ActionCard("📋", "Advisories", "Expert aquaculture tips", AppColor.AquaOS) { navController.navigate(Routes.ADVISORIES) } }
        item { Spacer(Modifier.height(16.dp)) }
        item { SectionTitle("Water Quality Tips") }
        item { TipCard("💧", "Maintain pH between 7.5–8.5 for optimal growth") }
        item { TipCard("🌡️", "Keep water temp 26–32°C for Vannamei shrimp") }
        item { TipCard("🫧", "Dissolved oxygen > 4 mg/L prevents stress") }
        item { Spacer(Modifier.height(24.dp)) }
    }
}

@Composable
private fun TipCard(emoji: String, text: String) {
    Card(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 3.dp),
        shape = RoundedCornerShape(10.dp), colors = CardDefaults.cardColors(containerColor = AppColor.AquaOSLight),
    ) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(emoji, fontSize = 18.sp)
            Spacer(Modifier.width(10.dp))
            Text(text, fontSize = 13.sp, color = AppColor.TextSecondary)
        }
    }
}

// ─── Ponds Screen ──────────────────────────────────────────
@OptIn(ExperimentalMaterialApi::class)
@Composable
fun PondsScreen(navController: NavController, viewModel: AquaOSViewModel = hiltViewModel()) {
    val ponds by viewModel.ponds.collectAsState()
    val loading by viewModel.loading.collectAsState()
    LaunchedEffect(Unit) { viewModel.loadPonds() }
    val pullRefreshState = rememberPullRefreshState(loading, { viewModel.loadPonds() })

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("My Ponds", "${ponds.size} registered", Color(0xFF003D7A), AppColor.AquaOS, onBack = { navController.popBackStack() })
        Box(Modifier.weight(1f).pullRefresh(pullRefreshState)) {
            when {
                loading && ponds.isEmpty() -> LoadingScreen()
                ponds.isEmpty() -> EmptyState("🏊", "No ponds registered", "Add your first pond", "+ Add Pond") { navController.navigate(Routes.ADD_POND) }
                else -> LazyColumn(contentPadding = PaddingValues(vertical = 8.dp)) {
                    items(ponds) { pond ->
                        Card(
                            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp)
                                .clickable { navController.navigate(Routes.pondDetail(pond.id)) },
                            shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(2.dp),
                        ) {
                            Column(Modifier.padding(14.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Column(Modifier.weight(1f)) {
                                        Text(pond.pond_code, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = AppColor.AquaOS)
                                        Text("${pond.species} · ${pond.area_acres} acres", fontSize = 12.sp, color = AppColor.TextSecondary)
                                    }
                                    StatusBadge(pond.status, when (pond.status) { "active" -> AppColor.Success; "harvested" -> AppColor.Info; else -> AppColor.Warning })
                                }
                                Spacer(Modifier.height(8.dp))
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                                    MiniMetric("Stocked", "${pond.stocked_count ?: "—"}")
                                    MiniMetric("Survival", "${pond.survival_pct ?: "—"}%")
                                    MiniMetric("Avg Wt", "${pond.avg_weight_g ?: "—"}g")
                                    MiniMetric("DOC", "${pond.doc_computed?.toInt() ?: "—"}")
                                }
                            }
                        }
                    }
                }
            }
            PullRefreshIndicator(loading, pullRefreshState, Modifier.align(Alignment.TopCenter), contentColor = AppColor.AquaOS)
        }
    }
}

@Composable
private fun MiniMetric(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, fontSize = 10.sp, color = AppColor.TextMuted)
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = AppColor.TextPrimary)
    }
}

// ─── Pond Detail ───────────────────────────────────────────
@Composable
fun PondDetailScreen(navController: NavController, id: String, viewModel: AquaOSViewModel = hiltViewModel()) {
    val ponds by viewModel.ponds.collectAsState()
    val pond = ponds.find { it.id == id }
    LaunchedEffect(Unit) { if (ponds.isEmpty()) viewModel.loadPonds() }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader(pond?.pond_code ?: "Pond", "${pond?.species ?: ""} · ${pond?.area_acres ?: 0} acres", Color(0xFF003D7A), AppColor.AquaOS, onBack = { navController.popBackStack() })

        if (pond == null) { LoadingScreen(); return }

        LazyColumn(Modifier.weight(1f), contentPadding = PaddingValues(16.dp)) {
            item {
                Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(Modifier.padding(16.dp)) {
                        Text("Pond Metrics", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Spacer(Modifier.height(8.dp))
                        DetailRow("Status", pond.status)
                        DetailRow("Stocked Count", "${pond.stocked_count ?: "—"}")
                        DetailRow("Survival", "${pond.survival_pct ?: "—"}%")
                        DetailRow("Avg Weight", "${pond.avg_weight_g ?: "—"}g")
                        DetailRow("DOC", "${pond.doc_computed?.toInt() ?: "—"} days")
                    }
                }
            }
            item {
                Spacer(Modifier.height(12.dp))
                Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(Modifier.padding(16.dp)) {
                        Text("Water Quality", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Spacer(Modifier.height(8.dp))
                        DetailRow("pH Level", "${pond.ph_level ?: "—"}")
                        DetailRow("Temperature", "${pond.temperature_c ?: "—"}°C")
                        DetailRow("Dissolved O₂", "${pond.dissolved_o2 ?: "—"} mg/L")
                    }
                }
            }
            item {
                Spacer(Modifier.height(12.dp))
                Button(
                    onClick = { navController.navigate(Routes.waterLog(pond.id)) },
                    modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AppColor.AquaOS),
                ) { Text("📝 Log Water Quality") }
            }
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth().padding(vertical = 3.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, fontSize = 13.sp, color = AppColor.TextMuted)
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    }
}

// ─── Add Pond ──────────────────────────────────────────────
@Composable
fun AddPondScreen(navController: NavController, viewModel: AquaOSViewModel = hiltViewModel()) {
    val loading by viewModel.loading.collectAsState()
    val error by viewModel.error.collectAsState()
    var species by remember { mutableStateOf("Vannamei") }
    var area by remember { mutableStateOf("") }
    var stocked by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("Add Pond", "Register a new pond", Color(0xFF003D7A), AppColor.AquaOS, onBack = { navController.popBackStack() })
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedTextField(species, { species = it }, label = { Text("Species") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
            OutlinedTextField(area, { area = it }, label = { Text("Area (acres)") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal))
            OutlinedTextField(stocked, { stocked = it }, label = { Text("Stocked Count") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))

            error?.let { Text(it, color = AppColor.Error, fontSize = 12.sp) }

            Button(
                onClick = {
                    viewModel.createPond(mapOf("species" to species, "area_acres" to area.toDoubleOrNull(), "stocked_count" to stocked.toIntOrNull())) { navController.popBackStack() }
                },
                enabled = species.isNotBlank() && area.isNotBlank() && !loading,
                modifier = Modifier.fillMaxWidth().height(50.dp), shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AppColor.AquaOS),
            ) {
                if (loading) CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                else Text("Create Pond", fontWeight = FontWeight.Bold)
            }
        }
    }
}

// ─── Harvest Listings ──────────────────────────────────────
@Composable
fun HarvestListingsScreen(navController: NavController, viewModel: AquaOSViewModel = hiltViewModel()) {
    val listings by viewModel.harvestListings.collectAsState()
    val loading by viewModel.loading.collectAsState()
    LaunchedEffect(Unit) { viewModel.loadHarvestListings() }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("Harvest Marketplace", "${listings.size} listings", Color(0xFF003D7A), AppColor.AquaOS, onBack = { navController.popBackStack() })
        Box(Modifier.weight(1f)) {
            when {
                loading && listings.isEmpty() -> LoadingScreen()
                listings.isEmpty() -> EmptyState("🐟", "No harvest listings", "Harvest listings will appear here")
                else -> LazyColumn(contentPadding = PaddingValues(vertical = 8.dp)) {
                    items(listings) { hl ->
                        Card(
                            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color.White),
                        ) {
                            Column(Modifier.padding(14.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("🐟 ${hl.species}", fontWeight = FontWeight.Bold, fontSize = 15.sp, modifier = Modifier.weight(1f))
                                    StatusBadge(hl.status, AppColor.Success)
                                }
                                Spacer(Modifier.height(4.dp))
                                Text("${hl.quantity_kg}kg · ₹${hl.price_per_kg?.toInt() ?: "--"}/kg", fontSize = 13.sp, color = AppColor.TextSecondary)
                                hl.farmer_name?.let { Text("by $it", fontSize = 11.sp, color = AppColor.TextMuted) }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ─── Water Quality Log ─────────────────────────────────────
@Composable
fun WaterLogScreen(navController: NavController, pondId: String, viewModel: AquaOSViewModel = hiltViewModel()) {
    val loading by viewModel.loading.collectAsState()
    val logs by viewModel.waterLogs.collectAsState()
    var ph by remember { mutableStateOf("") }
    var temp by remember { mutableStateOf("") }
    var do2 by remember { mutableStateOf("") }

    LaunchedEffect(pondId) { viewModel.loadWaterLogs(pondId) }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("Water Quality Log", "Pond: $pondId", Color(0xFF003D7A), AppColor.AquaOS, onBack = { navController.popBackStack() })

        LazyColumn(Modifier.weight(1f), contentPadding = PaddingValues(16.dp)) {
            item {
                Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("New Reading", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        OutlinedTextField(ph, { ph = it }, label = { Text("pH Level") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal))
                        OutlinedTextField(temp, { temp = it }, label = { Text("Temperature (°C)") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal))
                        OutlinedTextField(do2, { do2 = it }, label = { Text("Dissolved O₂ (mg/L)") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal))
                        Button(
                            onClick = {
                                viewModel.addWaterLog(pondId, mapOf("ph" to ph.toDoubleOrNull(), "temperature_c" to temp.toDoubleOrNull(), "dissolved_o2" to do2.toDoubleOrNull())) {
                                    ph = ""; temp = ""; do2 = ""; viewModel.loadWaterLogs(pondId)
                                }
                            },
                            enabled = ph.isNotBlank() && !loading,
                            modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = AppColor.AquaOS),
                        ) { Text("Save Reading") }
                    }
                }
            }
            if (logs.isNotEmpty()) {
                item { Spacer(Modifier.height(16.dp)); Text("History", fontWeight = FontWeight.Bold, fontSize = 16.sp) }
                items(logs) { log ->
                    Card(Modifier.fillMaxWidth().padding(vertical = 3.dp), shape = RoundedCornerShape(10.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                        Row(Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceEvenly, modifier = Modifier.fillMaxWidth()) {
                            MiniMetric("pH", "${log.ph ?: "—"}")
                            MiniMetric("Temp", "${log.temperature_c ?: "—"}°C")
                            MiniMetric("DO₂", "${log.dissolved_o2 ?: "—"}")
                        }
                    }
                }
            }
        }
    }
}

// ─── Advisories Screen ─────────────────────────────────────
@Composable
fun AdvisoriesScreen(navController: NavController, viewModel: AquaOSViewModel = hiltViewModel()) {
    val advisories by viewModel.advisories.collectAsState()
    LaunchedEffect(Unit) { viewModel.loadAdvisories() }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("Advisories", "Expert aquaculture tips", Color(0xFF003D7A), AppColor.AquaOS, onBack = { navController.popBackStack() })
        Box(Modifier.weight(1f)) {
            when {
                advisories.isEmpty() -> EmptyState("📋", "No advisories", "Advisories from experts will appear here")
                else -> LazyColumn(contentPadding = PaddingValues(vertical = 8.dp)) {
                    items(advisories) { adv ->
                        Card(
                            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = when (adv.severity) { "warning" -> Color(0xFFFFF3CD); "critical" -> Color(0xFFFDD); else -> Color.White }),
                        ) {
                            Column(Modifier.padding(14.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        when (adv.severity) { "warning" -> "⚠️"; "critical" -> "🔴"; else -> "ℹ️" },
                                        fontSize = 16.sp,
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Text(adv.title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                }
                                Text(adv.body, fontSize = 13.sp, color = AppColor.TextSecondary, modifier = Modifier.padding(top = 4.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}
