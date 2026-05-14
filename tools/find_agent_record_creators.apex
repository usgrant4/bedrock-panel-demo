// Shows who has been creating Bedrock_Service_Case__c and Bedrock_Warranty_Claim__c
// records in the last 24h, grouped by creator. Distinguishes whether the customer
// agent (running as bedrock_customer_service@...ext) is actually executing its
// open_service_case / stage_warranty_claim tools.
//
// Run with:
//   sf apex run --target-org SForg --file tools/find_agent_record_creators.apex
DateTime since = DateTime.now().addDays(-1);

System.debug(LoggingLevel.INFO, '=== Bedrock_Service_Case__c in last 24h ===');
for (AggregateResult ar : [
    SELECT CreatedBy.Username uname, COUNT(Id) cnt, MAX(CreatedDate) latest
    FROM Bedrock_Service_Case__c
    WHERE CreatedDate >= :since
    GROUP BY CreatedBy.Username
    ORDER BY COUNT(Id) DESC
]) {
    System.debug(LoggingLevel.INFO,
        ar.get('cnt') + ' case(s) by ' + ar.get('uname') + ' (latest ' + ar.get('latest') + ')');
}

System.debug(LoggingLevel.INFO, '=== Bedrock_Warranty_Claim__c in last 24h ===');
for (AggregateResult ar : [
    SELECT CreatedBy.Username uname, COUNT(Id) cnt, MAX(CreatedDate) latest
    FROM Bedrock_Warranty_Claim__c
    WHERE CreatedDate >= :since
    GROUP BY CreatedBy.Username
    ORDER BY COUNT(Id) DESC
]) {
    System.debug(LoggingLevel.INFO,
        ar.get('cnt') + ' claim(s) by ' + ar.get('uname') + ' (latest ' + ar.get('latest') + ')');
}
