import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TranslateRequest, SupportedLanguage } from "@/types/localization";
import { SUPPORTED_LANGUAGES } from "@/types/localization";

// Simple translation cache to reduce API calls
const translationCache = new Map<string, { translation: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// POST - Translate text
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: TranslateRequest = await request.json();

    // Validate request
    if (!body.text || body.text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    if (!body.targetLanguage) {
      return NextResponse.json(
        { error: "Target language is required" },
        { status: 400 }
      );
    }

    if (!SUPPORTED_LANGUAGES[body.targetLanguage]) {
      return NextResponse.json(
        { error: "Unsupported target language" },
        { status: 400 }
      );
    }

    if (body.sourceLanguage && !SUPPORTED_LANGUAGES[body.sourceLanguage]) {
      return NextResponse.json(
        { error: "Unsupported source language" },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `${body.text}:${body.sourceLanguage || "auto"}:${body.targetLanguage}`;
    const cached = translationCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        originalText: body.text,
        translatedText: cached.translation,
        sourceLanguage: body.sourceLanguage || "en",
        targetLanguage: body.targetLanguage,
        confidence: 0.95,
        cached: true,
      });
    }

    // Check if we have this translation in the database
    const { data: existingTranslation } = await supabase
      .from("chat_translations")
      .select("translated_text, source_language")
      .eq("original_text", body.text)
      .eq("target_language", body.targetLanguage)
      .single();

    if (existingTranslation) {
      // Cache it
      translationCache.set(cacheKey, {
        translation: existingTranslation.translated_text,
        timestamp: Date.now(),
      });

      return NextResponse.json({
        originalText: body.text,
        translatedText: existingTranslation.translated_text,
        sourceLanguage: existingTranslation.source_language as SupportedLanguage,
        targetLanguage: body.targetLanguage,
        confidence: 0.9,
        cached: true,
      });
    }

    // For now, we'll implement a simple mock translation
    // In production, you would integrate with:
    // - Google Cloud Translation API
    // - DeepL API
    // - OpenAI GPT for contextual translations
    // - Amazon Translate

    const translatedText = mockTranslate(
      body.text,
      body.sourceLanguage || "en",
      body.targetLanguage,
      body.context
    );

    // Detect source language (simplified)
    const detectedSourceLanguage = body.sourceLanguage || detectLanguage(body.text);

    // Store translation in database for future use
    await supabase.from("chat_translations").insert({
      original_text: body.text,
      translated_text: translatedText,
      source_language: detectedSourceLanguage,
      target_language: body.targetLanguage,
      context: body.context || "general",
      confidence: 0.85,
    });

    // Cache the translation
    translationCache.set(cacheKey, {
      translation: translatedText,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      originalText: body.text,
      translatedText,
      sourceLanguage: detectedSourceLanguage,
      targetLanguage: body.targetLanguage,
      confidence: 0.85,
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Failed to translate text" },
      { status: 500 }
    );
  }
}

// Simple language detection (would use ML in production)
function detectLanguage(text: string): SupportedLanguage {
  // Check for common patterns
  const patterns: [RegExp, SupportedLanguage][] = [
    [/[\u4e00-\u9fff]/, "zh"], // Chinese characters
    [/[\u3040-\u309f\u30a0-\u30ff]/, "ja"], // Japanese hiragana/katakana
    [/[\uac00-\ud7af]/, "ko"], // Korean hangul
    [/[\u0600-\u06ff]/, "ar"], // Arabic
    [/[\u0900-\u097f]/, "hi"], // Hindi/Devanagari
    [/[\u0400-\u04ff]/, "ru"], // Cyrillic (Russian)
    [/[\u0e00-\u0e7f]/, "th"], // Thai
  ];

  for (const [pattern, lang] of patterns) {
    if (pattern.test(text)) {
      return lang;
    }
  }

  // Default to English
  return "en";
}

// Mock translation function (replace with real API in production)
function mockTranslate(
  text: string,
  sourceLang: SupportedLanguage,
  targetLang: SupportedLanguage,
  context?: string
): string {
  // If source and target are the same, return original
  if (sourceLang === targetLang) {
    return text;
  }

  // Common gaming phrases translations (simplified example)
  const commonPhrases: Record<string, Record<SupportedLanguage, string>> = {
    "gg": {
      en: "good game", es: "buen juego", pt: "bom jogo", fr: "bien joué",
      de: "gutes Spiel", it: "bella partita", ru: "хорошая игра", zh: "打得好",
      ja: "グッドゲーム", ko: "굿겜", ar: "لعبة جيدة", hi: "अच्छा खेल",
      tr: "iyi oyun", pl: "dobra gra", nl: "goed gespeeld", th: "เล่นได้ดี",
      vi: "chơi hay", id: "main bagus",
    },
    "let's go": {
      en: "let's go", es: "vamos", pt: "vamos", fr: "allons-y",
      de: "los geht's", it: "andiamo", ru: "погнали", zh: "走起",
      ja: "行くぞ", ko: "가자", ar: "هيا بنا", hi: "चलो",
      tr: "haydi", pl: "chodźmy", nl: "kom op", th: "ไปกัน",
      vi: "đi thôi", id: "ayo",
    },
    "nice shot": {
      en: "nice shot", es: "buen tiro", pt: "bom tiro", fr: "beau tir",
      de: "guter Schuss", it: "bel colpo", ru: "отличный выстрел", zh: "好枪",
      ja: "ナイスショット", ko: "나이스샷", ar: "تصويب رائع", hi: "अच्छा शॉट",
      tr: "güzel atış", pl: "dobry strzał", nl: "mooi schot", th: "ยิงเก่ง",
      vi: "bắn đẹp", id: "tembakan bagus",
    },
  };

  // Check for common phrases
  const lowerText = text.toLowerCase();
  for (const [phrase, translations] of Object.entries(commonPhrases)) {
    if (lowerText === phrase) {
      return translations[targetLang] || text;
    }
  }

  // For demo purposes, add a marker to show translation happened
  // In production, this would call a real translation API
  const langName = SUPPORTED_LANGUAGES[targetLang].nativeName;
  return `[${langName}] ${text}`;
}

// GET - Get translation history for a message
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");
    const originalText = searchParams.get("text");
    const targetLanguage = searchParams.get("targetLanguage");

    if (!originalText || !targetLanguage) {
      return NextResponse.json(
        { error: "text and targetLanguage are required" },
        { status: 400 }
      );
    }

    const { data: translation } = await supabase
      .from("chat_translations")
      .select("*")
      .eq("original_text", originalText)
      .eq("target_language", targetLanguage)
      .single();

    return NextResponse.json({ translation: translation || null });
  } catch (error) {
    console.error("Get translation error:", error);
    return NextResponse.json(
      { error: "Failed to get translation" },
      { status: 500 }
    );
  }
}
