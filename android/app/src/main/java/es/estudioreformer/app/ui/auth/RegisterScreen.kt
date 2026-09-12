package es.estudioreformer.app.ui.auth

import androidx.compose.foundation.layout.Column
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.estudioreformer.app.network.ApiException
import es.estudioreformer.app.ui.LocalSession
import es.estudioreformer.app.ui.theme.ButtonKind
import es.estudioreformer.app.ui.theme.LabeledField
import es.estudioreformer.app.ui.theme.StudioButton
import es.estudioreformer.app.ui.theme.Theme
import es.estudioreformer.app.ui.theme.YesNoSegment
import kotlinx.coroutines.launch

/** The "Alta nuevo/a usuario/a" form — same fields and copy as the
 * prototype's `scAlta` / `altaForm` state, wired to `POST /auth/register`. */
@Composable
fun RegisterScreen() {
    val session = LocalSession.current
    val scope = rememberCoroutineScope()

    var nombre by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var tel by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var experienciaPrevia by remember { mutableStateOf(false) }
    var patologia by remember { mutableStateOf(false) }
    var patologiaTexto by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val incompleto = nombre.isEmpty() || email.isEmpty() || tel.isEmpty() || password.length < 6

    Column(Modifier.fillMaxWidth().padding(horizontal = 24.dp).padding(bottom = 40.dp)) {
        Text("Solicitar acceso", style = Theme.heading(20), color = Theme.text)
        Spacer(Modifier.height(6.dp))
        Text(
            "El estudio revisa cada alta antes de abrir el acceso a la agenda. Te avisaremos en cuanto esté aprobada.",
            fontSize = 12.5.sp, color = Theme.neutral500,
        )
        Spacer(Modifier.height(14.dp))

        LabeledField(label = "Nombre y apellidos", value = nombre, onValueChange = { nombre = it }, placeholder = "Alba Marí")
        Spacer(Modifier.height(10.dp))
        LabeledField(label = "Email", value = email, onValueChange = { email = it }, placeholder = "alba@correo.com", keyboardType = KeyboardType.Email)
        Spacer(Modifier.height(10.dp))
        LabeledField(
            label = "Teléfono", value = tel, onValueChange = { tel = it }, placeholder = "600 000 000",
            keyboardType = KeyboardType.Phone,
            note = "Te enviaremos a este número el recordatorio de cada sesión por WhatsApp.",
        )
        Spacer(Modifier.height(10.dp))
        LabeledField(label = "Contraseña", value = password, onValueChange = { password = it }, placeholder = "Al menos 6 caracteres", isPassword = true)
        Spacer(Modifier.height(14.dp))

        Text("¿Has hecho reformer antes?", fontSize = 12.sp, color = Theme.neutral500)
        Spacer(Modifier.height(6.dp))
        YesNoSegment(experienciaPrevia, { experienciaPrevia = it })
        Spacer(Modifier.height(14.dp))

        Text("¿Tienes alguna patología que limite tu actividad física?", fontSize = 12.sp, color = Theme.neutral500)
        Spacer(Modifier.height(6.dp))
        YesNoSegment(patologia, { patologia = it; if (!it) patologiaTexto = "" })

        if (patologia) {
            Spacer(Modifier.height(14.dp))
            LabeledField(
                label = "Cuéntame qué limitación tienes", value = patologiaTexto, onValueChange = { patologiaTexto = it },
                placeholder = "Lesión, dolor o indicación médica a tener en cuenta", singleLine = false, minLines = 3,
            )
        }

        error?.let {
            Spacer(Modifier.height(14.dp))
            Text(it, fontSize = 12.sp, color = Theme.accent300)
        }

        Spacer(Modifier.height(16.dp))
        StudioButton(
            text = "Enviar solicitud",
            onClick = {
                isSubmitting = true
                error = null
                scope.launch {
                    try {
                        session.register(nombre, email, tel, password, experienciaPrevia, patologia, patologiaTexto)
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
            enabled = !incompleto,
            loading = isSubmitting,
        )
    }
}
