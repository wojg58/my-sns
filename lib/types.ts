/**
 * @file lib/types.ts
 * @description TypeScript 타입 정의
 *
 * Supabase 데이터베이스 스키마를 기반으로 한 타입 정의입니다.
 * - 데이터베이스 원본 타입 (snake_case)
 * - 프론트엔드용 타입 (camelCase)
 *
 * @see {@link supabase/migrations/sns_schema.sql} - 데이터베이스 스키마
 */

// ============================================
// 데이터베이스 원본 타입 (snake_case)
// ============================================

/**
 * Users 테이블 타입 (데이터베이스 원본)
 */
export interface DatabaseUser {
  id: string; // UUID
  clerk_id: string; // TEXT, UNIQUE
  name: string; // TEXT
  created_at: string; // TIMESTAMP WITH TIME ZONE
}

/**
 * Posts 테이블 타입 (데이터베이스 원본)
 */
export interface DatabasePost {
  id: string; // UUID
  user_id: string; // UUID (FK → users.id)
  image_url: string; // TEXT
  caption: string | null; // TEXT (nullable)
  created_at: string; // TIMESTAMP WITH TIME ZONE
  updated_at: string; // TIMESTAMP WITH TIME ZONE
}

/**
 * Likes 테이블 타입 (데이터베이스 원본)
 */
export interface DatabaseLike {
  id: string; // UUID
  post_id: string; // UUID (FK → posts.id)
  user_id: string; // UUID (FK → users.id)
  created_at: string; // TIMESTAMP WITH TIME ZONE
}

/**
 * Comments 테이블 타입 (데이터베이스 원본)
 */
export interface DatabaseComment {
  id: string; // UUID
  post_id: string; // UUID (FK → posts.id)
  user_id: string; // UUID (FK → users.id)
  content: string; // TEXT
  created_at: string; // TIMESTAMP WITH TIME ZONE
  updated_at: string; // TIMESTAMP WITH TIME ZONE
}

/**
 * Follows 테이블 타입 (데이터베이스 원본)
 */
export interface DatabaseFollow {
  id: string; // UUID
  follower_id: string; // UUID (FK → users.id) - 팔로우하는 사람
  following_id: string; // UUID (FK → users.id) - 팔로우받는 사람
  created_at: string; // TIMESTAMP WITH TIME ZONE
}

// ============================================
// 프론트엔드용 타입 (camelCase)
// ============================================

/**
 * User 타입 (프론트엔드용)
 */
export interface User {
  id: string;
  clerkId: string;
  name: string;
  createdAt: string;
}

/**
 * Post 타입 (프론트엔드용)
 */
export interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Like 타입 (프론트엔드용)
 */
export interface Like {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

/**
 * Comment 타입 (프론트엔드용)
 */
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Follow 타입 (프론트엔드용)
 */
export interface Follow {
  id: string;
  followerId: string; // 팔로우하는 사람
  followingId: string; // 팔로우받는 사람
  createdAt: string;
}

// ============================================
// 확장 타입 (관계 포함)
// ============================================

/**
 * User with 관계 데이터
 */
export interface UserWithRelations extends User {
  posts?: Post[];
  followers?: User[];
  following?: User[];
}

/**
 * Post with 관계 데이터 (게시물 + 사용자 정보 + 통계)
 */
export interface PostWithRelations extends Post {
  user: User;
  stats: {
    likesCount: number;
    commentsCount: number;
  };
  isLiked?: boolean;
  recentComments?: CommentWithUser[];
}

/**
 * Comment with 사용자 정보
 */
export interface CommentWithUser extends Comment {
  user: User;
}

/**
 * Post 통계 타입
 */
export interface PostStats {
  likesCount: number;
  commentsCount: number;
}

/**
 * User 통계 타입
 */
export interface UserStats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

// ============================================
// API 응답 타입
// ============================================

/**
 * 게시물 목록 API 응답
 */
export interface PostsResponse {
  posts: PostWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

/**
 * 좋아요 API 응답
 */
export interface LikeResponse {
  success: boolean;
  like?: Like;
  error?: string;
}

/**
 * 댓글 API 응답
 */
export interface CommentResponse {
  success: boolean;
  comment?: CommentWithUser;
  error?: string;
}

/**
 * 팔로우 API 응답
 */
export interface FollowResponse {
  success: boolean;
  follow?: Follow;
  error?: string;
}

// ============================================
// 유틸리티 타입
// ============================================

/**
 * 데이터베이스 타입을 프론트엔드 타입으로 변환하는 헬퍼 타입
 */
export type DbToFrontend<T extends DatabaseUser | DatabasePost | DatabaseLike | DatabaseComment | DatabaseFollow> =
  T extends DatabaseUser
    ? User
    : T extends DatabasePost
    ? Post
    : T extends DatabaseLike
    ? Like
    : T extends DatabaseComment
    ? Comment
    : T extends DatabaseFollow
    ? Follow
    : never;

