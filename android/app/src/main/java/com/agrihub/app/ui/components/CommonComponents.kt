package com.agrihub.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agrihub.app.ui.theme.AppColor

@Composable
fun GradientHeader(
    title: String,
    subtitle: String = "",
    color1: Color,
    color2: Color,
    onBack: (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {},
    content: @Composable ColumnScope.() -> Unit = {},
) {
    GradientHeader(title, subtitle, colors = listOf(color1, color2), onBack, actions, content)
}

@Composable
fun GradientHeader(
    title: String,
    subtitle: String = "",
    colors: List<Color> = listOf(AppColor.PrimaryDark, AppColor.Primary),
    onBack: (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {},
    content: @Composable ColumnScope.() -> Unit = {},
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Brush.verticalGradient(colors))
            .statusBarsPadding()
            .padding(horizontal = 20.dp, vertical = 16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (onBack != null) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, "Back", tint = Color.White)
                }
                Spacer(Modifier.width(4.dp))
            }
            Column(Modifier.weight(1f)) {
                Text(title, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold)
                if (subtitle.isNotEmpty()) {
                    Text(subtitle, color = Color.White.copy(alpha = 0.75f), fontSize = 13.sp)
                }
            }
            actions()
        }
        content()
    }
}

@Composable
fun StatRow(stats: List<Triple<String, String, String>>) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(top = 16.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
    ) {
        stats.forEach { (emoji, value, label) ->
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(emoji, fontSize = 16.sp)
                Text(value, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
                Text(label, color = Color.White.copy(alpha = 0.7f), fontSize = 10.sp)
            }
        }
    }
}

@Composable
fun ActionCard(
    emoji: String,
    title: String,
    subtitle: String = "",
    accentColor: Color = AppColor.Primary,
    onClick: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 5.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(accentColor.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center,
            ) {
                Text(emoji, fontSize = 22.sp)
            }
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = AppColor.TextPrimary)
                if (subtitle.isNotEmpty()) {
                    Text(subtitle, fontSize = 12.sp, color = AppColor.TextSecondary)
                }
            }
            Text("›", fontSize = 22.sp, color = accentColor)
        }
    }
}

@Composable
fun LoadingScreen(message: String = "Loading...") {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = AppColor.Primary)
            Spacer(Modifier.height(12.dp))
            Text(message, color = AppColor.TextSecondary, fontSize = 14.sp)
        }
    }
}

@Composable
fun ErrorScreen(message: String, onRetry: () -> Unit) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(32.dp)) {
            Text("⚠️", fontSize = 40.sp)
            Spacer(Modifier.height(12.dp))
            Text(message, textAlign = TextAlign.Center, color = AppColor.TextSecondary)
            Spacer(Modifier.height(16.dp))
            Button(
                onClick = onRetry,
                colors = ButtonDefaults.buttonColors(containerColor = AppColor.Primary),
            ) {
                Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text("Retry")
            }
        }
    }
}

@Composable
fun EmptyState(emoji: String = "📭", title: String, subtitle: String = "", action: String = "", onAction: () -> Unit = {}) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(32.dp)) {
            Text(emoji, fontSize = 48.sp)
            Spacer(Modifier.height(12.dp))
            Text(title, fontWeight = FontWeight.Bold, fontSize = 17.sp, color = AppColor.TextPrimary)
            if (subtitle.isNotEmpty()) {
                Text(subtitle, textAlign = TextAlign.Center, color = AppColor.TextSecondary, fontSize = 13.sp, modifier = Modifier.padding(top = 4.dp))
            }
            if (action.isNotEmpty()) {
                Spacer(Modifier.height(16.dp))
                Button(
                    onClick = onAction,
                    colors = ButtonDefaults.buttonColors(containerColor = AppColor.Primary),
                ) { Text(action) }
            }
        }
    }
}

@Composable
fun StatusBadge(label: String, color: Color = AppColor.Primary) {
    Box(
        Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(color.copy(alpha = 0.12f))
            .padding(horizontal = 8.dp, vertical = 3.dp)
    ) {
        Text(label.replaceFirstChar { it.uppercase() }, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = color)
    }
}

@Composable
fun SectionTitle(title: String, subtitle: String = "", modifier: Modifier = Modifier) {
    Column(modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
        Text(title, fontWeight = FontWeight.ExtraBold, fontSize = 17.sp, color = AppColor.TextPrimary)
        if (subtitle.isNotEmpty()) {
            Text(subtitle, fontSize = 12.sp, color = AppColor.TextSecondary)
        }
    }
}

// Overload: StatRow with label-value pair
@Composable
fun StatRow(label: String, value: String, valueColor: Color = AppColor.TextPrimary) {
    Row(Modifier.fillMaxWidth().padding(vertical = 2.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, fontSize = 12.sp, color = AppColor.TextSecondary)
        Text(value, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = valueColor)
    }
}

// Overload: simple ActionCard with title and subtitle strings
@Composable
fun ActionCard(title: String, subtitle: String, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp).clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = AppColor.TextPrimary)
                Text(subtitle, fontSize = 11.sp, color = AppColor.TextSecondary)
            }
            Text("›", fontSize = 20.sp, color = AppColor.Primary)
        }
    }
}

// Overload: simple EmptyState with two strings
@Composable
fun EmptyState(title: String, subtitle: String) {
    EmptyState(emoji = "📭", title = title, subtitle = subtitle)
}
