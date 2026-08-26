# Micro Frontend Enterprise Banking Platform — Architecture & Implementation Prompt

Bạn là một **Senior Frontend Architect / Solution Architect / Staff Frontend Engineer**, có kinh nghiệm sâu về:

- Micro Frontend Architecture
- Module Federation
- Next.js
- React
- Vue
- Angular
- TypeScript
- NestJS
- REST API
- Authentication / Authorization
- TanStack Query
- Docker
- Nginx
- CI/CD
- Frontend performance
- Distributed frontend systems
- Independent deployment
- Frontend observability

Hãy giúp tôi thiết kế và triển khai một **Enterprise Banking Platform** nhằm mục đích học và demonstrate **Micro Frontend Architecture** ở mức production-like.

Đây không phải một project CRUD đơn giản.

Mục tiêu chính là giúp tôi hiểu sâu:

> Làm thế nào để nhiều frontend application được phát triển, build, deploy và version độc lập nhưng vẫn tạo thành một hệ thống thống nhất đối với người dùng.

---

# 1. Mục tiêu tổng thể

Xây dựng một hệ thống Banking Platform có kiến trúc:

```text
                         ┌──────────────────────┐
                         │      Browser         │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Next.js Shell      │
                         │                      │
                         │ - Layout             │
                         │ - Navigation         │
                         │ - Authentication     │
                         │ - Global UI          │
                         │ - Routing            │
                         └──────────┬───────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
       ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
       │ React MFE      │  │ Vue MFE        │  │ Angular MFE    │
       │                │  │                │  │                │
       │ Dashboard      │  │ Account        │  │ Transfer       │
       └────────────────┘  └────────────────┘  └────────────────┘
                │                   │                   │
                └───────────────────┼───────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    API Gateway       │
                         │      NestJS          │
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 ▼                  ▼                  ▼
            Account API       Transfer API      Transaction API
                 │                  │                  │
                 └──────────────────┼──────────────────┘
                                    ▼
                              PostgreSQL
```

---

# 2. Technology Stack

## Shell

Sử dụng:

- Next.js
- React
- TypeScript
- App Router
- Module Federation
- TanStack Query nếu cần global/server state
- Tailwind CSS

Shell chịu trách nhiệm:

- Application layout
- Global navigation
- Authentication state
- Session
- Route orchestration
- Global error handling
- Loading state
- Shared UI primitives
- Global notifications
- Loading các Micro Frontend

Shell KHÔNG được sở hữu business logic của các domain bên dưới.

---

# 3. Micro Frontend #1 — React Dashboard

Sử dụng:

- React
- TypeScript
- Vite hoặc framework phù hợp
- Module Federation
- TanStack Query

Business domain:

```text
Dashboard
```

Chức năng:

- Tổng số dư
- Tổng tài sản
- Recent transactions
- Spending overview
- Monthly statistics
- Financial chart
- Account summary

React Dashboard phải là một application độc lập.

Nó phải có:

```text
dashboard/
├── src/
├── package.json
├── vite.config.ts
└── ...
```

Có thể chạy độc lập:

```bash
npm run dev
```

và cũng có thể được load bởi Shell.

---

# 4. Micro Frontend #2 — Vue Account

Sử dụng:

- Vue 3
- TypeScript
- Vite
- Module Federation
- Pinia nếu cần local/client state
- TanStack Query hoặc Vue Query cho server state

Business domain:

```text
Account
```

Chức năng:

- Account list
- Account detail
- Balance
- Bank card
- Beneficiary
- Account settings
- Transaction history

Vue MFE phải hoàn toàn độc lập với React MFE.

Không được import trực tiếp:

```text
React code
Angular code
Shell internal code
```

---

# 5. Micro Frontend #3 — Angular Transfer

Sử dụng:

- Angular
- TypeScript
- Module Federation
- Angular Router
- RxJS

Business domain:

```text
Money Transfer
```

Chức năng:

- Select source account
- Select beneficiary
- Enter amount
- Transfer form
- Transfer confirmation
- Transfer result
- Transfer history

Flow:

