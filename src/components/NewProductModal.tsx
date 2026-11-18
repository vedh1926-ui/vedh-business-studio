'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Product } from '@/lib/types';
import { getPurchaseMedia, savePurchaseMedia } from '@/lib/purchaseMediaStore';
import { CameraTriggerButton, normalizeCapturedImageFile } from './CameraCaptureModal';
import { Image as ImageIcon, Trash2, Upload, X } from 'lucide-react';

interface NewProductModalProps {
  categories?: string[];
  collections?: string[];
  units?: string[];
  initialProduct?: Product | null;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'status'>, existingId?: string) => void;
}

export default function NewProductModal({
  categories = ['Diyas', 'Candles', 'Home Decor', 'Festive Hampers', 'Wax / Candles', 'Packaging', 'Other'],
  collections = [
    'Lotus Petals Diya',
    'Zari Bloom',
    'Shells Two Layers',
    'Pearls and Flower Diya',
    'Fabric Theme Diya',
    'Hand-painted Terracotta Diya',
    'Diwali Hamper',
    'GLASS',
    'Pooja & Urli',
    'Custom Assorted',
  ],
  units = ['set', 'pcs', 'pack', 'g', 'kg', 'ml', 'm', 'roll'],
  initialProduct = null,
  onClose,
  onSave,
}: NewProductModalProps) {
  const [name, setName] = useState(initialProduct?.name || '');
  const [collection, setCollection] = useState(
    initialProduct?.collection || collections[0] || 'Lotus Petals Diya'
  );
  const [category, setCategory] = useState<Product['category']>(
    initialProduct?.category || categories[0] || 'Diyas'
  );
  const [unit, setUnit] = useState<string>(initialProduct?.unit || units[0] || 'set');
  const [price, setPrice] = useState(
    initialProduct ? String(initialProduct.price) : ''
  );
  const [estimatedCost, setEstimatedCost] = useState(
    initialProduct ? String(initialProduct.estimatedCost || '') : ''
  );
  const [stock, setStock] = useState(
    initialProduct ? String(initialProduct.stock) : '0'
  );
  const [reorderLevel, setReorderLevel] = useState(
    initialProduct ? String(initialProduct.reorderLevel) : '5'
  );
  const [description, setDescription] = useState(initialProduct?.description || '');

  // Product photo upload & camera state
  const [imageUrl, setImageUrl] = useState<string | undefined>(initialProduct?.imageUrl);
  const [imageMediaId, setImageMediaId] = useState<string | undefined>(initialProduct?.imageMediaId);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imagePreviewSrc, setImagePreviewSrc] = useState<string | null>(initialProduct?.imageUrl || null);
  const [savingMedia, setSavingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let revokedUrl: string | null = null;
    let cancelled = false;

    const loadPreview = async () => {
      if (pendingImageFile) {
        const obj = URL.createObjectURL(pendingImageFile);
        revokedUrl = obj;
        if (!cancelled) setImagePreviewSrc(obj);
        return;
      }
      if (imageUrl) {
        if (!cancelled) setImagePreviewSrc(imageUrl);
        return;
      }
      if (imageMediaId) {
        const rec = await getPurchaseMedia(imageMediaId);
        if (rec && !cancelled) {
          const obj = URL.createObjectURL(rec.blob);
          revokedUrl = obj;
          setImagePreviewSrc(obj);
          return;
        }
      }
      if (!cancelled) setImagePreviewSrc(null);
    };

    void loadPreview();
    return () => {
      cancelled = true;
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [pendingImageFile, imageUrl, imageMediaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || savingMedia) return;

    setSavingMedia(true);
    try {
      let nextImageUrl = imageUrl;
      let nextImageMediaId = imageMediaId;

      if (pendingImageFile) {
        const stored = await savePurchaseMedia(pendingImageFile, pendingImageFile.name, 'product');
        nextImageMediaId = stored.id;
        nextImageUrl = stored.publicUrl || nextImageUrl;
      }

      onSave(
        {
          name: name.trim(),
          category,
          collection: collection.trim() || category,
          unit,
          price: parseFloat(price) || 0,
          estimatedCost: parseFloat(estimatedCost) || 0,
          stock: parseInt(stock, 10) || 0,
          reorderLevel: parseInt(reorderLevel, 10) || 5,
          imageUrl: nextImageUrl,
          imageMediaId: nextImageMediaId,
          description: description.trim() || undefined,
        },
        initialProduct?.id
      );

      onClose();
    } finally {
      setSavingMedia(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] border border-[#E8DDCF] shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-[#FAF5EE] border-b border-[#E8DDCF] px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="font-serif text-lg font-bold text-[#2C181B]">
            {initialProduct ? 'Edit Product / Design' : 'Add New Product / Design'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 text-xs">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Product Title / Model *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Lotus Petals Diya (Set of 2) EMERALD"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Collection
                </label>
                <input
                  list="vedh-collection-options"
                  value={collection}
                  onChange={(e) => setCollection(e.target.value)}
                  placeholder="e.g. Zari Bloom"
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
                <datalist id="vedh-collection-options">
                  {collections.map((col) => (
                    <option key={col} value={col} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label="Product category"
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                >
                  {(categories.includes(category) ? categories : [category, ...categories]).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="300"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  aria-label="Product unit"
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                >
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Est. Cost (₹)
                </label>
                <input
                  type="number"
                  placeholder="Auto from Recipe"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Finished Stock Count
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Reorder Alert Level
                </label>
                <input
                  type="number"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>
            </div>

            {/* Product Photo Upload + Direct Camera */}
            <div className="border border-[#E8DDCF] bg-[#FCF9F4] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[#423A3A] font-semibold flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#541523]" />
                  <span>Product Photo (Optional)</span>
                </label>
                {imagePreviewSrc && (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingImageFile(null);
                      setImageUrl(undefined);
                      setImageMediaId(undefined);
                      setImagePreviewSrc(null);
                    }}
                    className="text-[11px] text-red-700 hover:underline inline-flex items-center gap-0.5"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  aria-label="Upload Product Photo"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (!f) return;
                    const prepared = await normalizeCapturedImageFile(
                      f,
                      name.trim().slice(0, 24) || 'catalog-product'
                    );
                    setPendingImageFile(prepared);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#541523] bg-white text-[#541523] text-[11px] font-semibold hover:bg-[#541523]/5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{imagePreviewSrc ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
                <CameraTriggerButton
                  label="Camera"
                  title="Take product photo with camera"
                  modalTitle="Take Product Photo"
                  modalSubtitle="Photograph your handcrafted product directly"
                  filePrefix={name.trim().slice(0, 24) || 'catalog-product'}
                  onPhotoCaptured={(file) => setPendingImageFile(file)}
                  onFallbackUpload={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#541523] text-white text-[11px] font-semibold hover:bg-[#6E1C30]"
                  iconSize={13}
                />
              </div>

              {imagePreviewSrc && (
                <div className="flex items-center gap-2.5 bg-white border border-[#E8DEC9] rounded-lg p-1.5">
                  <img
                    src={imagePreviewSrc}
                    alt={name || 'Product photo preview'}
                    className="w-11 h-11 object-cover rounded border border-[#D9C9B4] shrink-0"
                  />
                  <span className="text-[11px] text-emerald-700 font-medium truncate">
                    {pendingImageFile ? `Ready to upload: ${pendingImageFile.name}` : 'Product photo attached'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Craft / Customisation Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Pure soy wax, gold foil rim, cotton wick..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 px-6 py-4 bg-[#FAF5EE]/60 border-t border-[#E8DDCF] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D9C9B4] rounded-lg text-[#635B5B] bg-white hover:bg-[#FAF6F0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingMedia}
              className="px-5 py-2 bg-[#541523] text-white rounded-lg font-semibold hover:bg-[#6E1C30] disabled:opacity-60"
            >
              {savingMedia ? 'Uploading...' : initialProduct ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
