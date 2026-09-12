import SwiftUI

/// Top-level router: not logged in → auth/alta flow; logged in but not yet
/// approved → pending/rejected screen; approved → the member or admin app,
/// chosen by the account's own role (there's no in-app role switcher in the
/// real app — that was a prototype-only affordance for demoing both
/// perspectives side by side).
@MainActor
struct RootView: View {
    @EnvironmentObject var session: AppSession

    var body: some View {
        ZStack {
            Theme.bg.ignoresSafeArea()

            if session.isLoadingInitialAuth {
                ProgressView().tint(Theme.accent)
            } else if let user = session.user {
                switch user.status {
                case "PENDING":
                    PendingRequestView(user: user)
                case "REJECTED":
                    RejectedRequestView()
                default:
                    if user.isAdmin {
                        AdminRootView()
                    } else {
                        MemberRootView()
                    }
                }
            } else {
                AuthHomeView()
            }
        }
        .foregroundStyle(Theme.text)
    }
}
