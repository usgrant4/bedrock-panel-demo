/**
 * Proves the warranty gate is enforced in Apex rather than in the agent's
 * prompt. The panel question this answers is "how do you know your trust
 * matrix isn't theatre?" — the answer is that the refusal is deterministic
 * and testable, independent of whatever the planner decided to believe.
 */
@IsTest
private class BedrockStageWarrantyTest {

    private static Bedrock_Asset__c makeAsset(String extId, String warrantyStatus) {
        Bedrock_Customer__c cust = new Bedrock_Customer__c(
            Customer_Id__c = 'CUST-T' + extId.right(4),
            Account_Name__c = 'Test Account ' + extId,
            Service_Tier__c = 'Platinum'
        );
        insert cust;

        Bedrock_Asset__c asset = new Bedrock_Asset__c(
            Asset_Id__c = extId,
            Customer__c = cust.Id,
            Warranty_Status__c = warrantyStatus,
            Contract_Status__c = 'Active'
        );
        insert asset;

        insert new Bedrock_Service_Contract__c(
            Contract_Id__c = 'CON-T' + extId.right(4),
            Customer__c = cust.Id,
            Asset__c = asset.Id,
            Status__c = 'Active',
            Annual_Value_USD__c = 100000
        );
        return asset;
    }

    private static BedrockStageWarranty.Request req(String assetId) {
        BedrockStageWarranty.Request r = new BedrockStageWarranty.Request();
        r.assetId = assetId;
        r.faultCode = 'HYD-447';
        r.contractId = 'CON-T' + assetId.right(4);
        r.estimatedCostUsd = 12000;
        return r;
    }

    @IsTest
    static void stagesWhenWarrantyActive() {
        makeAsset('ASSET-90001', 'Active');

        Test.startTest();
        List<BedrockStageWarranty.Response> out =
            BedrockStageWarranty.execute(new List<BedrockStageWarranty.Request>{ req('ASSET-90001') });
        Test.stopTest();

        System.assertEquals(true, out[0].staged, 'Active warranty should stage a claim');
        System.assertNotEquals(null, out[0].claimNumber, 'A staged claim should return its number');
        System.assertEquals(1, [SELECT COUNT() FROM Bedrock_Warranty_Claim__c], 'Exactly one claim expected');
    }

    @IsTest
    static void declinesWhenWarrantyExpired() {
        makeAsset('ASSET-90002', 'Expired');

        Test.startTest();
        List<BedrockStageWarranty.Response> out =
            BedrockStageWarranty.execute(new List<BedrockStageWarranty.Request>{ req('ASSET-90002') });
        Test.stopTest();

        System.assertEquals(false, out[0].staged, 'Expired warranty must not stage');
        System.assertEquals(null, out[0].claimId, 'No claim record should exist');
        System.assert(out[0].reason.contains('warranty is not active'),
            'Decline reason should name the warranty, got: ' + out[0].reason);
        System.assertEquals(0, [SELECT COUNT() FROM Bedrock_Warranty_Claim__c],
            'No claim may be written for an out-of-warranty asset');
    }

    @IsTest
    static void declinesWhenAssetUnknown() {
        Test.startTest();
        List<BedrockStageWarranty.Response> out =
            BedrockStageWarranty.execute(new List<BedrockStageWarranty.Request>{ req('ASSET-99999') });
        Test.stopTest();

        System.assertEquals(false, out[0].staged, 'Unknown asset must not stage');
        System.assert(out[0].reason.contains('asset not found'),
            'Decline reason should name the asset, got: ' + out[0].reason);
        System.assertEquals(0, [SELECT COUNT() FROM Bedrock_Warranty_Claim__c], 'No orphan claim may be written');
    }

    /**
     * The agent batches actions, so an ineligible asset sitting next to an
     * eligible one must not shift which response belongs to which request.
     */
    @IsTest
    static void mixedBatchKeepsRequestOrderAndGatesIndividually() {
        makeAsset('ASSET-90003', 'Expired');
        makeAsset('ASSET-90004', 'Active');

        Test.startTest();
        List<BedrockStageWarranty.Response> out = BedrockStageWarranty.execute(
            new List<BedrockStageWarranty.Request>{ req('ASSET-90003'), req('ASSET-90004') }
        );
        Test.stopTest();

        System.assertEquals(2, out.size(), 'One response per request');
        System.assertEquals(false, out[0].staged, 'Expired asset stays declined in a mixed batch');
        System.assertEquals(true, out[1].staged, 'Active asset still stages in a mixed batch');
        System.assertEquals(1, [SELECT COUNT() FROM Bedrock_Warranty_Claim__c], 'Only the eligible one is written');

        Bedrock_Warranty_Claim__c written = [SELECT Asset__r.Asset_Id__c FROM Bedrock_Warranty_Claim__c LIMIT 1];
        System.assertEquals('ASSET-90004', written.Asset__r.Asset_Id__c, 'The claim belongs to the in-warranty asset');
    }
}
