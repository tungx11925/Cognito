import { activityRepository } from '../repositories/activity.repository';
import { getVietnamDateString } from '../utils/date.util';
import { sseService } from '../utils/sse.service';
import { streakService } from './streak.service';

class ActivityService {
  async updateUserStreak(userId: number) {
    try {
      const streakInfo = await streakService.calculateUserStreak(userId);
      // Đồng bộ vào users.streak để duy trì tương thích ngược cho các query cũ
      await activityRepository.updateStreak(userId, streakInfo.currentStreak);
      return streakInfo.currentStreak;
    } catch (error) {
      console.error('Error in updateUserStreak:', error);
      return 0;
    }
  }

  async getOrCreateDailyTasks(userId: number) {
    try {
      const todayStr = getVietnamDateString(new Date());
      const existingTasks = await activityRepository.getDailyTasks(userId, todayStr);
      
      if (existingTasks.length > 0) {
        return existingTasks;
      }
      
      const defaultTasks = [
        {
          type: 'study_flashcards',
          title: 'Ôn tập Flashcards',
          description: 'Luyện tập ôn tập ít nhất 5 thẻ ghi nhớ trong ngày hôm nay.',
          target: 5
        },
        {
          type: 'read_document',
          title: 'Đọc tài liệu',
          description: 'Mở xem hoặc tải lên đọc ít nhất 1 tài liệu học tập.',
          target: 1
        },
        {
          type: 'practice_quiz',
          title: 'Luyện tập AI Quiz',
          description: 'Hoàn thành ít nhất 1 bộ trắc nghiệm tạo bởi AI trợ lý.',
          target: 1
        },
        {
          type: 'study_time',
          title: 'Thời gian học tập',
          description: 'Tích lũy tối thiểu 5 phút hoạt động học tập trên hệ thống.',
          target: 300
        }
      ];
      
      const insertedTasks = [];
      for (const task of defaultTasks) {
        try {
          const inserted = await activityRepository.createDailyTask(userId, todayStr, task);
          if (inserted) {
            insertedTasks.push(inserted);
          }
        } catch (err) {
          console.error('Error inserting default task:', err);
        }
      }
      
      if (insertedTasks.length === 0) {
        return await activityRepository.getDailyTasks(userId, todayStr);
      }
      
      return insertedTasks;
    } catch (error) {
      console.error('Error in getOrCreateDailyTasks:', error);
      return [];
    }
  }

  async incrementTaskProgress(userId: number, taskType: string, incrementValue: number) {
    try {
      const todayStr = getVietnamDateString(new Date());
      await this.getOrCreateDailyTasks(userId);
      
      const task = await activityRepository.incrementTaskProgress(userId, todayStr, taskType, incrementValue);
      
      if (task) {
        if (task.current_value >= task.target_value && !task.completed) {
          const completedTask = await activityRepository.markTaskCompleted(task.id);

          // Broadcast real-time SSE event to all connected sessions of this user
          sseService.sendToUser(userId, 'TASK_COMPLETED', {
            task: completedTask,
            taskType,
            title: completedTask.title,
            description: completedTask.description,
            rewardXP: 50,
            timestamp: new Date().toISOString()
          });

          return { task: completedTask, justCompleted: true };
        }

        // Broadcast progress update event
        sseService.sendToUser(userId, 'TASK_PROGRESS', {
          task,
          taskType,
          currentValue: task.current_value,
          targetValue: task.target_value,
          title: task.title,
          description: task.description,
          timestamp: new Date().toISOString()
        });

        return { task, justCompleted: false };
      }
    } catch (error) {
      console.error('Error in incrementTaskProgress:', error);
    }
    return null;
  }
}

export const activityService = new ActivityService();
