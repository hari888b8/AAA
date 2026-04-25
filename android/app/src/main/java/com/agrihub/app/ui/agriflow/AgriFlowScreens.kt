package com.agrihub.app.ui.agriflow

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

// ─── ViewModel ─────────────────────────────────────────────
@HiltViewModel
class AgriFlowViewModel @Inject constructor(
    private val repo: AgriFlowRepository,
) : ViewModel() {
    private val _listings = MutableStateFlow<List<SupplyListing>>(emptyList())
    val listings: StateFlow<List<SupplyListing>> = _listings.asStateFlow()

    private val _declarations = MutableStateFlow<List<Declaration>>(emptyList())
    val declarations: StateFlow<List<Declaration>> = _declarations.asStateFlow()

    private val _inquiries = MutableStateFlow<List<Inquiry>>(emptyList())
    val inquiries: StateFlow<List<Inquiry>> = _inquiries.asStateFlow()

    private val _crops = MutableStateFlow<List<Crop>>(emptyList())
    val crops: StateFlow<List<Crop>> = _crops.asStateFlow()

    private val _districts = MutableStateFlow<List<District>>(emptyList())
    val districts: StateFlow<List<District>> = _districts.asStateFlow()

    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _detail = MutableStateFlow<SupplyListing?>(null)
    val detail: StateFlow<SupplyListing?> = _detail.asStateFlow()

    fun loadListings() = viewModelScope.launch {
        _loading.value = true; _error.value = null
        try { _listings.value = repo.getListings() } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }

    fun loadDeclarations() = viewModelScope.launch {
        _loading.value = true; _error.value = null
        try { _declarations.value = repo.getDeclarations() } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }

    fun loadInquiries() = viewModelScope.launch {
        _loading.value = true; _error.value = null
        try { _inquiries.value = repo.getInquiries() } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }

    fun loadCropsAndDistricts() = viewModelScope.launch {
        try {
            _crops.value = repo.refreshCrops()
            _districts.value = repo.refreshDistricts()
        } catch (_: Exception) {}
    }

    fun loadDetail(id: String) = viewModelScope.launch {
        _loading.value = true
        try { _detail.value = repo.getListingById(id) } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }

    fun createListing(body: Map<String, Any?>, onSuccess: () -> Unit) = viewModelScope.launch {
        _loading.value = true; _error.value = null
        try { repo.createListing(body); onSuccess() } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }

    fun createDeclaration(body: Map<String, Any?>, onSuccess: () -> Unit) = viewModelScope.launch {
        _loading.value = true; _error.value = null
        try { repo.createDeclaration(body); onSuccess() } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }

    fun sendInquiry(listingId: String, message: String, onSuccess: () -> Unit) = viewModelScope.launch {
        try { repo.sendInquiry(listingId, message); onSuccess() } catch (_: Exception) {}
    }
}

// ─── AgriFlow Home ─────────────────────────────────────────
@Composable
fun AgriFlowHomeScreen(navController: NavController) {
    LazyColumn(Modifier.fillMaxSize().background(AppColor.Background)) {
        item {
            GradientHeader("AgriFlow", "Supply Chain & Crop Marketplace", AppColor.PrimaryDark, AppColor.Primary) {
                StatRow(listOf(Triple("📋", "1.2K+", "Listings"), Triple("🌾", "15", "Crops"), Triple("📊", "₹24Cr", "Volume")))
            }
        }
        item { Spacer(Modifier.height(12.dp)) }
        item { ActionCard("📋", "Supply Listings", "Browse crop supply marketplace", AppColor.Primary) { navController.navigate(Routes.LISTINGS) } }
        item { ActionCard("📝", "My Declarations", "View your crop declarations", AppColor.Primary) { navController.navigate(Routes.DECLARATIONS) } }
        item { ActionCard("💬", "Inquiries", "Buyer inquiries on your listings", AppColor.Primary) { navController.navigate(Routes.INQUIRIES) } }
        item { ActionCard("➕", "Post New Listing", "List your crop for sale", AppColor.Primary) { navController.navigate(Routes.CREATE_LISTING) } }
        item { Spacer(Modifier.height(20.dp)) }
        item { SectionTitle("How AgriFlow Works") }
        item { InfoStep("1️⃣", "Declare your crop harvest with expected yield") }
        item { InfoStep("2️⃣", "Create supply listing with price and quantity") }
        item { InfoStep("3️⃣", "Buyers send inquiries and place orders") }
        item { Spacer(Modifier.height(24.dp)) }
    }
}

