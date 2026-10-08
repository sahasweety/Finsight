/**
 * server/services/aiService.js
 *
 * Wraps the Google Gemini API.
 * The GEMINI_API_KEY lives ONLY in server/.env and is NEVER sent to the client.
 *
 * Public API:
 *   generateFinancialInsights(financialSummary) → Promise<object>
 */

const { GoogleGenAI } = require('@google/genai');

// ── Gemini client (lazy-initialised once) ──────────────────────────────────

let _client = null;

function getClient() {
  if (_client) return _client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured in server/.env');
  }

  _client = new GoogleGenAI({ apiKey });
  return _client;
}

// ── Prompt builder ─────────────────────────────────────────────────────────

/**
 * Builds the prompt sent to Gemini.
 * Only pre-calculated summary data is included — no raw MongoDB documents,
 * no passwords, no JWTs, no connection strings.
 *
 * @param {object} summary - Pre-calculated financial summary (see aiController.js)
 * @returns {string} prompt
 */
function buildPrompt(summary) {
  const {
    totalIncome,
    totalExpenses,
    balance,
    savingsRate,
    transactionCount,
    expenseByCategory,
    monthlyIncome,
    monthlyExpenses,
  } = summary;

  // Format category breakdown as readable text
  const categoryLines = Object.entries(expenseByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => `  - ${cat}: ₹${amt.toFixed(2)}`)
    .join('\n');

  // Format monthly data as readable text
  const months = Object.keys(monthlyIncome).sort();
  const monthlyLines = months
    .map((m) => {
      const inc = monthlyIncome[m] || 0;
      const exp = monthlyExpenses[m] || 0;
      return `  ${m}: Income ₹${inc.toFixed(2)}, Expenses ₹${exp.toFixed(2)}`;
    })
    .join('\n');

  return `You are a professional financial advisor analyzing a user's personal finance data for an app called FinSight (Indian Rupee context).

Below is a pre-calculated financial summary. Do NOT invent any numbers, transactions, or categories that are not present in this data.

=== FINANCIAL SUMMARY ===
Total Income:    ₹${totalIncome.toFixed(2)}
Total Expenses:  ₹${totalExpenses.toFixed(2)}
Net Balance:     ₹${balance.toFixed(2)}
Savings Rate:    ${savingsRate.toFixed(1)}%
Total Transactions: ${transactionCount}

=== EXPENSES BY CATEGORY ===
${categoryLines || '  (no expense categories)'}

=== MONTHLY BREAKDOWN ===
${monthlyLines || '  (insufficient data for monthly breakdown)'}

=== YOUR TASK ===
Based ONLY on the data above, generate a concise and actionable financial insights report.

Rules:
- Do not invent any numbers, categories, or transactions not present above.
- Keep the "summary" under 60 words.
- Provide 3 to 5 insights. Each insight must have:
    * type: one of "positive", "warning", "suggestion", or "trend"
    * title: 4-8 words
    * message: 1-2 sentences, practical and specific
- "topSpendingCategory" must be the category with the highest expense in the data (or "None" if no expenses).
- "savingSuggestion" must be one practical sentence relevant to the data.

Respond with ONLY valid JSON — no markdown, no code fences, no explanation. Use this exact schema:

{
  "summary": "string",
  "insights": [
    {
      "type": "positive | warning | suggestion | trend",
      "title": "string",
      "message": "string"
    }
  ],
  "topSpendingCategory": "string",
  "savingSuggestion": "string"
}`;
}

// ── Response parser ────────────────────────────────────────────────────────

/**
 * Strips any accidental markdown code fences and parses JSON from Gemini's reply.
 * @param {string} text
 * @returns {object}
 */
function parseGeminiResponse(text) {
  // Remove ```json ... ``` or ``` ... ``` wrappers if present
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  return JSON.parse(cleaned);
}

/**
 * Builds the chat prompt sent to Gemini.
 * @param {string} userMessage
 * @param {object} summary
 * @returns {string} prompt
 */
function buildChatPrompt(userMessage, summary) {
  const {
    totalIncome,
    totalExpenses,
    balance,
    savingsRate,
    transactionCount,
    expenseByCategory,
    budgets,
  } = summary;

  const categoryLines = Object.entries(expenseByCategory || {})
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => `  - ${cat}: ₹${amt.toFixed(2)}`)
    .join('\n');

  const budgetLines = (budgets || [])
    .map((b) => `  - ${b.category} (${b.month}/${b.year}): Limit ₹${b.amount.toFixed(2)}`)
    .join('\n');

  return `You are a helpful personal finance assistant for an app called FinSight.
A user has asked a question about their finances. Answer it briefly, accurately, and politely based ONLY on the data provided below. Do not give generic financial advice unless it specifically relates to their data. Do NOT mention that you are an AI or reading from JSON data. Keep it conversational.

=== USER FINANCIAL DATA ===
Total Income:    ₹${totalIncome.toFixed(2)}
Total Expenses:  ₹${totalExpenses.toFixed(2)}
Net Balance:     ₹${balance.toFixed(2)}
Savings Rate:    ${savingsRate.toFixed(1)}%
Total Transactions: ${transactionCount}

=== EXPENSES BY CATEGORY ===
${categoryLines || '  (none)'}

=== BUDGETS ===
${budgetLines || '  (none)'}

=== USER MESSAGE ===
"${userMessage}"

Respond directly to the user's message in plain text. Keep your response under 3-4 sentences. Do NOT use markdown.`;
}

