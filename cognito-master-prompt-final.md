# COGNITO — MASTER PROMPT (FINAL)

## FULL SYSTEM AUDIT → RESTRUCTURE → IMPLEMENT → TEST → PRE-DEPLOY

---

# 0. VAI TRÒ CỦA BẠN

Bạn là AI Software Architect + Senior Full-Stack Engineer được giao nhiệm vụ **hoàn thiện toàn bộ hệ thống Cognito từ source code hiện tại**.

Không được coi đây là dự án mới.

Bạn phải:

1. Đọc toàn bộ source code hiện tại.
2. Hiểu kiến trúc hiện tại.
3. Hiểu database hiện tại.
4. Hiểu API hiện tại.
5. Hiểu frontend hiện tại.
6. Hiểu các module AI hiện tại.
7. Xác định module nào đang hoạt động.
8. Xác định module nào lỗi.
9. Xác định module nào dư thừa.
10. Xác định dependency trước khi xóa.
11. Sau đó mới tái cấu trúc.
12. Cuối cùng phải test toàn bộ business flow end-to-end.

**KHÔNG được tự viết lại toàn bộ hệ thống từ đầu nếu code hiện tại đã có implementation tốt.**

Ưu tiên:

```text
READ EXISTING CODE
        ↓
UNDERSTAND
        ↓
AUDIT
        ↓
PLAN
        ↓
REFACTOR
        ↓
IMPLEMENT
        ↓
INTEGRATE
        ↓
TEST
        ↓
FIX
        ↓
FINAL AUDIT
```

---

# 0.1 CÁCH SỬ DỤNG PROMPT NÀY (BẮT BUỘC ĐỌC TRƯỚC KHI BẮT ĐẦU)

Đây là quy tắc vận hành cho toàn bộ 37 phase bên dưới. Áp dụng cho mọi phase,
không lặp lại ở từng phase.

## 0.1.1 Một phase mỗi lượt

Chỉ thực hiện **đúng 1 phase** mỗi lần được yêu cầu, dù bạn (AI) có khả năng làm
nhiều hơn. Sau khi xong 1 phase, DỪNG và đợi được yêu cầu tiếp tục sang phase kế.
Không tự động chạy PHASE X+1 sau khi xong PHASE X trừ khi được xác nhận rõ ràng.

## 0.1.2 File trạng thái xuyên suốt — PROJECT_STATE.md

Ngay từ PHASE 0, tạo và duy trì một file `PROJECT_STATE.md` ở gốc repo. Sau
MỖI phase, cập nhật file này (append, không ghi đè phần cũ) với:

```text
## PHASE X — [tên phase] — [ngày/lượt chạy]
Status: DONE / PARTIAL / BLOCKED
Tóm tắt thay đổi:
...
Bảng/API/Component đã đụng tới:
...
Việc còn lại / rủi ro chuyển sang phase sau:
...
```

Trước khi bắt đầu bất kỳ phase nào (kể cả nếu đang cùng phiên chat), luôn
đọc lại `PROJECT_STATE.md` trước, không chỉ dựa vào trí nhớ hội thoại — vì
code có thể đã đổi khác kể từ lúc audit ban đầu, và phiên làm việc có thể bị
ngắt giữa chừng.

## 0.1.3 Gate bắt buộc trước khi qua phase tiếp theo

Một phase chỉ được đánh dấu DONE và cho phép chuyển tiếp khi:

```text
- Build passed
- Lint passed
- TypeScript check passed (nếu áp dụng)
- Không có lỗi mới phát sinh so với trước phase này
```

Nếu bất kỳ điều kiện nào không đạt, phase đó phải ở trạng thái BLOCKED hoặc
PARTIAL, và bạn phải liệt kê rõ lỗi trước khi dừng lượt này. KHÔNG được tự ý
"coi như xong" để chuyển phase kế tiếp khi build/test đang đỏ.

## 0.1.4 Checkpoint trước các thao tác phá hủy

Trước khi thực hiện bất kỳ thao tác nào thuộc loại phá hủy — xóa bảng, xóa
migration, xóa module lớn (đặc biệt PHASE 2 và PHASE 34) — bắt buộc:

```text
1. Xác nhận đã có commit/backup gần nhất trước khi sửa
2. Ưu tiên soft-remove trước (rename/deprecate) thay vì DROP/xóa file ngay
3. Ghi rõ trong PROJECT_STATE.md: "Checkpoint trước xóa: [mô tả]"
4. Chỉ xóa hẳn (hard delete) sau khi đã xác nhận không còn dependency và
   đã chạy qua ít nhất 1 vòng build+test thành công ở trạng thái soft-remove
```

Nếu không có quyền truy cập git/backup thật, phải nói rõ điều này thay vì
im lặng xóa thẳng.

## 0.1.5 Payment không test bằng production key

Ở PHASE 19 (Payment), nếu phát hiện có payment provider key thật/production
đã cấu hình trong source, KHÔNG gọi thử bằng key đó. Phải:

```text
- Dùng sandbox/test mode của provider để test toàn bộ flow
- Nếu không có sandbox key, dừng và báo BLOCKED, không tự bịa mock
  "payment success"
```

## 0.1.6 Không tự bịa khi thiếu thông tin

Nếu prompt không nói rõ công nghệ cụ thể (framework, ORM, payment provider...),
map theo đúng những gì source code hiện tại đang dùng. Không tự chọn công nghệ
khác chỉ vì "phổ biến hơn".

---

# 1. PRODUCT DIRECTION — COGNITO LÀ GÌ?

Cognito không còn là School LMS.

Cognito là:

> **AI-powered Personal Learning Platform + Learning Community**

