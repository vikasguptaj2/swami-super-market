const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export interface Category {
  id: number;
  name: string;
  slug: string;
  hindiName: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface ProductVariant {
  id: number;
  productId: number;
  unit: string;
  sku: string | null;
  mrp: string;
  sellingPrice: string;
  currentStock: number;
  minStockAlert: number;
  isActive: boolean;
}

export interface Product {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  hindiName: string | null;
  searchKeywords: string | null;
  description: string | null;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  imageUrl: string | null;
  images: string[];
  createdAt: string;
  category?: Category;
  variants: ProductVariant[];
}

export interface OrderItemSnapshot {
  id: number;
  orderId: number;
  productVariantId: number | null;
  productNameSnapshot: string;
  variantUnitSnapshot: string;
  unitPriceSnapshot: string;
  quantity: number; // TOTAL PHYSICAL UNITS
  paidQuantity?: number;
  freeQuantity?: number;
  promotionId?: number | null;
  promotionTypeSnapshot?: string | null;
  discountAmount?: string;
  lineTotal: string;
  createdAt: string;
  currentVariantStock?: number;
}

export interface OrderDetails {
  id: number;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  subtotal: string;
  totalDiscount?: string;
  deliveryCharge: string;
  totalAmount: string;
  paymentMethod: "COD" | "UPI" | "ONLINE";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  status: "PENDING_WHATSAPP" | "CONFIRMED" | "PACKED" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusHistoryItem {
  id: number;
  orderId: number;
  status: string;
  note: string | null;
  changedAt: string;
}

export interface DeliveryZone {
  id: number;
  name: string;
  hindiName: string | null;
  minOrderAmount: string;
  deliveryCharge: string;
  freeDeliveryAboveAmount: string | null;
  isActive: boolean;
  displayOrder: number;
}

export interface CreateOrderPayload {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryZoneId: number;
  paymentMethod: "COD" | "UPI" | "ONLINE";
  items: {
    productVariantId: number;
    quantity: number;
  }[];
}

export interface CreateOrderResponse {
  success: boolean;
  message?: string;
  data?: {
    order: OrderDetails;
    items: OrderItemSnapshot[];
    whatsappUrl: string;
    whatsappMessage: string;
  };
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/catalog/categories`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch categories");
    const json = await res.json();
    return json.data || [];
  } catch (err: any) {
    if (err?.digest === "DYNAMIC_SERVER_USAGE") throw err;
    console.error("fetchCategories error:", err);
    return [];
  }
}

export async function fetchCategoryBySlug(
  slug: string
): Promise<{ category: Category; products: Product[] } | null> {
  try {
    const res = await fetch(`${API_URL}/catalog/categories/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (err: any) {
    if (err?.digest === "DYNAMIC_SERVER_USAGE") throw err;
    console.error("fetchCategoryBySlug error:", err);
    return null;
  }
}

export async function searchProducts(q: string): Promise<Product[]> {
  try {
    const res = await fetch(
      `${API_URL}/catalog/products/search?q=${encodeURIComponent(q)}`,
      {
        cache: "no-store",
      }
    );
    if (!res.ok) throw new Error("Search failed");
    const json = await res.json();
    return json.data || [];
  } catch (err: any) {
    if (err?.digest === "DYNAMIC_SERVER_USAGE") throw err;
    console.error("searchProducts error:", err);
    return [];
  }
}

export async function fetchFeaturedProducts(limit = 20): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/catalog/products?limit=${limit}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch products");
    const json = await res.json();
    return json.data || [];
  } catch (err: any) {
    if (err?.digest === "DYNAMIC_SERVER_USAGE") throw err;
    console.error("fetchFeaturedProducts error:", err);
    return [];
  }
}

export async function fetchAdminProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/admin/products`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch admin products");
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("fetchAdminProducts error:", err);
    return [];
  }
}

export async function createOrder(
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  return json;
}

export async function fetchOrderByCode(
  orderCode: string
): Promise<{
  order: OrderDetails;
  items: OrderItemSnapshot[];
  history: OrderStatusHistoryItem[];
} | null> {
  try {
    const res = await fetch(`${API_URL}/orders/${orderCode}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error("fetchOrderByCode error:", err);
    return null;
  }
}

