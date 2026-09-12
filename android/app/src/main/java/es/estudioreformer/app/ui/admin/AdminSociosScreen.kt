package es.estudioreformer.app.ui.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.estudioreformer.app.network.AccessRequest
import es.estudioreformer.app.network.ApiException
import es.estudioreformer.app.network.MemberSummary
import es.estudioreformer.app.ui.LocalSession
import es.estudioreformer.app.ui.theme.ButtonKind
import es.estudioreformer.app.ui.theme.CardSurface
import es.estudioreformer.app.ui.theme.LabeledField
import es.estudioreformer.app.ui.theme.StudioButton
import es.estudioreformer.app.ui.theme.StudioTag
import es.estudioreformer.app.ui.theme.TagStyle
import es.estudioreformer.app.ui.theme.Theme
import es.estudioreformer.app.ui.theme.ToastState
import kotlinx.coroutines.launch

@Composable
fun AdminSociosScreen(toast: ToastState) {
    val session = LocalSession.current
    val scope = rememberCoroutineScope()

    var requests by remember { mutableStateOf<List<AccessRequest>>(emptyList()) }
    var members by remember { mutableStateOf<List<MemberSummary>>(emptyList()) }
    var query by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(true) }
    var fichaMemberId by remember { mutableStateOf<String?>(null) }

    suspend fun loadAll() {
        isLoading = true
        try {
            requests = session.api.accessRequests()
            members = session.api.members(query)
        } catch (e: Exception) { toast.show((e as? ApiException)?.message ?: "Error") }
        isLoading = false
    }
    LaunchedEffect(Unit) { loadAll() }

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp)) {
        item { Text("Socios y socias", style = Theme.heading(20), color = Theme.text) }

        if (requests.isNotEmpty()) {
            item {
                Spacer(Modifier.height(14.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("SOLICITUDES DE ACCESO", fontSize = 11.sp, color = Theme.accent, letterSpacing = 1.sp)
                    Spacer(Modifier.width(8.dp))
                    StudioTag("${requests.size}", TagStyle.Accent)
                }
                Spacer(Modifier.height(8.dp))
            }
            items(requests) { q ->
                RequestCard(q, onApprove = {
                    scope.launch {
                        try {
                            session.api.approveRequest(q.id)
                            toast.show("Acceso concedido · ${q.nombre}")
                            loadAll()
                        } catch (e: Exception) { toast.show((e as? ApiException)?.message ?: "Error") }
                    }
                }, onReject = {
                    scope.launch {
                        try {
                            session.api.rejectRequest(q.id)
                            toast.show("Solicitud rechazada · ${q.nombre}")
                            loadAll()
                        } catch (e: Exception) { toast.show((e as? ApiException)?.message ?: "Error") }
                    }
                })
                Spacer(Modifier.height(8.dp))
            }
            item { Spacer(Modifier.height(6.dp)) }
        }

        item {
            LabeledField(
                label = "", value = query,
                onValueChange = { query = it; scope.launch { members = session.api.members(query) } },
                placeholder = "Buscar por nombre",
            )
            Spacer(Modifier.height(14.dp))
        }

        items(members) { m ->
            MemberRow(m, onClick = { fichaMemberId = m.id }, onRenew = {
                scope.launch {
                    try {
                        session.api.renewMember(m.id)
                        toast.show("Bono renovado · ${m.nombre}")
                        members = session.api.members(query)
                    } catch (e: Exception) { toast.show((e as? ApiException)?.message ?: "Error") }
                }
            })
            Spacer(Modifier.height(8.dp))
        }

        if (isLoading && members.isEmpty() && requests.isEmpty()) {
            item { CircularProgressIndicator(color = Theme.accent, modifier = Modifier.padding(top = 40.dp)) }
        }
    }

    fichaMemberId?.let { id ->
        val sheetState = rememberModalBottomSheetState()
        ModalBottomSheet(onDismissRequest = { fichaMemberId = null }, sheetState = sheetState, containerColor = Theme.surface) {
            FichaSheetContent(
                memberId = id,
                onDismiss = { fichaMemberId = null },
                onError = { message -> fichaMemberId = null; toast.show(message) },
            )
        }
    }
}

@Composable
private fun RequestCard(q: AccessRequest, onApprove: () -> Unit, onReject: () -> Unit) {
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(Theme.radiusMd))
            .background(Theme.surface)
            .border(1.dp, Theme.accent800, RoundedCornerShape(Theme.radiusMd))
            .padding(12.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            androidx.compose.foundation.layout.Box(
                Modifier.size(30.dp).clip(CircleShape).background(Theme.neutral800),
                contentAlignment = Alignment.Center,
            ) { Text(q.iniciales, fontSize = 11.sp, color = Theme.text) }
            Spacer(Modifier.width(10.dp))
            Column {
                Text(q.nombre, fontSize = 13.sp, color = Theme.text)
                Text(q.contacto, fontSize = 11.sp, color = Theme.neutral500)
            }
        }
        Spacer(Modifier.height(8.dp))
        Text(q.nota, fontSize = 11.sp, color = Theme.neutral500)
        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            StudioButton("Rechazar", onReject, kind = ButtonKind.Secondary, block = true, modifier = Modifier.weight(1f))
            StudioButton("Dar acceso", onApprove, kind = ButtonKind.Primary, block = true, modifier = Modifier.weight(1f))
        }
    }
}

@Composable
private fun MemberRow(m: MemberSummary, onClick: () -> Unit, onRenew: () -> Unit) {
    CardSurface(Modifier.fillMaxWidth().clickable(onClick = onClick)) {
        Row(Modifier.padding(horizontal = 12.dp, vertical = 11.dp), verticalAlignment = Alignment.CenterVertically) {
            androidx.compose.foundation.layout.Box(
                Modifier.size(32.dp).clip(CircleShape).background(Theme.neutral800),
                contentAlignment = Alignment.Center,
            ) { Text(m.iniciales, fontSize = 12.sp, color = Theme.text) }
            Spacer(Modifier.width(11.dp))
            Column(Modifier.weight(1f)) {
                Text(m.nombre, fontSize = 13.sp, color = Theme.text)
                Text(m.detalle, fontSize = 11.sp, color = Theme.neutral500)
            }
            StudioButton(
                m.btnTexto,
                onClick = onRenew,
                kind = if (m.pendienteRenovar) ButtonKind.Primary else ButtonKind.Secondary,
                enabled = m.pendienteRenovar,
            )
        }
    }
}
