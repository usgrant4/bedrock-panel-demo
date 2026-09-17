/**
 * Deletes the Bedrock cases and warranty claims the agent created TODAY, so a
 * rehearsal doesn't leave rows on the dashboard rail during the real run.
 *
 *   sf apex run --target-org SForg --file tools/reset_rehearsal_records.apex
 *
 * Scoped to CreatedDate = TODAY on purpose: it clears what you just generated
 * while leaving the older seeded/rehearsal history intact. It never touches
 * telemetry, contracts, assets or customers.
 *
 * Run it before the panel, then let the agent write fresh records live — the
 * dashboard's NEW-row pulse keys on CreatedDate recency.
 */
List<Bedrock_Warranty_Claim__c> claims = [
    SELECT Id FROM Bedrock_Warranty_Claim__c WHERE CreatedDate = TODAY
];
List<Bedrock_Service_Case__c> cases = [
    SELECT Id FROM Bedrock_Service_Case__c WHERE CreatedDate = TODAY
];
System.debug('Deleting claims created today: ' + claims.size());
System.debug('Deleting cases created today: ' + cases.size());

// Order is not significant — claims look up to Asset__c and Service_Contract__c,
// never to the case — but both deletes share one transaction, so a failure on
// either rolls the whole thing back rather than half-clearing the rail.
delete claims;
delete cases;

System.debug('Cases remaining: ' + [SELECT COUNT() FROM Bedrock_Service_Case__c]);
System.debug('Claims remaining: ' + [SELECT COUNT() FROM Bedrock_Warranty_Claim__c]);
System.debug('Telemetry (untouched): ' + [SELECT COUNT() FROM Bedrock_Telemetry_Event__c]);
