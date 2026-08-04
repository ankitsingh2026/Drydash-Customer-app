// context/AddressContext.tsx
import { getAddressApi } from "@/features/orders/orders.api";
import { useAuth } from "@/hooks/useAuth";
import { Address } from "@/types/order.types";
import { eventEmitter } from "@/utils/eventEmitter";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

type AddressContextType = {
  selectedAddress: Address | null;
  selectedAddressId: string | null;
  allAddresses: Address[];
  loading: boolean;
  isNetworkError: boolean;
  setSelectedAddress: (address: Address | null) => void;
  refreshAddresses: () => Promise<void>;
  // SERVICE STATES 👇
  coords: {lat: number; lng: number} | null;
  zoneData: {zoneFound: boolean; zoneId: string; city: string; name: string} | null;
  serviceData: any | null;
  serviceLoading: boolean;
  currentActiveSlot: string | null;
  // 👆 SERVICE STATES
  updateServiceData: (data: any) => void;
  clearServiceData: () => void;
  setServiceLoading: (loading: boolean) => void;
};

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const useAddress = () => {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error("useAddress must be used within AddressProvider");
  }
  return context;
};

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const authId = user?.user?.id ?? user?.id;
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const selectedAddressIdRef = useRef<string | null>(null);
  const [allAddresses, setAllAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNetworkError, setIsNetworkError] = useState(false);

// SERVICE STATES 👇
  const [coords, setCoords] = useState<{lat: number; lng: number} | null>(null);
  const [zoneData, setZoneData] = useState<any>(null);
  const [serviceData, setServiceData] = useState<any>(null);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [currentActiveSlot, setCurrentActiveSlot] = useState<string | null>(null);
// 👆 SERVICE STATES

  const fetchAddresses = useCallback(async () => {
    if (!authId) {
      console.log("No authId found, skipping address fetch");
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching addresses for authId:", authId);
      setIsNetworkError(false);
      const data = await getAddressApi(authId);
      // console.log("Address API response:", data);

      const list = Array.isArray(data?.results) ? data.results : [];
      const mapped = list.map((a: any) => ({
        id: String(a.id),
        label: a.label || "Other",
        flat: a.addressLine1 ?? a.address,
        line1: a.addressLine1 ?? a.address,
        street: a.addressLine1 ?? a.address,
        city: a.city || "",
        state: a.state || "",
        pincode: a.pincode || "",
        latitude: a.latitude ? Number(a.latitude) : null,
        longitude: a.longitude ? Number(a.longitude) : null,
        isDefault: a.isDefault || false,
        contactName: a.contactName || "",
        contactPhone: a.contactPhone || "",
        landmark: a.landmark || "",
        addressLine2: a.addressLine2 || "",
      }));

      // console.log("Mapped addresses:", mapped);
      setAllAddresses(mapped);

      // Set default address if none selected
      if (!selectedAddressIdRef.current && mapped.length > 0) {
        const defaultAddr = mapped.find((a: any) => a.isDefault) || mapped[0];
        console.log("Setting default address:", defaultAddr);
        setSelectedAddress(defaultAddr);
        setSelectedAddressId(defaultAddr.id);
        selectedAddressIdRef.current = defaultAddr.id;
      }
    } catch (e) {
      console.error("Error fetching addresses:", e);
      setIsNetworkError(true);
    } finally {
      setLoading(false);
    }
  }, [authId, selectedAddressId]);

  // Initial fetch
  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Listen for address selection from SavedAddresses
  useEffect(() => {
    const handleAddressSelected = async ({
      address,
      label,
    }: {
      address: any;
      label: string;
    }) => {
      console.log("Address selected via event:", address);
      const fullAddress = allAddresses.find((a) => a.id === address.id);
      if (fullAddress) {
        console.log("Setting selected address from event:", fullAddress);
        setSelectedAddress(fullAddress);
        setSelectedAddressId(fullAddress.id);
      } else if (address) {
        // If address not in allAddresses yet, create it
        const newAddress: Address = {
          id: address.id,
          label: address.label,
          line1: address.line1,
          city: address.city,
          state: address.state,
          flat: address.line1,
          street: address.line1,
          pincode: address.pincode,
          latitude: address.latitude,
          longitude: address.longitude,
          contactName: address.contactName,
          contactPhone: address.contactPhone,
          landmark: address.landmark,
          addressLine2: address.addressLine2,
        };
        setSelectedAddress(newAddress);
        setSelectedAddressId(address.id);
      }
    };

    eventEmitter.on("addressSelected", handleAddressSelected);
    return () => {
      eventEmitter.off("addressSelected", handleAddressSelected);
    };
  }, [allAddresses]);

const refreshAddresses = async () => {
  await fetchAddresses();
};

// SERVICE METHODS 👇
const updateServiceData = useCallback((data: any) => {
  setServiceLoading(false);
  if (data) {
    setCoords(data.coords);
    setZoneData(data.zoneData);
    setServiceData(data.serviceData);
    setCurrentActiveSlot(data.serviceData?.data?.activeSlot?.time || null);
  }
}, []);

const clearServiceData = useCallback(() => {
  setCoords(null);
  setZoneData(null);
  setServiceData(null);
  setCurrentActiveSlot(null);
  setServiceLoading(false);
}, []);
// 👆 SERVICE METHODS

  const handleSetSelectedAddress = (address: Address | null) => {
    console.log("Setting selected address:", address);
    setSelectedAddress(address);
    setSelectedAddressId(address?.id || null);
    selectedAddressIdRef.current = address?.id || null;
  };

return (
  <AddressContext.Provider
    value={{
      selectedAddress,
      selectedAddressId,
      allAddresses,
      loading,
      isNetworkError,
      setSelectedAddress: handleSetSelectedAddress,
      refreshAddresses,
      // SERVICE 👇
      coords,
      zoneData,
      serviceData,
      serviceLoading,
      currentActiveSlot,
      updateServiceData,
      clearServiceData,
      setServiceLoading,
      // 👆 SERVICE
    }}
  >
    {children}
  </AddressContext.Provider>
);
};
