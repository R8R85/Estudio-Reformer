package es.estudioreformer.app.ui

import androidx.compose.runtime.staticCompositionLocalOf
import es.estudioreformer.app.data.AppSession

/** Threads the single [AppSession] down the tree without re-passing it as a
 * parameter through every screen — the Compose analogue of SwiftUI's
 * `@EnvironmentObject`. Provided once in [RootScreen]. */
val LocalSession = staticCompositionLocalOf<AppSession> {
    error("LocalSession not provided — wrap content in CompositionLocalProvider(LocalSession provides session)")
}