Mục tiêu chính:

```text
Người dùng
   ↓
Lưu tài liệu học tập
   ↓
Đọc / xem tài liệu
   ↓
AI hỗ trợ học
   ↓
Tạo câu hỏi / Quiz
   ↓
Làm bài
   ↓
Xem kết quả
   ↓
Ôn lỗi
   ↓
Focus học tập
   ↓
Progress / Goal / Streak
   ↓
Chia sẻ kiến thức với Community
```

Community mở rộng:

```text
Create Resource
      ↓
Publish
      ↓
Community
      ↓
Other User Studies
      ↓
Save / Like / Comment
      ↓
Reshare
      ↓
New User Studies
```

Premium:

```text
FREE
 ↓
Use Features
 ↓
Reach Usage Limit
 ↓
Upgrade
 ↓
Checkout
 ↓
Payment
 ↓
Subscription
 ↓
Premium Entitlement
 ↓
Higher Limits / Premium Features
```

Cognito chỉ có **2 role nghiệp vụ chính**:

```text
USER
ADMIN
```

Không có:

```text
TEACHER
SCHOOL
ORGANIZATION
CLASS
SEMESTER
ACADEMIC YEAR
TEACHER STUDIO
```

---

# 2. CORE PRODUCT STRUCTURE

Architecture nghiệp vụ cuối cùng:

```text
COGNITO
│
├── AUTHENTICATION
│
├── PERSONAL LEARNING
│   ├── Documents
│   ├── Viewer
│   ├── AI Chat
│   ├── Question Generator
│   ├── Question Sets
│   ├── Quiz
│   ├── Results
│   ├── Notes
│   ├── Mindmaps
│   ├── Flashcards
│   └── Learning History
│
├── FOCUS
│   ├── Focus Session
│   ├── Timer
│   ├── Distraction Events
│   ├── Break
│   └── Focus Analytics
│
├── PROGRESS
│   ├── Learning Goals
│   ├── Daily Activity
│   ├── Streak
│   └── Analytics
│
├── COMMUNITY
│   ├── Resources
│   ├── Feed
│   ├── Search
│   ├── Like
│   ├── Comment
│   ├── Save
│   ├── Reshare
│   └── Report
│
├── MESSAGING
│   ├── Conversations
│   ├── Messages
│   ├── Unread
│   ├── Block
│   └── Report
│
├── NOTIFICATIONS
│
├── PREMIUM
│   ├── Plans
│   ├── Usage
│   ├── Checkout
│   ├── Payments
│   ├── Subscription
│   └── Entitlements
│
└── ADMIN
    ├── Users
    ├── Moderation
    ├── Premium
    ├── AI Usage
    └── Analytics
```

---

# 3. BUSINESS FLOW TỔNG THỂ

## USER FLOW

```text
Register
   ↓
Login
   ↓
Dashboard / Home
   ↓
My Learning
   ├── Documents
   ├── Quizzes
   ├── Notes
   ├── Mindmaps
   ├── Flashcards
   └── History
```

Learning:

```text
Upload Document
      ↓
Process / Parse
      ↓
Store
      ↓
Open Viewer
      ↓
AI Chat
      ↓
Generate Questions
      ↓
Question Set
      ↓
Quiz
      ↓
Submit
      ↓
Result
      ↓
Review Mistakes
      ↓
Progress
```

Focus:

```text
Document / Quiz
      ↓
Start Focus
      ↓
Focus Session
      ↓
Study
      ↓
Distraction Detection
      ↓
Finish
      ↓
Summary
      ↓
Break OR Continue Learning
      ↓
Progress
```

Community:

```text
Personal Resource
      ↓
Publish
      ↓
Community
      ↓
Other User
      ↓
Study
      ↓
Save / Like / Comment
      ↓
Reshare
      ↓
Community continues
```

Chat:

```text
Community User
      ↓
View Comment / Profile
      ↓
Message User
      ↓
Conversation
      ↓
Message
      ↓
Notification
```

Premium:

```text
Free User
      ↓
Use Feature
      ↓
Usage Limit
      ↓
Upgrade Prompt
      ↓
Premium Page
      ↓
Checkout
      ↓
Payment
      ↓
Webhook Verification
      ↓
Subscription
      ↓
Entitlement
      ↓
Premium Access
```

---

# PHASE 0 — FULL SOURCE CODE AUDIT

## KHÔNG CODE

Đây là phase bắt buộc.

Đọc:

```text
frontend/
backend/
database/
schema/
migrations/
routes/
controllers/
services/
repositories/
middlewares/
AI/
uploads/
components/
pages/
navigation/
stores/
hooks/
utils/
tests/
config/
```

Nếu framework/project structure khác, tự map tương đương.

Phân loại toàn bộ:

```text
KEEP
REMOVE
REFACTOR
REBUILD
MISSING
BROKEN
DUPLICATE
DEAD CODE
UNKNOWN
```

---

## Audit Database

Kiểm tra:

```text
tables
columns
primary keys
foreign keys
indexes
constraints
unique constraints
cascade
restrict
nullable
enum
migration history
seed
```

Đặc biệt xác định dependency của:

```text
Organization
School
Teacher
Class
Semester
Academic Year
Major
Subject
Assignment
Enrollment
```

Không được DROP chỉ vì tên bảng có chữ "school".

Phải xác định:

```text
Who references this table?
Which API uses it?
Which frontend uses it?
Which service uses it?
Which migration created it?
Which seed uses it?
```

---

## Audit API

Liệt kê:

