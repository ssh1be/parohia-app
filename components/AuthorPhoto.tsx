'use client'

import { useState } from 'react'

type AuthorPhotoProps = {
  src: string
  alt: string
  fallbackSrc: string
  className?: string
}

export default function AuthorPhoto({ src, alt, fallbackSrc, className }: AuthorPhotoProps) {
  const [currentSrc, setCurrentSrc] = useState(src)

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => setCurrentSrc(fallbackSrc)}
    />
  )
}


