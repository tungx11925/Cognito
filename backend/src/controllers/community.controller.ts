import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { communityService } from '../services/community.service';
import {
  publishResourceSchema,
  reshareResourceSchema,
  addCommentSchema,
  communityFeedQuerySchema,
} from '../schemas/community.schema';

export const getCommunityFeed = async (req: AuthRequest, res: Response) => {
  try {
    const validatedQuery = communityFeedQuerySchema.parse(req.query);
    const userId = req.user?.id || null;
    const result = await communityService.getCommunityFeed(userId, validatedQuery);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors?.[0]?.message || error.issues?.[0]?.message || 'Dữ liệu truy vấn không hợp lệ' });
    }
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi tải bảng tin cộng đồng' });
  }
};

export const getResourceDetail = async (req: AuthRequest, res: Response) => {
  try {
    const resourceId = Number(req.params.id);
    if (!resourceId || isNaN(resourceId)) {
      return res.status(400).json({ error: 'ID tài nguyên không hợp lệ' });
    }
    const userId = req.user?.id || null;
    const resource = await communityService.getResourceDetail(resourceId, userId);
    return res.status(200).json({ resource });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi tải chi tiết tài nguyên' });
  }
};

export const publishResource = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const validatedBody = publishResourceSchema.parse(req.body);
    const published = await communityService.publishResource(userId, validatedBody);
    return res.status(201).json({
      message: 'Đăng tải nguyên lên cộng đồng thành công',
      resource: published,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors?.[0]?.message || error.issues?.[0]?.message || 'Dữ liệu đăng bài không hợp lệ' });
    }
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi đăng tài nguyên' });
  }
};

export const unpublishResource = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const resourceId = Number(req.params.id);
    if (!resourceId || isNaN(resourceId)) {
      return res.status(400).json({ error: 'ID tài nguyên không hợp lệ' });
    }
    const result = await communityService.unpublishResource(userId, resourceId, req.user?.role || undefined);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi gỡ tài nguyên' });
  }
};

export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const resourceId = Number(req.params.id);
    if (!resourceId || isNaN(resourceId)) {
      return res.status(400).json({ error: 'ID tài nguyên không hợp lệ' });
    }
    const result = await communityService.toggleLike(userId, resourceId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi thích tài nguyên' });
  }
};

export const toggleSave = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const resourceId = Number(req.params.id);
    if (!resourceId || isNaN(resourceId)) {
      return res.status(400).json({ error: 'ID tài nguyên không hợp lệ' });
    }
    const result = await communityService.toggleSave(userId, resourceId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi lưu tài nguyên' });
  }
};

export const reshareResource = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const resourceId = Number(req.params.id);
    if (!resourceId || isNaN(resourceId)) {
      return res.status(400).json({ error: 'ID tài nguyên không hợp lệ' });
    }
    const validatedBody = reshareResourceSchema.parse(req.body);
    const reshare = await communityService.reshareResource(userId, resourceId, validatedBody.reshareNote);
    return res.status(201).json({
      message: 'Chia sẻ lại tài nguyên lên cộng đồng thành công',
      resource: reshare,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors?.[0]?.message || error.issues?.[0]?.message || 'Dữ liệu không hợp lệ' });
    }
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi chia sẻ lại tài nguyên' });
  }
};

export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const resourceId = Number(req.params.id);
    if (!resourceId || isNaN(resourceId)) {
      return res.status(400).json({ error: 'ID tài nguyên không hợp lệ' });
    }
    const validatedBody = addCommentSchema.parse(req.body);
    const comment = await communityService.addComment(userId, resourceId, validatedBody.content, validatedBody.parentId);
    return res.status(201).json({
      message: 'Thêm bình luận thành công',
      comment,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors?.[0]?.message || error.issues?.[0]?.message || 'Nội dung bình luận không hợp lệ' });
    }
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi thêm bình luận' });
  }
};

export const listComments = async (req: AuthRequest, res: Response) => {
  try {
    const resourceId = Number(req.params.id);
    if (!resourceId || isNaN(resourceId)) {
      return res.status(400).json({ error: 'ID tài nguyên không hợp lệ' });
    }
    const userId = req.user?.id || null;
    const limit = req.query.limit ? Math.max(1, Math.min(200, Number(req.query.limit))) : 50;
    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const comments = await communityService.listComments(resourceId, userId, limit, page);
    return res.status(200).json({ comments, page, limit });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi tải danh sách bình luận' });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const commentId = Number(req.params.id);
    if (!commentId || isNaN(commentId)) {
      return res.status(400).json({ error: 'ID bình luận không hợp lệ' });
    }
    const result = await communityService.deleteComment(userId, commentId, req.user?.role || undefined);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi xóa bình luận' });
  }
};

export const getUserPersonalResources = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const resources = await communityService.getUserPersonalResources(userId);
    return res.status(200).json(resources);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi lấy tài nguyên cá nhân' });
  }
};
