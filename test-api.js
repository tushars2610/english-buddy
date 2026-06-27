require('dotenv').config({ path: '.env.local' });
const apiKey = process.env.GEMINI_API_KEY;

async function test() {
  const prompt = `You are an expert English language evaluator.
Return ONLY valid JSON: {"test": "ok"}`;

  // Let's pass a very small 1-byte dummy audio to simulate the inline_data
  const dummyAudio = Buffer.from([0]).toString('base64');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: 'audio/webm',
                  data: dummyAudio,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
