import SwiftUI

@MainActor
struct BonoView: View {
    @EnvironmentObject var session: AppSession
    @ObservedObject var toast: ToastCenter
    @State private var bono: BonoResponse?
    @State private var isLoading = true

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Mi bono").font(Theme.heading(20)).padding(.top, 8)

                if let bono {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack(alignment: .lastTextBaseline) {
                            Text("BONO MENSUAL").font(.system(size: 12)).tracking(1).foregroundStyle(Theme.accent)
                            Spacer()
                            TagView(text: bono.status, style: .outline)
                        }
                        HStack(alignment: .lastTextBaseline, spacing: 6) {
                            Text("\(bono.remaining)").font(.system(size: 40, weight: .medium))
                            Text("de 8 sesiones sin usar").font(.system(size: 14)).foregroundStyle(Theme.neutral500)
                        }
                        HStack(spacing: 6) {
                            ForEach(0..<8, id: \.self) { i in
                                let used = i < (8 - bono.remaining)
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(used ? Theme.neutral800 : Theme.accent)
                                    .frame(height: 6)
                            }
                        }
                        Text("Ciclo: \(bono.cycleLabel) · las sesiones no caducan")
                            .font(.system(size: 11)).foregroundStyle(Theme.neutral500)
                        Text("Las sesiones que no se cancelen con 6 h de antelación se descuentan del bono.")
                            .font(.system(size: 11)).foregroundStyle(Theme.neutral500)
                    }
                    .padding(16)
                    .cardBackground()

                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: "arrow.triangle.2.circlepath").foregroundStyle(Theme.accent)
                        Text("La renovación la hace el estudio de forma manual a principio de mes. Recibirás un aviso cuando tu bono esté activo.")
                            .font(.system(size: 12)).foregroundStyle(Theme.neutral400)
                    }
                    .padding(12)
                    .overlay(RoundedRectangle(cornerRadius: Theme.radiusMd).stroke(Theme.neutral800, lineWidth: 1))

                    SectionHeading(text: "Movimientos").padding(.top, 4)
                    VStack(spacing: 0) {
                        ForEach(bono.movimientos) { m in
                            HStack(spacing: 10) {
                                Image(systemName: m.delta.hasPrefix("+") ? "plus.circle" : "minus.circle")
                                    .foregroundStyle(m.delta.hasPrefix("+") ? Theme.accent : Theme.neutral500)
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(m.titulo).font(.system(size: 13))
                                    Text(m.fecha.prefix(10)).font(.system(size: 11)).foregroundStyle(Theme.neutral500)
                                }
                                Spacer()
                                Text(m.delta).font(.system(size: 12))
                                    .foregroundStyle(m.delta.hasPrefix("+") ? Theme.accent : Theme.neutral500)
                            }
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

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do { bono = try await session.api.bono() } catch { toast.show(error.localizedDescription) }
    }
}
