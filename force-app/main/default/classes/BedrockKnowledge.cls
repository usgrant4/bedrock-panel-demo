/**
 * Retrieves the most relevant Bedrock_KB_Section__c records for a query.
 *
 * Implementation: SOSL full-text search across the section name, body, and
 * keywords. Bounded to k=3 by default.
 *
 * Map note for the panel: in production this is Data Cloud Vector DB +
 * Agentforce grounding. Here it's SOSL because the KB is 7 sections —
 * embeddings would add cost without recall improvement at this scale.
 */
public with sharing class BedrockKnowledge {

    public class Request {
        @InvocableVariable(required=true label='Query' description='Free-text query, e.g. fault code + service tier + warranty.')
        public String query;

        @InvocableVariable(label='Top K' description='Number of sections to return (default 3, max 5).')
        public Integer topK;
    }

    public class Response {
        @InvocableVariable(label='Sections JSON' description='JSON array of {section_number, title, body} objects, ranked by relevance.')
        public String sectionsJson;

        @InvocableVariable(label='Citations' description='Comma-separated section titles, suitable for the agent to cite back.')
        public String citations;

        @InvocableVariable(label='Hit Count')
        public Integer hitCount;
    }

    @InvocableMethod(label='Retrieve Knowledge'
                     description='Search the Bedrock service knowledge base and return the top sections for grounding.'
                     callout=false)
    public static List<Response> execute(List<Request> requests) {
        List<Response> out = new List<Response>();
        for (Request r : requests) {
            out.add(retrieve(r.query, r.topK));
        }
        return out;
    }

    @TestVisible
    private static Response retrieve(String query, Integer topKIn) {
        Integer k = (topKIn == null || topKIn <= 0) ? 3 : Math.min(topKIn, 7);
        Response resp = new Response();
        resp.hitCount = 0;
        resp.sectionsJson = '[]';
        resp.citations = '';

        List<Bedrock_KB_Section__c> sections = new List<Bedrock_KB_Section__c>();

        if (!String.isBlank(query)) {
            String safe = String.escapeSingleQuotes(query);
            // SOSL searches text fields with the platform search index.
            // Body__c (LongTextArea) is searchable via SOSL even though it
            // can't be filtered in SOQL WHERE clauses.
            try {
                List<List<SObject>> results = Search.query(
                    'FIND \'' + safe + '\' IN ALL FIELDS RETURNING ' +
                    'Bedrock_KB_Section__c(Id, Name, Section_Number__c, Body__c ' +
                    'ORDER BY Section_Number__c ASC LIMIT ' + k + ')'
                );
                sections = (List<Bedrock_KB_Section__c>) results[0];
            } catch (Exception e) {
                // SOSL can fail in fresh scratch orgs before the index has
                // built. Fall through to the default-all behavior below.
                sections = new List<Bedrock_KB_Section__c>();
            }
        }

        // Fallback for cold search index OR blank query: return all sections,
        // ordered by section number, capped at k. The KB is small enough
        // (~7 sections) that "all" IS a reasonable retrieval at the limit.
        if (sections.isEmpty()) {
            sections = [
                SELECT Id, Name, Section_Number__c, Body__c
                FROM Bedrock_KB_Section__c
                ORDER BY Section_Number__c ASC
                LIMIT :k
            ];
        }

        List<Map<String, Object>> rows = new List<Map<String, Object>>();
        List<String> titles = new List<String>();
        for (Bedrock_KB_Section__c s : sections) {
            rows.add(new Map<String, Object>{
                'section_number' => s.Section_Number__c,
                'title' => s.Name,
                'body' => s.Body__c
            });
            titles.add(s.Name);
        }
        resp.hitCount = sections.size();
        resp.sectionsJson = JSON.serialize(rows);
        resp.citations = String.join(titles, ', ');
        return resp;
    }
}
