/**
 * Stages a warranty claim against an active contract. Trust posture:
 * Autonomous in the trust matrix — staging is the action that closes the
 * 72-hour entitlement window per KB Section 5. Submission is still recommend.
 *
 * The eligibility gate lives HERE, not in the agent's prompt. Staging is
 * autonomous only because it is bounded: a claim may be staged when the asset
 * resolves and its warranty is Active, and not otherwise. Leaving that rule to
 * the planner makes it probabilistic — an agent that has just triaged a
 * Platinum in-warranty asset will, often enough to matter, carry that
 * entitlement onto the next asset and stage a claim against an expired
 * warranty. Enforcing it in Apex makes the refusal deterministic and identical
 * across every surface that can invoke this action: Lightning, the Agent API,
 * a Flow, or a future MCP tool call.
 *
 * Map note: in production this is a MuleSoft staging call to WARRANTY-7,
 * with the staged record visible to a service manager for review.
 */
public with sharing class BedrockStageWarranty {

    @TestVisible
    private static final String DECLINE_NO_ASSET = 'Declined — asset not found.';
    @TestVisible
    private static final String DECLINE_NO_WARRANTY = 'Declined — warranty is not active on this asset.';

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

        @InvocableVariable(label='Staged' description='True only if a claim record was actually created.')
        public Boolean staged;

        @InvocableVariable(label='Reason' description='Why the claim was declined. Report this to the user verbatim; do not stage by another route.')
        public String reason;
    }

    @InvocableMethod(label='Stage Warranty Claim'
                     description='Stage a warranty claim for service-manager review, but only when the asset resolves and its warranty is Active. Declines otherwise and returns the reason. Per KB Section 5, staging must occur within 72h of fault detection.'
                     callout=false)
    public static List<Response> execute(List<Request> requests) {
        Set<String> assetIds = new Set<String>();
        Set<String> contractIds = new Set<String>();
        for (Request r : requests) {
            if (r.assetId != null) assetIds.add(r.assetId);
            if (r.contractId != null) contractIds.add(r.contractId);
        }

        // Warranty_Status__c is read here, not taken from the request: the
        // caller does not get to assert its own entitlement.
        Map<String, Bedrock_Asset__c> assetByExt = new Map<String, Bedrock_Asset__c>();
        for (Bedrock_Asset__c a : [
            SELECT Id, Asset_Id__c, Warranty_Status__c
            FROM Bedrock_Asset__c
            WHERE Asset_Id__c IN :assetIds
        ]) {
            assetByExt.put(a.Asset_Id__c, a);
        }
        Map<String, Id> contractIdByExt = new Map<String, Id>();
        for (Bedrock_Service_Contract__c c : [
            SELECT Id, Contract_Id__c FROM Bedrock_Service_Contract__c WHERE Contract_Id__c IN :contractIds
        ]) {
            contractIdByExt.put(c.Contract_Id__c, c.Id);
        }

        // Build responses positionally so a mixed batch keeps request order:
        // an ineligible asset must not shift the result of an eligible one.
        List<Response> out = new List<Response>();
        List<Bedrock_Warranty_Claim__c> toInsert = new List<Bedrock_Warranty_Claim__c>();
        List<Integer> insertIndexes = new List<Integer>();

        for (Integer i = 0; i < requests.size(); i++) {
            Request r = requests[i];
            Response resp = new Response();
            resp.staged = false;
            out.add(resp);

            Bedrock_Asset__c asset = assetByExt.get(r.assetId);
            if (asset == null) {
                resp.status = DECLINE_NO_ASSET;
                resp.reason = DECLINE_NO_ASSET;
                continue;
            }
            if (asset.Warranty_Status__c != 'Active') {
                resp.status = DECLINE_NO_WARRANTY;
                resp.reason = DECLINE_NO_WARRANTY
                    + ' Warranty status on ' + r.assetId + ' is '
                    + String.valueOf(asset.Warranty_Status__c) + '.';
                continue;
            }

            toInsert.add(new Bedrock_Warranty_Claim__c(
                Claim_Status__c = 'Staged',
                Asset__c = asset.Id,
                Fault_Code__c = r.faultCode,
                Service_Contract__c = contractIdByExt.get(r.contractId),
                Estimated_Cost_USD__c = r.estimatedCostUsd,
                Notes__c = String.isBlank(r.notes)
                    ? 'Agent-prepared. Requires service-manager review before submission.'
                    : r.notes
            ));
            insertIndexes.add(i);
        }

        if (toInsert.isEmpty()) {
            return out;
        }

        insert as user toInsert;

        Map<Id, Bedrock_Warranty_Claim__c> reread = new Map<Id, Bedrock_Warranty_Claim__c>([
            SELECT Id, Name, Claim_Status__c FROM Bedrock_Warranty_Claim__c WHERE Id IN :toInsert
        ]);

        for (Integer n = 0; n < toInsert.size(); n++) {
            Bedrock_Warranty_Claim__c rr = reread.get(toInsert[n].Id);
            Response resp = out[insertIndexes[n]];
            resp.claimId = rr.Id;
            resp.claimNumber = rr.Name;
            resp.status = rr.Claim_Status__c;
            resp.staged = true;
        }
        return out;
    }
}
