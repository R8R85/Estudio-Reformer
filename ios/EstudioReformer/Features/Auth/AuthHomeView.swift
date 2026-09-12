import SwiftUI

@MainActor
struct AuthHomeView: View {
    private enum Tab { case login, register }
    @State private var tab: Tab = .login

    var body: some View {
        VStack(spacing: 0) {
            Image("logo-lockup")
                .resizable()
                .scaledToFit()
                .frame(maxWidth: 220, maxHeight: 200)
                .blendMode(.lighten)
                .padding(.top, 40)
                .padding(.bottom, 8)

            Picker("", selection: $tab) {
                Text("Iniciar sesión").tag(Tab.login)
                Text("Solicitar acceso").tag(Tab.register)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 24)
            .padding(.bottom, 16)

            ScrollView {
                switch tab {
                case .login: LoginView()
                case .register: RegisterView()
                }
            }
        }
    }
}
