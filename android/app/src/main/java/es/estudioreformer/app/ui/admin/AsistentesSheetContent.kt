package es.estudioreformer.app.ui.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.estudioreformer.app.network.ApiException
import es.estudioreformer.app.network.Attendee
import es.estudioreformer.app.network.AttendeesResponse
import es.estudioreformer.app.network.ClassTemplate
import es.estudioreformer.app.ui.LocalSession
import es.estudioreformer.app.ui.theme.ButtonKind
import es.estudioreformer.app.ui.theme.StudioButton
import es.estudioreformer.app.ui.theme.Theme
import kotlinx.coroutines.launch

/** The prototype's "hojaAsistentes" sheet — real names + a "Liberar" action
 * per attendee (admin-initiated cancellation, bypassing the member's 6h
 * cutoff), plus a shortcut into editing the franja itself. */
@Composable
fun AsistentesSheetContent(
    sessionId: String,
    onDismiss: () -> Unit,
    onChanged: (String) -> Unit,
    onEditRequested: (ClassTemplate) -> Unit,
) {
    val session = LocalSession.current
    val scope = rememberCoroutineScope()
    var data by remember { mutableStateOf<AttendeesResponse?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(sessionId) {
        try { data = session.api.attendees(sessionId) }
        catch (e: Exception) { onChanged((e as? ApiException)?.message ?: "Error") }
        isLoading = false
    }

    Column(Modifier.fillMaxWidth().padding(18.dp)) {
        val d = data
        if (d != null) {
            Text("${d.session.date} · ${d.session.time} · ${d.session.className}", fontSize = 20.sp, color = Theme.text)
            Text(
                "${d.session.coachName} · ${d.attendees.size} de ${d.session.capacity} plazas ocupadas",
                fontSize = 13.sp, color = Theme.neutral400,
            )
            Spacer(Modifier.height(12.dp))
            LazyColumn(Modifier.heightIn(max = 260.dp)) {
                items(d.attendees) { a ->
                    AttendeeRow(a) {
                        scope.launch {
                            try {
                                session.api.releaseBooking(a.bookingId)
                                onChanged("Plaza liberada · ${a.nombre}")
                            } catch (e: Exception) { onChanged((e as? ApiException)?.message ?: "Error") }
                        }
                    }
                }
                items(d.espera) { w ->
                    Row(Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
                        Text("En espera: ${w.nombre}", fontSize = 12.sp, color = Theme.neutral500, modifier = Modifier.weight(1f))
                        Text("puesto ${w.position}", fontSize = 11.sp, color = Theme.neutral600)
                    }
                }
            }
            Spacer(Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StudioButton("Cerrar", onDismiss, kind = ButtonKind.Secondary, block = true, modifier = Modifier.weight(1f))
                StudioButton(
                    "Editar franja",
                    onClick = {
                        scope.launch {
                            try {
                                val templates = session.api.classTemplates()
                                templates.firstOrNull { it.id == d.session.templateId }?.let(onEditRequested)
                            } catch (e: Exception) { onChanged((e as? ApiException)?.message ?: "Error") }
                        }
                    },
                    kind = ButtonKind.Primary, block = true, modifier = Modifier.weight(1f),
                )
            }
        } else if (isLoading) {
            CircularProgressIndicator(color = Theme.accent, modifier = Modifier.padding(vertical = 40.dp))
        }
    }
}

@Composable
private fun AttendeeRow(a: Attendee, onRelease: () -> Unit) {
    Column {
        Row(Modifier.fillMaxWidth().padding(vertical = 9.dp), verticalAlignment = Alignment.CenterVertically) {
            androidx.compose.foundation.layout.Box(
                Modifier.size(26.dp).clip(CircleShape).background(Theme.neutral800),
                contentAlignment = Alignment.Center,
            ) { Text(a.iniciales, fontSize = 11.sp, color = Theme.text) }
            Spacer(Modifier.width(10.dp))
            Text(a.nombre, fontSize = 13.sp, color = Theme.text, modifier = Modifier.weight(1f))
            Text(a.bonoTxt, fontSize = 11.sp, color = Theme.neutral500)
            Spacer(Modifier.width(8.dp))
            StudioButton("Liberar", onRelease, kind = ButtonKind.Ghost)
        }
        Divider(color = Theme.divider, thickness = 1.dp)
    }
}
