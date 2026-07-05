const cards = [
  {
    title: 'Server-side key storage',
    body: 'Most tools require account creation and store your API key on their infrastructure. This creates a central point of vulnerability and a permanent risk of data leaks.',
  },
  {
    title: 'Opaque credit systems',
    body: 'Most services sell proprietary credits with a significant markup over the actual generation cost. With BYOK, you pay Google directly at cost.',
  },
  {
    title: 'A deliberate product choice',
    body: 'This model is less profitable for the developer, which explains its rarity. This tool was designed solely for utility, without monetizing your requests.',
  },
];

export default function RarityCards() {
  return (
    <section className="border-b border-gray-200 bg-white py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-navy-mid mb-3">Context</p>
          <h2 className="text-3xl font-bold text-gray-900">Why (almost) nobody does this</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-gray-200">
          {cards.map((card, i) => (
            <div key={i} className="bg-white p-6">
              <div className="w-6 h-0.5 bg-navy mb-5" />
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">{card.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
