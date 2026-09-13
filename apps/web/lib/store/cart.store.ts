import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  productVariantId: number;
  productId: number;
  productName: string;
  hindiName?: string | null;
  variantUnit: string;
  sellingPrice: number;
  mrp: number;
  imageUrl?: string | null;
  maxStock: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  updateQuantity: (productVariantId: number, qty: number) => void;
  removeItem: (productVariantId: number) => void;
  clearCart: () => void;
  getTotalCount: () => number;
  getSubtotal: () => number;
  getTotalSavings: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, qty = 1) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productVariantId === item.productVariantId
          );

          if (existing) {
            const newQty = Math.min(existing.quantity + qty, item.maxStock);
            return {
              items: state.items.map((i) =>
                i.productVariantId === item.productVariantId
                  ? { ...i, quantity: newQty }
                  : i
              ),
            };
          }

          const initialQty = Math.min(qty, item.maxStock);
          if (initialQty <= 0) return state;

          return {
            items: [...state.items, { ...item, quantity: initialQty }],
          };
        });
      },

      updateQuantity: (productVariantId, qty) => {
        set((state) => {
          if (qty <= 0) {
            return {
              items: state.items.filter(
                (i) => i.productVariantId !== productVariantId
              ),
            };
          }

          return {
            items: state.items.map((i) => {
              if (i.productVariantId === productVariantId) {
                const clamped = Math.min(qty, i.maxStock);
                return { ...i, quantity: clamped };
              }
              return i;
            }),
          };
        });
      },

      removeItem: (productVariantId) => {
        set((state) => ({
          items: state.items.filter(
            (i) => i.productVariantId !== productVariantId
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.sellingPrice * item.quantity,
          0
        );
      },

      getTotalSavings: () => {
        return get().items.reduce((sum, item) => {
          const savingsPerUnit = Math.max(0, item.mrp - item.sellingPrice);
          return sum + savingsPerUnit * item.quantity;
        }, 0);
      },
    }),
    {
      name: "swami-cart-storage",
      storage: createJSONStorage(() => {
        // Safe check for Next.js SSR
        if (typeof window !== "undefined") {
          return window.sessionStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    }
  )
);
