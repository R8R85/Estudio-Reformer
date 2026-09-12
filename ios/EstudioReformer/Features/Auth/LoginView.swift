import SwiftUI

@MainActor
struct LoginView: View {
    @EnvironmentObject var session: AppSession
    @State private var email = ""
    @State private var password = ""
    @State private var isSubmitting = false
    @State private var error: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            LabeledField(label: "Email") {
                TextField("alba@correo.com", text: $email)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .foregroundStyle(Theme.text)
            }
            LabeledField(label: "Contraseña") {
                SecureField("••••••••", text: $password)
                    .foregroundStyle(Theme.text)
            }

            if let error {
                Text(error).font(.system(size: 12)).foregroundStyle(Theme.accent300)
            }

            Button {
                submit()
            } label: {
                if isSubmitting {
                    ProgressView().tint(Theme.accent)
                } else {
                    Text("Entrar")
                }
            }
            .buttonStyle(StudioButtonStyle(kind: .primary, block: true, disabled: email.isEmpty || password.isEmpty))
            .disabled(email.isEmpty || password.isEmpty || isSubmitting)
            .padding(.top, 4)

            Text("Cuentas de prueba: admin@estudioreformer.es / admin123 · lucia.ferrer@correo.com / socia123")
                .font(.system(size: 11))
                .foregroundStyle(Theme.neutral600)
                .padding(.top, 6)
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 40)
    }

    private func submit() {
        isSubmitting = true
        error = nil
        Task {
            defer { isSubmitting = false }
            do {
                try await session.login(email: email, password: password)
            } catch {
                self.error = error.localizedDescription
            }
        }
    }
}