export async function fetchDeliveryZones(): Promise<DeliveryZone[]> {
  try {
    const res = await fetch(`${API_URL}/catalog/delivery-zones`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch delivery zones");
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("fetchDeliveryZones error:", err);
    return [];
  }
}

export interface StoreSettings {
  id: number;
  address: string;
  hindiAddress: string | null;
  phoneNumber: string;
  whatsappNumber: string;
  googleMapsUrl: string | null;
  mapsEmbedUrl: string | null;
  openingHoursText: string | null;
  photos: string[];
  updatedAt: string;
}

export async function fetchStoreSettings(): Promise<StoreSettings | null> {
  try {
    const res = await fetch(`${API_URL}/catalog/store-settings`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err: any) {
    if (err?.digest === "DYNAMIC_SERVER_USAGE") throw err;
    console.error("fetchStoreSettings error:", err);
    return null;
  }
}

export interface AdminUserSession {
  id: number;
  email: string;
  name: string;
}

export async function fetchCurrentAdmin(): Promise<AdminUserSession | null> {
  try {
    const res = await fetch(`${API_URL}/admin/auth/me`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    return null;
  }
}

export async function adminLogin(payload: {
  email: string;
  password: string;
}): Promise<{ success: boolean; data?: AdminUserSession; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to connect to authentication service",
    };
  }
}

export async function adminLogout(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/admin/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function adminFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const options: RequestInit = {
    ...init,
    credentials: "include",
  };
  const res = await fetch(input, options);
  if (res.status === 401 && typeof window !== "undefined") {
    if (!window.location.pathname.startsWith("/admin/login")) {
      window.location.href = `/admin/login?returnUrl=${encodeURIComponent(
        window.location.pathname
      )}`;
    }
  }
  return res;
}

export async function uploadAdminImage(
  file: File
): Promise<{ success: boolean; url?: string; message?: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await adminFetch(`${API_URL}/admin/uploads/image`, {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return {
        success: false,
        message: json.message || "Failed to upload image",
      };
    }

    return {
      success: true,
      url: json.data?.url,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Network error during upload",
    };
  }
}

export interface PromotionTarget {
  id?: number;
  promotionId?: number;
  targetType: "PRODUCT" | "VARIANT" | "CATEGORY";
  targetId: number;
}

export interface PromotionComboComponent {
  id?: number;
  promotionId?: number;
  productVariantId: number;
  quantity: number;
  variantUnit?: string;
  sellingPrice?: string;
  mrp?: string;
  productId?: number;
  productName?: string;
  hindiName?: string | null;
  imageUrl?: string | null;
}

export interface Promotion {
  id: number;
  name: string;
  description: string | null;
  type: "SIMPLE_DISCOUNT" | "BUY_X_GET_Y" | "COMBO";
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "ARCHIVED";
  derivedStatus?: "DRAFT" | "ACTIVE" | "EXPIRED" | "ARCHIVED";
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE" | "COMBO_PRICE";
  discountValue: string | null;
  minOrderAmount: string | null;
  minQuantity: number | null;
  buyQuantity: number | null;
  getQuantity: number | null;
  getYDiscountPercent: string | null;
  comboPrice: string | null;
  startDate: string | null;
  endDate: string | null;
  priority: number;
  usageLimit: number | null;
  timesUsed: number;
  isExpired?: boolean;
  targets: PromotionTarget[];
  comboComponents: PromotionComboComponent[];
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchPublicPromotions(): Promise<Promotion[]> {
  try {
    const res = await fetch(`${API_URL}/catalog/promotions`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch promotions");
    const json = await res.json();
    return json.data || [];
  } catch (err: any) {
    if (err?.digest === "DYNAMIC_SERVER_USAGE") throw err;
    console.error("fetchPublicPromotions error:", err);
    return [];
  }
}

export async function fetchAdminPromotions(params?: {
  status?: string;
  type?: string;
  search?: string;
}): Promise<Promotion[]> {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.type) query.append("type", params.type);
    if (params?.search) query.append("search", params.search);

    const res = await adminFetch(`${API_URL}/admin/promotions?${query.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch admin promotions");
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("fetchAdminPromotions error:", err);
    return [];
  }
}

export async function fetchAdminPromotionById(id: number): Promise<Promotion | null> {
  try {
    const res = await adminFetch(`${API_URL}/admin/promotions/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error("fetchAdminPromotionById error:", err);
    return null;
  }
}

export async function createAdminPromotion(payload: any): Promise<{
  success: boolean;
  data?: any;
  message?: string;
}> {
  try {
    const res = await adminFetch(`${API_URL}/admin/promotions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to create promotion" };
  }
}

export async function updateAdminPromotion(
  id: number,
  payload: any
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await adminFetch(`${API_URL}/admin/promotions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update promotion" };
  }
}

export async function updateAdminPromotionStatus(
  id: number,
  status: string
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await adminFetch(`${API_URL}/admin/promotions/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update promotion status" };
  }
}



