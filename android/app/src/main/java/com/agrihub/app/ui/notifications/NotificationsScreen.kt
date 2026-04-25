package com.agrihub.app.ui.notifications

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
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
class NotificationsViewModel @Inject constructor(private val repo: NotificationsRepository) : ViewModel() {
    private val _notifications = MutableStateFlow<List<AppNotification>>(emptyList())
    val notifications: StateFlow<List<AppNotification>> = _notifications.asStateFlow()
    private val _unreadCount = MutableStateFlow(0)
    val unreadCount: StateFlow<Int> = _unreadCount.asStateFlow()
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()

    fun load() = viewModelScope.launch {
        _loading.value = true
        try {
            val response = repo.getNotifications()
            _notifications.value = response.notifications
            _unreadCount.value = response.unread_count
        } catch (_: Exception) {}
        _loading.value = false
    }

    fun markRead(id: String) = viewModelScope.launch {
        try {
            repo.markAsRead(id)
            _notifications.value = _notifications.value.map { if (it.id == id) it.copy(is_read = true) else it }
            _unreadCount.value = (_unreadCount.value - 1).coerceAtLeast(0)
        } catch (_: Exception) {}
    }

    fun markAllRead() = viewModelScope.launch {
        try {
            repo.markAllRead()
            _notifications.value = _notifications.value.map { it.copy(is_read = true) }
            _unreadCount.value = 0
        } catch (_: Exception) {}
    }
}

@OptIn(ExperimentalMaterialApi::class)
@Composable
fun NotificationsScreen(navController: NavController, viewModel: NotificationsViewModel = hiltViewModel()) {
    val notifications by viewModel.notifications.collectAsState()
    val unreadCount by viewModel.unreadCount.collectAsState()
    val loading by viewModel.loading.collectAsState()

    LaunchedEffect(Unit) { viewModel.load() }
    val pullRefreshState = rememberPullRefreshState(loading, { viewModel.load() })

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader(
            "Notifications",
            if (unreadCount > 0) "$unreadCount unread" else "All caught up!",
            AppColor.PrimaryDark, AppColor.Primary,
            onBack = { navController.popBackStack() },
        ) {
            if (unreadCount > 0) {
                Spacer(Modifier.height(8.dp))
                TextButton(onClick = { viewModel.markAllRead() }) {
                    Text("Mark all read", color = Color.White.copy(alpha = 0.9f), fontSize = 13.sp)
                }
            }
        }

        Box(Modifier.weight(1f).pullRefresh(pullRefreshState)) {
            when {
                loading && notifications.isEmpty() -> LoadingScreen()
                notifications.isEmpty() -> EmptyState("🔔", "No notifications", "You're all caught up!")
                else -> LazyColumn(contentPadding = PaddingValues(vertical = 4.dp)) {
                    items(notifications) { notif ->
                        Card(
                            Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 3.dp)
                                .clickable { if (!notif.is_read) viewModel.markRead(notif.id) },
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = if (notif.is_read) Color.White else AppColor.PrimaryLight.copy(alpha = 0.08f),
                            ),
                        ) {
                            Row(Modifier.padding(14.dp), verticalAlignment = Alignment.Top) {
                                Box(
                                    Modifier.size(36.dp).clip(CircleShape).background(
                                        when (notif.type) {
                                            "order" -> AppColor.Success; "inquiry" -> AppColor.Info
                                            "alert" -> AppColor.Warning; else -> AppColor.Primary
                                        }.copy(alpha = 0.15f)
                                    ),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Text(
                                        when (notif.type) {
                                            "order" -> "📦"; "inquiry" -> "💬"
                                            "alert" -> "⚠️"; "price" -> "💰"; else -> "🔔"
                                        },
                                        fontSize = 16.sp,
                                    )
                                }
                                Spacer(Modifier.width(12.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(notif.title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = AppColor.TextPrimary)
                                    Text(notif.body, fontSize = 13.sp, color = AppColor.TextSecondary, modifier = Modifier.padding(top = 2.dp))
                                }
                                if (!notif.is_read) {
                                    Spacer(Modifier.width(8.dp))
                                    Box(Modifier.size(8.dp).clip(CircleShape).background(AppColor.Primary))
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
