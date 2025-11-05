"use client";

import { useState, useRef, useCallback } from "react";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmojiPickerButton } from "@/components/ui/EmojiPickerButton";
import { useUser } from "@clerk/nextjs";

/**
 * @file components/post/CreatePostModal.tsx
 * @description 게시물 작성 모달 컴포넌트
 *
 * Instagram 스타일의 게시물 작성 모달입니다.
 * - 이미지 업로드 (파일 선택)
 * - 이미지 미리보기
 * - 캡션 입력 (최대 2,200자)
 * - 게시 버튼
 *
 * @dependencies
 * - @/components/ui/dialog: Dialog 모달
 * - @/components/ui/button: Button 컴포넌트
 * - @clerk/nextjs: 사용자 정보
 */

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void; // 게시 성공 후 콜백 (피드 새로고침 등)
}

/**
 * 게시물 작성 성공 시 피드를 새로고침하기 위한 함수
 * PostFeed 컴포넌트에서 사용할 수 있도록 전역 함수로 제공
 */
let refreshFeedCallback: (() => void) | null = null;

export function setRefreshFeedCallback(callback: (() => void) | null) {
  refreshFeedCallback = callback;
}

export function triggerFeedRefresh() {
  if (refreshFeedCallback) {
    refreshFeedCallback();
  }
}

export function CreatePostModal({
  open,
  onOpenChange,
  onSuccess,
}: CreatePostModalProps) {
  const { user } = useUser();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이미지 선택 핸들러
  const handleImageSelect = useCallback((file: File | null) => {
    if (!file) {
      setSelectedImage(null);
      setPreviewUrl(null);
      return;
    }

    // 파일 타입 검증
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    // 파일 크기 검증 (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setError(null);
    setSelectedImage(file);

    // 미리보기 URL 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // 파일 선택 버튼 클릭
  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 파일 입력 변경
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleImageSelect(file);
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0] || null;
    handleImageSelect(file);
  };

  // 이미지 제거
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 게시 버튼 클릭
  const handleSubmit = async () => {
    if (!selectedImage) {
      setError("이미지를 선택해주세요.");
      return;
    }

    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      console.group("[CreatePostModal] Uploading post");

      // FormData 생성
      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("caption", caption.trim());

      console.log("Uploading:", {
        imageName: selectedImage.name,
        imageSize: selectedImage.size,
        captionLength: caption.trim().length,
      });

      // API 호출
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        // 에러 응답 처리 (JSON이 아닐 수 있음)
        let errorMessage = "게시물 업로드에 실패했습니다.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (parseError) {
          // JSON 파싱 실패 시 텍스트로 읽기 시도
          try {
            const errorText = await response.text();
            errorMessage = errorText || `서버 오류 (${response.status})`;
          } catch (textError) {
            errorMessage = `서버 오류 (${response.status})`;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Post uploaded successfully:", data.post?.id);
      console.groupEnd();

      // 성공 처리
      // 모달 닫기 및 상태 초기화
      setSelectedImage(null);
      setPreviewUrl(null);
      setCaption("");
      setError(null);
      onOpenChange(false);

      // 성공 콜백 호출 (피드 새로고침 등)
      if (onSuccess) {
        onSuccess();
      }

      // 전역 새로고침 콜백도 호출
      if (refreshFeedCallback) {
        refreshFeedCallback();
      }
    } catch (err) {
      console.error("[CreatePostModal] Upload error:", err);
      setError(
        err instanceof Error ? err.message : "게시물 업로드에 실패했습니다.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  // 모달 닫기 시 상태 초기화
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // 모달이 닫힐 때 상태 초기화
      setSelectedImage(null);
      setPreviewUrl(null);
      setCaption("");
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    onOpenChange(newOpen);
  };

  const canSubmit = selectedImage !== null && !isUploading;
  const captionLength = caption.length;
  const maxCaptionLength = 2200;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-[var(--instagram-border)]">
          <DialogTitle className="text-center text-base font-semibold text-[var(--text-primary)]">
            새 게시물 만들기
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col">
          {/* 이미지 업로드 영역 */}
          {!previewUrl ? (
            <div
              className="flex flex-col items-center justify-center p-12 min-h-[400px] cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleFileButtonClick}
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-[var(--text-secondary)]" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    사진과 동영상을 여기에 끌어다 놓으세요
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileButtonClick();
                    }}
                    className="text-sm"
                  >
                    컴퓨터에서 선택
                  </Button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              {/* 이미지 미리보기 */}
              <div className="w-full aspect-square bg-gray-100 relative">
                <img
                  src={previewUrl}
                  alt="미리보기"
                  className="w-full h-full object-contain"
                />
                {/* 이미지 제거 버튼 */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  aria-label="이미지 제거"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* 캡션 입력 영역 */}
              <div className="p-4 border-t border-[var(--instagram-border)]">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="caption"
                      className="text-sm font-semibold text-[var(--text-primary)]"
                    >
                      캡션 작성
                    </label>
                    <EmojiPickerButton
                      onEmojiClick={(emoji) => {
                        const textarea = document.getElementById(
                          "caption",
                        ) as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const newValue =
                            caption.substring(0, start) +
                            emoji +
                            caption.substring(end);
                          if (newValue.length <= maxCaptionLength) {
                            setCaption(newValue);
                            setError(null);
                            // 커서 위치 조정
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(
                                start + emoji.length,
                                start + emoji.length,
                              );
                            }, 0);
                          }
                        }
                      }}
                    />
                  </div>
                  <textarea
                    id="caption"
                    value={caption}
                    onChange={(e) => {
                      if (e.target.value.length <= maxCaptionLength) {
                        setCaption(e.target.value);
                        setError(null);
                      }
                    }}
                    placeholder="문구 입력..."
                    className="w-full min-h-[120px] p-3 border border-[var(--instagram-border)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--instagram-blue)] focus:border-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                    maxLength={maxCaptionLength}
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
            </div>
          )}

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
              disabled={isUploading}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="bg-[var(--instagram-blue)] hover:bg-[var(--instagram-blue)]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  게시 중...
                </>
              ) : (
                "게시"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