```text
AUTH
DOCUMENT
AI
QUESTION
QUIZ
RESULT
NOTES
MINDMAP
FLASHCARD
FOCUS
PROGRESS
COMMUNITY
CHAT
NOTIFICATION
PREMIUM
ADMIN
SCHOOL
TEACHER
```

Đánh dấu:

```text
WORKING
BROKEN
UNUSED
DUPLICATED
REMOVE
REFACTOR
```

---

## Audit Frontend

Kiểm tra:

```text
routes
pages
layouts
components
navigation
header
sidebar
modals
forms
hooks
stores
API calls
loading state
error state
empty state
responsive
dark/light
```

Tìm:

```text
dead route
dead button
dead menu
broken link
unused component
unused API
mock data
hardcoded data
console error
```

---

## Audit AI

Đặc biệt kiểm tra:

```text
AI Provider
Model abstraction
AI Chat
Question Generator
Prompt management
Prompt injection protection
Token limits
Rate limit
Usage tracking
Fallback
Error handling
```

Không tạo thêm AI service nếu service hiện tại đã đủ.

---

## Audit Report

Không sửa code.

Trả về (và ghi vào `PROJECT_STATE.md` theo mục 0.1.2):

```text
1. Current Architecture
2. Current Database
3. Current API
4. Current Frontend
5. Current AI
6. Working Modules
7. Broken Modules
8. School Dependencies
9. Dead Code
10. Mock Data
11. Missing Features
12. Critical Risks
13. Recommended Migration Order
```

Mỗi item:

```text
DONE
PARTIAL
BROKEN
REMOVE
MISSING
BLOCKED
```

---

# PHASE 1 — ARCHITECTURE + DATABASE FOUNDATION

**Chưa xây feature mới.**

Dựa trên Phase 0.

## Mục tiêu

Đưa database và backend về trạng thái có thể tiếp tục phát triển.

Xử lý:

```text
orphan tables
broken foreign keys
invalid migrations
duplicate models
duplicate services
duplicate APIs
wrong relations
wrong cascade
wrong ownership
```

Chuẩn hóa:

```text
User
Document
Question
QuestionSet
Quiz
Attempt
Result
Note
Mindmap
Flashcard
FocusSession
LearningGoal
LearningActivity
CommunityResource
Comment
Like
SavedResource
Conversation
Message
Notification
Subscription
Plan
Payment
Usage
```

Không được xóa School trước khi dependency audit hoàn tất.

---

# PHASE 2 — REMOVE SCHOOL / TEACHER SYSTEM

Dựa hoàn toàn vào dependency map Phase 0. Áp dụng checkpoint theo mục 0.1.4
trước khi xóa bất kỳ phần nào ở phase này.

Xóa:

```text
School
Organization
Teacher
Teacher Dashboard
Teacher Studio
Teacher Class
Class Enrollment
Assignment
Semester
Academic Year
School Major
School Subject
School Analytics
School Routes
School Components
School Services
School Controllers
School APIs
```

Nếu một table/module đang được module User dùng chung:

```text
DO NOT DROP DIRECTLY
```

Thay bằng refactor dependency.

---

## AI Flashcard Generation

Xóa:

```text
AI Flashcard Generation
AI Flashcard Prompt
AI Flashcard Generate API
AI Flashcard Generate Service
AI Flashcard Generate UI
```

Nhưng giữ:

```text
Manual Flashcard
Edit Flashcard
Delete Flashcard
Study Flashcard
Spaced Repetition
```

Không được tự tạo lại AI Flashcard dưới tên khác.

---

# PHASE 3 — AUTH + USER CORE

Chỉ còn:

```text
ADMIN
USER
```

## Auth

Phải hoạt động:

```text
Register
Login
Logout
Session
Refresh
Forgot Password
Reset Password
Unauthorized
Forbidden
```

## User

```text
Profile
Avatar
Display Name
Bio
Settings
Privacy
```

Private data tuyệt đối không được public:

```text
Private Documents
Private Notes
AI Conversations
Learning History
Quiz Attempts
Focus Details
```

---

# PHASE 4 — DOCUMENT LEARNING

Đây là nền tảng của Cognito.

Flow:

```text
Upload
 ↓
Validate File
 ↓
Store File
 ↓
Create Document
 ↓
Process
 ↓
Parse
 ↓
Extract Text / Structure
 ↓
Index / Prepare Context
 ↓
READY
 ↓
Viewer
```

Hỗ trợ đúng những format mà source hiện tại thực sự có parser.

Không tự tuyên bố hỗ trợ format nếu implementation chưa có.

---

## Document

Phải có:

```text
owner
title
description
file
type
size
status
visibility
createdAt
updatedAt
```

Visibility:

```text
PRIVATE
PUBLIC
```

Không đồng nghĩa:

```text
PUBLIC ≠ Community Published
```

---

# PHASE 5 — DOCUMENT VIEWER + AI LEARNING

Viewer:

```text
Open Document
 ↓
Read / View
 ↓
AI Assistant
```

AI context:

```text
GENERAL
DOCUMENT_CONTEXT
```

Nếu đang mở document:

```text
AI phải ưu tiên context document hiện tại.
```

Giữ prompt injection protection hiện tại.

Không được xóa:

```text
sanitizeUserInstruction
```

hoặc cơ chế tương đương.

---

# PHASE 6 — QUESTION GENERATOR

Đây là module AI quan trọng.

**KHÔNG rewrite thành một API AI đơn giản.**

Giữ pipeline:

```text
1. Context Preparation
        ↓
2. Chunking
        ↓
3. Importance Scoring
        ↓
4. Coverage Allocation
        ↓
5. AI Question Generation
        ↓
6. QA
        ↓
7. Draft / Preview
        ↓
8. User Review
        ↓
9. Approve
        ↓
10. Question Set
```

