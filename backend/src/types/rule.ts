export type RuleResultStatus = 'pass' | 'fail';

export interface RuleResult {
  rule: string;
  status: RuleResultStatus;
  evidence: string;
  reasoning: string;
  confidence: number;
}
