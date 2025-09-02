import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Parohia — Embrace the Orthodox faith',
  description: 'Parohia: Embrace the Orthodox faith. A modern companion for Orthodox Christians.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-black text-white">
        {children}
        <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
        <script noModule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
      </body>
    </html>
  )
}


