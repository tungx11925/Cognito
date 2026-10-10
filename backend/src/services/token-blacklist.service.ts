import crypto from 'crypto';

/**
 * GAP-04: Token Blacklist Service
 * Lưu trữ danh sách token đã đăng xuất (revoked) trong thời gian còn hiệu lực
 * Sử dụng SHA-256 hash để tối ưu bộ nhớ và bảo mật.
 */
class TokenBlacklistService {
  // Map lưu tokenHash -> expiryTimestampMs
  private blacklist = new Map<string, number>();

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Thêm token vào danh sách blacklist khi người dùng đăng xuất
   */
  add(token: string, expiryTimestampMs?: number): void {
    if (!token) return;
    const hash = this.hashToken(token);
    // Mặc định lưu 24 giờ nếu không truyền expiry
    const expiry = expiryTimestampMs || Date.now() + 24 * 60 * 60 * 1000;
    this.blacklist.set(hash, expiry);
    this.cleanup();
  }

  /**
   * Kiểm tra xem token đã bị vô hiệu hóa do đăng xuất hay chưa
   */
  isBlacklisted(token: string): boolean {
    if (!token) return false;
    const hash = this.hashToken(token);
    const expiry = this.blacklist.get(hash);
    if (!expiry) return false;
    if (Date.now() > expiry) {
      this.blacklist.delete(hash);
      return false;
    }
    return true;
  }

  /**
   * Tự động dọn dẹp các token đã quá hạn tự nhiên khỏi RAM
   */
  private cleanup(): void {
    if (this.blacklist.size > 1000) {
      const now = Date.now();
      for (const [hash, expiry] of this.blacklist.entries()) {
        if (now > expiry) {
          this.blacklist.delete(hash);
        }
      }
    }
  }

  /**
   * Xóa toàn bộ blacklist (dùng cho testing)
   */
  clear(): void {
    this.blacklist.clear();
  }
}

export const tokenBlacklistService = new TokenBlacklistService();
