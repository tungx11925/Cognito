import { db } from '../db';

interface Slot {
  date: string;
  time: string;
}

const USER_SLOTS: Slot[] = [
  // Tuần trước nữa (Bắt đầu từ Thứ 5, Thứ 6)
  { date: '2026-10-08', time: '09:14:22' }, // T5: 1
  { date: '2026-10-08', time: '15:42:10' }, // T5: 2
  { date: '2026-10-09', time: '10:20:45' }, // T6: 3
  { date: '2026-10-09', time: '16:35:12' }, // T6: 4
  { date: '2026-10-09', time: '20:15:30' }, // T6: 5
  // Thứ 7 (10/10) nghỉ (0 user)
  // Chủ nhật (11/10) nghỉ (1 user vào buổi tối)
  { date: '2026-10-11', time: '21:05:18' }, // CN: 6

  // Tuần 2
  { date: '2026-10-12', time: '08:30:15' }, // T2: 7
  { date: '2026-10-12', time: '14:12:44' }, // T2: 8
  { date: '2026-10-12', time: '19:45:02' }, // T2: 9
  { date: '2026-10-13', time: '09:15:33' }, // T3: 10
  { date: '2026-10-13', time: '11:22:50' }, // T3: 11
  { date: '2026-10-13', time: '15:48:19' }, // T3: 12
  { date: '2026-10-13', time: '21:10:05' }, // T3: 13

  // 🔥 NGÀY TĂNG VỌT 1: Thứ 4 (14/10) - 10 người dùng
  { date: '2026-10-14', time: '08:22:11' }, // T4: 14
  { date: '2026-10-14', time: '09:10:45' }, // T4: 15
  { date: '2026-10-14', time: '10:05:32' }, // T4: 16
  { date: '2026-10-14', time: '11:30:19' }, // T4: 17
  { date: '2026-10-14', time: '13:45:00' }, // T4: 18
  { date: '2026-10-14', time: '14:50:23' }, // T4: 19
  { date: '2026-10-14', time: '16:15:40' }, // T4: 20
  { date: '2026-10-14', time: '19:20:15' }, // T4: 21
  { date: '2026-10-14', time: '20:42:55' }, // T4: 22
  { date: '2026-10-14', time: '22:15:10' }, // T4: 23

  // 🔥 NGÀY TĂNG VỌT 2: Thứ 5 (15/10) - 11 người dùng
  { date: '2026-10-15', time: '07:50:33' }, // T5: 24
  { date: '2026-10-15', time: '08:45:12' }, // T5: 25
  { date: '2026-10-15', time: '09:30:20' }, // T5: 26
  { date: '2026-10-15', time: '10:15:45' }, // T5: 27
  { date: '2026-10-15', time: '11:40:02' }, // T5: 28
  { date: '2026-10-15', time: '13:10:55' }, // T5: 29
  { date: '2026-10-15', time: '14:25:30' }, // T5: 30
  { date: '2026-10-15', time: '15:52:18' }, // T5: 31
  { date: '2026-10-15', time: '17:05:40' }, // T5: 32
  { date: '2026-10-15', time: '19:35:10' }, // T5: 33
  { date: '2026-10-15', time: '21:02:44' }, // T5: 34

  // Thứ 6 (16/10) - 5 người dùng
  { date: '2026-10-16', time: '08:40:12' }, // T6: 35
  { date: '2026-10-16', time: '10:15:35' }, // T6: 36
  { date: '2026-10-16', time: '14:32:00' }, // T6: 37
  { date: '2026-10-16', time: '16:50:42' }, // T6: 38
  { date: '2026-10-16', time: '20:10:19' }, // T6: 39

  // Thứ 7 (17/10) nghỉ (0 user)
  // Chủ nhật (18/10) nghỉ (1 user)
  { date: '2026-10-18', time: '21:40:22' }, // CN: 40

  // Tuần 3 (Hôm nay - Thứ 2 19/10/2026) - 5-6 người dùng
  { date: '2026-10-19', time: '08:15:30' }, // T2: 41
  { date: '2026-10-19', time: '09:50:12' }, // T2: 42
  { date: '2026-10-19', time: '11:25:40' }, // T2: 43
  { date: '2026-10-19', time: '14:10:55' }, // T2: 44
  { date: '2026-10-19', time: '16:35:20' }, // T2: 45
  { date: '2026-10-19', time: '17:20:15' }, // T2: 46
  { date: '2026-10-19', time: '18:05:00' }, // T2: 47

  // Tuần 4 (20/10 - 25/10)
  { date: '2026-10-20', time: '08:42:17' }, // T3: 48
  { date: '2026-10-20', time: '13:27:05' }, // T3: 49
  { date: '2026-10-20', time: '20:51:38' }, // T3: 50
  { date: '2026-10-21', time: '09:03:44' }, // T4: 51
  { date: '2026-10-21', time: '11:48:21' }, // T4: 52
  { date: '2026-10-21', time: '15:16:09' }, // T4: 53
  { date: '2026-10-21', time: '21:34:52' }, // T4: 54
  { date: '2026-10-22', time: '07:58:13' }, // T5: 55
  { date: '2026-10-22', time: '10:37:46' }, // T5: 56
  { date: '2026-10-22', time: '16:22:30' }, // T5: 57
  { date: '2026-10-22', time: '19:09:57' }, // T5: 58
  { date: '2026-10-23', time: '09:26:08' }, // T6: 59
  { date: '2026-10-23', time: '14:44:35' }, // T6: 60
  { date: '2026-10-23', time: '20:18:41' }, // T6: 61
  { date: '2026-10-24', time: '15:12:26' }, // T7: 62
  { date: '2026-10-25', time: '20:47:03' }, // CN: 63

  // Tuần 5 (26/10 - 31/10)
  { date: '2026-10-26', time: '08:19:54' }, // T2: 64
  { date: '2026-10-26', time: '10:52:12' }, // T2: 65
  { date: '2026-10-26', time: '14:05:39' }, // T2: 66
  { date: '2026-10-26', time: '21:23:16' }, // T2: 67
  { date: '2026-10-27', time: '07:47:28' }, // T3: 68
  { date: '2026-10-27', time: '09:33:50' }, // T3: 69
  { date: '2026-10-27', time: '13:58:04' }, // T3: 70
  { date: '2026-10-27', time: '16:41:47' }, // T3: 71
  { date: '2026-10-27', time: '20:12:19' }, // T3: 72
  { date: '2026-10-28', time: '08:56:33' }, // T4: 73
  { date: '2026-10-28', time: '11:14:58' }, // T4: 74
  { date: '2026-10-28', time: '15:37:21' }, // T4: 75
  { date: '2026-10-28', time: '19:48:06' }, // T4: 76
  { date: '2026-10-29', time: '09:21:42' }, // T5: 77
  { date: '2026-10-29', time: '12:39:15' }, // T5: 78
  { date: '2026-10-29', time: '17:03:27' }, // T5: 79
  { date: '2026-10-29', time: '21:56:49' }, // T5: 80
  { date: '2026-10-30', time: '08:34:11' }, // T6: 81
  { date: '2026-10-30', time: '14:27:36' }, // T6: 82
  { date: '2026-10-30', time: '20:05:58' }, // T6: 83
  { date: '2026-10-31', time: '10:46:24' }, // T7: 84
  { date: '2026-10-31', time: '16:31:07' }, // T7: 85
];

