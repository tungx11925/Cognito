import { Router } from 'express';
import {
  getCommunityFeed,
  getResourceDetail,
  publishResource,
  unpublishResource,
  toggleLike,
  toggleSave,
  reshareResource,
  addComment,
  listComments,
  deleteComment,
  getUserPersonalResources,
} from '../controllers/community.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';

const router = Router();

// Feed & Discovery
router.get('/feed', optionalAuthenticate, getCommunityFeed);
router.get('/my-resources', authenticate, getUserPersonalResources);

// Detail & Direct Study Target
router.get('/resources/:id', optionalAuthenticate, getResourceDetail);

// Publish & Unpublish (Strict Ownership)
router.post('/publish', authenticate, publishResource);
router.delete('/resources/:id', authenticate, unpublishResource);

// Interactions (Like, Save Reference, Reshare with Attribution)
router.post('/resources/:id/like', authenticate, toggleLike);
router.post('/resources/:id/save', authenticate, toggleSave);
router.post('/resources/:id/reshare', authenticate, reshareResource);

// Comments Tree
router.get('/resources/:id/comments', optionalAuthenticate, listComments);
router.post('/resources/:id/comments', authenticate, addComment);
router.delete('/comments/:id', authenticate, deleteComment);

export default router;
