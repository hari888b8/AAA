package com.agrihub.app.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.agrihub.app.data.repository.AuthRepository
import com.agrihub.app.ui.theme.AppColor
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

// ─── ViewModel ─────────────────────────────────────────────
@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    val isLoggedIn: StateFlow<Boolean?> = MutableStateFlow<Boolean?>(null).also { flow ->
        viewModelScope.launch {
            flow.value = authRepository.isLoggedIn()
        }
    }

    fun sendOtp(phone: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            try {
                val response = authRepository.sendOtp(phone)
                _uiState.value = _uiState.value.copy(
                    loading = false,
                    otpSent = true,
                    devOtp = response.otp,
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(loading = false, error = e.message ?: "Failed to send OTP")
            }
        }
    }

    fun verifyOtp(phone: String, otp: String, name: String, role: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            try {
                authRepository.verifyOtp(phone, otp, name, role)
                (isLoggedIn as MutableStateFlow).value = true
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(loading = false, error = e.message ?: "Verification failed")
            }
        }
    }
}

data class AuthUiState(
    val loading: Boolean = false,
    val error: String? = null,
    val otpSent: Boolean = false,
    val devOtp: String? = null,
)

// ─── Role option data ──────────────────────────────────────
data class RoleOption(val key: String, val emoji: String, val label: String, val desc: String)

val roleOptions = listOf(
    RoleOption("farmer", "🌾", "Farmer", "Declare crops, post availability, receive buyer inquiries"),
    RoleOption("fpo", "🏢", "FPO / Cooperative", "Manage members, procurement, inventory & supply listings"),
    RoleOption("buyer", "🛒", "Buyer / Trader", "Search supply, get intelligence reports, send inquiries"),
    RoleOption("service_provider", "🚜", "Service Provider", "List equipment, post jobs, offer agri-services"),
)

// ─── Language option data ──────────────────────────────────
data class LangOption(val code: String, val label: String, val native: String)

val languageOptions = listOf(
    LangOption("en", "English", "English"),
    LangOption("hi", "Hindi", "हिंदी"),
    LangOption("te", "Telugu", "తెలుగు"),
    LangOption("kn", "Kannada", "ಕನ್ನಡ"),
    LangOption("mr", "Marathi", "मराठी"),
    LangOption("ta", "Tamil", "தமிழ்"),
)

// ─── Phone Screen ──────────────────────────────────────────
@Composable
fun PhoneScreen(
    viewModel: AuthViewModel = hiltViewModel(),
    onOtpSent: (String) -> Unit,
) {
    val state by viewModel.uiState.collectAsState()
    var phone by remember { mutableStateOf("") }

    LaunchedEffect(state.otpSent) {
        if (state.otpSent && phone.isNotEmpty()) {
            onOtpSent(phone)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(AppColor.PrimaryDark, AppColor.Primary)))
            .statusBarsPadding()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(80.dp))
        Text("🌾", fontSize = 60.sp)
        Spacer(Modifier.height(16.dp))
        Text("AgriHub", color = Color.White, fontSize = 32.sp, fontWeight = FontWeight.ExtraBold)
        Text("India's Agriculture Super-App", color = Color.White.copy(alpha = 0.8f), fontSize = 14.sp)
        Spacer(Modifier.height(8.dp))
        Text("5 Apps • 1 Platform • Every Farmer", color = Color.White.copy(alpha = 0.6f), fontSize = 12.sp)
        Spacer(Modifier.height(48.dp))

        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(Modifier.padding(24.dp)) {
                Text("Login with Phone", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = AppColor.TextPrimary)
                Text("Enter your 10-digit mobile number", color = AppColor.TextSecondary, fontSize = 13.sp)
                Spacer(Modifier.height(20.dp))

                OutlinedTextField(
                    value = phone,
                    onValueChange = { if (it.length <= 10 && it.all { c -> c.isDigit() }) phone = it },
                    label = { Text("Mobile Number") },
                    prefix = { Text("+91 ", color = AppColor.TextSecondary) },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone, imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = { if (phone.length == 10) viewModel.sendOtp(phone) }),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                )

                state.error?.let {
                    Text(it, color = AppColor.Error, fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp))
                }

                Spacer(Modifier.height(20.dp))
                Button(
                    onClick = { viewModel.sendOtp(phone) },
                    enabled = phone.length == 10 && !state.loading,
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AppColor.Primary),
                ) {
                    if (state.loading) {
                        CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                    } else {
                        Text("Send OTP", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    }
                }
            }
        }

        Spacer(Modifier.weight(1f))
        Text(
            "By continuing, you agree to our Terms of Service",
            color = Color.White.copy(alpha = 0.6f), fontSize = 12.sp, textAlign = TextAlign.Center,
        )
    }
}

