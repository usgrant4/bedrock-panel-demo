import type { VercelRequest, VercelResponse } from '@vercel/node';
import { soqlQuery, lightningUrlFor } from './_sf-client.js';

interface WarrantyClaimRecord {
  Id: string;
  Name: string;
  Fault_Code__c?: string | null;
  Claim_Status__c?: string | null;
  Estimated_Cost_USD__c?: number | null;
  CreatedDate: string;
  LastModifiedDate?: string | null;
  Submitted_Timestamp__c?: string | null;
  Notes__c?: string | null;
  Asset__r?: {
    Asset_Id__c?: string | null;
    Model__c?: string | null;
    Model_Class__c?: string | null;
    Serial_Number__c?: string | null;
    Warranty_Status__c?: string | null;
    Customer__r?: {
      Account_Name__c?: string | null;
      Service_Tier__c?: string | null;
    } | null;
  } | null;
  Service_Contract__r?: {
    Contract_Id__c?: string | null;
    Contract_Tier__c?: string | null;
    Annual_Value_USD__c?: number | null;
    Start_Date__c?: string | null;
    End_Date__c?: string | null;
    Status__c?: string | null;
  } | null;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const records = await soqlQuery<WarrantyClaimRecord>(`
      SELECT Id, Name, Fault_Code__c, Claim_Status__c, Estimated_Cost_USD__c, CreatedDate,
             LastModifiedDate, Submitted_Timestamp__c, Notes__c,
             Asset__r.Asset_Id__c, Asset__r.Model__c, Asset__r.Model_Class__c,
             Asset__r.Serial_Number__c, Asset__r.Warranty_Status__c,
             Asset__r.Customer__r.Account_Name__c, Asset__r.Customer__r.Service_Tier__c,
             Service_Contract__r.Contract_Id__c, Service_Contract__r.Contract_Tier__c,
             Service_Contract__r.Annual_Value_USD__c, Service_Contract__r.Start_Date__c,
             Service_Contract__r.End_Date__c, Service_Contract__r.Status__c
      FROM Bedrock_Warranty_Claim__c
      ORDER BY CreatedDate DESC
      LIMIT 5
    `);
    const enriched = records.map((r) => ({
      ...r,
      lightningUrl: lightningUrlFor('Bedrock_Warranty_Claim__c', r.Id),
    }));
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ records: enriched });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
