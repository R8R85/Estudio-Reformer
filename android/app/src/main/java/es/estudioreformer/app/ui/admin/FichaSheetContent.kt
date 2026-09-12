package es.estudioreformer.app.ui.admin

import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.MonitorHeart
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.estudioreformer.app.network.ApiException
import es.estudioreformer.app.network.BonoHistoryEntry
import es.estudioreformer.app.network.MemberFicha
import es.estudioreformer.app.ui.LocalSession
import es.estudioreformer.app.ui.theme.ButtonKind
import es.estudioreformer.app.ui.theme.StudioButton
import es.estudioreformer.app.ui.theme.StudioTag
import es.estudioreformer.app.ui.theme.TagStyle
import es.estudioreformer.app.ui.theme.Theme

/** The prototype's "hojaFicha" sheet — a member's full profile: contact
 * info, the access-request questionnaire answers, and their bono history
 * (grouped by renewal, with every session enjoyed under it). */
@Composable
fun FichaSheetContent(memberId: String, onDismiss: () -> Unit, onError: (String) -> Unit) {
    val session = LocalSession.current
    var ficha by remember { mutableStateOf<MemberFicha?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(memberId) {
        try { ficha = session.api.memberFicha(memberId) }
        catch (e: Exception) { onError((e as? ApiException)?.message ?: "Error") }
        isLoading = false
    }

    Column(Modifier.fillMaxWidth().padding(18.dp)) {
        val f = ficha
        if (f != null) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                androidx.compose.foundation.layout.Box(
                    Modifier.size(38.dp).clip(CircleShape).background(Theme.neutral800),
                    contentAlignment = Alignment.Center,
                ) { Text(f.iniciales, fontSize = 13.sp, color = Theme.text) }
                Spacer(Modifier.width(11.dp))
                Column(Modifier.weight(1f)) {
                    Text(f.nombre, fontSize = 18.sp, fontWeight = FontWeight.Medium, color = Theme.text)
                    Text(f.alta, fontSize = 11.sp, color = Theme.neutral500)
                }
                StudioTag(f.estadoBono, TagStyle.Outline)
            }
            Spacer(Modifier.height(14.dp))

            LazyColumn(Modifier.heightIn(max = 320.dp)) {
                item {
                    InfoRow(Icons.Filled.Email, f.email)
                    InfoRow(Icons.Filled.Phone, f.tel)
                    InfoRow(Icons.Filled.FitnessCenter, f.experiencia)
                    Row(Modifier.fillMaxWidth().padding(vertical = 9.dp)) {
                        Icon(Icons.Filled.MonitorHeart, contentDescription = null, tint = Theme.neutral500, modifier = Modifier.size(15.dp).padding(top = 2.dp))
                        Spacer(Modifier.width(9.dp))
                        Column {
                            Text(f.patologia, fontSize = 13.sp, color = Theme.text)
                            if (f.hayLimitacion) {
                                Text(f.limitacion, fontSize = 12.sp, color = Theme.accent300)
                            }
                        }
                    }
                    Divider(color = Theme.divider, thickness = 1.dp)
                    Spacer(Modifier.height(12.dp))
                    Text(f.resumen, fontSize = 12.sp, color = Theme.neutral400)
                    Spacer(Modifier.height(10.dp))
                }
                items(f.bonos) { b -> BonoHistoryCard(b) }
            }

            Spacer(Modifier.height(8.dp))
            StudioButton("Cerrar", onDismiss, kind = ButtonKind.Secondary, block = true)
        } else if (isLoading) {
            CircularProgressIndicator(color = Theme.accent, modifier = Modifier.padding(vertical = 40.dp))
        }
    }
}

@Composable
private fun InfoRow(icon: androidx.compose.ui.graphics.vector.ImageVector, text: String) {
    Column {
        Row(Modifier.fillMaxWidth().padding(vertical = 9.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, contentDescription = null, tint = Theme.neutral500, modifier = Modifier.size(15.dp))
            Spacer(Modifier.width(9.dp))
            Text(text, fontSize = 13.sp, color = Theme.text)
        }
        Divider(color = Theme.divider, thickness = 1.dp)
    }
}

@Composable
private fun BonoHistoryCard(b: BonoHistoryEntry) {
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(Theme.radiusMd))
            .background(Theme.bg)
            .padding(11.dp)
            .padding(bottom = 4.dp),
    ) {
        Row(verticalAlignment = Alignment.Bottom) {
            Text(b.mes, fontSize = 13.sp, color = Theme.text, modifier = Modifier.weight(1f))
            Text(b.resumen, fontSize = 11.sp, color = Theme.neutral500)
        }
        Spacer(Modifier.height(6.dp))
        if (b.vacio) {
            Text("Sin sesiones disfrutadas todavía", fontSize = 11.sp, color = Theme.neutral600)
        } else {
            b.sesiones.forEach { s ->
                Row(Modifier.padding(vertical = 5.dp)) {
                    Text(s.fecha, fontSize = 12.sp, color = Theme.neutral400, modifier = Modifier.width(86.dp))
                    Text(s.clase, fontSize = 12.sp, color = Theme.neutral400)
                }
            }
        }
    }
    Spacer(Modifier.height(8.dp))
}
