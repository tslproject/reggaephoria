// ==========================================
// REGGAE SENANG TIX - DATA MODELS & TYPES
// ==========================================

export type PaymentMethodType = 'DANA' | 'BCA';

export interface TicketProduct {
  id: string;
  name: string; // e.g. "VIP", "REGULAR", "EARLY BIRD"
  price: number; // e.g. 500000, 200000
  quota: number; // e.g. 500
  available: number;
  eventTitle: string; // e.g. "Reggae Senang Festival 2026"
  date: string; // e.g. "Sabtu, 14 November 2026"
  time: string; // e.g. "16:00 - 23:30 WIB"
  venue: string; // e.g. "Pantai Karnaval Ancol"
  city: string; // e.g. "Jakarta"
  imageUrl: string; // poster / image URL
  description: string;
  perks: string[];
  approvalPassword: string; // Password rahasia persetujuan transaksi khusus tiket ini
  approval_password?: string;
  createdAt: string;
}

export interface BuyerFormData {
  fullName: string;
  whatsapp: string;
  email: string;
  idNumber?: string; // NIK / KTP
  attendeeNames: string[];
}

export type TicketStatus = 'UNUSED' | 'USED' | 'BLOCKED';

export interface AttendeeTicket {
  id: string;
  orderId: string;
  ticketCode: string; // Format: RST-TICKET-0000001
  barcode: string; // Strictly unique ticket code for 1D & 2D barcode
  attendeeName: string;
  buyerName: string;
  buyerWhatsapp: string;
  productName: string;
  tierName?: string;
  eventTitle: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  price: number;
  status: TicketStatus;
  isUsed: boolean;
  isBlocked?: boolean;
  blockReason?: string;
  usedAt?: string;
  usedByStaff?: string;
  createdAt: string;
}

// DigitalTicket alias for AttendeeTicket
export type DigitalTicket = AttendeeTicket;

export type OrderStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'blocked'
  | 'cancelled'
  | 'WAITING_PAYMENT'
  | 'PAID'
  | 'CANCELLED';

export interface Order {
  id: string; // Format: RST-YYYYMMDD-NOMOR (e.g. RST-20260928-00001)
  invoice: string; // Same as id
  verifyToken: string; // Unique URL token e.g. "a82jd92kq"
  verify_token?: string;
  productId: string;
  productName: string;
  eventTitle: string;
  eventDate?: string;
  eventTime?: string;
  eventVenue?: string;
  quantity: number;
  unitPrice: number;
  uniqueCode: number; // 3-digit verification code (e.g. 142)
  unique_code?: number;
  subtotal: number;
  totalAmount: number;
  total: number; // same as totalAmount
  paymentMethod: PaymentMethodType;
  paymentProofUrl?: string;
  status: OrderStatus;
  approvalPasswordRequired: string;
  rejectionReason?: string;
  blockReason?: string;
  buyer: BuyerFormData;
  tickets: AttendeeTicket[];
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  waAdminNotificationSent?: boolean;
  waAdminSentAt?: string;
  waBuyerDispatched?: boolean;
  waBuyerDispatchedAt?: string;
}

// TransactionItem alias for Order
export type TransactionItem = Order;

export interface GateScanRecord {
  id: string;
  timestamp: string;
  scannedAt: string;
  ticketCode: string;
  orderId?: string;
  status: 'VALID' | 'ALREADY_USED' | 'INVALID' | 'BLOCKED';
  attendeeName?: string;
  productName?: string;
  tierName?: string;
  message: string;
  staffName?: string;
}

export type ScanLog = GateScanRecord;

export interface DeliveryLog {
  id: string;
  timestamp: string;
  orderId: string;
  ticketCode: string;
  recipientName: string;
  recipientPhone: string;
  channel: 'WHATSAPP';
  status: 'SENT' | 'PENDING' | 'FAILED';
  ticketUrl: string;
}

export type WhatsAppLog = DeliveryLog;

export interface PaymentAccountInfo {
  method: PaymentMethodType;
  accountNumber: string;
  accountHolder: string;
  logoBg: string;
  instructions: string[];
}

