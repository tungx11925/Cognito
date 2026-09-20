import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { organizationMemberRepository, OrganizationMemberRow } from '../repositories/organization-member.repository';
import { AppError } from '../utils/AppError';

export interface OrgAuthRequest extends AuthRequest {
  orgMembership?: OrganizationMemberRow;
}

/**
 * Middleware để phân quyền trong phạm vi một Organization.
 * Luôn phải đứng sau authenticate middleware.
 * Trích xuất organizationId từ req.params.organizationId
 */
export const requireOrgRole = (...allowedOrgRoles: string[]) => {
  return async (req: OrgAuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục' });
      }

      const organizationId = req.params.organizationId;
      if (!organizationId) {
        return res.status(400).json({ error: 'Thiếu thông tin organizationId trong URL' });
      }

      // Check DB for actual membership
      const membership = await organizationMemberRepository.getMembership(req.user.id, organizationId);

      if (!membership || !allowedOrgRoles.includes(membership.org_role)) {
        return res.status(403).json({
          error: `Truy cập bị từ chối. Chức năng này yêu cầu quyền: ${allowedOrgRoles.join(' / ')} trong tổ chức.`,
        });
      }

      // Nếu tài khoản đang bị khoá hoặc chờ đổi pass, có thể chặn ở đây, nhưng theo yêu cầu, 
      // PENDING_FIRST_LOGIN vẫn cho qua nhưng sẽ bị chặn ở auth login flow.
      // Tuy nhiên an toàn thì check status:
      if (membership.status === 'DISABLED') {
        return res.status(403).json({ error: 'Tài khoản của bạn trong tổ chức này đã bị vô hiệu hoá' });
      }

      // Lưu context vào request
      req.orgMembership = membership;
      next();
    } catch (error) {
      console.error('Org Role check error:', error);
      return res.status(500).json({ error: 'Lỗi kiểm tra quyền tổ chức' });
    }
  };
};