```text
Select Account
      ↓
Select Beneficiary
      ↓
Enter Amount
      ↓
Review
      ↓
Confirm
      ↓
Transfer API
      ↓
Success / Failure
```

Angular MFE phải có thể phát triển và deploy độc lập.

---

# 6. Micro Frontend Architecture

Không được thiết kế theo kiểu:

```text
Next.js
 ├── React component
 ├── Vue component
 └── Angular component
```

Mà phải thiết kế theo kiểu:

```text
                 Shell
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
     React        Vue       Angular
      MFE         MFE         MFE
```

Mỗi MFE phải là một application độc lập.

Mỗi MFE có:

- Source code riêng
- package.json riêng
- Build process riêng
- Version riêng
- Deployment riêng
- CI/CD riêng

---

# 7. Module Federation

Sử dụng Module Federation làm cơ chế runtime composition.

Giải thích và triển khai:

```text
Host
Remote
Remote Entry
Shared Dependencies
Runtime Loading
```

Ví dụ:

```text
Shell
  │
  ├── dashboard remote
  │
  ├── account remote
  │
  └── transfer remote
```

Mỗi remote phải expose entry point rõ ràng.

Ví dụ concept:

```text
dashboard/remoteEntry.js
account/remoteEntry.js
transfer/remoteEntry.js
```

Shell phải có khả năng load các remote application runtime.

Không hard-code source code của remote vào Shell.

---

# 8. Routing

Thiết kế routing:

```text
/banking
/banking/dashboard
/banking/accounts
/banking/accounts/:id
/banking/transfer
/banking/transfer/history
```

Trong đó:

```text
/dashboard → React MFE
/accounts   → Vue MFE
/transfer   → Angular MFE
```

Shell chịu trách nhiệm orchestration.

Mỗi MFE chịu trách nhiệm routing nội bộ của domain mình nếu phù hợp.

Giải thích rõ:

- Host routing
- Remote routing
- Route ownership
- Deep linking
- Browser refresh
- 404
- Navigation giữa các MFE

---

# 9. Authentication

Thiết kế authentication theo hướng production-like.

Flow:

```text
Login
  ↓
Authentication
  ↓
Session
  ↓
Shell
  ↓
MFE
```

Tất cả MFE phải sử dụng cùng authentication context.

Không được để:

```text
React → login riêng
Vue → login riêng
Angular → login riêng
```

Thay vào đó:

```text
                Auth
                 │
        ┌────────┼────────┐
        ▼        ▼        ▼
      React     Vue    Angular
```

Thiết kế:

- Access token
- Refresh token
- Session
- Logout
- Token expiration
- Unauthorized request
- Redirect login
- Permission

Ưu tiên mô hình an toàn cho browser.

Giải thích trade-off giữa:

```text
localStorage
sessionStorage
httpOnly cookie
memory
```

---

# 10. Authorization / RBAC

Xây dựng RBAC.

Ví dụ:

```text
ADMIN
CUSTOMER
STAFF
```

Permissions:

```text
VIEW_DASHBOARD
VIEW_ACCOUNT
TRANSFER_MONEY
VIEW_TRANSACTION
MANAGE_BENEFICIARY
```

Ví dụ:

```text
CUSTOMER
 ├── VIEW_DASHBOARD
 ├── VIEW_ACCOUNT
 ├── TRANSFER_MONEY
 └── VIEW_TRANSACTION
```

Angular Transfer phải kiểm tra permission:

```text
TRANSFER_MONEY
```

Không được chỉ dựa vào UI hiding.

Backend cũng phải validate authorization.

---

# 11. Communication giữa các MFE

Thiết kế nhiều phương án communication.

So sánh:

```text
Props
Custom Events
Event Bus
Shared State
URL
postMessage
```

Không cho phép các MFE import trực tiếp state nội bộ của nhau.

Ví dụ:

```text
Account MFE
      │
      │ account-selected
      ▼
     Shell
      │
      ▼
Transfer MFE
```

Ví dụ event:

```text
account:selected
transfer:completed
auth:logout
notification:show
```

Thiết kế event contract rõ ràng bằng TypeScript.

