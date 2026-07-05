import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative border-b border-gray-200 bg-white min-h-[85vh] flex flex-col justify-center pb-20 pt-16">
      {/* Accent bar: navy blue */}
      <div className="absolute top-0 left-0 h-1 w-full bg-navy" />

      <div className="max-w-4xl mx-auto px-6 text-left w-full">
        <p className="text-xs font-semibold uppercase tracking-widest text-navy-mid mb-6">
          BYOK Banana
        </p>

        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 leading-tight mb-8 max-w-3xl">
          Generate images with your own Gemini API key.{' '}
          <span className="text-navy">No data passes through our servers</span>{' '}
          and you can verify it yourself.
        </h1>

        <div className="flex flex-col sm:flex-row items-start gap-4 mb-5">
          <Link
            href="/app"
            className="px-8 py-4 bg-navy text-white text-sm font-bold tracking-widest uppercase hover:bg-navy-hover transition-colors"
          >
            Get Started
          </Link>
          <a
            href="https://github.com/GrosGradient/byok-banana"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 border border-gray-300 text-gray-700 text-sm font-bold tracking-widest uppercase hover:border-navy hover:text-navy transition-colors"
          >
            View Source Code
          </a>
        </div>

        {/* Data flow diagram */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-10 font-semibold">Request Flow: Direct & Secure</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Your browser</span>
            </div>

            {/* Desktop arrow */}
            <div className="hidden sm:flex flex-col items-center mx-1 relative">
              <span className="text-[10px] font-bold text-navy-mid uppercase tracking-widest absolute -top-1">Direct HTTPS</span>
              <div className="flex items-center w-48 my-1">
                <div className="w-full h-px bg-gray-300" />
                <svg className="w-4 h-4 text-gray-400 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="absolute top-4 flex items-center gap-1 w-max">
                <svg className="w-3 h-3 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-[9px] text-crimson font-bold uppercase tracking-wider">Never our servers</span>
              </div>
            </div>
            
            {/* Mobile arrow */}
            <div className="sm:hidden flex items-center gap-3 ml-3 my-2">
              <div className="w-px h-12 bg-gray-300" />
              <div className="flex flex-col gap-1.5 py-1">
                <span className="text-[10px] font-bold text-navy-mid uppercase tracking-widest">Direct HTTPS</span>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-[10px] text-crimson font-bold uppercase tracking-wider">Never our servers</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">Google Gemini API</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-gray-400 opacity-80">
        <span className="text-[10px] uppercase tracking-widest font-bold mb-2">Learn more</span>
        <svg className="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
