"use client";

import { useEffect, useState } from "react";

import type { ShopMenu } from "@/app/admin/shop/page";

import {
  createProduct,
  updateProduct,
  deleteProduct,
  fetchAdminProducts,
  fetchProductImages,
  uploadProductImage,
  deleteProductImage,
  resolveAssetUrl,
  type AdminProduct,
  type ProductRequest,
  type ProductImage,
} from "@/lib/api";

interface ShopEditorProps {
  selectedMenu: ShopMenu;
}

export default function ShopEditor({
  selectedMenu,
}: ShopEditorProps) {
  return (
    <section className="min-h-full px-8 py-8">
      {selectedMenu === "dashboard" && <DashboardEditor />}
      {selectedMenu === "products" && <ProductsEditor />}
      {selectedMenu === "orders" && <OrdersEditor />}
      {selectedMenu === "users" && <UsersEditor />}
      {selectedMenu === "settings" && <SettingsEditor />}
    </section>
  );
}

function DashboardEditor() {
  return (
    <div>
      <EditorHeader
        label="01 · OVERVIEW"
        title="Dashboard"
        description="Shop의 전체 현황을 확인합니다."
      />

      <div className="mt-10 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <SummaryCard label="PRODUCTS" value="0" />
        <SummaryCard label="ORDERS" value="0" />
        <SummaryCard label="CUSTOMERS" value="0" />
        <SummaryCard label="SALES" value="₩0" />
      </div>
    </div>
  );
}