// ── Main export ────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const OPENROUTER_MODEL = 'meta-llama/llama-3-8b-instruct:free';

async function generateFromOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenRouter HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid OpenRouter response structure');
    }

    const rawText = data.choices[0].message.content;
    return parseGeminiResponse(rawText);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function generateChatFromOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenRouter HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid OpenRouter response structure');
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function generateRuleBasedChatResponse() {
  return "I'm sorry, I'm having trouble connecting to my AI brain right now. I can tell you that you've been doing a great job tracking your expenses, though!";
}

function generateRuleBasedInsights(summary) {
  const insights = [];
  const { totalIncome, totalExpenses, balance, savingsRate, expenseByCategory } = summary;

  // Determine top spending category
  let topSpendingCategory = 'None';
  let maxExpense = 0;
  for (const [cat, amt] of Object.entries(expenseByCategory)) {
    if (amt > maxExpense) {
      maxExpense = amt;
      topSpendingCategory = cat;
    }
  }

  // 1. Balance/Income insight
  if (totalExpenses > totalIncome && totalIncome > 0) {
    insights.push({
      type: 'warning',
      title: 'Expenses Exceed Income',
      message: 'Your total expenses are currently higher than your income. Consider reviewing your recent spending.'
    });
  } else if (totalIncome > 0 && balance > 0) {
    insights.push({
      type: 'positive',
      title: 'Healthy Balance',
      message: 'You have a positive net balance. Great job keeping your expenses below your income.'
    });
  }

  // 2. Savings rate insight
  if (savingsRate > 20) {
    insights.push({
      type: 'positive',
      title: 'Strong Savings',
      message: `Your savings rate is ${savingsRate.toFixed(1)}%. Keep up the good work building your safety net.`
    });
  } else if (savingsRate > 0 && savingsRate <= 5) {
    insights.push({
      type: 'warning',
      title: 'Low Savings Rate',
      message: 'Your savings rate is quite low. Small reductions in daily expenses could help.'
    });
  }

  // 3. Top category insight
  if (topSpendingCategory !== 'None') {
    insights.push({
      type: 'suggestion',
      title: 'Top Expense Category',
      message: `A significant portion of your spending goes to ${topSpendingCategory}. Reviewing this category might reveal easy ways to save.`
    });
  }

  // Ensure we always have at least one insight
  if (insights.length === 0) {
    insights.push({
      type: 'suggestion',
      title: 'Track Consistently',
      message: 'Continue tracking your daily expenses to get a clearer picture of your financial habits.'
    });
  }

  let savingSuggestion = 'Track your expenses regularly to identify saving opportunities.';
  if (topSpendingCategory !== 'None') {
    savingSuggestion = `Consider setting a monthly budget for ${topSpendingCategory} to increase your overall savings.`;
  }

  return {
    summary: `Based on your data, your net balance is ₹${balance.toFixed(2)} with a savings rate of ${savingsRate.toFixed(1)}%.`,
    insights: insights.slice(0, 5),
    topSpendingCategory,
    savingSuggestion
  };
}

/**
 * Calls Gemini with the user's pre-calculated financial summary and returns
 * a structured insights object.
 *
 * @param {object} financialSummary - Output of buildFinancialSummary() in aiController
 * @returns {Promise<{summary, insights, topSpendingCategory, savingSuggestion}>}
 */
