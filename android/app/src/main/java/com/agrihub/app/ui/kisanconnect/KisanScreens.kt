package com.agrihub.app.ui.kisanconnect

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
import com.agrihub.app.data.repository.KisanConnectRepository
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
class KisanViewModel @Inject constructor(private val repo: KisanConnectRepository) : ViewModel() {
    private val _equipment = MutableStateFlow<List<Equipment>>(emptyList())
    val equipment: StateFlow<List<Equipment>> = _equipment.asStateFlow()
    private val _jobs = MutableStateFlow<List<Job>>(emptyList())
    val jobs: StateFlow<List<Job>> = _jobs.asStateFlow()
    private val _stats = MutableStateFlow(KisanStats())
    val stats: StateFlow<KisanStats> = _stats.asStateFlow()
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun loadStats() = viewModelScope.launch {
        try { _stats.value = repo.getStats() } catch (_: Exception) {}
    }
    fun loadEquipment() = viewModelScope.launch {
        _loading.value = true
        try { _equipment.value = repo.getEquipment() } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }
    fun loadJobs() = viewModelScope.launch {
        _loading.value = true
        try { _jobs.value = repo.getJobs() } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }
    fun bookEquipment(id: String, date: String, hours: String, onSuccess: () -> Unit) = viewModelScope.launch {
        _loading.value = true
        try { repo.bookEquipment(id, date, hours); onSuccess() } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }
    fun postJob(body: Map<String, Any?>, onSuccess: () -> Unit) = viewModelScope.launch {
        _loading.value = true; _error.value = null
        try { repo.postJob(body); onSuccess() } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }
}

// ─── KisanConnect Home ─────────────────────────────────────
@Composable
fun KisanHomeScreen(navController: NavController, viewModel: KisanViewModel = hiltViewModel()) {
    val stats by viewModel.stats.collectAsState()
    LaunchedEffect(Unit) { viewModel.loadStats() }

    LazyColumn(Modifier.fillMaxSize().background(AppColor.Background)) {
        item {
            GradientHeader("KisanConnect", "Equipment Rental & Rural Jobs", Color(0xFF5B21B6), AppColor.KisanConnect) {
                StatRow(listOf(
                    Triple("🚜", "${stats.total_equipment ?: 0}", "Equipment"),
                    Triple("✅", "${stats.available_equipment ?: 0}", "Available"),
                    Triple("💼", "${stats.active_jobs ?: 0}", "Jobs"),
                    Triple("📋", "${stats.total_bookings ?: 0}", "Bookings"),
                ))
            }
        }
        item { Spacer(Modifier.height(12.dp)) }
        item { ActionCard("🚜", "Equipment Rental", "Browse & rent farm equipment", AppColor.KisanConnect) { navController.navigate(Routes.EQUIPMENT) } }
        item { ActionCard("💼", "Rural Jobs", "Find employment opportunities", AppColor.KisanConnect) { navController.navigate(Routes.JOBS) } }
        item { ActionCard("📝", "Post a Job", "Hire workers for your farm", AppColor.KisanConnect) { navController.navigate(Routes.POST_JOB) } }
        item { Spacer(Modifier.height(16.dp)) }
        item { SectionTitle("How it works") }
        item { StepItem("1️⃣", "Browse available equipment or job listings") }
        item { StepItem("2️⃣", "Book equipment by day/hour or apply for jobs") }
        item { StepItem("3️⃣", "Connect directly, pay securely, rate experience") }
        item { Spacer(Modifier.height(24.dp)) }
    }
}

@Composable
private fun StepItem(emoji: String, text: String) {
    Row(Modifier.padding(horizontal = 20.dp, vertical = 4.dp)) {
        Text(emoji, fontSize = 16.sp)
        Spacer(Modifier.width(10.dp))
        Text(text, fontSize = 13.sp, color = AppColor.TextSecondary)
    }
}

