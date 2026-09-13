import { NextResponse } from "next/server";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";

export const runtime = "nodejs";

const MODEL = process.env.BEDROCK_MODEL_ID || "us.anthropic.claude-sonnet-4-6";

function client() {
  return new AnthropicBedrock({ awsRegion: process.env.AWS_REGION || "us-east-1" });
}

const SYSTEM_PROMPT = `你是杰圆职场教育的专业职业规划顾问，帮助用户解答职业发展相关的问题。请用简洁专业的语言回答，并给出实用的建议。
我们提供的服务包括：职业规划指导、简历优化服务、面试辅导培训。
如果要咨询费用问题，让他们添加微信：
电话：17318011997
微信：HELENLAN998`;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const message = await client().messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const textBlock = message.content.find((b) => b.type === "text");

    return NextResponse.json({
      message: textBlock?.type === "text" ? textBlock.text : "",
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 },
    );
  }
}
