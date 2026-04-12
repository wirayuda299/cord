'use client'

import { useSearchParams } from "next/navigation"

export default function ServerHeader() {
  const sp = useSearchParams()
  const name = sp.get("name")

  if (!name) return null
  return (
    <p className="text-center h-7 flex items-center justify-center font-medium text-sm text-white">
      {name}
    </p>
  )
}
