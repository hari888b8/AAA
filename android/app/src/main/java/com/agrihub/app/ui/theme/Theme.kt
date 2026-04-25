package com.agrihub.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// ─── Brand Colors ──────────────────────────────────────────
object AppColor {
    val Primary = Color(0xFF1A7A4A)
    val PrimaryDark = Color(0xFF145C37)
    val PrimaryLight = Color(0xFF2AAD6A)
    val Secondary = Color(0xFFF0A500)
    val SecondaryLight = Color(0xFFFFC840)
    val Accent = Color(0xFF0066CC)
    val AccentLight = Color(0xFF3385D6)

    val Success = Color(0xFF22C55E)
    val Warning = Color(0xFFF59E0B)
    val Error = Color(0xFFEF4444)
    val Info = Color(0xFF3B82F6)

    val Background = Color(0xFFF5F7FA)
    val Surface = Color(0xFFFFFFFF)
    val SurfaceSecondary = Color(0xFFF0F4F0)
    val Border = Color(0xFFE2E8E4)

    val TextPrimary = Color(0xFF1A2E1F)
    val TextSecondary = Color(0xFF4A6860)
    val TextMuted = Color(0xFF8AA898)
    val TextOnPrimary = Color(0xFFFFFFFF)

    // Per-platform
    val AgriFlow = Color(0xFF1A7A4A)
    val AgriFlowLight = Color(0xFFE8F5EE)
    val AquaOS = Color(0xFF0066CC)
    val AquaOSLight = Color(0xFFE6F0FF)
    val KisanConnect = Color(0xFF8B5CF6)
    val KisanConnectLight = Color(0xFFF0EBFF)
    val FarmerConnect = Color(0xFFF0A500)
    val FarmerConnectLight = Color(0xFFFFF8E6)
    val Intelligence = Color(0xFFEF4444)
    val IntelligenceLight = Color(0xFFFFF1F1)

    // Role-based colors
    val FpoBlue = Color(0xFF1565C0)
    val BuyerOrange = Color(0xFFE65100)
    val AquaTeal = Color(0xFF00897B)
    val KisanOrange = Color(0xFFFF8F00)
    val SurfaceVariant = Color(0xFFF1F5F9)
    val Divider = Color(0xFFE2E8E4)
}

private val LightColorScheme = lightColorScheme(
    primary = AppColor.Primary,
    onPrimary = AppColor.TextOnPrimary,
    primaryContainer = AppColor.PrimaryLight,
    secondary = AppColor.Secondary,
    onSecondary = AppColor.TextPrimary,
    background = AppColor.Background,
    onBackground = AppColor.TextPrimary,
    surface = AppColor.Surface,
    onSurface = AppColor.TextPrimary,
    error = AppColor.Error,
    onError = Color.White,
    outline = AppColor.Border,
    surfaceVariant = AppColor.SurfaceSecondary,
)

val AgriHubTypography = Typography(
    headlineLarge = TextStyle(fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = AppColor.TextPrimary),
    headlineMedium = TextStyle(fontSize = 22.sp, fontWeight = FontWeight.Bold, color = AppColor.TextPrimary),
    headlineSmall = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Bold, color = AppColor.TextPrimary),
    titleLarge = TextStyle(fontSize = 20.sp, fontWeight = FontWeight.Bold, color = AppColor.TextPrimary),
    titleMedium = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = AppColor.TextPrimary),
    titleSmall = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = AppColor.TextPrimary),
    bodyLarge = TextStyle(fontSize = 16.sp, color = AppColor.TextPrimary),
    bodyMedium = TextStyle(fontSize = 14.sp, color = AppColor.TextSecondary),
    bodySmall = TextStyle(fontSize = 12.sp, color = AppColor.TextMuted),
    labelLarge = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
    labelMedium = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium),
    labelSmall = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Medium, color = AppColor.TextMuted),
)

@Composable
fun AgriHubTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = AgriHubTypography,
        content = content
    )
}
