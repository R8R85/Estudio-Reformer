import SwiftUI

@MainActor
struct AdminSociosView: View {
    @EnvironmentObject var session: AppSession
    @ObservedObject var toast: ToastCenter

    @State private var requests: [AccessRequest] = []
    @State private var members: [MemberSummary] = []
    @State private var query = ""
    @State private var isLoading = true
    @State private var fichaMemberId: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Socios y socias").font(Theme.heading(20)).padding(.top, 8)

                if !requests.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 8) {
                            Text("SOLICITUDES DE ACCESO").font(.system(size: 11)).tracking(1).foregroundStyle(Theme.accent)
                            TagView(text: "\(requests.count)", style: .accent)
                        }
                        VStack(spacing: 8) {
                            ForEach(requests) { q in requestCard(q) }
                        }
                    }
                }

                LabeledField(label: "") {
                    TextField("Buscar por nombre", text: $query)
                        .foregroundStyle(Theme.text)
                        .onChange(of: query) { _, _ in Task { await loadMembers() } }
                }

                VStack(spacing: 8) {
                    ForEach(members) { m in memberRow(m) }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 24)
        }
        .background(Theme.bg)
        .task { await loadAll() }
        .refreshable { await loadAll() }
        .sheet(item: $fichaMemberId.map { FichaSheetID(value: $0) }) { id in
            FichaSheetView(memberId: id.value) { message in
                fichaMemberId = nil
                if let message { toast.show(message); Task { await loadAll() } }
            }
        }
    }

    private func requestCard(_ q: AccessRequest) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                Circle().fill(Theme.neutral800).frame(width: 30, height: 30)
                    .overlay(Text(q.iniciales).font(.system(size: 11)))
                VStack(alignment: .leading, spacing: 1) {
                    Text(q.nombre).font(.system(size: 13))
                    Text(q.contacto).font(.system(size: 11)).foregroundStyle(Theme.neutral500)
                }
            }
            Text(q.nota).font(.system(size: 11)).foregroundStyle(Theme.neutral500)
            HStack(spacing: 8) {
                Button("Rechazar") { Task { await reject(q) } }.buttonStyle(StudioButtonStyle(kind: .secondary, block: true))
                Button("Dar acceso") { Task { await approve(q) } }.buttonStyle(StudioButtonStyle(kind: .primary, block: true))
            }
        }
        .padding(12)
        .background(Theme.surface)
        .overlay(RoundedRectangle(cornerRadius: Theme.radiusMd).stroke(Theme.accent800, lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous))
    }

    private func memberRow(_ m: MemberSummary) -> some View {
        HStack(spacing: 11) {
            Circle().fill(Theme.neutral800).frame(width: 32, height: 32)
                .overlay(Text(m.iniciales).font(.system(size: 12)))
            VStack(alignment: .leading, spacing: 1) {
                Text(m.nombre).font(.system(size: 13))
                Text(m.detalle).font(.system(size: 11)).foregroundStyle(Theme.neutral500)
            }
            Spacer()
            Button(m.btnTexto) { if m.pendienteRenovar { Task { await renew(m) } } }
                .buttonStyle(StudioButtonStyle(kind: m.pendienteRenovar ? .primary : .secondary, disabled: !m.pendienteRenovar))
                .disabled(!m.pendienteRenovar)
        }
        .padding(.horizontal, 12).padding(.vertical, 11)
        .cardBackground()
        .onTapGesture { fichaMemberId = m.id }
    }

    private func loadAll() async {
        isLoading = true
        defer { isLoading = false }
        async let r = try? session.api.accessRequests()
        async let m = try? session.api.members(query: query)
        requests = await r ?? []
        members = await m ?? []
    }

    private func loadMembers() async {
        do { members = try await session.api.members(query: query) } catch { toast.show(error.localizedDescription) }
    }

    private func approve(_ q: AccessRequest) async {
        do {
            _ = try await session.api.approveRequest(id: q.id)
            toast.show("Acceso concedido · \(q.nombre)")
            await loadAll()
        } catch { toast.show(error.localizedDescription) }
    }

    private func reject(_ q: AccessRequest) async {
        do {
            _ = try await session.api.rejectRequest(id: q.id)
            toast.show("Solicitud rechazada · \(q.nombre)")
            await loadAll()
        } catch { toast.show(error.localizedDescription) }
    }

    private func renew(_ m: MemberSummary) async {
        do {
            _ = try await session.api.renewMember(id: m.id)
            toast.show("Bono renovado · \(m.nombre)")
            await loadMembers()
        } catch { toast.show(error.localizedDescription) }
    }
}

private struct FichaSheetID: Identifiable { let value: String; var id: String { value } }
private extension Optional where Wrapped == String {
    func map(_ transform: (String) -> FichaSheetID) -> FichaSheetID? { self.flatMap { transform($0) } }
}