---

# 12. Shared State

Không tạo một Redux store khổng lồ cho toàn hệ thống.

Phân biệt:

## Global state

```text
Authentication
Current User
Locale
Theme
Global Notification
```

## Local state

```text
Transfer form
Dashboard filter
Account UI state
Modal state
Pagination
```

## Server state

```text
Accounts
Transactions
Balance
Transfer history
```

Server state nên được xử lý bằng:

```text
TanStack Query
```

hoặc công cụ tương ứng của từng framework.

Giải thích tại sao:

```text
Global State ≠ Server State
```

và tại sao không nên biến toàn bộ backend data thành global client state.

---

# 13. Shared Dependencies

Phải xử lý:

```text
React
React DOM
Vue
Angular
Common libraries
UI libraries
```

Đặc biệt nghiên cứu:

```text
Singleton
Version conflict
Dependency duplication
Shared runtime
Compatible version
```

Mô phỏng tình huống:

```text
Shell
React 19

Dashboard
React 19

Another MFE
React 18
```

Giải thích:

- Khi nào share dependency?
- Khi nào không nên share?
- Điều gì xảy ra khi version mismatch?
- Bundle size ảnh hưởng như thế nào?

---

# 14. CSS Isolation

Mỗi MFE phải tránh CSS collision.

Nghiên cứu:

```text
CSS Modules
Scoped CSS
Shadow DOM
BEM
Tailwind prefix
CSS naming convention
```

Ví dụ:

```text
React MFE
.dashboard-card

Vue MFE
.account-card

Angular MFE
.transfer-card
```

Không được để CSS của một MFE phá vỡ UI của MFE khác.

---

# 15. Error Isolation

Một MFE crash không được làm toàn bộ application chết.

Ví dụ:

```text
Dashboard ❌
      │
      ▼
Shell
      │
      ├── Account ✅
      └── Transfer ✅
```

Shell phải có:

```text
Error Boundary
Fallback UI
Retry
Remote unavailable state
Timeout handling
```

Ví dụ:

```text
Failed to load Account MFE

[Retry]
```

Các MFE khác vẫn phải hoạt động.

---

# 16. Loading Strategy

Thiết kế:

```text
Shell
  │
  ├── Dashboard
  │
  ├── Account
  │
  └── Transfer
```

Mỗi remote có:

```text
Loading
Success
Error
Timeout
Unavailable
```

Không để việc load một remote block toàn bộ application.

Nghiên cứu:

- Lazy loading
- Dynamic import
- Prefetch
- Preload
- Runtime loading
- Retry
- Timeout

---

# 17. Backend

Sử dụng:

- NestJS
- PostgreSQL
- Prisma

Thiết kế API:

```text
/auth
/users
/accounts
/transactions
/beneficiaries
/transfers
```

Database:

```text
User
Account
Transaction
Beneficiary
Transfer
```

Không cần xây dựng banking logic thật.

Đây là hệ thống simulation phục vụ mục đích học architecture.

---

# 18. API Contract

Tất cả MFE giao tiếp với backend thông qua API contract.

Không cho phép:

```text
React MFE
   ↓
Vue MFE internal API
```

hoặc:

```text
Angular MFE
   ↓
React internal state
```

MFE chỉ giao tiếp qua:

```text
Backend API
Shared contract
Events
Shell contract
```

Thiết kế TypeScript types hoặc OpenAPI contract nếu phù hợp.

---

# 19. Independent Deployment

Đây là requirement bắt buộc.

Ví dụ:

```text
Shell
v1.0.0

Dashboard
v1.4.0

Account
v2.1.0

Transfer
v3.0.0
```

Khi deploy:

```text
Transfer v3.0 → v3.1
```

không được yêu cầu:

```text
Shell rebuild
Dashboard rebuild
Account rebuild
```

Demo flow:

```text
Deploy Shell
      ↓
Deploy Dashboard
      ↓
Deploy Account
      ↓
Deploy Transfer
```

Mỗi application có pipeline riêng.

---

# 20. CI/CD

Thiết kế GitHub Actions.

