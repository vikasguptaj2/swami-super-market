"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/lib/api";
import { useCartStore } from "@/lib/store/cart.store";
import { Check, AlertCircle, ShoppingBag, Plus, Minus } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const activeVariants = product.variants.filter((v) => v.isActive);
  const [selectedVariantId, setSelectedVariantId] = useState<number>(
    activeVariants[0]?.id || 0
  );

  const selectedVariant =
    activeVariants.find((v) => v.id === selectedVariantId) || activeVariants[0];

  const mrp = selectedVariant ? parseFloat(selectedVariant.mrp) : 0;
  const sellingPrice = selectedVariant ? parseFloat(selectedVariant.sellingPrice) : 0;
  const savings = mrp > sellingPrice ? mrp - sellingPrice : 0;
  const discountPercent = mrp > 0 ? Math.round((savings / mrp) * 100) : 0;
  const inStock = selectedVariant ? selectedVariant.currentStock > 0 : false;

  // Cart store
  const cartItem = useCartStore((state) =>
    state.items.find((i) => i.productVariantId === selectedVariant?.id)
  );
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const handleAddToCart = () => {
    if (!selectedVariant || !inStock) return;
    addItem({
      productVariantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      hindiName: product.hindiName,
      variantUnit: selectedVariant.unit,
      sellingPrice,
      mrp,
      imageUrl: product.imageUrl,
      maxStock: selectedVariant.currentStock,
    });
  };

  return (
    <div className="group bg-white rounded-2xl border border-neutral-200/80 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-950/5 transition-all duration-200 flex flex-col overflow-hidden relative">
      {/* Discount Badge */}
      {discountPercent > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
          {discountPercent}% OFF
        </div>
      )}

      {/* Stock Status Indicator */}
      <div className="absolute top-3 right-3 z-10">
        {inStock ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            In Stock
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            <AlertCircle className="w-2.5 h-2.5" />
            Out of Stock
          </span>
        )}
      </div>

      {/* Product Image */}
      <div className="relative aspect-square w-full bg-neutral-50 p-4 flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8" />
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Hindi Name Chip */}
          {product.hindiName && (
            <span className="text-xs font-medium text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded-md inline-block mb-1">
              {product.hindiName}
            </span>
          )}

          {/* English Product Name */}
          <h3 className="font-semibold text-neutral-900 text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Variant Selector */}
          {activeVariants.length > 1 ? (
            <div className="mt-2.5">
              <label className="text-[11px] text-neutral-500 block mb-1 font-medium">
                Pack Size:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {activeVariants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                      v.id === selectedVariant?.id
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300 bg-white"
                    }`}
                  >
                    {v.unit}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-xs font-medium text-neutral-500">
              Unit: <span className="text-neutral-800 font-semibold">{selectedVariant?.unit || "1 pc"}</span>
            </div>
          )}
        </div>

        {/* Pricing & Add to Cart */}
        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-end justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-neutral-900">
                {formatPrice(sellingPrice)}
              </span>
              {mrp > sellingPrice && (
                <span className="text-xs text-neutral-400 line-through">
                  {formatPrice(mrp)}
                </span>
              )}
            </div>
            {savings > 0 && (
              <p className="text-[11px] text-emerald-600 font-semibold">
                Save {formatPrice(savings)}
              </p>
            )}
          </div>

          {/* Add / Quantity Counter */}
          <div>
            {inStock ? (
              cartItem ? (
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 rounded-xl p-0.5 text-emerald-800">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(
                        selectedVariant.id,
                        cartItem.quantity - 1
                      )
                    }
                    className="w-7 h-7 rounded-lg bg-white flex items-center justify-center hover:bg-emerald-100 font-bold transition shadow-2xs"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-black px-1.5 min-w-[1.25rem] text-center">
                    {cartItem.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(
                        selectedVariant.id,
                        cartItem.quantity + 1
                      )
                    }
                    disabled={cartItem.quantity >= selectedVariant.currentStock}
                    className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center hover:bg-emerald-800 font-bold transition shadow-2xs disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              )
            ) : (
              <button
                disabled
                className="bg-neutral-100 text-neutral-400 text-xs font-semibold px-3 py-2 rounded-xl cursor-not-allowed"
              >
                Sold Out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
