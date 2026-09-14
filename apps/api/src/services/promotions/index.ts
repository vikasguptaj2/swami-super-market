export interface CartVariantItem {
  productVariantId: number;
  productId: number;
  categoryId: number;
  sellingPrice: number;
  quantity: number;
  productName: string;
  variantUnit: string;
}

export interface PromotionWithDetails {
  id: number;
  name: string;
  description: string | null;
  type: "SIMPLE_DISCOUNT" | "BUY_X_GET_Y" | "COMBO";
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "ARCHIVED";
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE" | "COMBO_PRICE";
  discountValue: string | null;
  minOrderAmount: string | null;
  minQuantity: number | null;
  buyQuantity: number | null;
  getQuantity: number | null;
  getYDiscountPercent: string | null;
  comboPrice: string | null;
  startDate: Date | string | null;
  endDate: Date | string | null;
  priority: number;
  usageLimit: number | null;
  timesUsed: number;
  createdAt: Date | string;
  targets: Array<{
    targetType: "PRODUCT" | "VARIANT" | "CATEGORY";
    targetId: number;
  }>;
  comboComponents: Array<{
    productVariantId: number;
    quantity: number;
  }>;
}

export interface SplitOrderItemAllocation {
  productVariantId: number;
  productName: string;
  variantUnit: string;
  sellingPrice: number;
  quantity: number; // TOTAL PHYSICAL UNITS to fulfill/deliver
  paidQuantity: number; // Units customer is paying for
  freeQuantity: number; // Units provided free by promotion
  discountAmount: number;
  lineTotal: number;
  promotionId: number | null;
  promotionTypeSnapshot: "SIMPLE_DISCOUNT" | "BUY_X_GET_Y" | "COMBO" | null;
  promotionName?: string | null;
}

export interface PromotionCalculationResult {
  cartGrossSubtotal: number; // Customer-requested merchandise subtotal (used for delivery rules)
  grossSubtotal: number; // Normal value of all physical goods
  totalDiscount: number; // Monetary discount from promotions
  netSubtotal: number; // Final merchandise payable
  splitAllocations: SplitOrderItemAllocation[];
  appliedPromotionsSummary: Array<{
    promotionId: number;
    name: string;
    type: string;
    discountAmount: string;
  }>;
}

/**
 * Checks if a promotion is currently active and eligible for new calculations.
 * Derived expiration: endDate < now renders the promotion ineligible without cron.
 */
export function isPromotionEligible(
  promo: PromotionWithDetails,
  now = new Date()
): boolean {
  if (promo.status !== "ACTIVE") return false;

  if (promo.startDate) {
    const start = new Date(promo.startDate);
    if (!isNaN(start.getTime()) && start > now) return false;
  }

  if (promo.endDate) {
    const end = new Date(promo.endDate);
    if (!isNaN(end.getTime()) && end < now) return false;
  }

  if (promo.usageLimit !== null && promo.timesUsed >= promo.usageLimit) {
    return false;
  }

  return true;
}

/**
 * Pure authoritative promotion calculation engine.
 *
 * Rules:
 * 1. Delivery minimum & free delivery rely on grossSubtotal.
 * 2. Strictly non-stacking: A physical unit receives at most one promotion.
 * 3. Remaining unconsumed units can receive subsequent eligible promotions.
 * 4. Split order_items rows are created per promotion allocation.
 * 5. Combos MUST produce savings: normalComponentPriceTotal > comboPrice; otherwise skipped.
 * 6. Line total cannot drop below 0.00; discount cannot exceed line gross.
 */
