import SwiftUI

@MainActor
struct AgendaView: View {
    @EnvironmentObject var session: AppSession
    @ObservedObject var toast: ToastCenter
    var goToBono: () -> Void

    @State private var agenda: AgendaResponse?
    @State private var date: String?
    @State private var isLoading = true
    @State private var sheetSession: SessionRow?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                Text("Agenda").font(Theme.heading(20)).padding(.top, 8)

                if let agenda {
                    if let offer = agenda.pendingOffer {
                        offerBanner(offer)
                    }
                    if let reminder = agenda.reminderTomorrow {
                        reminderBanner(reminder)
                    }
                    bonoRow(agenda.bono)
                    weekStrip(agenda)

                    if agenda.closed {
                        EmptyStateView(icon: "moon.stars", title: "El estudio no abre los domingos", subtitle: "Vuelve el lunes a las 07:00")
                    } else {
                        VStack(spacing: 8) {
                            ForEach(agenda.sessions) { s in
                                SessionRowView(row: s).onTapGesture { sheetSession = s }
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
        .task { await load(date: nil) }
        .refreshable { await load(date: date) }
        .sheet(item: $sheetSession) { row in
            ReservaSheetView(row: row) { message in
                sheetSession = nil
                toast.show(message)
                Task { await load(date: date) }
            }
        }
    }

    private func load(date requestedDate: String?) async {
        isLoading = true
        defer { isLoading = false }
        do {
            let res = try await session.api.agenda(date: requestedDate)
            agenda = res
            date = res.date
        } catch {
            toast.show(error.localizedDescription)
        }
    }

    @ViewBuilder private func offerBanner(_ offer: PendingOffer) -> some View {
        VStack(alignment: .leading, spacing: 11) {
            HStack(alignment: .top, spacing: 9) {
                Image(systemName: "bell.badge.fill").foregroundStyle(Theme.accent200)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Plaza libre · \(offer.date) \(offer.time)").font(.system(size: 13)).foregroundStyle(Theme.accent100)
                    Text("\(offer.className) · aviso enviado por la app y WhatsApp · tienes 30 min para confirmar")
                        .font(.system(size: 11)).foregroundStyle(Theme.accent300)
                }
            }
            HStack(spacing: 8) {
                Button("Ahora no") { Task { await decline(offer) } }
                    .buttonStyle(StudioButtonStyle(kind: .secondary, block: true))
                Button("Ocupar plaza") { Task { await accept(offer) } }
                    .buttonStyle(StudioButtonStyle(kind: .primary, block: true))
            }
        }
        .padding(12)
        .background(Theme.accent900)
        .overlay(RoundedRectangle(cornerRadius: Theme.radiusMd).stroke(Theme.accent, lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous))
    }

    private func accept(_ offer: PendingOffer) async {
        do {
            _ = try await session.api.acceptOffer(id: offer.id)
            toast.show("Plaza confirmada · \(offer.time) \(offer.date)")
            await load(date: date)
        } catch { toast.show(error.localizedDescription) }
    }

    private func decline(_ offer: PendingOffer) async {
        do {
            _ = try await session.api.declineOffer(id: offer.id)
            toast.show("Plaza ofrecida a la siguiente persona de la lista")
            await load(date: date)
        } catch { toast.show(error.localizedDescription) }
    }

    @ViewBuilder private func reminderBanner(_ reminder: ReminderTomorrow) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "bell.and.waves.left.and.right.fill").foregroundStyle(Theme.accent300)
            VStack(alignment: .leading, spacing: 2) {
                Text("Mañana \(reminder.time) · \(reminder.className)").font(.system(size: 12.5)).foregroundStyle(Theme.accent100)
                Text("Aviso hoy a las 18:00").font(.system(size: 11)).foregroundStyle(Theme.accent300)
            }
        }
        .padding(11)
        .background(Theme.accent900)
        .overlay(RoundedRectangle(cornerRadius: Theme.radiusMd).stroke(Theme.accent800, lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous))
    }

    @ViewBuilder private func bonoRow(_ bono: BonoSummaryLite) -> some View {
        HStack(spacing: 10) {
            Image(systemName: "ticket.fill").foregroundStyle(Theme.accent)
            VStack(alignment: .leading, spacing: 1) {
                Text("\(bono.remaining) sesiones disponibles").font(.system(size: 13))
                Text("Bono de 8 sesiones · sin caducidad").font(.system(size: 11)).foregroundStyle(Theme.neutral500)
            }
            Spacer()
            Button("Ver bono", action: goToBono).buttonStyle(StudioButtonStyle(kind: .ghost))
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .cardBackground()
    }

    @ViewBuilder private func weekStrip(_ agenda: AgendaResponse) -> some View {
        HStack(spacing: 6) {
            ForEach(agenda.week) { d in
                let selected = d.date == agenda.date
                VStack(spacing: 2) {
                    Text(d.label).font(.system(size: 9)).textCase(.uppercase).opacity(0.75)
                    Text(d.num).font(.system(size: 16, weight: .medium))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .foregroundStyle(selected ? Theme.accent200 : Theme.neutral400)
                .background(selected ? Theme.accent900 : .clear)
                .overlay(RoundedRectangle(cornerRadius: Theme.radiusMd).stroke(selected ? Theme.accent : Theme.neutral800, lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous))
                .onTapGesture { Task { await load(date: d.date) } }
            }
        }
    }
}

private struct SessionRowView: View {
    let row: SessionRow

    private var tagStyle: TagStyle {
        if row.mine { return .accent }
        if row.waitlisted { return .accent2 }
        if row.full { return .neutral }
        return .outline
    }
    private var borderColor: Color { row.mine ? Theme.accent : .clear }

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 0) {
                Text(row.time).font(.system(size: 16, weight: .medium))
                Text("50 min").font(.system(size: 10)).foregroundStyle(Theme.neutral500)
            }
            .frame(width: 50, alignment: .leading)

            VStack(alignment: .leading, spacing: 1) {
                Text(row.className).font(.system(size: 13))
                Text("\(row.coachName) · \(row.plazasTxt)").font(.system(size: 11)).foregroundStyle(Theme.neutral500)
            }
            Spacer()
            TagView(text: row.estado, style: tagStyle)
        }
        .padding(12)
        .opacity(row.full && !row.waitlisted ? 0.7 : 1)
        .background(Theme.surface)
        .overlay(RoundedRectangle(cornerRadius: Theme.radiusMd).stroke(borderColor, lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous))
    }
}
