import { db, storeSettings, eq } from "@swami/database";

export interface OrderNotificationItem {
  productName: string;
  variantUnit: string;
  unitPrice: number | string;
  quantity: number;
  paidQuantity?: number;
  freeQuantity?: number;
  promotionType?: string | null;
  lineTotal: number | string;
}

export interface OrderNotificationData {
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  subtotal: number | string;
  totalDiscount?: number | string;
  deliveryCharge: number | string;
  totalAmount: number | string;
  paymentMethod: string;
  appliedPromotions?: Array<{ name: string; discountAmount: string }>;
  items: OrderNotificationItem[];
}

export async function getStoreWhatsAppPhone(): Promise<string> {
  const [settings] = await db
    .select({ whatsappNumber: storeSettings.whatsappNumber })
    .from(storeSettings)
    .where(eq(storeSettings.id, 1))
    .limit(1);

  const phone = settings?.whatsappNumber?.trim().replace(/[^0-9]/g, "");
  if (!phone) {
    throw new Error("Store WhatsApp number not configured");
  }
  return phone;
}

export async function sendOrderNotification(order: OrderNotificationData) {
  const storePhone = await getStoreWhatsAppPhone();

  // Format line items cleanly without special surrogate characters to prevent mojibake
  const formattedItems = order.items
    .map((item) => {
      if (item.freeQuantity && item.freeQuantity > 0) {
        return `- ${item.productName} (${item.variantUnit}) x ${item.quantity}\n  (${item.paidQuantity} paid + ${item.freeQuantity} FREE)\n  = Rs. ${parseFloat(
          item.lineTotal.toString()
        ).toFixed(2)}`;
      }
      return `- ${item.productName} (${item.variantUnit}) x ${item.quantity} = Rs. ${parseFloat(
        item.lineTotal.toString()
      ).toFixed(2)}`;
    })
    .join("\n");

  const discountNum = order.totalDiscount
    ? parseFloat(order.totalDiscount.toString())
    : 0;

  let discountSection = "";
  if (discountNum > 0) {
    const promoNames = order.appliedPromotions?.map((p) => p.name).join(", ");
    discountSection = `*Offer Savings:* - Rs. ${discountNum.toFixed(2)}${
      promoNames ? ` (${promoNames})` : ""
    }\n`;
  }

  const message = `*NEW ORDER: ${order.orderCode}*
*Swami Super Market - Usasa, Ballia*
----------------------------------------
*Customer:* ${order.customerName}
*Phone:* ${order.customerPhone}
*Address:* ${order.customerAddress}
----------------------------------------
*Order Items:*
${formattedItems}
----------------------------------------
*Gross Subtotal:* Rs. ${parseFloat(order.subtotal.toString()).toFixed(2)}
${discountSection}*Delivery Charge:* Rs. ${parseFloat(order.deliveryCharge.toString()).toFixed(2)}
*Total Amount:* Rs. ${parseFloat(order.totalAmount.toString()).toFixed(2)}
*Payment Method:* ${order.paymentMethod}
----------------------------------------
Please confirm my order! (Kripya order confirm karein)`;

  const deepLink = `https://wa.me/${storePhone}?text=${encodeURIComponent(
    message
  )}`;

  return {
    whatsappUrl: deepLink,
    whatsappMessage: message,
    storePhone,
  };
}
