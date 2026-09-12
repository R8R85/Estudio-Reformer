import SwiftUI

/// The prototype's "hojaEditar" sheet — create or edit a recurring weekly
/// class slot (franja). `dayOfWeek` seeds a *new* franja with the day
/// currently selected in the agenda; editing an existing one keeps its own
/// `dayOfWeek` untouched here (the admin picks the day by tapping the strip,
/// same as the prototype).
@MainActor
struct EditarFranjaSheetView: View {
    @EnvironmentObject var session: AppSession
    @Environment(\.dismiss) private var dismiss
    let existing: ClassTemplate?
    let dayOfWeek: Int
    let onDone: (String?) -> Void

    @State private var time: Date
    @State private var className: String
    @State private var coachName: String
    @State private var capacity: Int
    @State private var isSubmitting = false
    @State private var error: String?

    init(existing: ClassTemplate?, dayOfWeek: Int, onDone: @escaping (String?) -> Void) {
        self.existing = existing
        self.dayOfWeek = dayOfWeek
        self.onDone = onDone
        _time = State(initialValue: Self.parseTime(existing?.time ?? "09:00"))
        _className = State(initialValue: existing?.className ?? "")
        _coachName = State(initialValue: existing?.coachName ?? "")
        _capacity = State(initialValue: existing?.capacity ?? 2)
    }

    private var incompleto: Bool { className.trimmingCharacters(in: .whitespaces).isEmpty || coachName.trimmingCharacters(in: .whitespaces).isEmpty }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Capsule().fill(Theme.neutral700).frame(width: 36, height: 4).frame(maxWidth: .infinity)

            Text(existing == nil ? "Nueva franja" : "Editar franja").font(.system(size: 22, weight: .medium))

            HStack(spacing: 10) {
                LabeledField(label: "Hora") {
                    DatePicker("", selection: $time, displayedComponents: .hourAndMinute)
                        .labelsHidden()
                }.frame(width: 120)
                LabeledField(label: "Nombre de la sesión") {
                    TextField("Reformer Flow", text: $className).foregroundStyle(Theme.text)
                }
            }
            LabeledField(label: "Instructor/a", note: "El nombre y la hora son los que verá cada socio/a en la agenda.") {
                TextField("Marta", text: $coachName).foregroundStyle(Theme.text)
            }

            HStack {
                VStack(alignment: .leading, spacing: 1) {
                    Text("Plazas de la sesión").font(.system(size: 13))
                    Text("Reformers disponibles en esta franja").font(.system(size: 11)).foregroundStyle(Theme.neutral500)
                }
                Spacer()
                HStack(spacing: 10) {
                    Button { capacity = max(1, capacity - 1) } label: { Image(systemName: "minus") }
                        .buttonStyle(StudioButtonStyle(kind: .secondary)).frame(width: 30, height: 30)
                    Text("\(capacity)").font(.system(size: 18, weight: .medium)).frame(minWidth: 16)
                    Button { capacity = min(20, capacity + 1) } label: { Image(systemName: "plus") }
                        .buttonStyle(StudioButtonStyle(kind: .secondary)).frame(width: 30, height: 30)
                }
            }
            .padding(11)
            .background(Theme.bg)
            .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous))

            if let error {
                Text(error).font(.system(size: 12)).foregroundStyle(Theme.accent300)
            }

            HStack(spacing: 8) {
                Button("Cancelar") { dismiss() }.buttonStyle(StudioButtonStyle(kind: .secondary, block: true))
                Button {
                    Task { await save() }
                } label: {
                    if isSubmitting { ProgressView().tint(Theme.accent) } else { Text("Guardar") }
                }
                .buttonStyle(StudioButtonStyle(kind: .primary, block: true, disabled: incompleto))
                .disabled(incompleto || isSubmitting)
            }

            if existing != nil {
                Button("Eliminar franja") { Task { await delete() } }
                    .buttonStyle(StudioButtonStyle(kind: .ghost, block: true))
                    .foregroundStyle(Theme.neutral400)
            }
        }
        .padding(18)
        .background(Theme.surface)
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.hidden)
    }

    private func save() async {
        isSubmitting = true
        error = nil
        defer { isSubmitting = false }
        let input = ClassTemplateInput(
            dayOfWeek: existing?.dayOfWeek ?? dayOfWeek,
            time: Self.formatTime(time),
            className: className.trimmingCharacters(in: .whitespaces),
            coachName: coachName.trimmingCharacters(in: .whitespaces),
            capacity: capacity
        )
        do {
            if let existing {
                _ = try await session.api.updateClassTemplate(id: existing.id, input)
                onDone("Franja actualizada · \(input.time)")
            } else {
                _ = try await session.api.createClassTemplate(input)
                onDone("Franja creada · \(input.time)")
            }
        } catch { self.error = error.localizedDescription }
    }

    private func delete() async {
        guard let existing else { return }
        do {
            _ = try await session.api.deleteClassTemplate(id: existing.id)
            onDone("Franja eliminada · \(existing.time)")
        } catch { self.error = error.localizedDescription }
    }

    private static func parseTime(_ s: String) -> Date {
        let f = DateFormatter(); f.dateFormat = "HH:mm"
        return f.date(from: s) ?? Date()
    }
    private static func formatTime(_ d: Date) -> String {
        let f = DateFormatter(); f.dateFormat = "HH:mm"
        return f.string(from: d)
    }
}
