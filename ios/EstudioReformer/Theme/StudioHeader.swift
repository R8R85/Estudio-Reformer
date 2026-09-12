import SwiftUI

/// The persistent top bar every screen in the prototype shares: mark logo,
/// studio name + a per-role subtitle, and an avatar with the user's
/// initials.
struct StudioHeader: View {
    let subtitle: String
    let avatarText: String

    var body: some View {
        HStack(spacing: 10) {
            Image("logo-mark")
                .resizable()
                .scaledToFit()
                .frame(width: 32, height: 32)
                .blendMode(.lighten)
                .padding(6)
                .frame(width: 36, height: 36)
                .background(Theme.bg)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.neutral800, lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 1) {
                Text("Estudio Reformer").font(.system(size: 14, weight: .medium))
                Text(subtitle).font(.system(size: 11)).foregroundStyle(Theme.neutral500)
            }
            Spacer()
            Circle()
                .fill(Theme.accent800)
                .frame(width: 32, height: 32)
                .overlay(Text(avatarText).font(.system(size: 12)).foregroundStyle(Theme.accent100))
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 10)
        .background(Theme.bg)
    }
}

/// Helper shared by member + admin ficha screens.
func initials(_ name: String) -> String {
    name.split(separator: " ").compactMap { $0.first }.prefix(2).map(String.init).joined().uppercased()
}
