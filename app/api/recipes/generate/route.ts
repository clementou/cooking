import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { aiRecipeGenerationSchema } from "@/lib/ai/recipe-schema";
import { z } from "zod";

const requestSchema = z.object({
  prompt: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: "OpenAI API key not configured",
          details: "Please add OPENAI_API_KEY to your environment variables"
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { prompt } = requestSchema.parse(body);

    const systemPrompt = `You are a professional chef and recipe developer. Create detailed, practical recipes based on user requests.
    
Guidelines:
- Create authentic, tested recipes with accurate measurements and clear instructions
- Use common ingredients that are easily available
- Provide realistic cooking and prep times
- Include helpful notes and storage instructions when relevant
- For complex recipes, organize into logical sections (e.g., "Dough", "Sauce", "Assembly")
- For simple recipes, use a single "Main" section
- Make instructions clear and detailed enough for home cooks to follow
- Number steps sequentially within each section`;

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: aiRecipeGenerationSchema,
      system: systemPrompt,
      prompt: `Create a recipe based on this request: ${prompt}`,
      temperature: 0.7,
    });

    return NextResponse.json({ recipe: object });
  } catch (error) {
    console.error("Recipe generation error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Check for OpenAI specific errors
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { 
            error: "OpenAI API key issue",
            details: "Please check your OPENAI_API_KEY configuration"
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to generate recipe", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}