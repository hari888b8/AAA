package com.agrihub.app.ui.farmerconnect

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.draw.clip
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
import com.agrihub.app.data.repository.FarmerConnectRepository
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
class FarmerConnectViewModel @Inject constructor(private val repo: FarmerConnectRepository) : ViewModel() {
    private val _properties = MutableStateFlow<List<Property>>(emptyList())
    val properties: StateFlow<List<Property>> = _properties.asStateFlow()
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun loadProperties(type: String? = null) = viewModelScope.launch {
        _loading.value = true; _error.value = null
        try { _properties.value = repo.getProperties(type) } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }
    fun createProperty(body: Map<String, Any?>, onSuccess: () -> Unit) = viewModelScope.launch {
        _loading.value = true; _error.value = null
        try { repo.createProperty(body); onSuccess() } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }
}

val propertyTypes = listOf(
    Triple("🌾", "Farmland", "farmland"),
    Triple("🏭", "Godown", "godown"),
    Triple("🏠", "Rural House", "rural_house"),
    Triple("🐄", "Dairy Farm", "dairy_farm"),
    Triple("🐟", "Fish Pond", "fish_pond"),
    Triple("🏗️", "Commercial", "commercial"),
)

// ─── FarmerConnect Home ────────────────────────────────────
@Composable
fun FarmerConnectHomeScreen(navController: NavController) {
    LazyColumn(Modifier.fillMaxSize().background(AppColor.Background)) {
        item {
            GradientHeader("FarmerConnect", "Agricultural Housing & Rentals", Color(0xFFB57900), AppColor.FarmerConnect) {}
        }
        item { Spacer(Modifier.height(12.dp)) }
        item { ActionCard("🏠", "Browse Properties", "Find farmland, godowns & more", AppColor.FarmerConnect) { navController.navigate(Routes.PROPERTIES) } }
        item { ActionCard("➕", "List Property", "Rent or sell your property", AppColor.FarmerConnect) { navController.navigate(Routes.ADD_PROPERTY) } }
        item { Spacer(Modifier.height(16.dp)); SectionTitle("Property Types") }
        item {
            LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                items(propertyTypes) { (emoji, label, _) ->
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = AppColor.FarmerConnectLight),
                        modifier = Modifier.width(100.dp),
                    ) {
                        Column(Modifier.padding(14.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(emoji, fontSize = 28.sp)
                            Text(label, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = AppColor.TextPrimary)
                        }
                    }
                }
            }
        }
        item { Spacer(Modifier.height(24.dp)) }
    }
}

// ─── Properties Screen ─────────────────────────────────────
@OptIn(ExperimentalMaterialApi::class)
@Composable
fun PropertiesScreen(navController: NavController, viewModel: FarmerConnectViewModel = hiltViewModel()) {
    val properties by viewModel.properties.collectAsState()
    val loading by viewModel.loading.collectAsState()
    var selectedType by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(selectedType) { viewModel.loadProperties(selectedType) }
    val pullRefreshState = rememberPullRefreshState(loading, { viewModel.loadProperties(selectedType) })

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("Properties", "${properties.size} listings", Color(0xFFB57900), AppColor.FarmerConnect, onBack = { navController.popBackStack() })

        // Type filter chips
        LazyRow(Modifier.padding(vertical = 8.dp), contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            item { FilterChip(selected = selectedType == null, onClick = { selectedType = null }, label = { Text("All") }) }
            items(propertyTypes) { (emoji, label, type) ->
                FilterChip(selected = selectedType == type, onClick = { selectedType = if (selectedType == type) null else type }, label = { Text("$emoji $label", fontSize = 11.sp) })
            }
        }

        Box(Modifier.weight(1f).pullRefresh(pullRefreshState)) {
            when {
                loading && properties.isEmpty() -> LoadingScreen()
                properties.isEmpty() -> EmptyState("🏠", "No properties found", "Try a different filter", "List Property") { navController.navigate(Routes.ADD_PROPERTY) }
                else -> LazyColumn(contentPadding = PaddingValues(vertical = 4.dp)) {
                    items(properties) { prop ->
                        Card(
                            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color.White), elevation = CardDefaults.cardElevation(2.dp),
                        ) {
                            Column(Modifier.padding(14.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(prop.title, fontWeight = FontWeight.Bold, fontSize = 15.sp, modifier = Modifier.weight(1f))
                                    StatusBadge(prop.property_type.replace("_", " "), AppColor.FarmerConnect)
                                }
                                Spacer(Modifier.height(4.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                    prop.area_acres?.let { Text("📐 ${it} acres", fontSize = 12.sp, color = AppColor.TextSecondary) }
                                    prop.price_per_month?.let { Text("₹${it.toInt()}/mo", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = AppColor.FarmerConnect) }
                                    prop.price_total?.let { Text("₹${it.toInt()}", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = AppColor.FarmerConnect) }
                                }
                                prop.location_label?.let { Text("📍 $it", fontSize = 11.sp, color = AppColor.TextMuted, modifier = Modifier.padding(top = 4.dp)) }
                            }
                        }
                    }
                }
            }
            PullRefreshIndicator(loading, pullRefreshState, Modifier.align(Alignment.TopCenter), contentColor = AppColor.FarmerConnect)
        }
    }
}

// ─── Add Property ──────────────────────────────────────────
@Composable
fun AddPropertyScreen(navController: NavController, viewModel: FarmerConnectViewModel = hiltViewModel()) {
    val loading by viewModel.loading.collectAsState()
    val error by viewModel.error.collectAsState()
    var title by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("farmland") }
    var area by remember { mutableStateOf("") }
    var priceMonth by remember { mutableStateOf("") }
    var location by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("List Property", "Rent or sell your property", Color(0xFFB57900), AppColor.FarmerConnect, onBack = { navController.popBackStack() })
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedTextField(title, { title = it }, label = { Text("Title") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))

            Text("Property Type", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                items(propertyTypes) { (emoji, label, t) ->
                    FilterChip(selected = type == t, onClick = { type = t }, label = { Text("$emoji $label", fontSize = 11.sp) })
                }
            }

            OutlinedTextField(area, { area = it }, label = { Text("Area (acres)") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal))
            OutlinedTextField(priceMonth, { priceMonth = it }, label = { Text("Price per Month (₹)") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
            OutlinedTextField(location, { location = it }, label = { Text("Location") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
            OutlinedTextField(description, { description = it }, label = { Text("Description") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), minLines = 3)

            error?.let { Text(it, color = AppColor.Error, fontSize = 12.sp) }

            Button(
                onClick = {
                    viewModel.createProperty(mapOf("title" to title, "property_type" to type, "area_acres" to area.toDoubleOrNull(), "price_per_month" to priceMonth.toDoubleOrNull(), "location_label" to location, "description" to description)) { navController.popBackStack() }
                },
                enabled = title.isNotBlank() && !loading,
                modifier = Modifier.fillMaxWidth().height(50.dp), shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AppColor.FarmerConnect),
            ) {
                if (loading) CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                else Text("List Property", fontWeight = FontWeight.Bold)
            }
        }
    }
}
