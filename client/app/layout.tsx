import "./globals.css"

import { Noto_Sans } from "next/font/google"
import type { Metadata } from "next"
import { ClerkProvider } from '@clerk/nextjs'
import Script from "next/script"
import type { ReactNode } from "react"

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "ChatFusion",
  description: "A modern Discord-like chat application",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${notoSans.variable} h-full antialiased`}
      >
        <body className="min-h-screen  max-h-svh bg-overlay overflow-hidden">
          {children}
        </body>
        <Script
          src="https://cdn.jsdelivr.net/npm/@aejkatappaja/phantom-ui/dist/phantom-ui.cdn.js" />
      </html>
    </ClerkProvider>
  )
}
