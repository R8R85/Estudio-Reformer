package es.estudioreformer.app.ui.member

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.weight
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.ConfirmationNumber
import androidx.compose.material.icons.filled.FactCheck
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import es.estudioreformer.app.ui.LocalSession
import es.estudioreformer.app.ui.theme.Theme
import es.estudioreformer.app.ui.theme.StudioHeader
import es.estudioreformer.app.ui.theme.ToastHost
import es.estudioreformer.app.ui.theme.initials
import es.estudioreformer.app.ui.theme.rememberToastState

@Composable
fun MemberRootScreen() {
    val session = LocalSession.current
    var tab by remember { mutableIntStateOf(0) }
    val toast = rememberToastState()

    ToastHost(toast) {
        Column(Modifier.fillMaxSize()) {
            StudioHeader(subtitle = "Enguera · Valencia", avatarText = initials(session.user?.name ?: ""))

            Column(Modifier.weight(1f)) {
                when (tab) {
                    0 -> AgendaScreen(toast = toast, goToBono = { tab = 1 })
                    1 -> BonoScreen(toast = toast)
                    else -> ReservasScreen(toast = toast, goToAgenda = { tab = 0 })
                }
            }

            NavigationBar(containerColor = Theme.surface) {
                NavigationBarItem(
                    selected = tab == 0, onClick = { tab = 0 },
                    icon = { Icon(Icons.Filled.CalendarMonth, contentDescription = null) },
                    label = { Text("Agenda") },
                    colors = navColors(),
                )
                NavigationBarItem(
                    selected = tab == 1, onClick = { tab = 1 },
                    icon = { Icon(Icons.Filled.ConfirmationNumber, contentDescription = null) },
                    label = { Text("Mi bono") },
                    colors = navColors(),
                )
                NavigationBarItem(
                    selected = tab == 2, onClick = { tab = 2 },
                    icon = { Icon(Icons.Filled.FactCheck, contentDescription = null) },
                    label = { Text("Reservas") },
                    colors = navColors(),
                )
            }
        }
    }
}

@Composable
internal fun navColors() = NavigationBarItemDefaults.colors(
    selectedIconColor = Theme.accent,
    selectedTextColor = Theme.accent,
    unselectedIconColor = Theme.neutral500,
    unselectedTextColor = Theme.neutral500,
    indicatorColor = Theme.accent900,
)
