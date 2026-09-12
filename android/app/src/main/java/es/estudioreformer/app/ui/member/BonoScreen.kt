package es.estudioreformer.app.ui.member

import androidx.compose.foundation.background
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
import androidx.compose.material.icons.filled.Autorenew
import androidx.compose.material.icons.filled.AddCircle
import androidx.compose.material.icons.filled.RemoveCircle
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.estudioreformer.app.network.ApiException
import es.estudioreformer.app.network.BonoResponse
import es.estudioreformer.app.network.Movimiento
import es.estudioreformer.app.ui.LocalSession
import es.estudioreformer.app.ui.theme.CardSurface
import es.estudioreformer.app.ui.theme.SectionHeading
import es.estudioreformer.app.ui.theme.StudioTag
import es.estudioreformer.app.ui.theme.TagStyle
import es.estudioreformer.app.ui.theme.Theme
import es.estudioreformer.app.ui.theme.ToastState

@Composable
fun BonoScreen(toast: ToastState) {
    val session = LocalSession.current
    var bono by remember { mutableStateOf<BonoResponse?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try { bono = session.api.bono() } catch (e: Exception) { toast.show((e as? ApiException)?.message ?: "Error") }
        isLoading = false
    }

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp)) {
        item { Text("Mi bono", style = Theme.heading(20), color = Theme.text) }

        val b = bono
        if (b != null) {
            item {
                Spacer(Modifier.height(12.dp))
                CardSurface(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.Bottom) {
                            Text("BONO MENSUAL", fontSize = 12.sp, color = Theme.accent, letterSpacing = 1.sp)
                            Spacer(Modifier.weight(1f))
                            StudioTag(b.status, TagStyle.Outline)
                        }
                        Spacer(Modifier.height(10.dp))
                        Row(verticalAlignment = Alignment.Bottom) {
                            Text("${b.remaining}", fontSize = 40.sp, fontWeight = FontWeight.Medium, color = Theme.text)
                            Spacer(Modifier.width(6.dp))
                            Text("de 8 sesiones sin usar", fontSize = 14.sp, color = Theme.neutral500)
                        }
                        Spacer(Modifier.height(14.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            repeat(8) { i ->
                                val used = i < (8 - b.remaining)
                                androidx.compose.foundation.layout.Box(
                                    Modifier
                                        .weight(1f)
                                        .height(6.dp)
                                        .clip(RoundedCornerShape(3.dp))
                                        .background(if (used) Theme.neutral800 else Theme.accent),
                                )
                            }
                        }
                        Spacer(Modifier.height(10.dp))
                        Text("Ciclo: ${b.cycleLabel} · las sesiones no caducan", fontSize = 11.sp, color = Theme.neutral500)
                        Text("Las sesiones que no se cancelen con 6 h de antelación se descuentan del bono.", fontSize = 11.sp, color = Theme.neutral500)
                    }
                }
                Spacer(Modifier.height(12.dp))
                Row(
                    Modifier
                        .fillMaxWidth()
                        .border(1.dp, Theme.neutral800, RoundedCornerShape(Theme.radiusMd))
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Icon(Icons.Filled.Autorenew, contentDescription = null, tint = Theme.accent)
                    Text(
                        "La renovación la hace el estudio de forma manual a principio de mes. Recibirás un aviso cuando tu bono esté activo.",
                        fontSize = 12.sp, color = Theme.neutral400,
                    )
                }
                Spacer(Modifier.height(4.dp))
                Spacer(Modifier.height(16.dp))
                SectionHeading("Movimientos")
            }
            items(b.movimientos) { m -> MovimientoRow(m) }
        } else if (isLoading) {
            item { CircularProgressIndicator(color = Theme.accent, modifier = Modifier.padding(top = 40.dp)) }
        }
    }
}

@Composable
private fun MovimientoRow(m: Movimiento) {
    val positive = m.delta.startsWith("+")
    Column {
        Row(Modifier.padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(
                if (positive) Icons.Filled.AddCircle else Icons.Filled.RemoveCircle,
                contentDescription = null,
                tint = if (positive) Theme.accent else Theme.neutral500,
                modifier = Modifier.size(16.dp),
            )
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(m.titulo, fontSize = 13.sp, color = Theme.text)
                Text(m.fecha.take(10), fontSize = 11.sp, color = Theme.neutral500)
            }
            Text(m.delta, fontSize = 12.sp, color = if (positive) Theme.accent else Theme.neutral500)
        }
        Divider(color = Theme.divider, thickness = 1.dp)
    }
}
