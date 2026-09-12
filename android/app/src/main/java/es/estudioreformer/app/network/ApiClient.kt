package es.estudioreformer.app.network

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class ApiException(message: String) : Exception(message)

/** Base URL config, persisted so it survives process death (handy when
 * pointing a physical device at your Mac/PC's LAN IP instead of the
 * emulator default). Call [AppConfig.init] once, e.g. from `Application`. */
object AppConfig {
    /**
     * The Android *emulator* does not share the host machine's network
     * stack the way the iOS Simulator does — `10.0.2.2` is the emulator's
     * documented alias for the host's `localhost`. On a physical device,
     * change this to `http://<your-computer's-LAN-IP>:4000` (see ../../README.md).
     */
    const val DEFAULT_BASE_URL = "http://10.0.2.2:4000"

    private lateinit var prefs: SharedPreferences

    fun init(context: Context) {
        prefs = context.applicationContext.getSharedPreferences("config", Context.MODE_PRIVATE)
    }

    var baseUrl: String
        get() = prefs.getString("api_base_url", DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
        set(value) = prefs.edit().putString("api_base_url", value).apply()
}

/** Thin wrapper over Retrofit — one typed suspend function per backend
 * route, all funneling non-2xx responses through [unwrap] so callers get a
 * plain [ApiException] with the server's own Spanish error message. */
class ApiClient {
    var token: String? = null

    private val gson = Gson()

    private val authInterceptor = Interceptor { chain ->
        val request = chain.request().newBuilder().apply {
            token?.let { addHeader("Authorization", "Bearer $it") }
            addHeader("Accept", "application/json")
        }.build()
        chain.proceed(request)
    }

    // Rebuilt lazily against whatever AppConfig.baseUrl currently is — cheap
    // enough for a settings value that changes maybe once per dev session.
    private fun retrofit(): Retrofit {
        val client = OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC })
            .build()
        return Retrofit.Builder()
            .baseUrl(AppConfig.baseUrl.trimEnd('/') + "/")
            .client(client)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }

    val service: ApiService by lazy { retrofit().create(ApiService::class.java) }

    private fun <T> Response<T>.unwrap(): T {
        if (isSuccessful) return body() ?: throw ApiException("Respuesta vacía del servidor")
        val raw = errorBody()?.string()
        val message = try {
            raw?.let { gson.fromJson(it, ApiErrorBody::class.java)?.error }
        } catch (e: Exception) { null } ?: "Error del servidor (${code()})"
        throw ApiException(message)
    }

    // ── Auth ─────────────────────────────────────────────────────────────

    suspend fun register(body: RegisterBody): AuthResponse = service.register(body).unwrap()
    suspend fun login(body: LoginBody): AuthResponse = service.login(body).unwrap()
    suspend fun me(): MeResponse = service.me().unwrap()

    // ── Member ───────────────────────────────────────────────────────────

    suspend fun agenda(date: String? = null): AgendaResponse = service.agenda(date).unwrap()
    suspend fun bono(): BonoResponse = service.bono().unwrap()
    suspend fun reservas(): ReservasResponse = service.reservas().unwrap()
    suspend fun book(sessionId: String): BookingIdResponse = service.book(sessionId).unwrap()
    suspend fun cancelBooking(bookingId: String): OkResponse = service.cancelBooking(bookingId).unwrap()
    suspend fun joinWaitlist(sessionId: String): WaitlistEntryResponse = service.joinWaitlist(sessionId).unwrap()
    suspend fun leaveWaitlist(entryId: String): OkResponse = service.leaveWaitlist(entryId).unwrap()
    suspend fun acceptOffer(id: String): BookingIdResponse = service.acceptOffer(id).unwrap()
    suspend fun declineOffer(id: String): OkResponse = service.declineOffer(id).unwrap()

    // ── Admin ────────────────────────────────────────────────────────────

    suspend fun adminAgenda(date: String? = null): AdminAgendaResponse = service.adminAgenda(date).unwrap()
    suspend fun attendees(sessionId: String): AttendeesResponse = service.attendees(sessionId).unwrap()
    suspend fun releaseBooking(bookingId: String): OkResponse = service.releaseBooking(bookingId).unwrap()
    suspend fun classTemplates(): List<ClassTemplate> = service.classTemplates().unwrap().templates
    suspend fun createClassTemplate(input: ClassTemplateInput): ClassTemplate = service.createClassTemplate(input).unwrap().template
    suspend fun updateClassTemplate(id: String, input: ClassTemplateInput): ClassTemplate = service.updateClassTemplate(id, input).unwrap().template
    suspend fun deleteClassTemplate(id: String): OkResponse = service.deleteClassTemplate(id).unwrap()
    suspend fun accessRequests(): List<AccessRequest> = service.accessRequests().unwrap().requests
    suspend fun approveRequest(id: String): OkResponse = service.approveRequest(id).unwrap()
    suspend fun rejectRequest(id: String): OkResponse = service.rejectRequest(id).unwrap()
    suspend fun members(query: String = ""): List<MemberSummary> = service.members(query.ifBlank { null }).unwrap().members
    suspend fun memberFicha(id: String): MemberFicha = service.memberFicha(id).unwrap()
    suspend fun renewMember(id: String): OkResponse = service.renewMember(id).unwrap()
    suspend fun bonosSummary(): BonosSummaryResponse = service.bonosSummary().unwrap()
    suspend fun renewAllPending(): Int = service.renewAllPending().unwrap().renovados
    suspend fun reminderSettings(): ReminderSettings = service.reminderSettings().unwrap()
    suspend fun updateReminderSettings(patch: ReminderSettingsPatch): ReminderSettings = service.updateReminderSettings(patch).unwrap()
    suspend fun notifications(): List<NotificationRow> = service.notifications().unwrap().notifications
}
