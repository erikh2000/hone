import { bunnyPostJson } from './bunnyHttpUtil.js';
import { appNameToStagePath, getAppUrl, getPullZoneDomainName, pullZoneToHostNames } from './pathUtil.js';
import { DECENT_TOOLS_VERSION } from './toolVersionUtil.js';
import { purgeApp, purgeLandingUrl } from './purgeUtil.js';

const EDGE_RULE_DESCRIPTION = `${DECENT_TOOLS_VERSION}. Hand-edit at your own risk!`
const APPEND_APP_SLASH_EDGE_RULE_DESCRIPTION = `Append app slash - ${EDGE_RULE_DESCRIPTION}`;

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

function _getAppSlashRedirectUrl(pullZoneDomainName) {
  return `https://${pullZoneDomainName}/%{Path.0-}/`;
}

function _getAppSlashPatternMatchUrl(pullZoneDomainName, appName) {
  return `https://${pullZoneDomainName}/${appName}`;
}

function _findAppendAppSlashEdgeRule(edgeRules, pullZoneDomainName) {
  const redirectUrl = _getAppSlashRedirectUrl(pullZoneDomainName);
  for(let i = 0; i < edgeRules.length; ++i) {
    const edgeRule = edgeRules[i];
    const { ActionType:actionType, ActionParameter1:actionParameter1 } = edgeRule;
    if (actionType === 1 && actionParameter1 === redirectUrl) return edgeRule;
  }
  return null;
}

function _detectAppendAppSlashEdgeRuleNonConformance(edgeRule, pullZoneDomainName) {
  const redirectUrl = _getAppSlashRedirectUrl(pullZoneDomainName);
  const { ActionType:actionType, Triggers:triggers, ActionParameter1:actionParameter1, Enabled:isEnabled, Description:description } = edgeRule;
  if (!description || description.indexOf(EDGE_RULE_DESCRIPTION) === -1) return 'edge rule is missing a description that indicates it was created by Decent Tools.'
  if (actionType !== 1) return `edge rule should have action type of 1 (Redirect) instead of ${actionType}.`;
  if (actionParameter1 !== redirectUrl) return `edge rule has an unexpected redirect URL of ${actionParameter1}.`;
  if (triggers.length !== 1) return `edge rule should have 1 trigger instead of ${triggers.length}.`;
  if (!isEnabled) return `edge rule has been disabled, signalling manual configuration that could be important to retain.`;
}

// appendAppSlashEdgeRule will be conformant.
function _doesAppendAppSlashEdgeRuleForAppExist(appendAppSlashEdgeRule, pullZoneDomainName, appName) {
  const patternMatchUrl = _getAppSlashPatternMatchUrl(pullZoneDomainName, appName);
  const { Triggers:triggers } = appendAppSlashEdgeRule;
  const { PatternMatches:patternMatches } = triggers[0];
  return patternMatches.includes(patternMatchUrl);
}

// appendAppSlashEdgeRule will be conformant. It will not already contain a pattern match for appName.
function  _createAppendAppSlashEdgeRule(appendAppSlashEdgeRule, pullZoneDomainName, appName) {
  const patternMatchUrl = _getAppSlashPatternMatchUrl(pullZoneDomainName, appName);
  const redirectUrl = _getAppSlashRedirectUrl(pullZoneDomainName);
  const { Triggers:triggers, Guid:guid } = appendAppSlashEdgeRule;
  const { PatternMatches:patternMatches } = triggers[0];
  if (patternMatches.includes(patternMatchUrl)) throw Error('Unexpected');
  patternMatches.push(patternMatchUrl);

  const edgeRule = {
    Guid: guid,
    ActionType: 1,
    TriggerMatchingType: 0,
    Enabled: true,
    ActionParameter1: redirectUrl,
    Description: APPEND_APP_SLASH_EDGE_RULE_DESCRIPTION,
    Triggers: [{
      Type: 0,
      PatternMatchingType: 0,
      PatternMatches: patternMatches
    }]
  };
  return edgeRule;
}

