-- ============================================
-- 샘플 데이터 삽입 스크립트
-- ============================================
-- Supabase SQL Editor에서 실행하여 테스트 데이터를 추가합니다.
-- 
-- 중요사항:
-- 1. Clerk를 사용하므로 clerk_id는 실제 Clerk User ID 형식이어야 합니다.
-- 2. 실제 Clerk 사용자가 있다면 아래 clerk_id를 실제 값으로 교체하세요.
-- 3. 실제 Clerk 사용자가 없다면, 이 스크립트는 테스트용 데이터만 생성합니다.
--    (인증이 필요한 기능은 실제 Clerk 사용자로 로그인해야 작동합니다)
-- 4. 이미지 URL은 Unsplash placeholder를 사용합니다.
--    실제 사용하려면 Supabase Storage에 이미지를 업로드하고 URL을 교체하세요.
-- ============================================

-- ============================================
-- 1. 샘플 사용자 추가 (users 테이블)
-- ============================================
-- Clerk User ID 형식 예시: user_2abc123def456ghi789jkl
-- ⚠️ 실제 Clerk 사용자 ID를 사용하려면 아래 값들을 교체하세요!
-- 
-- 실제 Clerk 사용자 ID 확인 방법:
-- 1. Clerk Dashboard → Users에서 사용자 선택
-- 2. User ID 복사 (예: user_2abc123def456ghi789jkl)
-- 3. 아래 'user_sample_001' 부분을 실제 ID로 교체

-- 샘플 사용자 1
-- ⚠️ 'user_sample_001'을 실제 Clerk User ID로 교체하세요!
INSERT INTO public.users (id, clerk_id, name, created_at)
VALUES (
  gen_random_uuid(),
  'user_sample_001',  -- ⚠️ 실제 Clerk User ID로 교체 필요
  '테스트 사용자1',
  now() - INTERVAL '30 days'
)
ON CONFLICT (clerk_id) DO NOTHING;

-- 샘플 사용자 2
-- ⚠️ 'user_sample_002'를 실제 Clerk User ID로 교체하세요!
INSERT INTO public.users (id, clerk_id, name, created_at)
VALUES (
  gen_random_uuid(),
  'user_sample_002',  -- ⚠️ 실제 Clerk User ID로 교체 필요
  '테스트 사용자2',
  now() - INTERVAL '25 days'
)
ON CONFLICT (clerk_id) DO NOTHING;

-- 샘플 사용자 3
-- ⚠️ 'user_sample_003'을 실제 Clerk User ID로 교체하세요!
INSERT INTO public.users (id, clerk_id, name, created_at)
VALUES (
  gen_random_uuid(),
  'user_sample_003',  -- ⚠️ 실제 Clerk User ID로 교체 필요
  '테스트 사용자3',
  now() - INTERVAL '20 days'
)
ON CONFLICT (clerk_id) DO NOTHING;

-- ============================================
-- 2. 샘플 게시물 추가 (posts 테이블)
-- ============================================
-- 이미지 URL은 placeholder 이미지를 사용합니다.
-- 실제 사용하려면 Supabase Storage에 이미지를 업로드하고 URL을 교체하세요.

-- 사용자 ID를 가져오기 위한 변수 선언 (PostgreSQL에서는 함수 사용)
DO $$
DECLARE
  user1_id UUID;
  user2_id UUID;
  user3_id UUID;