export function calculateCartPromotions(
  cartItems: CartVariantItem[],
  promotionsList: PromotionWithDetails[],
  now = new Date()
): PromotionCalculationResult {
  // 1. Compute customer-requested cart subtotal (for delivery & minOrder checks)
  let cartGrossSubtotal = 0;
  for (const item of cartItems) {
    cartGrossSubtotal += item.sellingPrice * item.quantity;
  }
  cartGrossSubtotal = Math.round(cartGrossSubtotal * 100) / 100;

  // 2. Filter eligible promotions
  const eligiblePromotions = promotionsList.filter((p) =>
    isPromotionEligible(p, now)
  );

  // 3. Sort promotions by priority DESC, then createdAt ASC
  eligiblePromotions.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateA - dateB;
  });

  // Track remaining physical quantities per variant
  const remainingQuantities = new Map<number, number>();
  const itemMap = new Map<number, CartVariantItem>();

  for (const item of cartItems) {
    remainingQuantities.set(
      item.productVariantId,
      (remainingQuantities.get(item.productVariantId) || 0) + item.quantity
    );
    itemMap.set(item.productVariantId, item);
  }

  const splitAllocations: SplitOrderItemAllocation[] = [];
  const promoDiscountTotals = new Map<
    number,
    { name: string; type: string; totalDiscount: number }
  >();

  // 4. Evaluate promotions in sorted priority order
  for (const promo of eligiblePromotions) {
    // -------------------------------------------------------------
    // A. COMBO
    // -------------------------------------------------------------
    if (promo.type === "COMBO") {
      if (!promo.comboComponents || promo.comboComponents.length < 2) continue;

      // Determine how many bundles can be formed from available remaining quantities
      let maxBundles = Number.MAX_SAFE_INTEGER;
      let allComponentsAvailable = true;

      for (const comp of promo.comboComponents) {
        const item = itemMap.get(comp.productVariantId);
        const availableQty =
          remainingQuantities.get(comp.productVariantId) || 0;

        if (!item || comp.quantity <= 0 || availableQty < comp.quantity) {
          allComponentsAvailable = false;
          break;
        }

        const possibleBundles = Math.floor(availableQty / comp.quantity);
        maxBundles = Math.min(maxBundles, possibleBundles);
      }

      if (!allComponentsAvailable || maxBundles < 1) continue;

      const comboPricePerBundle = parseFloat(promo.comboPrice || "0");
      if (comboPricePerBundle <= 0) continue;

      // Calculate normal selling price total for components
      let normalPriceForOneBundle = 0;
      for (const comp of promo.comboComponents) {
        const item = itemMap.get(comp.productVariantId)!;
        normalPriceForOneBundle += item.sellingPrice * comp.quantity;
      }

      // MANDATORY LOCK RULE 2: Combo must actually provide savings!
      // If comboPrice >= normalPrice, combo does NOT apply.
      if (comboPricePerBundle >= normalPriceForOneBundle) {
        continue;
      }

      const totalNormalPrice = normalPriceForOneBundle * maxBundles;
      const totalComboPrice = comboPricePerBundle * maxBundles;
      const totalSavings =
        Math.round((totalNormalPrice - totalComboPrice) * 100) / 100;

      if (totalSavings <= 0) continue;

      // Deduct components from remainingQuantities and allocate split rows
      let allocatedDiscountSum = 0;
      const componentAllocations: SplitOrderItemAllocation[] = [];

      for (let i = 0; i < promo.comboComponents.length; i++) {
        const comp = promo.comboComponents[i];
        const item = itemMap.get(comp.productVariantId)!;
        const compConsumedQty = comp.quantity * maxBundles;

        // Decrement remaining quantity
        const curRem = remainingQuantities.get(comp.productVariantId)!;
        remainingQuantities.set(comp.productVariantId, curRem - compConsumedQty);

        const compGross = item.sellingPrice * compConsumedQty;
        // Distribute discount proportionally to merchandise value
        let compDiscount: number;
        if (i === promo.comboComponents.length - 1) {
          // Last component takes remainder to prevent fractional rounding drift
          compDiscount = Math.round((totalSavings - allocatedDiscountSum) * 100) / 100;
        } else {
          compDiscount =
            Math.round(
              ((item.sellingPrice * comp.quantity) / normalPriceForOneBundle) *
                totalSavings *
                100
            ) / 100;
          allocatedDiscountSum += compDiscount;
        }

        const compLineTotal =
          Math.round((compGross - compDiscount) * 100) / 100;

        componentAllocations.push({
          productVariantId: item.productVariantId,
          productName: item.productName,
          variantUnit: item.variantUnit,
          sellingPrice: item.sellingPrice,
          quantity: compConsumedQty,
          paidQuantity: compConsumedQty,
          freeQuantity: 0,
          discountAmount: compDiscount,
          lineTotal: Math.max(0, compLineTotal),
          promotionId: promo.id,
          promotionTypeSnapshot: "COMBO",
          promotionName: promo.name,
        });
      }

      splitAllocations.push(...componentAllocations);

      const existingPromo = promoDiscountTotals.get(promo.id) || {
        name: promo.name,
        type: promo.type,
        totalDiscount: 0,
      };
      existingPromo.totalDiscount =
        Math.round((existingPromo.totalDiscount + totalSavings) * 100) / 100;
      promoDiscountTotals.set(promo.id, existingPromo);

      continue;
    }

    // -------------------------------------------------------------
    // B. BUY_X_GET_Y (BOGO)
    // -------------------------------------------------------------
    if (promo.type === "BUY_X_GET_Y") {
      const buyQty = promo.buyQuantity || 0;
      const getQty = promo.getQuantity || 0;
      if (buyQty < 1 || getQty < 1) continue;

      const discountPercent =
        Math.min(100, Math.max(1, parseFloat(promo.getYDiscountPercent || "100"))) /
        100;

      // Find eligible variants matching target Product or Variant
      const targetProductIds = new Set(
        promo.targets
          .filter((t) => t.targetType === "PRODUCT")
          .map((t) => t.targetId)
      );
      const targetVariantIds = new Set(
        promo.targets
          .filter((t) => t.targetType === "VARIANT")
          .map((t) => t.targetId)
      );

      for (const item of cartItems) {
        const isTargeted =
          targetVariantIds.has(item.productVariantId) ||
          targetProductIds.has(item.productId);

        if (!isTargeted) continue;

        const customerRequestedQty =
          remainingQuantities.get(item.productVariantId) || 0;
        if (customerRequestedQty < buyQty) continue;

        const batches = Math.floor(customerRequestedQty / buyQty);
        if (batches < 1) continue;

        const paidQuantity = batches * buyQty;
        const freeQuantity = batches * getQty;
        const physicalQuantity = paidQuantity + freeQuantity;

        const discountAmount =
          Math.round(
            freeQuantity * item.sellingPrice * discountPercent * 100
          ) / 100;

        const lineTotal =
          Math.round(
            (paidQuantity * item.sellingPrice +
              freeQuantity * item.sellingPrice * (1 - discountPercent)) *
              100
          ) / 100;

        // Decrement remaining customer quantity by the paid units consumed by this promo
        remainingQuantities.set(
          item.productVariantId,
          customerRequestedQty - paidQuantity
        );

        splitAllocations.push({
          productVariantId: item.productVariantId,
          productName: item.productName,
          variantUnit: item.variantUnit,
          sellingPrice: item.sellingPrice,
          quantity: physicalQuantity,
          paidQuantity,
          freeQuantity,
          discountAmount,
          lineTotal: Math.max(0, lineTotal),
          promotionId: promo.id,
          promotionTypeSnapshot: "BUY_X_GET_Y",
          promotionName: promo.name,
        });

        const existingPromo = promoDiscountTotals.get(promo.id) || {
          name: promo.name,
          type: promo.type,
          totalDiscount: 0,
        };
        existingPromo.totalDiscount =
          Math.round(
            (existingPromo.totalDiscount + discountAmount) * 100
          ) / 100;
        promoDiscountTotals.set(promo.id, existingPromo);
      }

      continue;
    }

    // -------------------------------------------------------------
    // C. SIMPLE_DISCOUNT
    // -------------------------------------------------------------
    if (promo.type === "SIMPLE_DISCOUNT") {
      // Check minimum order amount on customer cart gross subtotal
      if (
        promo.minOrderAmount &&
        cartGrossSubtotal < parseFloat(promo.minOrderAmount)
      ) {
        continue;
      }

      const targetProductIds = new Set(
        promo.targets
          .filter((t) => t.targetType === "PRODUCT")
          .map((t) => t.targetId)
      );
      const targetVariantIds = new Set(
        promo.targets
          .filter((t) => t.targetType === "VARIANT")
          .map((t) => t.targetId)
      );
      const targetCategoryIds = new Set(
        promo.targets
          .filter((t) => t.targetType === "CATEGORY")
          .map((t) => t.targetId)
      );

      const matchingItems = cartItems.filter((item) => {
        return (
          targetVariantIds.has(item.productVariantId) ||
          targetProductIds.has(item.productId) ||
          targetCategoryIds.has(item.categoryId)
        );
      });

      if (matchingItems.length === 0) continue;

      // Check minimum quantity condition across available matching items
      const totalAvailableMatchingQty = matchingItems.reduce(
        (sum, it) => sum + (remainingQuantities.get(it.productVariantId) || 0),
        0
      );

      const minQtyRequired = promo.minQuantity || 1;
      if (totalAvailableMatchingQty < minQtyRequired) continue;

      const discountVal = parseFloat(promo.discountValue || "0");
      if (discountVal <= 0) continue;

      for (const item of matchingItems) {
        const availableQty =
          remainingQuantities.get(item.productVariantId) || 0;
        if (availableQty <= 0) continue;

        let lineDiscount = 0;
        const lineGross = item.sellingPrice * availableQty;

        if (promo.discountType === "PERCENTAGE") {
          const pct = Math.min(100, Math.max(1, discountVal));
          lineDiscount = Math.round(lineGross * (pct / 100) * 100) / 100;
        } else if (promo.discountType === "FIXED_AMOUNT") {
          // Fixed ₹ discount per unit capped at unit selling price
          const perUnitDiscount = Math.min(discountVal, item.sellingPrice);
          lineDiscount =
            Math.round(perUnitDiscount * availableQty * 100) / 100;
        }

        lineDiscount = Math.min(lineDiscount, lineGross);
        const lineTotal = Math.round((lineGross - lineDiscount) * 100) / 100;

        remainingQuantities.set(item.productVariantId, 0);

        splitAllocations.push({
          productVariantId: item.productVariantId,
          productName: item.productName,
          variantUnit: item.variantUnit,
          sellingPrice: item.sellingPrice,
          quantity: availableQty,
          paidQuantity: availableQty,
          freeQuantity: 0,
          discountAmount: lineDiscount,
          lineTotal: Math.max(0, lineTotal),
          promotionId: promo.id,
          promotionTypeSnapshot: "SIMPLE_DISCOUNT",
          promotionName: promo.name,
        });

        const existingPromo = promoDiscountTotals.get(promo.id) || {
          name: promo.name,
          type: promo.type,
          totalDiscount: 0,
        };
        existingPromo.totalDiscount =
          Math.round((existingPromo.totalDiscount + lineDiscount) * 100) / 100;
        promoDiscountTotals.set(promo.id, existingPromo);
      }
    }
  }

  // 5. Any leftover unconsumed quantities form standard undiscounted rows
  for (const item of cartItems) {
    const leftOver = remainingQuantities.get(item.productVariantId) || 0;
    if (leftOver > 0) {
      const lineTotal = Math.round(item.sellingPrice * leftOver * 100) / 100;
      splitAllocations.push({
        productVariantId: item.productVariantId,
        productName: item.productName,
        variantUnit: item.variantUnit,
        sellingPrice: item.sellingPrice,
        quantity: leftOver,
        paidQuantity: leftOver,
        freeQuantity: 0,
        discountAmount: 0.0,
        lineTotal,
        promotionId: null,
        promotionTypeSnapshot: null,
      });
    }
  }

  // 6. Compute final normal gross value, discount totals, and summary
  let grossSubtotal = 0;
  let totalDiscount = 0;
  for (const alloc of splitAllocations) {
    grossSubtotal += alloc.sellingPrice * alloc.quantity;
    totalDiscount += alloc.discountAmount;
  }
  grossSubtotal = Math.round(grossSubtotal * 100) / 100;
  totalDiscount = Math.round(totalDiscount * 100) / 100;
  const netSubtotal = Math.max(0, Math.round((grossSubtotal - totalDiscount) * 100) / 100);

  const appliedPromotionsSummary: Array<{
    promotionId: number;
    name: string;
    type: string;
    discountAmount: string;
  }> = [];

  for (const [pId, info] of promoDiscountTotals.entries()) {
    if (info.totalDiscount > 0) {
      appliedPromotionsSummary.push({
        promotionId: pId,
        name: info.name,
        type: info.type,
        discountAmount: info.totalDiscount.toFixed(2),
      });
    }
  }

  return {
    cartGrossSubtotal,
    grossSubtotal,
    totalDiscount,
    netSubtotal,
    splitAllocations,
    appliedPromotionsSummary,
  };
}
