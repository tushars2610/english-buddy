import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const transcript = formData.get('transcript') as string || '';
    const conversationContext = formData.get('context') as string || '';

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Convert audio to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = audioFile.type || 'audio/webm';

    const prompt = `You are an expert English language evaluator for children aged 5-14. 
Analyze this audio recording of a child speaking English${conversationContext ? ` in the context of: "${conversationContext}"` : ''}.
${transcript ? `Transcript/Context: "${transcript}"` : ''}

Evaluate the child's English speaking on these dimensions and respond with ONLY valid JSON (no markdown, no backticks):

{
  "overallScore": <0-100>,
  "pronunciationScore": <0-100>,
  "fluencyScore": <0-100>,
  "vocabularyScore": <0-100>,
  "grammarScore": <0-100>,
  "confidenceScore": <0-100>,
  "rating": "<one of: Excellent|Good|Keep Practicing|Great Start>",
  "message": "<2-3 warm, encouraging sentences summarizing performance, child-friendly tone>",
  "encouragement": "<one short motivational sentence with an emoji>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<tip 1>", "<tip 2>"],
  "wordDetails": [
    {"word": "<notable word or phrase>", "score": <0-100>, "feedback": "<brief positive or corrective note>"}
  ]
}

Rating guide: 85-100=Excellent, 70-84=Good, 50-69=Keep Practicing, 0-49=Great Start
Be encouraging, positive, and age-appropriate. Focus on building confidence.
Return ONLY the JSON object with no surrounding text.`;

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
                    mime_type: mimeType,
                    data: base64Audio,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to analyze audio', details: errorData },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('Gemini API response data:', JSON.stringify(data, null, 2));
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Clean and parse JSON response
    const cleanText = rawText.replace(/```json|```/g, '').trim();
    let analysisResult;
    try {
      analysisResult = JSON.parse(cleanText);
    } catch {
      // Attempt to extract JSON from response
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse analysis response');
      }
    }

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: String(error) },
      { status: 500 }
    );
  }
}
