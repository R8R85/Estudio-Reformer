// Thin typed fetch client for the NEXOESTUDIO backend. Mirrors the same API
// surface the iOS/Android apps talk to — see backend/src/routes/*.ts.
//
// VITE_API_URL points at the running backend; defaults to localhost:4000 for
// local development. Once the backend has a real domain, set this env var
// (or the value persisted via setApiBaseUrl) to that domain instead.

const DEFAULT_BASE_URL = 'http://localhost:4000';
const STORAGE_KEY_BASE_URL = 'nexo_api_base_url';
const STORAGE_KEY_TOKEN = 'nexo_token';

export function getApiBaseUrl(): string {
  return localStorage.getItem(STORAGE_KEY_BASE_URL) || (import.meta.env.VITE_API_URL as string) || DEFAULT_BASE_URL;
}

export function setApiBaseUrl(url: string) {
  localStorage.setItem(STORAGE_KEY_BASE_URL, url);
}

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(STORAGE_KEY_TOKEN, token);
  else localStorage.removeItem(STORAGE_KEY_TOKEN);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, opts: { method?: string; body?: unknown; query?: Record<string, string> } = {}): Promise<T> {
  const url = new URL(getApiBaseUrl() + path);
  if (opts.query) Object.entries(opts.query).forEach(([k, v]) => url.searchParams.set(k, v));

  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(url.toString(), {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const isEmpty = res.status === 204;
  const data = isEmpty ? {} : await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string }).error || `Error del servidor (${res.status})`);
  }
  return data as T;
}

// ── Types (mirrors backend/src/routes/*.ts response shapes) ───────────────

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'MEMBER' | 'ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  experienciaPrevia: boolean;
  patologia: boolean;
  patologiaTexto: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

export interface StudioInfo {
  name: string;
  location: string;
}

export interface WeekDay { date: string; label: string; num: string }
export interface BonoSummaryLite { remaining: number; cycleLabel: string; status: 'Activo' | 'Agotado' }
export interface PendingOffer { id: string; sessionId: string; date: string; time: string; className: string; expiresAt: string }
export interface ReminderTomorrow { time: string; className: string }

export interface SessionRow {
  id: string; time: string; className: string; coachName: string; capacity: number; occupied: number;
  mine: boolean; bookingId: string | null; waitlisted: boolean; waitlistEntryId: string | null;
  waitlistPosition: number | null; full: boolean; estado: string; plazasTxt: string;
}

export interface AgendaResponse {
  date: string; dayLabel: string; closed: boolean; week: WeekDay[]; bono: BonoSummaryLite;
  pendingOffer: PendingOffer | null; reminderTomorrow: ReminderTomorrow | null; sessions: SessionRow[];
}

export interface Movimiento { tipo: string; titulo: string; fecha: string; delta: string }
export interface BonoResponse { remaining: number; cycleLabel: string; status: string; movimientos: Movimiento[] }

export interface ProximaReserva {
  bookingId: string; date: string; dayLabel: string; time: string; className: string; coachName: string;
  cancelable: boolean; cancelText: string; cancelNote: string;
}
export interface HistorialItem { date: string; dayLabel: string; className: string; estado: string }
export interface EsperaItem { entryId: string; sessionId: string; date: string; time: string; className: string; position: number; total: number }
export interface ReservasResponse { proximas: ProximaReserva[]; historial: HistorialItem[]; espera: EsperaItem[] }

export interface AdminSessionRow {
  id: string; templateId: string; time: string; className: string; coachName: string; capacity: number;
  occupied: number; pct: number; vacia: boolean; attendeeNames: string[]; waitlistCount: number;
}
export interface AdminAgendaResponse { date: string; dayLabel: string; closed: boolean; sessions: AdminSessionRow[] }

export interface Attendee { bookingId: string; userId: string; nombre: string; iniciales: string; bonoTxt: string }
export interface EsperaAdminItem { entryId: string; nombre: string; position: number }
export interface AttendeesResponse {
  session: { id: string; templateId: string; date: string; time: string; className: string; coachName: string; capacity: number };
  attendees: Attendee[]; espera: EsperaAdminItem[];
}

export interface ClassTemplate { id: string; dayOfWeek: number; time: string; className: string; coachName: string; capacity: number }

export interface AccessRequest { id: string; nombre: string; iniciales: string; contacto: string; nota: string }

export interface MemberSummary { id: string; nombre: string; iniciales: string; detalle: string; pendienteRenovar: boolean; btnTexto: string }

export interface BonoHistorySession { fecha: string; clase: string }
export interface BonoHistoryEntry { mes: string; resumen: string; sesiones: BonoHistorySession[]; vacio: boolean }
export interface MemberFicha {
  id: string; nombre: string; iniciales: string; email: string; tel: string; alta: string; estadoBono: string;
  experiencia: string; patologia: string; hayLimitacion: boolean; limitacion: string; resumen: string; bonos: BonoHistoryEntry[];
}

export interface PendienteRenovar { id: string; nombre: string; detalle: string }
export interface BonosSummaryResponse { cicloActual: string; cicloSiguiente: string; numPendientes: number; numRenovados: number; pendientes: PendienteRenovar[] }

