package es.estudioreformer.app.ui.member

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ConfirmationNumber
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.estudioreformer.app.network.AgendaResponse
import es.estudioreformer.app.network.ApiException
import es.estudioreformer.app.network.PendingOffer
import es.estudioreformer.app.network.ReminderTomorrow
import es.estudioreformer.app.network.SessionRow
import es.estudioreformer.app.network.WeekDay
import es.estudioreformer.app.ui.LocalSession
import es.estudioreformer.app.ui.theme.ButtonKind
import es.estudioreformer.app.ui.theme.CardSurface
import es.estudioreformer.app.ui.theme.EmptyState
import es.estudioreformer.app.ui.theme.StudioButton
import es.estudioreformer.app.ui.theme.TagStyle
import es.estudioreformer.app.ui.theme.StudioTag
import es.estudioreformer.app.ui.theme.Theme
import es.estudioreformer.app.ui.theme.ToastState
import kotlinx.coroutines.launch

@Composable
fun AgendaScreen(toast: ToastState, goToBono: () -> Unit) {
    val session = LocalSession.current
    val scope = rememberCoroutineScope()

    var agenda by remember { mutableStateOf<AgendaResponse?>(null) }
    var date by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var sheetRow by remember { mutableStateOf<SessionRow?>(null) }

    suspend fun load(requestedDate: String?) {
        isLoading = true
        try {
            val res = session.api.agenda(requestedDate)
            agenda = res
            date = res.date
        } catch (e: Exception) {
            toast.show((e as? ApiException)?.message ?: "No se pudo cargar la agenda")
        } finally {
            isLoading = false
        }
    }

    LaunchedEffect(Unit) { load(null) }

    LazyColumn(Modifier.fillMaxSize(), contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp, vertical = 12.dp)) {
        item { Text("Agenda", style = Theme.heading(20), color = Theme.text) }

        val a = agenda
        if (a != null) {
            a.pendingOffer?.let { offer ->
                item {
                    Spacer(Modifier.height(12.dp))
                    OfferBanner(offer, onAccept = {
                        scope.launch {
                            try {
                                session.api.acceptOffer(offer.id)
                                toast.show("Plaza confirmada · ${offer.time} ${offer.date}")
                                load(date)
                            } catch (e: Exception) { toast.show((e as? ApiException)?.message ?: "Error") }
                        }
                    }, onDecline = {
                        scope.launch {
                            try {
                                session.api.declineOffer(offer.id)
                                toast.show("Plaza ofrecida a la siguiente persona de la lista")
                                load(date)
                            } catch (e: Exception) { toast.show((e as? ApiException)?.message ?: "Error") }
                        }
                    })
                }
            }
            a.reminderTomorrow?.let {
                item { Spacer(Modifier.height(10.dp)); ReminderBanner(it) }
            }
            item {
                Spacer(Modifier.height(10.dp))
                BonoRow(a.bono.remaining, goToBono)
                Spacer(Modifier.height(12.dp))
                WeekStrip(a.week, a.date) { d -> scope.launch { load(d) } }
                Spacer(Modifier.height(8.dp))
            }

            if (a.closed) {
                item { EmptyState(Icons.Filled.DarkMode, "El estudio no abre los domingos", "Vuelve el lunes a las 07:00") }
            } else {
                items(a.sessions, key = { it.id }) { row ->
                    Column {
                        SessionRowCard(row) { sheetRow = row }
                        Spacer(Modifier.height(8.dp))
                    }
                }
            }
        } else if (isLoading) {
            item {
                Row(Modifier.fillMaxWidth().padding(top = 40.dp), horizontalArrangement = Arrangement.Center) {
                    CircularProgressIndicator(color = Theme.accent)
                }
            }
        }
    }

    sheetRow?.let { row ->
        val sheetState = rememberModalBottomSheetState()
        ModalBottomSheet(onDismissRequest = { sheetRow = null }, sheetState = sheetState, containerColor = Theme.surface) {
            ReservaSheetContent(
                row = row,
                onDismiss = { sheetRow = null },
                onDone = { message ->
                    sheetRow = null
                    toast.show(message)
                    scope.launch { load(date) }
                },
            )
        }
    }
}

