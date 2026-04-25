package com.agrihub.app.ui.onboarding

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.agrihub.app.data.repository.AgriFlowRepository
import com.agrihub.app.data.repository.FarmerProfileRepository
import com.agrihub.app.data.repository.FpoRepository
import com.agrihub.app.data.repository.BuyerRepository
import com.agrihub.app.data.repository.AuthRepository
import com.agrihub.app.data.model.District
import com.agrihub.app.ui.components.GradientHeader
import com.agrihub.app.ui.theme.AppColor
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

// ─── Farmer Profile Setup ──────────────────────────────────
@HiltViewModel
class FarmerSetupViewModel @Inject constructor(
    private val farmerRepo: FarmerProfileRepository,
    private val agriFlowRepo: AgriFlowRepository,
    private val authRepo: AuthRepository,
) : ViewModel() {
    private val _saving = MutableStateFlow(false)
    val saving: StateFlow<Boolean> = _saving.asStateFlow()
    private val _done = MutableStateFlow(false)
    val done: StateFlow<Boolean> = _done.asStateFlow()
    private val _districts = MutableStateFlow<List<District>>(emptyList())
    val districts: StateFlow<List<District>> = _districts.asStateFlow()

    init {
        viewModelScope.launch {
            try { _districts.value = agriFlowRepo.refreshDistricts() } catch (_: Exception) {}
        }
    }

    fun save(body: Map<String, Any?>) {
        viewModelScope.launch {
            _saving.value = true
            try {
                farmerRepo.saveProfile(body)
                _done.value = true
            } catch (_: Exception) {}
            _saving.value = false
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FarmerSetupScreen(navController: NavController, onComplete: () -> Unit) {
    val vm: FarmerSetupViewModel = hiltViewModel()
    val saving by vm.saving.collectAsState()
    val done by vm.done.collectAsState()
    val districts by vm.districts.collectAsState()

    var state by remember { mutableStateOf("") }
    var districtId by remember { mutableStateOf<Int?>(null) }
    var village by remember { mutableStateOf("") }
    var mandal by remember { mutableStateOf("") }
    var landAcres by remember { mutableStateOf("") }
    var irrigationType by remember { mutableStateOf("borewell") }
    var farmingMethod by remember { mutableStateOf("conventional") }
    var organicCertified by remember { mutableStateOf(false) }

    val irrigationOptions = listOf("drip", "sprinkler", "canal", "borewell", "rain-fed", "none")
    val farmingMethods = listOf("conventional", "organic", "natural_farming", "zero_budget")

    LaunchedEffect(done) { if (done) onComplete() }

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()),
    ) {
        GradientHeader(title = "Farm Profile Setup", subtitle = "Complete in under 2 minutes")
        Column(Modifier.padding(16.dp)) {
            Text("📍 Location", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = AppColor.TextPrimary)
            Spacer(Modifier.height(8.dp))

            OutlinedTextField(
                value = state, onValueChange = { state = it },
                label = { Text("State") }, modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp), singleLine = true,
            )
            Spacer(Modifier.height(8.dp))

            // District dropdown
            var distExpanded by remember { mutableStateOf(false) }
            var distLabel by remember { mutableStateOf("Select District") }
            ExposedDropdownMenuBox(expanded = distExpanded, onExpandedChange = { distExpanded = !distExpanded }) {
                OutlinedTextField(
                    value = distLabel, onValueChange = {},
                    readOnly = true, label = { Text("District") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(distExpanded) },
                    modifier = Modifier.fillMaxWidth().menuAnchor(),
                    shape = RoundedCornerShape(12.dp),
                )
                ExposedDropdownMenu(expanded = distExpanded, onDismissRequest = { distExpanded = false }) {
                    districts.forEach { d ->
                        DropdownMenuItem(
                            text = { Text("${d.name} (${d.state ?: ""})") },
                            onClick = { districtId = d.id; distLabel = d.name; distExpanded = false },
                        )
                    }
                }
            }
            Spacer(Modifier.height(8.dp))

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = mandal, onValueChange = { mandal = it },
                    label = { Text("Mandal / Taluka") }, modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp), singleLine = true,
                )
                OutlinedTextField(
                    value = village, onValueChange = { village = it },
                    label = { Text("Village") }, modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp), singleLine = true,
                )
            }

            Spacer(Modifier.height(20.dp))
            Text("🌾 Farm Details", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = AppColor.TextPrimary)
            Spacer(Modifier.height(8.dp))

            OutlinedTextField(
                value = landAcres, onValueChange = { landAcres = it.filter { c -> c.isDigit() || c == '.' } },
                label = { Text("Total Land (acres)") }, modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp), singleLine = true,
            )
            Spacer(Modifier.height(12.dp))

            Text("Irrigation Type", fontSize = 13.sp, color = AppColor.TextSecondary)
            Spacer(Modifier.height(4.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                irrigationOptions.take(3).forEach { opt ->
                    FilterChip(
                        selected = irrigationType == opt,
                        onClick = { irrigationType = opt },
                        label = { Text(opt.replaceFirstChar { it.uppercase() }, fontSize = 11.sp) },
                    )
                }
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                irrigationOptions.drop(3).forEach { opt ->
                    FilterChip(
                        selected = irrigationType == opt,
                        onClick = { irrigationType = opt },
                        label = { Text(opt.replaceFirstChar { it.uppercase() }, fontSize = 11.sp) },
                    )
                }
            }

            Spacer(Modifier.height(12.dp))
            Text("Farming Method", fontSize = 13.sp, color = AppColor.TextSecondary)
            Spacer(Modifier.height(4.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                farmingMethods.forEach { m ->
                    FilterChip(
                        selected = farmingMethod == m,
                        onClick = { farmingMethod = m },
                        label = { Text(m.replace("_", " ").replaceFirstChar { it.uppercase() }, fontSize = 11.sp) },
                    )
                }
            }

            Spacer(Modifier.height(8.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(checked = organicCertified, onCheckedChange = { organicCertified = it })
                Text("Organic Certified", fontSize = 14.sp)
            }

            Spacer(Modifier.height(24.dp))
            Button(
                onClick = {
                    vm.save(mapOf(
                        "state" to state,
                        "district_id" to districtId,
                        "mandal" to mandal,
                        "village" to village,
                        "total_land_acres" to landAcres.toDoubleOrNull(),
                        "irrigation_type" to listOf(irrigationType),
                        "farming_method" to farmingMethod,
                        "organic_certified" to organicCertified,
                    ))
                },
                enabled = !saving && village.isNotBlank(),
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AppColor.Primary),
            ) {
                if (saving) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                else Text("Save & Continue", fontWeight = FontWeight.Bold)
            }

            TextButton(onClick = onComplete, modifier = Modifier.fillMaxWidth()) {
                Text("Skip for now →", color = AppColor.TextSecondary)
            }
        }
    }
}

