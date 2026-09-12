package es.estudioreformer.app.ui.admin

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.weight
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Autorenew
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import es.estudioreformer.app.ui.member.navColors
import es.estudioreformer.app.ui.theme.StudioHeader
import es.estudioreformer.app.ui.theme.Theme
import es.estudioreformer.app.ui.theme.ToastHost
import es.estudioreformer.app.ui.theme.rememberToastState

@Composable
fun AdminRootScreen() {
    var tab by remember { mutableIntStateOf(0) }
    val toast = rememberToastState()

    ToastHost(toast) {
        Column(Modifier.fillMaxSize()) {
            StudioHeader(subtitle = "Panel de administración", avatarText = "AD")

            Column(Modifier.weight(1f)) {
                when (tab) {
                    0 -> AdminAgendaScreen(toast = toast)
                    1 -> AdminSociosScreen(toast = toast)
                    else -> AdminBonosScreen(toast = toast)
                }
            }

            NavigationBar(containerColor = Theme.surface) {
                NavigationBarItem(
                    selected = tab == 0, onClick = { tab = 0 },
                    icon = { Icon(Icons.Filled.CalendarMonth, contentDescription = null) },
                    label = { Text("Agenda") }, colors = navColors(),
                )
                NavigationBarItem(
                    selected = tab == 1, onClick = { tab = 1 },
                    icon = { Icon(Icons.Filled.Groups, contentDescription = null) },
                    label = { Text("Socios/as") }, colors = navColors(),
                )
                NavigationBarItem(
                    selected = tab == 2, onClick = { tab = 2 },
                    icon = { Icon(Icons.Filled.Autorenew, contentDescription = null) },
                    label = { Text("Bonos") }, colors = navColors(),
                )
            }
        }
    }
}
