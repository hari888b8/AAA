@file:OptIn(ExperimentalMaterial3Api::class)
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
fun PropertiesScreen(
    navController: NavController,
    onPropertyClick: ((Property) -> Unit)? = null,
    viewModel: FarmerConnectViewModel = hiltViewModel(),
) {
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
                            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp).clickable {
                                if (onPropertyClick != null) onPropertyClick(prop) else navController.navigate(Routes.propertyDetail(prop.id))
                            },
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

// ─── Property Detail ───────────────────────────────────────
@HiltViewModel
class PropertyDetailViewModel @Inject constructor(private val repo: FarmerConnectRepository) : ViewModel() {
    private val _contactSent = MutableStateFlow(false)
    val contactSent: StateFlow<Boolean> = _contactSent.asStateFlow()
    private val _sending = MutableStateFlow(false)
    val sending: StateFlow<Boolean> = _sending.asStateFlow()

    fun contactOwner(propertyId: String, message: String, onDone: () -> Unit) = viewModelScope.launch {
        _sending.value = true
        try {
            repo.contactOwner(propertyId, message)
            _contactSent.value = true
            onDone()
        } catch (_: Exception) {}
        _sending.value = false
    }
}

@Composable
fun PropertyDetailScreen(
    navController: NavController,
    property: Property,
    viewModel: PropertyDetailViewModel = hiltViewModel(),
) {
    val contactSent by viewModel.contactSent.collectAsState()
    val sending by viewModel.sending.collectAsState()
    var showContactDialog by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf("") }

    val typeEmoji = when (property.property_type) {
        "farmland" -> "🌾"; "storage" -> "🏭"; "greenhouse" -> "🌿"
        "cold_storage" -> "❄️"; "irrigation_land" -> "💧"; else -> "🏠"
    }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        // Header
        Box(
            Modifier
                .fillMaxWidth()
                .background(brush = androidx.compose.ui.graphics.Brush.verticalGradient(listOf(Color(0xFFB57900), AppColor.FarmerConnect)))
                .statusBarsPadding()
                .padding(16.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { navController.popBackStack() }) {
                    Text("←", fontSize = 20.sp, color = Color.White)
                }
                Column(Modifier.weight(1f)) {
                    Text("Property Details", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.White)
                    Text(property.property_type.replace("_", " ").replaceFirstChar { it.uppercase() }, fontSize = 12.sp, color = Color.White.copy(0.8f))
                }
                Text(typeEmoji, fontSize = 28.sp)
            }
        }

        Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
            // Main info card
            Card(
                Modifier.fillMaxWidth().padding(16.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(3.dp),
            ) {
                Column(Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(property.title, fontWeight = FontWeight.Bold, fontSize = 18.sp, modifier = Modifier.weight(1f))
                        StatusBadge(property.status.replaceFirstChar { it.uppercase() }, if (property.status == "active") AppColor.Success else AppColor.TextMuted)
                    }
                    Divider(Modifier.padding(vertical = 12.dp), color = AppColor.Divider)

                    // Key stats
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        property.area_acres?.let { StatRow("📐 Area", "${it} acres") }
                        property.price_per_month?.let { StatRow("💰 Monthly Rent", "₹${it.toInt()}/month") }
                        property.price_total?.let { StatRow("🏷️ Total Price", "₹${it.toInt()}") }
                        property.location_label?.let { StatRow("📍 Location", it) }
                        property.district_name?.let { StatRow("🗺️ District", it) }
                        property.owner_name?.let { StatRow("👤 Owner", it) }
                        property.created_at?.let { StatRow("📅 Listed", it.take(10)) }
                    }

                    if (!property.description.isNullOrBlank()) {
                        Divider(Modifier.padding(vertical = 12.dp), color = AppColor.Divider)
                        Text("Description", fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = AppColor.TextPrimary)
                        Spacer(Modifier.height(6.dp))
                        Text(property.description, fontSize = 14.sp, color = AppColor.TextSecondary, lineHeight = 22.sp)
                    }

                    if (!property.amenities.isNullOrEmpty()) {
                        Divider(Modifier.padding(vertical = 12.dp), color = AppColor.Divider)
                        Text("Amenities", fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = AppColor.TextPrimary)
                        Spacer(Modifier.height(8.dp))
                        androidx.compose.foundation.lazy.LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(property.amenities) { amenity ->
                                AssistChip(
                                    onClick = {},
                                    label = { Text(amenity.replaceFirstChar { it.uppercase() }, fontSize = 11.sp) },
                                )
                            }
                        }
                    }
                }
            }

            // Contact button
            if (contactSent) {
                Card(
                    Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = AppColor.Success.copy(0.1f)),
                ) {
                    Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("✅", fontSize = 24.sp)
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text("Message Sent!", fontWeight = FontWeight.Bold, color = AppColor.Success)
                            Text("The owner will contact you soon.", fontSize = 12.sp, color = AppColor.TextSecondary)
                        }
                    }
                }
            } else {
                Button(
                    onClick = { showContactDialog = true },
                    modifier = Modifier.fillMaxWidth().padding(16.dp).height(52.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AppColor.FarmerConnect),
                ) {
                    Text("📞 Contact Owner", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
            }
            Spacer(Modifier.height(32.dp))
        }
    }

    // Contact dialog
    if (showContactDialog) {
        AlertDialog(
            onDismissRequest = { showContactDialog = false },
            title = { Text("Contact Owner", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("Send a message to ${property.owner_name ?: "the owner"}:", fontSize = 13.sp, color = AppColor.TextSecondary)
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(
                        value = message,
                        onValueChange = { message = it },
                        label = { Text("Your message") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        minLines = 3,
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (message.isNotBlank()) {
                            viewModel.contactOwner(property.id, message) { showContactDialog = false }
                        }
                    },
                    enabled = message.isNotBlank() && !sending,
                    colors = ButtonDefaults.buttonColors(containerColor = AppColor.FarmerConnect),
                ) {
                    if (sending) CircularProgressIndicator(Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                    else Text("Send Message")
                }
            },
            dismissButton = {
                TextButton(onClick = { showContactDialog = false }) { Text("Cancel") }
            },
        )
    }
}
