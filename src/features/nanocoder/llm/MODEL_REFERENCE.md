# LLM Model Reference - Updated December 7, 2025

This document tracks the latest LLM models and their API identifiers for use in FLUX Nanocoder.

## OpenAI Models

**Latest Release:** GPT-5.1 (November 12, 2025)
- Enhanced reasoning capabilities
- Multimodal features
- Customizable personalities

**Recent Models:**
- GPT-5 (August 2025) - Combined reasoning and non-reasoning functionality
- GPT-4.5 (February 27, 2025) - Incremental improvements
- GPT-4.1 (April 14, 2025) - Incremental improvements

**API Model Names (verify at https://platform.openai.com/docs/models):**
- `gpt-5.1` or `gpt-5.1-preview` (if available via API)
- `gpt-5` or `gpt-5-preview` (if available via API)
- `gpt-4o-2025-12-07` or `gpt-4o` (latest GPT-4o variant)
- `gpt-4o-mini` (stable, cost-effective)
- `gpt-4-turbo` (stable)

**Current Default:** `gpt-4o-mini` (stable fallback)
**Recommended:** Check OpenAI API docs for `gpt-5.1` or `gpt-5` availability

---

## Anthropic Claude Models

**Latest Release:** Claude Opus 4.5 (mentioned in competition reports, December 2025)
- Enhanced reasoning and capabilities

**API Model Naming Pattern:** `claude-{version}-{variant}-{date}`

**Current Models (verify at https://docs.anthropic.com/claude/docs/models-overview):**
- `claude-3-5-sonnet-20241022` (current stable, October 2024)
- `claude-3-opus-20241022` (highest capability)
- `claude-3-haiku-20240307` (fastest, cost-effective)
- Check for `claude-3-5-sonnet-2025` or newer date variants
- Check for `claude-opus-4.5` or similar naming

**Current Default:** `claude-3-5-sonnet-20241022`
**Recommended:** Check Anthropic docs for 2025 variants or Opus 4.5

---

## Google Gemini Models

**Latest Release:** Gemini 3 (late 2025), Gemini 2.0 series
- Reportedly surpassed ChatGPT in industry benchmarks
- Enhanced reasoning and capabilities

**API Model Naming Pattern:** `gemini-{version}-{variant}`

**Current Models (verify at https://ai.google.dev/models/gemini):**
- `gemini-1.5-flash` (current stable, fast)
- `gemini-1.5-pro` (higher capability)
- `gemini-2.0-flash-exp` (experimental, if available)
- `gemini-2.0-pro-exp` (experimental, if available)
- `gemini-3-flash` or `gemini-3-pro` (if available)

**Current Default:** `gemini-1.5-flash`
**Recommended:** Check Google AI docs for Gemini 2.0 or Gemini 3 availability

---

## Z.AI GLM Models

**Latest Release:** GLM-4.6 (December 2025)
- 200K context window (expanded from 128K)
- Superior coding performance
- Advanced reasoning capabilities
- Enhanced agent capabilities
- Refined writing quality
- **Most affordable option** - Starting at $3/month for GLM Coding Plan

**API Endpoint:** `https://api.z.ai/api/anthropic` (Anthropic-compatible)

**Current Models (verify at https://docs.z.ai/guides/llm/glm-4.6):**
- `glm-4.6` (most capable, 200K context, superior coding)
- `glm-4.5-air` (faster, cost-effective for simpler tasks)
- Other models available for image/video generation (see Z.AI docs)

**API Model Names:**
- `glm-4.6` (default, most capable)
- `glm-4.5-air` (faster alternative)

**Current Default:** `glm-4.6`
**Recommended:** Use `glm-4.6` for best performance, `glm-4.5-air` for faster/simpler tasks

**Documentation:**
- API Guide: https://docs.z.ai/guides/llm/glm-4.6
- Claude Code Integration: https://docs.z.ai/scenario-example/develop-tools/claude

**Environment Variable:** `VITE_GLM_API_KEY` (store in `.env.local`, DO NOT commit to git)

---

## Update Schedule

**Last Updated:** December 7, 2025

**Next Review:** Weekly (every Monday) or when new models are announced

**Verification Sources:**
1. OpenAI: https://platform.openai.com/docs/models
2. Anthropic: https://docs.anthropic.com/claude/docs/models-overview
3. Google: https://ai.google.dev/models/gemini
4. Z.AI GLM: https://docs.z.ai/guides/llm/glm-4.6

---

## Notes

- API model names may differ from marketing names
- Some models may be in preview/beta and require special access
- Always verify model availability in your API account before using
- Fallback to stable models (`gpt-4o-mini`, `claude-3-5-sonnet-20241022`, `gemini-1.5-flash`) if latest models are unavailable

