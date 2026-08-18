#!/usr/bin/env python3
"""
Hince product image crawler for portfolio development/testing.

Saves:
  public/images/products/product1.jpg
  public/images/products/product_detail1_1.jpg
  public/images/products/product_detail1_2.jpg
  public/images/products/product_detail1_3.jpg
  ...
  public/images/products/product10.jpg

Usage:
  pip install requests beautifulsoup4 pillow
  python crawl_hince_images.py
  python crawl_hince_images.py --project-root /path/to/portfolio
  python crawl_hince_images.py --delay 1.5

Notes:
- Uses only publicly accessible product/search pages.
- Does not bypass login, anti-bot challenges, or access controls.
- Website markup may change, so selectors may need adjustment later.
"""

from __future__ import annotations

import argparse
import io
import re
import time
from pathlib import Path
from urllib.parse import quote, urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageOps


BASE_URL = "https://www.hince.co.kr"

# DB products.id 1~10과 맞춘 검색어.
# 사이트에서 상품명이 바뀌면 keyword만 수정하면 됩니다.
PRODUCTS = [
    {"id": 1, "keyword": "세컨 스킨 파운데이션"},
    {"id": 2, "keyword": "트루 디멘션 래디언스 밤"},
    {"id": 3, "keyword": "무드인핸서 립 글로우"},
    {"id": 4, "keyword": "뉴 뎁스 아이섀도우 팔레트"},
    {"id": 5, "keyword": "세컨 스킨 글로우 쿠션"},
    {"id": 6, "keyword": "허그 레이어 치크"},
    {"id": 7, "keyword": "미러 듀 글로스"},
    {"id": 8, "keyword": "뉴 뎁스 듀얼 컬러 스틱"},
    {"id": 9, "keyword": "세컨 스킨 하이드레이팅 프라이머"},
    {"id": 10, "keyword": "시그니처 브로우 쉐이퍼"},
]

IMAGE_ATTRS = (
    "ec-data-src",
    "data-src",
    "data-original",
    "data-lazy-src",
    "src",
)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/151.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
}


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def normalized_name(value: str) -> str:
    """상품명 비교용: 공백/기호/프로모션 문구의 영향을 줄임."""
    value = clean_text(value).lower()
    value = re.sub(r"\[[^\]]+\]", "", value)
    value = re.sub(r"[^0-9a-z가-힣]+", "", value)
    return value


def get_soup(session: requests.Session, url: str, timeout: int = 20) -> BeautifulSoup:
    response = session.get(url, timeout=timeout)
    response.raise_for_status()
    return BeautifulSoup(response.text, "html.parser")


def find_product_url(
    session: requests.Session,
    keyword: str,
) -> str | None:
    """
    hince 공식 검색 페이지에서 keyword와 가장 잘 맞는 상품 상세 URL을 선택.
    """
    search_url = f"{BASE_URL}/product/search.html?keyword={quote(keyword)}"
    soup = get_soup(session, search_url)

    wanted = normalized_name(keyword)
    candidates: list[tuple[int, str, str]] = []

    for a in soup.select('a[href*="/product/"]'):
        href = a.get("href")
        if not href:
            continue

        # 검색/목록 URL은 제외하고 실제 product detail 형태만 선택
        if (
            "/product/list" in href
            or "/product/search" in href
            or "/product/recent" in href
        ):
            continue

        text = clean_text(a.get_text(" ", strip=True))
        if not text:
            # anchor 내부 이미지 alt로 상품명이 들어있는 경우
            img = a.find("img")
            text = clean_text(img.get("alt", "")) if img else ""

        product_url = urljoin(BASE_URL, href)
        norm_text = normalized_name(text)

        if not norm_text:
            continue

        # 완전 일치 > 포함 관계 > 나머지
        if norm_text == wanted:
            score = 100
        elif wanted in norm_text:
            score = 80
        elif norm_text in wanted:
            score = 60
        else:
            # 한글/영문 문자 토큰 간단 유사도
            overlap = len(set(wanted) & set(norm_text))
            score = overlap

        candidates.append((score, product_url, text))

    if not candidates:
        return None

    candidates.sort(key=lambda x: x[0], reverse=True)

    best_score, best_url, best_text = candidates[0]
    if best_score <= 0:
        return None

    print(f"    검색 결과: {best_text or '(상품명 미표시)'}")
    return best_url


