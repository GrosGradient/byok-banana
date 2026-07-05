# BYOK Banana

**Generate images with your own Gemini API key. No data ever passes through our servers, and you can verify it yourself.**

BYOK-Banana is a modern, stateless, mobile-first interface for generating images with Google's Gemini models (2.5 Flash, 3 Pro Image), with real-time cost tracking.

> **Note on the name:** Google's Gemini image generation model is publicly nicknamed "Nano Banana." This project is not affiliated with, endorsed by, or sponsored by Google. The name is a wink to that nickname, not a claim of association.

## 🛡️ Why BYOK (Bring Your Own Key)?

- **Server-side stored keys:** Most tools require an account and store your API key on their servers. That creates a central point of failure and a permanent leak risk.
- **Margin on credits:** Most services sell you opaque "credits" with a significant markup over the real generation cost. With BYOK, you pay Google at cost.
- **The client-side choice:** This model earns the publisher less, which is exactly why it's rare. We built this tool purely for utility, with no monetization of your requests.

## 🕵️ Security / Network Audit

**Don't take our word for it. Verify it.**

We've built a **Network Audit** panel directly into the app. You can check in real time that no key or image data is ever sent to a BYOK-Banana server.

You can also verify it yourself via DevTools:
1. Open DevTools (F12)
2. Go to the **Network** tab and enable "Preserve log"
3. Generate an image
4. Confirm that the only external API request goes directly to `generativelanguage.googleapis.com`

## 🚀 App Features (/app)

- **BYOK**: Your key is never stored.
- **Model choice**: Gemini 2.5 Flash or Gemini 3 Pro Image.
- **Image generation**: Text-to-image or image-to-image prompts.
- **Real-time token counting**: Local estimation of input tokens.
- **Cost history**: In-memory tracking (exportable as CSV).

## 💎 Code Quality

This repository is designed to be auditable by any developer in about 5 minutes:
- **Strict TypeScript**: No implicit `any`, ensuring a readable, type-safe data flow.
- **UI/logic separation**: The interface is deliberately decoupled from API call logic (`lib/geminiClient.ts`) and network interception (`lib/networkAudit.ts`), making the codebase easy to review.
- **Network trust proof**: The no-data-collection promise isn't just marketing copy. `lib/networkAudit.ts` dynamically patches the browser's native network functions to prove, live in the UI, that your API key never reaches a third-party backend.

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/GrosGradient/byok-banana.git
cd byok-banana
```

2. Install dependencies with Bun:
```bash
bun install
```

3. Start the dev server:
```bash
bun run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser. The landing page is at `/`, the tool is at `/app`.

## 🤝 Contributing

Issues and pull requests are welcome. This project favors clarity and minimal abstraction, see the "Code Quality" section above before submitting changes.

## 📝 License

Distributed under the MIT License. See `LICENSE` for details.