Repository có thể:

```text
microfrontend-shell
microfrontend-dashboard
microfrontend-account
microfrontend-transfer
microfrontend-api
```

Mỗi repository:

```text
Pull Request
   ↓
Lint
   ↓
Type Check
   ↓
Unit Test
   ↓
Build
   ↓
Docker Image
   ↓
Deploy
```

Một MFE thay đổi không được trigger build toàn bộ hệ thống nếu không cần thiết.

---

# 21. Docker

Mỗi application chạy độc lập.

Ví dụ:

```text
docker-compose
│
├── shell
├── dashboard
├── account
├── transfer
├── api
├── postgres
└── nginx
```

Nginx có thể đóng vai trò reverse proxy.

---

# 22. Versioning

Mỗi MFE phải có version riêng.

Ví dụ:

```text
dashboard@1.2.0
account@2.4.1
transfer@3.1.0
```

Nghiên cứu:

```text
Semantic Versioning
Backward Compatibility
Breaking Change
Remote Version
Rollback
```

---

# 23. Observability

Thêm logging cơ bản.

Mỗi request nên có:

```text
requestId
userId
application
remote
timestamp
```

Ví dụ:

```text
requestId: abc-123
application: transfer-mfe
action: create-transfer
```

Nếu Transfer MFE gặp lỗi, có thể trace được lỗi đến đúng application.

---

# 24. Performance

Đo:

```text
Initial Load
TTFB
FCP
LCP
JS Bundle Size
Remote Loading Time
Hydration
Network Requests
```

So sánh:

```text
Monolith Frontend
vs
Micro Frontend
```

Phân tích:

### Micro Frontend advantages

- Independent deployment
- Team autonomy
- Domain ownership
- Technology independence

### Micro Frontend disadvantages

- More network requests
- Duplicate dependencies
- More complex debugging
- Runtime failures
- Version management
- Increased operational complexity

Không được mặc định kết luận rằng Micro Frontend luôn tốt hơn Monolith.

---

# 25. Security

Phân tích:

```text
XSS
CSRF
Token theft
Authentication
Authorization
CORS
CSP
Clickjacking
Third-party script
Remote code loading
```

Đặc biệt phân tích rủi ro của:

```text
Runtime loading remote JavaScript
```

Nếu remote application bị compromise thì Shell có thể bị ảnh hưởng như thế nào?

Đưa ra mitigation strategies.

---

# 26. Testing

Thiết kế testing strategy:

```text
Unit Test
Integration Test
Contract Test
E2E Test
```

Ví dụ:

```text
React Dashboard
→ Unit tests

Vue Account
→ Component tests

Angular Transfer
→ Integration tests

Whole Platform
→ Playwright E2E
```

E2E test:

```text
Login
 ↓
Dashboard
 ↓
Account
 ↓
Transfer
 ↓
Confirm
 ↓
Success
```

---

# 27. Folder Structure

Đề xuất folder structure rõ ràng cho:

```text
shell/
dashboard-mfe/
account-mfe/
transfer-mfe/
api/
```

Mỗi structure phải giải thích:

- Vì sao chia như vậy?
- Domain boundary ở đâu?
- Shared code nằm ở đâu?
- Những gì không được share?

---

# 28. Development Mode

Tôi muốn có thể chạy:

```bash
docker compose up
```

hoặc:

```bash
pnpm dev
```

và toàn bộ hệ thống hoạt động.

Development:

```text
Shell
localhost:3000

Dashboard
localhost:3001

Account
localhost:3002

Transfer
localhost:3003

API
localhost:4000
```

Shell phải load các remote từ các port tương ứng.

---

# 29. Production Mode

Production phải mô phỏng:

```text
Shell
https://bank.example.com

Dashboard
https://dashboard.example.com

Account
https://account.example.com

Transfer
https://transfer.example.com

API
https://api.example.com
```

Không được assume rằng tất cả application chạy trên cùng một server.

---

# 30. Documentation

Tạo README đầy đủ.

README phải có:

