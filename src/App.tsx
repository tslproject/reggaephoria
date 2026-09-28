import React, { useState, useEffect } from 'react';
import { Navbar, AppView } from './components/Navbar';
import { BuyTicketView } from './components/BuyTicketView';
import { CheckTicketView } from './components/CheckTicketView';
import { ManageTicketsView } from './components/ManageTicketsView';
import { AdminApprovalView } from './components/AdminApprovalView';
import { TicketDetailView } from './components/TicketDetailView';
import { GateScannerView } from './components/GateScannerView';
import { AdminLoginView } from './components/AdminLoginView';
import { PaymentModal } from './components/PaymentModal';
import { WhatsAppPreviewModal } from './components/WhatsAppPreviewModal';
import { storage } from './services/storage';
import { TicketProduct, BuyerFormData, Order } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('buy_ticket');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  // Admin authentication state (saved in sessionStorage)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('rs_admin_session') === 'true';
    }
    return false;
  });

  // Track if current URL is targeting /rsadmin
  const [isOnAdminRoute, setIsOnAdminRoute] = useState<boolean>(false);

  // Payment checkout modal state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{
    product: TicketProduct;
    quantity: number;
    buyerData: BuyerFormData;
  } | null>(null);

  // WhatsApp post-payment confirmation modal
  const [isWaPreviewOpen, setIsWaPreviewOpen] = useState(false);
  const [pendingCreatedOrder, setPendingCreatedOrder] = useState<Order | null>(null);

  // Pending count for navbar badge
  const [pendingCount, setPendingCount] = useState<number>(0);

  const updatePendingCount = () => {
    const orders = storage.getOrders();
    setPendingCount(orders.filter((o) => o.status === 'pending_approval').length);
  };

  // Sync URL query & path with app view on mount & handle browser back/forward
  useEffect(() => {
    const parseUrl = () => {
      const pathname = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const orderId = params.get('orderId');

      // Check if user is accessing /rsadmin path or admin parameters
      const isTargetingAdmin =
        pathname.startsWith('/rsadmin') ||
        params.has('rsadmin') ||
        view === 'admin' ||
        view === 'manage' ||
        view === 'scanner';

      if (isTargetingAdmin) {
        setIsOnAdminRoute(true);
        if (orderId) setActiveOrderId(orderId);

        if (view === 'admin') {
          setCurrentView('admin_approval');
        } else if (view === 'scanner') {
          setCurrentView('gate_scanner');
        } else {
          setCurrentView('manage_tickets');
        }
      } else {
        setIsOnAdminRoute(false);
        if (view === 'ticket') {
          setCurrentView('ticket_detail');
          if (orderId) setActiveOrderId(orderId);
        } else if (view === 'check') {
          setCurrentView('check_ticket');
        } else {
          setCurrentView('buy_ticket');
        }
      }
    };

    parseUrl();
    updatePendingCount();

    const unsub = storage.subscribe(() => {
      updatePendingCount();
    });

    window.addEventListener('popstate', parseUrl);
    return () => {
      unsub();
      window.removeEventListener('popstate', parseUrl);
    };
  }, []);

  const handleNavigate = (view: AppView, params?: { orderId?: string }) => {
    setCurrentView(view);
    if (params?.orderId) {
      setActiveOrderId(params.orderId);
    }

    const url = new URL(window.location.href);

    if (view === 'buy_ticket') {
      setIsOnAdminRoute(false);
      url.pathname = '/';
      url.search = '';
    } else if (view === 'check_ticket') {
      setIsOnAdminRoute(false);
      url.pathname = '/';
      url.search = '?view=check';
    } else if (view === 'ticket_detail') {
      setIsOnAdminRoute(false);
      url.pathname = '/';
      url.search = `?view=ticket&orderId=${params?.orderId || activeOrderId || ''}`;
    } else if (view === 'manage_tickets') {
      setIsOnAdminRoute(true);
      url.pathname = '/rsadmin';
      url.search = '?view=manage';
    } else if (view === 'admin_approval') {
      setIsOnAdminRoute(true);
      url.pathname = '/rsadmin';
      url.search = `?view=admin${params?.orderId ? `&orderId=${params.orderId}` : ''}`;
    } else if (view === 'gate_scanner') {
      setIsOnAdminRoute(true);
      url.pathname = '/rsadmin';
      url.search = '?view=scanner';
    }

    window.history.pushState({}, '', url.toString());
  };

  const handleAdminLoginSuccess = () => {
    sessionStorage.setItem('rs_admin_session', 'true');
    setIsAdminLoggedIn(true);
    if (activeOrderId) {
      setCurrentView('admin_approval');
    } else {
      setCurrentView('manage_tickets');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('rs_admin_session');
    setIsAdminLoggedIn(false);
    setIsOnAdminRoute(false);
    const url = new URL(window.location.href);
    url.pathname = '/';
    url.search = '';
    window.history.pushState({}, '', url.toString());
    setCurrentView('buy_ticket');
  };

  // Open Payment Modal
  const handleProceedToPayment = (
    product: TicketProduct,
    quantity: number,
    buyerData: BuyerFormData
  ) => {
    setCheckoutData({ product, quantity, buyerData });
    setIsPaymentOpen(true);
  };

  // Order created with uploaded proof
  const handleOrderCreated = (order: Order) => {
    setIsPaymentOpen(false);
    setPendingCreatedOrder(order);
    setIsWaPreviewOpen(true);
    updatePendingCount();
  };

  // Find active order for ticket detail view
  const currentTicketOrder = activeOrderId
    ? storage.getOrderById(activeOrderId)
    : storage.getOrders().find((o) => o.status === 'approved') || storage.getOrders()[0];

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-zinc-100 flex flex-col font-mono selection:bg-yellow-400 selection:text-black">
      {/* Top Header & Bottom Bar Navigation */}
      {/* Jika di route admin dan belum login, sembunyikan navbar */}
      {(!isOnAdminRoute || isAdminLoggedIn) && (
        <Navbar
          currentView={currentView}
          onNavigate={handleNavigate}
          pendingApprovalsCount={pendingCount}
          onAdminLogout={handleAdminLogout}
        />
      )}

      {/* Main View Container */}
      <main className="flex-1">
        {/* ================= ROUTE ADMIN /rsadmin ================= */}
        {isOnAdminRoute ? (
          !isAdminLoggedIn ? (
            /* Wajib Masukkan Password "reggaesenang" */
            <AdminLoginView
              onSuccess={handleAdminLoginSuccess}
              onBackToBuyer={handleAdminLogout}
            />
          ) : (
            /* Sudah Login Admin -> Akses Penuh */
            <>
              {currentView === 'manage_tickets' && (
                <ManageTicketsView
                  onTicketCreated={() => handleNavigate('manage_tickets')}
                  onNavigateToBuy={() => handleNavigate('buy_ticket')}
                />
              )}

              {currentView === 'admin_approval' && (
                <AdminApprovalView
                  initialOrderId={activeOrderId || undefined}
                  onViewTicket={(orderId) => handleNavigate('ticket_detail', { orderId })}
                />
              )}

              {currentView === 'gate_scanner' && (
                <GateScannerView
                  onOpenTicket={(orderId) => handleNavigate('ticket_detail', { orderId })}
                />
              )}
            </>
          )
        ) : (
          /* ================= ROUTE PEMBELI MURNI (TANPA TOMBOL ADMIN) ================= */
          <>
            {currentView === 'buy_ticket' && (
              <BuyTicketView onProceedToPayment={handleProceedToPayment} />
            )}

            {currentView === 'check_ticket' && (
              <CheckTicketView
                onOpenTicket={(orderId) => handleNavigate('ticket_detail', { orderId })}
                onNavigateToBuy={() => handleNavigate('buy_ticket')}
              />
            )}

            {currentView === 'ticket_detail' && (
              currentTicketOrder ? (
                <TicketDetailView
                  order={currentTicketOrder}
                  onBack={() => handleNavigate('buy_ticket')}
                />
              ) : (
                <div className="max-w-md mx-auto py-16 px-4 text-center">
                  <div className="bg-black border-3 border-black p-6 shadow-[5px_5px_0_#dc2626] space-y-3">
                    <p className="text-zinc-400 text-xs uppercase font-bold">BELUM ADA TIKET YANG DIPILIH.</p>
                    <button
                      onClick={() => handleNavigate('check_ticket')}
                      className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black font-black uppercase text-xs brutal-btn shadow-[3px_3px_0px_#000]"
                    >
                      CARI TIKET SAYA
                    </button>
                  </div>
                </div>
              )
            )}
          </>
        )}
      </main>

      {/* Payment Modal */}
      {isPaymentOpen && checkoutData && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          product={checkoutData.product}
          quantity={checkoutData.quantity}
          buyerData={checkoutData.buyerData}
          onOrderCreated={handleOrderCreated}
        />
      )}

      {/* WhatsApp Dispatch Preview Modal */}
      {isWaPreviewOpen && (
        <WhatsAppPreviewModal
          isOpen={isWaPreviewOpen}
          order={pendingCreatedOrder}
          onClose={() => setIsWaPreviewOpen(false)}
          onOpenAdminApproval={(orderId) => {
            setIsWaPreviewOpen(false);
            handleNavigate('admin_approval', { orderId });
          }}
        />
      )}
    </div>
  );
}
