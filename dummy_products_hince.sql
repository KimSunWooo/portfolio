SET autocommit = 0;
START TRANSACTION;

INSERT INTO products (name, price, thumbnail, status, stock) VALUES ('시그니처 브로우 펜슬', 18000, 'https://2026portfolio.s3.ap-northeast-2.amazonaws.com/products/2d9ecd6f-d531-4111-82e1-82d64c9f657a.jpg', 'SALE', 100);
-- -----------------------------------
INSERT INTO products (name, price, thumbnail, status, stock) VALUES ('싱글 아이섀도우', 19200, 'https://2026portfolio.s3.ap-northeast-2.amazonaws.com/products/6de663a8-85e5-4eb7-9239-e2b7b89c708c.png', 'SALE', 100);
-- -----------------------------------
INSERT INTO products (name, price, thumbnail, status, stock) VALUES ('래디언스 UV 루스 파우더', 20700, 'https://2026portfolio.s3.ap-northeast-2.amazonaws.com/products/81e38e9d-30b8-4a8a-867b-3a2f74dd23c2.jpg', 'SALE', 100);
-- -----------------------------------
INSERT INTO products (name, price, thumbnail, status, stock) VALUES ('미러 듀 글로스', 15300, 'https://2026portfolio.s3.ap-northeast-2.amazonaws.com/products/bd4efa6f-59b3-4c46-89d0-ec5adc5d97f9.jpg', 'SALE', 100);
-- -----------------------------------
INSERT INTO products (name, price, thumbnail, status, stock) VALUES ('누 블러 틴트', 15300, 'https://2026portfolio.s3.ap-northeast-2.amazonaws.com/products/86073842-018f-4d98-b6c4-672e9586475b.jpg', 'SALE', 100);
-- -----------------------------------
INSERT INTO products (name, price, thumbnail, status, stock) VALUES ('커버 마스터 핑크 쿠션', 32400, 'https://2026portfolio.s3.ap-northeast-2.amazonaws.com/products/a85b3fba-261e-4040-b439-33dd92a7ad01.jpg', 'SALE', 100);
-- -----------------------------------
INSERT INTO products (name, price, thumbnail, status, stock) VALUES ('무드인핸서 마뜨 립스틱', 13300, 'https://2026portfolio.s3.ap-northeast-2.amazonaws.com/products/1e94d32b-d421-4dea-a0e1-9a0ec8ae5251.jpg', 'SALE', 100);
-- -----------------------------------
INSERT INTO products (name, price, thumbnail, status, stock) VALUES ('세컨 스킨 파운데이션', 25200, 'https://2026portfolio.s3.ap-northeast-2.amazonaws.com/products/1ef20139-25a5-4410-a7a7-fe8cd0b60c19.jpg', 'SALE', 100);
-- -----------------------------------
INSERT INTO products (name, price, thumbnail, status, stock) VALUES ('시그니처 브로우 쉐이퍼', 16200, 'https://2026portfolio.s3.ap-northeast-2.amazonaws.com/products/b4476628-2bc1-4baa-a05d-9b01b0f92a4c.jpg', 'SALE', 100);
-- -----------------------------------
INSERT INTO products (name, price, thumbnail, status, stock) VALUES ('누 글로우 화이트 쿠션', 30600, 'https://2026portfolio.s3.ap-northeast-2.amazonaws.com/products/a296f6b2-0a8f-4bd1-bbd1-b0192b6540c4.jpg', 'SALE', 100);
-- -----------------------------------
INSERT INTO products (name, price, thumbnail, status, stock) VALUES ('트루 디멘션 래디언스 밤', 46400, 'https://2026portfolio.s3.ap-northeast-2.amazonaws.com/products/ba4133d7-cb96-4690-98c1-88d6908803f5.png', 'SALE', 100);
-- -----------------------------------
INSERT INTO products (name, price, thumbnail, status, stock) VALUES ('포어 샷 모공 블러 프라이머', 19800, 'https://2026portfolio.s3.ap-northeast-2.amazonaws.com/products/915ace7f-0a60-4c58-ad02-1543ef4a7a71.jpg', 'SALE', 100);
-- -----------------------------------
COMMIT;