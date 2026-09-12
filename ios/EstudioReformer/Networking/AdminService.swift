import Foundation

/// Every call the admin-facing screens (Agenda / Socios / Bonos + sheets)
/// make against `/admin/*`.
extension APIClient {
    func adminAgenda(date: String? = nil) async throws -> AdminAgendaResponse {
        try await request("/admin/agenda", query: date.map { ["date": $0] } ?? [:])
    }

    func attendees(sessionId: String) async throws -> AttendeesResponse {
        try await request("/admin/sessions/\(sessionId)/attendees")
    }

    @discardableResult
    func releaseBooking(bookingId: String) async throws -> OkResponse {
        try await request("/admin/bookings/\(bookingId)/release", method: "POST")
    }

    func classTemplates() async throws -> [ClassTemplate] {
        let res: ClassTemplatesResponse = try await request("/admin/class-templates")
        return res.templates
    }

    @discardableResult
    func createClassTemplate(_ input: ClassTemplateInput) async throws -> ClassTemplate {
        let res: ClassTemplateResponse = try await request("/admin/class-templates", method: "POST", body: input)
        return res.template
    }

    @discardableResult
    func updateClassTemplate(id: String, _ input: ClassTemplateInput) async throws -> ClassTemplate {
        let res: ClassTemplateResponse = try await request("/admin/class-templates/\(id)", method: "PUT", body: input)
        return res.template
    }

    @discardableResult
    func deleteClassTemplate(id: String) async throws -> OkResponse {
        try await request("/admin/class-templates/\(id)", method: "DELETE")
    }

    func accessRequests() async throws -> [AccessRequest] {
        let res: AccessRequestsResponse = try await request("/admin/access-requests")
        return res.requests
    }

    @discardableResult
    func approveRequest(id: String) async throws -> OkResponse {
        try await request("/admin/access-requests/\(id)/approve", method: "POST")
    }

    @discardableResult
    func rejectRequest(id: String) async throws -> OkResponse {
        try await request("/admin/access-requests/\(id)/reject", method: "POST")
    }

    func members(query: String = "") async throws -> [MemberSummary] {
        let res: MembersResponse = try await request("/admin/members", query: query.isEmpty ? [:] : ["query": query])
        return res.members
    }

    func memberFicha(id: String) async throws -> MemberFicha {
        try await request("/admin/members/\(id)")
    }

    @discardableResult
    func renewMember(id: String) async throws -> OkResponse {
        try await request("/admin/members/\(id)/renew", method: "POST")
    }

    func bonosSummary() async throws -> BonosSummaryResponse {
        try await request("/admin/bonos/summary")
    }

    @discardableResult
    func renewAllPending() async throws -> Int {
        struct Res: Decodable { let renovados: Int }
        let res: Res = try await request("/admin/bonos/renew-all", method: "POST")
        return res.renovados
    }

    func reminderSettings() async throws -> ReminderSettings {
        try await request("/admin/settings/reminders")
    }

    @discardableResult
    func updateReminderSettings(_ patch: [String: Bool]) async throws -> ReminderSettings {
        struct Body: Encodable { let reminderEnabled: Bool?; let reminderChannelApp: Bool?; let reminderChannelWhatsapp: Bool? }
        let body = Body(
            reminderEnabled: patch["reminderEnabled"],
            reminderChannelApp: patch["reminderChannelApp"],
            reminderChannelWhatsapp: patch["reminderChannelWhatsapp"]
        )
        return try await request("/admin/settings/reminders", method: "PUT", body: body)
    }

    func notifications() async throws -> [NotificationRow] {
        let res: NotificationsResponse = try await request("/admin/notifications")
        return res.notifications
    }
}
