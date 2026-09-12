import SwiftUI

@main
struct EstudioReformerApp: App {
    @StateObject private var session = AppSession()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(session)
                .preferredColorScheme(.dark)
                .tint(Theme.accent)
        }
    }
}
