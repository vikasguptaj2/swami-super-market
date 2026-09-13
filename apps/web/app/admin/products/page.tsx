"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Product, Category, ProductVariant } from "@/lib/api";
import {
  Plus,
  Edit2,
  Archive,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  AlertTriangle,
  X,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "ARCHIVED">("ALL");

  // Modals state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<{
    productId: number;
    variant: ProductVariant;
  } | null>(null);
  const [addingVariantForProduct, setAddingVariantForProduct] = useState<number | null>(null);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    categoryId: 1,
    name: "",
    slug: "",
    hindiName: "",
    searchKeywords: "",
    description: "",
    status: "ACTIVE" as "ACTIVE" | "DRAFT" | "ARCHIVED",
    imageUrl: "",
    unit: "1 kg",
    mrp: "",
    sellingPrice: "",
    currentStock: "10",
  });

  // New variant form state
  const [newVariant, setNewVariant] = useState({
    unit: "",
    mrp: "",
    sellingPrice: "",
    currentStock: "10",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodsRes, catsRes] = await Promise.all([
        fetch(`${API_URL}/admin/products`),
        fetch(`${API_URL}/catalog/categories`),
      ]);
      const prodsJson = await prodsRes.json();
      const catsJson = await catsRes.json();

      if (prodsJson.success) setProducts(prodsJson.data || []);
      if (catsJson.success) {
        setCategories(catsJson.data || []);
        if (catsJson.data?.length > 0) {
          setNewProduct((prev) => ({ ...prev, categoryId: catsJson.data[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Slug generator helper
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setNewProduct((prev) => ({ ...prev, name, slug }));
  };

  // Toggle active/archived status
  const toggleProductStatus = async (product: Product) => {
    const newStatus = product.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    try {
      const res = await fetch(`${API_URL}/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p))
        );
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  // Submit new product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        categoryId: Number(newProduct.categoryId),
        name: newProduct.name,
        slug: newProduct.slug,
        hindiName: newProduct.hindiName || undefined,
        searchKeywords: newProduct.searchKeywords || undefined,
        description: newProduct.description || undefined,
        status: newProduct.status,
        imageUrl: newProduct.imageUrl || undefined,
        variants: [
          {
            unit: newProduct.unit,
            mrp: parseFloat(newProduct.mrp),
            sellingPrice: parseFloat(newProduct.sellingPrice),
            currentStock: parseInt(newProduct.currentStock, 10) || 0,
            minStockAlert: 5,
            isActive: true,
          },
        ],
      };

      const res = await fetch(`${API_URL}/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddProductOpen(false);
        loadData();
      } else {
        alert("Failed to create product: " + (data.message || "Invalid data"));
      }
    } catch (err) {
      console.error("Error creating product:", err);
    }
  };

  // Update variant price / stock
  const handleUpdateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;

    try {
      const res = await fetch(
        `${API_URL}/admin/products/${editingVariant.productId}/variants/${editingVariant.variant.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mrp: parseFloat(editingVariant.variant.mrp),
            sellingPrice: parseFloat(editingVariant.variant.sellingPrice),
            currentStock: editingVariant.variant.currentStock,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setEditingVariant(null);
        loadData();
      } else {
        alert("Failed to update variant: " + data.message);
      }
    } catch (err) {
      console.error("Error updating variant:", err);
    }
  };

  // Add extra variant to product
  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingVariantForProduct) return;

    try {
      const res = await fetch(
        `${API_URL}/admin/products/${addingVariantForProduct}/variants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unit: newVariant.unit,
            mrp: parseFloat(newVariant.mrp),
            sellingPrice: parseFloat(newVariant.sellingPrice),
            currentStock: parseInt(newVariant.currentStock, 10) || 0,
            minStockAlert: 5,
            isActive: true,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setAddingVariantForProduct(null);
        setNewVariant({ unit: "", mrp: "", sellingPrice: "", currentStock: "10" });
        loadData();
      } else {
        alert("Failed to add variant: " + data.message);
      }
    } catch (err) {
      console.error("Error adding variant:", err);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (filterStatus === "ALL") return true;
    return p.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 flex items-center gap-2.5">
            <Package className="w-7 h-7 text-emerald-700" />
            Product Catalog Management
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage store inventory, pack sizes, MRP, selling price, and active status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex bg-neutral-100 p-1 rounded-xl text-xs font-semibold">
            {(["ALL", "ACTIVE", "ARCHIVED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filterStatus === s
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Add Product Button */}
          <button
            onClick={() => setIsAddProductOpen(true)}
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs font-medium text-neutral-500">
            Loading catalog products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center text-neutral-500">
            <Package className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-neutral-800">No products found</p>
            <p className="text-xs text-neutral-500 mt-1">
              Click &ldquo;Add Product&rdquo; above to create your first item.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50/80 border-b border-neutral-200/80 text-neutral-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Product Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Variants & Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-neutral-50/50 transition">
                    {/* Product Name & Image */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200/60 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 text-sm">{product.name}</p>
                          {product.hindiName && (
                            <p className="text-xs text-emerald-800 font-medium">
                              {product.hindiName}
                            </p>
                          )}
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            slug: {product.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4 text-neutral-700 font-medium">
                      <span className="bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-lg border border-neutral-200">
                        {product.category?.name || `Cat #${product.categoryId}`}
                      </span>
                    </td>

                    {/* Variants & Stock */}
                    <td className="py-4 px-4">
                      <div className="space-y-1.5">
                        {product.variants.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center gap-2 bg-neutral-50 border border-neutral-200/60 px-2.5 py-1 rounded-lg"
                          >
                            <span className="font-bold text-neutral-800">{v.unit}:</span>
                            <span className="text-emerald-700 font-semibold">
                              {formatPrice(v.sellingPrice)}
                            </span>
                            <span className="text-neutral-400 line-through text-[10px]">
                              {formatPrice(v.mrp)}
                            </span>
                            <span
                              className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                v.currentStock > 5
                                  ? "bg-emerald-100 text-emerald-800"
                                  : v.currentStock > 0
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              Stock: {v.currentStock}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingVariant({
                                  productId: product.id,
                                  variant: { ...v },
                                })
                              }
                              className="text-neutral-400 hover:text-neutral-700 p-0.5"
                              title="Edit Price & Stock"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => setAddingVariantForProduct(product.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 mt-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          Add Pack Size
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-1 rounded-full border ${
                          product.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-neutral-100 text-neutral-600 border-neutral-300"
                        }`}
                      >
                        {product.status === "ACTIVE" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Archive className="w-3 h-3" />
                        )}
                        {product.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleProductStatus(product)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                          product.status === "ACTIVE"
                            ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        }`}
                      >
                        {product.status === "ACTIVE" ? "Archive" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Product */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h2 className="text-lg font-bold text-neutral-900">Add New Product</h2>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Category</label>
                <select
                  value={newProduct.categoryId}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, categoryId: Number(e.target.value) })
                  }
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.hindiName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Product Name (English)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fortune Chakki Fresh Atta"
                  value={newProduct.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Hindi Name (for local search)
                </label>
                <input
                  type="text"
                  placeholder="e.g. फॉर्च्यून चक्की फ्रेश आटा"
                  value={newProduct.hindiName}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, hindiName: e.target.value })
                  }
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Search Keywords (Space-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. aata atta flour wheat fortune"
                  value={newProduct.searchKeywords}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, searchKeywords: e.target.value })
                  }
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newProduct.imageUrl}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, imageUrl: e.target.value })
                  }
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>

              {/* Initial Variant */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-2.5">
                <span className="font-bold text-neutral-900 block">Initial Pack Size / Variant</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-500 block mb-0.5">
                      Unit
                    </label>
                    <input
                      type="text"
                      placeholder="1 kg"
                      value={newProduct.unit}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, unit: e.target.value })
                      }
                      className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-500 block mb-0.5">
                      MRP (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="260"
                      value={newProduct.mrp}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, mrp: e.target.value })
                      }
                      className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-500 block mb-0.5">
                      Selling Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="235"
                      value={newProduct.sellingPrice}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, sellingPrice: e.target.value })
                      }
                      className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-500 block mb-0.5">
                      Stock Qty
                    </label>
                    <input
                      type="number"
                      placeholder="20"
                      value={newProduct.currentStock}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, currentStock: e.target.value })
                      }
                      className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 border border-neutral-200 rounded-xl font-semibold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Price & Stock for a Variant */}
      {editingVariant && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Edit Variant ({editingVariant.variant.unit})
                </h3>
              </div>
              <button
                onClick={() => setEditingVariant(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateVariant} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">MRP (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingVariant.variant.mrp}
                  onChange={(e) =>
                    setEditingVariant({
                      ...editingVariant,
                      variant: { ...editingVariant.variant, mrp: e.target.value },
                    })
                  }
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingVariant.variant.sellingPrice}
                  onChange={(e) =>
                    setEditingVariant({
                      ...editingVariant,
                      variant: {
                        ...editingVariant.variant,
                        sellingPrice: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Current Stock
                </label>
                <input
                  type="number"
                  value={editingVariant.variant.currentStock}
                  onChange={(e) =>
                    setEditingVariant({
                      ...editingVariant,
                      variant: {
                        ...editingVariant.variant,
                        currentStock: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVariant(null)}
                  className="px-4 py-2 border border-neutral-200 rounded-xl font-semibold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Pack Size / Variant to existing product */}
      {addingVariantForProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="text-base font-bold text-neutral-900">
                Add New Pack Size / Variant
              </h3>
              <button
                onClick={() => setAddingVariantForProduct(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVariant} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Pack Unit (e.g. 5 kg, 500 g, 1 L)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5 kg"
                  value={newVariant.unit}
                  onChange={(e) => setNewVariant({ ...newVariant, unit: e.target.value })}
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">MRP (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="500"
                  value={newVariant.mrp}
                  onChange={(e) => setNewVariant({ ...newVariant, mrp: e.target.value })}
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="450"
                  value={newVariant.sellingPrice}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, sellingPrice: e.target.value })
                  }
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Current Stock
                </label>
                <input
                  type="number"
                  placeholder="15"
                  value={newVariant.currentStock}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, currentStock: e.target.value })
                  }
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddingVariantForProduct(null)}
                  className="px-4 py-2 border border-neutral-200 rounded-xl font-semibold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition"
                >
                  Add Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
