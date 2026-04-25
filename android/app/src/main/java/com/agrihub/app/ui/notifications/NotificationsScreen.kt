package com.agrihub.app.ui.notifications

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DoneAll
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.agrihub.app.data.api.PushNotificationsApi
import com.agrihub.app.data.model.*
import com.agrihub.app.data.repository.NotificationsRepository
import com.agrihub.app.ui.components.*
import com.agrihub.app.ui.theme.AppColor
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class NotificationsViewModel @Inject constructor(
    private val repo: NotificationsRepository,
    private val pushApi: PushNotificationsApi,
) : ViewModel() {
    private val _notifications = MutableStateFlow<List<AppNotification>>(emptyList())
    val notifications: StateFlow<List<AppNotification>> = _notifications.asStateFlow()
    private val _unreadCount = MutableStateFlow(0)
    val unreadCount: StateFlow<Int> = _unreadCount.asStateFlow()
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()
    private val _showUnreadOnly = MutableStateFlow(false)
    val showUnreadOnly: StateFlow<Boolean> = _showUnreadOnly.asStateFlow()

    fun load(unreadOnly: Boolean = false) = viewModelScope.launch {
        _loading.value = true
        _showUnreadOnly.value = unreadOnly
        try {
            val response = pushApi.getNotifications(unreadOnly = if (unreadOnly) "true" else null)
            _notifications.value = response.notifications
            _unreadCount.value = response.unread_count
        } catch (e: Exception) {
            // Fallback to auth API notifications
            try {
                val response = repo.getNotifications(unreadOnly)
                _notifications.value = response.notifications
                _unreadCount.value = response.unread_count
            } catch (_: Exception) {}
        }
        _loading.value = false
    }

    fun markRead(id: String) = viewModelScope.launch {
        try {
            pushApi.markRead(id)
            _notifications.value = _notifications.value.map { if (it.id == id) it.copy(is_read = true) else it }
            _unreadCount.value = (_unreadCount.value - 1).coerceAtLeast(0)
        } catch (_: Exception) {}
    }

    fun markAllRead() = viewModelScope.launch {
        try {
            pushApi.markAllRead()
            _notifications.value = _notifications.value.map { it.copy(is_read = true) }
            _unreadCount.value = 0
        } catch (_: Exception) {}
    }

    fun toggleFilter() {
        val newVal = !_showUnreadOnly.value
        load(newVal)
    }
}

