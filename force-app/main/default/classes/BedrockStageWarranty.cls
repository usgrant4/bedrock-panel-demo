/**
 * Stages a warranty claim against an active contract. Trust posture:
 * Autonomous in the trust matrix — staging is the action that closes the
 * 72-hour entitlement window per KB §5. Submission is still recommend.
 *
 * Map note: in production this is a MuleSoft staging call to WARRANTY-7,
 * with the staged record visible to a service manager for review.
 */
public with sharing class BedrockStageWarranty {

    public class Request {
        @InvocableVariable(required=true label='Asset Id')
        public String assetId;

        @InvocableVariable(required=true label='Fault Code')
        public String faultCode;

        @InvocableVariable(required=true label='Contract Id' description='External service contract id (CON-50101).')
        public String contractId;

        @InvocableVariable(required=true label='Estimated Cost USD')
        public Decimal estimatedCostUsd;

        @InvocableVariable(label='Notes')
        public String notes;
    }

    public class Response {
        @InvocableVariable(label='Claim Id')
        public Id claimId;

        @InvocableVariable(label='Claim Number')
        public String claimNumber;

        @InvocableVariable(label='Status')
        public String status;
    }

    @InvocableMethod(label='Stage Warranty Claim'
                     description='Stage a warranty claim for service-manager review. Per KB §5, must occur within 72h of fault detection.'
                     callout=false)
    public static List<Response> execute(List<Request> requests) {
        Set<String> assetIds = new Set<String>();
        Set<String> contractIds = new Set<String>();
        for (Request r : requests) {
            if (r.assetId != null) assetIds.add(r.assetId);
            if (r.contractId != null) contractIds.add(r.contractId);
        }

        Map<String, Id> assetIdByExt = new Map<String, Id>();
        for (Bedrock_Asset__c a : [SELECT Id, Asset_Id__c FROM Bedrock_Asset__c WHERE Asset_Id__c IN :assetIds]) {
            assetIdByExt.put(a.Asset_Id__c, a.Id);
        }
        Map<String, Id> contractIdByExt = new Map<String, Id>();
        for (Bedrock_Service_Contract__c c : [SELECT Id, Contract_Id__c FROM Bedrock_Service_Contract__c WHERE Contract_Id__c IN :contractIds]) {
            contractIdByExt.put(c.Contract_Id__c, c.Id);
        }

        List<Bedrock_Warranty_Claim__c> toInsert = new List<Bedrock_Warranty_Claim__c>();
        for (Request r : requests) {
            toInsert.add(new Bedrock_Warranty_Claim__c(
                Claim_Status__c = 'Staged',
                Asset__c = assetIdByExt.get(r.assetId),
                Fault_Code__c = r.faultCode,
                Service_Contract__c = contractIdByExt.get(r.contractId),
                Estimated_Cost_USD__c = r.estimatedCostUsd,
                Notes__c = String.isBlank(r.notes)
                    ? 'Agent-prepared. Requires service-manager review before submission.'
                    : r.notes
            ));
        }
        insert as user toInsert;

        Map<Id, Bedrock_Warranty_Claim__c> reread = new Map<Id, Bedrock_Warranty_Claim__c>([
            SELECT Id, Name, Claim_Status__c FROM Bedrock_Warranty_Claim__c WHERE Id IN :toInsert
        ]);

        List<Response> out = new List<Response>();
        for (Bedrock_Warranty_Claim__c c : toInsert) {
            Bedrock_Warranty_Claim__c rr = reread.get(c.Id);
            Response resp = new Response();
            resp.claimId = rr.Id;
            resp.claimNumber = rr.Name;
            resp.status = rr.Claim_Status__c;
            out.add(resp);
        }
        return out;
    }
}
