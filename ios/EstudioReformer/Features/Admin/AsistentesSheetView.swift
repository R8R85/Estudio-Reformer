import SwiftUI

/// The prototype's "hojaAsistentes" sheet — real names + a "Liberar" action
/// per attendee (admin-initiated cancellation, bypassing the member's 6h
/// cutoff), plus a shortcut into editing the franja itself.
@MainActor
struct AsistentesSheetView: View {
    @EnvironmentObject var session: AppSession
    @Environment(\.dismiss) private var dismiss
    let sessionId: String
    /// (toast message if something changed, template to open for editing)
    let onDone: (String?, ClassTemplate?) -> Void

    @State private var data: AttendeesResponse?
    @State private var isLoading = true

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Capsule().fill(Theme.neutral700).frame(width: 36, height: 4).frame(maxWidth: .infinity)

            if let data {
                Text("\(data.session.date) · \(data.session.time) · \(data.session.className)")
                    .font(.system(size: 20, weight: .medium))
                Text("\(data.session.coachName) · \(data.attendees.count) de \(data.session.capacity) plazas ocupadas")
                    .font(.system(size: 13)).foregroundStyle(Theme.neutral400)

                ScrollView {
                    VStack(spacing: 0) {
                        ForEach(data.attendees) { a in
                            HStack(spacing: 10) {
                                Circle().fill(Theme.neutral800).frame(width: 26, height: 26)
                                    .overlay(Text(a.iniciales).font(.system(size: 11)))
                                Text(a.nombre).font(.system(size: 13))
                                Spacer()
                                Text(a.bonoTxt).font(.system(size: 11)).foregroundStyle(Theme.neutral500)
                                Button("Liberar") { Task { await release(a) } }
                                    .buttonStyle(StudioButtonStyle(kind: .ghost))
                            }
                            .padding(.vertical, 9)
                            Divider().background(Theme.divider)
                        }
                        if !data.espera.isEmpty {
                            ForEach(data.espera) { w in
                                HStack {
                                    Text("En espera: \(w.nombre)").font(.system(size: 12)).foregroundStyle(Theme.neutral500)
                                    Spacer()
                                    Text("puesto \(w.position)").font(.system(size: 11)).foregroundStyle(Theme.neutral600)
                                }.padding(.vertical, 6)
                            }
                        }
                    }
                }
                .frame(maxHeight: 260)

                HStack(spacing: 8) {
                    Button("Cerrar") { dismiss() }.buttonStyle(StudioButtonStyle(kind: .secondary, block: true))
                    Button("Editar franja") { Task { await editTemplate() } }
                        .buttonStyle(StudioButtonStyle(kind: .primary, block: true))
                }
            } else if isLoading {
                ProgressView().tint(Theme.accent).frame(maxWidth: .infinity).padding(.vertical, 40)
            }
        }
        .padding(18)
        .background(Theme.surface)
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.hidden)
        .task { await load() }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do { data = try await session.api.attendees(sessionId: sessionId) }
        catch { onDone(error.localizedDescription, nil) }
    }

    private func release(_ a: Attendee) async {
        do {
            _ = try await session.api.releaseBooking(bookingId: a.bookingId)
            onDone("Plaza liberada · \(a.nombre)", nil)
        } catch { onDone(error.localizedDescription, nil) }
    }

    private func editTemplate() async {
        guard let templateId = data?.session.templateId else { return }
        do {
            let templates = try await session.api.classTemplates()
            if let t = templates.first(where: { $0.id == templateId }) {
                onDone(nil, t)
            }
        } catch { onDone(error.localizedDescription, nil) }
    }
}
