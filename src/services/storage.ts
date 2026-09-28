// ==========================================
// REGGAEPHORIA TANGSEL - CENTRAL DATABASE SERVICE
// ==========================================

import {
  TicketProduct,
  BuyerFormData,
  Order,
  AttendeeTicket,
  GateScanRecord,
  DeliveryLog,
  PaymentAccountInfo,
  PaymentMethodType,
} from '../types';

export const ADMIN_WHATSAPP_NUMBER = '088210516736';
export const ADMIN_PASSWORD = 'reggaephoria';

export const PAYMENT_ACCOUNTS: PaymentAccountInfo[] = [
  {
    method: 'DANA',
    accountNumber: '088210516736',
    accountHolder: 'ANDRE FAUZI LUBIS',
    logoBg: 'bg-sky-500',
    instructions: [
      'Buka aplikasi DANA di ponsel Anda',
      'Pilih menu Kirim / Transfer -> Nomor HP 088210516736',
      'Pastikan nama penerima: ANDRE FAUZI LUBIS',
      'Transfer nominal persis hingga 3 digit terakhir untuk verifikasi otomatis',
      'Screenshot bukti transaksi sukses untuk diunggah',
    ],
  },
  {
    method: 'BCA',
    accountNumber: '6760633851',
    accountHolder: 'ANDRE FAUZI LUBIS',
    logoBg: 'bg-blue-600',
    instructions: [
      'Buka m-BCA (BCA Mobile) atau ATM BCA',
      'Pilih menu m-Transfer -> Antar Rekening BCA',
      'Masukkan nomor rekening tujuan: 6760633851',
      'Pastikan nama penerima: ANDRE FAUZI LUBIS',
      'Transfer nominal persis hingga 3 digit terakhir kode unik',
      'Screenshot bukti transfer yang berhasil untuk diunggah',
    ],
  },
];

const STORAGE_KEYS = {
  PRODUCTS: 'rst_products_clean_v1',
  ORDERS: 'rst_orders_clean_v1',
  SCAN_HISTORY: 'rst_scans_clean_v1',
  DELIVERY_LOGS: 'rst_deliveries_clean_v1',
  INVOICE_SEQ: 'rst_inv_sequence_v1',
  TICKET_SEQ: 'rst_tkt_sequence_v1',
};

