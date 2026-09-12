package es.estudioreformer.app.data

import android.app.Application
import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import es.estudioreformer.app.network.ApiClient
import es.estudioreformer.app.network.LoginBody
import es.estudioreformer.app.network.PublicUser
import es.estudioreformer.app.network.RegisterBody
import kotlinx.coroutines.launch

/** Root auth/session state — who's logged in, their approval status, and the
 * shared [ApiClient] every screen talks through. Token persistence here is
 * plain SharedPreferences for demo simplicity; swap for EncryptedSharedPreferences
 * or the Keystore before shipping. */
class AppSession(application: Application) : AndroidViewModel(application) {
    val api = ApiClient()

    var user by mutableStateOf<PublicUser?>(null)
        private set
    var isLoadingInitialAuth by mutableStateOf(true)
        private set

    private val prefs = application.getSharedPreferences("auth", Context.MODE_PRIVATE)

    init {
        api.token = prefs.getString("token", null)
        viewModelScope.launch {
            if (api.token != null) {
                try {
                    user = api.me().user
                } catch (e: Exception) {
                    signOut()
                }
            }
            isLoadingInitialAuth = false
        }
    }

    suspend fun register(
        name: String, email: String, phone: String, password: String,
        experienciaPrevia: Boolean, patologia: Boolean, patologiaTexto: String,
    ) {
        val res = api.register(RegisterBody(name, email, phone, password, experienciaPrevia, patologia, patologiaTexto))
        persist(res.token, res.user)
    }

    suspend fun login(email: String, password: String) {
        val res = api.login(LoginBody(email, password))
        persist(res.token, res.user)
    }

    suspend fun refreshMe() {
        if (api.token == null) return
        try { user = api.me().user } catch (e: Exception) { /* keep last known state */ }
    }

    fun signOut() {
        api.token = null
        user = null
        prefs.edit().remove("token").apply()
    }

    private fun persist(token: String, u: PublicUser) {
        api.token = token
        user = u
        prefs.edit().putString("token", token).apply()
    }
}
