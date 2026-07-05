export default function TrustSection() {
  return (
    <section className="border-b border-gray-200 bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-navy-mid mb-3">Transparency</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Don't trust us. Verify.</h2>
          <p className="text-base text-gray-600 max-w-2xl leading-relaxed">
            We built a Network Audit panel directly into the tool. It displays every outgoing request from your browser in real-time, so you can confirm that your API key and images never pass through our servers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Steps */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">How to verify yourself</p>
            <ol className="space-y-5">
              {[
                'Open DevTools (F12 or right-click then Inspect).',
                'Go to the Network tab and enable "Preserve log".',
                'Generate an image.',
                'See that the only external API request goes to generativelanguage.googleapis.com.',
              ].map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 border border-navy text-navy text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Mock audit panel */}
          <div className="border border-gray-300 bg-white min-w-0">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-300">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-600">Network Audit</span>
              <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 uppercase tracking-wider">OK</span>
            </div>
            <div className="p-4 font-mono text-xs">
              <div className="flex text-gray-400 pb-2 border-b border-gray-100 mb-3 gap-4">
                <span className="w-10 flex-shrink-0">Status</span>
                <span className="w-12 flex-shrink-0">Method</span>
                <span className="flex-1 truncate">Host</span>
              </div>
              <div className="flex gap-4 items-center py-1.5 text-gray-800">
                <span className="w-10 flex-shrink-0 font-semibold text-green-700">200</span>
                <span className="w-12 flex-shrink-0 text-gray-500">POST</span>
                <span className="flex-1 text-navy-mid font-medium truncate min-w-0">generativelanguage.googleapis.com</span>
              </div>
              <div className="flex gap-4 items-center py-1.5 text-gray-400">
                <span className="w-10 flex-shrink-0">200</span>
                <span className="w-12 flex-shrink-0">GET</span>
                <span className="flex-1 truncate min-w-0">localhost/_next/static/...</span>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500 leading-relaxed">
                Google: <strong className="text-green-700">1</strong> request &mdash; Our domain: <strong>0</strong> requests.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