async function generateFinancialInsights(financialSummary) {
  const client = getClient();
  const prompt = buildPrompt(financialSummary);
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error('Gemini returned an empty response.');
      }

      return parseGeminiResponse(rawText);
    } catch (error) {
      // Check if error is a 503 or UNAVAILABLE
      const status = error.status || (error.response && error.response.status);
      const isRetryable = status === 503 || status === 'UNAVAILABLE' ||
        (error.message && (error.message.includes('503') || error.message.includes('UNAVAILABLE') || error.message.includes('high demand')));

      if (isRetryable && attempt < maxRetries) {
        const delay = attempt === 0 ? 1000 : 2000;
        console.warn(`[aiService] Gemini API unavailable. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }

      console.warn('[AI] Gemini failed, trying OpenRouter fallback');
      try {
        const fallbackResult = await generateFromOpenRouter(prompt);
        console.info('[AI] OpenRouter fallback succeeded');
        return fallbackResult;
      } catch (orError) {
        console.warn('[AI] OpenRouter failed, using deterministic fallback');
        const ruleBasedResult = generateRuleBasedInsights(financialSummary);
        console.info('[AI] Deterministic fallback succeeded');
        return ruleBasedResult;
      }
    }
  }
}



/**
 * Calls Gemini with the user's message and financial summary to return a string response.
 */
async function generateChatResponse(message, financialSummary) {
  const client = getClient();
  const prompt = buildChatPrompt(message, financialSummary);
  const maxRetries = 1;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error('Gemini returned an empty response.');
      }

      return rawText.trim();
    } catch (error) {
      const status = error.status || (error.response && error.response.status);
      const isRetryable = status === 503 || status === 'UNAVAILABLE' ||
        (error.message && (error.message.includes('503') || error.message.includes('UNAVAILABLE') || error.message.includes('high demand')));

      if (isRetryable && attempt < maxRetries) {
        await sleep(1000);
        continue;
      }

      console.warn('[AI] Gemini failed for chat, trying OpenRouter fallback');
      try {
        return await generateChatFromOpenRouter(prompt);
      } catch (orError) {
        console.warn('[AI] OpenRouter failed for chat, using deterministic fallback');
        return generateRuleBasedChatResponse();
      }
    }
  }
}

// ── Image extraction prompt (shared by both providers) ────────────────────

const IMAGE_EXTRACTION_PROMPT = `Extract all financial transactions from this bank statement or receipt image.
Return ONLY a valid JSON array of objects. Do not include markdown code fences, backticks, or explanations.
Each object must have exactly these fields:
- date: "YYYY-MM-DD" format
- type: "income" or "expense"
- amount: positive number (no currency symbols)
- category: A short sensible category string (e.g. "Food", "Shopping", "Salary", "Utilities")
- description: A short description of the transaction

Skip any row where the amount or date cannot be reliably determined.
Output ONLY the JSON array, nothing else.`;

/**
 * OpenRouter vision fallback for image extraction.
 * Uses meta-llama/llama-3.2-11b-vision-instruct:free which natively supports
 * image_url multimodal messages via the OpenAI-compatible API.
 *
 * @param {Buffer} imageBuffer
 * @param {string} mimeType
 * @returns {Promise<Array>}
 */
async function extractTransactionsFromOpenRouterVision(imageBuffer, mimeType) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const base64 = imageBuffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 s for vision

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: dataUrl },
              },
              {
                type: 'text',
                text: IMAGE_EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      console.error('[AI] OpenRouter vision HTTP error:', response.status, bodyText.slice(0, 300));
      throw new Error(`OpenRouter vision HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content;
    if (!rawText) {
      throw new Error('OpenRouter vision returned an empty response.');
    }

    // Strip markdown code fences if present
    const parsed = parseGeminiResponse(rawText);
    if (!Array.isArray(parsed)) {
      throw new Error('OpenRouter vision response is not a valid JSON array.');
    }

    return parsed;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Extracts transactions from an image buffer.
 * Primary provider: Gemini Vision (gemini-3.6-flash).
 * Fallback provider: OpenRouter vision (llama-3.2-11b-vision-instruct:free).
 * If both fail, throws a clear error — no deterministic fallback for image extraction.
 *
 * @param {Buffer} imageBuffer - The raw image data
 * @param {string} mimeType   - MIME type e.g. 'image/jpeg'
 * @returns {Promise<Array>}  - Array of normalised transaction objects
 */
async function extractTransactionsFromImage(imageBuffer, mimeType) {
  // ── 1. Try Gemini Vision ─────────────────────────────────────────────────
  try {
    const client = getClient();

    const response = await client.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        IMAGE_EXTRACTION_PROMPT,
        {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType,
          },
        },
      ],
    });

    const rawText = response.text;
    if (!rawText) throw new Error('Gemini returned an empty response for image extraction.');

    const parsed = parseGeminiResponse(rawText);
    if (!Array.isArray(parsed)) throw new Error('Gemini response is not a valid JSON array.');

    console.info('[AI] Image extraction succeeded via Gemini.');
    return parsed;
  } catch (geminiError) {
    console.warn('[AI] Gemini image extraction failed:', geminiError.message);
    console.warn('[AI] Trying OpenRouter vision fallback...');
  }

  // ── 2. Try OpenRouter Vision ─────────────────────────────────────────────
  try {
    const parsed = await extractTransactionsFromOpenRouterVision(imageBuffer, mimeType);
    console.info('[AI] Image extraction succeeded via OpenRouter vision.');
    return parsed;
  } catch (orError) {
    console.error('[AI] OpenRouter vision fallback failed:', orError.message);
  }

  // ── 3. Both providers failed — throw, do NOT use deterministic fallback ──
  throw new Error(
    'Image extraction is temporarily unavailable. Both AI providers failed to process the image. ' +
    'Please try again shortly or use the CSV import option instead.'
  );
}

module.exports = { generateFinancialInsights, generateChatResponse, extractTransactionsFromImage };
