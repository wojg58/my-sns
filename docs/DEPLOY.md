# 배포 가이드

이 문서는 프로젝트를 Vercel에 배포하는 방법을 안내합니다.

## 📋 배포 전 체크리스트

### 1. 환경 변수 확인

#### Clerk 환경 변수

다음 환경 변수들이 모두 설정되어 있는지 확인하세요:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

**확인 방법:**

1. Clerk Dashboard → **API Keys** 메뉴
2. **Publishable Key**와 **Secret Key** 확인
3. `.env` 파일에 올바르게 설정되어 있는지 확인

#### Supabase 환경 변수

다음 환경 변수들이 모두 설정되어 있는지 확인하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

**확인 방법:**

1. Supabase Dashboard → **Settings** → **API** 메뉴
2. **Project URL**, **anon public key**, **service_role secret key** 확인
3. `.env` 파일에 올바르게 설정되어 있는지 확인

> ⚠️ **보안 주의**: `SUPABASE_SERVICE_ROLE_KEY`는 절대 공개 저장소에 커밋하지 마세요!

### 2. 데이터베이스 마이그레이션 확인

모든 데이터베이스 마이그레이션이 Supabase에 적용되었는지 확인:

1. Supabase Dashboard → **Database** → **Migrations** 메뉴
2. 모든 마이그레이션 파일이 적용되었는지 확인
3. 다음 테이블들이 존재하는지 확인:
   - ✅ `users`
   - ✅ `posts`
   - ✅ `likes`
   - ✅ `comments`
   - ✅ `follows`

### 3. Storage 버킷 확인

1. Supabase Dashboard → **Storage** 메뉴
2. `uploads` 버킷이 생성되어 있는지 확인
3. 버킷이 Public인지 Private인지 확인 (현재 프로젝트는 Public 권장)

### 4. 프로덕션 빌드 테스트

로컬에서 프로덕션 빌드를 테스트합니다:

```bash
# 의존성 설치
pnpm install

# 프로덕션 빌드
pnpm build

# 빌드 에러가 있는지 확인
# 에러가 없다면 다음 단계로 진행
```

**빌드 성공 확인 사항:**

- ✅ 빌드 에러 없음
- ✅ TypeScript 타입 에러 없음
- ✅ ESLint 경고 없음 (최대한)

## 🚀 Vercel 배포

### 1. Vercel 프로젝트 연결

#### 방법 1: Vercel 대시보드를 통한 연결

