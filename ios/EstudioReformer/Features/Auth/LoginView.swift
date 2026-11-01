import SwiftUI

@MainActor
struct LoginView: View {
    @EnvironmentObject var session: AppSession
    @State private var studioCode = UserDefaults.standard.string(forKey: "last_studio_code") ?? ""
    @State private var email = ""
    @State private var password = ""
    @State private var isSubmitting = false
    @State private var error: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            LabeledField(label: "Código de estudio") {
                TextField("ENGUERA", text: $studioCode)
                    .textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()
                    .foregroundStyle(Theme.text)
            }
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
            .buttonStyle(StudioButtonStyle(kind: .primary, block: true, disabled: studioCode.isEmpty || email.isEmpty || password.isEmpty))
            .disabled(studioCode.isEmpty || email.isEmpty || password.isEmpty || isSubmitting)
            .padding(.top, 4)

            Text("Cuentas de prueba: ENGUERA · admin@estudioreformer.es / admin123 · lucia.ferrer@correo.com / socia123")
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
        let code = studioCode.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        Task {
            defer { isSubmitting = false }
            do {
                try await session.login(studioCode: code, email: email, password: password)
                UserDefaults.standard.set(code, forKey: "last_studio_code")
            } catch {
                self.error = error.localizedDescription
            }
        }
    }
}