Giữ:

```text
Cosine Similarity Dedup
Grounding Check
Answer-Key Balancing
JSON Schema Validation
Prompt Injection Protection
```

---

## Question Sources

Question Generator phải hỗ trợ:

```text
SOURCE 1:
Document / PDF / Slide

SOURCE 2:
Existing extracted text

SOURCE 3:
User custom prompt / topic
```

---

# PHASE 7 — EXISTING EXAM IMPORT

Đây là flow riêng, không nhầm với AI Question Generation.

```text
User uploads existing exam
        ↓
File validation
        ↓
Parse
        ↓
Extract questions
        ↓
Detect question structure
        ↓
Extract options
        ↓
Extract answer key nếu có
        ↓
Preview
        ↓
User correction
        ↓
Save Question Set
        ↓
Create Quiz
        ↓
User solves online
        ↓
Submit
        ↓
Result
```

Không dùng AI generation nếu chỉ cần parse đề có sẵn.

AI chỉ được dùng nếu cần hỗ trợ extraction/normalization và phải ghi rõ.

---

# PHASE 8 — QUIZ / TEST SYSTEM

Flow:

```text
Question Set
 ↓
Preview
 ↓
Edit
 ↓
Save
 ↓
Start Quiz
 ↓
Answer
 ↓
Submit
 ↓
Result
 ↓
Review Mistakes
 ↓
Retry
```

Phải lưu:

```text
Attempt
Answers
Correct Answers
Score
Time
StartedAt
SubmittedAt
```

Không tính result chỉ ở frontend.

Backend phải xác minh đáp án và score.

---

# PHASE 9 — NOTES / MINDMAP / FLASHCARDS

## Notes

```text
Create
Edit
Delete
Search
Attach to Document
```

## Mindmap

```text
Create
Edit
Save
View
Attach to Document
```

## Flashcards

Chỉ:

```text
Manual Create
Edit
Delete
Study
Spaced Repetition
Progress
```

Không AI generation.

---

# PHASE 10 — LEARNING ACTIVITY + GOAL + PROGRESS

Đây là lớp kết nối các module.

Không để Progress là dashboard chứa số liệu hardcode.

Tạo/chuẩn hóa:

```text
LearningActivity
LearningGoal
StudyStreak
```

Activity có thể phát sinh từ:

```text
Document Reading
Quiz
Question Practice
Focus Session
Flashcard Study
Community Study
```

---

## Learning Goal

Ví dụ:

```text
Goal:
Study Java

Target:
60 minutes/day
```

Activity:

```text
Focus 30 min
+
Quiz 20 min
+
Document 10 min
=
60 min
```

Progress phải lấy từ dữ liệu thật.

Không:

```text
fakeProgress
hardcodedProgress
```

---

# PHASE 11 — FOCUS MODE

Focus không phải module độc lập.

Có 2 entry point:

```text
/focus
```

hoặc:

```text
Document Viewer
Quiz
   ↓
Start Focus
```

Nếu từ Document:

```text
FocusSession.documentId
```

Nếu từ Quiz:

```text
FocusSession.quizId
```

---

## Focus Session

Lưu:

```text
userId
startTime
endTime
targetDuration
actualDuration
documentId
quizId
learningGoalId
status
```

Status:

```text
COMPLETED
INTERRUPTED
CANCELLED
```

---

## Distraction Detection

Chỉ dùng browser signals:

```text
visibilitychange
blur
focus
idle
pagehide
beforeunload
```

Event:

```text
TAB_SWITCH
PAGE_BLUR
PAGE_HIDDEN
IDLE
RETURNED
```

Không:

```text
Camera
Microphone
Emotion Detection
Health Assessment
Psychological Assessment
```

Không tuyên bố hệ thống biết người dùng "thực sự mất tập trung".

Chỉ ghi nhận browser event.

---

## Focus End

```text
Finish
 ↓
Summary
 ↓
Target Duration
Actual Focus Time
Distraction Count
Focus Score
 ↓
 ┌──────────────┬───────────────┐
 │              │
Break        Continue Learning
 │              │
Timer       Document / Quiz
```

Không để Summary trở thành dead end.

---

# PHASE 12 — COMMUNITY

Community Resource phải là abstraction riêng.

```text
CommunityResource
```

Có thể tham chiếu:

```text
Document
Quiz
Mindmap
```

---

## Publish

```text
Personal Resource
 ↓
Create Community Resource
 ↓
Title
Description
Category
Tags
Visibility
 ↓
Publish
```

Document:

```text
PUBLIC
```

không đồng nghĩa:

```text
PUBLISHED
```

---

## Community Feed

```text
Recent
Popular
Search
```

Following chỉ làm nếu hệ thống đã có Follow implementation.

Không tạo Follow chỉ để làm menu đẹp.

---

## Study Flow

```text
Open Resource
 ↓
View
 ↓
Study
 ↓
Like
Comment
Save
Reshare
```

---

## Save

Save phải lưu reference:

```text
User
 ↓
SavedResource
 ↓
CommunityResource
```

Không copy toàn bộ resource nếu không cần.

Nếu original resource bị xóa:

```text
UNAVAILABLE
```

hoặc policy rõ ràng khác.

Không tự duplicate dữ liệu.

---

## Reshare

```text
Original Resource
 ↓
Save
 ↓
Reshare
 ↓
Community
```

Phải giữ attribution:

```text
Original Author
Original Resource
Reshared By
```

---

# PHASE 13 — COMMUNITY SAFETY

Phải có:

```text
Like
Comment
Reply
Report
Block
Moderation
Rate Limit
Spam Protection
```

