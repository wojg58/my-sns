# 📋 SNS 프로젝트 TODO 리스트

## 프로젝트 기본 설정

- [ ] `.cursor/` 디렉토리
  - [ ] `rules/` 커서룰
  - [ ] `mcp.json` MCP 서버 설정
  - [ ] `dir.md` 프로젝트 디렉토리 구조
- [ ] `.github/` 디렉토리
- [ ] `.husky/` 디렉토리
- [ ] `app/` 디렉토리 기본 파일
  - [ ] `favicon.ico` 파일
  - [ ] `not-found.tsx` 파일
  - [ ] `robots.ts` 파일
  - [ ] `sitemap.ts` 파일
  - [ ] `manifest.ts` 파일
- [ ] `public/` 디렉토리
  - [ ] `icons/` 디렉토리
  - [ ] `logo.png` 파일
  - [ ] `og-image.png` 파일
- [ ] 프로젝트 설정 파일
  - [ ] `tsconfig.json` 파일
  - [ ] `.cursorignore` 파일
  - [ ] `.gitignore` 파일
  - [ ] `.prettierignore` 파일
  - [ ] `.prettierrc` 파일
  - [ ] `eslint.config.mjs` 파일
  - [ ] `AGENTS.md` 파일

## 1. 홈 피드 페이지

### 1-1. 기본 세팅

- [ ] Next.js + TypeScript 프로젝트 생성
- [ ] Tailwind CSS 설정 (인스타 컬러 스키마)
  - [ ] `globals.css`에 Instagram 컬러 변수 추가
  - [ ] 타이포그래피 설정
- [ ] Clerk 인증 연동 (한국어 설정)
  - [ ] Clerk 프로젝트 생성
  - [ ] 환경 변수 설정
  - [ ] `middleware.ts` 설정
  - [ ] `ClerkProvider` 설정
- [ ] Supabase 프로젝트 생성 및 연동
  - [ ] Supabase 프로젝트 생성
  - [ ] 환경 변수 설정
  - [ ] Supabase 클라이언트 설정 (`lib/supabase/`)
- [ ] 데이터베이스 마이그레이션 확인
  - [ ] `sns_schema.sql` 마이그레이션 적용 확인
  - [ ] 테이블 생성 확인 (users, posts, likes, comments, follows)
  - [ ] 뷰 및 트리거 확인
- [ ] Supabase Storage 버킷 생성
  - [ ] `uploads` 버킷 생성 (대시보드에서 직접 생성)

### 1-2. 레이아웃 구조

- [ ] `app/(main)/layout.tsx` 생성
  - [ ] Sidebar + 레이아웃 통합
- [ ] `components/layout/Sidebar.tsx` 컴포넌트
  - [ ] Desktop (244px, 아이콘 + 텍스트)
  - [ ] Tablet (72px, 아이콘만)
  - [ ] Mobile (숨김)
  - [ ] 메뉴 항목: 홈, 검색, 만들기, 프로필
  - [ ] Hover 효과 및 Active 상태 스타일
- [ ] `components/layout/Header.tsx` 컴포넌트 (모바일)
  - [ ] 높이 60px
  - [ ] 로고 + 알림 아이콘 + 프로필 아이콘
- [ ] `components/layout/BottomNav.tsx` 컴포넌트 (모바일)
  - [ ] 높이 50px
  - [ ] 5개 아이콘: 홈, 검색, 만들기, 좋아요, 프로필

### 1-3. 홈 피드 - 게시물 목록

- [ ] `app/(main)/page.tsx` 홈 피드 페이지
  - [ ] 피드 레이아웃 (최대 너비 630px, 중앙 정렬)
  - [ ] 배경색 #FAFAFA
- [ ] `components/post/PostCard.tsx` 컴포넌트
  - [ ] 헤더 (60px)
    - [ ] 프로필 이미지 (32px 원형)
    - [ ] 사용자명 (Bold)
    - [ ] 시간 표시 (작고 회색)
    - [ ] ⋯ 메뉴 버튼 (우측)
  - [ ] 이미지 영역 (1:1 정사각형)
  - [ ] 액션 버튼 (48px)
    - [ ] ❤️ 좋아요 버튼 (좌측)
    - [ ] 💬 댓글 버튼 (좌측)
    - [ ] ✈️ 공유 버튼 (좌측, UI만)
    - [ ] 🔖 북마크 버튼 (우측, UI만)
  - [ ] 컨텐츠 영역
    - [ ] 좋아요 수 표시 (Bold)
    - [ ] 캡션 (사용자명 Bold + 내용)
    - [ ] 2줄 초과 시 "... 더 보기" 처리
    - [ ] 댓글 미리보기 (최신 2개)
- [ ] `components/post/PostCardSkeleton.tsx` 로딩 UI
  - [ ] Skeleton UI (회색 박스 애니메이션)
  - [ ] Shimmer 효과
