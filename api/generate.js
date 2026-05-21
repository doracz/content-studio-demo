// Vercel serverless function: proxy to the Claude API
// This keeps the API key secret (it's stored as a Vercel environment variable)
// and handles CORS so the browser can call this endpoint.

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { content, task, extra_context } = req.body;

  if (!content || !task) {
    return res.status(400).json({ error: 'Missing content or task' });
  }

  const validTasks = ['repurpose', 'simplify', 'optimise', 'match_voice', 'find_angles'];
  if (!validTasks.includes(task)) {
    return res.status(400).json({ error: 'Invalid task' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(content, task, extra_context);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return res.status(response.status).json({ error: 'Anthropic API error', details: errorText });
    }

    const data = await response.json();
    const responseText = data.content[0].text;

    // Parse out the thinking block and JSON output
    const parsed = parseResponse(responseText);

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
}

function buildSystemPrompt() {
  return `You are Content Studio, an AI assistant for content professionals working across editorial, marketing, and brand communications. You help with five specific tasks. The user selects which one they need; you produce structured output tailored to that task.

Always think before you write. Inside a <thinking> block, briefly reason about:
- What the user is actually trying to achieve
- What the source material gives you to work with
- Where the content is weakest and where it's strongest
- What format and tone the output requires

Then produce structured JSON output matching the schema for the selected task. Wrap the JSON in <output> tags.

YOUR FIVE TASKS:

1. REPURPOSE — Take long-form content and break it into multi-channel assets.
2. SIMPLIFY — Take technical or complex content and make it accessible to a target audience.
3. OPTIMISE — Improve existing content for SEO and AEO (AI search visibility).
4. MATCH VOICE — Rewrite content to fit a specified brand voice.
5. FIND ANGLES — Identify 3-5 distinct narrative angles in source material.

CRITICAL PRINCIPLES:

- Be honest about confidence. If the source material is too thin to do the task well, use the "unknowns" field to flag what's missing rather than fabricating.
- Don't invent facts, statistics, or quotes. If the source doesn't include them, don't add them.
- For regulated industries (finance, healthcare, insurance, legal): flag any claims that may require compliance review. Do not produce claims that imply guarantees, medical advice, or financial returns without explicit substantiation in the source.
- Maintain the source's accuracy. Adaptation means changing form, length, and tone, not changing meaning.
- If asked to do something outside these five tasks, decline politely in the JSON output and suggest which task might be closest.

OUTPUT SCHEMAS:

For REPURPOSE:
{
  "task": "repurpose",
  "source_summary": "1-2 sentence summary of the source content",
  "key_insights": ["3-5 key insights extracted from source"],
  "atomised_assets": [
    {
      "channel": "LinkedIn",
      "format": "Long post",
      "title": "Headline",
      "content": "Full text",
      "hook": "Opening line designed to stop the scroll",
      "cta": "Suggested call to action"
    },
    {
      "channel": "Email newsletter",
      "format": "Newsletter section",
      "title": "Subject line",
      "content": "Newsletter body",
      "subject_line_suggestion": "Suggested subject"
    },
    {
      "channel": "Twitter/X thread",
      "format": "5-7 tweet thread",
      "content": "Full thread with each tweet separated by [TWEET]"
    },
    {
      "channel": "Web summary",
      "format": "Meta and summary card",
      "meta_description": "155 char SEO meta",
      "summary": "Web teaser"
    }
  ],
  "unknowns": ["Things the agent couldn't determine from input"]
}

For SIMPLIFY:
{
  "task": "simplify",
  "target_audience": "Audience the user specified or inferred",
  "complexity_assessment": "How dense/jargon-heavy the source is",
  "jargon_flagged": ["Technical terms identified that need explanation or removal"],
  "accessible_version": "Full rewritten content in plain language",
  "key_concepts_preserved": ["What stayed in despite simplification"],
  "concepts_lost_or_simplified": ["What was simplified and why"],
  "compliance_flags": ["Any regulated claims that need review"],
  "unknowns": ["Things the agent couldn't determine from input"]
}

For OPTIMISE:
{
  "task": "optimise",
  "target_keywords": ["Keywords user specified or agent inferred"],
  "current_strengths": ["What the content does well already"],
  "on_page_recommendations": {
    "title_tag": "Suggested title tag (60 char)",
    "meta_description": "Suggested meta (155 char)",
    "h1": "Suggested H1",
    "h2_structure": ["Suggested H2 hierarchy"],
    "internal_linking_opportunities": ["Suggested internal links or anchor text"]
  },
  "aeo_recommendations": {
    "answer_engine_summary": "Concise answer-ready summary for AI search engines",
    "structured_data_suggestion": "Schema.org type and key properties",
    "question_format_opportunities": ["Questions the content could answer directly"]
  },
  "rewrite_suggestions": ["Specific paragraph-level changes"],
  "unknowns": ["Things the agent couldn't determine from input"]
}

For MATCH VOICE:
{
  "task": "match_voice",
  "voice_profile": "Summary of the brand voice as understood from input",
  "voice_characteristics": ["3-5 specific voice traits"],
  "transformed_content": "Full rewritten content in the target voice",
  "voice_choices_annotated": [
    {
      "original": "Source phrase",
      "transformed": "Rewritten phrase",
      "reasoning": "Why this change reflects the voice"
    }
  ],
  "consistency_notes": ["Patterns to maintain across future content"],
  "unknowns": ["Things the agent couldn't determine from input"]
}

For FIND ANGLES:
{
  "task": "find_angles",
  "source_summary": "What the source material is about",
  "core_subject": "The thing the angles will be built around",
  "angles": [
    {
      "title": "Angle headline",
      "hook": "Opening line / pitch",
      "audience": "Who this angle is for",
      "channel_recommendation": "Best channel/format for this angle",
      "key_insight": "The specific insight or twist this angle leverages",
      "tone": "Suggested tone"
    }
  ],
  "strongest_angle": "Which angle has the most potential and why",
  "unknowns": ["Things the agent couldn't determine from input"]
}`;
}

function buildUserMessage(content, task, extraContext) {
  const taskInstructions = {
    repurpose: 'Repurpose this content into a multi-channel asset map. Identify the key insights and produce derivative assets for LinkedIn, email, social, and web.',
    simplify: 'Simplify this content for a general audience. Flag jargon, preserve key concepts, and produce an accessible version.',
    optimise: 'Optimise this content for SEO and AEO (AI search visibility). Provide on-page recommendations, AEO suggestions, and rewrite improvements.',
    match_voice: 'Rewrite this content to match the specified brand voice. Annotate the key voice choices and provide consistency notes.',
    find_angles: 'Find 3-5 distinct narrative angles in this source material. For each angle, provide a hook, audience, channel recommendation, and key insight.'
  };

  let message = `TASK: ${task.toUpperCase()}\n\nINSTRUCTION: ${taskInstructions[task]}\n\n`;

  if (extraContext) {
    message += `ADDITIONAL CONTEXT: ${extraContext}\n\n`;
  }

  message += `SOURCE CONTENT:\n<source>\n${content}\n</source>\n\nProduce your <thinking> block, then the JSON output wrapped in <output> tags.`;

  return message;
}

function parseResponse(text) {
  const thinkingMatch = text.match(/<thinking>([\s\S]*?)<\/thinking>/);
  const outputMatch = text.match(/<output>([\s\S]*?)<\/output>/);

  const thinking = thinkingMatch ? thinkingMatch[1].trim() : null;
  let output = null;

  if (outputMatch) {
    try {
      // Strip any markdown code fences from inside the output tags
      let jsonStr = outputMatch[1].trim();
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      output = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      output = { error: 'Failed to parse output', raw: outputMatch[1] };
    }
  }

  return { thinking, output, raw: text };
}
