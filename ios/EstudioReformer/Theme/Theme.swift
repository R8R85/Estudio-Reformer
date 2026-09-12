import SwiftUI

/// Color/spacing/radius tokens lifted straight from the Claude Design
/// handoff's "Nocturne" design system (`_ds/.../styles.css`), so the native
/// app matches the approved mockup instead of picking its own palette.
enum Theme {
    static let bg = Color(hex: 0x161826)
    static let surface = Color(hex: 0x232532)
    static let text = Color(hex: 0xE9E9ED)
    static let divider = Color.white.opacity(0.16)

    static let accent = Color(hex: 0x9184D9)
    static let accent100 = Color(hex: 0xF5F4FF)
    static let accent200 = Color(hex: 0xE7E5FE)
    static let accent300 = Color(hex: 0xD2CEFD)
    static let accent800 = Color(hex: 0x423A6A)
    static let accent900 = Color(hex: 0x2B2741)

    static let neutral400 = Color(hex: 0xB2B6CA)
    static let neutral500 = Color(hex: 0x9397AB)
    static let neutral600 = Color(hex: 0x75798C)
    static let neutral700 = Color(hex: 0x595D6C)
    static let neutral800 = Color(hex: 0x3F424D)
    static let neutral900 = Color(hex: 0x292B31)

    static let radiusSm: CGFloat = 4
    static let radiusMd: CGFloat = 8
    static let radiusLg: CGFloat = 14

    /// The prototype specs "Inter" everywhere; without bundling the font file
    /// this falls back to the system font, which sits close enough to Inter
    /// at UI sizes. Bundle Inter (Google Fonts) and swap this for an exact
    /// match if that matters.
    static func heading(_ size: CGFloat) -> Font { .system(size: size, weight: .medium) }
    static func body(_ size: CGFloat) -> Font { .system(size: size) }
}

extension Color {
    init(hex: UInt32, opacity: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: opacity
        )
    }
}

/// A `.card`-style surface: the Nocturne surface fill + a hairline "shadow"
/// (the design system draws elevation as a 1px border, not a blur).
struct CardBackground: ViewModifier {
    var radius: CGFloat = Theme.radiusMd
    func body(content: Content) -> some View {
        content
            .background(Theme.surface)
            .clipShape(RoundedRectangle(cornerRadius: radius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .stroke(Theme.neutral800, lineWidth: 1)
            )
    }
}

extension View {
    func cardBackground(radius: CGFloat = Theme.radiusMd) -> some View {
        modifier(CardBackground(radius: radius))
    }
}

/// `.tag` variants from the design system.
enum TagStyle {
    case accent, accent2, neutral, outline

    var background: Color {
        switch self {
        case .accent: return Theme.accent800
        case .accent2: return Theme.accent800.opacity(0.8)
        case .neutral: return Theme.neutral800
        case .outline: return .clear
        }
    }
    var foreground: Color {
        switch self {
        case .accent: return Theme.accent100
        case .accent2: return Theme.accent200
        case .neutral: return Theme.neutral400
        case .outline: return Theme.accent
        }
    }
    var border: Color? { self == .outline ? Theme.accent : nil }
}

struct TagView: View {
    let text: String
    var style: TagStyle = .neutral
    var body: some View {
        Text(text)
            .font(.system(size: 11))
            .padding(.horizontal, 10)
            .padding(.vertical, 3)
            .background(style.background)
            .foregroundStyle(style.foreground)
            .clipShape(Capsule())
            .overlay {
                if let border = style.border {
                    Capsule().stroke(border, lineWidth: 1)
                }
            }
    }
}

enum PrimaryButtonStyleKind { case primary, secondary, ghost }

struct StudioButtonStyle: ButtonStyle {
    var kind: PrimaryButtonStyleKind = .primary
    var block = false
    var disabled = false

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(Theme.heading(14))
            .frame(maxWidth: block ? .infinity : nil)
            .padding(.vertical, 8)
            .padding(.horizontal, 14)
            .foregroundStyle(foreground)
            .background(background(pressed: configuration.isPressed))
            .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous)
                    .stroke(border, lineWidth: 1)
            )
            .opacity(disabled ? 0.45 : 1)
    }

    private var foreground: Color {
        switch kind {
        case .primary, .ghost: return Theme.accent
        case .secondary: return Theme.text
        }
    }
    private var border: Color {
        switch kind {
        case .primary: return Theme.accent
        case .secondary: return Theme.divider
        case .ghost: return .clear
        }
    }
    private func background(pressed: Bool) -> Color {
        guard pressed else { return .clear }
        switch kind {
        case .primary, .ghost: return Theme.accent.opacity(0.18)
        case .secondary: return Theme.text.opacity(0.1)
        }
    }
}
