export interface OrderNotificationItem {
  productName: string;
  variantUnit: string;
  unitPrice: number | string;
  quantity: number;
  lineTotal: number | string;
}

export interface OrderNotificationData {
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  subtotal: number | string;
  deliveryCharge: number | string;
  totalAmount: number | string;
  paymentMethod: string;
  items: OrderNotificationItem[];
}

export function getStoreWhatsAppPhone(): string {
  const phone = process.env.STORE_WHATSAPP_PHONE?.trim();
  if (!phone) {
    throw new Error(
      "Configuration Error: STORE_WHATSAPP_PHONE environment variable is not set! A valid business WhatsApp number with country code (e.g. 919876543210) is required."
    );
  }
  return phone.replace(/[^0-9]/g, "");
}

export function sendOrderNotification(order: OrderNotificationData) {
  const storePhone = getStoreWhatsAppPhone();

  // Format line items cleanly without special surrogate characters to prevent mojibake
  const formattedItems = order.items
    .map(
      (item) =>
        `- ${item.productName} (${item.variantUnit}) x ${item.quantity} = Rs. ${parseFloat(
          item.lineTotal.toString()
        ).toFixed(2)}`
    )
    .join("\n");

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
*Subtotal:* Rs. ${parseFloat(order.subtotal.toString()).toFixed(2)}
*Delivery Charge:* Rs. ${parseFloat(order.deliveryCharge.toString()).toFixed(2)}
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
