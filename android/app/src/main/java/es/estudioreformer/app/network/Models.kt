package es.estudioreformer.app.network

// Field names below match the backend's JSON exactly (see backend/src/routes/*.ts)
// so Gson can map them with no annotations.

// ── Auth ─────────────────────────────────────────────────────────────────

data class PublicUser(
    val id: String,
    val name: String,
    val email: String,
    val phone: String,
    val role: String, // "MEMBER" | "ADMIN"
    val status: String, // "PENDING" | "ACTIVE" | "REJECTED"
    val experienciaPrevia: Boolean,
    val patologia: Boolean,
    val patologiaTexto: String,
    val createdAt: String,
) {
    val isAdmin: Boolean get() = role == "ADMIN"
}

data class AuthResponse(val token: String, val user: PublicUser)
data class MeResponse(val user: PublicUser)

data class RegisterBody(
    val name: String, val email: String, val phone: String, val password: String,
    val experienciaPrevia: Boolean, val patologia: Boolean, val patologiaTexto: String,
)
data class LoginBody(val email: String, val password: String)

// ── Member · Agenda ─────────────────────────────────────────────────────────

data class WeekDay(val date: String, val label: String, val num: String)
data class BonoSummaryLite(val remaining: Int, val cycleLabel: String, val status: String)
data class PendingOffer(val id: String, val sessionId: String, val date: String, val time: String, val className: String, val expiresAt: String)
data class ReminderTomorrow(val time: String, val className: String)

data class SessionRow(
    val id: String,
    val time: String,
    val className: String,
    val coachName: String,
    val capacity: Int,
    val occupied: Int,
    val mine: Boolean,
    val bookingId: String?,
    val waitlisted: Boolean,
    val waitlistEntryId: String?,
    val waitlistPosition: Int?,
    val full: Boolean,
    val estado: String,
    val plazasTxt: String,
)

data class AgendaResponse(
    val date: String,
    val dayLabel: String,
    val closed: Boolean,
    val week: List<WeekDay>,
    val bono: BonoSummaryLite,
    val pendingOffer: PendingOffer?,
    val reminderTomorrow: ReminderTomorrow?,
    val sessions: List<SessionRow>,
)

// ── Member · Bono ────────────────────────────────────────────────────────

data class Movimiento(val tipo: String, val titulo: String, val fecha: String, val delta: String)
data class BonoResponse(val remaining: Int, val cycleLabel: String, val status: String, val movimientos: List<Movimiento>)

// ── Member · Reservas ────────────────────────────────────────────────────

data class ProximaReserva(
    val bookingId: String, val date: String, val dayLabel: String, val time: String,
    val className: String, val coachName: String, val cancelable: Boolean,
    val cancelText: String, val cancelNote: String,
)
data class HistorialItem(val date: String, val dayLabel: String, val className: String, val estado: String)
data class EsperaItem(val entryId: String, val sessionId: String, val date: String, val time: String, val className: String, val position: Int, val total: Int)
data class ReservasResponse(val proximas: List<ProximaReserva>, val historial: List<HistorialItem>, val espera: List<EsperaItem>)

// ── Admin · Agenda ───────────────────────────────────────────────────────

data class AdminSessionRow(
    val id: String, val templateId: String, val time: String, val className: String, val coachName: String,
    val capacity: Int, val occupied: Int, val pct: Int, val vacia: Boolean,
    val attendeeNames: List<String>, val waitlistCount: Int,
)
data class AdminAgendaResponse(val date: String, val dayLabel: String, val closed: Boolean, val sessions: List<AdminSessionRow>)

data class AttendeeSessionInfo(val id: String, val templateId: String, val date: String, val time: String, val className: String, val coachName: String, val capacity: Int)
data class Attendee(val bookingId: String, val userId: String, val nombre: String, val iniciales: String, val bonoTxt: String)
data class EsperaAdminItem(val entryId: String, val nombre: String, val position: Int)
data class AttendeesResponse(val session: AttendeeSessionInfo, val attendees: List<Attendee>, val espera: List<EsperaAdminItem>)

// ── Admin · Class templates (franjas) ───────────────────────────────────

data class ClassTemplate(val id: String, val dayOfWeek: Int, val time: String, val className: String, val coachName: String, val capacity: Int)
data class ClassTemplatesResponse(val templates: List<ClassTemplate>)
data class ClassTemplateResponse(val template: ClassTemplate)
data class ClassTemplateInput(val dayOfWeek: Int, val time: String, val className: String, val coachName: String, val capacity: Int)

// ── Admin · Access requests ──────────────────────────────────────────────

data class AccessRequest(val id: String, val nombre: String, val iniciales: String, val contacto: String, val nota: String)
data class AccessRequestsResponse(val requests: List<AccessRequest>)

// ── Admin · Members ──────────────────────────────────────────────────────

data class MemberSummary(val id: String, val nombre: String, val iniciales: String, val detalle: String, val pendienteRenovar: Boolean, val btnTexto: String)
data class MembersResponse(val members: List<MemberSummary>)

data class BonoHistorySession(val fecha: String, val clase: String)
data class BonoHistoryEntry(val mes: String, val resumen: String, val sesiones: List<BonoHistorySession>, val vacio: Boolean)
data class MemberFicha(
    val id: String, val nombre: String, val iniciales: String, val email: String, val tel: String,
    val alta: String, val estadoBono: String, val experiencia: String, val patologia: String,
    val hayLimitacion: Boolean, val limitacion: String, val resumen: String, val bonos: List<BonoHistoryEntry>,
)

// ── Admin · Bonos overview ───────────────────────────────────────────────

data class PendienteRenovar(val id: String, val nombre: String, val detalle: String)
data class BonosSummaryResponse(val cicloActual: String, val cicloSiguiente: String, val numPendientes: Int, val numRenovados: Int, val pendientes: List<PendienteRenovar>)
data class RenewAllResponse(val renovados: Int)

// ── Admin · Settings ─────────────────────────────────────────────────────

data class ReminderSettings(val reminderEnabled: Boolean, val reminderChannelApp: Boolean, val reminderChannelWhatsapp: Boolean)
data class ReminderSettingsPatch(val reminderEnabled: Boolean? = null, val reminderChannelApp: Boolean? = null, val reminderChannelWhatsapp: Boolean? = null)

// ── Admin · Notifications outbox ─────────────────────────────────────────

data class NotificationRow(val id: String, val channel: String, val message: String, val createdAt: String, val destinatario: String)
data class NotificationsResponse(val notifications: List<NotificationRow>)

// ── Misc ─────────────────────────────────────────────────────────────────

data class OkResponse(val ok: Boolean)
data class BookingIdResponse(val bookingId: String)
data class WaitlistEntryResponse(val entryId: String, val position: Int)
data class ApiErrorBody(val error: String)
