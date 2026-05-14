import type { VercelRequest, VercelResponse } from '@vercel/node';
import { soqlQuery, lightningUrlFor } from './_sf-client.js';

interface ServiceCaseRecord {
  Id: string;
  Name: string;
  Subject__c?: string | null;
  Description__c?: string | null;
  Fault_Code__c?: string | null;
  Status__c?: string | null;
  Priority__c?: string | null;
  Origin__c?: string | null;
  Source_Event_Id__c?: string | null;
  CreatedDate: string;
  LastModifiedDate?: string | null;
  Customer__r?: {
    Account_Name__c?: string | null;
    Customer_Id__c?: string | null;
    Service_Tier__c?: string | null;
    Account_Tier__c?: string | null;
    Primary_Contact_Name__c?: string | null;
    Primary_Contact_Email__c?: string | null;
  } | null;
  Asset__r?: {
    Asset_Id__c?: string | null;
    Model__c?: string | null;
    Model_Class__c?: string | null;
    Serial_Number__c?: string | null;
    Warranty_Status__c?: string | null;
    Operating_Status__c?: string | null;
    Location__c?: string | null;
  } | null;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const records = await soqlQuery<ServiceCaseRecord>(`
      SELECT Id, Name, Subject__c, Description__c, Fault_Code__c, Status__c, Priority__c,
             Origin__c, Source_Event_Id__c, CreatedDate, LastModifiedDate,
             Customer__r.Account_Name__c, Customer__r.Customer_Id__c, Customer__r.Service_Tier__c,
             Customer__r.Account_Tier__c, Customer__r.Primary_Contact_Name__c, Customer__r.Primary_Contact_Email__c,
             Asset__r.Asset_Id__c, Asset__r.Model__c, Asset__r.Model_Class__c, Asset__r.Serial_Number__c,
             Asset__r.Warranty_Status__c, Asset__r.Operating_Status__c, Asset__r.Location__c
      FROM Bedrock_Service_Case__c
      ORDER BY CreatedDate DESC
      LIMIT 5
    `);
    const enriched = records.map((r) => ({
      ...r,
      lightningUrl: lightningUrlFor('Bedrock_Service_Case__c', r.Id),
    }));
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ records: enriched });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
