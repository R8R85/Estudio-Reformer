import Foundation

/// Every call the member-facing screens (Agenda / Mi bono / Mis reservas)
/// make against `/member/*`.
extension APIClient {
    func agenda(date: String? = nil) async throws -> AgendaResponse {
        try await request("/member/agenda", query: date.map { ["date": $0] } ?? [:])
    }

    func bono() async throws -> BonoResponse {
        try await request("/member/bono")
    }

    func reservas() async throws -> ReservasResponse {
        try await request("/member/reservas")
    }

    @discardableResult
    func book(sessionId: String) async throws -> BookingIdResponse {
        try await request("/member/sessions/\(sessionId)/book", method: "POST")
    }

    @discardableResult
    func cancelBooking(bookingId: String) async throws -> OkResponse {
        try await request("/member/bookings/\(bookingId)/cancel", method: "POST")
    }

    @discardableResult
    func joinWaitlist(sessionId: String) async throws -> WaitlistEntryResponse {
        try await request("/member/sessions/\(sessionId)/waitlist", method: "POST")
    }

    @discardableResult
    func leaveWaitlist(entryId: String) async throws -> OkResponse {
        try await request("/member/waitlist/\(entryId)", method: "DELETE")
    }

    @discardableResult
    func acceptOffer(id: String) async throws -> BookingIdResponse {
        try await request("/member/offers/\(id)/accept", method: "POST")
    }

    @discardableResult
    func declineOffer(id: String) async throws -> OkResponse {
        try await request("/member/offers/\(id)/decline", method: "POST")
    }
}
