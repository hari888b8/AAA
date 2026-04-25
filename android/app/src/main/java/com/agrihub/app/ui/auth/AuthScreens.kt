package com.agrihub.app.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
import kotlinx.coroutines.flow.map
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

    fun verifyOtp(phone: String, otp: String, name: String = "AgriHub User") {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            try {
                authRepository.verifyOtp(phone, otp, name, "farmer")
                // Update the isLoggedIn state to trigger navigation
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

// ─── OTP Screen ────────────────────────────────────────────
@Composable
fun OtpScreen(
    viewModel: AuthViewModel = hiltViewModel(),
    phone: String,
) {
    val state by viewModel.uiState.collectAsState()
    var otp by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(AppColor.PrimaryDark, AppColor.Primary)))
            .statusBarsPadding()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(60.dp))
        Text("📱", fontSize = 48.sp)
        Spacer(Modifier.height(16.dp))
        Text("Verify OTP", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
        Text("Sent to +91 $phone", color = Color.White.copy(alpha = 0.8f), fontSize = 14.sp)

        state.devOtp?.let {
            Spacer(Modifier.height(8.dp))
            Card(
                shape = RoundedCornerShape(8.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.2f)),
            ) {
                Text(
                    "Dev OTP: $it",
                    color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                )
            }
        }

        Spacer(Modifier.height(32.dp))
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(Modifier.padding(24.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Your Name") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                )
                Spacer(Modifier.height(14.dp))
                OutlinedTextField(
                    value = otp,
                    onValueChange = { if (it.length <= 6 && it.all { c -> c.isDigit() }) otp = it },
                    label = { Text("6-digit OTP") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = { if (otp.length == 6) viewModel.verifyOtp(phone, otp, name) }),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                )

                state.error?.let {
                    Text(it, color = AppColor.Error, fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp))
                }

                Spacer(Modifier.height(20.dp))
                Button(
                    onClick = { viewModel.verifyOtp(phone, otp, name.ifBlank { "AgriHub User" }) },
                    enabled = otp.length == 6 && !state.loading,
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AppColor.Primary),
                ) {
                    if (state.loading) {
                        CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                    } else {
                        Text("Verify & Login", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    }
                }
            }
        }
    }
}