Admin moderation:

```text
Review
 ↓
Keep
Hide
Remove
Warn
Suspend
```

Lưu moderation history.

---

# PHASE 14 — USER PROFILE + PUBLIC PROFILE

Private profile:

```text
Settings
Personal Data
Learning Data
```

Public profile chỉ expose:

```text
Avatar
Display Name
Bio
Public Resources
Public Quizzes
Basic Public Statistics
```

Không expose:

```text
Private Documents
Private Notes
AI Chats
Private Progress Details
Quiz Attempts
Focus Details
```

---

# PHASE 15 — USER-TO-USER CHAT

Chat là module độc lập.

```text
Conversation
ConversationMember
Message
MessageRead
Block
Report
```

Flow:

```text
User A
 ↓
Profile / Comment
 ↓
Message
 ↓
Conversation
 ↓
User B
 ↓
Reply
```

Phải có:

```text
Unread Count
Timestamp
Online/Realtime nếu infrastructure hiện tại hỗ trợ
Block
Report
Rate Limit
```

Community không được tạo chat system riêng.

Community chỉ gọi Messaging module.

---

# PHASE 16 — NOTIFICATION

Notification cho:

```text
Comment
Reply
Like
Message
Reshare
Resource Published
Quiz Shared
Moderation
Premium
Payment
Subscription
```

Có:

```text
Unread
Read
Read All
```

---

# PHASE 17 — PREMIUM / SUBSCRIPTION

Không làm Premium chỉ bằng UI.

Backend là source of truth.

---

## Plans

Tối thiểu:

```text
FREE
PREMIUM_MONTHLY
PREMIUM_YEARLY
```

Plan có:

```text
name
price
billingPeriod
features
limits
active
```

---

## Usage Limit

Không hardcode limit rải rác.

Model logic:

```text
Feature
Limit
Current Usage
Reset Period
Plan
```

Ví dụ:

```text
AI_CHAT
QUESTION_GENERATION
DOCUMENT_UPLOAD
STORAGE
QUIZ_GENERATION
```

Admin có thể chỉnh limit.

---

# PHASE 18 — PREMIUM STATE MACHINE

Bắt buộc:

```text
PENDING
ACTIVE
FAILED
PAST_DUE
CANCELLED
EXPIRED
```

Flow:

```text
PENDING
 ├── SUCCESS → ACTIVE
 └── FAILED → FAILED
```

Renew:

```text
ACTIVE
 ↓
Renew Success
 ↓
ACTIVE
```

Renew failed:

```text
ACTIVE
 ↓
Renew Failed
 ↓
PAST_DUE
 ↓
Grace Period
 ├── Pay → ACTIVE
 └── Timeout → EXPIRED → FREE
```

Cancel:

```text
ACTIVE
 ↓
CANCELLED
 ↓
Keep Premium Until End Date
 ↓
EXPIRED
 ↓
FREE
```

Không cắt Premium ngay khi user cancel subscription đã thanh toán.

---

# PHASE 19 — PAYMENT

Payment phải tách khỏi Subscription.

Flow:

```text
User
 ↓
Checkout
 ↓
Payment Provider
 ↓
Payment
 ↓
Webhook
 ↓
Verify Signature
 ↓
Update Payment
 ↓
Update Subscription
 ↓
Update Entitlement
```

Không trust frontend:

```text
paymentSuccess=true
```

Không mock payment trong production. Áp dụng mục 0.1.5: test toàn bộ flow
bằng sandbox/test key trước, không dùng key thật để thử.

Nếu provider chưa được cấu hình:

```text
KEEP ADAPTER
MARK BLOCKED
DO NOT FAKE SUCCESS
```

---

# PHASE 20 — ENTITLEMENT / ACCESS CONTROL

Backend phải kiểm tra:

```text
Authentication
 ↓
User
 ↓
Subscription Status
 ↓
Plan
 ↓
Feature Permission
 ↓
Usage Limit
 ↓
Allow / Deny
```

Frontend chỉ là UI.

Không được coi frontend là security boundary.

---

# PHASE 21 — ADMIN

Admin chỉ có:

```text
Users
Moderation
Premium
AI Usage
Analytics
```

---

## Admin Users

```text
Search
View
Activate
Suspend
View Subscription
View Reports
```

Không cho Admin tự động xem private learning data nếu không có permission/business reason.

---

## Admin Moderation

```text
Reports
 ↓
Review
 ↓
Keep / Hide / Remove / Warn / Suspend
 ↓
Moderation History
```

---

## Admin Premium

```text
Plans
Limits
Subscriptions
Payments
Revenue
```

---

## Admin AI Usage

```text
Requests
Tokens
Model
User
Feature
Cost estimate
Failure
```

---

# PHASE 22 — SEARCH

Search phải phân biệt:

```text
My Documents
Community Resources
Question Sets
Public Profiles
```

Không search private content của người khác.

---

# PHASE 23 — FRONTEND INFORMATION ARCHITECTURE

## USER NAVIGATION

```text
Home
My Learning
Community
Focus
Progress
Notifications
Profile
Premium
```

My Learning:

```text
Documents
Quizzes
Notes
Mindmaps
Flashcards
History
```

Không hiển thị:

```text
School
Teacher
Class
Semester
Organization
Teacher Studio
```

Nếu module backend chưa hoạt động:

```text
DO NOT SHOW MENU ITEM
```

---

# PHASE 24 — HEADER / UI CLEANUP

Audit toàn bộ:

```text
Header
Sidebar
Navigation
Dropdown
Profile
Mobile Menu
Footer
```

Xóa:

