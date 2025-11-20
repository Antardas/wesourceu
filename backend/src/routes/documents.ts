import { Router } from 'express';

import { extractTextFromPdf } from '../services/pdfService';
import { evaluateRules } from '../services/geminiService';
import { RuleResult } from '../types/rule';

const parseRules = (rawRules: unknown): string[] => {
  if (Array.isArray(rawRules)) {
    return rawRules.map(String).filter((rule) => rule.trim().length > 0);
  }

  if (typeof rawRules === 'string') {
    try {
      const parsed = JSON.parse(rawRules);

      if (Array.isArray(parsed)) {
        return parsed.map(String).filter((rule) => rule.trim().length > 0);
      }

      return rawRules
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    } catch (error) {
      return rawRules
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    }
  }

  return [];
};

export const documentsRouter = Router();

documentsRouter.post('/validate', async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'PDF file is required' });
    }

    const rules = parseRules(req.body.rules);

    if (rules.length === 0) {
      return res.status(400).json({ message: 'At least one rule is required' });
    }

    const text = await extractTextFromPdf(req.file.buffer);
    const results: RuleResult[] = await evaluateRules(rules, text);

    res.json({ results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to check PDF at this time' });
  }
});
