import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { testSetService } from '../services/test-set.service';
import { examParserService } from '../services/exam-parser.service';
import { validateFileContent } from '../utils/file-security';
import fs from 'fs';

export class TestSetController {
  async getAIConfig(req: AuthRequest, res: Response) {
    try {
      const { configKey } = req.params;
      const userId = req.user!.id;
      const { config, isNew } = await testSetService.getAIConfig(configKey, userId);
      return res.status(isNew ? 201 : 200).json(config);
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async updateAIConfig(req: AuthRequest, res: Response) {
    try {
      const { configKey } = req.params;
      const userId = req.user!.id;
      const result = await testSetService.updateAIConfig(configKey, userId, req.body);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async getMyDocuments(req: AuthRequest, res: Response) {
    try {
      const docs = await testSetService.getMyDocuments(req.user!.id);
      return res.status(200).json(docs);
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async getMyDecks(req: AuthRequest, res: Response) {
    try {
      const decks = await testSetService.getMyDecks(req.user!.id);
      return res.status(200).json(decks);
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async getDeckContent(req: AuthRequest, res: Response) {
    try {
      const { deckId } = req.params;
      const result = await testSetService.getDeckContent(deckId, req.user!.id);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async getDocumentContent(req: AuthRequest, res: Response) {
    try {
      const { docId } = req.params;
      const result = await testSetService.getDocumentContent(docId, req.user!.id);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async getTestSets(req: AuthRequest, res: Response) {
    try {
      const testSets = await testSetService.getTestSets(req.user!.id);
      return res.status(200).json(testSets);
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async toggleStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const result = await testSetService.toggleStatus(id, req.user!.id, is_active);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async deleteTestSet(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await testSetService.deleteTestSet(id, req.user!.id);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async getQuestions(req: AuthRequest, res: Response) {
    try {
      const { testSetId } = req.params;
      const questions = await testSetService.getQuestions(testSetId, req.user!.id);
      return res.status(200).json(questions);
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async updateQuestion(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const question = await testSetService.updateQuestion(id, req.body);
      return res.status(200).json(question);
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async bulkUpdateQuestions(req: AuthRequest, res: Response) {
    try {
      const result = await testSetService.bulkUpdateQuestions(req.body.questions);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async uploadExam(req: AuthRequest, res: Response) {
    if (!req.file) {
      return res.status(400).json({ error: 'Không tìm thấy file tải lên' });
    }

    try {
      // Security Hardening: Validate magic bytes & reject spoofed executables / scripts
      const fileBuffer = fs.readFileSync(req.file.path);
      validateFileContent(fileBuffer, req.file.originalname);

      const parseResult = await examParserService.parseExam({
        filePath: req.file.path,
        originalName: req.file.originalname,
        name: req.body.name,
        useAI: true,
        userId: req.user!.id,
      });

      const testName = req.body.name || parseResult.title || `Đề thi trích xuất từ ${req.file.originalname}`;
      const saved = await examParserService.saveToQuestionSet({
        userId: req.user!.id,
        name: testName,
        questions: parseResult.questions,
        status: 'DRAFT',
      });

      return res.status(201).json({
        testSet: saved.testSet,
        questions: saved.questions,
        stats: parseResult.stats,
        extractionMethod: parseResult.extractionMethod,
      });
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    } finally {
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {
          // Ignore unlink error
        }
      }
    }
  }
}

export const testSetController = new TestSetController();