// ─── OTP + Role Selection Screen ───────────────────────────
@Composable
fun OtpScreen(
    viewModel: AuthViewModel = hiltViewModel(),
    phone: String,
) {
    val state by viewModel.uiState.collectAsState()
    var otp by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var selectedRole by remember { mutableStateOf("farmer") }
    var selectedLanguage by remember { mutableStateOf("en") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(AppColor.PrimaryDark, AppColor.Primary)))
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(32.dp))
        Text("📱", fontSize = 40.sp)
        Spacer(Modifier.height(8.dp))
        Text("Verify & Setup", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
        Text("OTP sent to +91 $phone", color = Color.White.copy(alpha = 0.8f), fontSize = 13.sp)

        state.devOtp?.let {
            Spacer(Modifier.height(6.dp))
            Card(
                shape = RoundedCornerShape(8.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.2f)),
            ) {
                Text("Dev OTP: $it", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp))
            }
        }

        Spacer(Modifier.height(16.dp))
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(Modifier.padding(20.dp)) {
                // Name + OTP
                OutlinedTextField(
                    value = name, onValueChange = { name = it },
                    label = { Text("Your Name") },
                    modifier = Modifier.fillMaxWidth(), singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = otp,
                    onValueChange = { if (it.length <= 6 && it.all { c -> c.isDigit() }) otp = it },
                    label = { Text("6-digit OTP") },
                    modifier = Modifier.fillMaxWidth(), singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
                    shape = RoundedCornerShape(12.dp),
                )

                // Language Selection
                Spacer(Modifier.height(16.dp))
                Text("Language / भाषा", fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = AppColor.TextPrimary)
                Spacer(Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    languageOptions.take(4).forEach { lang ->
                        val selected = selectedLanguage == lang.code
                        Surface(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .clickable { selectedLanguage = lang.code },
                            color = if (selected) AppColor.Primary.copy(alpha = 0.12f) else AppColor.SurfaceVariant,
                            shape = RoundedCornerShape(8.dp),
                            border = if (selected) null else null,
                        ) {
                            Column(
                                modifier = Modifier
                                    .then(
                                        if (selected) Modifier.border(1.5.dp, AppColor.Primary, RoundedCornerShape(8.dp))
                                        else Modifier
                                    )
                                    .padding(vertical = 6.dp, horizontal = 4.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                            ) {
                                Text(lang.native, fontSize = 11.sp, fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                    color = if (selected) AppColor.Primary else AppColor.TextSecondary)
                            }
                        }
                    }
                }

                // Role Selection (PRD: role picker during onboarding)
                Spacer(Modifier.height(16.dp))
                Text("I am a...", fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = AppColor.TextPrimary)
                Spacer(Modifier.height(6.dp))

                roleOptions.forEach { role ->
                    val selected = selectedRole == role.key
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 3.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .clickable { selectedRole = role.key },
                        color = if (selected) AppColor.Primary.copy(alpha = 0.1f) else AppColor.SurfaceVariant,
                        shape = RoundedCornerShape(10.dp),
                    ) {
                        Row(
                            modifier = Modifier
                                .then(
                                    if (selected) Modifier.border(1.5.dp, AppColor.Primary, RoundedCornerShape(10.dp))
                                    else Modifier
                                )
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(role.emoji, fontSize = 22.sp)
                            Spacer(Modifier.width(10.dp))
                            Column(Modifier.weight(1f)) {
                                Text(role.label, fontWeight = FontWeight.SemiBold, fontSize = 13.sp,
                                    color = if (selected) AppColor.Primary else AppColor.TextPrimary)
                                Text(role.desc, fontSize = 10.sp, color = AppColor.TextSecondary, lineHeight = 13.sp)
                            }
                            if (selected) {
                                Text("✓", color = AppColor.Primary, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            }
                        }
                    }
                }

                state.error?.let {
                    Text(it, color = AppColor.Error, fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp))
                }

                Spacer(Modifier.height(16.dp))
                Button(
                    onClick = { viewModel.verifyOtp(phone, otp, name.ifBlank { "AgriHub User" }, selectedRole) },
                    enabled = otp.length == 6 && !state.loading,
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AppColor.Primary),
                ) {
                    if (state.loading) {
                        CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                    } else {
                        Text("Verify & Continue", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    }
                }
            }
        }
        Spacer(Modifier.height(24.dp))
    }
}