function _findAppOriginEdgeRule(edgeRules, pullZoneDomainName, appName) {
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
function _detectAppOriginEdgeRuleNonConformance(edgeRule) {
  const { ActionType:actionType, Triggers:triggers, Enabled:isEnabled, Description:description } = edgeRule;
  if (!description || description.indexOf(EDGE_RULE_DESCRIPTION) === -1) return 'edge rule is missing a description that indicates it was created by Decent Tools.'
  if (actionType !== 2) return `edge rule should have action type of 2 (OriginUrl) instead of ${actionType}.`;
  if (triggers.length !== 1) return `edge rule should have 1 trigger instead of ${triggers.length}.`;
  if (triggers[0].PatternMatches.length !== 1) return `edge rule should have 1 pattern match for its trigger instead of ${triggers[0].PatternMatches.length}.`
  if (!isEnabled) return `edge rule has been disabled, signalling manual configuration that could be important to retain.`;
}

function _createAppOriginEdgeRule(guid, appName, pullZoneDomainName, originDomainName, productionVersion) {
  const originUrl = `https://${originDomainName}${appNameToStagePath(appName)}${productionVersion}/%{Path.1-}`;
  const requestUrlPatternMatch = _getAppOriginEdgeRulePatternMatch(pullZoneDomainName,appName);
  const edgeRule = {
    Guid: guid,
    ActionType: 2,
    TriggerMatchingType: 0,
    Enabled: true,
    ActionParameter1: originUrl,
    Description: `${appName} app origin - ${EDGE_RULE_DESCRIPTION}`,
    Triggers: [{
      Type: 0,
      PatternMatchingType: 0,
      PatternMatches: [requestUrlPatternMatch]
    }]
  };
  return edgeRule;
}

async function _writeEdgeRule(pullZoneId, edgeRule) {
  const urlPath = `/pullzone/${pullZoneId}/edgerules/addOrUpdate`;
  await bunnyPostJson(urlPath, edgeRule);
}

/*
  Exports
*/

export async function setAppOrigin(pullZone, appName, productionVersion) {
  const { hostName:pullZoneDomainName, systemHostName:originDomainName } = pullZoneToHostNames(pullZone);
  const { EdgeRules:edgeRules, Id:pullZoneId } = pullZone;
  const edgeRule = _findAppOriginEdgeRule(edgeRules, pullZoneDomainName, appName);
  if (edgeRule) {
    const nonconformReason = _detectAppOriginEdgeRuleNonConformance(edgeRule);
    if (nonconformReason) throw Error(`Unwilling to overwrite existing app origin edge rule for ${pullZoneDomainName}/${appName} because ${nonconformReason}.`);
  }
  const guid = edgeRule?.Guid;
  const nextEdgeRule = _createAppOriginEdgeRule(guid, appName, pullZoneDomainName, originDomainName, productionVersion);
  await _writeEdgeRule(pullZoneId, nextEdgeRule);
  await purgeApp(getAppUrl(pullZoneDomainName, appName));
}

// Idempotent. When browsing to an URL like https://example.com/app, I want it to redirect to https://example.com/app/. 
// An "append app slash" edge rule is created/updated as needed to accomplish this.
export async function addAppendAppSlashConditionAsNeeded(pullZone, appName) {
  const pullZoneDomainName = getPullZoneDomainName(pullZone);
  const { EdgeRules:edgeRules, Id:pullZoneId } = pullZone;
  const edgeRule = _findAppendAppSlashEdgeRule(edgeRules, pullZoneDomainName);
  if (edgeRule) {
    const nonconformReason = _detectAppendAppSlashEdgeRuleNonConformance(edgeRule, pullZoneDomainName);
    if (nonconformReason) throw Error(`Unwilling to update existing append app slash edge rule for ${pullZoneDomainName}/${appName} because ${nonconformReason}.`);
    if (_doesAppendAppSlashEdgeRuleForAppExist(edgeRule, pullZoneDomainName, appName)) return;
  }
  const nextEdgeRule = _createAppendAppSlashEdgeRule(edgeRule, pullZoneDomainName, appName);
  await _writeEdgeRule(pullZoneId, nextEdgeRule);
  await purgeLandingUrl(getAppUrl(pullZoneDomainName, appName));
}