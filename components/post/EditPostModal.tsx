"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * @file components/post/EditPostModal.tsx
 * @description 게시물 수정 모달 컴포넌트
 *
 * Instagram 스타일의 게시물 수정 모달입니다.
 * - 캡션 수정 (최대 2,200자)
 * - 저장 버튼
 *
 * @dependencies
 * - @/components/ui/dialog: Dialog 모달
 * - @/components/ui/button: Button 컴포넌트
 */

interface EditPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  initialCaption: string;
  onSuccess?: () => void; // 수정 성공 후 콜백 (피드 새로고침 등)
}

export function EditPostModal({
  open,
  onOpenChange,
  postId,
  initialCaption,
  onSuccess,
}: EditPostModalProps) {
  const [caption, setCaption] = useState(initialCaption);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달이 열릴 때 초기 캡션으로 설정
  useEffect(() => {
    if (open) {
      setCaption(initialCaption);
      setError(null);
    }
  }, [open, initialCaption]);

  // 수정 버튼 클릭
  const handleSubmit = async () => {
    if (!postId) {
      setError("게시물 ID가 없습니다.");
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      console.group("[EditPostModal] Updating post");
      console.log("Post ID:", postId);
      console.log("Caption:", caption);

      // API 호출
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ caption }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "게시물 수정에 실패했습니다.");
      }

      const data = await response.json();
      console.log("Post updated successfully:", data);
      console.groupEnd();

      // 성공 처리
      setError(null);
      onOpenChange(false);

      // 성공 콜백 호출 (피드 새로고침 등)
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("[EditPostModal] Update error:", err);
      setError(err instanceof Error ? err.message : "게시물 수정에 실패했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  // 모달 닫기 시 상태 초기화
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // 모달이 닫힐 때 상태 초기화
      setCaption(initialCaption);
      setError(null);
    }
    onOpenChange(newOpen);
  };

  const captionLength = caption.length;
  const maxCaptionLength = 2200;
  const canSubmit = !isUpdating && caption !== initialCaption;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-[var(--instagram-border)]">
          <DialogTitle className="text-center text-base font-semibold text-[var(--text-primary)]">
            게시물 수정
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col">
          {/* 캡션 입력 영역 */}
          <div className="p-6">
            <div className="space-y-2">
              <label
                htmlFor="edit-caption"
                className="text-sm font-semibold text-[var(--text-primary)]"
              >
                캡션 수정
              </label>
              <textarea
                id="edit-caption"
                value={caption}
                onChange={(e) => {
                  if (e.target.value.length <= maxCaptionLength) {
                    setCaption(e.target.value);
                    setError(null);
                  }
                }}
                placeholder="문구 입력..."
                className="w-full min-h-[200px] p-3 border border-[var(--instagram-border)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--instagram-blue)] focus:border-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                maxLength={maxCaptionLength}
                disabled={isUpdating}
              />
              <div className="flex justify-end">
                <span
                  className={`text-xs ${
                    captionLength >= maxCaptionLength
                      ? "text-red-500"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  {captionLength}/{maxCaptionLength}
                </span>
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="px-6 py-3 bg-red-50 border-t border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* 하단 버튼 영역 */}
          <div className="px-6 py-4 border-t border-[var(--instagram-border)] flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isUpdating}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="bg-[var(--instagram-blue)] hover:bg-[var(--instagram-blue)]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                "저장"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