// ─── Equipment Screen ──────────────────────────────────────
@OptIn(ExperimentalMaterialApi::class)
@Composable
fun EquipmentScreen(navController: NavController, viewModel: KisanViewModel = hiltViewModel()) {
    val equipment by viewModel.equipment.collectAsState()
    val loading by viewModel.loading.collectAsState()
    LaunchedEffect(Unit) { viewModel.loadEquipment() }
    val pullRefreshState = rememberPullRefreshState(loading, { viewModel.loadEquipment() })

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("Equipment Rental", "${equipment.size} available", Color(0xFF5B21B6), AppColor.KisanConnect, onBack = { navController.popBackStack() })
        Box(Modifier.weight(1f).pullRefresh(pullRefreshState)) {
            when {
                loading && equipment.isEmpty() -> LoadingScreen()
                equipment.isEmpty() -> EmptyState("🚜", "No equipment listed", "Equipment from owners will appear here")
                else -> LazyColumn(contentPadding = PaddingValues(vertical = 8.dp)) {
                    items(equipment) { eq ->
                        Card(
                            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp)
                                .clickable { navController.navigate(Routes.bookEquipment(eq.id)) },
                            shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color.White), elevation = CardDefaults.cardElevation(2.dp),
                        ) {
                            Column(Modifier.padding(14.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("🚜 ${eq.equipment_type}", fontWeight = FontWeight.Bold, fontSize = 15.sp, modifier = Modifier.weight(1f))
                                    StatusBadge(if (eq.is_available) "Available" else "Booked", if (eq.is_available) AppColor.Success else AppColor.Warning)
                                }
                                eq.brand?.let { Text("$it ${eq.model_name ?: ""}", fontSize = 12.sp, color = AppColor.TextMuted) }
                                Spacer(Modifier.height(6.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                    eq.rate_per_hour?.let { Text("₹${it.toInt()}/hr", fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = AppColor.KisanConnect) }
                                    eq.rate_per_day?.let { Text("₹${it.toInt()}/day", fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = AppColor.KisanConnect) }
                                }
                                eq.location_label?.let { Text("📍 $it", fontSize = 11.sp, color = AppColor.TextMuted, modifier = Modifier.padding(top = 4.dp)) }
                            }
                        }
                    }
                }
            }
            PullRefreshIndicator(loading, pullRefreshState, Modifier.align(Alignment.TopCenter), contentColor = AppColor.KisanConnect)
        }
    }
}

