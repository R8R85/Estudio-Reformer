import SwiftUI

@MainActor
struct RenovarSheetView: View {
    @EnvironmentObject var session: AppSession
    @Environment(\.dismiss) private var dismiss
    let numPendientes: Int
    let cicloSiguiente: String
    let onDone: (String?) -> Void

    @State private var isSubmitting = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Capsule().fill(Theme.neutral700).frame(width: 36, height: 4).frame(maxWidth: .infinity)

            Text("Renovar \(numPendientes) bonos").font(.system(size: 22, weight: .medium))
            Text("Se repondrán 8 sesiones a cada socio/a y el bono pasará al ciclo de \(cicloSiguiente).")
                .font(.system(size: 13)).foregroundStyle(Theme.neutral400)

            HStack(spacing: 8) {
                Button("Cancelar") { dismiss() }.buttonStyle(StudioButtonStyle(kind: .secondary, block: true))
                Button {
                    Task { await confirm() }
                } label: {
                    if isSubmitting { ProgressView().tint(Theme.accent) } else { Text("Renovar bonos") }
                }
                .buttonStyle(StudioButtonStyle(kind: .primary, block: true))
                .disabled(isSubmitting)
            }
        }
        .padding(18)
        .background(Theme.surface)
        .presentationDetents([.height(220)])
        .presentationDragIndicator(.hidden)
    }

    private func confirm() async {
        isSubmitting = true
        defer { isSubmitting = false }
        do {
            let n = try await session.api.renewAllPending()
            onDone("\(n) bonos renovados para \(cicloSiguiente)")
        } catch { onDone(error.localizedDescription) }
    }
}
