import { z } from 'zod';

export const publishResourceSchema = z.object({
  resourceType: z.enum(['document', 'test_set', 'mindmap', 'flashcard_deck'], {
    message: 'Loại tài nguyên không hợp lệ (document, test_set, mindmap, flashcard_deck)',
  }),
  resourceId: z.coerce.number().int().positive({
    message: 'ID tài nguyên hợp lệ là bắt buộc',
  }),
  title: z.string().min(2, 'Tiêu đề phải có ít nhất 2 ký tự').max(255, 'Tiêu đề không được vượt quá 255 ký tự'),
  description: z.string().max(2000, 'Mô tả tối đa 2000 ký tự').optional().default(''),
  category: z.string().max(100, 'Danh mục tối đa 100 ký tự').optional().default('Chung'),
  tags: z.array(z.string().max(50)).optional().default([]),
  isPublic: z.boolean().optional().default(true),
});

export const reshareResourceSchema = z.object({
  reshareNote: z.string().max(1000, 'Ghi chú chia sẻ lại tối đa 1000 ký tự').optional().default(''),
});

export const addCommentSchema = z.object({
  content: z.string().min(1, 'Nội dung bình luận không được để trống').max(2000, 'Bình luận tối đa 2000 ký tự'),
  parentId: z.coerce.number().int().positive().optional().nullable(),
});

export const communityFeedQuerySchema = z.object({
  tab: z.enum(['recent', 'popular', 'saved']).optional().default('recent'),
  type: z.enum(['all', 'document', 'test_set', 'mindmap', 'flashcard_deck']).optional().default('all'),
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type PublishResourceInput = z.infer<typeof publishResourceSchema>;
export type ReshareResourceInput = z.infer<typeof reshareResourceSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
export type CommunityFeedQuery = z.infer<typeof communityFeedQuerySchema>;
