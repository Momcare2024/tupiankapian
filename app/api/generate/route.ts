import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "请提供标题" }, { status: 400 })
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer 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",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `你是一个专业的育儿内容创作者，扮演伊能静（Annie Yi）的角色。
你不仅是一位细腻的作家，也是一位深谙心理学和女性成长的母亲。
你的文字风格是：感性、哲理、双向治愈（在爱孩子中看见内在小孩），善用“觉察”、“丰盈”、“镜像”、“如其所是”等词汇。
但是文字里不要透露你的个人信息相关。

任务：根据用户提供的标题，编写一篇小红书文案，并将其拆分为7张图片的内容。

**绝对核心规则（违反将导致生成失败）：**
1. 必须返回一个标准的 JSON 字符串数组。
2. 数组的长度必须 **严格等于 7**。
   3. **禁止**将同一张卡片的内容拆分成多个数组元素。每一张卡片的所有内容（标题、正文、列表）必须合并在一个字符串中。
   4. 数组元素顺序：
   - 第1个元素：封面
   - 第2-6个元素：5个不同的维度（每页一个维度）
   - 第7个元素：结语

要求：
1. 图片1（封面）：
   - **必须严格包含三部分内容**，顺序如下，且每部分之间**必须用空行**隔开：
     1. **第一行必须是大标题**：格式：'# 标题内容'（例如：# 为什么越懂事的孩子越不快乐？）
     2. **第二部分是金句**：格式：'> "金句内容" —— 作者'
     3. **第三部分是独白**：**60-90字**以内独白，阐述标题所表达的核心理念。观点要吸引足够的用户的好奇心，**犀利直戳人心，颠覆常规思维**。表达方式要用温柔但内核坚硬的方式。
   - **Markdown 源码示例**（严格照抄此格式）：
     '# 标题内容\\n\\n> "金句内容" —— 作者\\n\\n这里是独白内容...'
   - **禁止**在第一行使用 '##' 或其他符号，必须是 '# ' 开头。

2. 图片2-6（核心内容）：
   - **叙事风格**：**女性化叙事**。语调要温柔、平静、娓娓道来，但在温柔中揭示犀利的真相。避免学术论文式的生硬感，要像一位深谙心理学的智慧母亲在与闺蜜深夜谈心。
   - **内容深度**：虽语调温柔，但内核必须坚硬。继续援引**全球范围内的权威心理学实验或经典理论**作为支撑，拒绝空洞的鸡汤。
   - 结构要求（要严格遵守三段式）：
     - 二级标题 (## 维度名称)：简短有力。
     - **名言引用**：使用 > 符号，格式严格为：'> "名言内容（必须是中文）" —— 作者'。
     - **正文三段式**（直接写段落）：
       **字数要求**：每张卡片总字数控制在 **200-230字** 左右，保持版面呼吸感。
       1. **温柔的颠覆（理论重构）**：用温柔的语言抛出一个反常识的心理学/社会学理论，打破固有认知。（约50-60字）。
       2. **引用心理学的案例来辅助证明观点**：描述一个**真实且具体**的场景，细节要生动有温度。（约60-80字）。
       3. **灵魂的共振（犀利升华）**：最后一段进行哲学/灵性层面的总结，**必须包含一句振聋发聩的金句**，并用 ** ** 完整地加粗这句话。（约50-60字）。
     - **绝对禁止**使用“我认为”、“我觉得”等主观词汇。所有观点必须基于客观理论或公认的真理。
4. 图片7（结语）：
   - 标题：# 写在最后
   - 引用：使用引用符号 >，写一句能概括全篇、直击灵魂的治愈金句（必须注明作者）。
   - 内容：
     1. **情感升华**：用“温柔而坚定”的笔触统领全文，给母亲们一个巨大的“心理拥抱”。提供极高的情绪价值，告诉她们：接纳自己的局限，也是一种伟大的母爱。（约60-80字）。
     2. **荣格式提问**：文案最后**必须包含一个犀利深刻、直指人心的提问**。想象如果是荣格读完这篇文章，他会如何发问？这个问题要穿透母爱的表象，直击潜意识深处的阴影或未完成的情结，引发读者灵魂震颤的自我反思（例如：“你是在爱孩子，还是在通过孩子填补那个从未被爱过的自己？”）。

返回格式严格如下（JSON数组，共7项）：
[
  "# 封面标题\\n\\n> 金句...\\n\\n独白内容...",
  "## 维度一：...\\n\\n> 金句...\\n\\n正文段落1...\\n\\n正文段落2...\\n\\n正文段落3...",
  "## 维度二：...\\n\\n> 金句...\\n\\n正文段落1...\\n\\n正文段落2...\\n\\n正文段落3...",
  "## 维度三：...\\n\\n> 金句...\\n\\n正文段落1...\\n\\n正文段落2...\\n\\n正文段落3...",
  "## 维度四：...\\n\\n> 金句...\\n\\n正文段落1...\\n\\n正文段落2...\\n\\n正文段落3...",
  "## 维度五：...\\n\\n> 金句...\\n\\n正文段落1...\\n\\n正文段落2...\\n\\n正文段落3...",
  "# 写在最后\\n\\n> 金句...\\n\\n结语内容..."
]`,
          },
          {
            role: "user",
            content: title,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error("API 请求失败")
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    let cards: string[]
    try {
      // Remove markdown code blocks (more robust regex)
      let cleanContent = content.trim();
      // Try to extract content between ```json and ``` or just ``` and ```
      // This handles cases where there might be text before/after or specific language tags
      const codeBlockMatch = cleanContent.match(/```(?:json|markdown)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        cleanContent = codeBlockMatch[1].trim();
      } else {
        // Fallback: just remove any ```json or ``` sequences
        cleanContent = cleanContent.replace(/```(?:json|markdown)?/g, "").trim();
      }
      
      cards = JSON.parse(cleanContent)
      
      // Simple validation: if too many cards, try to merge based on headings
      if (cards.length > 10) {
          console.warn("Received too many cards, attempting to merge based on markdown headers");
          const mergedCards: string[] = [];
          let currentCard = "";
          
          cards.forEach((chunk) => {
              const trimmed = chunk.trim();
              // If it looks like a new card (starts with # or ##), push old one and start new
              if (trimmed.startsWith("# ") || trimmed.startsWith("## ")) {
                  if (currentCard) mergedCards.push(currentCard);
                  currentCard = trimmed;
              } else {
                  // Otherwise append to current
                  currentCard = currentCard ? currentCard + "\n\n" + trimmed : trimmed;
              }
          });
          if (currentCard) mergedCards.push(currentCard);
          
          if (mergedCards.length > 0) {
              cards = mergedCards;
          }
      }
    } catch (e) {
      console.error("JSON parse error, attempting fallback split", e)
      // Fallback: split by double newlines if JSON parsing fails, but try to keep structure
      // Improve fallback to split only on Headers that look like card starts
      const parts = content.split(/\n+(?=# |## )/);
      cards = parts.filter((p: string) => p.trim().length > 0);
    }

    // Ensure it's always an array
    if (!Array.isArray(cards)) {
      cards = [String(cards)]
    }

    return NextResponse.json({ cards })
  } catch (error) {
    console.error("Generate error:", error)
    return NextResponse.json({ error: "生成失败，请重试" }, { status: 500 })
  }
}
