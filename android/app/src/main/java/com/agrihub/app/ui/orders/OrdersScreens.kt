package com.agrihub.app.ui.orders

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
fun OrdersScreen(navController: NavController, viewModel: OrdersViewModel = hiltViewModel()) {
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
                            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
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
