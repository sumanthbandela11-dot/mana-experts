package `in`.manaexperts.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Emergent Reference Design System Palette
val DeepTeal = Color(0xFF087F78)
val DarkNavy = Color(0xFF10213A)
val WarmIvory = Color(0xFFFAF9F6)
val PureWhite = Color(0xFFFFFFFF)
val MutedGrey = Color(0xFF64748B)
val LightTeal = Color(0xFFE8F7F4)
val WarmAmber = Color(0xFFF59E0B)

private val LightColorScheme = lightColorScheme(
    primary = DeepTeal,
    onPrimary = PureWhite,
    primaryContainer = LightTeal,
    onPrimaryContainer = DeepTeal,
    secondary = DarkNavy,
    onSecondary = PureWhite,
    background = WarmIvory,
    onBackground = DarkNavy,
    surface = PureWhite,
    onSurface = DarkNavy,
    surfaceVariant = Color(0xFFF1F5F9),
    onSurfaceVariant = MutedGrey
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF2DD4BF),
    onPrimary = DarkNavy,
    primaryContainer = Color(0xFF115E59),
    onPrimaryContainer = LightTeal,
    secondary = LightTeal,
    onSecondary = DarkNavy,
    background = Color(0xFF0B1528),
    onBackground = WarmIvory,
    surface = Color(0xFF10213A),
    onSurface = PureWhite,
    surfaceVariant = Color(0xFF1E293B),
    onSurfaceVariant = Color(0xFF94A3B8)
)

val ManaTypography = Typography(
    headlineMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        lineHeight = 30.sp,
        color = DarkNavy
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 20.sp,
        lineHeight = 26.sp
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        lineHeight = 22.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp
    )
)

@Composable
fun ManaExpertsTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme,
        typography = ManaTypography,
        content = content
    )
}
