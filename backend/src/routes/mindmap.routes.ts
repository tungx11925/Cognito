import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { createMindmapSchema, updateMindmapSchema, getMindmapsQuerySchema } from '../schemas/mindmap.schema';
import * as MindmapController from '../controllers/mindmap.controller';

const router = Router();

router.use(authenticate);

// List & search mindmaps
router.get('/', validate(getMindmapsQuerySchema), MindmapController.getUserMindmaps);

// Create mindmap (standalone or attached to document)
router.post('/', validate(createMindmapSchema), MindmapController.createMindmap);

// Get mindmaps by document
router.get('/document/:docId', MindmapController.getMindmapsByDocument);

// Single mindmap operations (with IDOR protection)
router.get('/:id', MindmapController.getMindmapById);
router.put('/:id', validate(updateMindmapSchema), MindmapController.updateMindmap);
router.delete('/:id', MindmapController.deleteMindmap);

export default router;
