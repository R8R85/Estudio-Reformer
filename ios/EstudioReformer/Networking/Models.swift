import Foundation

// MARK: - Auth

struct PublicUser: Codable, Identifiable {
    let id: String
    let name: String
    let email: String
    let phone: String
    let role: String // "MEMBER" | "ADMIN"
    let status: String // "PENDING" | "ACTIVE" | "REJECTED"
    let experienciaPrevia: Bool
    let patologia: Bool
    let patologiaTexto: String
    let createdAt: String

    var isAdmin: Bool { role == "ADMIN" }
}

struct AuthResponse: Codable {
    let token: String
    let user: PublicUser
}

struct MeResponse: Codable {
    let user: PublicUser
}

// MARK: - Member · Agenda

struct WeekDay: Codable, Identifiable {
    var id: String { date }
    let date: String
    let label: String
    let num: String
}

struct BonoSummaryLite: Codable {
    let remaining: Int
    let cycleLabel: String
    let status: String
}

struct PendingOffer: Codable, Identifiable {
    let id: String
    let sessionId: String
    let date: String
    let time: String
    let className: String
    let expiresAt: String

    var expiresAtDate: Date? { ISO8601Formatting.parse(expiresAt) }
}

struct ReminderTomorrow: Codable {
    let time: String
    let className: String
}

struct SessionRow: Codable, Identifiable {
    let id: String
    let time: String
    let className: String
    let coachName: String
    let capacity: Int
    let occupied: Int
    let mine: Bool
    let bookingId: String?
    let waitlisted: Bool
    let waitlistEntryId: String?
    let waitlistPosition: Int?
    let full: Bool
    let estado: String
    let plazasTxt: String
}

struct AgendaResponse: Codable {
    let date: String
    let dayLabel: String
    let closed: Bool
    let week: [WeekDay]
    let bono: BonoSummaryLite
    let pendingOffer: PendingOffer?
    let reminderTomorrow: ReminderTomorrow?
    let sessions: [SessionRow]
}

// MARK: - Member · Bono

struct Movimiento: Codable, Identifiable {
    var id: String { fecha + titulo }
    let tipo: String
    let titulo: String
    let fecha: String
    let delta: String
}

struct BonoResponse: Codable {
    let remaining: Int
    let cycleLabel: String
    let status: String
    let movimientos: [Movimiento]
}

// MARK: - Member · Reservas

struct ProximaReserva: Codable, Identifiable {
    var id: String { bookingId }
    let bookingId: String
    let date: String
    let dayLabel: String
    let time: String
    let className: String
    let coachName: String
    let cancelable: Bool
    let cancelText: String
    let cancelNote: String
}

struct HistorialItem: Codable, Identifiable {
    var id: String { date + className }
    let date: String
    let dayLabel: String
    let className: String
    let estado: String
}

struct EsperaItem: Codable, Identifiable {
    var id: String { entryId }
    let entryId: String
    let sessionId: String
    let date: String
    let time: String
    let className: String
    let position: Int
    let total: Int
}

struct ReservasResponse: Codable {
    let proximas: [ProximaReserva]
    let historial: [HistorialItem]
    let espera: [EsperaItem]
}

// MARK: - Admin · Agenda

struct AdminSessionRow: Codable, Identifiable {
    let id: String
    let templateId: String
    let time: String
    let className: String
    let coachName: String
    let capacity: Int
    let occupied: Int
    let pct: Int
    let vacia: Bool
    let attendeeNames: [String]
    let waitlistCount: Int
}

struct AdminAgendaResponse: Codable {
    let date: String
    let dayLabel: String
    let closed: Bool
    let sessions: [AdminSessionRow]
}

struct AttendeeSessionInfo: Codable {
    let id: String
    let templateId: String
    let date: String
    let time: String
    let className: String
    let coachName: String
    let capacity: Int
}

struct Attendee: Codable, Identifiable {
    var id: String { bookingId }
    let bookingId: String
    let userId: String
    let nombre: String
    let iniciales: String
    let bonoTxt: String
}

struct EsperaAdminItem: Codable, Identifiable {
    var id: String { entryId }
    let entryId: String
    let nombre: String
    let position: Int
}

struct AttendeesResponse: Codable {
    let session: AttendeeSessionInfo
    let attendees: [Attendee]
    let espera: [EsperaAdminItem]
}

// MARK: - Admin · Class templates (franjas)

struct ClassTemplate: Codable, Identifiable {
    let id: String
    let dayOfWeek: Int
    let time: String
    let className: String
    let coachName: String
    let capacity: Int
}

struct ClassTemplatesResponse: Codable { let templates: [ClassTemplate] }
struct ClassTemplateResponse: Codable { let template: ClassTemplate }

struct ClassTemplateInput: Codable {
    var dayOfWeek: Int
    var time: String
    var className: String
    var coachName: String
    var capacity: Int
}

// MARK: - Admin · Access requests

struct AccessRequest: Codable, Identifiable {
    let id: String
    let nombre: String
    let iniciales: String
    let contacto: String
    let nota: String
}

struct AccessRequestsResponse: Codable { let requests: [AccessRequest] }

// MARK: - Admin · Members

struct MemberSummary: Codable, Identifiable {
    let id: String
    let nombre: String
    let iniciales: String
    let detalle: String
    let pendienteRenovar: Bool
    let btnTexto: String
}

struct MembersResponse: Codable { let members: [MemberSummary] }

struct BonoHistorySession: Codable, Identifiable {
    var id: String { fecha + clase }
    let fecha: String
    let clase: String
}

struct BonoHistoryEntry: Codable, Identifiable {
    var id: String { mes }
    let mes: String
    let resumen: String
    let sesiones: [BonoHistorySession]
    let vacio: Bool
}

struct MemberFicha: Codable, Identifiable {
    let id: String
    let nombre: String
    let iniciales: String
    let email: String
    let tel: String
    let alta: String
    let estadoBono: String
    let experiencia: String
    let patologia: String
    let hayLimitacion: Bool
    let limitacion: String
    let resumen: String
    let bonos: [BonoHistoryEntry]
}

// MARK: - Admin · Bonos overview

struct PendienteRenovar: Codable, Identifiable {
    let id: String
    let nombre: String
    let detalle: String
}

struct BonosSummaryResponse: Codable {
    let cicloActual: String
    let cicloSiguiente: String
    let numPendientes: Int
    let numRenovados: Int
    let pendientes: [PendienteRenovar]
}

// MARK: - Admin · Settings

struct ReminderSettings: Codable {
    let reminderEnabled: Bool
    let reminderChannelApp: Bool
    let reminderChannelWhatsapp: Bool
}

// MARK: - Admin · Notifications outbox

struct NotificationRow: Codable, Identifiable {
    let id: String
    let channel: String
    let message: String
    let createdAt: String
    let destinatario: String
}

struct NotificationsResponse: Codable { let notifications: [NotificationRow] }

// MARK: - Misc

struct OkResponse: Codable { let ok: Bool }
struct BookingIdResponse: Codable { let bookingId: String }
struct WaitlistEntryResponse: Codable { let entryId: String; let position: Int }
struct ApiErrorBody: Codable { let error: String }

enum ISO8601Formatting {
    static let formatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
    static let fallback: ISO8601DateFormatter = ISO8601DateFormatter()

    static func parse(_ s: String) -> Date? {
        formatter.date(from: s) ?? fallback.date(from: s)
    }
}
