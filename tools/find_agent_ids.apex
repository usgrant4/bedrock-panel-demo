// Prints the Bot Ids (18-char) for the Bedrock agents.
// Run with:
//   sf apex run --target-org SForg --file tools/find_agent_ids.apex
//
// The 18-char Id is what /api/agent-session expects in AGENT_ID /
// AGENT_ID_CUSTOMER env vars on Vercel.
//
// Note: the SObject is BotDefinition (Bot is Tooling-only). The Id returned
// here is the same Id the Agent API expects — keyprefix 0Xx.
for (BotDefinition b : [SELECT Id, DeveloperName, MasterLabel FROM BotDefinition
                        WHERE DeveloperName IN ('Bedrock_Service_Triage', 'Bedrock_Customer_Service')
                        ORDER BY DeveloperName]) {
    System.debug(LoggingLevel.INFO, b.DeveloperName + '  ->  ' + b.Id + '  (' + b.MasterLabel + ')');
}
