"use client";

import { useEffect, useState } from "react";

import {
  createProduct,
  deleteProduct,
  fetchAdminProducts,
  updateProduct,

  fetchProductImages,
  uploadProductImage,
  updateProductImage,
  deleteProductImage,

  resolveAssetUrl,

  type AdminProduct,
  type ProductRequest,
  type ProductStatus,
  type ProductImage,
  type ProductImageType,
} from "../../../lib/api";


// =========================================================
// EMPTY PRODUCT
// =========================================================

const emptyProduct: ProductRequest = {
  name: "",
  subtitle: "",
  description: "",
  category: "",
  price: 0,
  originalPrice: null,

  // 직접 입력하지는 않지만
  // 기존 thumbnail 값을 보존하기 위해 타입에는 유지
  thumbnail: "",

  isNew: false,
  isBest: false,
  stock: 0,
  status: "SALE",
};


// =========================================================
// SHOP ADMIN
// =========================================================

export default function ShopAdmin() {
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [draft, setDraft] =
    useState<ProductRequest>(emptyProduct);

  const [notice, setNotice] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);


  // ---------------------------------------------------------
  // Reload Products
  // ---------------------------------------------------------

  async function reload() {
    try {
      setLoading(true);

      const products =
        await fetchAdminProducts();

      setItems(products);
    } finally {
      setLoading(false);
    }
  }


  // ---------------------------------------------------------
  // Initial Load
  // ---------------------------------------------------------

  useEffect(() => {
    reload().catch((error) => {
      setNotice(
        error instanceof Error
          ? error.message
          : "상품을 불러오지 못했습니다."
      );
    });
  }, []);


  // ---------------------------------------------------------
  // Notice Timer
  // ---------------------------------------------------------

  useEffect(() => {
    if (!notice) return;

    const timer =
      window.setTimeout(() => {
        setNotice(null);
      }, 2200);

    return () =>
      window.clearTimeout(timer);
  }, [notice]);


  // ---------------------------------------------------------
  // Common Action
  // ---------------------------------------------------------

  async function run(
    action: () => Promise<unknown>,
    message: string
  ) {
    try {
      await action();
      await reload();

      setNotice(message);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "요청에 실패했습니다."
      );
    }
  }


  // ---------------------------------------------------------
  // Create Product
  // ---------------------------------------------------------

  async function create() {
    try {
      await createProduct(draft);

      setDraft(emptyProduct);

      await reload();

      setNotice(
        "상품을 등록했습니다. 등록된 상품에서 이미지를 추가할 수 있습니다."
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "상품 등록에 실패했습니다."
      );
    }
  }


  // =========================================================
  // Render
  // =========================================================

  return (
    <div className="mx-auto max-w-[1440px] px-7 py-20 max-sm:px-4">

      {/* NOTICE */}
      {notice && (
        <div
          className="fixed inset-0 z-[200] grid place-items-center bg-black/20 px-4"
          onClick={() => setNotice(null)}
        >
          <div
            className="w-full max-w-[420px] border border-black bg-white p-7"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <p className="text-[9px] tracking-[0.18em] text-[#777]">
              SHOP CMS
            </p>

            <h2 className="mt-3 text-[22px]">
              처리되었습니다.
            </h2>

            <p className="mt-5 border-t border-black/10 pt-5 text-[12px] leading-6">
              {notice}
            </p>
          </div>
        </div>
      )}


      {/* HEADER */}
      <div className="mb-14 flex items-end justify-between border-b border-black pb-6">

        <div>
          <p className="text-[10px] tracking-[0.16em] text-[#777]">
            ADMIN · SHOP CMS
          </p>

          <h1 className="mt-3 text-[clamp(44px,7vw,92px)] tracking-[-0.06em]">
            Products
          </h1>
        </div>

        <span className="mb-2 text-[10px] tracking-[0.12em] text-[#777]">
          {items.length} PRODUCTS
        </span>

      </div>


      {/* =====================================================
          CREATE PRODUCT
      ===================================================== */}

      <section>

        <div className="mb-6">
          <p className="text-[9px] tracking-[0.16em] text-[#777]">
            NEW PRODUCT
          </p>
        </div>

        <ProductForm
          value={draft}
          setValue={setDraft}
          button="+ ADD PRODUCT"
          onSubmit={create}
        />

        <p className="mt-4 text-[9px] leading-5 tracking-[0.04em] text-[#999]">
          상품을 먼저 등록한 뒤 아래 REGISTERED PRODUCTS 영역에서
          대표 이미지와 상세 이미지를 추가할 수 있습니다.
        </p>

      </section>


      {/* =====================================================
          REGISTERED PRODUCTS
      ===================================================== */}

      <section className="mt-20">

        <div className="flex items-end justify-between border-b border-black pb-4">

          <p className="text-[9px] tracking-[0.16em] text-[#777]">
            REGISTERED PRODUCTS
          </p>

          <span className="text-[9px] text-[#999]">
            {items.length} ITEMS
          </span>

        </div>


        {loading ? (
          <p className="py-12 text-[10px] tracking-[0.12em] text-[#777]">
            LOADING...
          </p>
        ) : items.length === 0 ? (
          <p className="py-12 text-[11px] text-[#777]">
            등록된 상품이 없습니다.
          </p>
        ) : (
          items.map((item) => (
            <ProductRow
              key={item.id}
              item={item}
              run={run}
              reloadProducts={reload}
            />
          ))
        )}

      </section>

    </div>
  );
}


