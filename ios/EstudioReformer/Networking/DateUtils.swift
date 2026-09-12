import Foundation

/// Small client-side mirror of the backend's date helpers (services/sessions.ts)
/// — just enough to drive the day-strip UI locally without a round trip for
/// every date the user taps. The server remains the source of truth for
/// which day is actually shown/booked.
enum DateUtils {
    private static var utcCalendar: Calendar = {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "UTC")!
        return cal
    }()

    static func todayISO() -> String { iso(from: Date()) }

    static func iso(from date: Date) -> String {
        let c = utcCalendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", c.year!, c.month!, c.day!)
    }

    private static func date(from iso: String) -> Date {
        let parts = iso.split(separator: "-").compactMap { Int($0) }
        var c = DateComponents()
        c.year = parts[0]; c.month = parts[1]; c.day = parts[2]
        return utcCalendar.date(from: c)!
    }

    static func addDays(_ iso: String, _ n: Int) -> String {
        iso(from: utcCalendar.date(byAdding: .day, value: n, to: date(from: iso))!)
    }

    /// 0 = Sunday … 6 = Saturday (matches JS Date#getDay, and the backend's convention).
    static func dayOfWeek(_ iso: String) -> Int {
        utcCalendar.component(.weekday, from: date(from: iso)) - 1
    }

    static func weekDates(containing iso: String) -> [String] {
        let dow = dayOfWeek(iso)
        let mondayOffset = dow == 0 ? -6 : 1 - dow
        let monday = addDays(iso, mondayOffset)
        return (0..<7).map { addDays(monday, $0) }
    }

    private static let labels = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]
    static func label(_ iso: String) -> String { labels[dayOfWeek(iso)] }
    static func dayNum(_ iso: String) -> String { String(iso.suffix(2)) }
}