@Composable
private fun InfoStep(emoji: String, text: String) {
    Row(Modifier.padding(horizontal = 20.dp, vertical = 4.dp)) {
        Text(emoji, fontSize = 18.sp)
        Spacer(Modifier.width(10.dp))
        Text(text, fontSize = 13.sp, color = AppColor.TextSecondary)
    }
}

// ─── Listings Screen ───────────────────────────────────────
@OptIn(ExperimentalMaterialApi::class)
@Composable
fun ListingsScreen(navController: NavController, viewModel: AgriFlowViewModel = hiltViewModel()) {
    val listings by viewModel.listings.collectAsState()
    val loading by viewModel.loading.collectAsState()
    val error by viewModel.error.collectAsState()

    LaunchedEffect(Unit) { viewModel.loadListings() }
    val pullRefreshState = rememberPullRefreshState(loading, { viewModel.loadListings() })

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("Supply Listings", "${listings.size} active listings", AppColor.PrimaryDark, AppColor.Primary, onBack = { navController.popBackStack() })

        Box(Modifier.weight(1f).pullRefresh(pullRefreshState)) {
            when {
                loading && listings.isEmpty() -> LoadingScreen()
                error != null && listings.isEmpty() -> ErrorScreen(error!!) { viewModel.loadListings() }
                listings.isEmpty() -> EmptyState("📋", "No listings yet", "Post your first crop listing", "Create Listing") { navController.navigate(Routes.CREATE_LISTING) }
                else -> LazyColumn(contentPadding = PaddingValues(vertical = 8.dp)) {
                    items(listings) { listing ->
                        ListingCard(listing) { navController.navigate(Routes.listingDetail(listing.id)) }
                    }
                }
            }
            PullRefreshIndicator(loading, pullRefreshState, Modifier.align(Alignment.TopCenter), contentColor = AppColor.Primary)
        }
    }
}

@Composable
private fun ListingCard(listing: SupplyListing, onClick: () -> Unit) {
    Card(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp).clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(2.dp),
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(listing.crop_name ?: "Crop", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    listing.variety?.let { Text(it, fontSize = 12.sp, color = AppColor.TextMuted) }
                }
                StatusBadge(listing.status ?: "active", AppColor.Success)
            }
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                MetricChip("📦", "${listing.quantity_tons ?: 0}T")
                MetricChip("💰", "₹${listing.price_per_ton?.toInt() ?: "--"}/T")
                MetricChip("📍", listing.district_name ?: "—")
            }
        }
    }
}

@Composable
private fun MetricChip(emoji: String, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(emoji, fontSize = 12.sp)
        Spacer(Modifier.width(4.dp))
        Text(text, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = AppColor.TextSecondary)
    }
}

// ─── Listing Detail ────────────────────────────────────────
@Composable
fun ListingDetailScreen(navController: NavController, id: String, viewModel: AgriFlowViewModel = hiltViewModel()) {
    val detail by viewModel.detail.collectAsState()
    val loading by viewModel.loading.collectAsState()
    var inquiryMsg by remember { mutableStateOf("") }
    var sent by remember { mutableStateOf(false) }

    LaunchedEffect(id) { viewModel.loadDetail(id) }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("Listing Detail", "", AppColor.PrimaryDark, AppColor.Primary, onBack = { navController.popBackStack() })

        if (loading && detail == null) { LoadingScreen(); return }
        val d = detail ?: return

        LazyColumn(Modifier.weight(1f), contentPadding = PaddingValues(16.dp)) {
            item {
                Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(Modifier.padding(16.dp)) {
                        Text(d.crop_name ?: "Crop", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = AppColor.Primary)
                        d.variety?.let { Text("Variety: $it", color = AppColor.TextSecondary) }
                        Spacer(Modifier.height(12.dp))
                        DetailRow("Quantity", "${d.quantity_tons}T")
                        DetailRow("Price", "₹${d.price_per_ton?.toInt()}/Ton")
                        DetailRow("Grade", d.grade ?: "N/A")
                        DetailRow("Location", d.location_label ?: d.district_name ?: "—")
                        DetailRow("Farmer", d.farmer_name ?: "—")
                        DetailRow("Available From", d.available_from ?: "Now")
                        d.description?.let { Spacer(Modifier.height(8.dp)); Text(it, fontSize = 13.sp, color = AppColor.TextSecondary) }
                    }
                }
            }
            item {
                Spacer(Modifier.height(16.dp))
                Text("Send Inquiry", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = inquiryMsg, onValueChange = { inquiryMsg = it },
                    label = { Text("Your message to the farmer") },
                    modifier = Modifier.fillMaxWidth(), minLines = 3, shape = RoundedCornerShape(12.dp),
                )
                Spacer(Modifier.height(12.dp))
                Button(
                    onClick = { viewModel.sendInquiry(d.id, inquiryMsg) { sent = true } },
                    enabled = inquiryMsg.isNotBlank() && !sent,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = AppColor.Primary),
                    shape = RoundedCornerShape(12.dp),
                ) { Text(if (sent) "✓ Inquiry Sent" else "Send Inquiry") }
            }
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, fontSize = 13.sp, color = AppColor.TextMuted)
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = AppColor.TextPrimary)
    }
}

