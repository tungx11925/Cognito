import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
// Trigger nodemon restart with active Groq compound & Gemini 3.6 flash models for AI Chat
