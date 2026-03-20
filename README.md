# 📰 충정일보

Node.js + Express + MySQL 기반의 간단한 뉴스 웹 서비스입니다.
회원 역할(기자 / 손님)에 따라 기능이 분리되어 있습니다.

---

## 🚀 주요 기능

### 👤 회원 기능

* 회원가입 (JWT 발급)
* 로그인 / 로그아웃
* 역할 기반 페이지 이동 (기자 / 손님)

### 📰 기사 기능

* 기사 작성 (기자만 가능)
* 기사 검색 (제목 / 내용 / 기자 이름 기준)
* 기사 목록 조회

---

## 🧑‍💼 역할(Role)

| 역할 | 기능         |
| -- | ---------- |
| 기자 | 기사 작성 + 조회 |
| 손님 | 기사 조회만 가능  |

---

## 🛠 기술 스택

* Backend: Node.js, Express
* DB: MySQL
* Auth: JWT (jsonwebtoken)
* Password: bcrypt
* Frontend: HTML, CSS, Vanilla JS

---

## 📂 프로젝트 구조

```
project/
│
├── server.js
├── templates/
│   ├── main.html
│   ├── writer.html
│   └── customer.html
│
├── static/
│   └── (이미지 파일)
│
└── README.md
```

---

## ⚙️ 실행 방법

### 1. 패키지 설치

```
npm install express mysql2 jsonwebtoken bcrypt
```

---

### 2. 서버 실행

```
node server.js
```

---

### 3. 접속

```
http://localhost:3000
```

---

## 🗄 데이터베이스 설정

### DB 생성

```sql
CREATE DATABASE testdb;
USE testdb;
```

---

### 초기화

```sql
TRUNCATE TABLE news;
TRUNCATE TABLE users;
```

---

## 🔐 인증 구조

* 로그인 성공 시 JWT 발급
* localStorage에 토큰 저장
* API 요청 시 Authorization 헤더 사용

```
Authorization: Bearer <token>
```

---

## 🧠 핵심 구현 포인트

* async/await 기반 비동기 처리
* 역할 기반 접근 제어 (Middleware)
* DOM 기반 동적 렌더링
* REST API 설계

---

## 📌 개선 가능 사항

* 이미지 업로드 기능 (현재 파일명 입력 방식)
* pagination 추가
* 댓글 기능
* 좋아요 기능
* 반응형 UI 개선

---

## 👨‍💻 제작자

김명진