export interface ReminderSettings { reminderEnabled: boolean; reminderChannelApp: boolean; reminderChannelWhatsapp: boolean }

export interface BillingStatus {
  plan: string; subscriptionStatus: string; trialEndsAt: string | null; planMemberLimit: number;
  planWhatsappEnabled: boolean; planMultiSede: boolean; hasStripeCustomer: boolean;
}

export interface NotificationRow { id: string; channel: string; message: string; createdAt: string; destinatario: string }

// ── Public ───────────────────────────────────────────────────────────────

export const getStudio = (code: string) => request<StudioInfo>('/studio', { query: { code } });

// ── Auth ─────────────────────────────────────────────────────────────────

export const login = (studioCode: string, email: string, password: string) =>
  request<AuthResponse>('/auth/login', { method: 'POST', body: { studioCode, email, password } });

export const register = (body: {
  studioCode: string; name: string; email: string; phone: string; password: string;
  experienciaPrevia: boolean; patologia: boolean; patologiaTexto: string;
}) => request<AuthResponse>('/auth/register', { method: 'POST', body });

export const me = () => request<{ user: PublicUser }>('/auth/me');

// ── Member ───────────────────────────────────────────────────────────────

export const getAgenda = (date: string) => request<AgendaResponse>('/member/agenda', { query: { date } });
export const getBono = () => request<BonoResponse>('/member/bono');
export const getReservas = () => request<ReservasResponse>('/member/reservas');
export const bookSession = (sessionId: string) => request<{ bookingId: string }>(`/member/sessions/${sessionId}/book`, { method: 'POST' });
export const cancelBooking = (bookingId: string) => request<{ ok: boolean }>(`/member/bookings/${bookingId}/cancel`, { method: 'POST' });
export const joinWaitlist = (sessionId: string) => request<{ entryId: string; position: number }>(`/member/sessions/${sessionId}/waitlist`, { method: 'POST' });
export const leaveWaitlist = (entryId: string) => request<{ ok: boolean }>(`/member/waitlist/${entryId}`, { method: 'DELETE' });
export const acceptOffer = (offerId: string) => request<{ bookingId: string }>(`/member/offers/${offerId}/accept`, { method: 'POST' });
export const declineOffer = (offerId: string) => request<{ ok: boolean }>(`/member/offers/${offerId}/decline`, { method: 'POST' });

// ── Admin ────────────────────────────────────────────────────────────────

export const getAdminAgenda = (date: string) => request<AdminAgendaResponse>('/admin/agenda', { query: { date } });
export const getAttendees = (sessionId: string) => request<AttendeesResponse>(`/admin/sessions/${sessionId}/attendees`);
export const releaseBooking = (bookingId: string) => request<{ ok: boolean }>(`/admin/bookings/${bookingId}/release`, { method: 'POST' });

export const getClassTemplates = () => request<{ templates: ClassTemplate[] }>('/admin/class-templates');
export const createClassTemplate = (body: Omit<ClassTemplate, 'id'>) => request<{ template: ClassTemplate }>('/admin/class-templates', { method: 'POST', body });
export const updateClassTemplate = (id: string, body: Partial<Omit<ClassTemplate, 'id'>>) => request<{ template: ClassTemplate }>(`/admin/class-templates/${id}`, { method: 'PUT', body });
export const deleteClassTemplate = (id: string) => request<{ ok: boolean }>(`/admin/class-templates/${id}`, { method: 'DELETE' });

export const getAccessRequests = () => request<{ requests: AccessRequest[] }>('/admin/access-requests');
export const approveAccessRequest = (id: string) => request<{ ok: boolean }>(`/admin/access-requests/${id}/approve`, { method: 'POST' });
export const rejectAccessRequest = (id: string) => request<{ ok: boolean }>(`/admin/access-requests/${id}/reject`, { method: 'POST' });

export const getMembers = (query = '') => request<{ members: MemberSummary[] }>('/admin/members', { query: query ? { query } : undefined });
export const getMemberFicha = (id: string) => request<MemberFicha>(`/admin/members/${id}`);
export const renewMember = (id: string) => request<{ ok: boolean }>(`/admin/members/${id}/renew`, { method: 'POST' });

export const getBonosSummary = () => request<BonosSummaryResponse>('/admin/bonos/summary');
export const renewAllPending = () => request<{ renovados: number }>('/admin/bonos/renew-all', { method: 'POST' });
export const advanceCycle = () => request<{ settings: unknown }>('/admin/cycle/advance', { method: 'POST' });

export const getReminderSettings = () => request<ReminderSettings>('/admin/settings/reminders');
export const updateReminderSettings = (body: Partial<ReminderSettings>) => request<ReminderSettings>('/admin/settings/reminders', { method: 'PUT', body });

export const getNotifications = () => request<{ notifications: NotificationRow[] }>('/admin/notifications');

export const getBillingStatus = () => request<BillingStatus>('/admin/billing');
export const startCheckout = (plan: 'SOLO' | 'ESTUDIO' | 'CADENA') => request<{ url: string }>('/admin/billing/checkout', { method: 'POST', body: { plan } });
export const openBillingPortal = () => request<{ url: string }>('/admin/billing/portal', { method: 'POST' });
