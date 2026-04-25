package com.agrihub.app.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.agrihub.app.data.repository.AuthRepository
import com.agrihub.app.ui.navigation.Routes
import com.agrihub.app.ui.theme.AppColor
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepo: AuthRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(ProfileState())
    val state: StateFlow<ProfileState> = _state.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _state.value = ProfileState(
                name = authRepo.getUserName() ?: "User",
                phone = authRepo.getUserPhone() ?: "",
                role = authRepo.getUserRole() ?: "farmer",
            )
        }
    }

    fun logout(onDone: () -> Unit) {
        viewModelScope.launch {
            authRepo.logout()
            onDone()
        }
    }
}

data class ProfileState(
    val name: String = "",
    val phone: String = "",
    val role: String = "farmer",
)

@Composable
fun ProfileScreen(navController: NavController, viewModel: ProfileViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    val initial = state.name.firstOrNull()?.uppercase() ?: "U"

    LazyColumn(
        Modifier.fillMaxSize().background(AppColor.Background).statusBarsPadding(),
    ) {
        // Avatar + Info
        item {
            Column(
                Modifier.fillMaxWidth().padding(vertical = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    Modifier.size(80.dp).clip(CircleShape).background(AppColor.Primary),
                    contentAlignment = Alignment.Center,
                ) { Text(initial, color = Color.White, fontSize = 32.sp, fontWeight = FontWeight.Bold) }
                Spacer(Modifier.height(12.dp))
                Text(state.name, fontWeight = FontWeight.Bold, fontSize = 20.sp, color = AppColor.TextPrimary)
                Text("+91 ${state.phone}", fontSize = 14.sp, color = AppColor.TextSecondary)
                Spacer(Modifier.height(6.dp))
                Box(
                    Modifier.clip(RoundedCornerShape(6.dp)).background(AppColor.Primary.copy(alpha = 0.1f)).padding(horizontal = 10.dp, vertical = 3.dp),
                ) {
                    Text(state.role.replaceFirstChar { it.uppercase() }, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = AppColor.Primary)
                }
            }
        }

        // Quick Platform Access
        item {
            Text("Quick Access", fontWeight = FontWeight.Bold, fontSize = 16.sp, modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp))
        }
        item {
            Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                QuickAccessTile("🌾", "AgriFlow", AppColor.AgriFlowLight, Modifier.weight(1f)) { navController.navigate(Routes.AGRIFLOW) }
                QuickAccessTile("🐟", "AquaOS", AppColor.AquaOSLight, Modifier.weight(1f)) { navController.navigate(Routes.AQUAOS) }
                QuickAccessTile("🤝", "Kisan", AppColor.KisanConnectLight, Modifier.weight(1f)) { navController.navigate(Routes.KISAN) }
            }
        }

        // Settings Menu
        item {
            Spacer(Modifier.height(20.dp))
            Text("Settings", fontWeight = FontWeight.Bold, fontSize = 16.sp, modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp))
        }
        item { SettingsRow(Icons.Default.ShoppingCart, "My Orders") { navController.navigate(Routes.ORDERS) } }
        item { SettingsRow(Icons.Default.Notifications, "Notifications") { navController.navigate(Routes.NOTIFICATIONS) } }
        item { SettingsRow(Icons.Default.Forum, "Community") { navController.navigate(Routes.COMMUNITY) } }
        item { SettingsRow(Icons.Default.Language, "Language") { /* TODO */ } }
        item { SettingsRow(Icons.Default.Help, "Help & Support") { /* TODO */ } }
        item { SettingsRow(Icons.Default.Info, "About AgriHub") { /* TODO */ } }

        // Logout
        item {
            Spacer(Modifier.height(16.dp))
            Card(
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .clickable {
                        viewModel.logout {
                            navController.navigate(Routes.PHONE) {
                                popUpTo(0) { inclusive = true }
                            }
                        }
                    },
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = AppColor.Error.copy(alpha = 0.08f)),
            ) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = null, tint = AppColor.Error)
                    Spacer(Modifier.width(12.dp))
                    Text("Logout", fontWeight = FontWeight.SemiBold, color = AppColor.Error, fontSize = 15.sp)
                }
            }
            Spacer(Modifier.height(32.dp))
        }
    }
}

@Composable
private fun QuickAccessTile(emoji: String, label: String, bgColor: Color, modifier: Modifier, onClick: () -> Unit) {
    Card(
        modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = bgColor),
    ) {
        Column(Modifier.padding(14.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(emoji, fontSize = 24.sp)
            Text(label, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = AppColor.TextPrimary)
        }
    }
}

@Composable
private fun SettingsRow(icon: ImageVector, label: String, onClick: () -> Unit) {
    Card(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 3.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
    ) {
        Row(Modifier.padding(horizontal = 16.dp, vertical = 14.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, contentDescription = null, tint = AppColor.TextSecondary, modifier = Modifier.size(20.dp))
            Spacer(Modifier.width(12.dp))
            Text(label, fontSize = 15.sp, color = AppColor.TextPrimary, modifier = Modifier.weight(1f))
            Text("›", fontSize = 18.sp, color = AppColor.TextMuted)
        }
    }
}
