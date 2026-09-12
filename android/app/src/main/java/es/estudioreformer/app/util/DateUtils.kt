package es.estudioreformer.app.util

import java.time.LocalDate
import java.time.format.DateTimeFormatter

/**
 * Small client-side mirror of the backend's date helpers (services/sessions.ts)
 * — just enough to drive the day-strip UI locally without a round trip for
 * every date the user taps. The server remains the source of truth for
 * which day is actually shown/booked.
 */
object DateUtils {
    private val iso: DateTimeFormatter = DateTimeFormatter.ISO_LOCAL_DATE
    private val labels = listOf("dom", "lun", "mar", "mié", "jue", "vie", "sáb")

    fun todayISO(): String = LocalDate.now().format(iso)

    fun addDays(date: String, n: Long): String = LocalDate.parse(date, iso).plusDays(n).format(iso)

    /** 0 = Sunday … 6 = Saturday (matches the backend's JS Date#getDay convention). */
    fun dayOfWeek(date: String): Int = LocalDate.parse(date, iso).dayOfWeek.value % 7

    fun weekDates(date: String): List<String> {
        val dow = dayOfWeek(date)
        val mondayOffset = if (dow == 0) -6L else (1 - dow).toLong()
        val monday = addDays(date, mondayOffset)
        return (0 until 7).map { addDays(monday, it.toLong()) }
    }

    fun label(date: String): String = labels[dayOfWeek(date)]
    fun dayNum(date: String): String = date.takeLast(2)
}