// ─── Book Equipment ────────────────────────────────────────
@Composable
fun BookEquipmentScreen(navController: NavController, equipmentId: String, viewModel: KisanViewModel = hiltViewModel()) {
    val loading by viewModel.loading.collectAsState()
    val error by viewModel.error.collectAsState()
    var date by remember { mutableStateOf("") }
    var hours by remember { mutableStateOf("8") }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("Book Equipment", "ID: ${equipmentId.take(8)}…", Color(0xFF5B21B6), AppColor.KisanConnect, onBack = { navController.popBackStack() })
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedTextField(date, { date = it }, label = { Text("Booking Date (YYYY-MM-DD)") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
            OutlinedTextField(hours, { hours = it }, label = { Text("Duration (hours)") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
            error?.let { Text(it, color = AppColor.Error, fontSize = 12.sp) }
            Button(
                onClick = { viewModel.bookEquipment(equipmentId, date, hours) { navController.popBackStack() } },
                enabled = date.isNotBlank() && !loading,
                modifier = Modifier.fillMaxWidth().height(50.dp), shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AppColor.KisanConnect),
            ) {
                if (loading) CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                else Text("Confirm Booking", fontWeight = FontWeight.Bold)
            }
        }
    }
}

// ─── Jobs Screen ───────────────────────────────────────────
@OptIn(ExperimentalMaterialApi::class)
@Composable
fun JobsScreen(navController: NavController, viewModel: KisanViewModel = hiltViewModel()) {
    val jobs by viewModel.jobs.collectAsState()
    val loading by viewModel.loading.collectAsState()
    LaunchedEffect(Unit) { viewModel.loadJobs() }
    val pullRefreshState = rememberPullRefreshState(loading, { viewModel.loadJobs() })

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("Rural Jobs", "${jobs.size} positions", Color(0xFF5B21B6), AppColor.KisanConnect, onBack = { navController.popBackStack() })
        Box(Modifier.weight(1f).pullRefresh(pullRefreshState)) {
            when {
                loading && jobs.isEmpty() -> LoadingScreen()
                jobs.isEmpty() -> EmptyState("💼", "No jobs posted", "Job listings will appear here")
                else -> LazyColumn(contentPadding = PaddingValues(vertical = 8.dp)) {
                    items(jobs) { job ->
                        Card(
                            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color.White), elevation = CardDefaults.cardElevation(2.dp),
                        ) {
                            Column(Modifier.padding(14.dp)) {
                                Text(job.title, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                job.employer_name?.let { Text(it, fontSize = 12.sp, color = AppColor.TextMuted) }
                                Spacer(Modifier.height(6.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                    job.job_type?.let { StatusBadge(it, AppColor.KisanConnect) }
                                    if (job.salary_min != null || job.salary_max != null) {
                                        Text("₹${job.salary_min?.toInt() ?: "—"}–${job.salary_max?.toInt() ?: "—"}/${job.salary_period ?: "mo"}", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = AppColor.KisanConnect)
                                    }
                                }
                                job.location_label?.let { Text("📍 $it", fontSize = 11.sp, color = AppColor.TextMuted, modifier = Modifier.padding(top = 4.dp)) }
                                Text("${job.vacancies ?: 1} vacancies", fontSize = 11.sp, color = AppColor.TextSecondary, modifier = Modifier.padding(top = 2.dp))
                            }
                        }
                    }
                }
            }
            PullRefreshIndicator(loading, pullRefreshState, Modifier.align(Alignment.TopCenter), contentColor = AppColor.KisanConnect)
        }
    }
}

// ─── Post Job ──────────────────────────────────────────────
@Composable
fun PostJobScreen(navController: NavController, viewModel: KisanViewModel = hiltViewModel()) {
    val loading by viewModel.loading.collectAsState()
    val error by viewModel.error.collectAsState()
    var title by remember { mutableStateOf("") }
    var jobType by remember { mutableStateOf("full_time") }
    var salaryMin by remember { mutableStateOf("") }
    var salaryMax by remember { mutableStateOf("") }
    var location by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var vacancies by remember { mutableStateOf("1") }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("Post a Job", "Hire workers for your farm", Color(0xFF5B21B6), AppColor.KisanConnect, onBack = { navController.popBackStack() })
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedTextField(title, { title = it }, label = { Text("Job Title") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("full_time", "part_time", "contract", "daily").forEach { t ->
                    FilterChip(selected = jobType == t, onClick = { jobType = t }, label = { Text(t.replace("_", " ").replaceFirstChar { it.uppercase() }, fontSize = 11.sp) })
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(salaryMin, { salaryMin = it }, label = { Text("Salary Min") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
                OutlinedTextField(salaryMax, { salaryMax = it }, label = { Text("Salary Max") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
            }
            OutlinedTextField(vacancies, { vacancies = it }, label = { Text("Vacancies") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
            OutlinedTextField(location, { location = it }, label = { Text("Location") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
            OutlinedTextField(description, { description = it }, label = { Text("Description") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), minLines = 3)

            error?.let { Text(it, color = AppColor.Error, fontSize = 12.sp) }

            Button(
                onClick = {
                    viewModel.postJob(mapOf("title" to title, "job_type" to jobType, "salary_min" to salaryMin.toDoubleOrNull(), "salary_max" to salaryMax.toDoubleOrNull(), "vacancies" to vacancies.toIntOrNull(), "location_label" to location, "description" to description)) { navController.popBackStack() }
                },
                enabled = title.isNotBlank() && !loading,
                modifier = Modifier.fillMaxWidth().height(50.dp), shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AppColor.KisanConnect),
            ) {
                if (loading) CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                else Text("Post Job", fontWeight = FontWeight.Bold)
            }
        }
    }
}