def image_url_from_tag(img, page_url: str) -> str | None:
    for attr in IMAGE_ATTRS:
        raw = img.get(attr)
        if not raw:
            continue

        raw = raw.strip()

        # srcset가 들어오는 경우 첫 URL만 사용
        if "," in raw and (" " in raw or raw.startswith("http")):
            raw = raw.split(",")[0].strip().split(" ")[0]

        if raw.startswith("//"):
            raw = "https:" + raw
        else:
            raw = urljoin(page_url, raw)

        parsed = urlparse(raw)
        if parsed.scheme not in ("http", "https"):
            continue

        return raw

    return None


def looks_like_non_product_image(url: str, alt: str = "") -> bool:
    """
    로고/아이콘/배너/버튼 같은 이미지를 대략적으로 제외.
    실제 상품 상세 컷은 이후 다운로드 후 크기 검사도 수행한다.
    """
    text = f"{url} {alt}".lower()

    bad_words = (
        "logo",
        "icon",
        "btn_",
        "button",
        "spinner",
        "loading",
        "common/",
        "layout/",
        "board/",
        "coupon",
        "kakao",
        "naver",
        "facebook",
        "instagram",
        "youtube",
        "arrow",
        "close",
        "cart",
        "search",
    )

    return any(word in text for word in bad_words)


def dedupe(urls: list[str]) -> list[str]:
    result = []
    seen = set()

    for url in urls:
        # querystring의 리사이즈 옵션 차이로 중복되는 경우를 줄임
        key = url.split("?")[0]

        if key in seen:
            continue

        seen.add(key)
        result.append(url)

    return result


def extract_main_image(soup: BeautifulSoup, page_url: str) -> str | None:
    """
    1) 상품 대표 이미지 셀렉터
    2) og:image
    3) 상품 상세 상단의 큰 이미지
    순서로 탐색.
    """
    selectors = (
        ".xans-product-detail .thumbnail img.BigImage",
        ".xans-product-detail .thumbnail img",
        ".xans-product-image img.BigImage",
        ".xans-product-image img",
        "#zoom_wrap img",
        ".thumbnail img",
    )

    for selector in selectors:
        for img in soup.select(selector):
            url = image_url_from_tag(img, page_url)
            if url and not looks_like_non_product_image(url, img.get("alt", "")):
                return url

    og = soup.select_one('meta[property="og:image"]')
    if og and og.get("content"):
        return urljoin(page_url, og["content"])

    return None


def extract_detail_images(
    soup: BeautifulSoup,
    page_url: str,
    main_image: str | None,
) -> list[str]:
    """
    Cafe24 계열 상품 상세 영역을 우선 탐색.
    """
    urls: list[str] = []

    detail_selectors = (
        "#prdDetail img",
        ".xans-product-additional #prdDetail img",
        ".cont img",
        ".detailArea img",
        ".product_detail img",
        ".product-detail img",
    )

    for selector in detail_selectors:
        for img in soup.select(selector):
            url = image_url_from_tag(img, page_url)

            if not url:
                continue

            if looks_like_non_product_image(url, img.get("alt", "")):
                continue

            urls.append(url)

    urls = dedupe(urls)

    if main_image:
        main_key = main_image.split("?")[0]
        urls = [u for u in urls if u.split("?")[0] != main_key]

    return urls


def download_as_jpg(
    session: requests.Session,
    url: str,
    destination: Path,
    min_width: int = 500,
    min_height: int = 500,
) -> bool:
    """
    원본 형식(webp/png/jpeg 등)에 관계없이 RGB JPG로 저장.
    너무 작은 이미지는 상세 상품 이미지가 아닌 것으로 보고 제외.
    """
    try:
        response = session.get(
            url,
            timeout=30,
            headers={
                **HEADERS,
                "Referer": BASE_URL + "/",
            },
        )
        response.raise_for_status()

        image = Image.open(io.BytesIO(response.content))
        image.load()

        width, height = image.size

        if width < min_width or height < min_height:
            print(f"      SKIP 작은 이미지: {width}x{height}")
            return False

        image = ImageOps.exif_transpose(image)

        if image.mode in ("RGBA", "LA"):
            background = Image.new("RGB", image.size, "white")
            alpha = image.getchannel("A")
            background.paste(image.convert("RGB"), mask=alpha)
            image = background
        else:
            image = image.convert("RGB")

        destination.parent.mkdir(parents=True, exist_ok=True)

        image.save(
            destination,
            format="JPEG",
            quality=92,
            optimize=True,
        )

        print(f"      저장: {destination.name} ({width}x{height})")
        return True

    except Exception as exc:
        print(f"      다운로드 실패: {url}")
        print(f"        -> {exc}")
        return False


