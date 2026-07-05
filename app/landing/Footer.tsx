export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="h-1 w-full bg-navy" />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Top row: brand | nav links | credit — spread across full width */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 items-start">
          {/* Brand */}
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 text-sm">BYOK-Banana</span>
            <span className="text-[10px] text-gray-400 font-medium mt-0.5">
              Bring Your Own Key: &ldquo;Banana&rdquo;
            </span>
          </div>

          {/* Links — centered column */}
          <div className="flex flex-col gap-0 text-sm text-gray-500 sm:items-center">
            <a
              href="https://github.com/GrosGradient/byok-banana"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-navy transition-colors flex flex-col gap-0 text-sm text-gray-500 sm:items-center"
            >
              Source code (GitHub)
            <span>MIT License</span>
            </a>
          </div>

          {/* Credit — right-aligned on desktop */}
          <div className="text-sm text-gray-500 sm:text-right">
            Developed by{' '}
            <a
              href="https://grosgradient.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gray-900 hover:text-navy transition-colors"
            >
              Gros Gradient
            </a>
          </div>
        </div>

        {/* Bottom disclaimer */}
        <div className="text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-6">
          <strong>Why &ldquo;Banana&rdquo;?</strong> — Google&rsquo;s Gemini image generation model is officially nicknamed
          &ldquo;Nano Banana&rdquo; both internally and externally. The name is a playful nod, not a brand associated with Google.
        </div>
      </div>
    </footer>
  );
}
