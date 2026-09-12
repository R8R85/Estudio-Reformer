package es.estudioreformer.app.ui.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import es.estudioreformer.app.R

private enum class AuthTab { LOGIN, REGISTER }

@Composable
fun AuthHomeScreen() {
    var tab by remember { mutableStateOf(AuthTab.LOGIN) }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(top = 40.dp),
    ) {
        Image(
            painter = painterResource(R.drawable.logo_lockup),
            contentDescription = "Estudio Reformer",
            modifier = Modifier
                .fillMaxWidth()
                .sizeIn(maxHeight = 200.dp)
                .padding(bottom = 8.dp),
            contentScale = ContentScale.Fit,
        )

        SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 16.dp)) {
            SegmentedButton(
                selected = tab == AuthTab.LOGIN,
                onClick = { tab = AuthTab.LOGIN },
                shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2),
            ) { Text("Iniciar sesión") }
            SegmentedButton(
                selected = tab == AuthTab.REGISTER,
                onClick = { tab = AuthTab.REGISTER },
                shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2),
            ) { Text("Solicitar acceso") }
        }

        when (tab) {
            AuthTab.LOGIN -> LoginScreen()
            AuthTab.REGISTER -> RegisterScreen()
        }
    }
}
