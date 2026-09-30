import { z } from 'zod';

export const startConversationSchema = z.object({
  body: z.object({
    recipient_id: z.coerce.number().int().positive({
      message: 'ID người nhận không hợp lệ',
    }),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    content: z
      .string()
      .trim()
      .min(1, 'Nội dung tin nhắn không được để trống')
      .max(2000, 'Tin nhắn không được vượt quá 2000 ký tự'),
    message_type: z.enum(['text']).default('text').optional(),
  }),
});

export const getMessagesQuerySchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
    before_id: z.coerce.number().int().positive().optional(),
  }),
});

export type StartConversationInput = z.infer<typeof startConversationSchema>['body'];
export type SendMessageInput = z.infer<typeof sendMessageSchema>['body'];
export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>['query'];
