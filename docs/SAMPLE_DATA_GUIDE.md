# 📊 샘플 데이터 추가 가이드

Supabase SQL Editor에서 샘플 데이터를 추가하는 방법을 안내합니다.

## 📍 파일 위치

스크립트 파일: `supabase/migrations/insert_sample_data.sql`

## ⚠️ 중요 사항

### 1. Clerk User ID 사용

이 프로젝트는 **Clerk를 사용**하므로, `clerk_id`는 실제 Clerk User ID여야 합니다.

**실제 Clerk User ID 확인 방법:**
1. [Clerk Dashboard](https://dashboard.clerk.com) 접속
2. 좌측 메뉴에서 **"Users"** 클릭
3. 사용자 목록에서 원하는 사용자 클릭
4. **"User ID"** 필드에서 ID 복사 (예: `user_2abc123def456ghi789jkl`)

### 2. 두 가지 방법

#### 방법 1: 실제 Clerk 사용자 ID 사용 (권장)
- 실제 Clerk 사용자가 있는 경우
- 로그인한 사용자가 게시물을 작성/수정할 수 있음
- 인증 기능을 완전히 테스트할 수 있음

#### 방법 2: 테스트용 가짜 ID 사용
- 실제 Clerk 사용자가 없는 경우
- 게시물 목록 조회는 가능
- 좋아요/댓글 작성 등 인증이 필요한 기능은 테스트 불가

---

## 🚀 실행 방법

### 1단계: Supabase SQL Editor 열기

1. Supabase Dashboard 접속
2. 좌측 메뉴에서 **"SQL Editor"** 클릭
3. **"New query"** 버튼 클릭

### 2단계: 스크립트 복사 및 수정

1. `supabase/migrations/insert_sample_data.sql` 파일 열기
2. 전체 내용 복사
3. Supabase SQL Editor에 붙여넣기

### 3단계: Clerk User ID 교체 (실제 사용자 ID가 있는 경우)

스크립트에서 다음 부분을 찾아서 실제 Clerk User ID로 교체하세요:

```sql
-- ⚠️ 이 부분을 실제 Clerk User ID로 교체
'user_sample_001'  -- → 'user_2abc123def456ghi789jkl' (실제 ID)
'user_sample_002'  -- → 'user_2def456ghi789jkl012mno' (실제 ID)
'user_sample_003'  -- → 'user_2ghi789jkl012mno345pqr' (실제 ID)
```

**예시:**
```sql
-- 교체 전
INSERT INTO public.users (id, clerk_id, name, created_at)
VALUES (
  gen_random_uuid(),
  'user_sample_001',  -- ⚠️ 이 부분
  '테스트 사용자1',
  now() - INTERVAL '30 days'
)

-- 교체 후 (실제 Clerk User ID 사용)
INSERT INTO public.users (id, clerk_id, name, created_at)
VALUES (
  gen_random_uuid(),
  'user_2abc123def456ghi789jkl',  -- ✅ 실제 Clerk User ID
  '테스트 사용자1',
  now() - INTERVAL '30 days'
)
```

### 4단계: 실행

1. SQL Editor에서 **"Run"** 버튼 클릭 (또는 `Ctrl+Enter`)
2. 성공 메시지 확인 (`Success. No rows returned` 또는 유사한 메시지)

### 5단계: 데이터 확인

실행 후 다음 쿼리로 데이터를 확인할 수 있습니다:

```sql
-- 전체 개수 확인
SELECT COUNT(*) as total_users FROM public.users;
SELECT COUNT(*) as total_posts FROM public.posts;
SELECT COUNT(*) as total_likes FROM public.likes;
SELECT COUNT(*) as total_comments FROM public.comments;
SELECT COUNT(*) as total_follows FROM public.follows;

-- 상세 데이터 확인
SELECT * FROM public.users ORDER BY created_at DESC;
SELECT * FROM public.posts ORDER BY created_at DESC LIMIT 10;
SELECT * FROM public.post_stats ORDER BY created_at DESC LIMIT 10;
SELECT * FROM public.user_stats;
```

---

## 📦 생성되는 데이터

스크립트를 실행하면 다음 데이터가 생성됩니다:

- **사용자**: 3명
- **게시물**: 7개 (사용자1: 3개, 사용자2: 2개, 사용자3: 2개)
- **좋아요**: 각 게시물에 랜덤하게 배정
- **댓글**: 각 게시물에 랜덤하게 배정
- **팔로우 관계**: 사용자들 간의 팔로우 관계

---

## 🔄 실제 Clerk 사용자로 테스트하는 방법

### 방법 1: 기존 사용자 ID 사용

1. Clerk Dashboard에서 기존 사용자의 User ID 확인
2. 스크립트의 `user_sample_001` 등을 실제 ID로 교체
3. 스크립트 실행

### 방법 2: 새로 로그인 후 동기화

1. 앱에서 새로 회원가입/로그인
2. `SyncUserProvider`가 자동으로 Supabase에 사용자 동기화
3. Supabase에서 동기화된 사용자의 `clerk_id` 확인
4. 해당 `clerk_id`를 스크립트에 사용

---

## 🐛 문제 해결

### 문제: "duplicate key value violates unique constraint"
- **원인**: 이미 같은 `clerk_id`가 존재함
- **해결**: `ON CONFLICT (clerk_id) DO NOTHING`으로 이미 처리되어 있음. 무시하고 계속 진행

### 문제: 게시물이 보이지 않음
- **원인**: 사용자 ID가 실제 Clerk User ID와 일치하지 않음
- **해결**: 실제 Clerk User ID로 교체하거나, 새로 로그인하여 사용자 동기화

### 문제: 이미지가 표시되지 않음
- **원인**: Unsplash URL이 차단되었거나 네트워크 문제
- **해결**: Supabase Storage에 실제 이미지를 업로드하고 URL 교체

---

## 💡 팁

1. **실제 Clerk 사용자가 있다면**: 반드시 실제 Clerk User ID를 사용하세요
2. **테스트용 데이터만 필요하다면**: `user_sample_001` 같은 가짜 ID를 사용해도 됩니다 (단, 인증 기능은 테스트 불가)
3. **이미지 URL**: Unsplash placeholder를 사용하지만, 실제 사용하려면 Supabase Storage에 업로드하세요