def crawl_product(
    session: requests.Session,
    product_id: int,
    keyword: str,
    output_dir: Path,
    detail_limit: int,
    delay: float,
) -> dict:
    print()
    print("=" * 72)
    print(f"[{product_id}/10] {keyword}")

    product_url = find_product_url(session, keyword)

    if not product_url:
        print("    ERROR: 검색 결과에서 상품 페이지를 찾지 못했습니다.")
        return {
            "id": product_id,
            "keyword": keyword,
            "main": False,
            "details": 0,
            "url": None,
        }

    print(f"    URL: {product_url}")

    time.sleep(delay)
    soup = get_soup(session, product_url)

    main_url = extract_main_image(soup, product_url)
    detail_urls = extract_detail_images(soup, product_url, main_url)

    main_saved = False

    if main_url:
        print("    대표 이미지")
        main_saved = download_as_jpg(
            session,
            main_url,
            output_dir / f"product{product_id}.jpg",
        )
        time.sleep(delay)
    else:
        print("    WARNING: 대표 이미지를 찾지 못했습니다.")

    print(f"    상세 이미지 후보: {len(detail_urls)}개")

    detail_saved = 0

    # 상세 후보 중 실제 큰 이미지가 아닌 것들이 섞일 수 있으므로
    # limit개 저장될 때까지 후보를 순서대로 검사한다.
    for detail_url in detail_urls:
        if detail_saved >= detail_limit:
            break

        index = detail_saved + 1
        destination = output_dir / f"product_detail{product_id}_{index}.jpg"

        if download_as_jpg(session, detail_url, destination):
            detail_saved += 1

        time.sleep(delay)

    if detail_saved == 0:
        print("    WARNING: 저장 가능한 상세 이미지를 찾지 못했습니다.")

    return {
        "id": product_id,
        "keyword": keyword,
        "main": main_saved,
        "details": detail_saved,
        "url": product_url,
    }


def find_project_root(explicit_root: str | None) -> Path:
    if explicit_root:
        root = Path(explicit_root).expanduser().resolve()
    else:
        root = Path.cwd().resolve()

    # 현재 디렉터리부터 위로 올라가며 package.json 탐색
    for candidate in [root, *root.parents]:
        if (candidate / "package.json").exists():
            return candidate

    # tools/에서 실행했는데 package.json 탐색에 실패한 경우에도
    # 명확한 오류를 주기 위해 cwd 사용
    return root


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--project-root",
        help="Next.js 프로젝트 루트. 생략 시 package.json을 자동 탐색합니다.",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.0,
        help="각 HTTP 요청/다운로드 사이 대기 시간(초). 기본값 1.0",
    )
    parser.add_argument(
        "--detail-limit",
        type=int,
        default=3,
        help="상품당 저장할 상세 이미지 최대 개수. 기본값 3",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="기존 product*.jpg 파일을 지우고 다시 받습니다.",
    )

    args = parser.parse_args()

    project_root = find_project_root(args.project_root)
    output_dir = project_root / "public" / "images" / "products"
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"프로젝트 루트: {project_root}")
    print(f"이미지 저장 폴더: {output_dir}")

    if not (project_root / "package.json").exists():
        print()
        print("WARNING: package.json을 찾지 못했습니다.")
        print("프로젝트 루트에서 실행하거나 --project-root를 지정하세요.")

    if args.overwrite:
        for pattern in ("product*.jpg", "product_detail*.jpg"):
            for path in output_dir.glob(pattern):
                path.unlink()
        print("기존 크롤링 이미지 삭제 완료")

    session = requests.Session()
    session.headers.update(HEADERS)

    results = []

    for product in PRODUCTS:
        result = crawl_product(
            session=session,
            product_id=product["id"],
            keyword=product["keyword"],
            output_dir=output_dir,
            detail_limit=max(1, args.detail_limit),
            delay=max(0.5, args.delay),
        )
        results.append(result)

    print()
    print("=" * 72)
    print("완료")
    print("=" * 72)

    for result in results:
        main_status = "O" if result["main"] else "X"
        print(
            f'{result["id"]:>2}. {result["keyword"]:<24} '
            f'대표[{main_status}] 상세[{result["details"]}]'
        )

    print()
    print("예상 Next.js 이미지 경로 예:")
    print("  /images/products/product1.jpg")
    print("  /images/products/product_detail1_1.jpg")


if __name__ == "__main__":
    main()
