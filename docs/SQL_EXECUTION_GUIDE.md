# 📝 SQL 샘플 데이터 추가 가이드 (초보자용)

이 가이드는 Supabase SQL Editor에서 샘플 데이터를 추가하는 방법을 단계별로 설명합니다.

---

## 🎯 목표

Supabase 데이터베이스에 테스트용 게시물, 댓글, 좋아요 데이터를 추가합니다.

---

## 📋 1단계: Clerk User ID 확인하기 (실제 사용자가 있는 경우)

### 방법 A: Clerk Dashboard에서 확인

1. [Clerk Dashboard](https://dashboard.clerk.com) 접속
2. 로그인
3. 좌측 메뉴에서 **"Users"** 클릭
4. 사용자 목록에서 원하는 사용자 클릭
5. 페이지 상단 또는 상세 정보에서 **"User ID"** 찾기
   - 예시: `user_2abc123def456ghi789jkl`
6. 이 ID를 복사해두세요

### 방법 B: 앱에서 로그인 후 확인

1. 개발 서버 실행 (`pnpm dev`)
2. 브라우저에서 http://localhost:3000 접속
3. 로그인/회원가입
4. `SyncUserProvider`가 자동으로 Supabase에 사용자 동기화
5. Supabase Dashboard → Table Editor → `users` 테이블에서 `clerk_id` 확인

---

## 📋 2단계: SQL 스크립트 준비하기

### 파일 위치
`supabase/migrations/insert_sample_data.sql`

### 스크립트 내용 확인

스크립트는 다음과 같은 구조입니다:

```sql
-- 1. 사용자 추가
INSERT INTO public.users (id, clerk_id, name, created_at)
VALUES (
  gen_random_uuid(),
  'user_sample_001',  -- ⚠️ 여기를 실제 Clerk User ID로 교체
  '테스트 사용자1',
  now() - INTERVAL '30 days'
)
ON CONFLICT (clerk_id) DO NOTHING;

-- 2. 게시물 추가 (자동으로 위에서 만든 사용자 ID 사용)
-- 3. 좋아요 추가
-- 4. 댓글 추가
-- 5. 팔로우 관계 추가
```

---

## 📋 3단계: Clerk User ID 교체하기 (선택사항)

### 실제 Clerk User ID가 있는 경우

스크립트에서 다음 3곳을 찾아서 교체하세요:

1. **사용자 1**: `'user_sample_001'` → 실제 Clerk User ID
2. **사용자 2**: `'user_sample_002'` → 실제 Clerk User ID  
3. **사용자 3**: `'user_sample_003'` → 실제 Clerk User ID

**예시:**
```sql
-- 교체 전
'user_sample_001'

-- 교체 후 (실제 Clerk User ID)
'user_2abc123def456ghi789jkl'
```

**중요:** 스크립트 내에서 `'user_sample_001'`이 나타나는 모든 곳을 교체해야 합니다:
- 사용자 추가 부분 (3곳)
- 게시물 추가 부분 (3곳)
- 좋아요 추가 부분 (3곳)
- 댓글 추가 부분 (3곳)
- 팔로우 추가 부분 (3곳)

**총 15곳**을 교체해야 합니다!

### 실제 Clerk User ID가 없는 경우

- 스크립트를 그대로 사용해도 됩니다
- 게시물 목록은 보이지만, 인증이 필요한 기능은 테스트할 수 없습니다

---

## 📋 4단계: Supabase SQL Editor에서 실행하기

### 4-1. Supabase Dashboard 접속

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택

### 4-2. SQL Editor 열기

1. 좌측 메뉴에서 **"SQL Editor"** 클릭
2. **"New query"** 버튼 클릭 (또는 상단의 "+" 아이콘)

### 4-3. 스크립트 붙여넣기

1. `insert_sample_data.sql` 파일의 전체 내용 복사
2. SQL Editor에 붙여넣기 (Ctrl+V)

### 4-4. 실행

1. 우측 상단의 **"Run"** 버튼 클릭
   - 또는 `Ctrl+Enter` (Windows)
   - 또는 `Cmd+Enter` (Mac)
2. 잠시 기다리기 (1-2초)
3. 성공 메시지 확인:
   - ✅ `Success. No rows returned` 또는
   - ✅ `Success` 또는
   - ✅ 하단에 에러 없이 완료

---

## 📋 5단계: 데이터 확인하기

실행 후 다음 쿼리로 데이터가 잘 추가되었는지 확인하세요:

### 5-1. 개수 확인

SQL Editor에서 다음 쿼리를 실행하세요:

```sql
-- 사용자 수
SELECT COUNT(*) as 사용자수 FROM public.users;

-- 게시물 수
SELECT COUNT(*) as 게시물수 FROM public.posts;

-- 좋아요 수
SELECT COUNT(*) as 좋아요수 FROM public.likes;

-- 댓글 수
SELECT COUNT(*) as 댓글수 FROM public.comments;

-- 팔로우 관계 수
SELECT COUNT(*) as 팔로우수 FROM public.follows;
```

**예상 결과:**
- 사용자수: 3
- 게시물수: 7
- 좋아요수: 약 10-15개
- 댓글수: 약 10-15개
- 팔로우수: 5

### 5-2. 게시물 목록 확인

```sql
SELECT 
  p.id,
  u.name as 작성자,
  p.caption,
  p.created_at
FROM public.posts p
JOIN public.users u ON p.user_id = u.id
ORDER BY p.created_at DESC;
```

### 5-3. 통계 확인

```sql
-- 게시물 통계 (좋아요 수, 댓글 수)
SELECT * FROM public.post_stats ORDER BY created_at DESC;

-- 사용자 통계 (게시물 수, 팔로워 수, 팔로잉 수)
SELECT * FROM public.user_stats;
```

---

## 🐛 문제 해결

### 문제 1: "duplicate key value violates unique constraint"

**원인:** 이미 같은 `clerk_id`가 존재합니다.

**해결:**
- 스크립트에 `ON CONFLICT (clerk_id) DO NOTHING`이 있어서 자동으로 처리됩니다
- 에러가 나도 무시하고 계속 진행됩니다
- 또는 기존 사용자를 삭제하고 다시 실행:
  ```sql
  DELETE FROM public.users WHERE clerk_id = 'user_sample_001';
  ```

### 문제 2: "foreign key constraint violated"

**원인:** 사용자가 생성되지 않아서 게시물을 추가할 수 없습니다.

**해결:**
- 사용자 추가 부분이 먼저 실행되었는지 확인
- 사용자 ID가 올바른지 확인
- 순서대로 실행되었는지 확인

### 문제 3: 게시물이 보이지 않음

**원인:**
- Clerk User ID가 실제 사용자 ID와 일치하지 않음
- 또는 사용자가 생성되지 않음

**해결:**
1. Supabase에서 사용자 확인:
   ```sql
   SELECT * FROM public.users;
   ```
2. 게시물 확인:
   ```sql
   SELECT * FROM public.posts;
   ```
3. 사용자가 없으면 먼저 사용자를 생성하거나, 실제 Clerk User ID로 교체

### 문제 4: SQL 문법 오류

**원인:** 스크립트를 복사할 때 일부가 누락되었거나 잘못 편집됨

**해결:**
- 파일을 다시 열어서 전체 내용 복사
- 따옴표(`'`)가 제대로 있는지 확인
- 세미콜론(`;`)이 있는지 확인

---

## 💡 팁

### 팁 1: 한 번에 하나씩 실행

스크립트가 길어서 에러가 나면, 한 섹션씩 나눠서 실행할 수 있습니다:

1. **사용자 추가 부분만** 실행
2. **게시물 추가 부분만** 실행
3. **좋아요 추가 부분만** 실행
4. **댓글 추가 부분만** 실행
5. **팔로우 추가 부분만** 실행

### 팁 2: 실제 Clerk User ID 사용 권장

- 실제 Clerk User ID를 사용하면 모든 기능을 테스트할 수 있습니다
- 가짜 ID를 사용하면 게시물 목록만 보이고, 좋아요/댓글 작성은 테스트할 수 없습니다

### 팁 3: 데이터 삭제 후 다시 실행

같은 데이터를 다시 추가하고 싶다면:

```sql
-- 모든 데이터 삭제 (주의: 모든 데이터가 삭제됩니다!)
DELETE FROM public.follows;
DELETE FROM public.comments;
DELETE FROM public.likes;
DELETE FROM public.posts;
DELETE FROM public.users WHERE clerk_id LIKE 'user_sample_%';
```

그 다음 스크립트를 다시 실행하면 됩니다.

---

## 📞 다음 단계

SQL 스크립트 실행 후:

1. ✅ 개발 서버 실행: `pnpm dev`
2. ✅ 브라우저에서 http://localhost:3000 접속
3. ✅ 게시물 목록 확인
4. ✅ 기능 테스트 시작

자세한 테스트 방법은 `docs/TEST_GUIDE.md`를 참고하세요.

