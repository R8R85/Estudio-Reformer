import Foundation
import SwiftUI

/// Root auth/session state — who's logged in, their approval status, and the
/// shared `APIClient` every screen talks through. Token persistence here is
/// UserDefaults for demo simplicity; swap for Keychain before shipping.
@MainActor
final class AppSession: ObservableObject {
    @Published var user: PublicUser?
    @Published var isLoadingInitialAuth = true
    @Published var lastError: String?

    let api = APIClient()

    private let tokenKey = "auth_token"

    init() {
        api.token = UserDefaults.standard.string(forKey: tokenKey)
        Task { await bootstrap() }
    }

    private func bootstrap() async {
        defer { isLoadingInitialAuth = false }
        guard api.token != nil else { return }
        do {
            let me: MeResponse = try await api.request("/auth/me")
            user = me.user
        } catch {
            // Stored token is stale/invalid — fall back to logged-out.
            signOut()
        }
    }

    func register(name: String, email: String, phone: String, password: String,
                  experienciaPrevia: Bool, patologia: Bool, patologiaTexto: String) async throws {
        struct Body: Encodable {
            let name: String, email: String, phone: String, password: String
            let experienciaPrevia: Bool, patologia: Bool, patologiaTexto: String
        }
        let res: AuthResponse = try await api.request(
            "/auth/register", method: "POST",
            body: Body(name: name, email: email, phone: phone, password: password,
                       experienciaPrevia: experienciaPrevia, patologia: patologia, patologiaTexto: patologiaTexto)
        )
        persist(res)
    }

    func login(email: String, password: String) async throws {
        struct Body: Encodable { let email: String; let password: String }
        let res: AuthResponse = try await api.request("/auth/login", method: "POST", body: Body(email: email, password: password))
        persist(res)
    }

    func refreshMe() async {
        guard api.token != nil else { return }
        if let me: MeResponse = try? await api.request("/auth/me") {
            user = me.user
        }
    }

    func signOut() {
        api.token = nil
        user = nil
        UserDefaults.standard.removeObject(forKey: tokenKey)
    }

    private func persist(_ res: AuthResponse) {
        api.token = res.token
        user = res.user
        UserDefaults.standard.set(res.token, forKey: tokenKey)
    }
}
