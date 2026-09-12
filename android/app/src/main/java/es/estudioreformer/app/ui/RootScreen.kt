package es.estudioreformer.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import es.estudioreformer.app.data.AppSession
import es.estudioreformer.app.ui.admin.AdminRootScreen
import es.estudioreformer.app.ui.auth.AuthHomeScreen
import es.estudioreformer.app.ui.auth.PendingRequestScreen
import es.estudioreformer.app.ui.auth.RejectedRequestScreen
import es.estudioreformer.app.ui.member.MemberRootScreen
import es.estudioreformer.app.ui.theme.Theme

/** Top-level router: not logged in -> auth/alta flow; logged in but not yet
 * approved -> pending/rejected screen; approved -> the member or admin app,
 * chosen by the account's own role (there's no in-app role switcher in the
 * real app — that was a prototype-only affordance for demoing both
 * perspectives side by side). */
@Composable
fun RootScreen(session: AppSession) {
    CompositionLocalProvider(LocalSession provides session) {
        Box(Modifier.fillMaxSize().background(Theme.bg), contentAlignment = Alignment.Center) {
            when {
                session.isLoadingInitialAuth -> CircularProgressIndicator(color = Theme.accent)
                session.user == null -> AuthHomeScreen()
                session.user!!.status == "PENDING" -> PendingRequestScreen(session.user!!)
                session.user!!.status == "REJECTED" -> RejectedRequestScreen()
                session.user!!.isAdmin -> AdminRootScreen()
                else -> MemberRootScreen()
            }
        }
    }
}