// ─── FPO Profile Setup ────────────────────────────────────
@HiltViewModel
class FpoSetupViewModel @Inject constructor(private val fpoRepo: FpoRepository) : ViewModel() {
    private val _saving = MutableStateFlow(false)
    val saving: StateFlow<Boolean> = _saving.asStateFlow()
    private val _done = MutableStateFlow(false)
    val done: StateFlow<Boolean> = _done.asStateFlow()

    fun save(body: Map<String, Any?>) {
        viewModelScope.launch {
            _saving.value = true
            try { fpoRepo.saveProfile(body); _done.value = true } catch (_: Exception) {}
            _saving.value = false
        }
    }
}

@Composable
fun FpoSetupScreen(navController: NavController, onComplete: () -> Unit) {
    val vm: FpoSetupViewModel = hiltViewModel()
    val saving by vm.saving.collectAsState()
    val done by vm.done.collectAsState()
    var fpoName by remember { mutableStateOf("") }
    var fpoType by remember { mutableStateOf("FPO") }
    var regNumber by remember { mutableStateOf("") }
    var stateName by remember { mutableStateOf("") }
    var ceoName by remember { mutableStateOf("") }
    var whatsapp by remember { mutableStateOf("") }
    var yearEst by remember { mutableStateOf("") }
    val fpoTypes = listOf("FPO", "Cooperative", "PACS", "VCO", "Agri Company")

    LaunchedEffect(done) { if (done) onComplete() }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        GradientHeader(title = "FPO Registration", subtitle = "Setup your organization profile")
        Column(Modifier.padding(16.dp)) {
            OutlinedTextField(value = fpoName, onValueChange = { fpoName = it },
                label = { Text("FPO / Organization Name") }, modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp), singleLine = true)
            Spacer(Modifier.height(8.dp))

            Text("Organization Type", fontSize = 13.sp, color = AppColor.TextSecondary)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                fpoTypes.take(3).forEach { t ->
                    FilterChip(selected = fpoType == t, onClick = { fpoType = t },
                        label = { Text(t, fontSize = 11.sp) })
                }
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                fpoTypes.drop(3).forEach { t ->
                    FilterChip(selected = fpoType == t, onClick = { fpoType = t },
                        label = { Text(t, fontSize = 11.sp) })
                }
            }
            Spacer(Modifier.height(8.dp))

            OutlinedTextField(value = regNumber, onValueChange = { regNumber = it },
                label = { Text("Registration Number") }, modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp), singleLine = true)
            Spacer(Modifier.height(8.dp))

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = stateName, onValueChange = { stateName = it },
                    label = { Text("State") }, modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp), singleLine = true)
                OutlinedTextField(value = yearEst, onValueChange = { yearEst = it.filter { c -> c.isDigit() } },
                    label = { Text("Year Est.") }, modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp), singleLine = true)
            }
            Spacer(Modifier.height(8.dp))

            OutlinedTextField(value = ceoName, onValueChange = { ceoName = it },
                label = { Text("CEO / Secretary Name") }, modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp), singleLine = true)
            Spacer(Modifier.height(8.dp))

            OutlinedTextField(value = whatsapp, onValueChange = { whatsapp = it },
                label = { Text("WhatsApp Number") }, modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp), singleLine = true)
            Spacer(Modifier.height(24.dp))

            Button(
                onClick = {
                    vm.save(mapOf(
                        "fpo_name" to fpoName, "fpo_type" to fpoType,
                        "registration_number" to regNumber, "state" to stateName,
                        "ceo_name" to ceoName, "whatsapp_number" to whatsapp,
                        "year_established" to yearEst.toIntOrNull(),
                    ))
                },
                enabled = !saving && fpoName.isNotBlank(),
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AppColor.FpoBlue),
            ) {
                if (saving) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                else Text("Register FPO", fontWeight = FontWeight.Bold)
            }
            TextButton(onClick = onComplete, modifier = Modifier.fillMaxWidth()) {
                Text("Skip for now →", color = AppColor.TextSecondary)
            }
        }
    }
}

