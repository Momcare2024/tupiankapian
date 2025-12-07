"use client"

import { useRef } from "react"
import type { JSX } from "react/jsx-runtime"

interface DeepReadingCardProps {
  content: string
  index: number
  total: number
}

export function DeepReadingCard({ content, index, total }: DeepReadingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isFirst = index === 0

  // Helper to parse inline markdown (specifically bold)
  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <span key={index} className="font-bold text-[#5D4037]">
            {part.slice(2, -2)}
          </span>
        )
      }
      return part
    })
  }

  const renderContent = () => {
    const lines = content.split("\n").filter((line) => line.trim())
    const elements: JSX.Element[] = []

    lines.forEach((line, lineIndex) => {
      line = line.trim()

      // H1 Heading (Main Title) - only expected on first card
      if (line.startsWith("# ")) {
        elements.push(
          <h1
            key={lineIndex}
            className="text-[52px] leading-[1.15] font-extrabold text-[#8B3A1F] mb-8 mt-6 tracking-wider text-left"
            style={{
              display: 'inline-block',
            }}
          >
            {line.slice(2)}
          </h1>,
        )
      }
      // H2 Heading (Sub Title)
      else if (line.startsWith("## ")) {
        elements.push(
          <h2
            key={lineIndex}
            className="text-[18px] font-bold text-[#8B3A1F] mb-3 mt-6 tracking-normal"
          >
            {line.slice(3)}
          </h2>,
        )
      }
      // Quote
      else if (line.startsWith("> ")) {
        elements.push(
          <blockquote
            key={lineIndex}
            className={`${isFirst ? "text-[13px]" : "text-[13px]"
              } leading-[1.7] text-[#6D5D52] italic mb-5 pl-5 border-l-[3px] border-[#C8B8A8] py-0.5`}
          >
            {parseInline(line.slice(2))}
          </blockquote>,
        )
      }
      // Regular paragraph
      else {
        elements.push(
          <p
            key={lineIndex}
            className={`${isFirst ? "text-[13px]" : "text-[13px]"
              } leading-[1.75] text-[#6B5344] mb-2 text-justify tracking-normal font-normal`}
          >
            {parseInline(line)}
          </p>,
        )
      }
    })

    return elements
  }

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden flex flex-col"
      style={{
        width: "375px",
        height: "500px", // 3:4 aspect ratio
        backgroundColor: "#FAF8F3", // 极浅暖白色，更接近参考图
      }}
    >
      {/* Top Decorative Line */}
      <div className={`w-16 h-1.5 bg-[#D7CCC8] ml-8 mb-4 ${isFirst ? "mt-8" : "mt-8"}`} />

      {/* Content */}
      <div className="flex-1 px-8 flex flex-col pb-2">
        {renderContent()}
      </div>
    </div>
  )
}
