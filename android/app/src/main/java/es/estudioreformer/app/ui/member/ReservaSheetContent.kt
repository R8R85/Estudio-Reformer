package es.estudioreformer.app.ui.member

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ConfirmationNumber
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.estudioreformer.app.network.ApiException
import es.estudioreformer.app.network.SessionRow
import es.estudioreformer.app.ui.LocalSession
import es.estudioreformer.app.ui.theme.ButtonKind
import es.estudioreformer.app.ui.theme.StudioButton
import es.estudioreformer.app.ui.theme.Theme
import kotlinx.coroutines.launch

private enum class ReservaAction { CANCEL, LEAVE_WAITLIST, JOIN_WAITLIST, BOOK }

/** The prototype's "hojaReserva" bottom sheet — book / cancel / join or
 * leave the waitlist for one session, depending on the member's current
 * relationship to it. */
@Composable
fun ReservaSheetContent(row: SessionRow, onDismiss: () -> Unit, onDone: (String) -> Unit) {
    val session = LocalSession.current
    val scope = rememberCoroutineScope()
    var isSubmitting by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val action = when {
        row.mine -> ReservaAction.CANCEL
        row.waitlisted -> ReservaAction.LEAVE_WAITLIST
        row.full -> ReservaAction.JOIN_WAITLIST
        else -> ReservaAction.BOOK
    }
    val primaryLabel = when (action) {
        ReservaAction.CANCEL -> "Cancelar reserva"
        ReservaAction.LEAVE_WAITLIST -> "Salir de la lista de espera"
        ReservaAction.JOIN_WAITLIST -> "Apuntarme a la lista de espera"
        ReservaAction.BOOK -> "Reservar sesión"
    }
    val note = when (action) {
        ReservaAction.CANCEL -> "Puedes cancelar hasta 6 h antes: la sesión vuelve a tu bono y la plaza se ofrece a la lista de espera. Con menos de 6 h ya no se puede cancelar."
        ReservaAction.LEAVE_WAITLIST -> "Estás en el puesto ${row.waitlistPosition ?: 0} de la lista. Si queda una plaza libre te llegará un aviso en la app y un WhatsApp para ocuparla."
        ReservaAction.JOIN_WAITLIST -> "Sesión completa. Apuntándote a la lista de espera te avisamos por la app y por WhatsApp en cuanto alguien cancele. No se descuenta ninguna sesión hasta que ocupes la plaza."
        ReservaAction.BOOK -> "Se descontará 1 sesión de tu bono."
    }

    Column(Modifier.fillMaxWidth().padding(18.dp)) {
        Text("${row.time} · ${row.className}", fontSize = 22.sp, fontWeight = FontWeight.Medium, color = Theme.text)
        Text("${row.coachName} · ${row.plazasTxt}", fontSize = 13.sp, color = Theme.neutral400)
        Spacer(Modifier.height(16.dp))
        Row(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(Theme.radiusMd))
                .background(Theme.bg)
                .padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Icon(Icons.Filled.ConfirmationNumber, contentDescription = null, tint = Theme.accent)
            Text(note, fontSize = 12.sp, color = Theme.neutral400)
        }

        error?.let {
            Spacer(Modifier.height(12.dp))
            Text(it, fontSize = 12.sp, color = Theme.accent300)
        }

        Spacer(Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            StudioButton("Volver", onDismiss, kind = ButtonKind.Secondary, block = true, modifier = Modifier.weight(1f))
            StudioButton(
                primaryLabel,
                onClick = {
                    isSubmitting = true
                    error = null
                    scope.launch {
                        try {
                            val message = when (action) {
                                ReservaAction.CANCEL -> {
                                    session.api.cancelBooking(row.bookingId ?: return@launch)
                                    "Reserva cancelada · sesión devuelta al bono"
                                }
                                ReservaAction.LEAVE_WAITLIST -> {
                                    session.api.leaveWaitlist(row.waitlistEntryId ?: return@launch)
                                    "Has salido de la lista de espera"
                                }
                                ReservaAction.JOIN_WAITLIST -> {
                                    val res = session.api.joinWaitlist(row.id)
                                    "En lista de espera · puesto ${res.position} · te avisaremos por app y WhatsApp"
                                }
                                ReservaAction.BOOK -> {
                                    session.api.book(row.id)
                                    "Sesión reservada · ${row.time}"
                                }
                            }
                            onDone(message)
                        } catch (e: ApiException) {
                            error = e.message
                        } catch (e: Exception) {
                            error = "No se pudo conectar con el servidor"
                        } finally {
                            isSubmitting = false
                        }
                    }
                },
                kind = ButtonKind.Primary,
                block = true,
                loading = isSubmitting,
                modifier = Modifier.weight(1f),
            )
        }
    }
}
