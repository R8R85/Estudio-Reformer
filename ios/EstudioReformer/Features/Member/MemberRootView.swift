import SwiftUI

@MainActor
struct MemberRootView: View {
    @EnvironmentObject var session: AppSession
    @State private var tab = 0

    var body: some View {
        ToastHost { toast in
            VStack(spacing: 0) {
                StudioHeader(subtitle: "Enguera · Valencia", avatarText: initials(session.user?.name ?? ""))
                TabView(selection: $tab) {
                    AgendaView(toast: toast, goToBono: { tab = 1 })
                        .tabItem { Label("Agenda", systemImage: "calendar") }
                        .tag(0)
                    BonoView(toast: toast)
                        .tabItem { Label("Mi bono", systemImage: "ticket") }
                        .tag(1)
                    ReservasView(toast: toast, goToAgenda: { tab = 0 })
                        .tabItem { Label("Reservas", systemImage: "checklist") }
                        .tag(2)
                }
            }
        }
    }
}
