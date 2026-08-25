/**
 * HomeDataContext
 *
 * Two responsibilities:
 * 1. Cache home-screen data so booking redirects skip redundant network calls.
 * 2. Own the PickupConfirmationModal state at the root layout level, so the
 *    modal persists across screen transitions (book-pickup → home) and the
 *    card can animate OVER the home screen as it enters.
 */

import React, { createContext, useCallback, useContext, useState } from "react";
import { LayoutContentData } from "@/features/content/content.types";
import { getContentLayoutApi } from "@/features/content/content.api";

type ActiveType = "none" | "pickup" | "order";

interface HomeDataContextType {
  // ── Skip-fetch flag ─────────────────────────────────────────────────────
  /** When true, home screen should skip its initial API fetches on next focus */
  skipNextFetch: boolean;
  setSkipNextFetch: (v: boolean) => void;

  // ── Cached booking data ─────────────────────────────────────────────────
  cachedActiveBooking: any;
  cachedActiveType: ActiveType;
  setCachedData: (booking: any, type: ActiveType) => void;

  cachedUserName: string | null;
  setCachedUserName: (name: string) => void;

  // ── Dynamic Layout Content ──────────────────────────────────────────────
  layoutContent: LayoutContentData | null;
  layoutLoading: boolean;
  fetchLayoutContent: (forceRefresh?: boolean) => Promise<LayoutContentData | null>;

  // ── Booking confirmation modal (owned here so it survives navigation) ───
  bookingModalVisible: boolean;
  bookingModalConfirmed: boolean;
  bookingModalAddress: string;
  bookingModalSlot: string;
  bookingModalParams: Record<string, string>;

  /** Call when user taps "Book" — shows the loading phase of the modal */
  showBookingModal: (address: string, slot: string, navParams?: Record<string, string>) => void;
  /** Call when the API call succeeds — triggers the "Confirmed" phase */
  confirmBookingModal: () => void;
  /** Call when the exit animation fully finishes — hides the overlay */
  hideBookingModal: () => void;
}

const HomeDataContext = createContext<HomeDataContextType | undefined>(undefined);

export const useHomeData = () => {
  const ctx = useContext(HomeDataContext);
  if (!ctx) {
    throw new Error("useHomeData must be used within HomeDataProvider");
  }
  return ctx;
};

export const HomeDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ── skip-fetch ────────────────────────────────────────────────────────────
  const [skipNextFetch, setSkipNextFetch] = useState(false);

  // ── cached data ───────────────────────────────────────────────────────────
  const [cachedActiveBooking, setCachedActiveBooking] = useState<any>(null);
  const [cachedActiveType, setCachedActiveType] = useState<ActiveType>("none");
  const [cachedUserName, setCachedUserName] = useState<string | null>(null);

  // ── dynamic layout ────────────────────────────────────────────────────────
  const [layoutContent, setLayoutContent] = useState<LayoutContentData | null>(null);
  const [layoutLoading, setLayoutLoading] = useState(false);

  const fetchLayoutContent = useCallback(async (forceRefresh: boolean = false) => {
    if (layoutContent && !forceRefresh) {
      return layoutContent;
    }
    try {
      setLayoutLoading(true);
      const res = await getContentLayoutApi();
      if (res?.success && res?.data) {
        setLayoutContent(res.data);
        return res.data;
      }
      return null;
    } catch (err) {
      console.log("Error fetching dynamic layout content:", err);
      return null;
    } finally {
      setLayoutLoading(false);
    }
  }, [layoutContent]);

  const setCachedData = useCallback((booking: any, type: ActiveType) => {
    setCachedActiveBooking(booking);
    setCachedActiveType(type);
  }, []);

  // ── booking modal ─────────────────────────────────────────────────────────
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingModalConfirmed, setBookingModalConfirmed] = useState(false);
  const [bookingModalAddress, setBookingModalAddress] = useState("");
  const [bookingModalSlot, setBookingModalSlot] = useState("");
  const [bookingModalParams, setBookingModalParams] = useState<Record<string, string>>({});

  const showBookingModal = useCallback(
    (address: string, slot: string, navParams: Record<string, string> = {}) => {
      setBookingModalAddress(address);
      setBookingModalSlot(slot);
      setBookingModalParams(navParams);
      setBookingModalConfirmed(false);
      setBookingModalVisible(true);
    },
    []
  );

  const confirmBookingModal = useCallback(() => {
    setBookingModalConfirmed(true);
  }, []);

  const hideBookingModal = useCallback(() => {
    setBookingModalVisible(false);
    setBookingModalConfirmed(false);
  }, []);

  return (
    <HomeDataContext.Provider
      value={{
        skipNextFetch,
        setSkipNextFetch,
        cachedActiveBooking,
        cachedActiveType,
        setCachedData,
        cachedUserName,
        setCachedUserName,
        layoutContent,
        layoutLoading,
        fetchLayoutContent,
        bookingModalVisible,
        bookingModalConfirmed,
        bookingModalAddress,
        bookingModalSlot,
        bookingModalParams,
        showBookingModal,
        confirmBookingModal,
        hideBookingModal,
      }}
    >
      {children}
    </HomeDataContext.Provider>
  );
};