// =========================================================
// PRODUCT ROW
// =========================================================

function ProductRow({
  item,
  run,
  reloadProducts,
}: {
  item: AdminProduct;

  run: (
    action: () => Promise<unknown>,
    message: string
  ) => Promise<void>;

  reloadProducts: () => Promise<void>;
}) {

  const [value, setValue] =
    useState<ProductRequest>({
      name: item.name,
      subtitle: item.subtitle ?? "",
      description: item.description ?? "",
      category: item.category ?? "",
      price: item.price,
      originalPrice:
        item.originalPrice ?? null,
      thumbnail:
        item.thumbnail ?? "",
      isNew:
        item.isNew ?? false,
      isBest:
        item.isBest ?? false,
      stock:
        item.stock ?? 0,
      status:
        item.status,
    });


  // 상품 reload 후 최신 thumbnail 등을
  // local state에도 반영
  useEffect(() => {
    setValue({
      name: item.name,
      subtitle: item.subtitle ?? "",
      description: item.description ?? "",
      category: item.category ?? "",
      price: item.price,
      originalPrice:
        item.originalPrice ?? null,
      thumbnail:
        item.thumbnail ?? "",
      isNew:
        item.isNew ?? false,
      isBest:
        item.isBest ?? false,
      stock:
        item.stock ?? 0,
      status:
        item.status,
    });
  }, [item]);


  const thumbnail =
    resolveAssetUrl(
      value.thumbnail
    );


  return (
    <div className="border-b border-black/15 py-12">

      {/* PRODUCT SUMMARY */}
      <div className="mb-8 flex items-start gap-5">

        <div className="h-28 w-24 shrink-0 overflow-hidden bg-[#f2f0ed]">

          {thumbnail ? (
            <img
              src={thumbnail}
              alt={value.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-[8px] tracking-[0.1em] text-[#aaa]">
              NO IMAGE
            </div>
          )}

        </div>


        <div>

          <p className="text-[9px] tracking-[0.14em] text-[#999]">
            PRODUCT #{item.id}
          </p>

          <h2 className="mt-2 text-[24px] tracking-[-0.025em]">
            {value.name || "UNTITLED"}
          </h2>

          <p className="mt-1 text-[10px] tracking-[0.06em] text-[#777]">
            {value.category ||
              "NO CATEGORY"}
          </p>

          <div className="mt-3 flex gap-2">

            {value.isNew && (
              <span className="border border-black/20 px-2 py-1 text-[8px] tracking-[0.1em]">
                NEW
              </span>
            )}

            {value.isBest && (
              <span className="border border-black/20 px-2 py-1 text-[8px] tracking-[0.1em]">
                BEST
              </span>
            )}

            <span className="border border-black/20 px-2 py-1 text-[8px] tracking-[0.1em]">
              {value.status}
            </span>

          </div>

        </div>

      </div>


      {/* BASIC PRODUCT */}
      <ProductForm
        value={value}
        setValue={setValue}
        button="SAVE PRODUCT"
        onSubmit={() =>
          run(
            () =>
              updateProduct(
                item.id,
                value
              ),
            "상품을 수정했습니다."
          )
        }
        onDelete={() => {

          if (
            !confirm(
              "이 상품을 삭제할까요?"
            )
          ) {
            return;
          }

          run(
            () =>
              deleteProduct(
                item.id
              ),
            "상품을 삭제했습니다."
          );
        }}
      />


      {/* PRODUCT IMAGE */}
      <ProductImageSection
        productId={item.id}
        onProductChanged={
          reloadProducts
        }
      />

    </div>
  );
}


// =========================================================
// PRODUCT FORM
// =========================================================

function ProductForm({
  value,
  setValue,
  onSubmit,
  onDelete,
  button,
}: {
  value: ProductRequest;

  setValue: (
    value: ProductRequest
  ) => void;

  onSubmit: () => void;

  onDelete?: () => void;

  button: string;
}) {

  const updateField = (
    key: keyof ProductRequest,
    nextValue: unknown
  ) => {
    setValue({
      ...value,
      [key]: nextValue,
    } as ProductRequest);
  };


  return (
    <div className="grid gap-4">


      {/* TEXT INFO */}
      <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">

        <Input
          label="NAME"
          value={value.name}
          set={(v) =>
            updateField(
              "name",
              v
            )
          }
        />

        <Input
          label="SUBTITLE"
          value={
            value.subtitle ?? ""
          }
          set={(v) =>
            updateField(
              "subtitle",
              v
            )
          }
        />

        <Input
          label="CATEGORY"
          value={
            value.category ?? ""
          }
          set={(v) =>
            updateField(
              "category",
              v
            )
          }
        />

      </div>


      {/* DESCRIPTION */}
      <label>

        <span className="mb-2 block text-[9px] tracking-[0.14em] text-[#777]">
          DESCRIPTION
        </span>

        <textarea
          className="min-h-[130px] w-full resize-y border border-black/20 bg-white p-3 text-[12px] leading-6 outline-none focus:border-black"
          value={
            value.description ?? ""
          }
          onChange={(e) =>
            updateField(
              "description",
              e.target.value
            )
          }
        />

      </label>


      {/* PRICE */}
      <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">

        <Input
          label="PRICE"
          type="number"
          value={String(
            value.price
          )}
          set={(v) =>
            updateField(
              "price",
              Number(v)
            )
          }
        />


        <Input
          label="ORIGINAL PRICE"
          type="number"
          value={
            value.originalPrice ==
            null
              ? ""
              : String(
                  value.originalPrice
                )
          }
          set={(v) =>
            updateField(
              "originalPrice",
              v === ""
                ? null
                : Number(v)
            )
          }
        />


        <Input
          label="STOCK"
          type="number"
          value={String(
            value.stock
          )}
          set={(v) =>
            updateField(
              "stock",
              Number(v)
            )
          }
        />


        {/* STATUS */}
        <label>

          <span className="mb-2 block text-[9px] tracking-[0.14em] text-[#777]">
            STATUS
          </span>

          <select
            className="h-11 w-full border border-black/20 bg-white px-3 text-[12px] outline-none focus:border-black"
            value={value.status}
            onChange={(e) =>
              updateField(
                "status",
                e.target
                  .value as ProductStatus
              )
            }
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

        </label>

      </div>


      {/* FLAGS */}
      <div className="flex flex-wrap gap-6 border-y border-black/10 py-4">

        <label className="flex items-center gap-2 text-[10px]">

          <input
            type="checkbox"
            checked={
              value.isNew
            }
            onChange={(e) =>
              updateField(
                "isNew",
                e.target.checked
              )
            }
          />

          NEW

        </label>


        <label className="flex items-center gap-2 text-[10px]">

          <input
            type="checkbox"
            checked={
              value.isBest
            }
            onChange={(e) =>
              updateField(
                "isBest",
                e.target.checked
              )
            }
          />

          BEST

        </label>

      </div>


      {/* ACTION */}
      <div className="flex justify-end gap-2">

        {onDelete && (
          <button
            type="button"
            className="h-10 border border-red-300 px-4 text-[9px] tracking-[0.08em] text-red-600 transition hover:bg-red-50"
            onClick={
              onDelete
            }
          >
            DELETE
          </button>
        )}


        <button
          type="button"
          className="h-10 border border-black bg-black px-5 text-[9px] tracking-[0.1em] text-white transition hover:bg-[#333]"
          onClick={
            onSubmit
          }
        >
          {button}
        </button>

      </div>

    </div>
  );
}


// =========================================================
// PRODUCT IMAGE SECTION
// =========================================================

function ProductImageSection({
  productId,
  onProductChanged,
}: {
  productId: number;

  onProductChanged:
    () => Promise<void>;
}) {

  const [images, setImages] =
    useState<ProductImage[]>([]);

  const [file, setFile] =
    useState<File | null>(null);

  const [preview, setPreview] =
    useState<string | null>(null);

  const [caption, setCaption] =
    useState("");

  const [altText, setAltText] =
    useState("");

  const [imageType, setImageType] =
    useState<ProductImageType>(
      "DETAIL"
    );

  const [sortOrder, setSortOrder] =
    useState(0);

  const [notice, setNotice] =
    useState<string | null>(null);

  const [uploading, setUploading] =
    useState(false);


  // ---------------------------------------------------------
  // Load Images
  // ---------------------------------------------------------

  async function reloadImages() {
    try {

      const next =
        await fetchProductImages(
          productId
        );

      setImages(next);

    } catch (error) {

      setNotice(
        error instanceof Error
          ? error.message
          : "이미지를 불러오지 못했습니다."
      );
    }
  }


  useEffect(() => {
    reloadImages();
  }, [productId]);


  // ---------------------------------------------------------
  // Local Preview
  // ---------------------------------------------------------

  useEffect(() => {

    if (!file) {
      setPreview(null);
      return;
    }

    const url =
      URL.createObjectURL(
        file
      );

    setPreview(url);

    return () => {
      URL.revokeObjectURL(
        url
      );
    };

  }, [file]);


  // ---------------------------------------------------------
  // Upload
  // ---------------------------------------------------------

  async function upload() {

    if (!file) {

      setNotice(
        "이미지를 선택해주세요."
      );

      return;
    }


    try {

      setUploading(true);


      await uploadProductImage(
        productId,
        {
          file,
          caption,
          altText,
          imageType,
          sortOrder,
        }
      );


      setFile(null);
      setCaption("");
      setAltText("");
      setImageType("DETAIL");
      setSortOrder(0);


      await reloadImages();

      // MAIN 이미지라면 products.thumbnail도
      // 변경됐으므로 상품 목록도 갱신
      await onProductChanged();


      setNotice(
        "이미지를 등록했습니다."
      );

    } catch (error) {

      setNotice(
        error instanceof Error
          ? error.message
          : "이미지 등록에 실패했습니다."
      );

    } finally {

      setUploading(false);
    }
  }


  const mainImages =
    images.filter(
      (image) =>
        image.imageType === "MAIN"
    );


  const detailImages =
    images.filter(
      (image) =>
        image.imageType === "DETAIL"
    );


  return (
    <div className="mt-12 border-t border-black/15 pt-8">


      {/* TITLE */}
      <div className="mb-6 flex items-end justify-between">

        <div>

          <p className="text-[9px] tracking-[0.16em] text-[#777]">
            PRODUCT IMAGES
          </p>

          <h3 className="mt-2 text-[24px] tracking-[-0.04em]">
            Images
          </h3>

        </div>


        <span className="text-[9px] tracking-[0.12em] text-[#999]">
          {images.length} ITEMS
        </span>

      </div>


      {/* =====================================================
          MAIN IMAGE
      ===================================================== */}

      {mainImages.length > 0 && (

        <div className="mb-10">

          <div className="mb-3 flex items-center justify-between">

            <p className="text-[9px] tracking-[0.14em] text-[#888]">
              MAIN IMAGE
            </p>

            <span className="text-[8px] text-[#aaa]">
              상품 대표 이미지
            </span>

          </div>


          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">

            {mainImages.map(
              (image) => (

                <ProductImageItem
                  key={image.id}
                  item={image}
                  productId={
                    productId
                  }
                  onChanged={
                    reloadImages
                  }
                  onProductChanged={
                    onProductChanged
                  }
                />

              )
            )}

          </div>

        </div>
      )}


      {/* =====================================================
          DETAIL IMAGES
      ===================================================== */}

      {detailImages.length > 0 && (

        <div className="mb-10">

          <p className="mb-3 text-[9px] tracking-[0.14em] text-[#888]">
            DETAIL IMAGES
          </p>


          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">

            {detailImages.map(
              (image) => (

                <ProductImageItem
                  key={image.id}
                  item={image}
                  productId={
                    productId
                  }
                  onChanged={
                    reloadImages
                  }
                  onProductChanged={
                    onProductChanged
                  }
                />

              )
            )}

          </div>

        </div>
      )}


      {/* =====================================================
          ADD IMAGE
      ===================================================== */}

      <div className="border border-black/15 bg-[#f7f6f4] p-5">

        <p className="mb-4 text-[9px] tracking-[0.16em] text-[#777]">
          ADD IMAGE
        </p>


        {/* PREVIEW */}
        {preview && (

          <div className="mb-5 flex justify-center overflow-hidden border border-black/10 bg-white p-5">

            <img
              src={preview}
              alt="Product preview"
              className="max-h-[420px] max-w-full object-contain"
            />

          </div>
        )}


        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">


          {/* FILE */}
          <div>

            <span className="mb-2 block text-[9px] tracking-[0.14em] text-[#777]">
              IMAGE FILE
            </span>

            <label className="flex h-11 cursor-pointer items-center justify-between border border-black/20 bg-white px-3 transition hover:border-black">

              <span className="truncate text-[10px] text-[#555]">

                {file
                  ? file.name
                  : "SELECT IMAGE"}

              </span>


              <span className="shrink-0 text-[8px] tracking-[0.12em] text-[#777]">
                BROWSE ↗
              </span>


              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {

                  const selected =
                    e.target
                      .files?.[0] ??
                    null;

                  setFile(
                    selected
                  );

                  e.target.value =
                    "";
                }}
              />

            </label>

          </div>


          {/* IMAGE TYPE */}
          <label>

            <span className="mb-2 block text-[9px] tracking-[0.14em] text-[#777]">
              IMAGE TYPE
            </span>

            <select
              value={
                imageType
              }
              onChange={(e) =>
                setImageType(
                  e.target
                    .value as ProductImageType
                )
              }
              className="h-11 w-full border border-black/20 bg-white px-3 text-[12px] outline-none focus:border-black"
            >

              <option value="MAIN">
                MAIN
              </option>

              <option value="DETAIL">
                DETAIL
              </option>

            </select>

          </label>


          <Input
            label="CAPTION"
            value={caption}
            set={setCaption}
          />


          <Input
            label="ALT TEXT"
            value={altText}
            set={setAltText}
          />


          <Input
            label="ORDER"
            type="number"
            value={String(
              sortOrder
            )}
            set={(v) =>
              setSortOrder(
                Number(v)
              )
            }
          />

        </div>


        <div className="mt-5 flex justify-end">

          <button
            type="button"
            disabled={
              uploading
            }
            onClick={
              upload
            }
            className="h-10 border border-black bg-black px-5 text-[9px] tracking-[0.12em] text-white transition hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-40"
          >

            {uploading
              ? "UPLOADING..."
              : "+ ADD IMAGE"}

          </button>

        </div>

      </div>


      {notice && (
        <p className="mt-3 text-[10px] text-[#666]">
          {notice}
        </p>
      )}

    </div>
  );
}


// =========================================================
// PRODUCT IMAGE ITEM
// =========================================================

function ProductImageItem({
  item,
  productId,
  onChanged,
  onProductChanged,
}: {
  item: ProductImage;

  productId: number;

  onChanged:
    () => Promise<void>;

  onProductChanged:
    () => Promise<void>;
}) {

  const [caption, setCaption] =
    useState(
      item.caption ?? ""
    );

  const [altText, setAltText] =
    useState(
      item.altText ?? ""
    );

  const [imageType, setImageType] =
    useState<ProductImageType>(
      item.imageType
    );

  const [sortOrder, setSortOrder] =
    useState(
      item.sortOrder ?? 0
    );

  const [saving, setSaving] =
    useState(false);


  const imageUrl =
    resolveAssetUrl(
      item.imageUrl
    );


  // ---------------------------------------------------------
  // Save Image Info
  // ---------------------------------------------------------

  async function save() {

    try {

      setSaving(true);


      await updateProductImage(
        productId,
        item.id,
        {
          caption,
          altText,
          imageType,
          sortOrder,
        }
      );


      await onChanged();

      await onProductChanged();

    } finally {

      setSaving(false);
    }
  }


  // ---------------------------------------------------------
  // Delete Image
  // ---------------------------------------------------------

  async function remove() {

    if (
      !confirm(
        "이 상품 이미지를 삭제할까요?"
      )
    ) {
      return;
    }


    await deleteProductImage(
      productId,
      item.id
    );


    await onChanged();

    await onProductChanged();
  }


  return (
    <div className="border border-black/15 bg-white">


      {/* IMAGE */}
      <div className="flex min-h-[280px] items-center justify-center overflow-hidden bg-[#f3f2ef]">

        {imageUrl ? (

          <img
            src={imageUrl}
            alt={
              altText ||
              "Product image"
            }
            className="max-h-[420px] w-full object-contain"
          />

        ) : (

          <span className="text-[9px] tracking-[0.14em] text-[#aaa]">
            NO IMAGE
          </span>

        )}

      </div>


      {/* INFO */}
      <div className="p-4">

        <div className="mb-4 flex items-center justify-between">

          <span className="text-[9px] tracking-[0.14em] text-[#777]">
            {imageType}
          </span>

          <span className="text-[9px] text-[#aaa]">
            #{item.id}
          </span>

        </div>


        <div className="grid gap-3">


          <Input
            label="CAPTION"
            value={caption}
            set={setCaption}
          />


          <Input
            label="ALT TEXT"
            value={altText}
            set={setAltText}
          />


          {/* TYPE */}
          <label>

            <span className="mb-2 block text-[9px] tracking-[0.14em] text-[#777]">
              TYPE
            </span>

            <select
              value={
                imageType
              }
              onChange={(e) =>
                setImageType(
                  e.target
                    .value as ProductImageType
                )
              }
              className="h-11 w-full border border-black/20 bg-white px-3 text-[12px] outline-none focus:border-black"
            >

              <option value="MAIN">
                MAIN
              </option>

              <option value="DETAIL">
                DETAIL
              </option>

            </select>

          </label>


          <Input
            label="ORDER"
            type="number"
            value={String(
              sortOrder
            )}
            set={(v) =>
              setSortOrder(
                Number(v)
              )
            }
          />

        </div>


        {/* ACTION */}
        <div className="mt-4 flex justify-end gap-2">

          <button
            type="button"
            onClick={
              remove
            }
            className="h-9 border border-red-300 px-4 text-[9px] text-red-600 transition hover:bg-red-50"
          >
            DELETE
          </button>


          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              save
            }
            className="h-9 border border-black px-4 text-[9px] transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >

            {saving
              ? "SAVING..."
              : "SAVE IMAGE"}

          </button>

        </div>

      </div>

    </div>
  );
}


// =========================================================
// INPUT
// =========================================================

function Input({
  label,
  value,
  set,
  type = "text",
}: {
  label: string;

  value: string;

  set: (
    value: string
  ) => void;

  type?: string;
}) {

  return (
    <label>

      <span className="mb-2 block text-[9px] tracking-[0.14em] text-[#777]">
        {label}
      </span>


      <input
        type={type}
        className="h-11 w-full border border-black/20 bg-white px-3 text-[12px] outline-none focus:border-black"
        value={value}
        onChange={(e) =>
          set(
            e.target.value
          )
        }
      />

    </label>
  );
}