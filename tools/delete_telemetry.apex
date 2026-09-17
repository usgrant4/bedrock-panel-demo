/**
 * Clears all Bedrock telemetry events ahead of a pre-demo data refresh.
 *
 *   sf apex run --target-org SForg --file tools/delete_telemetry.apex
 *
 * Why a delete rather than a plain upsert: Event_Id__c embeds the event's own
 * timestamp (EVT-<yyyyMMddHHmm>-<asset>), so re-seeding produces a new set of
 * ids. Upserting on its own would insert the fresh 80 and strand the stale 80.
 *
 * Safe to run: Bedrock_Service_Case__c.Source_Event_Id__c is a text field, not
 * a lookup, so existing cases and warranty claims are unaffected.
 */
List<Bedrock_Telemetry_Event__c> stale = [SELECT Id FROM Bedrock_Telemetry_Event__c];
System.debug('Deleting telemetry events: ' + stale.size());
delete stale;
System.debug('Remaining telemetry events: ' + [SELECT COUNT() FROM Bedrock_Telemetry_Event__c]);
