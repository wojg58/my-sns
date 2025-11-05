"use client";

import { useState, useRef, useEffect } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Smile } from "lucide-react";

/**
 * @file components/ui/EmojiPickerButton.tsx
 * @description 이모티콘 피커 버튼 컴포넌트
 *
 * 이모티콘 선택 버튼과 피커를 제공합니다.
 * - 버튼 클릭 시 이모티콘 피커 표시/숨김
 * - 이모티콘 선택 시 콜백으로 전달
 * - 외부 클릭 시 자동으로 닫힘
 *
 * @dependencies
 * - emoji-picker-react: 이모티콘 피커 라이브러리
 * - lucide-react: 아이콘
 */

interface EmojiPickerButtonProps {
  onEmojiClick: (emoji: string) => void;
  className?: string;
}

export function EmojiPickerButton({
  onEmojiClick,
  className = "",
}: EmojiPickerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 외부 클릭 시 피커 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiClick(emojiData.emoji);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="이모티콘 선택"
      >
        <Smile className="w-5 h-5 text-[var(--text-primary)]" />
      </button>

      {isOpen && (
        <div
          ref={pickerRef}
          className="absolute bottom-full right-0 mb-2 z-50"
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={320}
            height={400}
            previewConfig={{
              showPreview: false,
            }}
            skinTonesDisabled
            searchDisabled={false}
          />
        </div>
      )}
    </div>
  );
}

