# AI Staff Capability Chart

Prepared for the Chief of Staff AI design. Date: 24 October 2026.

## How to read this chart

- **Status** describes what Claude can actually reach today, tested in this session, not what is theoretically possible.
- **Strengths** reflect widely reported, product-level patterns. Model version names change every few weeks, so versions are listed only where a source named them, and each one should be verified against the vendor's own announcement page.
- Rankings from public leaderboards (LMArena, Artificial Analysis) were taken from secondary aggregator pages, not the leaderboards themselves. Treat them as indicative.

Status key:

- **READY**: connected and usable by Claude right now
- **BLOCKED**: connected in your account but failed to connect in this session
- **NEEDS SETUP**: not connected; requires an API key and a network allowance (or a logged-in browser)

---

## Tier 1: In-house staff (inside Claude, available now)

| Staff member | Role on the team | Best at | Weaker at | Status |
|---|---|---|---|---|
| Claude (Chief of Staff) | Orchestrator, editor, final verifier | Long multi-step work, coding, careful writing, following detailed instructions, judging other agents' output | Image, video and audio generation; live social media data | READY |
| Claude sub-agents (General, Explore, Plan) | Parallel junior analysts | Splitting a task into independent parts and working them at the same time; codebase search; implementation plans | Each one only knows what it is briefed on; adds cost | READY |
| Web Search | Desk researcher | Fast fact lookups and current events with links | Returns mostly secondary sources; needs cross-checking | READY |
| Deep Research skill | Senior researcher | Multi-source research reports | Slower and more expensive than a single search | READY |
| Document skills (Word, PowerPoint, Excel, PDF) | Production team | Producing finished files: decks, memos, models, forms | Design polish depends on the brief | READY |
| Gmail, Google Calendar, Google Drive, Google Sheets | Executive assistant | Reading and drafting email, scheduling, pulling files and data | Sending anything outward should always be confirmed by you | READY |
| Notion, Claude Docs | Knowledge manager | Persistent notes, project pages, shared documents | Only as good as what is stored there | READY |
| Granola, Zoom | Meeting secretary | Meeting notes, transcripts, decisions and action items | Only covers meetings that were recorded | READY |
| Calendly | Scheduler | Booking links, availability, event types | Only Calendly bookings, not your full calendar | READY |
| Canva | Designer | Branded social graphics, presentations, resizing | Complex custom illustration | READY |
| Wix, Base44 | Web and app builder | Building and editing websites and simple apps | Heavily custom software | READY |
| GitHub | Engineering records | Code, pull requests, version history | Limited to repositories you grant | READY |
| Slack, Asana, HubSpot, Figma, Linear, Monday, ClickUp, Atlassian, Apollo, Crunchbase, Similarweb, Ahrefs and about 35 more plugin connectors | Department specialists | Their own systems of record | Not usable until the connection works | BLOCKED (proxy refused connection this session) |

---

## Tier 2: External AI staff (other companies' models)

None of these are connected today. In this session, only Google's Gemini API host was reachable through the network; OpenAI, Perplexity, xAI, Mistral and DeepSeek were refused by the environment's network policy.

