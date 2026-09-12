import SwiftUI

/// `.field` + `.input` from the design system: a small uppercase-ish label
/// over a surface-filled text field with a hairline border.
struct LabeledField<Content: View>: View {
    let label: String
    var note: String? = nil
    @ViewBuilder var content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(label)
                .font(.system(size: 12))
                .foregroundStyle(Theme.text.opacity(0.7))
            content()
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .background(Theme.surface)
                .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous)
                        .stroke(Theme.divider, lineWidth: 1)
                )
            if let note {
                Text(note)
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.neutral500)
            }
        }
    }
}

/// The `.seg` segmented control (used for the Sí/No questions on the access
/// request form and admin toggles).
struct YesNoSegment: View {
    @Binding var value: Bool
    var yesLabel = "Sí"
    var noLabel = "No"

    var body: some View {
        HStack(spacing: 0) {
            option(yesLabel, selected: value) { value = true }
            Divider().frame(height: 20).background(Theme.divider)
            option(noLabel, selected: !value) { value = false }
        }
        .overlay(
            RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous)
                .stroke(Theme.divider, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous))
    }

    private func option(_ text: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(text)
                .font(.system(size: 13))
                .foregroundStyle(selected ? Theme.accent : Theme.text)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 7)
                .background(selected ? Theme.accent.opacity(0.12) : .clear)
        }
        .buttonStyle(.plain)
    }
}

struct SectionHeading: View {
    let text: String
    var body: some View {
        Text(text)
            .font(Theme.heading(16))
            .foregroundStyle(Theme.text)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct EmptyStateView: View {
    let icon: String
    let title: String
    var subtitle: String? = nil
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundStyle(Theme.neutral600)
            Text(title).font(.system(size: 13)).foregroundStyle(Theme.text)
            if let subtitle {
                Text(subtitle).font(.system(size: 11)).foregroundStyle(Theme.neutral500)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 36)
        .overlay(
            RoundedRectangle(cornerRadius: Theme.radiusMd)
                .strokeBorder(Theme.neutral800, style: StrokeStyle(lineWidth: 1, dash: [4, 4]))
        )
    }
}

struct ToastBanner: View {
    let text: String
    var body: some View {
        HStack(spacing: 9) {
            Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.accent)
            Text(text).font(.system(size: 12.5)).foregroundStyle(Theme.text)
        }
        .padding(.horizontal, 13)
        .padding(.vertical, 11)
        .background(Theme.neutral900)
        .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous))
        .shadow(color: .black.opacity(0.4), radius: 10, y: 4)
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }
}

/// Drives `ToastBanner` with the same "show for ~2.6s" behavior the
/// prototype uses.
@MainActor
final class ToastCenter: ObservableObject {
    @Published var message: String?
    private var task: Task<Void, Never>?

    func show(_ text: String) {
        task?.cancel()
        message = text
        task = Task {
            try? await Task.sleep(nanoseconds: 2_600_000_000)
            if !Task.isCancelled { message = nil }
        }
    }
}

struct ToastHost<Content: View>: View {
    @StateObject var center = ToastCenter()
    @ViewBuilder var content: (ToastCenter) -> Content

    var body: some View {
        ZStack(alignment: .bottom) {
            content(center)
            if let message = center.message {
                ToastBanner(text: message)
                    .padding(.horizontal, 16)
                    .padding(.bottom, 90)
            }
        }
        .animation(.easeOut(duration: 0.18), value: center.message)
    }
}
