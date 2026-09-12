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
import kotlinx.coroutines.launch

@Composable
fun LoginScreen() {
    val session = LocalSession.current
    val scope = rememberCoroutineScope()
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    Column(
        Modifier.fillMaxWidth().padding(horizontal = 24.dp).padding(bottom = 40.dp),
    ) {
        LabeledField(label = "Email", value = email, onValueChange = { email = it }, placeholder = "alba@correo.com", keyboardType = KeyboardType.Email)
        Spacer(Modifier.height(14.dp))
        LabeledField(label = "Contraseña", value = password, onValueChange = { password = it }, placeholder = "••••••••", isPassword = true)

        error?.let {
            Spacer(Modifier.height(14.dp))
            Text(it, fontSize = 12.sp, color = Theme.accent300)
        }

        Spacer(Modifier.height(14.dp))
        StudioButton(
            text = "Entrar",
            onClick = {
                isSubmitting = true
                error = null
                scope.launch {
                    try {
                        session.login(email, password)
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
            enabled = email.isNotEmpty() && password.isNotEmpty(),
            loading = isSubmitting,
        )

        Spacer(Modifier.height(14.dp))
        Text(
            "Cuentas de prueba: admin@estudioreformer.es / admin123 · lucia.ferrer@correo.com / socia123",
            fontSize = 11.sp, color = Theme.neutral600,
        )
    }
}