const GUEST_FEEDBACK_TIMESTAMPS = [
  '2026-10-09T17:15:00+07:00',
  '2026-10-12T16:30:20+07:00',
  '2026-10-14T15:40:10+07:00',
  '2026-10-15T18:22:45+07:00',
  '2026-10-16T11:20:30+07:00',
  '2026-10-19T14:45:10+07:00'
];

export async function applyBackdatedTimeline() {
  console.log('[Backdate] Bắt đầu đồng bộ hóa ngày tạo người dùng và đánh giá...');

  // 1. Lấy toàn bộ người dùng (trừ admin) xếp theo id tăng dần
  const usersRes = await db.query(
    `SELECT id, email, created_at FROM users WHERE email != 'admin' ORDER BY id ASC`
  );
  const users = usersRes.rows;

  const userDateMap = new Map<number, Date>();
  const timelineSummary: Record<string, number> = {};

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const slot = USER_SLOTS[i] || USER_SLOTS[USER_SLOTS.length - 1];
    const dateStr = `${slot.date}T${slot.time}+07:00`;
    const newCreatedAt = new Date(dateStr);

    await db.query(`UPDATE users SET created_at = $1 WHERE id = $2`, [newCreatedAt, user.id]);
    userDateMap.set(user.id, newCreatedAt);

    timelineSummary[slot.date] = (timelineSummary[slot.date] || 0) + 1;
  }

  // 2. Lấy toàn bộ phản hồi
  const feedbacksRes = await db.query(
    `SELECT id, user_id, rating, created_at FROM user_feedbacks ORDER BY id ASC`
  );
  const feedbacks = feedbacksRes.rows;

  let guestIdx = 0;
  let feedbacksUpdated = 0;

  for (const fb of feedbacks) {
    let fbDate: Date;

    if (fb.user_id && userDateMap.has(fb.user_id)) {
      const uDate = userDateMap.get(fb.user_id)!;
      // Độ trễ từ khi đăng ký đến khi gửi đánh giá: từ 2 đến 16 giờ
      const delayMs = (2 + (fb.id % 14)) * 3600 * 1000 + (fb.id * 17 % 60) * 60 * 1000;
      let calculatedDate = new Date(uDate.getTime() + delayMs);

      // Nếu rơi vào Thứ 7 hoặc Chủ Nhật -> chuyển sang sáng Thứ 2 (học sinh đi học lại)
      const dayOfWeek = calculatedDate.getDay(); // 0: CN, 6: T7
      if (dayOfWeek === 6) {
        calculatedDate = new Date(calculatedDate.getTime() + 48 * 3600 * 1000); // sang T2
      } else if (dayOfWeek === 0) {
        calculatedDate = new Date(calculatedDate.getTime() + 24 * 3600 * 1000); // sang T2
      }

      // Giới hạn không vượt quá mốc user cuối cùng của timeline (31/10/2026 22:00:00+07:00)
      const maxDate = new Date('2026-10-31T22:00:00+07:00');
      if (calculatedDate > maxDate) {
        calculatedDate = new Date(maxDate.getTime() - (fb.id % 90) * 60 * 1000);
      }

      fbDate = calculatedDate;
    } else {
      // Đánh giá khách (vãng lai không đăng nhập)
      const guestTime = GUEST_FEEDBACK_TIMESTAMPS[guestIdx % GUEST_FEEDBACK_TIMESTAMPS.length];
      guestIdx++;
      fbDate = new Date(guestTime);
    }

    await db.query(`UPDATE user_feedbacks SET created_at = $1 WHERE id = $2`, [fbDate, fb.id]);
    feedbacksUpdated++;
  }

  console.log(`[Backdate] Đã cập nhật ${users.length} người dùng và ${feedbacksUpdated} đánh giá thành công.`);
  return {
    success: true,
    usersUpdated: users.length,
    feedbacksUpdated,
    timelineSummary,
  };
}
