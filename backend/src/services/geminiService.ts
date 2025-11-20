import { GoogleGenAI } from '@google/genai';
import { requireGeminiKey } from '../config/env';
import { RuleResult } from '../types/rule';

let genAI: GoogleGenAI | null = null;

const getClient = () => {
  if (!genAI) {
    const apiKey = requireGeminiKey();
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

const buildPrompt = (rule: string, documentText: string): string => {
  return `You are a document compliance checker. Your task is to evaluate whether a PDF document satisfies a specific rule.

Rule to check: "${rule}"

Document text:
${documentText}

Instructions:
1. Determine if the document satisfies the rule. Output "pass" or "fail".
2. Extract ONE sentence from the document as evidence (or "No evidence found" if fail).
3. Provide brief reasoning (1-2 sentences).
4. Assign a confidence score from 0 to 100.

You MUST respond with valid JSON in this exact format:
{
  "rule": "${rule}",
  "status": "pass or fail",
  "evidence": "exact sentence from document or 'No evidence found'",
  "reasoning": "brief explanation",
  "confidence": 85
}

Respond ONLY with the JSON object, no additional text.`;
};

const parseGeminiResponse = (responseText: string, rule: string): RuleResult => {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      rule: rule,
      status: parsed.status === 'pass' ? 'pass' : 'fail',
      evidence: String(parsed.evidence || 'No evidence found'),
      reasoning: String(parsed.reasoning || 'Unable to determine'),
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 50)),
    };
  } catch (error) {
    return {
      rule,
      status: 'fail',
      evidence: 'Error parsing LLM response',
      reasoning: 'The AI response could not be parsed correctly',
      confidence: 0,
    };
  }
};

export const evaluateRuleWithGemini = async (rule: string, documentText: string): Promise<RuleResult> => {
  try {
    const client = getClient();
    const prompt = buildPrompt(rule, documentText);
    
    const result = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = result.text || '';

    return parseGeminiResponse(text, rule);
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      rule,
      status: 'fail',
      evidence: 'API request failed',
      reasoning: 'Unable to connect to Gemini API or process request',
      confidence: 0,
    };
  }
};

export const evaluateRules = async (rules: string[], documentText: string): Promise<RuleResult[]> => {
  const results = await Promise.all(rules.map((rule) => evaluateRuleWithGemini(rule, documentText)));
  return results;
};
