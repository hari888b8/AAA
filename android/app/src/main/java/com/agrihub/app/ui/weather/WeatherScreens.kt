@file:OptIn(ExperimentalMaterial3Api::class, ExperimentalMaterialApi::class)
package com.agrihub.app.ui.weather

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
import androidx.compose.material3.*
import androidx.compose.material3.ExperimentalMaterial3Api
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
import com.agrihub.app.data.repository.WeatherRepository
import com.agrihub.app.ui.components.*
import com.agrihub.app.ui.theme.AppColor
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class WeatherViewModel @Inject constructor(private val repo: WeatherRepository) : ViewModel() {
    private val _forecast = MutableStateFlow<WeatherForecastResponse?>(null)
    val forecast: StateFlow<WeatherForecastResponse?> = _forecast.asStateFlow()

    private val _advisory = MutableStateFlow<WeatherAdvisoryResponse?>(null)
    val advisory: StateFlow<WeatherAdvisoryResponse?> = _advisory.asStateFlow()

    private val _marketOutlook = MutableStateFlow<List<MarketOutlookItem>>(emptyList())
    val marketOutlook: StateFlow<List<MarketOutlookItem>> = _marketOutlook.asStateFlow()

    private val _cropHealth = MutableStateFlow<CropHealthResponse?>(null)
    val cropHealth: StateFlow<CropHealthResponse?> = _cropHealth.asStateFlow()

    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun load(districtId: Int? = null) = viewModelScope.launch {
        _loading.value = true; _error.value = null
        try {
            _forecast.value = repo.getForecast(districtId)
            _advisory.value = repo.getAdvisory(districtId)
        } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }

    fun loadMarketOutlook() = viewModelScope.launch {
        try { _marketOutlook.value = repo.getMarketOutlook() } catch (_: Exception) {}
    }

    fun loadCropHealth(cropId: Int? = null, districtId: Int? = null) = viewModelScope.launch {
        try { _cropHealth.value = repo.getCropHealth(cropId, districtId) } catch (_: Exception) {}
    }
}

