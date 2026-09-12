import Foundation

enum AppConfig {
    /// Simulator + backend on the same Mac: `localhost` works as-is (the iOS
    /// Simulator shares the host's network stack). On a physical device,
    /// change this to `http://<your-Mac's-LAN-IP>:4000` — see ../../README.md.
    static let defaultBaseURL = "http://localhost:4000"

    static var baseURL: String {
        get { UserDefaults.standard.string(forKey: "api_base_url") ?? defaultBaseURL }
        set { UserDefaults.standard.set(newValue, forKey: "api_base_url") }
    }
}

struct APIError: Error, LocalizedError {
    let message: String
    var errorDescription: String? { message }
}

/// Thin async/await wrapper over URLSession. Not a singleton on purpose —
/// `AppSession` owns one instance and keeps its bearer token in sync with
/// whoever is logged in.
final class APIClient {
    var token: String?

    private let decoder: JSONDecoder = JSONDecoder()
    private let encoder: JSONEncoder = JSONEncoder()

    func request<Response: Decodable>(
        _ path: String,
        method: String = "GET",
        query: [String: String] = [:],
        body: Encodable? = nil
    ) async throws -> Response {
        var components = URLComponents(string: AppConfig.baseURL + path)!
        if !query.isEmpty {
            components.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
        }
        var req = URLRequest(url: components.url!)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        if let token {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try encoder.encode(AnyEncodable(body))
        }

        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw APIError(message: "Respuesta inválida del servidor")
        }
        guard (200...299).contains(http.statusCode) else {
            if let err = try? decoder.decode(ApiErrorBody.self, from: data) {
                throw APIError(message: err.error)
            }
            throw APIError(message: "Error del servidor (\(http.statusCode))")
        }
        if Response.self == OkResponse.self, data.isEmpty {
            // Some 200s (e.g. after DELETE) might come back empty; treat as ok.
            return OkResponse(ok: true) as! Response
        }
        do {
            return try decoder.decode(Response.self, from: data)
        } catch {
            throw APIError(message: "No se pudo interpretar la respuesta del servidor")
        }
    }
}

/// Type-erasing box so `request(body:)` can accept any Encodable without the
/// call sites needing generics.
private struct AnyEncodable: Encodable {
    private let encodeClosure: (Encoder) throws -> Void
    init(_ wrapped: Encodable) { encodeClosure = wrapped.encode }
    func encode(to encoder: Encoder) throws { try encodeClosure(encoder) }
}
