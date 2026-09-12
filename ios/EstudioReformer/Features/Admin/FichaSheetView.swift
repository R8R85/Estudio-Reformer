import SwiftUI

/// The prototype's "hojaFicha" sheet — a member's full profile: contact
/// info, the access-request questionnaire answers, and their bono history
/// (grouped by renewal, with every session enjoyed under it).
@MainActor
struct FichaSheetView: View {
    @EnvironmentObject var session: AppSession
    @Environment(\.dismiss) private var dismiss
    let memberId: String
    let onDone: (String?) -> Void

    @State private var ficha: MemberFicha?
    @State private var isLoading = true

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Capsule().fill(Theme.neutral700).frame(width: 36, height: 4).frame(maxWidth: .infinity)

            if let ficha {
                HStack(spacing: 11) {
                    Circle().fill(Theme.neutral800).frame(width: 38, height: 38)
                        .overlay(Text(ficha.iniciales).font(.system(size: 13)))
                    VStack(alignment: .leading, spacing: 1) {
                        Text(ficha.nombre).font(.system(size: 18, weight: .medium))
                        Text(ficha.alta).font(.system(size: 11)).foregroundStyle(Theme.neutral500)
                    }
                    Spacer()
                    TagView(text: ficha.estadoBono, style: .outline)
                }

                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        infoRow(icon: "envelope", text: ficha.email)
                        infoRow(icon: "message", text: ficha.tel)
                        infoRow(icon: "figure.strengthtraining.traditional", text: ficha.experiencia)
                        VStack(alignment: .leading, spacing: 3) {
                            HStack(spacing: 9) {
                                Image(systemName: "waveform.path.ecg").font(.system(size: 15)).foregroundStyle(Theme.neutral500)
                                Text(ficha.patologia).font(.system(size: 13))
                            }
                            if ficha.hayLimitacion {
                                Text(ficha.limitacion).font(.system(size: 12)).foregroundStyle(Theme.accent300).padding(.leading, 24)
                            }
                        }
                        .padding(.vertical, 9)
                        Divider().background(Theme.divider)

                        Text(ficha.resumen).font(.system(size: 12)).foregroundStyle(Theme.neutral400).padding(.top, 10)

                        VStack(spacing: 8) {
                            ForEach(ficha.bonos) { b in
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack(alignment: .lastTextBaseline) {
                                        Text(b.mes).font(.system(size: 13))
                                        Spacer()
                                        Text(b.resumen).font(.system(size: 11)).foregroundStyle(Theme.neutral500)
                                    }
                                    if b.vacio {
                                        Text("Sin sesiones disfrutadas todavía").font(.system(size: 11)).foregroundStyle(Theme.neutral600)
                                    } else {
                                        ForEach(b.sesiones) { s in
                                            HStack(spacing: 10) {
                                                Text(s.fecha).font(.system(size: 12)).frame(width: 86, alignment: .leading)
                                                Text(s.clase).font(.system(size: 12))
                                                Spacer()
                                            }
                                            .foregroundStyle(Theme.neutral400)
                                        }
                                    }
                                }
                                .padding(11)
                                .background(Theme.bg)
                                .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous))
                            }
                        }
                        .padding(.top, 10)
                    }
                }
                .frame(maxHeight: 300)

                Button("Cerrar") { dismiss() }.buttonStyle(StudioButtonStyle(kind: .secondary, block: true))
            } else if isLoading {
                ProgressView().tint(Theme.accent).frame(maxWidth: .infinity).padding(.vertical, 40)
            }
        }
        .padding(18)
        .background(Theme.surface)
        .presentationDetents([.large])
        .presentationDragIndicator(.hidden)
        .task { await load() }
    }

    private func infoRow(icon: String, text: String) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 9) {
                Image(systemName: icon).font(.system(size: 15)).foregroundStyle(Theme.neutral500)
                Text(text).font(.system(size: 13))
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 9)
            Divider().background(Theme.divider)
        }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do { ficha = try await session.api.memberFicha(id: memberId) }
        catch { onDone(error.localizedDescription) }
    }
}