BEGIN
  -- 사용자 ID 가져오기
  SELECT id INTO user1_id FROM public.users WHERE clerk_id = 'user_sample_001';
  SELECT id INTO user2_id FROM public.users WHERE clerk_id = 'user_sample_002';
  SELECT id INTO user3_id FROM public.users WHERE clerk_id = 'user_sample_003';

  -- 사용자1의 게시물들
  IF user1_id IS NOT NULL THEN
    INSERT INTO public.posts (user_id, image_url, caption, created_at)
    VALUES
      (
        user1_id,
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop',
        '오늘 날씨가 정말 좋네요! 🌞',
        now() - INTERVAL '2 days'
      ),
      (
        user1_id,
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=800&fit=crop',
        '저녁 하늘입니다. #저녁 #하늘',
        now() - INTERVAL '5 days'
      ),
      (
        user1_id,
        'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=800&fit=crop',
        '맛있는 식사 시간!',
        now() - INTERVAL '10 days'
      );
  END IF;

  -- 사용자2의 게시물들
  IF user2_id IS NOT NULL THEN
    INSERT INTO public.posts (user_id, image_url, caption, created_at)
    VALUES
      (
        user2_id,
        'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&h=800&fit=crop',
        '새로운 프로젝트를 시작했습니다!',
        now() - INTERVAL '1 day'
      ),
      (
        user2_id,
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=800&fit=crop',
        '오늘도 좋은 하루입니다 ☀️',
        now() - INTERVAL '7 days'
      );
  END IF;

  -- 사용자3의 게시물들
  IF user3_id IS NOT NULL THEN
    INSERT INTO public.posts (user_id, image_url, caption, created_at)
    VALUES
      (
        user3_id,
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop',
        '주말 여행 다녀왔어요!',
        now() - INTERVAL '3 days'
      ),
      (
        user3_id,
        'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=800&fit=crop',
        '새로운 취미를 시작했습니다 🎨',
        now() - INTERVAL '15 days'
      );
  END IF;
END $$;

-- ============================================
-- 3. 샘플 좋아요 추가 (likes 테이블)
-- ============================================
DO $$
DECLARE
  user1_id UUID;
  user2_id UUID;
  user3_id UUID;
  post_ids UUID[];
  current_post_id UUID;
