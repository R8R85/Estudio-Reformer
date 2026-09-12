import SwiftUI

@MainActor
struct PendingRequestView: View {
    @EnvironmentObject var session: AppSession
    let user: PublicUser

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Circle()
                .stroke(Theme.accent, lineWidth: 1)
                .frame(width: 52, height: 52)
                .overlay(Image(systemName: "hourglass").foregroundStyle(Theme.accent))

            Text("Solicitud enviada").font(Theme.heading(20))
            Text("La administración del estudio tiene que aprobar tu acceso. Hasta entonces no podrás ver la agenda ni reservar.")
                .font(.system(size: 13))
                .foregroundStyle(Theme.neutral400)

            VStack(alignment: .leading, spacing: 4) {
                Text(user.name).font(.system(size: 13))
                Text("\(user.email) · \(user.phone)").font(.system(size: 11)).foregroundStyle(Theme.neutral500)
                Text("Enviada el \(user.createdAt.prefix(10)) · " + (user.experienciaPrevia ? "Con experiencia previa" : "Sin experiencia previa"))
                    .font(.system(size: 11)).foregroundStyle(Theme.neutral500)
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .cardBackground()

            Button("Cerrar sesión") { session.signOut() }
                .buttonStyle(StudioButtonStyle(kind: .secondary, block: true))

            Spacer()
        }
        .padding(24)
    }
}

@MainActor
struct RejectedRequestView: View {
    @EnvironmentObject var session: AppSession

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Circle()
                .stroke(Theme.neutral700, lineWidth: 1)
                .frame(width: 52, height: 52)
                .overlay(Image(systemName: "xmark").foregroundStyle(Theme.neutral500))

            Text("Solicitud no aprobada").font(Theme.heading(20))
            Text("El estudio no ha podido darte acceso ahora mismo. Puedes escribir a hola@estudioreformer.es para saber más.")
                .font(.system(size: 13))
                .foregroundStyle(Theme.neutral400)

            Button("Cerrar sesión") { session.signOut() }
                .buttonStyle(StudioButtonStyle(kind: .secondary, block: true))

            Spacer()
        }
        .padding(24)
    }
}
