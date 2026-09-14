# Walkthrough: BOGO Physical Fulfillment & Inventory Engine

We have improved the **`BUY_X_GET_Y` / BOGO** promotion system to make an authoritative operational distinction between **paid quantity**, **free quantity**, and **physical fulfillment quantity** across the entire lifecycle: calculation engine, database snapshots, inventory stock deduction, WhatsApp notifications, customer cart/status UI, and admin fulfillment.

---

## Changes Made

### 1. Database Schema (`packages/database`)
- **`order_items` Table** ([`order_items.ts`](file:///packages/database/src/schema/order_items.ts)):
  - Added `paidQuantity: integer("paid_quantity").notNull().default(1)`
  - Added `freeQuantity: integer("free_quantity").notNull().default(0)`
  - `quantity`: Explicitly represents the **total physical units** to fulfill/deliver (`paidQuantity + freeQuantity`).
  - `discountAmount`: Represents the monetary value of the free units (`freeQuantity * unitPrice`).
  - `lineTotal`: Represents the net amount payable (`paidQuantity * unitPrice`).

### 2. Fastify Authoritative Calculation Engine (`apps/api`)
- **Promotion Engine** ([`services/promotions/index.ts`](file:///apps/api/src/services/promotions/index.ts)):
  - **Core Business Rule**:
    - `customerRequestedQuantity = quantity in cart`
    - `batches = floor(customerRequestedQuantity / buyQuantity)`
    - `paidQuantity = batches * buyQuantity`
    - `freeQuantity = batches * getQuantity`
    - `physicalQuantity = paidQuantity + freeQuantity`
    - Leftover unpromoted units (e.g., 3 selected under BUY 2 GET 1: 1 leftover) pass to subsequent promotions or form standard undiscounted rows.
  - Returns `cartGrossSubtotal` (customer cart merchandise value before promo) and `grossSubtotal` (normal merchandise value of all physical units).
- **Order Creation Route** ([`routes/orders.ts`](file:///apps/api/src/routes/orders.ts)):
  - Minimum order amount (`minOrderAmount`) and free delivery threshold (`freeDeliveryAboveAmount`) are strictly checked against `cartGrossSubtotal` (preserving Phase 4 delivery semantics).
  - Inserts `paidQuantity`, `freeQuantity`, and physical `quantity` into `order_items`.
- **Order Confirmation & Inventory** ([`routes/admin-orders.ts`](file:///apps/api/src/routes/admin-orders.ts)):
  - Confirmation sums physical `quantity` across all rows for the same variant.
  - When admin confirms, stock is deducted using physical quantity (`quantityChange = -3` for Buy 2 Get 1).
  - Insufficient stock check validates physical quantity with row locks (`FOR UPDATE`) and fails atomically if stock is less than physical requirements.
  - `GET /admin/orders/:id` returns `paidQuantity` and `freeQuantity`.

### 3. WhatsApp Message Formatter (`apps/api`)
- **Notification Service** ([`services/whatsapp/index.ts`](file:///apps/api/src/services/whatsapp/index.ts)):
  - Line items with free BOGO units format cleanly as:
    ```text
    - Formula (20kg) x 3
      (2 paid + 1 FREE)
      = Rs. 138.00
    ```
  - Store staff immediately understands the total units to pack from the shelf.

### 4. Customer Cart & Order Status UI (`apps/web`)
- **Cart & Checkout** ([`(store)/cart/page.tsx`](file:///apps/web/app/(store)/cart/page.tsx)):
  - Under qualifying items, an offer breakdown box displays:
    > 🎁 **BUY 2 GET 1 FREE**  
    > **2 paid + 1 FREE — You receive: 3 units**  
    > Regular value: ~~₹207~~ • Offer savings: -₹69 • Payable: **₹138**
  - The customer selects quantity 2 using the normal stepper and the UI automatically reflects the 3 physical units received.
- **Order Status Page** ([`(store)/order-status/[orderCode]/page.tsx`](file:///apps/web/app/(store)/order-status/[orderCode]/page.tsx)):
  - Displays the BOGO offer badge and `2 paid + 1 FREE — Total received: 3 units`.
- **Admin Orders Page** ([`admin/orders/page.tsx`](file:///apps/web/app/admin/orders/page.tsx)):
  - Displays **3 to pack** in the quantity column with `(2 paid + 1 free)` breakdown, offer savings, and line total.

---

## Verification & Commands to Run

Please run the following commands in your terminal:

```powershell
# 1. Apply database schema changes for order_items (paid_quantity & free_quantity)
pnpm --filter @swami/database db:push

# 2. Run the automated 13-case BOGO verification test suite
pnpm --filter @swami/api test:bogo
```

### Automated Test Coverage (`bogo.test.ts`)
The test script runs and asserts all 13 required acceptance criteria:
1. `BUY 2 GET 1, Qty 1` -> `paid = 1, free = 0, physical = 1`
2. `BUY 2 GET 1, Qty 2` -> `paid = 2, free = 1, physical = 3`
3. `BUY 2 GET 1, Qty 3` -> `paid = 3, free = 1, physical = 4`
4. `BUY 2 GET 1, Qty 4` -> `paid = 4, free = 2, physical = 6`
5. `BUY 2 GET 1, Qty 6` -> `paid = 6, free = 3, physical = 9`
6. `Inventory Confirmation` -> Deducts physical quantity `-3` (stock: 10 -> 7)
7. `WhatsApp Formatter` -> Matches `- Formula (20kg) x 3\n  (2 paid + 1 FREE)\n  = Rs. 138.00`
8. `Admin Order View` -> Exposes `Physical: 3 | Paid: 2 | Free: 1`
9. `Customer Status View` -> Displays `2 paid + 1 FREE — Total received: 3 units`
10. `Non-Promotional Item` -> Preserves `quantity = physical, paidQuantity = quantity, freeQuantity = 0`
11. `Pending Order Expiry` -> Frozen order snapshots preserve discounts on confirmation
12. `Insufficient Stock Atomicity` -> Aborts confirmation atomically when physical units (3) > stock (2)
13. `Split Rows Aggregation` -> Sums physical quantities across multiple rows for the same variant (6 + 1 = 7)
