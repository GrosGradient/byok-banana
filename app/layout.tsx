import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BYOK-Banana — Generate images with your own Gemini API key',
  description: 'Generate images with your own Gemini API key. No data ever passes through our servers and you can verify it yourself.',
  openGraph: {
    title: 'BYOK-Banana — Generate images with your own Gemini API key',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900 font-sans overflow-x-hidden">{children}</body>
    </html>
  );
}