import { bunnyPostJson } from './bunnyHttpUtil.js';
import { appNameToStagePath, getAppUrl } from './pathUtil.js';
import { DECENT_TOOLS_VERSION } from './toolVersionUtil.js';

const EDGE_RULE_DESCRIPTION = `${DECENT_TOOLS_VERSION}. Hand-edit at your own risk!`

function _getAppOriginEdgeRulePatternMatch(pullZoneDomainName, appName) {
  return `${getAppUrl(pullZoneDomainName, appName)}*`;
}

function _isPatternMatchInEdgeRule(edgeRule, patternMatch) {
  for (let triggerI = 0; triggerI < edgeRule.Triggers.length; ++triggerI) {
    const trigger = edgeRule.Triggers[triggerI];
    for (let patternI = 0; patternI < trigger.PatternMatches.length; ++patternI) {
      const pm = trigger.PatternMatches[patternI];
      if (pm === patternMatch) return true;
    }
  }
  return false;
}

/*
  Exports
*/

export function findAppOriginEdgeRule(edgeRules, pullZoneDomainName, appName) {
  const patternMatch = _getAppOriginEdgeRulePatternMatch(pullZoneDomainName, appName);
  for(let i = 0; i < edgeRules.length; ++i) {
    const edgeRule = edgeRules[i];
    const { ActionType, Triggers } = edgeRule;
    if (ActionType !== 2 || Triggers.length < 1) continue;
    
    // I'll check for any of the triggers and pattern matches to match the URL. Even though I need the edge rule to 
    // follow a more specific form before I can override it, I want to return the non-conforming edge rule to give 
    // caller a chance to notice the danger of overwriting. It's also possible for more than one app origin rule to
    // match, but that would be a misconfiguration that needs to be manually fixed.
    if(_isPatternMatchInEdgeRule(edgeRule, patternMatch)) return edgeRule;
  }
  return null;
}

// Does this app-origin edge rule follow the expected form that this code expects? null if yes, or text describing non-conformancy if no.
// To keep this check from being too complicated, I look for the following:
// * Was this rule at least created by Decent Tools (description matches an expected string)? If not, then non-conformant.
// * Are there signs of configuring the rule manually to specify additional criteria or behavior? If yes, then non-conformant.
export function detectAppOriginEdgeRuleNonConformance(edgeRule) {
  const { ActionType:actionType, Triggers:triggers, Enabled:isEnabled, Description:description } = edgeRule;
  if (!description || description.indexOf(EDGE_RULE_DESCRIPTION) === -1) return 'edge rule is missing a description that indicates it was created by Decent Tools.'
  if (actionType !== 2) return `edge rule should have action type of 2 (OriginUrl) instead of ${actionType}.`;
  if (triggers.length !== 1) return `edge rule should have 1 trigger instead of ${triggers.length}.`;
  if (triggers[0].PatternMatches.length !== 1) return `edge rule should have 1 pattern match for its trigger instead of ${triggers[0].PatternMatches.length}.`
  if (!isEnabled) return `edge rule has been disabled, signalling manual configuration that could be important to retain.`;
}

export function createAppOriginEdgeRule(guid, appName, pullZoneDomainName, originDomainName, productionVersion) {
  const originUrl = `https://${originDomainName}${appNameToStagePath(appName)}${productionVersion}/%{Path.1-}`;
  const requestUrlPatternMatch = _getAppOriginEdgeRulePatternMatch(pullZoneDomainName,appName);
  const edgeRule = {
    Guid: guid,
    ActionType: 2,
    TriggerMatchingType: 0,
    Enabled: true,
    ActionParameter1: originUrl,
    Description: `${appName} - ${EDGE_RULE_DESCRIPTION}`,
    Triggers: [{
      Type: 0,
      PatternMatchingType: 0,
      PatternMatches: [requestUrlPatternMatch]
    }]
  };
  return edgeRule;
}

export async function writeEdgeRule(pullZoneId, edgeRule) {
  const urlPath = `/pullzone/${pullZoneId}/edgerules/addOrUpdate`;
  await bunnyPostJson(urlPath, edgeRule);
}