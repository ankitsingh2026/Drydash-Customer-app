# Add Items to Existing Pickup - Implementation Plan

## Steps

1. [x] Add `updatePickupThroughApp` API to `features/pickups/pickup.api.ts`
2. [x] Create reusable `AddPickupItemsButton` component at `components/orders/AddPickupItemsButton.tsx`
3. [x] Modify `app/(customer)/services/[service]/index.tsx` to support edit mode (pre-populate cart, custom footer, update API)
4. [x] Wire up "Add Items" in `components/orders/OrderCard.tsx` (ScheduledPickupCard & AssignedPickupCard)
5. [x] Wire up "Add Items" in `app/(customer)/order-tracking.tsx`
6. [x] Test & verify