- [ ] `components/post/PostFeed.tsx` 컴포넌트
  - [ ] 게시물 목록 표시
  - [ ] 로딩 상태 처리
- [ ] `app/api/posts/route.ts` GET API
  - [ ] 페이지네이션 (10개씩)
  - [ ] 시간 역순 정렬
  - [ ] 게시물 + 사용자 정보 + 통계 조인

### 1-4. 홈 피드 - 좋아요 기능

- [ ] `app/api/likes/route.ts` API
  - [ ] POST: 좋아요 추가
  - [ ] DELETE: 좋아요 제거
  - [ ] 중복 좋아요 방지 검증
- [ ] 좋아요 버튼 기능 구현
  - [ ] 빈 하트 ↔ 빨간 하트 상태 관리
  - [ ] 클릭 시 애니메이션 (scale 1.3 → 1)
  - [ ] 좋아요 수 실시간 업데이트
- [ ] 더블탭 좋아요 기능 (모바일)
  - [ ] 이미지 더블탭 감지
  - [ ] 큰 하트 등장 애니메이션 (fade in)
  - [ ] 1초 후 사라짐 (fade out)

## 2. 게시물 작성 & 댓글 기능

### 2-1. 게시물 작성 모달

- [ ] `components/post/CreatePostModal.tsx` 컴포넌트
  - [ ] Dialog 모달 (shadcn/ui)
  - [ ] 이미지 업로드 UI
  - [ ] 이미지 미리보기
  - [ ] 캡션 입력 필드 (최대 2,200자)
  - [ ] "게시" 버튼
- [ ] Sidebar "만들기" 버튼 클릭 시 모달 열기

### 2-2. 게시물 작성 - 이미지 업로드

- [ ] `app/api/posts/route.ts` POST API
  - [ ] 파일 업로드 검증 (최대 5MB)
  - [ ] 이미지 타입 검증
  - [ ] Supabase Storage에 업로드
  - [ ] 업로드 경로: `{clerk_user_id}/{filename}`
  - [ ] posts 테이블에 데이터 저장
  - [ ] 업로드 후 피드 새로고침
- [ ] 파일 업로드 로직
  - [ ] FormData 처리
  - [ ] 에러 핸들링

### 2-3. 댓글 기능 - UI & 작성

- [ ] `components/comment/CommentList.tsx` 컴포넌트
  - [ ] 댓글 목록 표시
  - [ ] PostCard: 최신 2개 미리보기
  - [ ] 상세 모달: 전체 댓글 + 스크롤
- [ ] `components/comment/CommentForm.tsx` 컴포넌트
  - [ ] "댓글 달기..." 입력창
  - [ ] Enter 키 또는 "게시" 버튼으로 댓글 작성
- [ ] `app/api/comments/route.ts` POST API
  - [ ] 댓글 작성
  - [ ] 사용자 인증 확인
  - [ ] 댓글 내용 검증

### 2-4. 댓글 기능 - 삭제 & 무한스크롤

- [ ] `app/api/comments/[commentId]/route.ts` DELETE API
  - [ ] 댓글 삭제 (본인만)
  - [ ] 권한 검증
- [ ] 댓글 삭제 버튼 UI
  - [ ] 댓글에 ⋯ 메뉴 추가
  - [ ] 본인 댓글만 삭제 버튼 표시
- [ ] PostFeed 무한 스크롤
  - [ ] Intersection Observer 사용
  - [ ] 하단 도달 시 다음 10개 로드
  - [ ] 로딩 상태 표시

## 3. 프로필 페이지 & 팔로우 기능

### 3-1. 프로필 페이지 - 기본 정보

- [ ] `app/(main)/profile/[userId]/page.tsx` 동적 라우트
  - [ ] 내 프로필: `/profile` (현재 사용자)
  - [ ] 다른 사람: `/profile/[userId]`
- [ ] `components/profile/ProfileHeader.tsx` 컴포넌트
  - [ ] 프로필 이미지 (150px Desktop / 90px Mobile, 원형)
  - [ ] 사용자명
  - [ ] 통계: 게시물 수, 팔로워 수, 팔로잉 수
  - [ ] "팔로우" / "팔로잉" 버튼 (다른 사람 프로필일 때)
  - [ ] "프로필 편집" 버튼 (내 프로필일 때, 1차 제외)
- [ ] `app/api/users/[userId]/route.ts` GET API
  - [ ] 사용자 정보 조회
  - [ ] 통계 정보 (user_stats 뷰 활용)
  - [ ] 현재 사용자와의 팔로우 관계 확인

### 3-2. 프로필 페이지 - 게시물 그리드

- [ ] `components/profile/PostGrid.tsx` 컴포넌트
  - [ ] 3열 그리드 레이아웃 (반응형)
  - [ ] 1:1 정사각형 이미지 썸네일
  - [ ] Hover 시 좋아요/댓글 수 표시
  - [ ] 클릭 시 게시물 상세 모달/페이지로 이동