// ─── Create Listing ────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateListingScreen(navController: NavController, viewModel: AgriFlowViewModel = hiltViewModel()) {
    val crops by viewModel.crops.collectAsState()
    val loading by viewModel.loading.collectAsState()
    val error by viewModel.error.collectAsState()

    var cropId by remember { mutableStateOf("") }
    var variety by remember { mutableStateOf("") }
    var quantity by remember { mutableStateOf("") }
    var price by remember { mutableStateOf("") }
    var grade by remember { mutableStateOf("A") }
    var location by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }

    LaunchedEffect(Unit) { viewModel.loadCropsAndDistricts() }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("Post Listing", "List your crop for sale", AppColor.PrimaryDark, AppColor.Primary, onBack = { navController.popBackStack() })

        Column(
            Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // Crop selector (simple text for now)
            OutlinedTextField(cropId, { cropId = it }, label = { Text("Crop ID") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
            if (crops.isNotEmpty()) {
                Text("Available: ${crops.joinToString { "${it.emoji ?: ""} ${it.name}" }}", fontSize = 11.sp, color = AppColor.TextMuted)
            }
            OutlinedTextField(variety, { variety = it }, label = { Text("Variety") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
            OutlinedTextField(quantity, { quantity = it }, label = { Text("Quantity (Tons)") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal))
            OutlinedTextField(price, { price = it }, label = { Text("Price per Ton (₹)") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("A", "B", "C").forEach { g ->
                    FilterChip(selected = grade == g, onClick = { grade = g }, label = { Text("Grade $g") })
                }
            }

            OutlinedTextField(location, { location = it }, label = { Text("Location") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
            OutlinedTextField(description, { description = it }, label = { Text("Description") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), minLines = 2)

            error?.let { Text(it, color = AppColor.Error, fontSize = 12.sp) }

            Button(
                onClick = {
                    viewModel.createListing(
                        mapOf("crop_id" to cropId.toIntOrNull(), "variety" to variety, "quantity_tons" to quantity.toDoubleOrNull(), "price_per_ton" to price.toDoubleOrNull(), "grade" to grade, "location_label" to location, "description" to description),
                    ) { navController.popBackStack() }
                },
                enabled = cropId.isNotBlank() && quantity.isNotBlank() && !loading,
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AppColor.Primary),
            ) {
                if (loading) CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                else Text("Post Listing", fontWeight = FontWeight.Bold)
            }
        }
    }
}

// ─── Declarations Screen ───────────────────────────────────
@OptIn(ExperimentalMaterialApi::class)
@Composable
fun DeclarationsScreen(navController: NavController, viewModel: AgriFlowViewModel = hiltViewModel()) {
    val declarations by viewModel.declarations.collectAsState()
    val loading by viewModel.loading.collectAsState()

    LaunchedEffect(Unit) { viewModel.loadDeclarations() }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("Crop Declarations", "${declarations.size} declarations", AppColor.PrimaryDark, AppColor.Primary, onBack = { navController.popBackStack() }) {
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = { navController.navigate(Routes.CREATE_DECLARATION) },
                colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.2f)),
                shape = RoundedCornerShape(8.dp), contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
            ) { Text("+ New Declaration", color = Color.White, fontSize = 13.sp) }
        }
        Box(Modifier.weight(1f)) {
            when {
                loading && declarations.isEmpty() -> LoadingScreen()
                declarations.isEmpty() -> EmptyState("📝", "No declarations", "Declare your first crop", "New Declaration") { navController.navigate(Routes.CREATE_DECLARATION) }
                else -> LazyColumn(contentPadding = PaddingValues(vertical = 8.dp)) {
                    items(declarations) { d ->
                        Card(
                            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color.White),
                        ) {
                            Column(Modifier.padding(14.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(d.crop_name ?: "Crop", fontWeight = FontWeight.Bold, fontSize = 15.sp, modifier = Modifier.weight(1f))
                                    StatusBadge(d.status ?: "pending", if (d.status == "verified") AppColor.Success else AppColor.Warning)
                                }
                                Spacer(Modifier.height(4.dp))
                                Text("Yield: ${d.expected_yield_tons ?: 0}T · Sown: ${d.sowing_date ?: "—"}", fontSize = 12.sp, color = AppColor.TextSecondary)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ─── Create Declaration ────────────────────────────────────
@Composable
fun CreateDeclarationScreen(navController: NavController, viewModel: AgriFlowViewModel = hiltViewModel()) {
    val loading by viewModel.loading.collectAsState()
    val error by viewModel.error.collectAsState()

    var cropId by remember { mutableStateOf("") }
    var yield by remember { mutableStateOf("") }
    var sowingDate by remember { mutableStateOf("") }
    var harvestDate by remember { mutableStateOf("") }

    LaunchedEffect(Unit) { viewModel.loadCropsAndDistricts() }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("New Declaration", "Declare your crop harvest", AppColor.PrimaryDark, AppColor.Primary, onBack = { navController.popBackStack() })

        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedTextField(cropId, { cropId = it }, label = { Text("Crop ID") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
            OutlinedTextField(yield, { yield = it }, label = { Text("Expected Yield (Tons)") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal))
            OutlinedTextField(sowingDate, { sowingDate = it }, label = { Text("Sowing Date (YYYY-MM-DD)") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
            OutlinedTextField(harvestDate, { harvestDate = it }, label = { Text("Expected Harvest (YYYY-MM-DD)") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))

            error?.let { Text(it, color = AppColor.Error, fontSize = 12.sp) }

            Button(
                onClick = {
                    viewModel.createDeclaration(
                        mapOf("crop_id" to cropId.toIntOrNull(), "expected_yield_tons" to yield.toDoubleOrNull(), "sowing_date" to sowingDate, "expected_harvest" to harvestDate),
                    ) { navController.popBackStack() }
                },
                enabled = cropId.isNotBlank() && yield.isNotBlank() && !loading,
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AppColor.Primary),
            ) {
                if (loading) CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                else Text("Submit Declaration", fontWeight = FontWeight.Bold)
            }
        }
    }
}

// ─── Inquiries Screen ──────────────────────────────────────
@Composable
fun InquiriesScreen(navController: NavController, viewModel: AgriFlowViewModel = hiltViewModel()) {
    val inquiries by viewModel.inquiries.collectAsState()
    val loading by viewModel.loading.collectAsState()

    LaunchedEffect(Unit) { viewModel.loadInquiries() }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("Inquiries", "${inquiries.size} received", AppColor.PrimaryDark, AppColor.Primary, onBack = { navController.popBackStack() })

        Box(Modifier.weight(1f)) {
            when {
                loading && inquiries.isEmpty() -> LoadingScreen()
                inquiries.isEmpty() -> EmptyState("💬", "No inquiries yet", "Inquiries from buyers will appear here")
                else -> LazyColumn(contentPadding = PaddingValues(vertical = 8.dp)) {
                    items(inquiries) { inq ->
                        Card(
                            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color.White),
                        ) {
                            Column(Modifier.padding(14.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(inq.buyer_name ?: "Buyer", fontWeight = FontWeight.Bold, fontSize = 14.sp, modifier = Modifier.weight(1f))
                                    StatusBadge(inq.status ?: "pending", AppColor.Warning)
                                }
                                Text(inq.message ?: "", fontSize = 13.sp, color = AppColor.TextSecondary, modifier = Modifier.padding(top = 4.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}