// ─── Buyer Profile Setup ──────────────────────────────────
@HiltViewModel
class BuyerSetupViewModel @Inject constructor(private val buyerRepo: BuyerRepository) : ViewModel() {
    private val _saving = MutableStateFlow(false)
    val saving: StateFlow<Boolean> = _saving.asStateFlow()
    private val _done = MutableStateFlow(false)
    val done: StateFlow<Boolean> = _done.asStateFlow()

    fun save(body: Map<String, Any?>) {
        viewModelScope.launch {
            _saving.value = true
            try { buyerRepo.saveProfile(body); _done.value = true } catch (_: Exception) {}
            _saving.value = false
        }
    }
}

@Composable
fun BuyerSetupScreen(navController: NavController, onComplete: () -> Unit) {
    val vm: BuyerSetupViewModel = hiltViewModel()
    val saving by vm.saving.collectAsState()
    val done by vm.done.collectAsState()
    var companyName by remember { mutableStateOf("") }
    var businessType by remember { mutableStateOf("Trader") }
    var gstin by remember { mutableStateOf("") }
    var stateName by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("") }
    var contactName by remember { mutableStateOf("") }
    var contactEmail by remember { mutableStateOf("") }
    val bizTypes = listOf("Trader", "Exporter", "Food Processor", "Retailer", "Supermarket", "Government", "Research")

    LaunchedEffect(done) { if (done) onComplete() }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        GradientHeader(title = "Buyer Registration", subtitle = "Setup your business profile")
        Column(Modifier.padding(16.dp)) {
            OutlinedTextField(value = companyName, onValueChange = { companyName = it },
                label = { Text("Company Name") }, modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp), singleLine = true)
            Spacer(Modifier.height(8.dp))

            Text("Business Type", fontSize = 13.sp, color = AppColor.TextSecondary)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                bizTypes.take(4).forEach { t ->
                    FilterChip(selected = businessType == t, onClick = { businessType = t },
                        label = { Text(t, fontSize = 10.sp) })
                }
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                bizTypes.drop(4).forEach { t ->
                    FilterChip(selected = businessType == t, onClick = { businessType = t },
                        label = { Text(t, fontSize = 10.sp) })
                }
            }
            Spacer(Modifier.height(8.dp))

            OutlinedTextField(value = gstin, onValueChange = { gstin = it },
                label = { Text("GSTIN (optional)") }, modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp), singleLine = true)
            Spacer(Modifier.height(8.dp))

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = stateName, onValueChange = { stateName = it },
                    label = { Text("State") }, modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp), singleLine = true)
                OutlinedTextField(value = city, onValueChange = { city = it },
                    label = { Text("City") }, modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp), singleLine = true)
            }
            Spacer(Modifier.height(8.dp))

            OutlinedTextField(value = contactName, onValueChange = { contactName = it },
                label = { Text("Contact Person Name") }, modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp), singleLine = true)
            Spacer(Modifier.height(8.dp))

            OutlinedTextField(value = contactEmail, onValueChange = { contactEmail = it },
                label = { Text("Email Address") }, modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp), singleLine = true)
            Spacer(Modifier.height(24.dp))

            Button(
                onClick = {
                    vm.save(mapOf(
                        "company_name" to companyName, "business_type" to businessType,
                        "gstin" to gstin, "state" to stateName, "city" to city,
                        "contact_name" to contactName, "contact_email" to contactEmail,
                    ))
                },
                enabled = !saving && companyName.isNotBlank(),
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AppColor.BuyerOrange),
            ) {
                if (saving) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                else Text("Register as Buyer", fontWeight = FontWeight.Bold)
            }
            TextButton(onClick = onComplete, modifier = Modifier.fillMaxWidth()) {
                Text("Skip for now →", color = AppColor.TextSecondary)
            }
        }
    }
}
