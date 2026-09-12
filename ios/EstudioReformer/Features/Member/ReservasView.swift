import SwiftUI

@MainActor
struct ReservasView: View {
    @EnvironmentObject var session: AppSession
    @ObservedObject var toast: ToastCenter
    var goToAgenda: () -> Void

    @State private var data: ReservasResponse?
    @State private var isLoading = true

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Mis reservas").font(Theme.heading(20)).padding(.top, 8)

                if let data {
                    if data.proximas.isEmpty {
                        VStack(spacing: 12) {
                            EmptyStateView(icon: "calendar", title: "No tienes sesiones reservadas")
                            Button("Ir a la agenda", action: goToAgenda)
                                .buttonStyle(StudioButtonStyle(kind: .primary))
                        }
                        .frame(maxWidth: .infinity)
                    } else {
                        VStack(spacing: 8) {
                            ForEach(data.proximas) { r in proximaRow(r) }
                        }
                    }

                    if !data.espera.isEmpty {
                        HStack(spacing: 8) {
                            Text("Lista de espera").font(Theme.heading(16))
                            Image(systemName: "bell.badge").foregroundStyle(Theme.accent).font(.system(size: 12))
                        }
                        .padding(.top, 8)
                        VStack(spacing: 8) {
                            ForEach(data.espera) { w in esperaRow(w) }
                        }
                    }

                    SectionHeading(text: "Historial").padding(.top, 8)
                    VStack(spacing: 0) {
                        ForEach(data.historial) { h in
                            HStack(spacing: 10) {
                                Text(h.dayLabel).font(.system(size: 12)).frame(width: 84, alignment: .leading)
                                Text(h.className).font(.system(size: 12)).foregroundStyle(Theme.text)
                                Spacer()
                                Text(h.estado).font(.system(size: 11)).foregroundStyle(Theme.neutral500)
                            }
                            .foregroundStyle(Theme.neutral400)
                            .padding(.vertical, 10)
                            Divider().background(Theme.divider)
                        }
                    }
                } else if isLoading {
                    ProgressView().tint(Theme.accent).padding(.top, 40)
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 24)
        }
        .background(Theme.bg)
        .task { await load() }
        .refreshable { await load() }
    }

    private func proximaRow(_ r: ProximaReserva) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 0) {
                    Text(r.time).font(.system(size: 16, weight: .medium))
                    Text(r.dayLabel).font(.system(size: 10)).foregroundStyle(Theme.neutral500)
                }.frame(width: 50, alignment: .leading)
                VStack(alignment: .leading, spacing: 1) {
                    Text(r.className).font(.system(size: 13))
                    Text(r.coachName).font(.system(size: 11)).foregroundStyle(Theme.neutral500)
                }
                Spacer()
                Button(r.cancelText) { Task { await cancel(r) } }
                    .buttonStyle(StudioButtonStyle(kind: .secondary, disabled: !r.cancelable))
                    .disabled(!r.cancelable)
            }
            if !r.cancelable {
                Text(r.cancelNote).font(.system(size: 11)).foregroundStyle(Theme.neutral500)
            }
        }
        .padding(12)
        .cardBackground()
    }

    private func esperaRow(_ w: EsperaItem) -> some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 1) {
                Text("\(w.date) · \(w.time) \(w.className)").font(.system(size: 13))
                Text("Puesto \(w.position) de \(w.total) · te avisamos por app y WhatsApp")
                    .font(.system(size: 11)).foregroundStyle(Theme.neutral500)
            }
            Spacer()
            Button("Salir") { Task { await leaveWaitlist(w) } }
                .buttonStyle(StudioButtonStyle(kind: .secondary))
        }
        .padding(12)
        .overlay(RoundedRectangle(cornerRadius: Theme.radiusMd).stroke(Theme.accent800, lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous))
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do { data = try await session.api.reservas() } catch { toast.show(error.localizedDescription) }
    }

    private func cancel(_ r: ProximaReserva) async {
        do {
            _ = try await session.api.cancelBooking(bookingId: r.bookingId)
            toast.show("Reserva cancelada · sesión devuelta al bono")
            await load()
        } catch { toast.show(error.localizedDescription) }
    }

    private func leaveWaitlist(_ w: EsperaItem) async {
        do {
            _ = try await session.api.leaveWaitlist(entryId: w.entryId)
            toast.show("Has salido de la lista de espera")
            await load()
        } catch { toast.show(error.localizedDescription) }
    }
}
