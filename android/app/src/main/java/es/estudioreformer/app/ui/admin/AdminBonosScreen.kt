package es.estudioreformer.app.ui.admin

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
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.PowerSettingsNew
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.estudioreformer.app.network.ApiException
import es.estudioreformer.app.network.BonosSummaryResponse
import es.estudioreformer.app.network.PendienteRenovar
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
fun AdminBonosScreen(toast: ToastState) {
    val session = LocalSession.current
    val scope = rememberCoroutineScope()

    var summary by remember { mutableStateOf<BonosSummaryResponse?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var confirmingRenewAll by remember { mutableStateOf(false) }

    suspend fun load() {
        isLoading = true
        try { summary = session.api.bonosSummary() } catch (e: Exception) { toast.show((e as? ApiException)?.message ?: "Error") }
        isLoading = false
    }
    LaunchedEffect(Unit) { load() }

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp)) {
        item { Text("Renovación de bonos", style = Theme.heading(20), color = Theme.text) }

        val s = summary
        if (s != null) {
            item {
                Spacer(Modifier.height(12.dp))
                CardSurface(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp)) {
                        Text("CICLO MENSUAL", fontSize = 12.sp, color = Theme.accent, letterSpacing = 1.sp)
                        Spacer(Modifier.height(8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(s.cicloActual, fontSize = 22.sp, fontWeight = FontWeight.Medium, color = Theme.text)
                            Spacer(Modifier.width(8.dp))
                            Icon(Icons.Filled.ArrowForward, contentDescription = null, tint = Theme.neutral500, modifier = Modifier.size(14.dp))
                            Spacer(Modifier.width(8.dp))
                            Text(s.cicloSiguiente, fontSize = 22.sp, fontWeight = FontWeight.Medium, color = Theme.accent)
                        }
                        Spacer(Modifier.height(14.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(22.dp)) {
                            Column {
                                Text("${s.numPendientes}", fontSize = 20.sp, fontWeight = FontWeight.Medium, color = Theme.text)
                                Text("bonos por renovar", fontSize = 11.sp, color = Theme.neutral500)
                            }
                            Column {
                                Text("${s.numRenovados}", fontSize = 20.sp, fontWeight = FontWeight.Medium, color = Theme.text)
                                Text("ya renovados", fontSize = 11.sp, color = Theme.neutral500)
                            }
                        }
                        Spacer(Modifier.height(16.dp))
                        StudioButton(
                            "Renovar los bonos pendientes", { confirmingRenewAll = true },
                            kind = ButtonKind.Primary, block = true, enabled = s.numPendientes > 0,
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "Cada renovación repone 8 sesiones al bono de cada socio/a",
                            fontSize = 11.sp, color = Theme.neutral500, modifier = Modifier.fillMaxWidth(),
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        )
                    }
                }
                Spacer(Modifier.height(12.dp))
                Row(
                    Modifier
                        .fillMaxWidth()
                        .border(1.dp, Theme.neutral800, RoundedCornerShape(Theme.radiusMd))
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(Icons.Filled.PowerSettingsNew, contentDescription = null, tint = Theme.neutral500)
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text("Renovación automática", fontSize = 13.sp, color = Theme.text)
                        Text("Desactivada · los bonos se renuevan a mano", fontSize = 11.sp, color = Theme.neutral500)
                    }
                }
                Spacer(Modifier.height(16.dp))
                SectionHeading("Pendientes de renovar")
                Spacer(Modifier.height(4.dp))
            }

            if (s.numPendientes == 0) {
                item { EmptyState(Icons.Filled.CheckCircle, "Todos los bonos de ${s.cicloSiguiente} están activos") }
            } else {
                items(s.pendientes) { u ->
                    PendienteRow(u) {
                        scope.launch {
                            try {
                                session.api.renewMember(u.id)
                                toast.show("Bono renovado · ${u.nombre}")
                                load()
                            } catch (e: Exception) { toast.show((e as? ApiException)?.message ?: "Error") }
                        }
                    }
                }
            }
        } else if (isLoading) {
            item { CircularProgressIndicator(color = Theme.accent, modifier = Modifier.padding(top = 40.dp)) }
        }
    }

    if (confirmingRenewAll && summary != null) {
        val sheetState = rememberModalBottomSheetState()
        ModalBottomSheet(onDismissRequest = { confirmingRenewAll = false }, sheetState = sheetState, containerColor = Theme.surface) {
            RenovarSheetContent(
                numPendientes = summary!!.numPendientes,
                cicloSiguiente = summary!!.cicloSiguiente,
                onDismiss = { confirmingRenewAll = false },
                onDone = { message ->
                    confirmingRenewAll = false
                    toast.show(message)
                    scope.launch { load() }
                },
            )
        }
    }
}

@Composable
private fun PendienteRow(u: PendienteRenovar, onRenew: () -> Unit) {
    Column {
        Row(Modifier.fillMaxWidth().padding(vertical = 11.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(u.nombre, fontSize = 13.sp, color = Theme.text)
                Text(u.detalle, fontSize = 11.sp, color = Theme.neutral500)
            }
            StudioButton("Renovar", onRenew, kind = ButtonKind.Secondary)
        }
        Divider(color = Theme.divider, thickness = 1.dp)
    }
}
