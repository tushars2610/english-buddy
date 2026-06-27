export interface AnalysisResult {
  overallScore: number;
  pronunciationScore: number;
  fluencyScore: number;
  vocabularyScore: number;
  grammarScore: number;
  confidenceScore: number;
  rating: 'Excellent' | 'Good' | 'Keep Practicing' | 'Great Start';
  message: string;
  encouragement: string;
  strengths: string[];
  improvements: string[];
  wordDetails: WordDetail[];
}

export interface WordDetail {
  word: string;
  score: number;
  feedback: string;
}

export interface ConversationTurn {
  role: 'ai' | 'user';
  text: string;
  audioBlob?: Blob;
  timestamp: number;
}

export interface ConversationSession {
  turns: ConversationTurn[];
  topic: string;
  startTime: number;
  analysisResult?: AnalysisResult;
}
