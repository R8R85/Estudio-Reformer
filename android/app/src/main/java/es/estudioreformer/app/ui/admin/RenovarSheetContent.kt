package es.estudioreformer.app.ui.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.estudioreformer.app.network.ApiException
import es.estudioreformer.app.ui.LocalSession
import es.estudioreformer.app.ui.theme.ButtonKind
import es.estudioreformer.app.ui.theme.StudioButton
import es.estudioreformer.app.ui.theme.Theme
import kotlinx.coroutines.launch

@Composable
fun RenovarSheetContent(numPendientes: Int, cicloSiguiente: String, onDismiss: () -> Unit, onDone: (String) -> Unit) {
    val session = LocalSession.current
    val scope = rememberCoroutineScope()
    var isSubmitting by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxWidth().padding(18.dp)) {
        Text("Renovar $numPendientes bonos", fontSize = 22.sp, fontWeight = FontWeight.Medium, color = Theme.text)
        Spacer(Modifier.height(6.dp))
        Text(
            "Se repondrán 8 sesiones a cada socio/a y el bono pasará al ciclo de $cicloSiguiente.",
            fontSize = 13.sp, color = Theme.neutral400,
        )
        Spacer(Modifier.height(18.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            StudioButton("Cancelar", onDismiss, kind = ButtonKind.Secondary, block = true, modifier = Modifier.weight(1f))
            StudioButton(
                "Renovar bonos",
                onClick = {
                    isSubmitting = true
                    scope.launch {
                        try {
                            val n = session.api.renewAllPending()
                            onDone("$n bonos renovados para $cicloSiguiente")
                        } catch (e: Exception) {
                            onDone((e as? ApiException)?.message ?: "No se pudo conectar con el servidor")
                        } finally {
                            isSubmitting = false
                        }
                    }
                },
                kind = ButtonKind.Primary, block = true, loading = isSubmitting, modifier = Modifier.weight(1f),
            )
        }
    }
}
