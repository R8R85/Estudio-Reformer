import SwiftUI

/// The "Alta nuevo/a usuario/a" form — same fields and copy as the
/// prototype's `scAlta` / `altaForm` state, wired to `POST /auth/register`.
@MainActor
struct RegisterView: View {
    @EnvironmentObject var session: AppSession

    @State private var nombre = ""
    @State private var email = ""
    @State private var tel = ""
    @State private var password = ""
    @State private var experienciaPrevia = false
    @State private var patologia = false
    @State private var patologiaTexto = ""
    @State private var isSubmitting = false
    @State private var error: String?

    private var incompleto: Bool {
        nombre.isEmpty || email.isEmpty || tel.isEmpty || password.count < 6
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Solicitar acceso")
                .font(Theme.heading(20))
            Text("El estudio revisa cada alta antes de abrir el acceso a la agenda. Te avisaremos en cuanto esté aprobada.")
                .font(.system(size: 12.5))
                .foregroundStyle(Theme.neutral500)

            LabeledField(label: "Nombre y apellidos") {
                TextField("Alba Marí", text: $nombre).foregroundStyle(Theme.text)
            }
            LabeledField(label: "Email") {
                TextField("alba@correo.com", text: $email)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .foregroundStyle(Theme.text)
            }
            LabeledField(
                label: "Teléfono",
                note: "Te enviaremos a este número el recordatorio de cada sesión por WhatsApp."
            ) {
                TextField("600 000 000", text: $tel)
                    .keyboardType(.phonePad)
                    .foregroundStyle(Theme.text)
            }
            LabeledField(label: "Contraseña") {
                SecureField("Al menos 6 caracteres", text: $password).foregroundStyle(Theme.text)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("¿Has hecho reformer antes?").font(.system(size: 12)).foregroundStyle(Theme.neutral500)
                YesNoSegment(value: $experienciaPrevia)
            }
            VStack(alignment: .leading, spacing: 6) {
                Text("¿Tienes alguna patología que limite tu actividad física?")
                    .font(.system(size: 12)).foregroundStyle(Theme.neutral500)
                YesNoSegment(value: $patologia)
            }
            if patologia {
                LabeledField(label: "Cuéntame qué limitación tienes") {
                    TextEditor(text: $patologiaTexto)
                        .frame(minHeight: 70)
                        .foregroundStyle(Theme.text)
                        .scrollContentBackground(.hidden)
                }
            }

            if let error {
                Text(error).font(.system(size: 12)).foregroundStyle(Theme.accent300)
            }

            Button {
                submit()
            } label: {
                if isSubmitting { ProgressView().tint(Theme.accent) } else { Text("Enviar solicitud") }
            }
            .buttonStyle(StudioButtonStyle(kind: .primary, block: true, disabled: incompleto))
            .disabled(incompleto || isSubmitting)
            .padding(.top, 4)
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
                try await session.register(
                    name: nombre, email: email, phone: tel, password: password,
                    experienciaPrevia: experienciaPrevia, patologia: patologia,
                    patologiaTexto: patologiaTexto
                )
            } catch {
                self.error = error.localizedDescription
            }
        }
    }
}
