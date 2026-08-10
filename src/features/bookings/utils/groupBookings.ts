import type { BookingDto } from '../services/bookingService';

export interface GroupedBooking {
  id: string;
  subjectId: string;
  subjectName: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  meetingLink?: string | null;
  status: number;
  creditAmount: number;
  cancellationReason?: string | null;
  items: BookingDto[];
}

const toMinuteKey = (value: string): string => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const resolveGroupStatus = (currentStatus: number, nextStatus: number): number => {
  const priority: Record<number, number> = { 1: 4, 0: 3, 2: 2, 3: 1 };
  return (priority[nextStatus] ?? 0) > (priority[currentStatus] ?? 0) ? nextStatus : currentStatus;
};

export const groupBookings = (bookings: BookingDto[], groupByClass: boolean): GroupedBooking[] => {
  if (!groupByClass) {
    return bookings.map((booking) => ({
      id: booking.id,
      subjectId: booking.subjectId,
      subjectName: booking.subjectName,
      scheduledStartAt: booking.scheduledStartAt,
      scheduledEndAt: booking.scheduledEndAt,
      meetingLink: booking.meetingLink,
      status: booking.status,
      creditAmount: booking.creditAmount,
      cancellationReason: booking.cancellationReason,
      items: [booking],
    }));
  }

  const groups = new Map<string, GroupedBooking>();
  bookings.forEach((booking) => {
    const key = [booking.subjectId, toMinuteKey(booking.scheduledStartAt), toMinuteKey(booking.scheduledEndAt)].join('_');
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        id: booking.id,
        subjectId: booking.subjectId,
        subjectName: booking.subjectName,
        scheduledStartAt: booking.scheduledStartAt,
        scheduledEndAt: booking.scheduledEndAt,
        meetingLink: booking.meetingLink,
        status: booking.status,
        creditAmount: booking.creditAmount,
        items: [booking],
      });
      return;
    }
    existing.items.push(booking);
    existing.creditAmount += booking.creditAmount;
    existing.status = resolveGroupStatus(existing.status, booking.status);
    if (booking.meetingLink) existing.meetingLink = booking.meetingLink;
  });
  return Array.from(groups.values());
};