```text
1. Project Overview
2. Architecture
3. Why Micro Frontend?
4. Repository Structure
5. Technology Stack
6. Module Federation
7. Host / Remote
8. Routing
9. Authentication
10. Authorization
11. Communication
12. Shared State
13. Shared Dependencies
14. Error Isolation
15. Deployment
16. CI/CD
17. Docker
18. Performance
19. Security
20. Trade-offs
```

Đặc biệt phải có architecture diagrams bằng Mermaid.

---

# 31. Điều tôi muốn học được từ project

Không chỉ đưa ra code.

Với mỗi architectural decision, hãy giải thích:

```text
Problem
   ↓
Possible Solutions
   ↓
Trade-offs
   ↓
Chosen Solution
   ↓
Why?
```

Ví dụ:

```text
Problem:
Làm sao Shell giao tiếp với Transfer MFE?

Option A:
Shared Redux

Option B:
Custom Event

Option C:
URL

Option D:
Event Bus

Chosen:
Custom Event + typed contract

Why:
Loose coupling
```

---

# 32. Những thứ tuyệt đối không được làm

Không tạo:

```text
Một repository duy nhất
Một global state khổng lồ
Một package chứa toàn bộ business logic
Các MFE import trực tiếp code của nhau
Các MFE phụ thuộc chặt vào implementation của Shell
Một CI/CD pipeline deploy tất cả
```

Không biến project thành:

```text
Next.js application
+ vài component Vue
+ vài component Angular
```

Đó không phải Micro Frontend architecture đúng nghĩa.

---

# 33. Expected final architecture

Tôi muốn architecture cuối cùng gần với:

```text
                           USER
                            │
                            ▼
                    ┌──────────────┐
                    │ Next.js Shell │
                    └───────┬──────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
    React Dashboard    Vue Account      Angular Transfer
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                            ▼
                       NestJS API
                            │
                    ┌───────┴───────┐
                    │               │
                PostgreSQL        Redis
```

Với:

```text
Module Federation
       +
Independent Deployment
       +
Domain Ownership
       +
Loose Coupling
       +
Authentication
       +
Authorization
       +
Error Isolation
       +
Observability
       +
CI/CD
```

---

# 34. Cách triển khai

Không triển khai toàn bộ project một lần.

Chia thành các phase:

## Phase 1 — Basic MFE

```text
Next.js Shell
React Dashboard
Vue Account
Angular Transfer
```

Mục tiêu:

```text
Host
Remote
Runtime Composition
Routing
```

---

## Phase 2 — Communication

```text
Shell
 ↕
React
 ↕
Vue
 ↕
Angular
```

Thêm:

```text
Custom Events
Shared contracts
Navigation events
Authentication events
```

---

## Phase 3 — Authentication

Thêm:

```text
Login
Session
Logout
Token expiration
RBAC
```

---

## Phase 4 — Backend

Thêm:

```text
NestJS
PostgreSQL
Prisma
REST API
```

---

## Phase 5 — Production Architecture

Thêm:

```text
Docker
Nginx
CI/CD
Independent deployment
Versioning
Error isolation
Monitoring
```

---

## Phase 6 — Advanced Architecture

Nghiên cứu:

```text
SSR
Next.js
RSC
Hydration
Caching
Prefetch
CDN
Remote versioning
Rollback
Contract testing
Performance optimization
Security
```

---

# 35. Cách trả lời

Trong quá trình triển khai, đừng chỉ đưa code.

Mỗi phase hãy trình bày theo format:

```text
## Goal

## Architecture

## Why this architecture?

## Folder Structure

## Implementation

## Code

## How it works

## How to run

## Testing

## Common Problems

## Trade-offs

## What I should learn from this phase
```

Nếu có nhiều cách triển khai, hãy đưa ra ít nhất 2 phương án và phân tích trade-off trước khi chọn một phương án.

Ưu tiên kiến trúc có tính production-like nhưng không over-engineer.

Mục tiêu cuối cùng không phải chỉ là "làm cho project chạy được", mà là giúp tôi **hiểu sâu Micro Frontend Architecture và có thể giải thích được architecture này trong một buổi phỏng vấn Senior Frontend/System Design.**