```text
School
Teacher
Class
Organization
Semester
Academic Year
Teacher Studio
```

Kiểm tra:

```text
broken button
broken link
dead page
wrong route
wrong permission
loading
empty state
error state
toast
modal
responsive
dark mode
light mode
```

---

# PHASE 25 — API ARCHITECTURE

Giữ architecture:

```text
Frontend
 ↓
API Client
 ↓
API Gateway / Routes
 ↓
Middleware
 ├── Auth
 ├── Validation
 ├── Rate Limit
 ├── Error Handling
 └── Permission
 ↓
Controller
 ↓
Service
 ↓
Repository
 ↓
Database
```

Controller không chứa business logic lớn.

Không:

```text
God Controller
```

Không tạo duplicate:

```text
GeminiService2
AIServiceNew
QuestionAIServiceNew
DocumentServiceNew
```

Nếu service hiện tại tốt:

```text
REUSE
```

---

# PHASE 26 — SECURITY

Audit:

```text
Authentication
Authorization
RBAC
Ownership
Input Validation
Zod / equivalent
File Validation
File Size
MIME Validation
Path Traversal
SQL Injection
XSS
CSRF nếu applicable
Rate Limit
AI Prompt Injection
Sensitive Data Exposure
IDOR
```

Đặc biệt:

```text
User A không được truy cập Document của User B
User A không được sửa Quiz của User B
User A không được xem private Note của User B
User A không được xem private AI Conversation của User B
```

---

# PHASE 27 — AI SECURITY + COST CONTROL

AI phải có:

```text
Authentication
Rate Limit
Usage Tracking
Token Limit
Model Permission
Prompt Injection Protection
Input Sanitization
Output Validation
Timeout
Retry
Fallback nếu source hiện tại có
```

AI generation phải kiểm soát:

```text
MAX TOKENS
MAX REQUEST
MAX DOCUMENT SIZE
MAX QUESTIONS
```

Không cho user tạo chi phí AI vô hạn.

---

# PHASE 28 — DATA INTEGRITY

Kiểm tra:

```text
Foreign Keys
Unique
Indexes
Nullable
Cascade
Restrict
Transactions
Ownership
Orphan Records
Duplicate Records
```

Các flow nhiều bước phải dùng transaction khi cần.

Ví dụ:

```text
Create Payment
+
Update Subscription
+
Create Entitlement
```

phải đảm bảo consistency.

---

# PHASE 29 — REMOVE MOCK DATA

Tìm:

```text
mockUsers
mockDocuments
mockQuiz
fakeProgress
fakeRevenue
fakeAnalytics
fakeSubscription
fakePayment
```

Production không dùng mock.

Nếu cần development seed:

```text
database seed
```

phải được phân biệt rõ với production data.

---

# PHASE 30 — FULL BUSINESS FLOW TEST

Không chỉ test API riêng lẻ.

Test các flow xuyên hệ thống.

---

## FLOW A — USER LEARNING

```text
Register
 ↓
Login
 ↓
Upload Document
 ↓
Process
 ↓
Open Viewer
 ↓
AI Chat
 ↓
Generate Questions
 ↓
Preview
 ↓
Approve
 ↓
Question Set
 ↓
Quiz
 ↓
Submit
 ↓
Result
 ↓
Review Mistakes
 ↓
Progress
```

---

## FLOW B — EXISTING EXAM

```text
Upload Exam
 ↓
Parse
 ↓
Extract Questions
 ↓
Preview
 ↓
Correct
 ↓
Save
 ↓
Quiz
 ↓
Submit
 ↓
Result
```

---

## FLOW C — COMMUNITY

```text
Create Resource
 ↓
Publish
 ↓
Community Feed
 ↓
Other User
 ↓
Study
 ↓
Like
 ↓
Comment
 ↓
Save
 ↓
Reshare
 ↓
Attribution
```

---

## FLOW D — CHAT

```text
Comment
 ↓
Message Author
 ↓
Conversation
 ↓
Message
 ↓
Unread
 ↓
Reply
```

---

## FLOW E — PREMIUM

```text
Free
 ↓
Use
 ↓
Limit
 ↓
Upgrade
 ↓
Checkout
 ↓
Payment Success
 ↓
Webhook
 ↓
Subscription ACTIVE
 ↓
Entitlement
 ↓
Premium Feature
```

Test failed payment:

```text
Payment Failed
 ↓
No Premium
```

Test renewal failure:

```text
ACTIVE
 ↓
Renew Failed
 ↓
PAST_DUE
 ↓
Grace
 ↓
Expired
 ↓
FREE
```

Test cancellation:

```text
ACTIVE
 ↓
Cancel
 ↓
Still Premium
 ↓
End Date
 ↓
EXPIRED
 ↓
FREE
```

---

## FLOW F — FOCUS

```text
Document
 ↓
Start Focus
 ↓
Timer
 ↓
Tab Switch
 ↓
Distraction Event
 ↓
Return
 ↓
Finish
 ↓
Summary
 ↓
Break
OR
Continue Learning
 ↓
Progress
```

Test:

```text
Close Tab
 ↓
INTERRUPTED
```

---

# PHASE 31 — TESTING

Chạy:

```text
TypeScript
Lint
Unit Tests
Integration Tests
API Tests
Database Tests
Frontend Tests
Build
```

Không được bỏ qua lỗi.

Phân loại:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

Không thêm feature mới trong testing phase.

---

# PHASE 32 — PERFORMANCE

Kiểm tra:

```text
Database Query
N+1
Pagination
Search
File Processing
AI Request
Caching
API Response
Large Documents
Large Community Feed
Socket Connections
```

Không load toàn bộ:

```text
Documents
Messages
Community Posts
Notifications
```

một lần.

---

# PHASE 33 — FINAL UI AUDIT

Test:

```text
Desktop
Tablet
Mobile
Dark Mode
Light Mode
Loading
Empty
Error
Success
Disabled
Permission denied
```

Không được có:

```text
404
blank page
broken button
broken icon
wrong route
console error
network error không xử lý
```

---

# PHASE 34 — DEAD CODE AUDIT

Sau khi tất cả feature hoàn thành, scan lại. Áp dụng checkpoint theo mục
0.1.4 trước khi xóa hàng loạt ở phase này.

```text
Routes
Controllers
Services
Repositories
Components
Hooks
Types
Schemas
API
Database
Migrations
Navigation
```

Xóa code không còn reference.

Không xóa chỉ dựa vào tên.

Phải kiểm tra dependency.

---

# PHASE 35 — FINAL ARCHITECTURE VERIFICATION

Phải xác nhận:

```text
NO SCHOOL
NO TEACHER
NO ORGANIZATION
NO CLASS
NO SEMESTER
NO ACADEMIC YEAR
NO TEACHER STUDIO
NO AI FLASHCARD GENERATION
```

Chỉ còn:

```text
ADMIN
USER
```

---

# PHASE 36 — FINAL ACCEPTANCE CRITERIA

Cognito chỉ được coi là hoàn thành khi:

## AUTH

```text
Register ✓
Login ✓
Logout ✓
Reset Password ✓
Authorization ✓
```

## DOCUMENT

```text
Upload ✓
Parse ✓
View ✓
AI Context ✓
Private/Public ✓
Delete ✓
Search ✓
```

## AI

```text
Chat ✓
Question Generator ✓
6-stage pipeline ✓
Grounding ✓
Dedup ✓
JSON Validation ✓
Prompt Injection Protection ✓
Usage Control ✓
```

## QUIZ

```text
Create ✓
Import Existing Exam ✓
Preview ✓
Edit ✓
Start ✓
Submit ✓
Result ✓
Review ✓
Retry ✓
```

## LEARNING

```text
Notes ✓
Mindmap ✓
Manual Flashcard ✓
Spaced Repetition ✓
History ✓
```

## FOCUS

```text
Timer ✓
Document Integration ✓
Quiz Integration ✓
Distraction Events ✓
Interrupted Session ✓
Summary ✓
Break ✓
Continue ✓
```

## PROGRESS

```text
Goal ✓
Activity ✓
Streak ✓
Analytics ✓
```

## COMMUNITY

```text
Publish ✓
Feed ✓
Search ✓
Study ✓
Like ✓
Comment ✓
Save ✓
Reshare ✓
Attribution ✓
Report ✓
```

## CHAT

```text
Conversation ✓
Message ✓
Unread ✓
Block ✓
Report ✓
Community → Chat ✓
```

## PREMIUM

```text
Plans ✓
Usage Limit ✓
Checkout ✓
Payment ✓
Webhook ✓
Subscription ✓
Entitlement ✓
Renewal ✓
Past Due ✓
Cancel ✓
Expired ✓
```

## ADMIN

```text
Users ✓
Moderation ✓
Plans ✓
Subscriptions ✓
Payments ✓
AI Usage ✓
Analytics ✓
```

---

# PHASE 37 — FINAL REPORT

Sau khi hoàn thành toàn bộ hệ thống, báo cáo chính xác (đối chiếu với toàn
bộ nội dung đã tích lũy trong `PROJECT_STATE.md`):

```text
COGNITO FINAL SYSTEM AUDIT

1. Existing Architecture
2. Final Architecture
3. Removed School System
4. Removed Teacher System
5. Removed AI Flashcard Generation
6. Authentication
7. User System
8. Document Management
9. Document Viewer
10. AI Chat
11. Question Generator
12. Existing Exam Import
13. Quiz System
14. Notes
15. Mindmaps
16. Flashcards
17. Learning Activity
18. Learning Goals
19. Progress
20. Focus Mode
21. Community
22. Reshare System
23. Messaging
24. Notifications
25. Premium
26. Payment
27. Subscription
28. Entitlement
29. Admin
30. Database
31. API
32. Frontend
33. Security
34. Performance
35. Mock Data
36. Dead Code
37. Tests
38. Build
39. Remaining Issues
40. Deployment Readiness
```

Mỗi mục bắt buộc:

```text
DONE
PARTIAL
NOT IMPLEMENTED
BLOCKED
```

Không được báo:

```text
Everything is complete
```

nếu chưa test thực tế.

---

# QUY TẮC THỰC THI BẮT BUỘC

## RULE 1 — KHÔNG LÀM TẤT CẢ MỘT LẦN

Thực hiện tuần tự:

```text
PHASE 0
 ↓
PHASE 1
 ↓
PHASE 2
 ↓
...
 ↓
PHASE 37
```

Mỗi lần chỉ 1 phase (xem mục 0.1.1). Có thể gộp các phase kỹ thuật rất nhỏ
nếu dependency cho phép, nhưng **phải báo cáo riêng từng phase** và vẫn tuân
thủ gate ở mục 0.1.3.

---

## RULE 2 — MỖI PHASE PHẢI CÓ REPORT

Format:

```text
PHASE X REPORT

Objective:
...

Changed:
...

Files:
...

Database:
...

API:
...

Frontend:
...

Tests:
...

DONE:
...

PARTIAL:
...

BLOCKED:
...

Risks:
...

Next Phase:
...
```

Report này đồng thời là nội dung append vào `PROJECT_STATE.md`.

---

## RULE 3 — KHÔNG TỰ BỊA

