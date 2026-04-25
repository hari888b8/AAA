@file:OptIn(ExperimentalMaterial3Api::class)
package com.agrihub.app.ui.orders

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.agrihub.app.data.model.*
import com.agrihub.app.data.repository.OrdersRepository
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
class OrdersViewModel @Inject constructor(private val repo: OrdersRepository) : ViewModel() {
    private val _orders = MutableStateFlow<List<Order>>(emptyList())
    val orders: StateFlow<List<Order>> = _orders.asStateFlow()
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()

    fun loadOrders(role: String = "buyer") = viewModelScope.launch {
        _loading.value = true
        try { _orders.value = repo.getOrders(role) } catch (_: Exception) {}
        _loading.value = false
    }

    fun updateStatus(id: String, status: String) = viewModelScope.launch {
        try {
            val updated = repo.updateOrderStatus(id, status)
            _orders.value = _orders.value.map { if (it.id == id) updated else it }
        } catch (_: Exception) {}
    }
}

@OptIn(ExperimentalMaterialApi::class)
@Composable
fun OrdersScreen(
    navController: NavController,
    onOrderClick: ((Order) -> Unit)? = null,
    viewModel: OrdersViewModel = hiltViewModel(),
) {
    val orders by viewModel.orders.collectAsState()
    val loading by viewModel.loading.collectAsState()
    var role by remember { mutableStateOf("buyer") }

    LaunchedEffect(role) { viewModel.loadOrders(role) }
    val pullRefreshState = rememberPullRefreshState(loading, { viewModel.loadOrders(role) })

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("My Orders", "${orders.size} orders", AppColor.PrimaryDark, AppColor.Primary, onBack = { navController.popBackStack() })

        // Role toggle
        Row(Modifier.padding(horizontal = 16.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(selected = role == "buyer", onClick = { role = "buyer" }, label = { Text("As Buyer") })
            FilterChip(selected = role == "seller", onClick = { role = "seller" }, label = { Text("As Seller") })
        }

        Box(Modifier.weight(1f).pullRefresh(pullRefreshState)) {
            when {
                loading && orders.isEmpty() -> LoadingScreen()
                orders.isEmpty() -> EmptyState("📦", "No orders yet", "Your orders will appear here")
                else -> LazyColumn(contentPadding = PaddingValues(vertical = 4.dp)) {
                    items(orders) { order ->
                        Card(
                            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp).clickable {
                                if (onOrderClick != null) onOrderClick(order) else navController.navigate(Routes.orderDetail(order.id))
                            },
                            shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color.White), elevation = CardDefaults.cardElevation(2.dp),
                        ) {
                            Column(Modifier.padding(14.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Column(Modifier.weight(1f)) {
                                        Text("Order #${order.id.take(8)}", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                        Text(order.listing_type.replaceFirstChar { it.uppercase() }, fontSize = 12.sp, color = AppColor.TextMuted)
                                    }
                                    val statusColor = when (order.status) {
                                        "confirmed" -> AppColor.Info
                                        "in_transit" -> AppColor.Warning
                                        "delivered" -> AppColor.Success
                                        "cancelled" -> AppColor.Error
                                        else -> AppColor.TextMuted
                                    }
                                    StatusBadge(order.status.replace("_", " "), statusColor)
                                }
                                Spacer(Modifier.height(8.dp))
                                Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                    order.quantity?.let { Text("Qty: $it", fontSize = 12.sp, color = AppColor.TextSecondary) }
                                    order.total_amount?.let { Text("₹${it.toInt()}", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = AppColor.Primary) }
                                }
                                order.buyer_name?.let { Text("Buyer: $it", fontSize = 11.sp, color = AppColor.TextMuted, modifier = Modifier.padding(top = 4.dp)) }

                                // Action buttons for seller
                                if (role == "seller" && order.status == "pending") {
                                    Spacer(Modifier.height(8.dp))
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        OutlinedButton(
                                            onClick = { viewModel.updateStatus(order.id, "confirmed") },
                                            shape = RoundedCornerShape(8.dp),
                                        ) { Text("Confirm", fontSize = 12.sp) }
                                        OutlinedButton(
                                            onClick = { viewModel.updateStatus(order.id, "cancelled") },
                                            shape = RoundedCornerShape(8.dp),
                                            colors = ButtonDefaults.outlinedButtonColors(contentColor = AppColor.Error),
                                        ) { Text("Cancel", fontSize = 12.sp) }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            PullRefreshIndicator(loading, pullRefreshState, Modifier.align(Alignment.TopCenter), contentColor = AppColor.Primary)
        }
    }
}

// ─── Order Detail Screen ───────────────────────────────────
@HiltViewModel
class OrderDetailViewModel @Inject constructor(private val repo: OrdersRepository) : ViewModel() {
    private val _order = MutableStateFlow<Order?>(null)
    val order: StateFlow<Order?> = _order.asStateFlow()
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()
    private val _updating = MutableStateFlow(false)
    val updating: StateFlow<Boolean> = _updating.asStateFlow()

    fun loadOrder(id: String) = viewModelScope.launch {
        _loading.value = true
        try { _order.value = repo.getOrderById(id) } catch (_: Exception) {}
        _loading.value = false
    }

    fun updateStatus(id: String, status: String) = viewModelScope.launch {
        _updating.value = true
        try { _order.value = repo.updateOrderStatus(id, status) } catch (_: Exception) {}
        _updating.value = false
    }
}

@Composable
fun OrderDetailScreen(
    navController: NavController,
    orderId: String,
    viewModel: OrderDetailViewModel = hiltViewModel(),
) {
    val order by viewModel.order.collectAsState()
    val loading by viewModel.loading.collectAsState()
    val updating by viewModel.updating.collectAsState()

    LaunchedEffect(orderId) { viewModel.loadOrder(orderId) }

    val statusSteps = listOf("pending", "confirmed", "in_transit", "delivered")
    val statusColors = mapOf(
        "pending" to Color(0xFFFF8F00),
        "confirmed" to AppColor.Info,
        "in_transit" to Color(0xFF7B1FA2),
        "delivered" to AppColor.Success,
        "cancelled" to AppColor.Error,
    )

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        // Header
        Box(
            Modifier
                .fillMaxWidth()
                .background(brush = androidx.compose.ui.graphics.Brush.verticalGradient(listOf(AppColor.PrimaryDark, AppColor.Primary)))
                .statusBarsPadding()
                .padding(16.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { navController.popBackStack() }) {
                    Text("←", fontSize = 20.sp, color = Color.White)
                }
                Column(Modifier.weight(1f)) {
                    Text("Order Details", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.White)
                    order?.let { Text("#${it.id.take(8).uppercase()}", fontSize = 12.sp, color = Color.White.copy(0.8f)) }
                }
                order?.let { o ->
                    val c = statusColors[o.status] ?: AppColor.TextMuted
                    Box(
                        Modifier
                            .background(color = c.copy(0.2f), shape = RoundedCornerShape(8.dp))
                            .padding(horizontal = 10.dp, vertical = 4.dp),
                    ) {
                        Text(o.status.replace("_", " ").replaceFirstChar { it.uppercase() }, color = c, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        }

        when {
            loading -> LoadingScreen()
            order == null -> EmptyState("📦", "Order not found", "Please go back and try again")
            else -> {
                val o = order!!
                val statusColor = statusColors[o.status] ?: AppColor.TextMuted
                val scrollState = rememberScrollState()

                Column(Modifier.weight(1f).verticalScroll(scrollState)) {
                    // Status timeline
                    if (o.status != "cancelled") {
                        Card(
                            Modifier.fillMaxWidth().padding(16.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(2.dp),
                        ) {
                            Column(Modifier.padding(16.dp)) {
                                Text("Order Status", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Spacer(Modifier.height(16.dp))
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    statusSteps.forEachIndexed { idx, step ->
                                        val currentIdx = statusSteps.indexOf(o.status)
                                        val isDone = idx <= currentIdx
                                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                                            val stepLabel = when (step) {
                                                "pending" -> "📋"; "confirmed" -> "✅"; "in_transit" -> "🚛"; "delivered" -> "🏠"
                                                else -> "⭕"
                                            }
                                            Box(
                                                Modifier.size(38.dp).background(if (isDone) statusColor.copy(0.15f) else AppColor.Background, shape = androidx.compose.foundation.shape.CircleShape),
                                                contentAlignment = Alignment.Center,
                                            ) { Text(stepLabel, fontSize = 16.sp) }
                                            Spacer(Modifier.height(4.dp))
                                            Text(step.replace("_", " ").replaceFirstChar { it.uppercase() }, fontSize = 9.sp, color = if (isDone) statusColor else AppColor.TextMuted, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                                        }
                                        if (idx < statusSteps.lastIndex) {
                                            Divider(
                                                Modifier.weight(0.5f).padding(top = 18.dp),
                                                color = if (idx < statusSteps.indexOf(o.status)) statusColor else AppColor.Divider,
                                                thickness = 2.dp,
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Order details card
                    Card(
                        Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(2.dp),
                    ) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text("Order Information", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Divider(color = AppColor.Divider)
                            StatRow("📦 Order ID", "#${o.id.take(12).uppercase()}")
                            StatRow("📋 Type", o.listing_type.replaceFirstChar { it.uppercase() })
                            o.quantity?.let { StatRow("⚖️ Quantity", "$it units") }
                            o.price_per_unit?.let { StatRow("💲 Price/Unit", "₹${it.toInt()}") }
                            o.total_amount?.let {
                                Divider(color = AppColor.Divider)
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Total Amount", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    Text("₹${it.toInt()}", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = AppColor.Primary)
                                }
                            }
                        }
                    }

                    Spacer(Modifier.height(12.dp))

                    // Buyer/Delivery info
                    Card(
                        Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(2.dp),
                    ) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text("Delivery Details", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Divider(color = AppColor.Divider)
                            o.buyer_name?.let { StatRow("👤 Buyer", it) }
                            o.delivery_address?.let { StatRow("📍 Delivery Address", it) }
                            o.notes?.let { StatRow("📝 Notes", it) }
                            o.created_at?.let { StatRow("📅 Ordered On", it.take(10)) }
                            o.updated_at?.let { StatRow("🔄 Last Updated", it.take(10)) }
                        }
                    }

                    Spacer(Modifier.height(12.dp))

                    // Action buttons
                    if (o.status == "confirmed") {
                        Button(
                            onClick = { viewModel.updateStatus(orderId, "in_transit") },
                            enabled = !updating,
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).height(52.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7B1FA2)),
                        ) {
                            if (updating) CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                            else Text("🚛 Mark as In Transit", fontWeight = FontWeight.Bold)
                        }
                    }
                    if (o.status == "in_transit") {
                        Button(
                            onClick = { viewModel.updateStatus(orderId, "delivered") },
                            enabled = !updating,
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).height(52.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = AppColor.Success),
                        ) {
                            if (updating) CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                            else Text("✅ Mark as Delivered", fontWeight = FontWeight.Bold)
                        }
                    }
                    if (o.status == "pending") {
                        OutlinedButton(
                            onClick = { viewModel.updateStatus(orderId, "cancelled") },
                            enabled = !updating,
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).height(52.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = AppColor.Error),
                        ) {
                            Text("❌ Cancel Order", fontWeight = FontWeight.Bold)
                        }
                    }
                    Spacer(Modifier.height(32.dp))
                }
            }
        }
    }
}
