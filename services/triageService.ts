import { ActionLogEntry, TriageRule, TriageAction } from '../types';

const MIN_ACTIONS_FOR_RULE = 3;

/**
 * Analyzes the user's action log to find patterns and suggest a new triage rule.
 * @param log The user's action log.
 * @param activeRules The currently active rules, to avoid re-suggesting.
 * @returns A new TriageRule to suggest, or null if no pattern is found.
 */
export const detectRuleFromLog = (log: ActionLogEntry[], activeRules: TriageRule[]): Omit<TriageRule, 'id'> | null => {
  if (log.length < MIN_ACTIONS_FOR_RULE) {
    return null;
  }

  const senderActions = new Map<string, TriageAction[]>();

  // Group actions by sender
  log.forEach(entry => {
    if (!senderActions.has(entry.sender)) {
      senderActions.set(entry.sender, []);
    }
    senderActions.get(entry.sender)!.push(entry.action);
  });

  // Find a sender with a clear pattern
  for (const [sender, actions] of senderActions.entries()) {
    if (actions.length >= MIN_ACTIONS_FOR_RULE) {
      const firstAction = actions[0];
      // Check if all actions for this sender are the same
      const allSameAction = actions.every(a => a === firstAction);

      if (allSameAction) {
        const newRule = { sender, action: firstAction };

        // Check if this rule already exists
        const ruleExists = activeRules.some(
          r => r.sender === newRule.sender && r.action === newRule.action
        );

        if (!ruleExists) {
          console.log(`Triage Service: Detected potential rule:`, newRule);
          return newRule;
        }
      }
    }
  }

  return null;
};
