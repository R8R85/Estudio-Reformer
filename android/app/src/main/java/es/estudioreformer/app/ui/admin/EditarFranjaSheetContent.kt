package es.estudioreformer.app.ui.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.estudioreformer.app.network.ApiException
import es.estudioreformer.app.network.ClassTemplate
import es.estudioreformer.app.network.ClassTemplateInput
import es.estudioreformer.app.ui.LocalSession
import es.estudioreformer.app.ui.theme.ButtonKind
import es.estudioreformer.app.ui.theme.LabeledField
import es.estudioreformer.app.ui.theme.StudioButton
import es.estudioreformer.app.ui.theme.Theme
import kotlinx.coroutines.launch

/** The prototype's "hojaEditar" sheet — create or edit a recurring weekly
 * class slot (franja). `dayOfWeek` seeds a *new* franja with the day
 * currently selected in the agenda; editing an existing one keeps its own
 * `dayOfWeek` untouched here (the admin picks the day by tapping the strip,
 * same as the prototype). */
@Composable
fun EditarFranjaSheetContent(existing: ClassTemplate?, dayOfWeek: Int, onDone: (String?) -> Unit) {
    val session = LocalSession.current
    val scope = rememberCoroutineScope()

    var time by remember { mutableStateOf(existing?.time ?: "") }
    var className by remember { mutableStateOf(existing?.className ?: "") }
    var coachName by remember { mutableStateOf(existing?.coachName ?: "") }
    var capacity by remember { mutableIntStateOf(existing?.capacity ?: 2) }
    var isSubmitting by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val incompleto = className.isBlank() || coachName.isBlank() || !time.matches(Regex("^([01]\\d|2[0-3]):[0-5]\\d$"))

    Column(Modifier.fillMaxWidth().padding(18.dp)) {
        Text(if (existing == null) "Nueva franja" else "Editar franja", fontSize = 22.sp, fontWeight = FontWeight.Medium, color = Theme.text)
        Spacer(Modifier.height(14.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Column(Modifier.width(110.dp)) {
                LabeledField(label = "Hora (HH:mm)", value = time, onValueChange = { time = it }, placeholder = "07:00", keyboardType = KeyboardType.Number)
            }
            Column(Modifier.weight(1f)) {
                LabeledField(label = "Nombre de la sesión", value = className, onValueChange = { className = it }, placeholder = "Reformer Flow")
            }
        }
        Spacer(Modifier.height(10.dp))
        LabeledField(
            label = "Instructor/a", value = coachName, onValueChange = { coachName = it }, placeholder = "Marta",
            note = "El nombre y la hora son los que verá cada socio/a en la agenda.",
        )
        Spacer(Modifier.height(12.dp))

        Row(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(Theme.radiusMd))
                .background(Theme.bg)
                .padding(horizontal = 12.dp, vertical = 11.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text("Plazas de la sesión", fontSize = 13.sp, color = Theme.text)
                Text("Reformers disponibles en esta franja", fontSize = 11.sp, color = Theme.neutral500)
            }
            StepperButton(Icons.Filled.Remove) { capacity = (capacity - 1).coerceAtLeast(1) }
            Text("$capacity", fontSize = 18.sp, fontWeight = FontWeight.Medium, color = Theme.text, modifier = Modifier.width(24.dp))
            StepperButton(Icons.Filled.Add) { capacity = (capacity + 1).coerceAtMost(20) }
        }

        error?.let {
            Spacer(Modifier.height(12.dp))
            Text(it, fontSize = 12.sp, color = Theme.accent300)
        }

        Spacer(Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            StudioButton("Cancelar", { onDone(null) }, kind = ButtonKind.Secondary, block = true, modifier = Modifier.weight(1f))
            StudioButton(
                "Guardar",
                onClick = {
                    isSubmitting = true
                    error = null
                    val input = ClassTemplateInput(existing?.dayOfWeek ?: dayOfWeek, time, className.trim(), coachName.trim(), capacity)
                    scope.launch {
                        try {
                            if (existing != null) {
                                session.api.updateClassTemplate(existing.id, input)
                                onDone("Franja actualizada · ${input.time}")
                            } else {
                                session.api.createClassTemplate(input)
                                onDone("Franja creada · ${input.time}")
                            }
                        } catch (e: ApiException) {
                            error = e.message
                        } catch (e: Exception) {
                            error = "No se pudo conectar con el servidor"
                        } finally {
                            isSubmitting = false
                        }
                    }
                },
                kind = ButtonKind.Primary, block = true, enabled = !incompleto, loading = isSubmitting,
                modifier = Modifier.weight(1f),
            )
        }

        if (existing != null) {
            Spacer(Modifier.height(10.dp))
            StudioButton(
                "Eliminar franja",
                onClick = {
                    scope.launch {
                        try {
                            session.api.deleteClassTemplate(existing.id)
                            onDone("Franja eliminada · ${existing.time}")
                        } catch (e: ApiException) {
                            error = e.message
                        } catch (e: Exception) {
                            error = "No se pudo conectar con el servidor"
                        }
                    }
                },
                kind = ButtonKind.Ghost, block = true,
            )
        }
    }
}

@Composable
private fun StepperButton(icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit) {
    androidx.compose.foundation.layout.Box(
        Modifier
            .size(30.dp)
            .clip(CircleShape)
            .background(Theme.surface)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) { Icon(icon, contentDescription = null, tint = Theme.text, modifier = Modifier.size(14.dp)) }
}