Nếu không tìm thấy implementation:

```text
NOT FOUND
```

Nếu chưa thể xác minh:

```text
UNKNOWN
```

Nếu dependency chưa xử lý:

```text
BLOCKED
```

Không được tự tạo giả định rồi báo DONE.

---

## RULE 4 — KHÔNG PHÁ CODE ĐANG HOẠT ĐỘNG

Nếu implementation hiện tại tốt:

```text
KEEP
REUSE
REFACTOR ONLY WHEN NECESSARY
```

Không rewrite chỉ để đổi tên.

---

## RULE 5 — KHÔNG TẠO DUPLICATE SERVICE

Trước khi tạo:

```text
Service
Repository
Controller
AI Provider
Hook
Component
API
```

bắt buộc search toàn project xem đã tồn tại chưa.

---

## RULE 6 — DATABASE LÀ SOURCE OF TRUTH

Không hardcode:

```text
Progress
Usage
Subscription
Payment
Score
Analytics
```

Frontend phải lấy dữ liệu thật từ backend.

---

## RULE 7 — BACKEND LÀ SECURITY BOUNDARY

Frontend không quyết định:

```text
User permission
Premium access
Ownership
Subscription
Usage limit
Admin access
```

---

## RULE 8 — KHÔNG MOCK PRODUCTION

Không dùng:

```text
fakeUsers
fakeProgress
fakeRevenue
fakeSubscription
fakePayment
fakeAnalytics
```

---

## RULE 9 — KHÔNG XÂY UI CHO FEATURE CHƯA HOẠT ĐỘNG

Nếu backend chưa hoạt động:

```text
DO NOT SHOW FEATURE AS READY
```

---

## RULE 10 — KHÔNG XÓA DATABASE MÙ QUÁNG

Trước khi xóa:

```text
Search FK
Search API
Search imports
Search migrations
Search seed
Search queries
Search frontend
```

---

## RULE 11 — GATE TRƯỚC KHI CHUYỂN PHASE (xem mục 0.1.3)

Không tự ý báo DONE và chuyển sang phase kế nếu build/lint/typecheck đang lỗi.

## RULE 12 — CHECKPOINT TRƯỚC THAO TÁC PHÁ HỦY (xem mục 0.1.4)

Áp dụng bắt buộc cho PHASE 2 và PHASE 34.

## RULE 13 — GHI NHỚ XUYÊN PHASE (xem mục 0.1.2)

Luôn cập nhật `PROJECT_STATE.md` sau mỗi phase và đọc lại trước khi bắt đầu
phase mới, kể cả trong cùng phiên hội thoại.

---

# THỨ TỰ ƯU TIÊN KHI CÓ XUNG ĐỘT

Nếu có conflict:

```text
1. Data Integrity
2. Security
3. Authentication / Authorization
4. Core Learning Flow
5. AI correctness
6. Quiz correctness
7. Community correctness
8. Premium correctness
9. Focus correctness
10. UI
11. Visual polish
```

Không hy sinh:

```text
Security
Data Integrity
Correctness
```

để đổi lấy UI đẹp.

---

# KIẾN TRÚC CUỐI CÙNG

```text
                    ┌─────────────┐
                    │    ADMIN    │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
          MANAGEMENT                ANALYTICS
              │
     Users / Moderation
     Premium / AI Usage
              │
═══════════════════════════════════════════
              COGNITO CORE
═══════════════════════════════════════════
              │
          ┌───┴────┐
          │  USER  │
          └───┬────┘
              │
    ┌─────────┼─────────┐
    │         │         │
 LEARNING    FOCUS   COMMUNITY
    │         │         │
    │         │         ├── Resource
    │         │         ├── Comment
    │         │         ├── Like
    │         │         ├── Save
    │         │         └── Reshare
    │         │
    │         └── Session
    │             └── Activity
    │
    ├── Documents
    ├── AI
    ├── Questions
    ├── Quiz
    ├── Results
    ├── Notes
    ├── Mindmap
    └── Flashcards
              │
              ▼
          PROGRESS
              │
       Goal / Activity
       Streak / Analytics
              │
              ▼
           PREMIUM
              │
      Plan / Usage / Payment
      Subscription / Entitlement
              │
              ▼
          NOTIFICATION
              │
              ▼
          MESSAGING
```

# FINAL BUSINESS LOOP

Cognito phải khép kín được 4 vòng:

## LEARNING LOOP

```text
DOCUMENT
 ↓
AI
 ↓
QUESTION
 ↓
QUIZ
 ↓
RESULT
 ↓
REVIEW
 ↓
PROGRESS
```

## FOCUS LOOP

```text
LEARNING
 ↓
FOCUS
 ↓
DISTRACTION
 ↓
SUMMARY
 ↓
BREAK / CONTINUE
 ↓
PROGRESS
```

## COMMUNITY LOOP

```text
CREATE
 ↓
PUBLISH
 ↓
STUDY
 ↓
COMMENT / SAVE / LIKE
 ↓
RESHARE
 ↓
NEW USER STUDIES
```

## PREMIUM LOOP

```text
FREE
 ↓
USAGE
 ↓
LIMIT
 ↓
UPGRADE
 ↓
CHECKOUT
 ↓
PAYMENT
 ↓
SUBSCRIPTION
 ↓
ENTITLEMENT
 ↓
PREMIUM USAGE
```

Khi cả 4 loop hoạt động end-to-end, Cognito mới được coi là hoàn thành về mặt nghiệp vụ.

**BẮT ĐẦU TỪ PHASE 0. KHÔNG CODE TRƯỚC KHI HOÀN THÀNH AUDIT.**
