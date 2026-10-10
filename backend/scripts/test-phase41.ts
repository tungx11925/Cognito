import { Pool } from 'pg';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://tu:123@localhost:5432/cognito?schema=public'
});

function assert(condition: any, message: string) {
  if (!condition) {
    console.error(`❌ [ASSERTION FAILED]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✅ [PASS]: ${message}`);
  }
}

async function runPhase41Tests() {
  console.log('\n======================================================');
  console.log('   PHASE 41: FLASHCARD FULLSCREEN, PROMPTS & BATCH API');
  console.log('======================================================\n');

  let passedCount = 0;

  try {
    // 1. Create two test users (User A & User B)
    const ts = String(Date.now()).slice(-6);
    const stamp = ts;
    const userAEmail = `user_a_${ts}@example.com`;
    const userBEmail = `user_b_${ts}@example.com`;
    const password = 'Password123!';

    console.log('[Setup] Registering User A & User B...');
    const regResA = await axios.post(`${BASE_URL}/auth/register`, {
      email: userAEmail,
      password,
      name: `User A Phase41 ${ts}`,
      phone: `0982${ts}`
    });
    const tokenA = regResA.data.token || regResA.data.accessToken;
    const userIdA = regResA.data.user.id;

    const regResB = await axios.post(`${BASE_URL}/auth/register`, {
      email: userBEmail,
      password,
      name: `User B Phase41 ${ts}`,
      phone: `0983${ts}`
    });
    const tokenB = regResB.data.token || regResB.data.accessToken;
    const userIdB = regResB.data.user.id;

    assert(tokenA && tokenB, 'User A and User B registered successfully with tokens');
    passedCount++;

    const clientA = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    const clientB = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${tokenB}` }
    });

    // 2. Batch create deck with cards (B1 & B2)
    console.log('\n[Suite 1] Batch Create Deck with Cards & Metadata...');
    const createDeckRes = await clientA.post('/flashcards/decks', {
      name: `Bộ thẻ Phase 41 - ${stamp}`,
      description: 'Học phần kiểm thử chức năng batch create và phóng to',
      category: 'Công nghệ thông tin',
      visibility: 'public',
      cards: [
        {
          front: 'Frontend Architecture',
          back: 'Kiến trúc giao diện người dùng tối ưu trải nghiệm',
          position: 1,
          term_image_url: 'https://example.com/front1.png',
          definition_image_url: 'https://example.com/back1.png'
        },
        {
          front: 'State Management',
          back: 'Quản lý trạng thái ứng dụng đồng bộ',
          position: 2
        },
        {
          front: 'SuperMemo SM-2',
          back: 'Thuật toán lặp lại ngắt quãng tối ưu hóa ghi nhớ',
          position: 3
        }
      ]
    });

    assert(createDeckRes.status === 201, 'HTTP 201 Created on batch deck creation');
    const createdDeck = createDeckRes.data;
    const createdCards = createDeckRes.data.cards;
    assert(createdDeck && createdDeck.id, 'Deck object returned with valid ID');
    assert(createdCards && createdCards.length === 3, 'Created exactly 3 flashcards in transaction');
    assert(createdCards[0].term_image_url === 'https://example.com/front1.png', 'Card 1 image url saved correctly');
    passedCount += 4;

    const deckId = createdDeck.id;
    const cardId1 = createdCards[0].id;
    const cardId2 = createdCards[1].id;
    const cardId3 = createdCards[2].id;

    // 3. Study Settings API (A4)
    console.log('\n[Suite 2] Study Settings Persistence & Defaults...');
    const settingsGetRes = await clientA.get(`/flashcards/decks/${deckId}/settings`);
    assert(settingsGetRes.status === 200, 'HTTP 200 on get study settings');
    const defaultSettings = settingsGetRes.data.settings || settingsGetRes.data;
    assert(defaultSettings.front_display === 'term', 'Default front_display is "term"');
    assert(defaultSettings.shuffle_cards === false, 'Default shuffle_cards is false');
    passedCount += 3;

    const settingsUpdateRes = await clientA.put(`/flashcards/decks/${deckId}/settings`, {
      shuffle_cards: true,
      front_display: 'definition',
      starred_only: true,
      difficult_only: true,
      auto_tts: true
    });
    assert(settingsUpdateRes.status === 200, 'HTTP 200 on update study settings');
    const updatedSettings = settingsUpdateRes.data.settings || settingsUpdateRes.data;
    assert(updatedSettings.front_display === 'definition', 'Updated front_display to "definition"');
    assert(updatedSettings.starred_only === true, 'Updated starred_only to true');
    assert(updatedSettings.auto_tts === true, 'Updated auto_tts to true');
    passedCount += 4;

    // 4. Star Card API (A5)
    console.log('\n[Suite 3] Flashcard Starring Toggle...');
    const starRes1 = await clientA.put(`/flashcards/${cardId1}/star`, { is_starred: true });
    assert(starRes1.status === 200, 'HTTP 200 on star flashcard');
    const cardStar1 = starRes1.data.card || starRes1.data;
    assert(cardStar1.is_starred === true, 'Card 1 is marked as starred');
    passedCount += 2;

    const starRes2 = await clientA.put(`/flashcards/${cardId1}/star`, { is_starred: false });
    const cardStar2 = starRes2.data.card || starRes2.data;
    assert(cardStar2.is_starred === false, 'Card 1 unstarred successfully');
    passedCount++;

    // 5. Review card with SM-2 (A8)
    console.log('\n[Suite 4] SM-2 Review Progress Recording...');
    const reviewRes = await clientA.post(`/flashcards/review/${cardId1}`, { difficulty: 'easy' });
    assert(reviewRes.status === 200, 'HTTP 200 on card review');
    assert(reviewRes.data.updated_streak !== undefined, 'Streak updated on review');
    const allCards1 = (await clientA.get(`/flashcards/decks/${deckId}/cards`)).data;
    const cardsList1 = Array.isArray(allCards1) ? allCards1 : allCards1.cards;
    const cardAfterReview = cardsList1.find((c: any) => c.id === cardId1);
    assert(cardAfterReview.repetitions === 1, 'Card repetitions incremented to 1');
    assert(cardAfterReview.interval_days >= 1, 'Card interval calculated');
    passedCount += 4;

    // 6. Update deck with batch preserving SM-2 (B6)
    console.log('\n[Suite 5] Update Deck Preserving Existing SM-2 Progress...');
    const updateDeckRes = await clientA.put(`/flashcards/decks/${deckId}`, {
      name: `Bộ thẻ Phase 41 Đã Sửa - ${stamp}`,
      description: 'Mô tả mới đã được sửa đổi',
      category: 'Kỹ thuật phần mềm',
      visibility: 'link',
      cards: [
        {
          id: cardId1,
          front: 'Frontend Architecture (Updated)',
          back: 'Kiến trúc giao diện người dùng tối ưu hóa hiệu năng cao',
          position: 1
        },
        {
          front: 'New Card 4',
          back: 'Thẻ mới được bổ sung vào học phần',
          position: 2
        }
      ]
    });

    assert(updateDeckRes.status === 200, 'HTTP 200 on batch deck update');
    const allCards2 = (await clientA.get(`/flashcards/decks/${deckId}/cards`)).data;
    const cardsAfterUpdate = Array.isArray(allCards2) ? allCards2 : allCards2.cards;
    console.log('DEBUG cardsAfterUpdate count:', cardsAfterUpdate.length, 'cards:', cardsAfterUpdate);
    assert(cardsAfterUpdate.length === 2, 'Deck now has 2 cards (card 2 & 3 deleted, card 4 added)');
    const preservedCard1 = cardsAfterUpdate.find((c: any) => c.id === cardId1);
    assert(preservedCard1.repetitions === 1, 'Card 1 SM-2 repetitions preserved across edit (did not reset to 0)');
    assert(preservedCard1.front === 'Frontend Architecture (Updated)', 'Card 1 front text updated');
    passedCount += 4;

    // 7. Security & Ownership Check (403 for other user, B6 & D)
    console.log('\n[Suite 6] Ownership Control & Unauthorized Access Rejection...');
    let unauthorizedFailed = false;
    try {
      await clientB.put(`/flashcards/decks/${deckId}`, {
        name: 'Hacked Deck Name',
        cards: []
      });
    } catch (err: any) {
      unauthorizedFailed = true;
      assert(err.response?.status === 403, 'User B receives HTTP 403 Forbidden when trying to edit User A deck');
    }
    assert(unauthorizedFailed, 'User B was prevented from modifying User A deck');
    passedCount += 2;

    // 8. AI Prompt Templates API (C3)
    console.log('\n[Suite 7] AI Prompt Templates (System & Custom)...');
    const templatesRes = await clientA.get('/ai/prompts/templates');
    assert(templatesRes.status === 200, 'HTTP 200 on get prompt templates');
    const templates = Array.isArray(templatesRes.data) ? templatesRes.data : templatesRes.data.templates;
    assert(templates.length >= 5, 'Found at least 5 default system templates (Tóm tắt, Giải thích, Dịch, etc.)');
    passedCount += 2;

    const createTemplateRes = await clientA.post('/ai/prompts/templates', {
      title: 'Mẫu kiểm tra code',
      prompt_text: 'Hãy giải thích đoạn mã sau từng bước với ví dụ minh họa chi tiết.',
      category: 'Lập trình'
    });
    assert(createTemplateRes.status === 201, 'HTTP 201 Created custom user prompt template');
    const createdTemplate = createTemplateRes.data.template || createTemplateRes.data;
    const createdTemplateId = createdTemplate.id;
    passedCount++;

    // 9. AI Prompt History API (C2)
    console.log('\n[Suite 8] AI Prompt History Tracking & Pinning...');
    const addHistoryRes = await clientA.post('/ai/prompts/history', {
      document_id: null,
      prompt_text: 'Dịch đoạn này sang tiếng Việt chuẩn học thuật',
      context_mode: 'DOCUMENT_CONTEXT',
      scope: 'entire'
    });
    assert(addHistoryRes.status === 201, 'HTTP 201 on recording prompt history');
    const historyItem = addHistoryRes.data.history || addHistoryRes.data;
    const historyId = historyItem.id;
    passedCount++;

    const pinHistoryRes = await clientA.put(`/ai/prompts/history/${historyId}/pin`, {
      is_pinned: true
    });
    assert(pinHistoryRes.status === 200, 'HTTP 200 on pin prompt history');
    const pinnedItem = pinHistoryRes.data.history || pinHistoryRes.data;
    assert(pinnedItem.is_pinned === true, 'History item marked as pinned');
    passedCount += 2;

    const getHistoryRes = await clientA.get('/ai/prompts/history');
    assert(getHistoryRes.status === 200, 'HTTP 200 on list prompt history');
    const historyList = Array.isArray(getHistoryRes.data) ? getHistoryRes.data : getHistoryRes.data.history;
    assert(historyList.some((h: any) => h.id === historyId && h.is_pinned), 'Pinned history item returned in list');
    passedCount += 2;

    // Cleanup template & deck
    await clientA.delete(`/ai/prompts/templates/${createdTemplateId}`);
    await clientA.delete(`/flashcards/decks/${deckId}`);

    console.log('\n======================================================');
    console.log(`🎉 ALL PHASE 41 BACKEND TESTS PASSED (${passedCount} assertions)!`);
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('Phase 41 test execution failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runPhase41Tests();
