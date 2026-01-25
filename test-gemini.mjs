import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const client = new GoogleGenerativeAI(apiKey);

async function test() {
  try {
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say 'Gemini is working!'");
    console.log("✅ Gemini API is working!");
    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("❌ Gemini API error:", error);
  }
}

test();