| Staff member | Best at | Weaker at | Latest version reported (verify) | Status |
|---|---|---|---|---|
| **Google Gemini** | Very large context (whole document sets, long video), Google Search grounding, Google Workspace integration, video and image understanding | Commonly reported as less consistent on long, multi-step instructions | "Gemini 4 Argon" reported as general release on 13 Oct 2026; reported #1 on LMArena Text (preliminary, 17 Oct snapshot) | NEEDS SETUP (API host reachable; needs a key) |
| **Google NotebookLM** | Grounded answers strictly from documents you upload; audio overviews | No open web research; no public API I can confirm | Not verified | NEEDS SETUP (no API I can confirm; browser only) |
| **OpenAI ChatGPT** | Strong all-rounder; broad toolset (browsing, data analysis, image generation, voice); agentic web tasks | Citation consistency reported weaker than Perplexity | Sources conflict (GPT-6 tiers vs GPT-5.x); I could not confirm | NEEDS SETUP (key + network allowance) |
| **OpenAI image and video models** | Image generation and editing from plain language; video generation (Sora) | Brand-exact layouts and text | Not verified | NEEDS SETUP |
| **Perplexity** | Cited research answers; frequent Deep Research runs; strong source attribution | Long-form writing and editing | Not verified | NEEDS SETUP (key + network allowance) |
| **xAI Grok** | Live X (Twitter) data and real-time social sentiment; low price at the top tier | Reported as less reliable for formal, brand-safe writing | Sources conflict (Grok 4.3 vs 4.7) | NEEDS SETUP (key + network allowance) |
| **Microsoft Copilot** | Microsoft 365 work: Outlook, Word, Excel, Teams | Little value outside the Microsoft ecosystem | Not verified | NEEDS SETUP (browser or Microsoft 365 only) |
| **Mistral (Le Chat)** | European data residency; fast and low cost; open-weight options | Generally ranked below the top frontier models | Not verified | NEEDS SETUP |
| **DeepSeek, Kimi (Moonshot), Qwen (Alibaba)** | Low-cost reasoning and coding; open-weight models. A Kimi model was reported top of one LMArena coding sub-board in August 2026 | Data handling and jurisdiction concerns for client-sensitive work | Not verified | NEEDS SETUP (recommend excluding from confidential work) |
| **Midjourney** | Highest-aesthetic still imagery | No official public API I can confirm | Not verified | NEEDS SETUP (browser or Discord only) |
| **ElevenLabs** | Voice generation and voice cloning; narration | Not a reasoning model | Not verified | NEEDS SETUP |
| **Google Veo, Runway** | Video generation | Cost per clip; editing control | Not verified | NEEDS SETUP |

---

## Proposed routing: who does what

| Task type | Primary staff member | Second opinion | Final check |
|---|---|---|---|
| Fact research with citations | Perplexity | Gemini (Search grounding) | Claude verifies sources and resolves conflicts |
| Large document sets, long video | Gemini | NotebookLM | Claude |
| Real-time social sentiment | Grok | Web Search | Claude |
| Strategy, writing, editing (donor letters, LinkedIn posts, proposals) | Claude | ChatGPT | Claude, against your style rules |
| Coding and building | Claude | ChatGPT | Claude sub-agent as independent QA |
| Finance and calculations | Claude with Excel skill | ChatGPT data analysis | Second independent recalculation |
| Images and design | Canva (brand work), OpenAI or Midjourney (original imagery) | | You approve before publishing |
| Email, calendar, meetings | Gmail, Calendar, Granola, Zoom | | You approve anything sent |

---

## What is and is not possible

**Possible:**

- A Chief of Staff skill that Claude loads in every chat and project. On claude.ai, skills can be enabled for your account. In Claude Code, a user-level instruction file and skill apply to every project on that machine.
- Calling Gemini, ChatGPT, Perplexity and Grok through their official APIs, then merging and verifying their answers. This is the reliable route.

**Not reliably possible:**

- Opening the Gemini or ChatGPT websites in a browser and typing questions on your behalf. These sites require your login, detect automation, and their terms of use may prohibit it. Results would break often. I recommend APIs instead.
- This cloud session cannot keep running after it ends; work persists only through files, connectors and scheduled tasks.

---

## Decisions needed before building

1. Which subscriptions or API keys do you hold (OpenAI, Google AI, Perplexity, xAI)? API access is billed separately from the monthly chat subscriptions.
2. Where should the Chief of Staff live first: the claude.ai app (all chats) or Claude Code (projects)?
3. Is there a monthly spend ceiling for external AI calls?
4. Should any providers be excluded from client-confidential work?

## Sources (secondary, verify before relying on them)

- https://www.teamday.ai/blog/best-ai-models-2026
- https://sintra.ai/blog/grok-vs-chatgpt-vs-gemini
- https://www.datastudios.org/post/grok-vs-chatgpt-vs-gemini-best-ai-2026-user-reviews-real-trust-and-daily-performance
- https://www.developersdigest.tech/benchmarks/lmarena
- https://www.datalearner.com/en/leaderboards/external/text-generation-coding?isChina=1
- https://cut-the-saas.com/the-cut/perplexity-vs-chatgpt
- https://www.provimedia.de/en/blog/chatgpt-claude-gemini-perplexity-comparison-2026
- https://www.tech-insider.org/perplexity-vs-chatgpt-vs-gemini-2026/