1. [Vercel Dashboard](https://vercel.com/dashboard)에 로그인
2. **"Add New..."** → **"Project"** 클릭
3. GitHub/GitLab/Bitbucket에서 저장소 선택
4. 프로젝트 이름 설정 (예: `my-sns`)
5. **Framework Preset**: Next.js 자동 감지
6. **Root Directory**: `.` (기본값)
7. **Build Command**: `pnpm build` (자동 감지)
8. **Output Directory**: `.next` (자동 감지)
9. **Install Command**: `pnpm install` (자동 감지)

#### 방법 2: Vercel CLI를 통한 배포

```bash
# Vercel CLI 설치 (전역)
npm i -g vercel

# 프로젝트 루트에서 실행
vercel

# 대화형 설정
# - Set up and deploy? Yes
# - Which scope? (계정 선택)
# - Link to existing project? No (처음 배포)
# - Project name? my-sns
# - Directory? ./
```

### 2. 환경 변수 설정

Vercel 대시보드에서 환경 변수를 설정합니다:

1. Vercel Dashboard → 프로젝트 선택
2. **Settings** → **Environment Variables** 메뉴
3. 다음 환경 변수들을 추가:

#### Clerk 환경 변수

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_...
CLERK_SECRET_KEY = sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL = /sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL = /
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL = /
```

#### Supabase 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STORAGE_BUCKET = uploads
```

**환경 변수 적용 범위:**

- **Production**: 프로덕션 환경에만 적용
- **Preview**: 프리뷰 환경에만 적용
- **Development**: 개발 환경에만 적용

> 💡 **팁**: 모든 환경에서 동일하게 사용하려면 각각 선택하여 추가하세요.

### 3. Clerk 대시보드 설정 (프로덕션 URL 추가)

Vercel 배포 후 Clerk 대시보드에 프로덕션 URL을 추가해야 합니다:

1. Clerk Dashboard → **Domains** 메뉴
2. **Add Domain** 클릭
3. Vercel에서 제공한 도메인 입력 (예: `my-sns.vercel.app`)
4. 또는 커스텀 도메인 입력 (예: `myapp.com`)
5. DNS 설정 안내에 따라 CNAME 레코드 추가 (커스텀 도메인인 경우)

### 4. 배포 확인

배포가 완료되면 다음을 확인합니다:

#### 4-1. 빌드 로그 확인

1. Vercel Dashboard → 프로젝트 → **Deployments** 탭
2. 최신 배포의 **Build Logs** 확인
3. 빌드 에러가 없는지 확인

#### 4-2. 사이트 접속 테스트

1. 배포된 URL로 접속 (예: `https://my-sns.vercel.app`)
2. 홈 페이지가 정상적으로 로드되는지 확인
3. 로그인/회원가입이 작동하는지 확인

#### 4-3. 기능 테스트

다음 기능들이 정상 작동하는지 확인:

- ✅ 로그인/회원가입
- ✅ 게시물 작성 (이미지 업로드)
- ✅ 게시물 피드 표시
- ✅ 좋아요 기능
- ✅ 댓글 작성/삭제
- ✅ 프로필 페이지
- ✅ 팔로우/언팔로우
- ✅ 게시물 상세 모달 (Desktop)
- ✅ 게시물 상세 페이지 (Mobile)

### 5. 커스텀 도메인 설정 (선택사항)

커스텀 도메인을 사용하려면:

1. Vercel Dashboard → 프로젝트 → **Settings** → **Domains**
2. **Add Domain** 클릭
3. 도메인 입력 (예: `myapp.com`)
4. DNS 설정 안내에 따라 레코드 추가:
   - **A 레코드**: `@` → `76.76.21.21`
   - **CNAME 레코드**: `www` → `cname.vercel-dns.com`
5. DNS 전파 대기 (최대 24시간, 보통 몇 분~몇 시간)
6. SSL 인증서 자동 발급 확인

## 🔍 배포 후 문제 해결

### 빌드 에러

**문제**: 빌드가 실패하는 경우

**해결 방법:**

1. Vercel Dashboard → **Deployments** → **Build Logs** 확인
2. 에러 메시지 확인
3. 로컬에서 `pnpm build` 실행하여 동일한 에러 재현 확인
4. 에러 수정 후 다시 커밋/푸시

### 환경 변수 에러

**문제**: 환경 변수가 제대로 로드되지 않는 경우

**해결 방법:**

1. Vercel Dashboard → **Settings** → **Environment Variables** 확인
2. 모든 환경 변수가 올바르게 설정되어 있는지 확인
3. 환경 변수 이름이 정확한지 확인 (대소문자 구분)
4. **Redeploy** 클릭하여 재배포

### 인증 에러

**문제**: 로그인이 작동하지 않는 경우

**해결 방법:**

1. Clerk Dashboard → **Domains** 메뉴
2. Vercel 도메인이 추가되어 있는지 확인
3. **Allowed Origins**에 Vercel URL이 포함되어 있는지 확인

### 데이터베이스 연결 에러

**문제**: Supabase 연결이 실패하는 경우

**해결 방법:**

1. Supabase Dashboard → **Settings** → **API** 확인
2. 환경 변수가 올바르게 설정되어 있는지 확인
3. Supabase 프로젝트가 활성화되어 있는지 확인
4. RLS 정책이 올바르게 설정되어 있는지 확인

## 📝 배포 후 확인 사항

### 필수 확인

- [ ] 홈 페이지 정상 로드
- [ ] 로그인/회원가입 작동
- [ ] 게시물 작성 및 업로드 작동
- [ ] 게시물 피드 표시
- [ ] 좋아요/댓글 기능 작동
- [ ] 프로필 페이지 표시
- [ ] 팔로우 기능 작동
- [ ] 모바일 반응형 작동

### 성능 확인

- [ ] 페이지 로딩 속도 (Lighthouse 점수 확인)
- [ ] 이미지 최적화 작동
- [ ] API 응답 시간 확인

### 보안 확인

- [ ] 환경 변수 노출 확인 (빌드 로그에서 확인)
- [ ] HTTPS 연결 확인
- [ ] CORS 설정 확인

## 🔄 재배포

코드 변경 후 자동 재배포:

- GitHub/GitLab/Bitbucket에 푸시하면 자동으로 재배포됩니다
- Pull Request를 생성하면 Preview 배포가 생성됩니다

수동 재배포:

1. Vercel Dashboard → **Deployments**
2. 최신 배포의 **⋯** 메뉴 클릭
3. **Redeploy** 클릭

## 📚 참고 자료

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Clerk 배포 가이드](https://clerk.com/docs/deployments/overview)
- [Supabase 배포 가이드](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
