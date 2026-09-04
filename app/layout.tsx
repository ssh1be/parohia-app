import type { Metadata } from 'next'
import { Source_Sans_3 } from 'next/font/google'
import { ThemeProvider } from '../components/ThemeProvider'
import './globals.css'

const sourceSans = Source_Sans_3({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-source-sans',
})

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
    <html
      lang="en"
      className={sourceSans.variable}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var p=location.pathname;if(p==='/features'||p.indexOf('/features/')===0)document.documentElement.classList.add('dark');else if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}})();`
        }} />
      </head>
      <body className="min-h-screen font-sans bg-white text-zinc-900 dark:bg-[#050505] dark:text-white transition-colors">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
        <script noModule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
      </body>
    </html>
  )
}
