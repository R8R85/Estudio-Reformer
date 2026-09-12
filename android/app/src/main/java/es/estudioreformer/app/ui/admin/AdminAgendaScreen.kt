package es.estudioreformer.app.ui.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.NotificationsOff
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.estudioreformer.app.network.AdminAgendaResponse
import es.estudioreformer.app.network.AdminSessionRow
import es.estudioreformer.app.network.ApiException
import es.estudioreformer.app.network.ClassTemplate
import es.estudioreformer.app.network.ReminderSettings
import es.estudioreformer.app.network.ReminderSettingsPatch
import es.estudioreformer.app.ui.LocalSession
import es.estudioreformer.app.ui.theme.CardSurface
import es.estudioreformer.app.ui.theme.ButtonKind
import es.estudioreformer.app.ui.theme.StudioButton
import es.estudioreformer.app.ui.theme.StudioTag
import es.estudioreformer.app.ui.theme.TagStyle
import es.estudioreformer.app.ui.theme.Theme
import es.estudioreformer.app.ui.theme.ToastState
import es.estudioreformer.app.util.DateUtils
import kotlinx.coroutines.launch

@Composable
fun AdminAgendaScreen(toast: ToastState) {
    val session = LocalSession.current
    val scope = rememberCoroutineScope()

    var date by remember { mutableStateOf(DateUtils.todayISO()) }
    var agenda by remember { mutableStateOf<AdminAgendaResponse?>(null) }
    var settings by remember { mutableStateOf<ReminderSettings?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var attendeesSessionId by remember { mutableStateOf<String?>(null) }
    var editingTemplate by remember { mutableStateOf<ClassTemplate?>(null) }
    var creatingNew by remember { mutableStateOf(false) }

    suspend fun load() {
        isLoading = true
        try { agenda = session.api.adminAgenda(date) } catch (e: Exception) { toast.show((e as? ApiException)?.message ?: "Error") }
        isLoading = false
    }
    suspend fun loadSettings() {
        try { settings = session.api.reminderSettings() } catch (e: Exception) { /* non-fatal */ }
    }
    LaunchedEffect(Unit) { load(); loadSettings() }

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp)) {
        item { Text("Agenda del estudio", style = Theme.heading(20), color = Theme.text) }

        item {
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                DateUtils.weekDates(date).forEach { d ->
                    val selected = d == date
                    Column(
                        Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(Theme.radiusMd))
                            .background(if (selected) Theme.accent900 else Color.Transparent)
                            .border(1.dp, if (selected) Theme.accent else Theme.neutral800, RoundedCornerShape(Theme.radiusMd))
                            .clickable { date = d; scope.launch { load() } }
                            .padding(vertical = 8.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Text(DateUtils.label(d).uppercase(), fontSize = 9.sp, color = if (selected) Theme.accent200 else Theme.neutral400)
                        Text(DateUtils.dayNum(d), fontSize = 16.sp, fontWeight = FontWeight.Medium, color = if (selected) Theme.accent200 else Theme.neutral400)
                    }
                }
            }
        }

        val a = agenda
        if (a != null) {
            item {
                Spacer(Modifier.height(10.dp))
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        if (a.closed) "Domingo cerrado" else "${a.dayLabel} ${DateUtils.dayNum(date)} · ${a.sessions.size} franjas",
                        fontSize = 12.sp, color = Theme.neutral500, modifier = Modifier.weight(1f),
                    )
                    StudioButton("+ Nueva franja", { creatingNew = true }, kind = ButtonKind.Ghost)
                }
                Spacer(Modifier.height(10.dp))
            }
            items(a.sessions, key = { it.id }) { s ->
                FranjaCard(s, onOpenAttendees = { attendeesSessionId = s.id }, onEdit = {
                    scope.launch {
                        try {
                            val templates = session.api.classTemplates()
                            editingTemplate = templates.firstOrNull { it.id == s.templateId }
                        } catch (e: Exception) { toast.show((e as? ApiException)?.message ?: "Error") }
                    }
                })
                Spacer(Modifier.height(8.dp))
            }
            settings?.let { s ->
                item {
                    Spacer(Modifier.height(10.dp))
                    ReminderCard(s) { patch ->
                        scope.launch {
                            try { settings = session.api.updateReminderSettings(patch) }
                            catch (e: Exception) { toast.show((e as? ApiException)?.message ?: "Error") }
                        }
                    }
                }
            }
        } else if (isLoading) {
            item { CircularProgressIndicator(color = Theme.accent, modifier = Modifier.padding(top = 40.dp)) }
        }
    }

    attendeesSessionId?.let { sid ->
        val sheetState = rememberModalBottomSheetState()
        ModalBottomSheet(onDismissRequest = { attendeesSessionId = null }, sheetState = sheetState, containerColor = Theme.surface) {
            AsistentesSheetContent(
                sessionId = sid,
                onDismiss = { attendeesSessionId = null },
                onChanged = { message ->
                    attendeesSessionId = null
                    toast.show(message)
                    scope.launch { load() }
                },
                onEditRequested = { template ->
                    attendeesSessionId = null
                    editingTemplate = template
                },
            )
        }
    }

    editingTemplate?.let { template ->
        val sheetState = rememberModalBottomSheetState()
        ModalBottomSheet(onDismissRequest = { editingTemplate = null }, sheetState = sheetState, containerColor = Theme.surface) {
            EditarFranjaSheetContent(existing = template, dayOfWeek = DateUtils.dayOfWeek(date)) { message ->
                editingTemplate = null
                if (message != null) { toast.show(message); scope.launch { load() } }
            }
        }
    }

    if (creatingNew) {
        val sheetState = rememberModalBottomSheetState()
        ModalBottomSheet(onDismissRequest = { creatingNew = false }, sheetState = sheetState, containerColor = Theme.surface) {
            EditarFranjaSheetContent(existing = null, dayOfWeek = DateUtils.dayOfWeek(date)) { message ->
                creatingNew = false
                if (message != null) { toast.show(message); scope.launch { load() } }
            }
        }
    }
}

