import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { v2 as cloudinary } from 'cloudinary';
import nodemailer from 'nodemailer';
import axios from 'axios';

async function verifyAll() {
  console.log('=== VERIFYING ALL EXTERNAL APIS & SERVICES ===\n');

  // 1. Gemini AI
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
    const t0 = Date.now();
    const res = await model.generateContent('Trả lời bằng 1 từ: Hoàn thành');
    const t1 = Date.now();
    console.log(`✅ [GEMINI AI] Success (${t1 - t0}ms):`, res.response.text().trim());
  } catch (err: any) {
    console.error('❌ [GEMINI AI] Failed:', err.message);
  }

  // 2. Groq AI
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const t0 = Date.now();
    const res = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: 'Ping' }],
      max_tokens: 10,
    });
    const t1 = Date.now();
    console.log(`✅ [GROQ AI] Success (${t1 - t0}ms):`, res.choices[0]?.message?.content?.trim());
  } catch (err: any) {
    console.error('❌ [GROQ AI] Failed:', err.message);
  }

  // 3. Cloudinary
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const ping = await cloudinary.api.ping();
    console.log('✅ [CLOUDINARY] Success:', ping);
  } catch (err: any) {
    console.error('❌ [CLOUDINARY] Failed:', err.message);
  }

  // 4. SerpAPI
  try {
    const serpRes = await axios.get('https://serpapi.com/account', {
      params: { api_key: process.env.SERPAPI_API_KEY },
      timeout: 5000,
    });
    console.log('✅ [SERPAPI] Success: Account plan =', serpRes.data?.plan_id || 'Active');
  } catch (err: any) {
    console.error('❌ [SERPAPI] Failed:', err.message);
  }

  // 5. Gmail SMTP
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    await transporter.verify();
    console.log('✅ [GMAIL SMTP] Success: Connection verified');
  } catch (err: any) {
    console.error('❌ [GMAIL SMTP] Failed:', err.message);
  }
}

verifyAll().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
