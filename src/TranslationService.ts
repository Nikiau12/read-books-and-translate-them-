export async function translateText(text: string, context: string, apiKey: string, baseUrl: string): Promise<string> {
  const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert English to Russian translator for an E-Reader app. You will be provided with a selected text/word, and the paragraph it appears in for context. Your job is to translate the selected text into Russian accurately, considering its context. Provide only the translation, and a brief 1-sentence explanation IN RUSSIAN if it is an idiom or complex phrase. ALL output must be strictly in Russian."
        },
        {
          role: "user",
          content: `Selected text: "${text}"\nContext paragraph: "${context}"`
        }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid API key.');
    }
    throw new Error('Translation failed. Please try again.');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'Translation not found.';
}
