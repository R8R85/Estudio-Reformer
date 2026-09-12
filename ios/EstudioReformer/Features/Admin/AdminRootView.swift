import SwiftUI

@MainActor
struct AdminRootView: View {
    @EnvironmentObject var session: AppSession

    var body: some View {
        ToastHost { toast in
            VStack(spacing: 0) {
                StudioHeader(subtitle: "Panel de administración", avatarText: "AD")
                TabView {
                    AdminAgendaView(toast: toast)
                        .tabItem { Label("Agenda", systemImage: "calendar") }
                    AdminSociosView(toast: toast)
                        .tabItem { Label("Socios/as", systemImage: "person.3") }
                    AdminBonosView(toast: toast)
                        .tabItem { Label("Bonos", systemImage: "arrow.triangle.2.circlepath") }
                }
            }
        }
    }
}
