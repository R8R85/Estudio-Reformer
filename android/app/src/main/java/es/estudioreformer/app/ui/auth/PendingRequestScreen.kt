package es.estudioreformer.app.ui.auth

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.HourglassEmpty
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.estudioreformer.app.network.PublicUser
import es.estudioreformer.app.ui.LocalSession
import es.estudioreformer.app.ui.theme.ButtonKind
import es.estudioreformer.app.ui.theme.CardSurface
import es.estudioreformer.app.ui.theme.StudioButton
import es.estudioreformer.app.ui.theme.Theme

@Composable
fun PendingRequestScreen(user: PublicUser) {
    val session = LocalSession.current
    Column(Modifier.fillMaxSize().padding(24.dp)) {
        Box52 { Icon(Icons.Filled.HourglassEmpty, contentDescription = null, tint = Theme.accent) }
        Spacer(Modifier.height(16.dp))
        Text("Solicitud enviada", style = Theme.heading(20), color = Theme.text)
        Spacer(Modifier.height(8.dp))
        Text(
            "La administración del estudio tiene que aprobar tu acceso. Hasta entonces no podrás ver la agenda ni reservar.",
            fontSize = 13.sp, color = Theme.neutral400,
        )
        Spacer(Modifier.height(16.dp))
        CardSurface(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(12.dp)) {
                Text(user.name, fontSize = 13.sp, color = Theme.text)
                Text("${user.email} · ${user.phone}", fontSize = 11.sp, color = Theme.neutral500)
                Text(
                    "Enviada el ${user.createdAt.take(10)} · " + (if (user.experienciaPrevia) "Con experiencia previa" else "Sin experiencia previa"),
                    fontSize = 11.sp, color = Theme.neutral500,
                )
            }
        }
        Spacer(Modifier.height(16.dp))
        StudioButton(text = "Cerrar sesión", onClick = { session.signOut() }, kind = ButtonKind.Secondary, block = true)
    }
}

@Composable
fun RejectedRequestScreen() {
    val session = LocalSession.current
    Column(Modifier.fillMaxSize().padding(24.dp)) {
        Box52(borderColor = Theme.neutral700) { Icon(Icons.Filled.Close, contentDescription = null, tint = Theme.neutral500) }
        Spacer(Modifier.height(16.dp))
        Text("Solicitud no aprobada", style = Theme.heading(20), color = Theme.text)
        Spacer(Modifier.height(8.dp))
        Text(
            "El estudio no ha podido darte acceso ahora mismo. Puedes escribir a hola@estudioreformer.es para saber más.",
            fontSize = 13.sp, color = Theme.neutral400,
        )
        Spacer(Modifier.height(16.dp))
        StudioButton(text = "Cerrar sesión", onClick = { session.signOut() }, kind = ButtonKind.Secondary, block = true)
    }
}

@Composable
private fun Box52(borderColor: androidx.compose.ui.graphics.Color = Theme.accent, content: @Composable () -> Unit) {
    androidx.compose.foundation.layout.Box(
        Modifier.size(52.dp).border(1.dp, borderColor, CircleShape),
        contentAlignment = Alignment.Center,
    ) { content() }
}
