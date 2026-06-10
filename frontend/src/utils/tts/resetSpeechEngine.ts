/**
 * Helper để reset engine SpeechSynthesis.
 * Tránh bug im lặng (stuck) trên Chrome/Edge khi cancel và speak liên tiếp quá nhanh.
 */
export async function resetSpeechEngine(): Promise<void> {
  if (!('speechSynthesis' in window)) return;

  // Hủy hàng đợi hiện tại
  window.speechSynthesis.cancel();

  // Tạo delay an toàn (không dùng setTimeout cố định bọc hàm speak nữa, mà dùng async/await)
  return new Promise(resolve => setTimeout(resolve, 150));
}
