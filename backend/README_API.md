# Backend API

Spring Boot + JPA + MySQL backend for the portfolio project.

## Environment

Set the DB password before running:

```bash
export DB_PASSWORD='YOUR_DB_PASSWORD'
```

Optional:

```bash
export DB_URL='jdbc:mysql://HOST:3306/portfolio_db?serverTimezone=Asia/Seoul&characterEncoding=UTF-8'
export DB_USERNAME='root'
export CORS_ALLOWED_ORIGINS='http://localhost:3000'
```

Run:

```bash
./gradlew bootRun
```

Default API base:

```text
http://localhost:8080/api
```

## API

### Resume

`GET /api/resume`

Returns profile, skills, experiences, educations, and introductions in a single response.

### Products

`GET /api/products`

Only SALE products are returned.

Optional category filter:

`GET /api/products?category=BASE`

Detail:

`GET /api/products/{id}`

The product detail response includes:
- base product information
- product_details
- product_images
- product_colors

### Community

`GET /api/community/posts`

Optional category:

`GET /api/community/posts?category=NOTICE`

Supported categories:
- NOTICE
- FAQ
- EVENT
- QNA

Detail:

`GET /api/community/posts/{id}`

Reading a post increments `view_count`.

## Frontend examples

```ts
const products = await fetch("http://localhost:8080/api/products").then(r => r.json());

const product = await fetch("http://localhost:8080/api/products/1").then(r => r.json());

const resume = await fetch("http://localhost:8080/api/resume").then(r => r.json());

const posts = await fetch("http://localhost:8080/api/community/posts").then(r => r.json());
```
