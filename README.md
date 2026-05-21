# Content Studio

A multi-use AI tool for writers, editors, and content marketers.

One agent. Five everyday content jobs. Built on Claude.

## What it does

**Repurpose.** Turn long-form content into multi-channel assets: LinkedIn posts, email newsletters, social threads, web summaries. One webinar becomes a week's worth of content without losing the substance.

**Simplify.** Translate technical or jargon-heavy content into clear, accessible language. Built-in compliance flagging for regulated industries.

**Optimise for SEO.** On-page SEO recommendations and AEO (Answer Engine Optimisation) suggestions, so content performs in both traditional search and AI-powered answer engines.

**Match brand voice.** Rewrite content in a specified voice, with annotated explanations of every choice so the team learns the voice alongside the tool.

**Find story angles.** Identify three to five narrative angles in source material, with audience, channel, and tone recommendations for each.

## Why it works

Most AI content tools generate. Content Studio thinks.

Every output starts with a hidden reasoning step that examines the source material before writing. The result is grounded in what's actually there, not confidently invented.

When the source is too thin to do the job well, the tool says so. It surfaces what it couldn't determine, rather than papering over the gap with plausible filler. Built-in guardrails flag regulated content for human review and decline tasks outside the tool's scope.

In other words: it knows what it doesn't know. That sounds obvious, but it's the difference between a tool you can trust with real work and one you can only trust to look impressive in a demo.

## How it's built

Single-agent architecture using Claude Sonnet 4. One system prompt routes between five output schemas based on the task selected. Structured JSON output means every result is consistent, machine-readable, and ready to feed into downstream tools or workflows.

Deployed on Vercel with a serverless API proxy that keeps the API key secure on the server side, never exposed to the browser.

## Live demo

Try it at [your-vercel-url].

## Credits

Designed by [Dora Czerna](https://www.doracee.com/). Portfolio prototype.
