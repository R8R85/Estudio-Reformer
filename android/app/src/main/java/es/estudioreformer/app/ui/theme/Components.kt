package es.estudioreformer.app.ui.theme

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

enum class ButtonKind { Primary, Secondary, Ghost }
enum class TagStyle { Accent, Accent2, Neutral, Outline }

@Composable
fun StudioButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    kind: ButtonKind = ButtonKind.Primary,
    block: Boolean = false,
    enabled: Boolean = true,
    loading: Boolean = false,
) {
    val (fg, border) = when (kind) {
        ButtonKind.Primary -> Theme.accent to Theme.accent
        ButtonKind.Secondary -> Theme.text to Theme.divider
        ButtonKind.Ghost -> Theme.accent to Color.Transparent
    }
    OutlinedButton(
        onClick = onClick,
        enabled = enabled && !loading,
        modifier = (if (block) modifier.fillMaxWidth() else modifier),
        shape = RoundedCornerShape(Theme.radiusMd),
        border = BorderStroke(1.dp, if (enabled) border else border.copy(alpha = 0.4f)),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = fg),
    ) {
        if (loading) {
            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Theme.accent, strokeWidth = 2.dp)
        } else {
            Text(text, fontSize = 14.sp, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
fun StudioTag(text: String, style: TagStyle = TagStyle.Neutral, onClick: (() -> Unit)? = null) {
    val (bg, fg, border) = when (style) {
        TagStyle.Accent -> Triple(Theme.accent800, Theme.accent100, null)
        TagStyle.Accent2 -> Triple(Theme.accent800.copy(alpha = 0.8f), Theme.accent200, null)
        TagStyle.Neutral -> Triple(Theme.neutral800, Theme.neutral400, null)
        TagStyle.Outline -> Triple(Color.Transparent, Theme.accent, Theme.accent)
    }
    var mod = Modifier
        .clip(RoundedCornerShape(50))
        .background(bg)
    if (border != null) mod = mod.border(1.dp, border, RoundedCornerShape(50))
    if (onClick != null) mod = mod.clickable(onClick = onClick)
    mod = mod.padding(horizontal = 10.dp, vertical = 3.dp)
    Box(mod) {
        Text(text, color = fg, fontSize = 11.sp)
    }
}

@Composable
fun CardSurface(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Box(
        modifier
            .clip(RoundedCornerShape(Theme.radiusMd))
            .background(Theme.surface)
            .border(1.dp, Theme.neutral800, RoundedCornerShape(Theme.radiusMd))
    ) { content() }
}

@Composable
fun LabeledField(
    label: String,
    note: String? = null,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String = "",
    isPassword: Boolean = false,
    keyboardType: KeyboardType = KeyboardType.Text,
    singleLine: Boolean = true,
    minLines: Int = 1,
) {
    Column {
        if (label.isNotEmpty()) {
            Text(label, fontSize = 12.sp, color = Theme.text.copy(alpha = 0.7f))
            Box(Modifier.height(5.dp))
        }
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder, color = Theme.neutral600) },
            singleLine = singleLine,
            minLines = minLines,
            visualTransformation = if (isPassword) androidx.compose.ui.text.input.PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(Theme.radiusMd),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Theme.surface,
                unfocusedContainerColor = Theme.surface,
                focusedTextColor = Theme.text,
                unfocusedTextColor = Theme.text,
                focusedIndicatorColor = Theme.accent,
                unfocusedIndicatorColor = Theme.divider,
                cursorColor = Theme.accent,
            ),
        )
        if (note != null) {
            Box(Modifier.height(5.dp))
            Text(note, fontSize = 11.sp, color = Theme.neutral500)
        }
    }
}

@Composable
fun YesNoSegment(value: Boolean, onChange: (Boolean) -> Unit, yes: String = "Sí", no: String = "No") {
    Row(
        Modifier
            .clip(RoundedCornerShape(Theme.radiusMd))
            .border(1.dp, Theme.divider, RoundedCornerShape(Theme.radiusMd))
    ) {
        segOption(yes, value) { onChange(true) }
        segOption(no, !value) { onChange(false) }
    }
}

@Composable
private fun RowScope.segOption(text: String, selected: Boolean, onClick: () -> Unit) {
    TextButton(
        onClick = onClick,
        modifier = Modifier
            .weight(1f)
            .background(if (selected) Theme.accent.copy(alpha = 0.12f) else Color.Transparent),
        shape = RoundedCornerShape(0.dp),
    ) {
        Text(text, color = if (selected) Theme.accent else Theme.text, fontSize = 13.sp)
    }
}

@Composable
fun SectionHeading(text: String) {
    Text(text, style = Theme.heading(16), color = Theme.text, modifier = Modifier.fillMaxWidth())
}

@Composable
fun EmptyState(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, subtitle: String? = null) {
    Column(
        Modifier
            .fillMaxWidth()
            .border(1.dp, Theme.neutral800, RoundedCornerShape(Theme.radiusMd))
            .padding(vertical = 36.dp, horizontal = 18.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(icon, contentDescription = null, tint = Theme.neutral600, modifier = Modifier.size(24.dp))
        Box(Modifier.height(8.dp))
        Text(title, fontSize = 13.sp, color = Theme.text, textAlign = TextAlign.Center)
        if (subtitle != null) {
            Box(Modifier.height(2.dp))
            Text(subtitle, fontSize = 11.sp, color = Theme.neutral500, textAlign = TextAlign.Center)
        }
    }
}

/** Simple observable holder + host for the bottom "toast" banner, mirroring
 * the prototype's ~2.6s auto-dismiss. */
class ToastState {
    var message by mutableStateOf<String?>(null)
        private set
    private val scope = kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.Main)
    private var job: kotlinx.coroutines.Job? = null

    fun show(text: String) {
        job?.cancel()
        message = text
        job = scope.launch {
            delay(2600)
            message = null
        }
    }
}

@Composable
fun rememberToastState(): ToastState = remember { ToastState() }

@Composable
private fun BoxScope.ToastOverlay(toast: ToastState) {
    AnimatedVisibility(
        visible = toast.message != null,
        enter = fadeIn(tween(180)) + slideInVertically(tween(180)) { it / 2 },
        exit = fadeOut(tween(120)) + slideOutVertically(tween(120)) { it / 2 },
        modifier = Modifier
            .align(Alignment.BottomCenter)
            .padding(horizontal = 16.dp, vertical = 90.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(9.dp),
            modifier = Modifier
                .clip(RoundedCornerShape(Theme.radiusMd))
                .background(Theme.neutral900)
                .padding(horizontal = 13.dp, vertical = 11.dp),
        ) {
            Icon(Icons.Filled.CheckCircle, contentDescription = null, tint = Theme.accent, modifier = Modifier.size(17.dp))
            Text(toast.message ?: "", color = Theme.text, fontSize = 12.5.sp)
        }
    }
}

/** `content` receives a `BoxScope` so callers can lay screen content and then
 * let the toast float above it, same idea as the iOS `ToastHost`. */
@Composable
fun ToastHost(toast: ToastState, content: @Composable BoxScope.() -> Unit) {
    Box(Modifier.fillMaxSize()) {
        content()
        ToastOverlay(toast)
    }
}