// ─── Weather Home Screen ───────────────────────────────────
@Composable
fun WeatherHomeScreen(navController: NavController, viewModel: WeatherViewModel = hiltViewModel()) {
    val forecast by viewModel.forecast.collectAsState()
    val advisory by viewModel.advisory.collectAsState()
    val loading by viewModel.loading.collectAsState()

    LaunchedEffect(Unit) { viewModel.load(); viewModel.loadMarketOutlook() }
    val pullRefreshState = rememberPullRefreshState(loading, { viewModel.load() })

    Box(Modifier.fillMaxSize().pullRefresh(pullRefreshState)) {
        LazyColumn(Modifier.fillMaxSize().background(AppColor.Background)) {
            item {
                // Header with current weather
                Box(
                    Modifier
                        .fillMaxWidth()
                        .background(
                            brush = androidx.compose.ui.graphics.Brush.verticalGradient(
                                listOf(Color(0xFF1565C0), Color(0xFF42A5F5))
                            )
                        )
                        .padding(16.dp)
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconButton(onClick = { navController.popBackStack() }) {
                                Text("←", fontSize = 20.sp, color = Color.White)
                            }
                            Column(Modifier.weight(1f)) {
                                Text("Weather & Advisory", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.White)
                                Text(
                                    forecast?.location?.let { "${it.district}, ${it.state}" } ?: "Loading...",
                                    fontSize = 12.sp, color = Color.White.copy(alpha = 0.8f)
                                )
                            }
                        }

                        Spacer(Modifier.height(16.dp))

                        forecast?.current?.let { cur ->
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(cur.icon, fontSize = 56.sp)
                                Spacer(Modifier.width(16.dp))
                                Column {
                                    Text("${cur.temp_max}°C", fontSize = 42.sp, fontWeight = FontWeight.Light, color = Color.White)
                                    Text(cur.condition, fontSize = 16.sp, color = Color.White.copy(alpha = 0.9f))
                                    Text("Feels like ${cur.feels_like}°C · ${cur.temp_min}°–${cur.temp_max}°", fontSize = 12.sp, color = Color.White.copy(alpha = 0.7f))
                                }
                            }
                            Spacer(Modifier.height(16.dp))
                            Row(
                                Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceEvenly,
                            ) {
                                WeatherMetric("💧", "${cur.humidity}%", "Humidity")
                                WeatherMetric("🌬️", "${cur.wind_kmh} km/h", "Wind")
                                WeatherMetric("🌧️", "${cur.rain_chance_pct}%", "Rain")
                                WeatherMetric("☀️", "${cur.uv_index}", "UV Index")
                            }
                        }
                    }
                }
            }

            // 7-day forecast
            forecast?.forecast?.let { days ->
                item { Spacer(Modifier.height(12.dp)); SectionTitle("7-Day Forecast") }
                item {
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        items(days) { day ->
                            Card(
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                elevation = CardDefaults.cardElevation(2.dp),
                            ) {
                                Column(
                                    Modifier.padding(12.dp).width(72.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                ) {
                                    Text(day.day, fontSize = 12.sp, color = AppColor.TextMuted, fontWeight = FontWeight.Medium)
                                    Spacer(Modifier.height(8.dp))
                                    Text(day.icon, fontSize = 24.sp)
                                    Spacer(Modifier.height(8.dp))
                                    Text("${day.temp_max}°", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = AppColor.TextPrimary)
                                    Text("${day.temp_min}°", fontSize = 12.sp, color = AppColor.TextMuted)
                                    Spacer(Modifier.height(4.dp))
                                    if (day.rain_chance_pct > 20) {
                                        Text("💧${day.rain_chance_pct}%", fontSize = 10.sp, color = Color(0xFF1565C0))
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Advisory cards
            advisory?.weather_based?.let { advisories ->
                item { Spacer(Modifier.height(16.dp)); SectionTitle("Crop Advisories") }
                items(advisories) { adv ->
                    val severityColor = when (adv.severity) {
                        "high" -> AppColor.Error
                        "medium" -> AppColor.Warning
                        else -> AppColor.Info
                    }
                    Card(
                        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(2.dp),
                    ) {
                        Column(Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(adv.icon, fontSize = 20.sp)
                                Spacer(Modifier.width(8.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(adv.title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                }
                                StatusBadge(adv.severity.uppercase(), severityColor)
                            }
                            Spacer(Modifier.height(6.dp))
                            Text(adv.message, fontSize = 13.sp, color = AppColor.TextSecondary)
                            adv.crops?.let {
                                Spacer(Modifier.height(6.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    it.take(3).forEach { crop ->
                                        Box(
                                            Modifier.clip(RoundedCornerShape(6.dp)).background(severityColor.copy(0.1f)).padding(horizontal = 8.dp, vertical = 2.dp)
                                        ) { Text(crop, fontSize = 10.sp, color = severityColor) }
                                    }
                                }
                            }
                            if (adv.action_required) {
                                Spacer(Modifier.height(6.dp))
                                Row(Modifier.clip(RoundedCornerShape(6.dp)).background(AppColor.Error.copy(0.1f)).padding(horizontal = 8.dp, vertical = 4.dp)) {
                                    Text("⚠️ Action Required", fontSize = 11.sp, color = AppColor.Error, fontWeight = FontWeight.SemiBold)
                                }
                            }
                        }
                    }
                }
            }

            // Expert advisories from DB
            advisory?.expert_advisories?.takeIf { it.isNotEmpty() }?.let { experts ->
                item { Spacer(Modifier.height(8.dp)); SectionTitle("Expert Advisories") }
                items(experts) { adv ->
                    Card(
                        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                    ) {
                        Column(Modifier.padding(14.dp)) {
                            Text(adv.title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text(adv.body, fontSize = 13.sp, color = AppColor.TextSecondary, modifier = Modifier.padding(top = 4.dp))
                        }
                    }
                }
            }

            item { Spacer(Modifier.height(24.dp)) }
        }

        PullRefreshIndicator(loading, pullRefreshState, Modifier.align(Alignment.TopCenter), contentColor = Color(0xFF1565C0))
    }
}

// ─── Market Outlook Screen ─────────────────────────────────
@Composable
fun MarketOutlookScreen(navController: NavController, viewModel: WeatherViewModel = hiltViewModel()) {
    val marketOutlook by viewModel.marketOutlook.collectAsState()
    val forecast by viewModel.forecast.collectAsState()

    LaunchedEffect(Unit) { viewModel.load(); viewModel.loadMarketOutlook() }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader(
            "Market Outlook", "Price forecast based on weather & trends",
            Color(0xFF1B5E20), Color(0xFF43A047),
            onBack = { navController.popBackStack() },
        )

        if (marketOutlook.isEmpty()) {
            LoadingScreen()
        } else {
            LazyColumn(contentPadding = PaddingValues(vertical = 8.dp)) {
                item {
                    Card(
                        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFF0FDF4)),
                    ) {
                        Column(Modifier.padding(14.dp)) {
                            Text("📈 7-Day Price Prediction", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF166534))
                            Text(
                                "Based on current weather patterns: ${forecast?.current?.condition ?: "Analysing..."}",
                                fontSize = 12.sp, color = AppColor.TextSecondary, modifier = Modifier.padding(top = 4.dp),
                            )
                        }
                    }
                }
                items(marketOutlook) { item ->
                    Card(
                        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(2.dp),
                    ) {
                        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text(item.icon_emoji ?: "🌾", fontSize = 28.sp)
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(item.name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text(item.reason, fontSize = 11.sp, color = AppColor.TextSecondary)
                                Text("Confidence: ${item.confidence}%", fontSize = 10.sp, color = AppColor.TextMuted)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("₹${item.predicted_price.toInt()}", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp,
                                    color = if (item.trend == "up") AppColor.Success else AppColor.Error)
                                val change = item.predicted_price - item.current_price
                                val pct = if (item.current_price > 0) (change / item.current_price * 100).toInt() else 0
                                Text(
                                    "${if (item.trend == "up") "▲" else "▼"} ${if (pct > 0) "+" else ""}$pct%",
                                    fontSize = 11.sp, color = if (item.trend == "up") AppColor.Success else AppColor.Error,
                                )
                                Text("Now: ₹${item.current_price.toInt()}", fontSize = 10.sp, color = AppColor.TextMuted)
                            }
                        }
                    }
                }
                item { Spacer(Modifier.height(24.dp)) }
            }
        }
    }
}

// ─── Crop Health Screen ────────────────────────────────────
@Composable
fun CropHealthScreen(navController: NavController, viewModel: WeatherViewModel = hiltViewModel()) {
    val cropHealth by viewModel.cropHealth.collectAsState()
    val forecast by viewModel.forecast.collectAsState()
    val crops = remember { listOf(null to "General", 1 to "Rice", 2 to "Wheat", 3 to "Tomato", 4 to "Cotton", 5 to "Groundnut") }
    var selectedCropId by remember { mutableStateOf<Int?>(null) }

    LaunchedEffect(Unit) { viewModel.load() }
    LaunchedEffect(selectedCropId) { viewModel.loadCropHealth(selectedCropId) }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("Crop Health Index", "Weather impact on your crops", Color(0xFF1B5E20), Color(0xFF4CAF50), onBack = { navController.popBackStack() })

        LazyRow(contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            items(crops) { (id, name) ->
                FilterChip(
                    selected = selectedCropId == id,
                    onClick = { selectedCropId = id },
                    label = { Text(name, fontSize = 11.sp) },
                )
            }
        }

        if (cropHealth == null) {
            LoadingScreen()
        } else {
            val ch = cropHealth!!
            LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp)) {
                item {
                    // Health score card
                    val scoreColor = when {
                        ch.health_score >= 80 -> AppColor.Success
                        ch.health_score >= 60 -> Color(0xFF43A047)
                        ch.health_score >= 40 -> AppColor.Warning
                        else -> AppColor.Error
                    }
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = scoreColor.copy(0.1f)),
                    ) {
                        Column(Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(ch.crop, fontWeight = FontWeight.Bold, fontSize = 17.sp)
                            Spacer(Modifier.height(12.dp))
                            Text("${ch.health_score}", fontSize = 48.sp, fontWeight = FontWeight.ExtraBold, color = scoreColor)
                            Text("/ 100", fontSize = 16.sp, color = AppColor.TextMuted)
                            Spacer(Modifier.height(4.dp))
                            Box(
                                Modifier.clip(RoundedCornerShape(20.dp)).background(scoreColor.copy(0.15f)).padding(horizontal = 16.dp, vertical = 6.dp)
                            ) { Text(ch.health_label, color = scoreColor, fontWeight = FontWeight.Bold) }
                        }
                    }
                }

                item { Spacer(Modifier.height(16.dp)); Text("Weather Factors", fontWeight = FontWeight.Bold, fontSize = 15.sp) }

                ch.factors?.let { factors ->
                    val factorList = listOf(
                        Triple("🌡️", "Temperature", factors.temperature),
                        Triple("💧", "Humidity", factors.humidity),
                        Triple("🌧️", "Rainfall", factors.rainfall),
                    )
                    items(factorList) { (icon, name, factor) ->
                        factor?.let {
                            Card(
                                Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                            ) {
                                Column(Modifier.padding(14.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text("$icon $name", fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                                        Text("${it.avg} avg · ${it.label}", fontSize = 12.sp, color = AppColor.TextMuted)
                                    }
                                    Spacer(Modifier.height(8.dp))
                                    LinearProgressIndicator(
                                        progress = { it.score / 100f },
                                        modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                                        color = if (it.score >= 70) AppColor.Success else if (it.score >= 40) AppColor.Warning else AppColor.Error,
                                        trackColor = AppColor.Border,
                                    )
                                    Text("Score: ${it.score}/100", fontSize = 11.sp, color = AppColor.TextMuted, modifier = Modifier.padding(top = 4.dp))
                                }
                            }
                        }
                    }
                }

                if (ch.recommendations.isNotEmpty()) {
                    item { Spacer(Modifier.height(12.dp)); Text("Recommendations", fontWeight = FontWeight.Bold, fontSize = 15.sp) }
                    items(ch.recommendations) { rec ->
                        Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.Top) {
                            Text("✅", fontSize = 14.sp)
                            Spacer(Modifier.width(8.dp))
                            Text(rec, fontSize = 13.sp, color = AppColor.TextSecondary)
                        }
                    }
                }

                item { Spacer(Modifier.height(24.dp)) }
            }
        }
    }
}

// ─── Helper Composable ─────────────────────────────────────
@Composable
private fun WeatherMetric(icon: String, value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(icon, fontSize = 18.sp)
        Text(value, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.White)
        Text(label, fontSize = 9.sp, color = Color.White.copy(0.7f))
    }
}