@Composable
private fun OfferBanner(offer: PendingOffer, onAccept: () -> Unit, onDecline: () -> Unit) {
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(Theme.radiusMd))
            .background(Theme.accent900)
            .border(1.dp, Theme.accent, RoundedCornerShape(Theme.radiusMd))
            .padding(12.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(9.dp)) {
            Icon(Icons.Filled.NotificationsActive, contentDescription = null, tint = Theme.accent200, modifier = Modifier.padding(top = 1.dp))
            Column {
                Text("Plaza libre · ${offer.date} ${offer.time}", fontSize = 13.sp, color = Theme.accent100)
                Text(
                    "${offer.className} · aviso enviado por la app y WhatsApp · tienes 30 min para confirmar",
                    fontSize = 11.sp, color = Theme.accent300,
                )
            }
        }
        Spacer(Modifier.height(11.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            StudioButton("Ahora no", onDecline, kind = ButtonKind.Secondary, block = true, modifier = Modifier.weight(1f))
            StudioButton("Ocupar plaza", onAccept, kind = ButtonKind.Primary, block = true, modifier = Modifier.weight(1f))
        }
    }
}

@Composable
private fun ReminderBanner(reminder: ReminderTomorrow) {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(Theme.radiusMd))
            .background(Theme.accent900)
            .border(1.dp, Theme.accent800, RoundedCornerShape(Theme.radiusMd))
            .padding(11.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Icon(Icons.Filled.NotificationsActive, contentDescription = null, tint = Theme.accent300)
        Column {
            Text("Mañana ${reminder.time} · ${reminder.className}", fontSize = 12.5.sp, color = Theme.accent100)
            Text("Aviso hoy a las 18:00", fontSize = 11.sp, color = Theme.accent300)
        }
    }
}

@Composable
private fun BonoRow(remaining: Int, goToBono: () -> Unit) {
    CardSurface(Modifier.fillMaxWidth()) {
        Row(Modifier.padding(horizontal = 12.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Filled.ConfirmationNumber, contentDescription = null, tint = Theme.accent)
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text("$remaining sesiones disponibles", fontSize = 13.sp, color = Theme.text)
                Text("Bono de 8 sesiones · sin caducidad", fontSize = 11.sp, color = Theme.neutral500)
            }
            StudioButton("Ver bono", goToBono, kind = ButtonKind.Ghost)
        }
    }
}

@Composable
private fun WeekStrip(week: List<WeekDay>, current: String, onSelect: (String) -> Unit) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        week.forEach { d ->
            val selected = d.date == current
            Column(
                Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(Theme.radiusMd))
                    .background(if (selected) Theme.accent900 else androidx.compose.ui.graphics.Color.Transparent)
                    .border(1.dp, if (selected) Theme.accent else Theme.neutral800, RoundedCornerShape(Theme.radiusMd))
                    .clickable { onSelect(d.date) }
                    .padding(vertical = 8.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(d.label.uppercase(), fontSize = 9.sp, color = if (selected) Theme.accent200 else Theme.neutral400)
                Text(d.num, fontSize = 16.sp, fontWeight = FontWeight.Medium, color = if (selected) Theme.accent200 else Theme.neutral400)
            }
        }
    }
}

@Composable
internal fun SessionRowCard(row: SessionRow, onClick: () -> Unit) {
    val tagStyle = when {
        row.mine -> TagStyle.Accent
        row.waitlisted -> TagStyle.Accent2
        row.full -> TagStyle.Neutral
        else -> TagStyle.Outline
    }
    val borderColor = if (row.mine) Theme.accent else androidx.compose.ui.graphics.Color.Transparent
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(Theme.radiusMd))
            .background(Theme.surface)
            .border(1.dp, borderColor, RoundedCornerShape(Theme.radiusMd))
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.width(50.dp)) {
            Text(row.time, fontSize = 16.sp, fontWeight = FontWeight.Medium, color = Theme.text)
            Text("50 min", fontSize = 10.sp, color = Theme.neutral500)
        }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(row.className, fontSize = 13.sp, color = Theme.text)
            Text("${row.coachName} · ${row.plazasTxt}", fontSize = 11.sp, color = Theme.neutral500)
        }
        StudioTag(row.estado, tagStyle)
    }
}
