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
          content: `You are an expert English-to-Russian translator for an E-Reader app.
You will receive 'Selected text' and 'Context paragraph'.
Your task:
1. Provide a highly accurate, natural Russian translation for the ENTIRE 'Selected text'. Do not skip any part of it.
2. Identify any complex forms, idioms, phrasal verbs, or difficult vocabulary within the 'Selected text'.
3. For each identified item, provide a bulleted list breaking it down.

Format your output EXACTLY like this (use Markdown for bold):
**Перевод:**
[Full translation of the selected text]

**Разбор слов:** (omit if the text is just a simple word)
• **[English word/phrase]** — [Russian translation] (Краткое объяснение в контексте)
• ...`
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
