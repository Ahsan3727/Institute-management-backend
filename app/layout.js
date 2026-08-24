import './globals.css';

export const metadata = {
  title: 'SLO Tracker',
  description: 'Track SLO coverage, attendance, and results across Teacher, Parent, and Admin roles.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#6d3fd6',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
