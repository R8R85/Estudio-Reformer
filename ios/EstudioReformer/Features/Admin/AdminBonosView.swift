import SwiftUI

@MainActor
struct AdminBonosView: View {
    @EnvironmentObject var session: AppSession
    @ObservedObject var toast: ToastCenter

    @State private var summary: BonosSummaryResponse?
    @State private var isLoading = true
    @State private var confirmingRenewAll = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Renovación de bonos").font(Theme.heading(20)).padding(.top, 8)

                if let summary {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("CICLO MENSUAL").font(.system(size: 12)).tracking(1).foregroundStyle(Theme.accent)
                        HStack(spacing: 8) {
                            Text(summary.cicloActual).font(.system(size: 22, weight: .medium))
                            Image(systemName: "arrow.right").font(.system(size: 14)).foregroundStyle(Theme.neutral500)
                            Text(summary.cicloSiguiente).font(.system(size: 22, weight: .medium)).foregroundStyle(Theme.accent)
                        }
                        HStack(spacing: 22) {
                            VStack(alignment: .leading, spacing: 0) {
                                Text("\(summary.numPendientes)").font(.system(size: 20, weight: .medium))
                                Text("bonos por renovar").font(.system(size: 11)).foregroundStyle(Theme.neutral500)
                            }
                            VStack(alignment: .leading, spacing: 0) {
                                Text("\(summary.numRenovados)").font(.system(size: 20, weight: .medium))
                                Text("ya renovados").font(.system(size: 11)).foregroundStyle(Theme.neutral500)
                            }
                        }
                        Button("Renovar los bonos pendientes") { confirmingRenewAll = true }
                            .buttonStyle(StudioButtonStyle(kind: .primary, block: true, disabled: summary.numPendientes == 0))
                            .disabled(summary.numPendientes == 0)
                        Text("Cada renovación repone 8 sesiones al bono de cada socio/a")
                            .font(.system(size: 11)).foregroundStyle(Theme.neutral500)
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                    .padding(16)
                    .cardBackground()

                    HStack(spacing: 10) {
                        Image(systemName: "togglepower").font(.system(size: 19)).foregroundStyle(Theme.neutral500)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("Renovación automática").font(.system(size: 13))
                            Text("Desactivada · los bonos se renuevan a mano").font(.system(size: 11)).foregroundStyle(Theme.neutral500)
                        }
                    }
                    .padding(12)
                    .overlay(RoundedRectangle(cornerRadius: Theme.radiusMd).stroke(Theme.neutral800, lineWidth: 1))

                    SectionHeading(text: "Pendientes de renovar").padding(.top, 4)
                    if summary.numPendientes == 0 {
                        EmptyStateView(icon: "checkmark.circle", title: "Todos los bonos de \(summary.cicloSiguiente) están activos")
                    } else {
                        VStack(spacing: 0) {
                            ForEach(summary.pendientes) { u in
                                HStack(spacing: 10) {
                                    VStack(alignment: .leading, spacing: 1) {
                                        Text(u.nombre).font(.system(size: 13))
                                        Text(u.detalle).font(.system(size: 11)).foregroundStyle(Theme.neutral500)
                                    }
                                    Spacer()
                                    Button("Renovar") { Task { await renew(u) } }.buttonStyle(StudioButtonStyle(kind: .secondary))
                                }
                                .padding(.vertical, 11)
                                Divider().background(Theme.divider)
                            }
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
        .sheet(isPresented: $confirmingRenewAll) {
            if let summary {
                RenovarSheetView(numPendientes: summary.numPendientes, cicloSiguiente: summary.cicloSiguiente) { message in
                    confirmingRenewAll = false
                    if let message { toast.show(message); Task { await load() } }
                }
            }
        }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do { summary = try await session.api.bonosSummary() } catch { toast.show(error.localizedDescription) }
    }

    private func renew(_ u: PendienteRenovar) async {
        do {
            _ = try await session.api.renewMember(id: u.id)
            toast.show("Bono renovado · \(u.nombre)")
            await load()
        } catch { toast.show(error.localizedDescription) }
    }
}
