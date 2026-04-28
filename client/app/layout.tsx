import "./globals.css"
import { Noto_Sans } from "next/font/google"
import type { Metadata } from "next"

import Sidebar from "@/components/sidebar/MainSidebar"
import Script from "next/script"

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
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${notoSans.variable} h-full antialiased`}
    >
      <body className="min-h-screen  max-h-svh bg-overlay overflow-hidden">
        <div className="flex">
          <Sidebar />
          <div className=" flex min-h-screen bg-sidebar-secondary p-0 max-h-screen w-full border rounded-2xl border-sidebar-secondary/10">
            {children}
          </div>
        </div>
      </body>
      <Script src="https://cdn.jsdelivr.net/npm/@aejkatappaja/phantom-ui/dist/phantom-ui.cdn.js" />
    </html>
  )
}
