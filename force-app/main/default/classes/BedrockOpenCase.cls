/**
 * Opens a service case for a fault. Trust posture: Autonomous in the trust
 * matrix — case open is reversible, audited, and low blast radius.
 *
 * Map note: in production this is standard Case via Apex/Flow, with rules
 * routing to a Service Console queue and Field Service work order
 * generation downstream.
 */
public with sharing class BedrockOpenCase {

    public class Request {
        @InvocableVariable(required=true label='Asset Id' description='External asset id (ASSET-50101).')
        public String assetId;

        @InvocableVariable(required=true label='Customer Id' description='External customer id (CUST-10001).')
        public String customerId;

        @InvocableVariable(required=true label='Fault Code' description='Bedrock fault code (e.g. HYD-447).')
        public String faultCode;

        @InvocableVariable(required=true label='Severity' description='Critical / High / Medium / Low.')
        public String severity;

        @InvocableVariable(required=true label='Description')
        public String description;

        @InvocableVariable(label='Source Event Id' description='Optional pointer to the triggering telemetry event.')
        public String sourceEventId;
    }

    public class Response {
        @InvocableVariable(label='Case Id')
        public Id caseId;

        @InvocableVariable(label='Case Number')
        public String caseNumber;

        @InvocableVariable(label='Subject')
        public String subject;

        @InvocableVariable(label='Status')
        public String status;
    }

    @InvocableMethod(label='Open Service Case'
                     description='Open a Bedrock service case for a fault. Autonomous per trust matrix.'
                     callout=false)
    public static List<Response> execute(List<Request> requests) {
        // Resolve external ids → record ids.
        Set<String> custIds = new Set<String>();
        Set<String> assetIds = new Set<String>();
        for (Request r : requests) {
            if (r.customerId != null) custIds.add(r.customerId);
            if (r.assetId != null) assetIds.add(r.assetId);
        }
        Map<String, Id> custIdByExt = new Map<String, Id>();
        for (Bedrock_Customer__c c : [SELECT Id, Customer_Id__c FROM Bedrock_Customer__c WHERE Customer_Id__c IN :custIds]) {
            custIdByExt.put(c.Customer_Id__c, c.Id);
        }
        Map<String, Id> assetIdByExt = new Map<String, Id>();
        for (Bedrock_Asset__c a : [SELECT Id, Asset_Id__c FROM Bedrock_Asset__c WHERE Asset_Id__c IN :assetIds]) {
            assetIdByExt.put(a.Asset_Id__c, a.Id);
        }

        List<Bedrock_Service_Case__c> toInsert = new List<Bedrock_Service_Case__c>();
        for (Request r : requests) {
            toInsert.add(new Bedrock_Service_Case__c(
                Subject__c = '[' + r.severity + '] ' + r.faultCode + ' — Asset ' + r.assetId,
                Description__c = r.description,
                Type__c = 'Mechanical',
                Priority__c = (r.severity == 'Critical') ? 'High' : 'Medium',
                Status__c = 'New',
                Origin__c = 'Agentforce',
                Customer__c = custIdByExt.get(r.customerId),
                Asset__c = assetIdByExt.get(r.assetId),
                Fault_Code__c = r.faultCode,
                Source_Event_Id__c = r.sourceEventId
            ));
        }
        insert as user toInsert;

        Map<Id, Bedrock_Service_Case__c> reread = new Map<Id, Bedrock_Service_Case__c>([
            SELECT Id, Name, Subject__c, Status__c FROM Bedrock_Service_Case__c WHERE Id IN :toInsert
        ]);

        List<Response> out = new List<Response>();
        for (Bedrock_Service_Case__c c : toInsert) {
            Bedrock_Service_Case__c rr = reread.get(c.Id);
            Response r = new Response();
            r.caseId = rr.Id;
            r.caseNumber = rr.Name;
            r.subject = rr.Subject__c;
            r.status = rr.Status__c;
            out.add(r);
        }
        return out;
    }
}
