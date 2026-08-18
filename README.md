# Hince-inspired Next.js + Tailwind UI

제작 : 김선우
디자인 참조 : 힌스 (https://hince.co.kr/?srsltid=AfmBOoquTlfKHfkjheDsfVdyhA1scOr2TneZsfWzmtaGlT_qBf35qf0h)

## 포트폴리오 구성
- 웹-프론트 : react-next
- 웹-백앤드 : JAVA
- 로보틱스 소프트웨어 : Python, Aduino, Ros2

## 구성
- Header
- SideMenu
- SearchPanel
- Button / Icon
- Hero
- ProductCard / ProductGrid
- ProductSection
- ShopHeader
- Footer
- Home / Shop page

## Tailwind
컴포넌트별 CSS 파일을 사용하지 않습니다. 모든 컴포넌트 스타일은 Tailwind utility class로 작성했습니다.

Tailwind CSS v4 기준으로 `app/globals.css`에서 `@import "tailwindcss";`를 사용합니다.

## 주의
실제 hince 로고, 상품 이미지, 원본 HTML/CSS는 복사하지 않았습니다. 샘플 이미지와 atelier 텍스트를 사용했습니다.

## Client Components
Header, SideMenu, SearchPanel, ProductCard는 state/event handler를 사용하므로 `"use client"`가 포함되어 있습니다.
