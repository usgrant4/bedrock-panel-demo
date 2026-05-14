/**
 * Resolves the 360 view of an asset for the agent.
 *
 * Input: an asset external id (e.g. ASSET-50101).
 * Output: a JSON string containing customer, asset, contract, and recent
 * telemetry, plus a handful of flat flags the agent can branch on directly
 * (warrantyActive, customerHasOpenCriticalFault, serviceTier).
 *
 * Map note for the panel: in production, this is the work Data Cloud
 * identity resolution + the calculated insights surface would do
 * declaratively. Here it's one Apex method against custom objects so the
 * panel can read it.
 */
public with sharing class BedrockAssetContext {

    public class Request {
        @InvocableVariable(required=true label='Asset Id' description='External asset id, e.g. ASSET-50101')
        public String assetId;
    }

    public class Response {
        @InvocableVariable(label='Asset Found' description='True if the asset was resolved.')
        public Boolean found;

        @InvocableVariable(label='Customer Id' description='External customer id for this asset.')
        public String customerId;

        @InvocableVariable(label='Customer Name')
        public String customerName;

        @InvocableVariable(label='Service Tier' description='Platinum / Gold / Silver / Bronze.')
        public String serviceTier;

        @InvocableVariable(label='Warranty Active' description='True if the asset is currently in active warranty.')
        public Boolean warrantyActive;

        @InvocableVariable(label='Contract Id' description='Active contract id on this asset, if any.')
        public String contractId;

        @InvocableVariable(label='Annual Contract Value USD')
        public Decimal annualContractValueUsd;

        @InvocableVariable(label='Open Critical Faults 30d' description='Count of open Critical faults on this customer in the last 30 days.')
        public Integer openCriticalFaults30d;

        @InvocableVariable(label='ARR At Risk USD' description='Sum of annual contract value across active contracts on faulted assets for this customer.')
        public Decimal arrAtRiskUsd;

        @InvocableVariable(label='Context JSON' description='Full asset 360 as a JSON string. Use this when the agent needs detail beyond the flat fields.')
        public String contextJson;
    }

    @InvocableMethod(label='Get Asset Context'
                     description='Resolve customer, asset, contract, recent telemetry, and headline KPIs for a given Bedrock asset id.'
                     callout=false)
    public static List<Response> execute(List<Request> requests) {
        List<Response> out = new List<Response>();
        for (Request r : requests) {
            out.add(resolve(r.assetId));
        }
        return out;
    }

    @TestVisible
    private static Response resolve(String assetExtId) {
        Response resp = new Response();
        resp.found = false;

        List<Bedrock_Asset__c> assets = [
            SELECT Id, Asset_Id__c, Name, Model__c, Model_Class__c, Serial_Number__c,
                   Engine_Hours__c, Contract_Status__c, Warranty_Status__c,
                   Operating_Status__c, Location__c, Latitude__c, Longitude__c,
                   Customer__c, Customer__r.Customer_Id__c, Customer__r.Account_Name__c,
                   Customer__r.Account_Tier__c, Customer__r.Service_Tier__c,
                   Customer__r.Primary_Contact_Name__c, Customer__r.Primary_Contact_Email__c
            FROM Bedrock_Asset__c
            WHERE Asset_Id__c = :assetExtId
            LIMIT 1
        ];
        if (assets.isEmpty()) {
            resp.contextJson = JSON.serialize(new Map<String, Object>{
                'error' => 'Asset ' + assetExtId + ' not found.'
            });
            return resp;
        }
        Bedrock_Asset__c a = assets[0];

        Bedrock_Service_Contract__c contract;
        List<Bedrock_Service_Contract__c> contracts = [
            SELECT Id, Contract_Id__c, Contract_Tier__c, Term_Months__c,
                   Start_Date__c, End_Date__c, Annual_Value_USD__c, Status__c
            FROM Bedrock_Service_Contract__c
            WHERE Asset__c = :a.Id
            ORDER BY Start_Date__c DESC
            LIMIT 1
        ];
        if (!contracts.isEmpty()) {
            contract = contracts[0];
        }

        List<Bedrock_Telemetry_Event__c> recent = [
            SELECT Id, Event_Id__c, Fault_Code__c, Severity__c, Event_Timestamp__c,
                   Resolution_Status__c, Resolved_Timestamp__c,
                   RPM__c, Coolant_Temp_C__c, Hydraulic_Pressure_PSI__c, Description__c
            FROM Bedrock_Telemetry_Event__c
            WHERE Asset__c = :a.Id
            ORDER BY Event_Timestamp__c DESC
            LIMIT 10
        ];

        // Customer-level metrics.
        DateTime cutoff = DateTime.now().addDays(-30);
        Integer openCrit = [
            SELECT COUNT()
            FROM Bedrock_Telemetry_Event__c
            WHERE Asset__r.Customer__c = :a.Customer__c
              AND Severity__c = 'Critical'
              AND Resolution_Status__c = 'Open'
              AND Event_Timestamp__c >= :cutoff
        ];

        // ARR at risk: active contracts on assets currently faulted for this customer.
        Set<Id> faultedAssetIds = new Set<Id>();
        for (AggregateResult ar : [
            SELECT Asset__c assetId
            FROM Bedrock_Telemetry_Event__c
            WHERE Asset__r.Customer__c = :a.Customer__c
              AND Severity__c = 'Critical'
              AND Resolution_Status__c = 'Open'
              AND Event_Timestamp__c >= :cutoff
            GROUP BY Asset__c
        ]) {
            faultedAssetIds.add((Id) ar.get('assetId'));
        }
        Decimal arrAtRisk = 0;
        if (!faultedAssetIds.isEmpty()) {
            for (AggregateResult ar : [
                SELECT SUM(Annual_Value_USD__c) total
                FROM Bedrock_Service_Contract__c
                WHERE Asset__c IN :faultedAssetIds
                  AND Status__c = 'Active'
            ]) {
                Decimal total = (Decimal) ar.get('total');
                if (total != null) arrAtRisk = total;
            }
        }

        resp.found = true;
        resp.customerId = a.Customer__r.Customer_Id__c;
        resp.customerName = a.Customer__r.Account_Name__c;
        resp.serviceTier = a.Customer__r.Service_Tier__c;
        resp.warrantyActive = (a.Warranty_Status__c == 'Active');
        resp.contractId = (contract != null) ? contract.Contract_Id__c : null;
        resp.annualContractValueUsd = (contract != null) ? contract.Annual_Value_USD__c : null;
        resp.openCriticalFaults30d = openCrit;
        resp.arrAtRiskUsd = arrAtRisk;

        Map<String, Object> ctx = new Map<String, Object>{
            'asset' => new Map<String, Object>{
                'asset_id' => a.Asset_Id__c, 'model' => a.Model__c,
                'model_class' => a.Model_Class__c, 'serial_number' => a.Serial_Number__c,
                'engine_hours' => a.Engine_Hours__c,
                'contract_status' => a.Contract_Status__c,
                'warranty_status' => a.Warranty_Status__c,
                'operating_status' => a.Operating_Status__c,
                'location' => a.Location__c
            },
            'customer' => new Map<String, Object>{
                'customer_id' => a.Customer__r.Customer_Id__c,
                'account_name' => a.Customer__r.Account_Name__c,
                'account_tier' => a.Customer__r.Account_Tier__c,
                'service_tier' => a.Customer__r.Service_Tier__c,
                'primary_contact_name' => a.Customer__r.Primary_Contact_Name__c,
                'primary_contact_email' => a.Customer__r.Primary_Contact_Email__c
            },
            'contract' => (contract == null) ? null : new Map<String, Object>{
                'contract_id' => contract.Contract_Id__c,
                'contract_tier' => contract.Contract_Tier__c,
                'start_date' => String.valueOf(contract.Start_Date__c),
                'end_date' => String.valueOf(contract.End_Date__c),
                'annual_value_usd' => contract.Annual_Value_USD__c,
                'status' => contract.Status__c
            },
            'recent_faults' => recentToList(recent),
            'kpis' => new Map<String, Object>{
                'open_critical_faults_30d' => openCrit,
                'arr_at_risk_usd' => arrAtRisk
            }
        };
        resp.contextJson = JSON.serialize(ctx);
        return resp;
    }

    private static List<Map<String, Object>> recentToList(List<Bedrock_Telemetry_Event__c> events) {
        List<Map<String, Object>> rows = new List<Map<String, Object>>();
        for (Bedrock_Telemetry_Event__c e : events) {
            rows.add(new Map<String, Object>{
                'event_id' => e.Event_Id__c,
                'fault_code' => e.Fault_Code__c,
                'severity' => e.Severity__c,
                'timestamp' => String.valueOf(e.Event_Timestamp__c),
                'resolution_status' => e.Resolution_Status__c,
                'description' => e.Description__c
            });
        }
        return rows;
    }
}
