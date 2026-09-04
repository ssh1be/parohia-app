'use client'

import { useState } from 'react'
import Image from 'next/image'

type AuthorPhotoProps = {
  src: string
  alt: string
  fallbackSrc: string
  className?: string
}

export default function AuthorPhoto({ src, alt, fallbackSrc, className }: AuthorPhotoProps) {
  const [currentSrc, setCurrentSrc] = useState(src)

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={800}
      height={800}
      sizes="(min-width: 768px) 320px, 256px"
      priority
      className={className}
      onError={() => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc)
      }}
    />
  )
}
