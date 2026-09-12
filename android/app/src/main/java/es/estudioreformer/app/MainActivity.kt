package es.estudioreformer.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.viewmodel.compose.viewModel
import es.estudioreformer.app.data.AppSession
import es.estudioreformer.app.network.AppConfig
import es.estudioreformer.app.ui.RootScreen
import es.estudioreformer.app.ui.theme.EstudioReformerTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        AppConfig.init(applicationContext)
        enableEdgeToEdge()
        setContent {
            EstudioReformerTheme {
                val session: AppSession = viewModel()
                RootScreen(session)
            }
        }
    }
}