function ProductsEditor() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingProduct, setEditingProduct] =
    useState<AdminProduct | null>(null);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchAdminProducts();
      setProducts(data);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "상품 목록을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (
    product: AdminProduct
  ) => {
    const confirmed = window.confirm(
      `"${product.name}" 상품을 삭제하시겠습니까?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(product.id);

      await deleteProduct(product.id);

      if (editingProduct?.id === product.id) {
        setEditingProduct(null);
        setIsAdding(false);
      }

      await loadProducts();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "상품 삭제에 실패했습니다."
      );
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div>
      <EditorHeader
        label="02 · PRODUCTS"
        title="Products"
        description="Shop에 노출되는 상품을 관리합니다."
        action={
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setIsAdding(true);
            }}
            className="border border-black bg-black px-5 py-3 text-[10px] tracking-[0.14em] text-white transition hover:bg-transparent hover:text-black"
          >
            ADD PRODUCT
          </button>
        }
      />

      {(isAdding || editingProduct) && (
        <ProductForm
          key={editingProduct?.id ?? "new"}
          product={editingProduct}
          saving={saving}
          onCancel={() => {
            setIsAdding(false);
            setEditingProduct(null);
          }}
          onSubmit={async (
            data,
            image,
            detailImages,
            removedDetailImageIds
          ) => {
            try {
              setSaving(true);

              if (editingProduct) {
                // =========================
                // UPDATE PRODUCT
                // =========================
                // data.thumbnail에는 기존 thumbnail이 들어있다.
                // 이미지가 변경되지 않았다면 그대로 유지된다.
                await updateProduct(
                  editingProduct.id,
                  data
                );

                // =========================
                // REMOVE EXISTING DETAIL
                // =========================
                // 사용자가 REMOVE한 기존 DETAIL만 삭제한다.
                for (
                  const imageId of removedDetailImageIds
                ) {
                  await deleteProductImage(
                    editingProduct.id,
                    imageId
                  );
                }

                // =========================
                // REPLACE MAIN
                // =========================
                // 새 MAIN 파일을 선택한 경우에만 교체한다.
                if (image) {
                  const currentImages =
                    await fetchProductImages(
                      editingProduct.id
                    );

                  const oldMainImages =
                    currentImages.filter(
                      (item) =>
                        item.imageType === "MAIN"
                    );

                  // 새 MAIN을 먼저 등록한다.
                  // 백엔드가 products.thumbnail을 새 URL로 갱신한다.
                  await uploadProductImage(
                    editingProduct.id,
                    {
                      file: image,
                      imageType: "MAIN",
                      altText: data.name,
                      sortOrder: 0,
                    }
                  );

                  // 새 MAIN 등록 성공 후 기존 MAIN만 삭제한다.
                  for (
                    const oldMain of oldMainImages
                  ) {
                    await deleteProductImage(
                      editingProduct.id,
                      oldMain.id
                    );
                  }
                }

                // =========================
                // ADD NEW DETAIL
                // =========================
                // 기존 DETAIL은 그대로 두고 새로 선택한 파일만 추가한다.
                if (detailImages.length > 0) {
                  const currentImages =
                    await fetchProductImages(
                      editingProduct.id
                    );

                  const currentDetails =
                    currentImages.filter(
                      (item) =>
                        item.imageType === "DETAIL"
                    );

                  const maxSortOrder =
                    currentDetails.length > 0
                      ? Math.max(
                          ...currentDetails.map(
                            (item) =>
                              item.sortOrder ?? 0
                          )
                        )
                      : 0;

                  for (
                    let index = 0;
                    index < detailImages.length;
                    index++
                  ) {
                    await uploadProductImage(
                      editingProduct.id,
                      {
                        file: detailImages[index],
                        imageType: "DETAIL",
                        altText: `${data.name} detail ${
                          maxSortOrder +
                          index +
                          1
                        }`,
                        sortOrder:
                          maxSortOrder +
                          index +
                          1,
                      }
                    );
                  }
                }
              } else {
                // =========================
                // CREATE PRODUCT
                // =========================

                const createdProduct =
                  await createProduct(data);

                if (image) {
                  await uploadProductImage(
                    createdProduct.id,
                    {
                      file: image,
                      imageType: "MAIN",
                      altText: createdProduct.name,
                      sortOrder: 0,
                    }
                  );
                }

                for (
                  let index = 0;
                  index < detailImages.length;
                  index++
                ) {
                  await uploadProductImage(
                    createdProduct.id,
                    {
                      file: detailImages[index],
                      imageType: "DETAIL",
                      altText: `${createdProduct.name} detail ${
                        index + 1
                      }`,
                      sortOrder: index + 1,
                    }
                  );
                }
              }

              await loadProducts();

              setIsAdding(false);
              setEditingProduct(null);
            } catch (error) {
              console.error(error);

              alert(
                error instanceof Error
                  ? error.message
                  : "상품 저장에 실패했습니다."
              );
            } finally {
              setSaving(false);
            }
          }}
        />
      )}

      <div className="mt-10 border-t border-black">
        <div className="grid grid-cols-[80px_1fr_140px_120px_100px] gap-4 border-b border-black/10 py-4 text-[9px] tracking-[0.14em] text-[#777]">
          <span>IMAGE</span>
          <span>PRODUCT</span>
          <span>PRICE</span>
          <span>STATUS</span>
          <span />
        </div>

        {loading && (
          <div className="py-16 text-center text-[11px] tracking-[0.08em] text-[#999]">
            상품을 불러오는 중입니다.
          </div>
        )}

        {!loading && error && (
          <div className="py-16 text-center text-[11px] tracking-[0.08em] text-red-500">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          products.length === 0 && (
            <div className="py-16 text-center text-[11px] tracking-[0.08em] text-[#999]">
              등록된 상품이 없습니다.
            </div>
          )}

        {!loading &&
          !error &&
          products.map((product) => (
            <div
              key={product.id}
              className="grid grid-cols-[80px_1fr_140px_120px_100px] items-center gap-4 border-b border-black/10 py-4"
            >
              <div className="h-16 w-16 overflow-hidden bg-[#f1efec]">
                {product.thumbnail ? (
                  <img
                    src={
                      resolveAssetUrl(
                        product.thumbnail
                      ) ?? ""
                    }
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[8px] text-[#aaa]">
                    NO IMAGE
                  </div>
                )}
              </div>

              <div>
                <p className="text-[12px]">
                  {product.name}
                </p>

                {product.subtitle && (
                  <p className="mt-1 text-[10px] text-[#777]">
                    {product.subtitle}
                  </p>
                )}

                {product.category && (
                  <p className="mt-1 text-[9px] tracking-[0.1em] text-[#999]">
                    {product.category}
                  </p>
                )}
              </div>

              <div className="text-[11px]">
                ₩{product.price.toLocaleString()}
              </div>

              <div className="text-[9px] tracking-[0.1em]">
                {product.status}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingProduct(product);
                  }}
                  className="text-[9px] tracking-[0.12em] text-[#777] hover:text-black"
                >
                  EDIT
                </button>

                <button
                  type="button"
                  disabled={
                    deletingId === product.id
                  }
                  onClick={() =>
                    handleDelete(product)
                  }
                  className="text-[9px] tracking-[0.12em] text-[#999] transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {deletingId === product.id
                    ? "DELETING..."
                    : "DELETE"}
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function OrdersEditor() {
  return (
    <div>
      <EditorHeader
        label="03 · ORDERS"
        title="Orders"
        description="고객의 주문 내역과 주문 상태를 관리합니다."
      />

      <EmptyState message="주문 내역이 없습니다." />
    </div>
  );
}

function UsersEditor() {
  return (
    <div>
      <EditorHeader
        label="04 · CUSTOMERS"
        title="Customers"
        description="Shop에 가입한 고객 정보를 관리합니다."
      />

      <EmptyState message="등록된 고객이 없습니다." />
    </div>
  );
}

function SettingsEditor() {
  return (
    <div>
      <EditorHeader
        label="05 · SETTINGS"
        title="Shop Settings"
        description="Shop의 기본 정보를 설정합니다."
      />

      <div className="mt-10 max-w-2xl border-t border-black">
        <div className="border-b border-black/10 py-6">
          <label className="mb-2 block text-[9px] tracking-[0.14em] text-[#777]">
            SHOP NAME
          </label>

          <input
            type="text"
            placeholder="Shop name"
            className="w-full border border-black/20 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-black"
          />
        </div>
      </div>
    </div>
  );
}

function EditorHeader({
  label,
  title,
  description,
  action,
}: {
  label: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-8 border-b border-black pb-6">
      <div>
        <p className="mb-3 text-[9px] tracking-[0.16em] text-[#777]">
          {label}
        </p>

        <h1 className="text-[clamp(36px,5vw,64px)] font-normal tracking-[-0.05em]">
          {title}
        </h1>

        <p className="mt-3 text-xs text-[#777]">
          {description}
        </p>
      </div>

      {action}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-black/15 bg-white p-6">
      <p className="text-[9px] tracking-[0.14em] text-[#777]">
        {label}
      </p>

      <p className="mt-8 text-4xl tracking-[-0.05em]">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="mt-10 border-t border-black py-16 text-center text-[11px] tracking-[0.08em] text-[#999]">
      {message}
    </div>
  );
}

function ProductForm({
  product,
  saving,
  onCancel,
  onSubmit,
}: {
  product?: AdminProduct | null;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (
    data: ProductRequest,
    image: File | null,
    detailImages: File[],
    removedDetailImageIds: number[]
  ) => Promise<void>;
}) {
  const [name, setName] = useState(
    product?.name ?? ""
  );

  const [subtitle, setSubtitle] = useState(
    product?.subtitle ?? ""
  );

  const [description, setDescription] =
    useState(product?.description ?? "");

  const [category, setCategory] = useState(
    product?.category ?? ""
  );

  const [price, setPrice] = useState(
    product?.price != null
      ? String(product.price)
      : ""
  );

  const [originalPrice, setOriginalPrice] =
    useState(
      product?.originalPrice != null
        ? String(product.originalPrice)
        : ""
    );

  const [stock, setStock] = useState(
    product?.stock != null
      ? String(product.stock)
      : "0"
  );

  const [status, setStatus] =
    useState<ProductRequest["status"]>(
      product?.status ?? "SALE"
    );

  const [isNew, setIsNew] = useState(
    product?.isNew ?? false
  );

  const [isBest, setIsBest] = useState(
    product?.isBest ?? false
  );

  // 새로 선택한 MAIN 이미지
  const [image, setImage] =
    useState<File | null>(null);

  // 새로 추가할 DETAIL 이미지
  const [detailImages, setDetailImages] =
    useState<File[]>([]);

  // 서버에 이미 저장되어 있는 DETAIL 이미지
  const [
    existingDetailImages,
    setExistingDetailImages,
  ] = useState<ProductImage[]>([]);

  // EDIT 화면에서 REMOVE를 누른 기존 DETAIL id
  const [
    removedDetailImageIds,
    setRemovedDetailImageIds,
  ] = useState<number[]>([]);

  const [
    loadingDetailImages,
    setLoadingDetailImages,
  ] = useState(false);

  // EDIT 진입 시 기존 DETAIL 이미지 조회
  useEffect(() => {
    if (!product?.id) {
      setExistingDetailImages([]);
      setRemovedDetailImageIds([]);
      return;
    }

    let cancelled = false;

    const loadExistingImages = async () => {
      try {
        setLoadingDetailImages(true);

        const images =
          await fetchProductImages(
            product.id
          );

        if (cancelled) {
          return;
        }

        const details = images.filter(
          (item) =>
            item.imageType === "DETAIL"
        );

        setExistingDetailImages(details);
        setRemovedDetailImageIds([]);
      } catch (error) {
        if (!cancelled) {
          console.error(
            "DETAIL 이미지 조회 실패:",
            error
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingDetailImages(false);
        }
      }
    };

    loadExistingImages();

    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  const handleSubmit = async (
    event: React.SyntheticEvent<
      HTMLFormElement,
      SubmitEvent
    >
  ) => {
    event.preventDefault();

    if (!name.trim()) {
      alert("상품명을 입력해주세요.");
      return;
    }

    if (!price.trim()) {
      alert("가격을 입력해주세요.");
      return;
    }

    const payload: ProductRequest = {
      name: name.trim(),
      subtitle: subtitle.trim() || null,
      description:
        description.trim() || null,
      category: category.trim() || null,

      price: Number(price),

      originalPrice: originalPrice
        ? Number(originalPrice)
        : null,

      // EDIT에서는 기존 thumbnail 유지.
      // 신규 등록은 기존 product가 없으므로 null.
      thumbnail:
        product?.thumbnail ?? null,

      isNew,
      isBest,

      stock: Number(stock || 0),

      status,
    };

    await onSubmit(
      payload,
      image,
      detailImages,
      removedDetailImageIds
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 border border-black bg-white"
    >
      <div className="flex items-center justify-between border-b border-black px-6 py-5">
        <div>
          <p className="text-[9px] tracking-[0.16em] text-[#777]">
            {product
              ? "EDIT PRODUCT"
              : "NEW PRODUCT"}
          </p>

          <h3 className="mt-1 text-xl tracking-[-0.03em]">
            {product
              ? "Edit Product"
              : "Add Product"}
          </h3>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-[9px] tracking-[0.12em] text-[#777] hover:text-black"
        >
          CLOSE
        </button>
      </div>

      <div className="grid grid-cols-2 max-md:grid-cols-1">
        <div className="border-r border-black/10 p-6 max-md:border-r-0">
          <FormField label="PRODUCT NAME">
            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              className="h-11 w-full border border-black/20 px-3 text-sm outline-none focus:border-black"
            />
          </FormField>

          <FormField label="SUBTITLE">
            <input
              type="text"
              value={subtitle}
              onChange={(event) =>
                setSubtitle(
                  event.target.value
                )
              }
              className="h-11 w-full border border-black/20 px-3 text-sm outline-none focus:border-black"
            />
          </FormField>

          <FormField label="CATEGORY">
            <input
              type="text"
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
              className="h-11 w-full border border-black/20 px-3 text-sm outline-none focus:border-black"
            />
          </FormField>

          <FormField label="DESCRIPTION">
            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              rows={6}
              className="w-full resize-none border border-black/20 p-3 text-sm outline-none focus:border-black"
            />
          </FormField>
        </div>

        <div className="p-6">
          <ProductImageInput
            image={image}
            currentImage={resolveAssetUrl(
              product?.thumbnail
            )}
            onChange={setImage}
          />

          <DetailImagesInput
            images={detailImages}
            existingImages={
              existingDetailImages
            }
            loading={
              loadingDetailImages
            }
            onChange={setDetailImages}
            onRemoveExisting={(
              imageId
            ) => {
              setExistingDetailImages(
                (prev) =>
                  prev.filter(
                    (item) =>
                      item.id !==
                      imageId
                  )
              );

              setRemovedDetailImageIds(
                (prev) =>
                  prev.includes(imageId)
                    ? prev
                    : [
                        ...prev,
                        imageId,
                      ]
              );
            }}
          />

          <div className="mt-6 grid grid-cols-2 gap-4">
            <FormField label="PRICE">
              <input
                type="number"
                min="0"
                value={price}
                onChange={(event) =>
                  setPrice(
                    event.target.value
                  )
                }
                className="h-11 w-full border border-black/20 px-3 text-sm outline-none focus:border-black"
              />
            </FormField>

            <FormField label="ORIGINAL PRICE">
              <input
                type="number"
                min="0"
                value={originalPrice}
                onChange={(event) =>
                  setOriginalPrice(
                    event.target.value
                  )
                }
                className="h-11 w-full border border-black/20 px-3 text-sm outline-none focus:border-black"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="STOCK">
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(event) =>
                  setStock(
                    event.target.value
                  )
                }
                className="h-11 w-full border border-black/20 px-3 text-sm outline-none focus:border-black"
              />
            </FormField>

            <FormField label="STATUS">
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target
                      .value as ProductRequest["status"]
                  )
                }
                className="h-11 w-full border border-black/20 bg-white px-3 text-sm outline-none focus:border-black"
              >
                <option value="SALE">
                  SALE
                </option>
                <option value="SOLD_OUT">
                  SOLD OUT
                </option>
                <option value="HIDDEN">
                  HIDDEN
                </option>
              </select>
            </FormField>
          </div>

          <div className="mt-2 flex gap-6 border-t border-black/10 py-5">
            <label className="flex cursor-pointer items-center gap-2 text-[10px] tracking-[0.1em]">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(event) =>
                  setIsNew(
                    event.target.checked
                  )
                }
              />
              NEW
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-[10px] tracking-[0.1em]">
              <input
                type="checkbox"
                checked={isBest}
                onChange={(event) =>
                  setIsBest(
                    event.target.checked
                  )
                }
              />
              BEST
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-black px-6 py-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="border border-black/20 px-5 py-3 text-[9px] tracking-[0.14em] transition hover:border-black"
        >
          CANCEL
        </button>

        <button
          type="submit"
          disabled={saving}
          className="border border-black bg-black px-6 py-3 text-[9px] tracking-[0.14em] text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "SAVING..."
            : product
              ? "SAVE CHANGES"
              : "CREATE PRODUCT"}
        </button>
      </div>
    </form>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-5 block">
      <span className="mb-2 block text-[9px] tracking-[0.14em] text-[#777]">
        {label}
      </span>

      {children}
    </label>
  );
}

function ProductImageInput({
  image,
  currentImage,
  onChange,
}: {
  image: File | null;
  currentImage?: string | null;
  onChange: (file: File | null) => void;
}) {
  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }

    // 새로 선택한 File을 브라우저에서 미리보기 위한 URL
    const objectUrl = URL.createObjectURL(image);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [image]);

  // 새 이미지가 있으면 preview를 우선 표시하고,
  // 없으면 기존 서버 이미지를 표시
  const displayImage =
    previewUrl || currentImage || null;

  return (
    <div>
      <span className="mb-2 block text-[9px] tracking-[0.14em] text-[#777]">
        MAIN IMAGE
      </span>

      <label className="block cursor-pointer">
        <div className="aspect-[4/5] overflow-hidden border border-black/20 bg-[#f5f4ef]">

          {/* 여기가 실제 Preview 출력 부분 */}
          {displayImage ? (
            <img
              src={displayImage}
              alt="Product preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[9px] tracking-[0.12em] text-[#999]">
              SELECT IMAGE
            </div>
          )}

        </div>

        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file =
              event.target.files?.[0] ?? null;

            onChange(file);
          }}
        />
      </label>

      {image && (
        <div className="mt-2 flex items-center justify-between">
          <span className="max-w-[70%] truncate text-[9px] text-[#777]">
            {image.name}
          </span>

          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[9px] tracking-[0.1em] text-[#999] hover:text-black"
          >
            REMOVE
          </button>
        </div>
      )}
    </div>
  );
}

function DetailImagesInput({
  images,
  existingImages,
  loading,
  onChange,
  onRemoveExisting,
}: {
  images: File[];
  existingImages: ProductImage[];
  loading: boolean;
  onChange: (files: File[]) => void;
  onRemoveExisting: (
    imageId: number
  ) => void;
}) {
  const [previewUrls, setPreviewUrls] =
    useState<string[]>([]);

  useEffect(() => {
    const urls = images.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [images]);

  const handleFiles = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(
      event.target.files ?? []
    );

    if (selectedFiles.length === 0) {
      return;
    }

    onChange([
      ...images,
      ...selectedFiles,
    ]);

    event.target.value = "";
  };

  const handleRemove = (
    index: number
  ) => {
    onChange(
      images.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    );
  };

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[9px] tracking-[0.14em] text-[#777]">
          DETAIL IMAGES
        </span>

        <span className="text-[9px] tracking-[0.1em] text-[#999]">
          {existingImages.length +
            images.length}{" "}
          IMAGES
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-3 max-sm:grid-cols-2">
        {loading && (
          <div className="flex aspect-square items-center justify-center border border-black/20 bg-[#f5f4ef]">
            <span className="text-[8px] tracking-[0.12em] text-[#999]">
              LOADING...
            </span>
          </div>
        )}

        {!loading &&
          existingImages.map(
            (
              detailImage,
              index
            ) => (
              <div
                key={`existing-${detailImage.id}`}
                className="group relative aspect-square overflow-hidden border border-black/20 bg-[#f5f4ef]"
              >
                <img
                  src={
                    resolveAssetUrl(
                      detailImage.imageUrl
                    ) ?? ""
                  }
                  alt={
                    detailImage.altText ??
                    `Detail ${
                      index + 1
                    }`
                  }
                  className="h-full w-full object-cover"
                />

                <span className="absolute bottom-2 left-2 bg-white px-2 py-1 text-[8px] tracking-[0.08em]">
                  {String(
                    index + 1
                  ).padStart(
                    2,
                    "0"
                  )}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    onRemoveExisting(
                      detailImage.id
                    )
                  }
                  className="absolute right-2 top-2 bg-white px-2 py-1 text-[8px] tracking-[0.1em] opacity-0 transition group-hover:opacity-100"
                >
                  REMOVE
                </button>
              </div>
            )
          )}

        {previewUrls.map(
          (url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative aspect-square overflow-hidden border border-black/20 bg-[#f5f4ef]"
            >
              <img
                src={url}
                alt={`Detail preview ${
                  index + 1
                }`}
                className="h-full w-full object-cover"
              />

              <span className="absolute bottom-2 left-2 bg-white px-2 py-1 text-[8px] tracking-[0.08em]">
                {String(
                  existingImages.length +
                    index +
                    1
                ).padStart(
                  2,
                  "0"
                )}
              </span>

              <button
                type="button"
                onClick={() =>
                  handleRemove(index)
                }
                className="absolute right-2 top-2 bg-white px-2 py-1 text-[8px] tracking-[0.1em] opacity-0 transition group-hover:opacity-100"
              >
                REMOVE
              </button>
            </div>
          )
        )}

        <label className="flex aspect-square cursor-pointer items-center justify-center border border-dashed border-black/30 bg-[#f5f4ef] transition hover:border-black">
          <div className="text-center">
            <span className="block text-xl">
              +
            </span>

            <span className="mt-1 block text-[8px] tracking-[0.12em] text-[#777]">
              ADD DETAIL
            </span>
          </div>

          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
        </label>
      </div>
    </div>
  );
}