BEGIN
  -- 사용자 ID 가져오기
  SELECT id INTO user1_id FROM public.users WHERE clerk_id = 'user_sample_001';
  SELECT id INTO user2_id FROM public.users WHERE clerk_id = 'user_sample_002';
  SELECT id INTO user3_id FROM public.users WHERE clerk_id = 'user_sample_003';

  -- 모든 게시물 ID 가져오기
  SELECT ARRAY_AGG(id) INTO post_ids FROM public.posts;

  -- 각 게시물에 랜덤하게 좋아요 추가
  IF post_ids IS NOT NULL THEN
    FOREACH current_post_id IN ARRAY post_ids
    LOOP
      -- 사용자1이 일부 게시물에 좋아요
      IF random() > 0.3 THEN
        INSERT INTO public.likes (post_id, user_id, created_at)
        VALUES (current_post_id, user1_id, now() - INTERVAL '1 day')
        ON CONFLICT (post_id, user_id) DO NOTHING;
      END IF;

      -- 사용자2가 일부 게시물에 좋아요
      IF random() > 0.4 THEN
        INSERT INTO public.likes (post_id, user_id, created_at)
        VALUES (current_post_id, user2_id, now() - INTERVAL '2 days')
        ON CONFLICT (post_id, user_id) DO NOTHING;
      END IF;

      -- 사용자3이 일부 게시물에 좋아요
      IF random() > 0.5 THEN
        INSERT INTO public.likes (post_id, user_id, created_at)
        VALUES (current_post_id, user3_id, now() - INTERVAL '3 days')
        ON CONFLICT (post_id, user_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END $$;

-- ============================================
-- 4. 샘플 댓글 추가 (comments 테이블)
-- ============================================
DO $$
DECLARE
  user1_id UUID;
  user2_id UUID;
  user3_id UUID;
  post_ids UUID[];
  current_post_id UUID;
BEGIN
  -- 사용자 ID 가져오기
  SELECT id INTO user1_id FROM public.users WHERE clerk_id = 'user_sample_001';
  SELECT id INTO user2_id FROM public.users WHERE clerk_id = 'user_sample_002';
  SELECT id INTO user3_id FROM public.users WHERE clerk_id = 'user_sample_003';

  -- 모든 게시물 ID 가져오기
  SELECT ARRAY_AGG(id) INTO post_ids FROM public.posts;

  -- 각 게시물에 댓글 추가
  IF post_ids IS NOT NULL AND user1_id IS NOT NULL AND user2_id IS NOT NULL AND user3_id IS NOT NULL THEN
    FOREACH current_post_id IN ARRAY post_ids
    LOOP
      -- 사용자1이 댓글 작성
      IF random() > 0.5 THEN
        INSERT INTO public.comments (post_id, user_id, content, created_at)
        VALUES (
          current_post_id,
          user1_id,
          CASE (random() * 3)::int
            WHEN 0 THEN '정말 멋진 사진이네요!'
            WHEN 1 THEN '좋아요! 👍'
            ELSE '응원합니다!'
          END,
          now() - INTERVAL '1 day'
        );
      END IF;

      -- 사용자2가 댓글 작성
      IF random() > 0.6 THEN
        INSERT INTO public.comments (post_id, user_id, content, created_at)
        VALUES (
          current_post_id,
          user2_id,
          CASE (random() * 3)::int
            WHEN 0 THEN '와우!'
            WHEN 1 THEN '대단해요!'
            ELSE '멋져요!'
          END,
          now() - INTERVAL '2 days'
        );
      END IF;

      -- 사용자3이 댓글 작성
      IF random() > 0.7 THEN
        INSERT INTO public.comments (post_id, user_id, content, created_at)
        VALUES (
          current_post_id,
          user3_id,
          CASE (random() * 3)::int
            WHEN 0 THEN '좋아요!'
            WHEN 1 THEN '잘 보고 갑니다!'
            ELSE '감사합니다!'
          END,
          now() - INTERVAL '3 days'
        );
      END IF;
    END LOOP;
  END IF;
END $$;

-- ============================================
-- 5. 샘플 팔로우 관계 추가 (follows 테이블)
-- ============================================
DO $$
DECLARE
  user1_id UUID;
  user2_id UUID;
  user3_id UUID;
BEGIN
  -- 사용자 ID 가져오기
  SELECT id INTO user1_id FROM public.users WHERE clerk_id = 'user_sample_001';
  SELECT id INTO user2_id FROM public.users WHERE clerk_id = 'user_sample_002';
  SELECT id INTO user3_id FROM public.users WHERE clerk_id = 'user_sample_003';

  -- 팔로우 관계 추가
  IF user1_id IS NOT NULL AND user2_id IS NOT NULL AND user3_id IS NOT NULL THEN
    -- 사용자1이 사용자2를 팔로우
    INSERT INTO public.follows (follower_id, following_id, created_at)
    VALUES (user1_id, user2_id, now() - INTERVAL '10 days')
    ON CONFLICT (follower_id, following_id) DO NOTHING;

    -- 사용자1이 사용자3을 팔로우
    INSERT INTO public.follows (follower_id, following_id, created_at)
    VALUES (user1_id, user3_id, now() - INTERVAL '8 days')
    ON CONFLICT (follower_id, following_id) DO NOTHING;

    -- 사용자2가 사용자1을 팔로우
    INSERT INTO public.follows (follower_id, following_id, created_at)
    VALUES (user2_id, user1_id, now() - INTERVAL '12 days')
    ON CONFLICT (follower_id, following_id) DO NOTHING;

    -- 사용자2가 사용자3을 팔로우
    INSERT INTO public.follows (follower_id, following_id, created_at)
    VALUES (user2_id, user3_id, now() - INTERVAL '5 days')
    ON CONFLICT (follower_id, following_id) DO NOTHING;

    -- 사용자3이 사용자1을 팔로우
    INSERT INTO public.follows (follower_id, following_id, created_at)
    VALUES (user3_id, user1_id, now() - INTERVAL '7 days')
    ON CONFLICT (follower_id, following_id) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 데이터 확인용 쿼리
-- ============================================
-- 실행 후 다음 쿼리로 데이터를 확인할 수 있습니다:

-- SELECT COUNT(*) as total_users FROM public.users;
-- SELECT COUNT(*) as total_posts FROM public.posts;
-- SELECT COUNT(*) as total_likes FROM public.likes;
-- SELECT COUNT(*) as total_comments FROM public.comments;
-- SELECT COUNT(*) as total_follows FROM public.follows;

-- SELECT * FROM public.users;
-- SELECT * FROM public.posts ORDER BY created_at DESC;
-- SELECT * FROM public.post_stats;
-- SELECT * FROM public.user_stats;

