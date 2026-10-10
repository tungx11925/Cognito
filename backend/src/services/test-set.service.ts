import { testSetRepository } from '../repositories/test-set.repository';
import { AppError } from '../utils/AppError';

export class TestSetService {
  async getAIConfig(configKey: string, userId: number) {
    return testSetRepository.getAIConfig(configKey, userId);
  }

  async updateAIConfig(configKey: string, userId: number, data: any) {
    return testSetRepository.upsertAIConfig(configKey, userId, data);
  }

  async getMyDocuments(userId: number) {
    return testSetRepository.getUserDocuments(userId);
  }

  async getMyDecks(userId: number) {
    return testSetRepository.getUserDecks(userId);
  }

  async getDeckContent(deckId: string | number, userId: number) {
    const result = await testSetRepository.getDeckContent(deckId, userId);
    if (!result) {
      throw new AppError('Không tìm thấy bộ flashcard hoặc không có quyền truy cập', 403);
    }
    return result;
  }

  async getDocumentContent(docId: string | number, userId: number) {
    const result = await testSetRepository.getDocumentContent(docId, userId);
    if (!result) {
      throw new AppError('Không tìm thấy tài liệu hoặc không có quyền truy cập', 403);
    }
    return result;
  }

  async getTestSets(userId: number) {
    return testSetRepository.getTestSets(userId);
  }

  async toggleStatus(id: string | number, userId: number, isActive: boolean) {
    const result = await testSetRepository.toggleStatus(id, userId, isActive);
    if (!result) {
      throw new AppError('Bộ đề không tồn tại hoặc không có quyền thao tác', 404);
    }
    return result;
  }

  async deleteTestSet(id: string | number, userId: number) {
    const deletedId = await testSetRepository.deleteTestSet(id, userId);
    if (!deletedId) {
      throw new AppError('Bộ đề không tồn tại hoặc không có quyền thao tác', 404);
    }
    return { message: 'Đã xóa bộ đề thành công', id: deletedId };
  }

  async getQuestions(testSetId: string | number, userId: number) {
    return testSetRepository.getQuestionsByTestSetId(testSetId, userId);
  }

  async updateQuestion(id: string | number, data: any) {
    const result = await testSetRepository.updateQuestion(id, data);
    if (!result) {
      throw new AppError('Câu hỏi không tồn tại', 404);
    }
    return result;
  }

  async bulkUpdateQuestions(questions: any[]) {
    const updatedIds = await testSetRepository.bulkUpdateQuestions(questions);
    return { message: `Đã cập nhật ${updatedIds.length} câu hỏi`, updatedIds };
  }
}

export const testSetService = new TestSetService();
