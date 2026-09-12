import SwiftUI

/// The prototype's "hojaReserva" bottom sheet — book / cancel / join or
/// leave the waitlist for one session, depending on the member's current
/// relationship to it.
@MainActor
struct ReservaSheetView: View {
    @EnvironmentObject var session: AppSession
    @Environment(\.dismiss) private var dismiss
    let row: SessionRow
    let onDone: (String) -> Void

    @State private var isSubmitting = false
    @State private var error: String?

    private enum Action { case cancel, leaveWaitlist, joinWaitlist, book }
    private var action: Action {
        if row.mine { return .cancel }
        if row.waitlisted { return .leaveWaitlist }
        if row.full { return .joinWaitlist }
        return .book
    }
    private var primaryLabel: String {
        switch action {
        case .cancel: return "Cancelar reserva"
        case .leaveWaitlist: return "Salir de la lista de espera"
        case .joinWaitlist: return "Apuntarme a la lista de espera"
        case .book: return "Reservar sesión"
        }
    }
    private var note: String {
        switch action {
        case .cancel: return "Puedes cancelar hasta 6 h antes: la sesión vuelve a tu bono y la plaza se ofrece a la lista de espera. Con menos de 6 h ya no se puede cancelar."
        case .leaveWaitlist: return "Estás en el puesto \(row.waitlistPosition ?? 0) de la lista. Si queda una plaza libre te llegará un aviso en la app y un WhatsApp para ocuparla."
        case .joinWaitlist: return "Sesión completa. Apuntándote a la lista de espera te avisamos por la app y por WhatsApp en cuanto alguien cancele. No se descuenta ninguna sesión hasta que ocupes la plaza."
        case .book: return "Se descontará 1 sesión de tu bono."
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Capsule().fill(Theme.neutral700).frame(width: 36, height: 4).frame(maxWidth: .infinity)

            Text(row.time + " · " + row.className).font(.system(size: 22, weight: .medium))
            Text("\(row.coachName) · \(row.plazasTxt)").font(.system(size: 13)).foregroundStyle(Theme.neutral400)

            HStack(alignment: .top, spacing: 10) {
                Image(systemName: "ticket").foregroundStyle(Theme.accent)
                Text(note).font(.system(size: 12)).foregroundStyle(Theme.neutral400)
            }
            .padding(12)
            .background(Theme.bg)
            .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous))

            if let error {
                Text(error).font(.system(size: 12)).foregroundStyle(Theme.accent300)
            }

            HStack(spacing: 8) {
                Button("Volver") { dismiss() }.buttonStyle(StudioButtonStyle(kind: .secondary, block: true))
                Button {
                    Task { await submit() }
                } label: {
                    if isSubmitting { ProgressView().tint(Theme.accent) } else { Text(primaryLabel) }
                }
                .buttonStyle(StudioButtonStyle(kind: .primary, block: true))
                .disabled(isSubmitting)
            }
        }
        .padding(18)
        .background(Theme.surface)
        .presentationDetents([.medium])
        .presentationDragIndicator(.hidden)
    }

    private func submit() async {
        isSubmitting = true
        error = nil
        defer { isSubmitting = false }
        do {
            switch action {
            case .cancel:
                guard let id = row.bookingId else { return }
                _ = try await session.api.cancelBooking(bookingId: id)
                onDone("Reserva cancelada · sesión devuelta al bono")
            case .leaveWaitlist:
                guard let id = row.waitlistEntryId else { return }
                _ = try await session.api.leaveWaitlist(entryId: id)
                onDone("Has salido de la lista de espera")
            case .joinWaitlist:
                let res = try await session.api.joinWaitlist(sessionId: row.id)
                onDone("En lista de espera · puesto \(res.position) · te avisaremos por app y WhatsApp")
            case .book:
                _ = try await session.api.book(sessionId: row.id)
                onDone("Sesión reservada · \(row.time)")
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}
