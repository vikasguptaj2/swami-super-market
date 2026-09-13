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
  quantity: number;
  lineTotal: string;
  createdAt: string;
}

export interface OrderDetails {
  id: number;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  subtotal: string;
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

export interface CreateOrderPayload {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
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
  } catch (err) {
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
  } catch (err) {
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
  } catch (err) {
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
  } catch (err) {
    console.error("fetchFeaturedProducts error:", err);
    return [];
  }
}

export async function fetchAdminProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/admin/products`, {
      cache: "no-store",
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
