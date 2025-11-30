import { supabase } from '@/integrations/supabase/client';

// Use untyped supabase client for new tables
const untypedSupabase = supabase as any;

export interface ConsultationType {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
  color?: string;
  is_active: boolean;
}

export interface AvailabilitySetting {
  id?: string;
  user_id?: string;
  day_of_week: number; // 0-6, Sunday = 0
  start_time: string; // HH:MM format
  end_time: string;
  is_available: boolean;
}

export interface UnavailableDate {
  id?: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  reason?: string;
}

export interface Consultation {
  id?: string;
  consultant_id?: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  consultation_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  consultation_type?: string;
  notes?: string;
  meeting_link?: string;
  reminder_sent?: boolean;
  created_at?: string;
  updated_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  consultation?: Consultation;
}

// ============= CONSULTATION TYPES =============

export async function getConsultationTypes(): Promise<ConsultationType[]> {
  const { data, error } = await untypedSupabase
    .from('consultation_types')
    .select('*')
    .eq('is_active', true)
    .order('duration_minutes');

  if (error) throw error;
  return data || [];
}

export async function createConsultationType(type: Omit<ConsultationType, 'id'>): Promise<ConsultationType> {
  const { data, error } = await untypedSupabase
    .from('consultation_types')
    .insert(type)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============= AVAILABILITY SETTINGS =============

export async function getAvailabilitySettings(userId?: string): Promise<AvailabilitySetting[]> {
  let query = untypedSupabase
    .from('availability_settings')
    .select('*')
    .order('day_of_week')
    .order('start_time');

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function setAvailability(settings: AvailabilitySetting[]): Promise<void> {
  // Xóa settings cũ
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  await untypedSupabase
    .from('availability_settings')
    .delete()
    .eq('user_id', user.id);

  // Thêm settings mới
  const settingsWithUserId = settings.map(s => ({
    ...s,
    user_id: user.id
  }));

  const { error } = await untypedSupabase
    .from('availability_settings')
    .insert(settingsWithUserId);

  if (error) throw error;
}

// ============= UNAVAILABLE DATES =============

export async function getUnavailableDates(userId?: string): Promise<UnavailableDate[]> {
  let query = untypedSupabase
    .from('unavailable_dates')
    .select('*')
    .order('date');

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function addUnavailableDate(date: string, reason?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await untypedSupabase
    .from('unavailable_dates')
    .insert({
      user_id: user.id,
      date,
      reason
    });

  if (error) throw error;
}

export async function removeUnavailableDate(id: string): Promise<void> {
  const { error } = await untypedSupabase
    .from('unavailable_dates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============= CONSULTATIONS =============

export async function getConsultations(filters?: {
  consultant_id?: string;
  client_email?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
}): Promise<Consultation[]> {
  let query = untypedSupabase
    .from('consultations')
    .select('*')
    .order('consultation_date')
    .order('start_time');

  if (filters?.consultant_id) {
    query = query.eq('consultant_id', filters.consultant_id);
  }
  if (filters?.client_email) {
    query = query.eq('client_email', filters.client_email);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.from_date) {
    query = query.gte('consultation_date', filters.from_date);
  }
  if (filters?.to_date) {
    query = query.lte('consultation_date', filters.to_date);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getConsultationById(id: string): Promise<Consultation | null> {
  const { data, error } = await untypedSupabase
    .from('consultations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createConsultation(consultation: Omit<Consultation, 'id'>): Promise<Consultation> {
  const { data, error } = await untypedSupabase
    .from('consultations')
    .insert(consultation)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateConsultation(id: string, updates: Partial<Consultation>): Promise<Consultation> {
  const { data, error } = await untypedSupabase
    .from('consultations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function cancelConsultation(id: string, reason?: string): Promise<void> {
  await updateConsultation(id, {
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancellation_reason: reason
  });
}

// ============= AVAILABILITY CHECK =============

export async function getAvailableTimeSlots(
  consultantId: string,
  date: string,
  durationMinutes: number
): Promise<TimeSlot[]> {
  const dayOfWeek = new Date(date).getDay();

  // Lấy availability settings cho ngày đó
  const { data: availabilityData } = await untypedSupabase
    .from('availability_settings')
    .select('*')
    .eq('user_id', consultantId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true);

  if (!availabilityData || availabilityData.length === 0) {
    return [];
  }

  // Check nếu ngày này là unavailable
  const { data: unavailableData } = await untypedSupabase
    .from('unavailable_dates')
    .select('*')
    .eq('user_id', consultantId)
    .eq('date', date)
    .single();

  if (unavailableData) {
    return [];
  }

  // Lấy các consultation đã đặt trong ngày
  const { data: existingConsultations } = await untypedSupabase
    .from('consultations')
    .select('*')
    .eq('consultant_id', consultantId)
    .eq('consultation_date', date)
    .in('status', ['pending', 'confirmed']);

  // Generate time slots
  const slots: TimeSlot[] = [];

  for (const availability of availabilityData) {
    const [startHour, startMinute] = availability.start_time.split(':').map(Number);
    const [endHour, endMinute] = availability.end_time.split(':').map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    for (let time = startTime; time + durationMinutes <= endTime; time += 30) {
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      // Check if slot is available
      const slotEndTime = time + durationMinutes;
      const isAvailable = !existingConsultations?.some(consultation => {
        const [consStartHour, consStartMinute] = consultation.start_time.split(':').map(Number);
        const [consEndHour, consEndMinute] = consultation.end_time.split(':').map(Number);
        
        const consStart = consStartHour * 60 + consStartMinute;
        const consEnd = consEndHour * 60 + consEndMinute;

        return (time < consEnd && slotEndTime > consStart);
      });

      slots.push({
        time: timeString,
        available: isAvailable,
        consultation: existingConsultations?.find(c => c.start_time === timeString)
      });
    }
  }

  return slots.sort((a, b) => a.time.localeCompare(b.time));
}

// ============= HELPER FUNCTIONS =============

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = Number.parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${period}`;
}

export function getDayName(dayOfWeek: number): string {
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return days[dayOfWeek];
}

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}
