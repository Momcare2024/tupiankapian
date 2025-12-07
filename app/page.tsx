"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CardPreview } from "@/components/card-preview"
import { DeepReadingCard } from "@/components/deep-reading-card"
import { Loader2, Download, LayoutTemplate, BookOpen, UserCircle } from "lucide-react"
import { toPng } from "html-to-image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function Home() {
  const [title, setTitle] = useState("")
  const [template, setTemplate] = useState<'classic' | 'deep'>('classic')
  const [persona, setPersona] = useState('parenting')
  const [cards, setCards] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null)

  // Ref for the hidden measurement container
  const measureRef = useRef<HTMLDivElement>(null)

  // Helper: Render a single line to HTML string (simplified Markdown support)
  const renderLineToHtml = (line: string, isFirstPage: boolean) => {
    // H1 - Match DeepReadingCard
    if (line.startsWith("# ")) {
      return `<h1 class="text-[52px] leading-[1.15] font-extrabold text-[#8B3A1F] mb-8 tracking-wider text-left">${line.slice(2)}</h1>`
    }
    // H2 - Match DeepReadingCard
    if (line.startsWith("## ")) {
      return `<h2 class="text-[18px] font-bold text-[#8B3A1F] mb-3 mt-6 tracking-normal">${line.slice(3)}</h2>`
    }
    // Quote - Match DeepReadingCard
    if (line.startsWith("> ")) {
      return `<blockquote class="${isFirstPage ? "text-[13px]" : "text-[13px]"} leading-[1.7] text-[#6D5D52] italic mb-5 pl-5 border-l-[3px] border-[#C8B8A8] py-0.5">${line.slice(2)}</blockquote>`
    }
    // Paragraph - Match DeepReadingCard
    let content = line;
    content = content.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-[#5D4037]">$1</span>');
    return `<p class="${isFirstPage ? "text-[13px]" : "text-[13px]"} leading-[1.75] text-[#6B5344] mb-2 text-justify tracking-normal font-normal">${content}</p>`
  }

  // Expert Level Pagination Logic: Measure DOM Height
  const calculatePages = (fullText: string) => {
    if (!measureRef.current) return [fullText];

    const container = measureRef.current;

    // Helper to get height of a candidate page content
    const getHeight = (items: string[], isFirst: boolean) => {
      container.innerHTML = items.map(l => renderLineToHtml(l, isFirst)).join('');
      return container.scrollHeight;
    };

    const pages: string[] = [];
    let currentPageItems: string[] = [];
    let isFirstPage = true;

    // Constants for height calculation (must match DeepReadingCard)
    // Total Height: 500px
    // Top Space Inner: mt-10 (40) + h-1.5 (6) + mb-2 (8) = 54px
    // Top Space Cover: mt-14 (56) + h-1.5 (6) + mb-2 (8) = 70px
    // Footer Space: Removed (0px)
    // Content Padding Bottom: pb-1 (4px)

    // Since we reduced paragraph margin (mb-4 -> mb-2) and heading margin,
    // the actual content density is higher, so we just need to ensure the container height is correct.
    // Available Height for Content (Page N) = 500 - 54 - 4 = 442px
    // Available Height for Content (Page 1) = 500 - 70 - 4 = 426px

    const SAFE_HEIGHT_PAGE_1 = 426;
    const SAFE_HEIGHT_PAGE_N = 442;

    // Pre-process: Split by paragraphs first
    const rawParagraphs = fullText.split('\n');

    // Queue of content chunks to process
    let queue = [...rawParagraphs];

    while (queue.length > 0) {
      const item = queue.shift(); // Take one block
      if (!item || !item.trim()) continue; // Skip empty lines

      // Special Rule: Force break BEFORE the first H2 (## ) if we are on the first page.
      // This ensures the cover page only contains Title + Quote + Intro.
      if (isFirstPage && item.startsWith("## ") && currentPageItems.length > 0) {
        // Detect first H2 on page 1 -> Finalize Page 1 immediately.
        pages.push(currentPageItems.join('\n'));
        currentPageItems = [];
        isFirstPage = false;
        // Process this H2 on the new page (next iteration)
        queue.unshift(item);
        continue;
      }

      // Try adding this whole block to current page
      currentPageItems.push(item);

      const currentHeight = getHeight(currentPageItems, isFirstPage);
      const maxHeight = isFirstPage ? SAFE_HEIGHT_PAGE_1 : SAFE_HEIGHT_PAGE_N;

      if (currentHeight <= maxHeight) {
        // Fits! Continue to next item.
        continue;
      }

      // It doesn't fit.
      // Remove it from current page.
      currentPageItems.pop();

      // If it's a Heading or Blockquote (starts with # or >), we generally shouldn't split it inside.
      // Just push current page and move this item to next page.
      if (item.startsWith('#') || item.startsWith('>')) {
        if (currentPageItems.length > 0) {
          pages.push(currentPageItems.join('\n'));
          currentPageItems = [];
          isFirstPage = false;
          // Put the item back in queue to be processed for next page
          queue.unshift(item);
        } else {
          // Edge case: A single heading is taller than the whole page? 
          // Or empty page. Just force it in.
          pages.push(item);
          isFirstPage = false;
        }
        continue;
      }

      // It's a paragraph (or simple text). We need to split it.
      let low = 0;
      let high = item.length;
      let splitIndex = 0;

      // Binary search for the perfect cut point
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const subItem = item.slice(0, mid);

        // Test
        const testItems = [...currentPageItems, subItem];
        if (getHeight(testItems, isFirstPage) <= maxHeight) {
          splitIndex = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      // Smart split optimization
      let bestSplit = splitIndex;
      const lookBackLimit = 10;
      for (let k = 0; k < lookBackLimit && (bestSplit - k) > 0; k++) {
        const char = item[bestSplit - k];
        if ([' ', '，', '。', '！', '？', '\n'].includes(char)) {
          bestSplit = bestSplit - k + 1;
          break;
        }
      }

      if (bestSplit <= 0) bestSplit = splitIndex;
      if (bestSplit === 0 && currentPageItems.length === 0) {
        bestSplit = Math.min(item.length, 50);
      }

      const part1 = item.slice(0, bestSplit);
      const part2 = item.slice(bestSplit);

      if (part1.trim()) {
        currentPageItems.push(part1);
      }

      // Finalize current page
      pages.push(currentPageItems.join('\n'));
      currentPageItems = [];
      isFirstPage = false;

      // Put the rest back into queue
      if (part2.trim()) {
        queue.unshift(part2);
      }
    }

    // Flush last page
    if (currentPageItems.length > 0) {
      pages.push(currentPageItems.join('\n'));
    }

    return pages;
  }

  const handleGenerate = async () => {
    if (!title.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          template: template,
          persona: template === 'deep' ? persona : undefined
        }),
      })

      if (!response.ok) throw new Error("生成失败")

      const data = await response.json()

      if (template === 'deep') {
        const fullContent = data.cards[0];
        const paginatedCards = calculatePages(fullContent);
        setCards(paginatedCards);
      } else {
        setCards(data.cards)
      }

      // 如果有错误信息，虽然成功但可能有部分警告
      if (data.error) {
        console.warn(data.error)
      }

    } catch (error) {
      console.error("Generate error:", error)
      alert("生成失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  const handleCardChange = (index: number, value: string) => {
    const newCards = [...cards]
    newCards[index] = value
    setCards(newCards)
  }

  const handleDownloadCard = async (index: number) => {
    setDownloadingIndex(index)
    try {
      const cardElement = document.getElementById(`card-${index}`)
      if (!cardElement) return

      await new Promise((resolve) => setTimeout(resolve, 100))

      const dataUrl = await toPng(cardElement, {
        cacheBust: true,
        pixelRatio: 3, // 保持高清
        backgroundColor: template === 'deep' ? "#FAF8F3" : "#ffffff", // 更新为极浅暖白色背景
      })

      const link = document.createElement("a")
      link.download = `card-${index + 1}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Download error:", error)
      alert("下载失败，请重试")
    } finally {
      setDownloadingIndex(null)
    }
  }

  const handleDownloadAll = async () => {
    if (cards.length === 0) return

    for (let i = 0; i < cards.length; i++) {
      await handleDownloadCard(i)
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Hidden Measurement Container */}
      <div
        ref={measureRef}
        className="fixed top-0 left-0 pointer-events-none opacity-0 z-[-1] flex flex-col"
        style={{
          width: '375px', // Same as card width
          paddingLeft: '32px', // px-8
          paddingRight: '32px', // px-8
        }}
      >
        {/* Content will be injected here for measurement */}
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">图文卡片生成器</h1>
          <p className="text-gray-600">输入标题，AI 将为你生成多张精美卡片，可单独下载</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Input & Edit */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">配置与输入</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择模版</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTemplate('classic')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${template === 'classic'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                        }`}
                    >
                      <LayoutTemplate className="w-4 h-4" />
                      <span className="text-sm font-medium">经典模版</span>
                    </button>
                    <button
                      onClick={() => setTemplate('deep')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${template === 'deep'
                        ? 'border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-500'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                        }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span className="text-sm font-medium">深度解析模版</span>
                    </button>
                  </div>
                </div>

                {template === 'deep' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <UserCircle className="w-4 h-4" />
                        目标人群 / 写作人设
                      </div>
                    </label>
                    <Select value={persona} onValueChange={setPersona}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择目标人群" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parenting">👶 育儿专家 (默认)</SelectItem>
                        <SelectItem value="0-3_mom">🍼 0-3岁宝妈群体</SelectItem>
                        <SelectItem value="3-8_mom">🎒 3-8岁宝妈群体</SelectItem>
                        <SelectItem value="wellness">🧘‍♀️ 养生人群</SelectItem>
                        <SelectItem value="sophisticated">💄 精致生活女孩</SelectItem>
                        <SelectItem value="household">🏠 家庭日用百货</SelectItem>
                        <SelectItem value="pet">🐾 养宠人群</SelectItem>
                        <SelectItem value="growth">🧠 硬核女性成长 (安·兰德 x 毛选)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">输入标题</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder={template === 'classic' ? "例如：毫无保留的爱" : "例如：如何深度思考？"}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                      className="flex-1"
                    />
                    <Button onClick={handleGenerate} disabled={loading || !title.trim()}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          生成中
                        </>
                      ) : (
                        "生成"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {cards.length > 0 && (
              <>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">编辑卡片内容</h2>
                    <Button onClick={handleDownloadAll} disabled={downloadingIndex !== null} size="sm">
                      {downloadingIndex !== null ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          下载中
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          下载全部
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {cards.map((card, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium mb-2">
                          卡片 {index + 1}
                          {index === 0 && " (封面)"}
                          {index === cards.length - 1 && index !== 0 && " (结尾)"}
                        </label>
                        <Textarea
                          value={card}
                          onChange={(e) => handleCardChange(index, e.target.value)}
                          rows={6}
                          className="font-mono text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right: Preview */}
          <div>
            <div className="bg-white p-6 rounded-lg shadow-sm border sticky top-8">
              <h2 className="text-xl font-semibold mb-4">预览 ({cards.length} 张卡片)</h2>
              {cards.length === 0 ? (
                <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed">
                  <p className="text-gray-400">输入标题并生成后，多张卡片预览将显示在这里</p>
                </div>
              ) : (
                <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 flex flex-col items-center">
                  {cards.map((card, index) => (
                    <div key={index} className="space-y-2 w-[375px]">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          卡片 {index + 1}
                          {index === 0 && " - 封面"}
                          {index === cards.length - 1 && index !== 0 && " - 结尾"}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadCard(index)}
                          disabled={downloadingIndex !== null}
                        >
                          {downloadingIndex === index ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <div id={`card-${index}`} className="shadow-lg rounded-lg overflow-hidden">
                        {template === 'classic' ? (
                          <CardPreview content={card} index={index} total={cards.length} />
                        ) : (
                          <DeepReadingCard content={card} index={index} total={cards.length} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