@Composable
private fun FranjaCard(s: AdminSessionRow, onOpenAttendees: () -> Unit, onEdit: () -> Unit) {
    val occupancyColor = if (s.occupied >= s.capacity) Theme.accent else if (s.occupied == 0) Theme.neutral600 else Theme.neutral400
    CardSurface(Modifier.fillMaxWidth().clickable(onClick = onOpenAttendees)) {
        Column(Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(s.time, fontSize = 16.sp, fontWeight = FontWeight.Medium, color = Theme.text, modifier = Modifier.width(50.dp))
                Column(Modifier.weight(1f)) {
                    Text(s.className, fontSize = 13.sp, color = Theme.text)
                    Text(s.coachName, fontSize = 11.sp, color = Theme.neutral500)
                }
                Text("${s.occupied}/${s.capacity}", fontSize = 13.sp, color = occupancyColor)
                Spacer(Modifier.width(8.dp))
                Box(
                    Modifier
                        .size(30.dp)
                        .clip(RoundedCornerShape(Theme.radiusMd))
                        .border(1.dp, Theme.divider, RoundedCornerShape(Theme.radiusMd))
                        .clickable(onClick = onEdit),
                    contentAlignment = Alignment.Center,
                ) { Icon(Icons.Filled.Edit, contentDescription = "Editar", tint = Theme.text, modifier = Modifier.size(14.dp)) }
            }
            Spacer(Modifier.height(10.dp))
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(Theme.neutral900),
            ) {
                Box(
                    Modifier
                        .fillMaxWidth(fraction = (s.pct / 100f).coerceIn(0f, 1f))
                        .height(4.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(occupancyColor),
                )
            }
            Spacer(Modifier.height(9.dp))
            if (s.vacia) {
                Text("Sin reservas", fontSize = 11.sp, color = Theme.neutral600)
            } else {
                Row(horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                    s.attendeeNames.forEach { StudioTag(it, TagStyle.Neutral) }
                    if (s.waitlistCount > 0) StudioTag("${s.waitlistCount} en lista de espera", TagStyle.Outline)
                }
            }
        }
    }
}

@Composable
private fun ReminderCard(s: ReminderSettings, onPatch: (ReminderSettingsPatch) -> Unit) {
    CardSurface(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    if (s.reminderEnabled) Icons.Filled.NotificationsActive else Icons.Filled.NotificationsOff,
                    contentDescription = null,
                    tint = if (s.reminderEnabled) Theme.accent else Theme.neutral600,
                )
                Spacer(Modifier.width(10.dp))
                Column(Modifier.weight(1f)) {
                    Text("Recordatorio 1 día antes", fontSize = 13.sp, color = Theme.text)
                    Text(
                        if (s.reminderEnabled) "Activo · se envía a las 18:00 del día anterior" else "Desactivado · nadie recibe aviso",
                        fontSize = 11.sp, color = Theme.neutral500,
                    )
                }
                Switch(
                    checked = s.reminderEnabled,
                    onCheckedChange = { onPatch(ReminderSettingsPatch(reminderEnabled = it)) },
                    colors = SwitchDefaults.colors(checkedThumbColor = Theme.accent100, checkedTrackColor = Theme.accent),
                )
            }
            Spacer(Modifier.height(11.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                StudioTag(
                    "Notificación en la app",
                    if (s.reminderChannelApp) TagStyle.Accent else TagStyle.Outline,
                    onClick = { onPatch(ReminderSettingsPatch(reminderChannelApp = !s.reminderChannelApp)) },
                )
                StudioTag(
                    "WhatsApp",
                    if (s.reminderChannelWhatsapp) TagStyle.Accent else TagStyle.Outline,
                    onClick = { onPatch(ReminderSettingsPatch(reminderChannelWhatsapp = !s.reminderChannelWhatsapp)) },
                )
            }
            Spacer(Modifier.height(8.dp))
            Text(
                if (s.reminderChannelWhatsapp) "El WhatsApp se envía al teléfono que cada socio/a dio al registrarse." else "Solo notificación dentro de la app.",
                fontSize = 11.sp, color = Theme.neutral500,
            )
        }
    }
}
