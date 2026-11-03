# ⭐ SpeakStar – English Learning for Kids

A beautiful, interactive English learning platform for children aged 9–14, powered by Google Gemini AI.

## Features

### 🎤 AI Conversation Mode
- Real-time voice conversation with a friendly AI English tutor
- Uses **Gemini 2.5 Flash Native Audio** via WebSocket for natural, fluid dialogue
- Choose from 6 fun conversation topics (pets, hobbies, school, food, dreams, places)
- AI asks questions one at a time, waits for the child's response
- After 4 exchanges, the full conversation is analysed

### 📁 Upload & Analyse Mode
- Upload any audio file (MP3, WAV, OGG, WebM, M4A — up to 25MB)
- Preview the audio before submitting
- Optional context field to tell the AI what topic you spoke about
- Full analysis with animated progress indicator

### 📊 Analysis Results
- **Overall score** with large animated display
- **5 dimension scores** with animated ring charts:
  - Pronunciation
  - Fluency
  - Vocabulary
  - Grammar
  - Confidence
- **Radar chart** (skill web) and **bar chart** (score breakdown)
- Personalised strengths and improvement tips
- Word-by-word feedback chips (hover for detail)
- Encouraging, child-friendly messaging

## Setup

### 1. Clone & Install
```bash
git clone <repo>
cd english-tutor
npm install
```

### 2. Configure API Key
Copy the example env file and add your Gemini API key:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
GEMINI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

Get a free API key at: https://aistudio.google.com/app/apikey

> **Note:** Both keys can be the same value. `GEMINI_API_KEY` is used server-side for analysis; `GEMINI_API_KEY` is used client-side for the live voice WebSocket.

### 3. Run
```bash
npm run dev
```

Open http://localhost:3000

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Custom CSS |
| Voice AI | Gemini 2.5 Flash Native Audio (WebSocket) |
| Analysis AI | Gemini 2.0 Flash (multimodal audio) |
| Charts | Recharts |
| Icons | Lucide React |

## API Routes

### `POST /api/analyze-audio`
Accepts a `multipart/form-data` body:
- `audio` — audio file (any common format)
- `transcript` — optional conversation transcript for context
- `context` — optional topic description

Returns a JSON `AnalysisResult` object with scores and feedback.

## Architecture

```
src/
├── app/
│   ├── api/
│   │   └── analyze-audio/route.ts   # Gemini audio analysis endpoint
│   ├── components/
│   │   ├── ChatMode.tsx             # Live voice conversation UI
│   │   ├── UploadMode.tsx           # File upload & analysis UI
│   │   ├── ResultsPanel.tsx         # Score display with charts
│   │   ├── WaveVisualizer.tsx       # Animated audio waveform (Canvas)
│   │   └── ScoreRing.tsx            # Animated SVG score rings
│   ├── globals.css                  # Design system & animations
│   ├── layout.tsx                   # Root layout with background orbs
│   └── page.tsx                     # Main page with tab navigation
└── types/
    └── index.ts                     # TypeScript interfaces
```

## Design System

- **Background:** `#0B1120` (deep space blue)
- **Accent 1:** `#FF6B6B` (coral-pink) — primary actions, recording
- **Accent 2:** `#4ECDC4` (mint) — AI tutor, strengths
- **Accent 3:** `#FFE66D` (gold) — encouragement, highlights
- **Accent 4:** `#A78BFA` (purple) — processing, radar chart
- **Font:** Nunito (rounded, friendly, great for kids)