- [ ] `app/api/posts/route.ts` 수정
  - [ ] `userId` 쿼리 파라미터 추가
  - [ ] 특정 사용자 게시물만 필터링

### 3-3. 팔로우 기능

- [ ] `app/api/follows/route.ts` API
  - [ ] POST: 팔로우 추가
  - [ ] DELETE: 팔로우 제거
  - [ ] 자기 자신 팔로우 방지 검증
  - [ ] 중복 팔로우 방지
- [ ] 팔로우/언팔로우 버튼 구현
  - [ ] 미팔로우: "팔로우" 버튼 (파란색 #0095f6)
  - [ ] 팔로우 중: "팔로잉" 버튼 (회색)
  - [ ] Hover 시 "언팔로우" 텍스트 (빨간 테두리)
  - [ ] 클릭 시 즉시 API 호출 및 UI 업데이트
  - [ ] 팔로워/팔로잉 수 실시간 업데이트

### 3-4. 게시물 상세 모달/페이지

- [ ] `components/post/PostModal.tsx` 컴포넌트 (Desktop)
  - [ ] 모달 레이아웃 (이미지 50% + 댓글 50%)
  - [ ] 좌측: 이미지 영역
  - [ ] 우측: 댓글 목록 (스크롤 가능)
  - [ ] 닫기 버튼 (✕)
  - [ ] 이전/다음 게시물 네비게이션 (‹ ›)
- [ ] `app/(main)/post/[postId]/page.tsx` (Mobile)
  - [ ] 전체 페이지로 전환
  - [ ] 게시물 상세 정보 표시
- [ ] `app/api/posts/[postId]/route.ts` GET API
  - [ ] 게시물 상세 정보 조회
  - [ ] 댓글 목록 포함
- [ ] 게시물 삭제 기능
  - [ ] PostCard 헤더의 ⋯ 메뉴에 "삭제" 옵션
  - [ ] 본인 게시물만 삭제 가능
  - [ ] `app/api/posts/[postId]/route.ts` DELETE API

## 4. 최종 마무리 & 배포

### 4-1. 반응형 테스트

- [ ] Desktop (1024px+) 테스트
  - [ ] Sidebar 전체 표시
  - [ ] PostCard 최대 너비 630px
  - [ ] 게시물 상세 모달
- [ ] Tablet (768px ~ 1023px) 테스트
  - [ ] Icon-only Sidebar (72px)
  - [ ] PostCard 레이아웃
- [ ] Mobile (< 768px) 테스트
  - [ ] Header 표시
  - [ ] BottomNav 표시
  - [ ] Sidebar 숨김
  - [ ] 게시물 상세 페이지

### 4-2. 에러 핸들링 & UI 개선

- [ ] 에러 핸들링
  - [ ] API 에러 처리
  - [ ] 네트워크 에러 처리
  - [ ] 사용자 친화적 에러 메시지
- [ ] Skeleton UI 개선
  - [ ] 모든 로딩 상태에 Skeleton 적용
  - [ ] Shimmer 효과 일관성
- [ ] 애니메이션 최적화
  - [ ] 좋아요 애니메이션
  - [ ] 더블탭 하트 애니메이션
  - [ ] 페이지 전환 애니메이션

### 4-3. 배포 준비

- [ ] 환경 변수 확인
  - [ ] Clerk 환경 변수
  - [ ] Supabase 환경 변수
- [ ] 프로덕션 빌드 테스트
  - [ ] `pnpm build` 실행
  - [ ] 빌드 에러 확인
- [ ] Vercel 배포
  - [ ] 프로젝트 연결
  - [ ] 환경 변수 설정
  - [ ] 배포 확인

## 참고사항

### 데이터베이스 상태

- ✅ `users` 테이블 (clerk_id 연동)
- ✅ `posts` 테이블
- ✅ `likes` 테이블
- ✅ `comments` 테이블
- ✅ `follows` 테이블
- ✅ `post_stats` 뷰
- ✅ `user_stats` 뷰
- ✅ `handle_updated_at()` 트리거 함수
- ⚠️ Storage 버킷 (`uploads`)은 Supabase 대시보드에서 직접 생성 필요

### 1차 MVP 제외 기능

다음 기능들은 2차 확장에서 구현:

- ❌ 검색 (사용자, 해시태그)
- ❌ 탐색 페이지
- ❌ 릴스
- ❌ 메시지 (DM)
- ❌ 알림
- ❌ 스토리
- ❌ 동영상
- ❌ 이미지 여러 장
- ❌ 공유 버튼 기능 (UI만)
- ❌ 북마크 기능 (UI만)
- ❌ 프로필 편집 (Clerk 기본 사용)
- ❌ 팔로워/팔로잉 목록 모달
