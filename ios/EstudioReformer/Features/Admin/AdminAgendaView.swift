import SwiftUI

@MainActor
struct AdminAgendaView: View {
    @EnvironmentObject var session: AppSession
    @ObservedObject var toast: ToastCenter

    @State private var date = DateUtils.todayISO()
    @State private var agenda: AdminAgendaResponse?
    @State private var settings: ReminderSettings?
    @State private var isLoading = true
    @State private var sheetSessionId: String?
    @State private var editingTemplate: ClassTemplate?
    @State private var creatingNew = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                Text("Agenda del estudio").font(Theme.heading(20)).padding(.top, 8)

                HStack(spacing: 6) {
                    ForEach(DateUtils.weekDates(containing: date), id: \.self) { d in
                        let selected = d == date
                        VStack(spacing: 2) {
                            Text(DateUtils.label(d)).font(.system(size: 9)).textCase(.uppercase).opacity(0.75)
                            Text(DateUtils.dayNum(d)).font(.system(size: 16, weight: .medium))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .foregroundStyle(selected ? Theme.accent200 : Theme.neutral400)
                        .background(selected ? Theme.accent900 : .clear)
                        .overlay(RoundedRectangle(cornerRadius: Theme.radiusMd).stroke(selected ? Theme.accent : Theme.neutral800, lineWidth: 1))
                        .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous))
                        .onTapGesture { date = d; Task { await load() } }
                    }
                }

                if let agenda {
                    HStack {
                        Text(agenda.closed ? "Domingo cerrado" : "\(agenda.dayLabel) \(DateUtils.dayNum(date)) · \(agenda.sessions.count) franjas")
                            .font(.system(size: 12)).foregroundStyle(Theme.neutral500)
                        Spacer()
                        Button("+ Nueva franja") { creatingNew = true }.buttonStyle(StudioButtonStyle(kind: .ghost))
                    }

                    VStack(spacing: 8) {
                        ForEach(agenda.sessions) { s in franjaRow(s) }
                    }

                    if let settings {
                        reminderCard(settings)
                    }
                } else if isLoading {
                    ProgressView().tint(Theme.accent).padding(.top, 40)
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 24)
        }
        .background(Theme.bg)
        .task { await load(); await loadSettings() }
        .refreshable { await load() }
        .sheet(item: sheetIDBinding) { id in
            AsistentesSheetView(sessionId: id.value) { message, editTemplate in
                sheetSessionId = nil
                if let message { toast.show(message); Task { await load() } }
                if let editTemplate { editingTemplate = editTemplate }
            }
        }
        .sheet(item: $editingTemplate) { template in
            EditarFranjaSheetView(existing: template, dayOfWeek: DateUtils.dayOfWeek(date)) { message in
                editingTemplate = nil
                if let message { toast.show(message); Task { await load() } }
            }
        }
        .sheet(isPresented: $creatingNew) {
            EditarFranjaSheetView(existing: nil, dayOfWeek: DateUtils.dayOfWeek(date)) { message in
                creatingNew = false
                if let message { toast.show(message); Task { await load() } }
            }
        }
    }

    private func franjaRow(_ s: AdminSessionRow) -> some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(spacing: 12) {
                Text(s.time).font(.system(size: 16, weight: .medium)).frame(width: 50, alignment: .leading)
                VStack(alignment: .leading, spacing: 1) {
                    Text(s.className).font(.system(size: 13))
                    Text(s.coachName).font(.system(size: 11)).foregroundStyle(Theme.neutral500)
                }
                Spacer()
                Text("\(s.occupied)/\(s.capacity)").font(.system(size: 13))
                    .foregroundStyle(occupancyColor(s))
                Button {
                    Task { await openEditTemplate(s.templateId) }
                } label: {
                    Image(systemName: "pencil").font(.system(size: 13))
                }
                .buttonStyle(StudioButtonStyle(kind: .secondary))
                .frame(width: 30, height: 30)
            }
            RoundedRectangle(cornerRadius: 2)
                .fill(Theme.neutral900)
                .frame(height: 4)
                .overlay(alignment: .leading) {
                    GeometryReader { geo in
                        RoundedRectangle(cornerRadius: 2)
                            .fill(occupancyColor(s))
                            .frame(width: geo.size.width * CGFloat(s.pct) / 100)
                    }
                }
            if s.vacia {
                Text("Sin reservas").font(.system(size: 11)).foregroundStyle(Theme.neutral600)
            } else {
                HStack(spacing: 5) {
                    ForEach(s.attendeeNames, id: \.self) { n in TagView(text: n, style: .neutral) }
                    if s.waitlistCount > 0 { TagView(text: "\(s.waitlistCount) en lista de espera", style: .outline) }
                }
            }
        }
        .padding(12)
        .cardBackground()
        .onTapGesture { sheetSessionId = s.id }
    }

    private func occupancyColor(_ s: AdminSessionRow) -> Color {
        s.occupied >= s.capacity ? Theme.accent : (s.occupied == 0 ? Theme.neutral600 : Theme.neutral400)
    }

    private func openEditTemplate(_ templateId: String) async {
        do {
            let templates = try await session.api.classTemplates()
            if let t = templates.first(where: { $0.id == templateId }) { editingTemplate = t }
        } catch { toast.show(error.localizedDescription) }
    }

    @ViewBuilder private func reminderCard(_ s: ReminderSettings) -> some View {
        VStack(alignment: .leading, spacing: 11) {
            HStack(spacing: 10) {
                Image(systemName: "bell.badge").foregroundStyle(s.reminderEnabled ? Theme.accent : Theme.neutral600)
                VStack(alignment: .leading, spacing: 1) {
                    Text("Recordatorio 1 día antes").font(.system(size: 13))
                    Text(s.reminderEnabled ? "Activo · se envía a las 18:00 del día anterior" : "Desactivado · nadie recibe aviso")
                        .font(.system(size: 11)).foregroundStyle(Theme.neutral500)
                }
                Spacer()
                Toggle("", isOn: Binding(
                    get: { s.reminderEnabled },
                    set: { v in Task { await patch(["reminderEnabled": v]) } }
                ))
                .labelsHidden()
                .tint(Theme.accent)
            }
            HStack(spacing: 6) {
                TagView(text: "Notificación en la app", style: s.reminderChannelApp ? .accent : .outline)
                    .onTapGesture { Task { await patch(["reminderChannelApp": !s.reminderChannelApp]) } }
                TagView(text: "WhatsApp", style: s.reminderChannelWhatsapp ? .accent : .outline)
                    .onTapGesture { Task { await patch(["reminderChannelWhatsapp": !s.reminderChannelWhatsapp]) } }
            }
            Text(s.reminderChannelWhatsapp
                 ? "El WhatsApp se envía al teléfono que cada socio/a dio al registrarse."
                 : "Solo notificación dentro de la app.")
                .font(.system(size: 11)).foregroundStyle(Theme.neutral500)
        }
        .padding(12)
        .cardBackground()
    }

    private func patch(_ change: [String: Bool]) async {
        do { settings = try await session.api.updateReminderSettings(change) }
        catch { toast.show(error.localizedDescription) }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do { agenda = try await session.api.adminAgenda(date: date) }
        catch { toast.show(error.localizedDescription) }
    }

    private func loadSettings() async {
        do { settings = try await session.api.reminderSettings() } catch { /* non-fatal */ }
    }

    /// `.sheet(item:)` needs an `Identifiable`, so this bridges the plain
    /// `String?` session id into one without a second piece of @State.
    private var sheetIDBinding: Binding<SheetID?> {
        Binding(
            get: { sheetSessionId.map(SheetID.init) },
            set: { sheetSessionId = $0?.value }
        )
    }
}

/// Small `Identifiable` box so `String?` can drive `.sheet(item:)`.
private struct SheetID: Identifiable { let value: String; var id: String { value } }
