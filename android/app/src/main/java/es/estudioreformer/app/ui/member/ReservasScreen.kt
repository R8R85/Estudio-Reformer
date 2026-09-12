package es.estudioreformer.app.ui.member

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.estudioreformer.app.network.ApiException
import es.estudioreformer.app.network.EsperaItem
import es.estudioreformer.app.network.ProximaReserva
import es.estudioreformer.app.network.ReservasResponse
import es.estudioreformer.app.ui.LocalSession
import es.estudioreformer.app.ui.theme.ButtonKind
import es.estudioreformer.app.ui.theme.CardSurface
import es.estudioreformer.app.ui.theme.EmptyState
import es.estudioreformer.app.ui.theme.SectionHeading
import es.estudioreformer.app.ui.theme.StudioButton
import es.estudioreformer.app.ui.theme.Theme
import es.estudioreformer.app.ui.theme.ToastState
import kotlinx.coroutines.launch

@Composable
fun ReservasScreen(toast: ToastState, goToAgenda: () -> Unit) {
    val session = LocalSession.current
    val scope = rememberCoroutineScope()
    var data by remember { mutableStateOf<ReservasResponse?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    suspend fun load() {
        isLoading = true
        try { data = session.api.reservas() } catch (e: Exception) { toast.show((e as? ApiException)?.message ?: "Error") }
        isLoading = false
    }
    LaunchedEffect(Unit) { load() }

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp)) {
        item { Text("Mis reservas", style = Theme.heading(20), color = Theme.text) }

        val d = data
        if (d != null) {
            if (d.proximas.isEmpty()) {
                item {
                    Spacer(Modifier.height(12.dp))
                    EmptyState(Icons.Filled.CalendarMonth, "No tienes sesiones reservadas")
                    Spacer(Modifier.height(12.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                        StudioButton("Ir a la agenda", goToAgenda, kind = ButtonKind.Primary)
                    }
                }
            } else {
                item { Spacer(Modifier.height(12.dp)) }
                items(d.proximas) { r ->
                    ProximaCard(r) {
                        scope.launch {
                            try {
                                session.api.cancelBooking(r.bookingId)
                                toast.show("Reserva cancelada · sesión devuelta al bono")
                                load()
                            } catch (e: Exception) { toast.show((e as? ApiException)?.message ?: "Error") }
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                }
            }

            if (d.espera.isNotEmpty()) {
                item {
                    Spacer(Modifier.height(8.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Lista de espera", style = Theme.heading(16), color = Theme.text)
                        Spacer(Modifier.width(8.dp))
                        Icon(Icons.Filled.NotificationsActive, contentDescription = null, tint = Theme.accent, modifier = Modifier.size(14.dp))
                    }
                    Spacer(Modifier.height(8.dp))
                }
                items(d.espera) { w ->
                    EsperaCard(w) {
                        scope.launch {
                            try {
                                session.api.leaveWaitlist(w.entryId)
                                toast.show("Has salido de la lista de espera")
                                load()
                            } catch (e: Exception) { toast.show((e as? ApiException)?.message ?: "Error") }
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                }
            }

            item { Spacer(Modifier.height(8.dp)); SectionHeading("Historial"); Spacer(Modifier.height(4.dp)) }
            items(d.historial) { h ->
                Column {
                    Row(Modifier.padding(vertical = 10.dp)) {
                        Text(h.dayLabel, fontSize = 12.sp, color = Theme.neutral400, modifier = Modifier.width(84.dp))
                        Text(h.className, fontSize = 12.sp, color = Theme.text, modifier = Modifier.weight(1f))
                        Text(h.estado, fontSize = 11.sp, color = Theme.neutral500)
                    }
                    Divider(color = Theme.divider, thickness = 1.dp)
                }
            }
        } else if (isLoading) {
            item { CircularProgressIndicator(color = Theme.accent, modifier = Modifier.padding(top = 40.dp)) }
        }
    }
}

@Composable
private fun ProximaCard(r: ProximaReserva, onCancel: () -> Unit) {
    CardSurface(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.width(50.dp)) {
                    Text(r.time, fontSize = 16.sp, fontWeight = FontWeight.Medium, color = Theme.text)
                    Text(r.dayLabel, fontSize = 10.sp, color = Theme.neutral500)
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(r.className, fontSize = 13.sp, color = Theme.text)
                    Text(r.coachName, fontSize = 11.sp, color = Theme.neutral500)
                }
                StudioButton(r.cancelText, onCancel, kind = ButtonKind.Secondary, enabled = r.cancelable)
            }
            if (!r.cancelable) {
                Spacer(Modifier.height(8.dp))
                Text(r.cancelNote, fontSize = 11.sp, color = Theme.neutral500)
            }
        }
    }
}

@Composable
private fun EsperaCard(w: EsperaItem, onLeave: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .border(1.dp, Theme.accent800, RoundedCornerShape(Theme.radiusMd))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text("${w.date} · ${w.time} ${w.className}", fontSize = 13.sp, color = Theme.text)
            Text("Puesto ${w.position} de ${w.total} · te avisamos por app y WhatsApp", fontSize = 11.sp, color = Theme.neutral500)
        }
        StudioButton("Salir", onLeave, kind = ButtonKind.Secondary)
    }
}