class StorageService {
  private broadcast: BroadcastChannel | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcast = new BroadcastChannel('rst_realtime_channel');
        this.broadcast.onmessage = () => this.notifyListeners();
      } catch (e) {
        console.warn('BroadcastChannel not supported', e);
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => this.notifyListeners());
    }
  }

  subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }

  private emitChange() {
    if (this.broadcast) {
      this.broadcast.postMessage({ type: 'SYNC', time: Date.now() });
    }
    this.notifyListeners();
  }

  // ================= TICKET PRODUCTS (NO DUMP DATA: EMPTY BY DEFAULT) =================
  getTicketProducts(): TicketProduct[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  getProductById(id: string): TicketProduct | undefined {
    return this.getTicketProducts().find((p) => p.id === id);
  }

  saveTicketProduct(product: TicketProduct): TicketProduct {
    const list = this.getTicketProducts();
    const idx = list.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      list[idx] = product;
    } else {
      list.unshift(product);
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
    this.emitChange();
    return product;
  }

  deleteTicketProduct(id: string): void {
    const list = this.getTicketProducts().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
    this.emitChange();
  }

  // ================= INVOICE GENERATOR (Format: RST-YYYYMMDD-NOMOR) =================
  private getNextInvoiceNumber(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${yyyy}${mm}${dd}`;

    let seq = 1;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVOICE_SEQ);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === datePrefix) {
          seq = parsed.seq + 1;
        }
      }
    } catch {
      seq = 1;
    }
    localStorage.setItem(STORAGE_KEYS.INVOICE_SEQ, JSON.stringify({ date: datePrefix, seq }));
    const nomor = String(seq).padStart(5, '0');
    return `RST-${datePrefix}-${nomor}`;
  }

  // ================= TICKET CODE GENERATOR (Format: RST-TICKET-0000001) =================
  private getNextTicketCode(): string {
    let seq = 1;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TICKET_SEQ);
      if (saved) {
        seq = parseInt(saved, 10) + 1;
      }
    } catch {
      seq = 1;
    }
    localStorage.setItem(STORAGE_KEYS.TICKET_SEQ, String(seq));
    return `RST-TICKET-${String(seq).padStart(7, '0')}`;
  }

  // Generate random URL verification token e.g. "a82jd92kq"
  private generateVerifyToken(): string {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let token = '';
    for (let i = 0; i < 9; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  // ================= ORDERS / TRANSACTIONS =================
  getOrders(): Order[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // Alias for PRD
  getTransactions(): Order[] {
    return this.getOrders();
  }

  getOrderById(id: string): Order | undefined {
    return this.getOrders().find(
      (o) =>
        o.id.toLowerCase() === id.toLowerCase() ||
        o.invoice.toLowerCase() === id.toLowerCase() ||
        o.verifyToken?.toLowerCase() === id.toLowerCase()
    );
  }

  saveOrder(order: Order): Order {
    const list = this.getOrders();
    const idx = list.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      list[idx] = order;
    } else {
      list.unshift(order);
    }
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(list));
    this.emitChange();
    return order;
  }

  // Create new order with DANA / BCA and uploaded screenshot proof
  createOrder(params: {
    product: TicketProduct;
    buyer: BuyerFormData;
    quantity: number;
    paymentMethod: PaymentMethodType;
    paymentProofUrl?: string;
  }): Order {
    const subtotal = params.product.price * params.quantity;
    const uniqueCode = Math.floor(100 + Math.random() * 900); // 3-digit verification code
    const totalAmount = subtotal + uniqueCode;
    const invoiceNumber = this.getNextInvoiceNumber();
    const verifyToken = this.generateVerifyToken();

    const newOrder: Order = {
      id: invoiceNumber,
      invoice: invoiceNumber,
      verifyToken,
      verify_token: verifyToken,
      productId: params.product.id,
      productName: params.product.name,
      eventTitle: params.product.eventTitle || 'Reggae Senang Festival 2026',
      quantity: params.quantity,
      unitPrice: params.product.price,
      uniqueCode,
      unique_code: uniqueCode,
      subtotal,
      totalAmount,
      total: totalAmount,
      paymentMethod: params.paymentMethod,
      paymentProofUrl: params.paymentProofUrl,
      status: 'pending_approval',
      approvalPasswordRequired: params.product.approvalPassword || '',
      buyer: params.buyer,
      tickets: [],
      createdAt: new Date().toISOString(),
    };

    this.saveOrder(newOrder);
    return newOrder;
  }

  // Admin Approval with Password Check per Ticket Product
  approveOrder(
    orderId: string,
    inputPassword: string,
    adminName: string = 'Admin Reggae Senang'
  ): { success: boolean; message: string; order?: Order } {
    const order = this.getOrderById(orderId);
    if (!order) {
      return { success: false, message: 'Pesanan tidak ditemukan!' };
    }

    if (order.status === 'approved') {
      return {
        success: true,
        message: 'Pesanan ini sudah disetujui sebelumnya.',
        order,
      };
    }

    // Verify approval password configured per ticket product!
    const expectedPassword = order.approvalPasswordRequired?.trim();
    if (!expectedPassword || inputPassword.trim() !== expectedPassword) {
      return {
        success: false,
        message: `Password persetujuan salah! Masukkan password persetujuan khusus tiket "${order.productName}" yang diatur pada halaman Kelola Tiket.`,
      };
    }

    // Generate unique digital tickets with barcode & QR code
    const product = this.getProductById(order.productId);
    const tickets: AttendeeTicket[] = [];

    for (let i = 0; i < order.quantity; i++) {
      const attendeeName =
        order.buyer.attendeeNames[i] || `${order.buyer.fullName} (Tamu ${i + 1})`;
      const ticketCode = this.getNextTicketCode(); // Format: RST-TICKET-0000001

      const tkt: AttendeeTicket = {
        id: `TKT-${Date.now().toString().slice(-6)}-${i + 1}`,
        orderId: order.id,
        ticketCode,
        barcode: ticketCode,
        attendeeName,
        buyerName: order.buyer.fullName,
        buyerWhatsapp: order.buyer.whatsapp,
        productName: order.productName,
        eventTitle: order.eventTitle,
        date: product?.date || 'Sabtu, 14 November 2026',
        time: product?.time || '16:00 - 23:30 WIB',
        venue: product?.venue || 'Pantai Karnaval Ancol',
        city: product?.city || 'Jakarta Utara',
        price: order.unitPrice,
        status: 'UNUSED',
        isUsed: false,
        createdAt: new Date().toISOString(),
      };

      tickets.push(tkt);
    }

    // Update order status & embed tickets
    order.status = 'approved';
    order.approvedAt = new Date().toISOString();
    order.approvedBy = adminName;
    order.tickets = tickets;

    // Deduct stock if product still exists
    if (product) {
      product.available = Math.max(0, product.available - order.quantity);
      this.saveTicketProduct(product);
    }

    this.saveOrder(order);

    // Automatically record first delivery log
    this.logDelivery({
      orderId: order.id,
      ticketCode: tickets[0]?.ticketCode || order.id,
      recipientName: order.buyer.fullName,
      recipientPhone: order.buyer.whatsapp,
      channel: 'WHATSAPP',
      status: 'PENDING',
      ticketUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/?view=ticket&orderId=${order.id}`,
    });

    return {
      success: true,
      message: 'Transaksi berhasil disetujui! E-Tiket digital QR barcode resmi telah diterbitkan.',
      order,
    };
  }

  rejectOrder(orderId: string, reason?: string): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;
    order.status = 'rejected';
    if (reason) order.rejectionReason = reason;
    this.saveOrder(order);
    return order;
  }

  // Cancel order with reason (Batalkan Transaksi)
  cancelOrder(orderId: string, reason: string): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;
    order.status = 'cancelled';
    order.blockReason = reason || 'Dibatalkan oleh Admin';
    order.rejectionReason = reason || 'Dibatalkan oleh Admin';
    if (order.tickets && order.tickets.length > 0) {
      order.tickets.forEach((t) => {
        t.status = 'BLOCKED';
        t.isBlocked = true;
        t.blockReason = reason || 'Transaksi tiket dibatalkan';
      });
    }
    this.saveOrder(order);
    return order;
  }

  // Block order with reason (Blokir Transaksi / Tiket)
  blockOrder(orderId: string, reason: string): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;
    order.status = 'blocked';
    order.blockReason = reason || 'Diblokir oleh Admin';
    if (order.tickets && order.tickets.length > 0) {
      order.tickets.forEach((t) => {
        t.status = 'BLOCKED';
        t.isBlocked = true;
        t.blockReason = reason || 'Tiket diblokir oleh Admin';
      });
    }
    this.saveOrder(order);
    return order;
  }

  // Unblock order (Pulihkan Transaksi)
  unblockOrder(orderId: string): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;
    order.status = 'approved';
    order.blockReason = undefined;
    if (order.tickets && order.tickets.length > 0) {
      order.tickets.forEach((t) => {
        t.isBlocked = false;
        t.blockReason = undefined;
        if (t.status === 'BLOCKED') {
          t.status = t.isUsed ? 'USED' : 'UNUSED';
        }
      });
    }
    this.saveOrder(order);
    return order;
  }

  // Block individual ticket inside an order
  blockTicket(orderId: string, ticketCode: string, reason: string): AttendeeTicket | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;
    const ticket = order.tickets.find((t) => t.ticketCode === ticketCode || t.barcode === ticketCode);
    if (!ticket) return null;
    ticket.status = 'BLOCKED';
    ticket.isBlocked = true;
    ticket.blockReason = reason || 'Diblokir oleh Admin';
    this.saveOrder(order);
    return ticket;
  }

  // Unblock individual ticket
  unblockTicket(orderId: string, ticketCode: string): AttendeeTicket | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;
    const ticket = order.tickets.find((t) => t.ticketCode === ticketCode || t.barcode === ticketCode);
    if (!ticket) return null;
    ticket.isBlocked = false;
    ticket.blockReason = undefined;
    ticket.status = ticket.isUsed ? 'USED' : 'UNUSED';
    this.saveOrder(order);
    return ticket;
  }

  // Find orders by phone, name, or invoice (Cek Tiket feature)
  findOrdersByQuery(query: string): Order[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const cleanPhone = q.replace(/\D/g, '');

    return this.getOrders().filter((order) => {
      const matchInvoice =
        order.id.toLowerCase().includes(q) || order.invoice.toLowerCase().includes(q);
      const matchName = order.buyer.fullName.toLowerCase().includes(q);
      const orderPhoneClean = order.buyer.whatsapp.replace(/\D/g, '');
      const matchPhone =
        cleanPhone.length >= 4 &&
        (orderPhoneClean.includes(cleanPhone) || cleanPhone.includes(orderPhoneClean));
      const matchTicket = order.tickets.some((t) => t.ticketCode.toLowerCase().includes(q));

      return matchInvoice || matchName || matchPhone || matchTicket;
    });
  }

  // Mark ticket as dispatched to buyer via WhatsApp
  markBuyerTicketSent(orderId: string): void {
    const order = this.getOrderById(orderId);
    if (!order) return;
    order.waBuyerDispatched = true;
    order.waBuyerDispatchedAt = new Date().toISOString();
    this.saveOrder(order);

    this.logDelivery({
      orderId: order.id,
      ticketCode: order.tickets[0]?.ticketCode || order.id,
      recipientName: order.buyer.fullName,
      recipientPhone: order.buyer.whatsapp,
      channel: 'WHATSAPP',
      status: 'SENT',
      ticketUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/?view=ticket&orderId=${order.id}`,
    });
  }

  // ================= GATE SCANNER VALIDATION =================
  validateTicket(
    scannedText: string,
    staffName: string = 'Staff Gate 1'
  ): {
    status: 'VALID' | 'ALREADY_USED' | 'INVALID';
    message: string;
    ticket?: AttendeeTicket;
    order?: Order;
    record: GateScanRecord;
  } {
    const clean = scannedText.trim().toUpperCase();

    // Extract ticket code if scanned URL or formatted string
    let ticketCode = clean;
    if (clean.includes('RST-TICKET-')) {
      const match = clean.match(/RST-TICKET-\d+/);
      if (match) {
        ticketCode = match[0];
      }
    }

    const orders = this.getOrders();
    let foundTicket: AttendeeTicket | undefined;
    let foundOrder: Order | undefined;

    for (const o of orders) {
      const t = o.tickets.find(
        (tkt) =>
          tkt.ticketCode.toUpperCase() === ticketCode ||
          tkt.barcode.toUpperCase() === ticketCode
      );
      if (t) {
        foundTicket = t;
        foundOrder = o;
        break;
      }
    }

    const now = new Date().toISOString();

    if (!foundTicket || !foundOrder) {
      const record: GateScanRecord = {
        id: `SCAN-${Date.now().toString().slice(-6)}`,
        timestamp: now,
        scannedAt: now,
        ticketCode,
        status: 'INVALID',
        message: 'TIKET TIDAK DITEMUKAN / TIDAK VALID DALAM SISTEM',
        staffName,
      };
      this.addGateScanRecord(record);
      return {
        status: 'INVALID',
        message: 'TIKET TIDAK DITEMUKAN DALAM SISTEM!',
        record,
      };
    }

    // Check if ticket or order is blocked or cancelled
    const isBlocked =
      foundTicket.isBlocked ||
      foundTicket.status === 'BLOCKED' ||
      foundOrder.status === 'blocked' ||
      foundOrder.status === 'cancelled';

    if (isBlocked) {
      const blockReason =
        foundTicket.blockReason ||
        foundOrder.blockReason ||
        foundOrder.rejectionReason ||
        'Tiket telah diblokir / dibatalkan oleh Admin';

      const record: GateScanRecord = {
        id: `SCAN-${Date.now().toString().slice(-6)}`,
        timestamp: now,
        scannedAt: now,
        ticketCode: foundTicket.ticketCode,
        orderId: foundOrder.id,
        status: 'BLOCKED',
        attendeeName: foundTicket.attendeeName,
        productName: foundTicket.productName,
        tierName: foundTicket.tierName || foundTicket.productName,
        message: `AKSES DITOLAK: Tiket DIBLOKIR / DIBATALKAN. Alasan: ${blockReason}`,
        staffName,
      };
      this.addGateScanRecord(record);
      return {
        status: 'BLOCKED',
        message: `PERINGATAN KERAS: TIKET DIBLOKIR / DIBATALKAN! Alasan: ${blockReason}`,
        ticket: foundTicket,
        order: foundOrder,
        record,
      };
    }

    if (foundTicket.isUsed || foundTicket.status === 'USED') {
      const record: GateScanRecord = {
        id: `SCAN-${Date.now().toString().slice(-6)}`,
        timestamp: now,
        scannedAt: now,
        ticketCode: foundTicket.ticketCode,
        orderId: foundOrder.id,
        status: 'ALREADY_USED',
        attendeeName: foundTicket.attendeeName,
        productName: foundTicket.productName,
        tierName: foundTicket.tierName || foundTicket.productName,
        message: `Tiket sudah pernah digunakan pada ${new Date(foundTicket.usedAt || '').toLocaleTimeString('id-ID')} oleh ${foundTicket.usedByStaff || 'Staff'}.`,
        staffName,
      };
      this.addGateScanRecord(record);
      return {
        status: 'ALREADY_USED',
        message: `PERINGATAN: Tiket SUDAH DIGUNAKAN pada ${new Date(foundTicket.usedAt || '').toLocaleTimeString('id-ID')}!`,
        ticket: foundTicket,
        order: foundOrder,
        record,
      };
    }

    // Mark as checked-in (USED)
    foundTicket.isUsed = true;
    foundTicket.status = 'USED';
    foundTicket.usedAt = now;
    foundTicket.usedByStaff = staffName;
    this.saveOrder(foundOrder);

    const record: GateScanRecord = {
      id: `SCAN-${Date.now().toString().slice(-6)}`,
      timestamp: now,
      scannedAt: now,
      ticketCode: foundTicket.ticketCode,
      orderId: foundOrder.id,
      status: 'VALID',
      attendeeName: foundTicket.attendeeName,
      productName: foundTicket.productName,
      tierName: foundTicket.tierName || foundTicket.productName,
      message: 'TIKET VALID! Silakan masuk ke area festival.',
      staffName,
    };
    this.addGateScanRecord(record);

    return {
      status: 'VALID',
      message: 'TIKET VALID! Pengunjung dipersilakan masuk.',
      ticket: foundTicket,
      order: foundOrder,
      record,
    };
  }

  // Alias for validateTicket
  validateAndCheckInTicket(scannedText: string, staffName: string = 'Staff Gate 1') {
    return this.validateTicket(scannedText, staffName);
  }

  getGateScanHistory(): GateScanRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCAN_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // Alias for getGateScanHistory
  getGateScanRecords(): GateScanRecord[] {
    return this.getGateScanHistory();
  }

  addGateScanRecord(record: GateScanRecord): void {
    const list = this.getGateScanHistory();
    list.unshift(record);
    localStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(list.slice(0, 200)));
    this.emitChange();
  }

  getTicketStats(): {
    totalTickets: number;
    usedTickets: number;
    remainingTickets: number;
  } {
    const orders = this.getOrders().filter((o) => o.status === 'approved');
    let totalTickets = 0;
    let usedTickets = 0;

    orders.forEach((o) => {
      o.tickets.forEach((t) => {
        totalTickets++;
        if (t.isUsed || t.status === 'USED') {
          usedTickets++;
        }
      });
    });

    return {
      totalTickets,
      usedTickets,
      remainingTickets: Math.max(0, totalTickets - usedTickets),
    };
  }

  // ================= DELIVERY LOGS =================
  getDeliveryLogs(): DeliveryLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DELIVERY_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  logDelivery(log: Omit<DeliveryLog, 'id' | 'timestamp'>): void {
    const list = this.getDeliveryLogs();
    list.unshift({
      id: `DLV-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      ...log,
    });
    localStorage.setItem(STORAGE_KEYS.DELIVERY_LOGS, JSON.stringify(list.slice(0, 150)));
    this.emitChange();
  }
}

export const storage = new StorageService();
