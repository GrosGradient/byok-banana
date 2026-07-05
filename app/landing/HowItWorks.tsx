const steps = [
  {
    num: '01',
    title: 'Get a key',
    body: 'Generate your Gemini API key for free from Google AI Studio. No payment required to start.',
    link: { href: 'https://aistudio.google.com/apikey', label: 'Open Google AI Studio' },
  },
  {
    num: '02',
    title: 'Paste the key',
    body: 'Enter the key in the dedicated field of the tool. It is kept in browser memory only, never sent to our servers.',
    link: null,
  },
  {
    num: '03',
    title: 'Generate',
    body: 'Enter a text prompt, attach images if needed, and generate. Requests go directly from your browser to Google.',
    link: null,
  },
];

export default function HowItWorks() {
  return (
    <section className="border-b border-gray-200 bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-navy-mid mb-3">How it works</p>
          <h2 className="text-3xl font-bold text-gray-900">Three steps</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-gray-200">
          {steps.map((step) => (
            <div key={step.num} className="bg-white p-6">
              <p className="text-3xl font-bold text-gray-100 mb-4 select-none">{step.num}</p>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">{step.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{step.body}</p>
              {step.link && (
                <a
                  href={step.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-navy-mid uppercase tracking-wider underline underline-offset-2 hover:text-navy transition-colors"
                >
                  {step.link.label} &rarr;
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
