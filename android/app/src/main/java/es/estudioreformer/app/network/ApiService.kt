package es.estudioreformer.app.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

/** One suspend function per backend route (backend/src/routes/*.ts) — every
 * response comes back wrapped in [Response] so [unwrap] can surface the
 * server's `{error}` body on a non-2xx instead of a generic HTTP exception. */
interface ApiService {
    @POST("auth/register") suspend fun register(@Body body: RegisterBody): Response<AuthResponse>
    @POST("auth/login") suspend fun login(@Body body: LoginBody): Response<AuthResponse>
    @GET("auth/me") suspend fun me(): Response<MeResponse>

    @GET("member/agenda") suspend fun agenda(@Query("date") date: String?): Response<AgendaResponse>
    @GET("member/bono") suspend fun bono(): Response<BonoResponse>
    @GET("member/reservas") suspend fun reservas(): Response<ReservasResponse>
    @POST("member/sessions/{id}/book") suspend fun book(@Path("id") id: String): Response<BookingIdResponse>
    @POST("member/bookings/{id}/cancel") suspend fun cancelBooking(@Path("id") id: String): Response<OkResponse>
    @POST("member/sessions/{id}/waitlist") suspend fun joinWaitlist(@Path("id") id: String): Response<WaitlistEntryResponse>
    @DELETE("member/waitlist/{id}") suspend fun leaveWaitlist(@Path("id") id: String): Response<OkResponse>
    @POST("member/offers/{id}/accept") suspend fun acceptOffer(@Path("id") id: String): Response<BookingIdResponse>
    @POST("member/offers/{id}/decline") suspend fun declineOffer(@Path("id") id: String): Response<OkResponse>

    @GET("admin/agenda") suspend fun adminAgenda(@Query("date") date: String?): Response<AdminAgendaResponse>
    @GET("admin/sessions/{id}/attendees") suspend fun attendees(@Path("id") id: String): Response<AttendeesResponse>
    @POST("admin/bookings/{id}/release") suspend fun releaseBooking(@Path("id") id: String): Response<OkResponse>
    @GET("admin/class-templates") suspend fun classTemplates(): Response<ClassTemplatesResponse>
    @POST("admin/class-templates") suspend fun createClassTemplate(@Body input: ClassTemplateInput): Response<ClassTemplateResponse>
    @PUT("admin/class-templates/{id}") suspend fun updateClassTemplate(@Path("id") id: String, @Body input: ClassTemplateInput): Response<ClassTemplateResponse>
    @DELETE("admin/class-templates/{id}") suspend fun deleteClassTemplate(@Path("id") id: String): Response<OkResponse>
    @GET("admin/access-requests") suspend fun accessRequests(): Response<AccessRequestsResponse>
    @POST("admin/access-requests/{id}/approve") suspend fun approveRequest(@Path("id") id: String): Response<OkResponse>
    @POST("admin/access-requests/{id}/reject") suspend fun rejectRequest(@Path("id") id: String): Response<OkResponse>
    @GET("admin/members") suspend fun members(@Query("query") query: String?): Response<MembersResponse>
    @GET("admin/members/{id}") suspend fun memberFicha(@Path("id") id: String): Response<MemberFicha>
    @POST("admin/members/{id}/renew") suspend fun renewMember(@Path("id") id: String): Response<OkResponse>
    @GET("admin/bonos/summary") suspend fun bonosSummary(): Response<BonosSummaryResponse>
    @POST("admin/bonos/renew-all") suspend fun renewAllPending(): Response<RenewAllResponse>
    @GET("admin/settings/reminders") suspend fun reminderSettings(): Response<ReminderSettings>
    @PUT("admin/settings/reminders") suspend fun updateReminderSettings(@Body patch: ReminderSettingsPatch): Response<ReminderSettings>
    @GET("admin/notifications") suspend fun notifications(): Response<NotificationsResponse>
}
