const limits = [
  {
    title: "This is not a persistent account system.",
    body: "A simple page refresh completely resets your session and erases your key from memory.",
  },
  {
    title: "We do not store your images.",
    body: "There is no database to save your history. Generated images are lost if you do not download them.",
  },
  {
    title: "Closing the tab ends the session.",
    body: "This is the direct consequence of zero server-side storage. The application is a stateless and ephemeral intermediary.",
  },
];

export default function TransparencySection() {
  return (
    <section className="border-b border-gray-200 bg-white py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-crimson mb-3">Limitations</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What this tool is not</h2>
          <p className="text-sm text-gray-600 max-w-xl leading-relaxed">
            These constraints are not design flaws. They are mechanical proof that no server-side data collection takes place.
          </p>
        </div>

        <div className="space-y-0 border-t border-gray-200">
          {limits.map((item, i) => (
            <div key={i} className="flex gap-6 py-6 border-b border-gray-200">
              <div className="flex-shrink-0 mt-1">
                <div className="w-4 h-4 border border-gray-400 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