@OptIn(ExperimentalMaterialApi::class)
@Composable
fun NotificationsScreen(navController: NavController, viewModel: NotificationsViewModel = hiltViewModel()) {
    val notifications by viewModel.notifications.collectAsState()
    val unreadCount by viewModel.unreadCount.collectAsState()
    val loading by viewModel.loading.collectAsState()
    val showUnreadOnly by viewModel.showUnreadOnly.collectAsState()

    LaunchedEffect(Unit) { viewModel.load() }
    val pullRefreshState = rememberPullRefreshState(loading, { viewModel.load(showUnreadOnly) })

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        // Header
        Box(
            Modifier
                .fillMaxWidth()
                .background(
                    brush = androidx.compose.ui.graphics.Brush.verticalGradient(
                        listOf(AppColor.PrimaryDark, AppColor.Primary)
                    )
                )
                .statusBarsPadding()
                .padding(16.dp),
        ) {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Text("←", fontSize = 20.sp, color = Color.White)
                    }
                    Column(Modifier.weight(1f)) {
                        Text("Notifications", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.White)
                        Text(
                            if (unreadCount > 0) "$unreadCount unread messages" else "All caught up!",
                            fontSize = 12.sp, color = Color.White.copy(alpha = 0.8f),
                        )
                    }
                    if (unreadCount > 0) {
                        IconButton(onClick = { viewModel.markAllRead() }) {
                            Icon(Icons.Default.DoneAll, "Mark all read", tint = Color.White)
                        }
                    }
                }
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = !showUnreadOnly,
                        onClick = { if (showUnreadOnly) viewModel.toggleFilter() },
                        label = { Text("All", fontSize = 11.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Color.White,
                            selectedLabelColor = AppColor.PrimaryDark,
                        ),
                    )
                    FilterChip(
                        selected = showUnreadOnly,
                        onClick = { if (!showUnreadOnly) viewModel.toggleFilter() },
                        label = { Text("Unread${if (unreadCount > 0) " ($unreadCount)" else ""}", fontSize = 11.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Color.White,
                            selectedLabelColor = AppColor.PrimaryDark,
                        ),
                    )
                }
            }
        }

        Box(Modifier.weight(1f).pullRefresh(pullRefreshState)) {
            when {
                loading && notifications.isEmpty() -> LoadingScreen()
                notifications.isEmpty() -> EmptyState(
                    "🔔", "No notifications",
                    if (showUnreadOnly) "No unread notifications" else "You're all caught up!",
                )
                else -> LazyColumn(contentPadding = PaddingValues(vertical = 8.dp)) {
                    items(notifications, key = { it.id }) { notif ->
                        val typeIcon = when (notif.type) {
                            "order" -> "📦"; "inquiry" -> "💬"; "alert" -> "⚠️"
                            "price" -> "💰"; "weather" -> "🌦️"; "fpo" -> "🏢"
                            "buyer" -> "🛒"; else -> "🔔"
                        }
                        val typeColor = when (notif.type) {
                            "order" -> AppColor.Success; "inquiry" -> AppColor.Info
                            "alert" -> AppColor.Warning; "price" -> Color(0xFFFF6F00)
                            "weather" -> Color(0xFF1565C0); else -> AppColor.Primary
                        }

                        Card(
                            Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 3.dp)
                                .clickable { if (!notif.is_read) viewModel.markRead(notif.id) },
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = if (notif.is_read) Color.White else typeColor.copy(alpha = 0.05f),
                            ),
                            elevation = CardDefaults.cardElevation(if (notif.is_read) 1.dp else 3.dp),
                        ) {
                            Row(Modifier.padding(14.dp), verticalAlignment = Alignment.Top) {
                                // Type icon
                                Box(
                                    Modifier.size(42.dp).clip(CircleShape).background(typeColor.copy(alpha = 0.12f)),
                                    contentAlignment = Alignment.Center,
                                ) { Text(typeIcon, fontSize = 18.sp) }
                                Spacer(Modifier.width(12.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(
                                        notif.title,
                                        fontWeight = if (!notif.is_read) FontWeight.Bold else FontWeight.SemiBold,
                                        fontSize = 14.sp,
                                        color = AppColor.TextPrimary,
                                    )
                                    Text(
                                        notif.body,
                                        fontSize = 13.sp,
                                        color = AppColor.TextSecondary,
                                        modifier = Modifier.padding(top = 3.dp),
                                    )
                                    notif.created_at?.let { time ->
                                        Text(
                                            formatTimeAgo(time),
                                            fontSize = 11.sp,
                                            color = AppColor.TextMuted,
                                            modifier = Modifier.padding(top = 4.dp),
                                        )
                                    }
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    if (!notif.is_read) {
                                        Box(Modifier.size(9.dp).clip(CircleShape).background(typeColor))
                                    }
                                    Spacer(Modifier.height(4.dp))
                                    notif.type?.let {
                                        Text(it.replaceFirstChar { c -> c.uppercase() }, fontSize = 10.sp, color = typeColor, fontWeight = FontWeight.Medium)
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

private fun formatTimeAgo(isoTime: String): String {
    return try {
        val diff = System.currentTimeMillis() - java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault()).parse(isoTime.take(19))?.time!!
        val minutes = diff / 60000
        when {
            minutes < 1 -> "Just now"
            minutes < 60 -> "${minutes}m ago"
            minutes < 1440 -> "${minutes / 60}h ago"
            else -> "${minutes / 1440}d ago"
        }
    } catch (_: Exception) { "" }
}

