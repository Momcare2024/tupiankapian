"use client"

import { useRef } from "react"
import type { JSX } from "react/jsx-runtime"

interface CardPreviewProps {
  content: string
  index: number
  total: number
}

export function CardPreview({ content, index, total }: CardPreviewProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isFirst = index === 0
  const isLast = index === total - 1
  
  // Helper to parse inline markdown (specifically bold)
  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <span key={index} className="font-bold text-[#000000]">
            {part.slice(2, -2)}
          </span>
        )
      }
      return part
    })
  }

  // Parse markdown-like content to JSX
  const renderContent = () => {
    const lines = content.split("\n").filter((line) => line.trim())
    const elements: JSX.Element[] = []

    lines.forEach((line, lineIndex) => {
      line = line.trim()

      // Horizontal Rule
      if (line === "---" || line === "***") {
        elements.push(
          <div key={lineIndex} className="w-full h-px bg-gray-300 my-6" />
        )
      }
      // H4 Heading
      else if (line.startsWith("#### ")) {
        elements.push(
          <h4
            key={lineIndex}
            className="text-[15px] font-bold text-[#374151] mb-4 mt-6 tracking-wide font-serif"
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
            className="text-[18px] font-bold text-[#111827] mb-4 mt-8 tracking-wide font-serif"
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
            className="text-[20px] font-bold text-[#111827] mb-6 mt-8 tracking-wide font-serif"
          >
            {line.slice(3)}
          </h2>,
        )
      }
      // H1 Heading (Main Title)
      else if (line.startsWith("# ")) {
        elements.push(
          <div key={`${lineIndex}-title-group`}>
            <h1
              className={`font-serif text-[30px] leading-[1.2] font-bold text-[#111827] mb-6 tracking-wide ${
                isFirst ? "mt-0 text-left" : "mt-8 text-left"
              }`}
            >
              {line.slice(2)}
            </h1>
            {isFirst && (
              <div className="w-full h-px bg-gray-300 mb-6" />
            )}
          </div>
        )
      }
      // Quote
      else if (line.startsWith("> ")) {
        elements.push(
          <blockquote
            key={lineIndex}
            className="text-[14px] leading-[1.8] text-[#4B5563] italic mb-4 pl-5 border-l-[3px] border-[#9CA3AF] py-1 font-serif"
          >
            {parseInline(line.slice(2))}
          </blockquote>,
        )
      }
      // Numbered list
      else if (/^\d+\./.test(line)) {
        const match = line.match(/^(\d+)\.\s*(.+)$/)
        if (match) {
          elements.push(
            <div key={lineIndex} className="flex gap-3 mb-2 items-start text-justify group font-serif">
              <span className="font-sans text-[12px] font-bold text-white shrink-0 leading-5 mt-1 bg-[#111827] w-5 h-5 flex items-center justify-center rounded-full text-[10px] shadow-sm">
                {match[1]}
              </span>
              <p className="text-[14px] leading-[1.8] text-[#1F2937] font-normal tracking-wide pt-0">
                {parseInline(match[2])}
              </p>
            </div>,
          )
        }
      }
      // Regular paragraph
      else {
        elements.push(
          <p
            key={lineIndex}
            className="text-[14px] leading-[1.8] text-[#1F2937] mb-3 text-justify tracking-wide font-normal font-serif"
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
      className="relative bg-white overflow-hidden flex flex-col font-serif"
      style={{
        width: "375px",
        height: "500px",
      }}
    >
      {/* Content */}
      <div
        className={`flex-1 overflow-hidden flex flex-col ${
          isFirst ? "px-6 pt-10 pb-6" : "px-6 pt-6 pb-2"
        }`}
      >
        <div className="h-full flex flex-col relative">
          {renderContent()}
        </div>
      </div>
      
      {/* 底部页码装饰 */}
      {!isFirst && (
         <div className="absolute bottom-3 right-6 text-[10px] text-gray-400 font-sans tracking-widest">
            {index + 1} / {total}
         </div>
      )}
    </div>
  )
}
