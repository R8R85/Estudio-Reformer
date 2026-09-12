package es.estudioreformer.app.ui.theme

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Color/spacing/radius tokens lifted straight from the Claude Design
 * handoff's "Nocturne" design system (`_ds/.../styles.css`), so the native
 * app matches the approved mockup instead of picking its own palette.
 */
object Theme {
    val bg = Color(0xFF161826)
    val surface = Color(0xFF232532)
    val text = Color(0xFFE9E9ED)
    val divider = Color.White.copy(alpha = 0.16f)

    val accent = Color(0xFF9184D9)
    val accent100 = Color(0xFFF5F4FF)
    val accent200 = Color(0xFFE7E5FE)
    val accent300 = Color(0xFFD2CEFD)
    val accent800 = Color(0xFF423A6A)
    val accent900 = Color(0xFF2B2741)

    val neutral400 = Color(0xFFB2B6CA)
    val neutral500 = Color(0xFF9397AB)
    val neutral600 = Color(0xFF75798C)
    val neutral700 = Color(0xFF595D6C)
    val neutral800 = Color(0xFF3F424D)
    val neutral900 = Color(0xFF292B31)

    val radiusSm = 4.dp
    val radiusMd = 8.dp
    val radiusLg = 14.dp

    fun heading(size: Int) = TextStyle(fontSize = size.sp, fontWeight = FontWeight.Medium)
}

private val EstudioReformerColorScheme = darkColorScheme(
    background = Theme.bg,
    surface = Theme.surface,
    primary = Theme.accent,
    onBackground = Theme.text,
    onSurface = Theme.text,
)

@Composable
fun EstudioReformerTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = EstudioReformerColorScheme,
        typography = Typography(),
        content = content,
    )
}

val CardShape = RoundedCornerShape(Theme.radiusMd)
fun Modifier.screenPadding(): Modifier = this.padding(horizontal = 16.dp)
