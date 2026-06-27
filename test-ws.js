const WebSocket = require('ws');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const model = 'models/gemini-2.5-flash-native-audio-latest';
const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('Connected');
  const setupMsg = {
    setup: {
      model,
      generation_config: {
        response_modalities: ['AUDIO', 'TEXT'],
        speech_config: {
          voice_config: {
            prebuilt_voice_config: {
              voice_name: 'Aoede',
            },
          },
        },
      },
      system_instruction: {
        parts: [
          {
            text: `You are a friendly tutor.`,
          },
        ],
      },
    },
  };
  ws.send(JSON.stringify(setupMsg));
});

ws.on('message', (data) => {
  console.log('Received:', data.toString());
});

ws.on('error', (err) => {
  console.error('Error:', err);
});

ws.on('close', (code, reason) => {
  console.log('Closed:', code, reason.toString());
});
