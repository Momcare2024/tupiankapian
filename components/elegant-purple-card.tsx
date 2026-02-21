"use client"

import { useRef } from "react"
import type { JSX } from "react/jsx-runtime"

interface ElegantPurpleCardProps {
  content: string
  index: number
  total: number
}

export function ElegantPurpleCard({ content, index, total }: ElegantPurpleCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isFirst = index === 0

  // Helper to parse inline markdown (specifically bold)
  const parseInline = (text: string) => {
    // First, handle complete bold pairs
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <span key={index} className="font-bold text-[#5D4037]">
            {part.slice(2, -2)}
          </span>
        )
      }
      // Clean up any stray ** that weren't part of a pair
      return part.replace(/\*\*/g, "")
    })
  }

  const renderContent = () => {
    const lines = content.split("\n").filter((line) => line.trim())
    const elements: JSX.Element[] = []

    lines.forEach((line, lineIndex) => {
      line = line.trim()

      // Horizontal Rule - Hidden in Deep Template for cleaner look
      if (line === "---" || line === "***") {
        // elements.push(
        //   <div key={lineIndex} className="w-full h-px bg-[#D7CCC8] my-6 opacity-60" />
        // )
        return // Skip rendering
      }
      // H4 Heading
      else if (line.startsWith("#### ")) {
        elements.push(
          <h4
            key={lineIndex}
            className="text-[14px] font-bold text-[#6B5344] mb-2 mt-2 tracking-normal"
          >
            {line.slice(5)}
          </h4>,
        )
      }
      // H3 Heading
      else if (line.startsWith("### ")) {
        elements.push(
          <h3
            key={lineIndex}
            className="text-[16px] font-bold text-[#8B3A1F] mb-2 mt-4 tracking-normal"
          >
            {line.slice(4)}
          </h3>,
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
      // H1 Heading (Main Title) - only expected on first card
      else if (line.startsWith("# ")) {
        elements.push(
          <h1
            key={lineIndex}
            className="text-[34px] leading-tight font-extrabold text-[#8B3A1F] mb-8 mt-6 tracking-wider text-left"
            style={{
              display: 'inline-block',
            }}
          >
            {line.slice(2)}
          </h1>,
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
        backgroundColor: "#FAF5FF", // 浅紫色背景
      }}
    >
      {/* Content */}
      <div className={`flex-1 px-6 flex flex-col pb-2 ${isFirst ? "pt-12" : "pt-10"}`}>
        {renderContent()}
      </div>
    </div>
  )
}
