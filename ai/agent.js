const OpenAI = require('openai');
const vectorStore = require('./vectorStore');
const embeddingService = require('./embeddings');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `You are an empathetic health insurance advisor. Your role is to help users understand insurance policies and make informed decisions.

CRITICAL RULES:
1. ALWAYS base your responses on retrieved policy documents - never make up policy details
2. Use simple, clear language to explain insurance terms
3. Be empathetic and supportive in your tone
4. NEVER provide medical advice or diagnose conditions
5. When explaining policies, reference specific user details (age, conditions, income, lifestyle, city tier)
6. If information is not in the retrieved documents, clearly state that

Your goal is to make insurance understandable and help users feel confident in their choices.`;

class AIAgent {
  async retrievePolicyChunks(query, nResults = 5) {
    try {
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      const results = await vectorStore.query(queryEmbedding, nResults);
      
      return {
        chunks: results.documents,
        metadata: results.metadatas,
        scores: results.distances
      };
    } catch (error) {
      console.error('Error retrieving policy chunks:', error);
      return { chunks: [], metadata: [], scores: [] };
    }
  }

  buildUserContext(userProfile) {
    const conditions = Array.isArray(userProfile.conditions) 
      ? userProfile.conditions.join(', ') 
      : userProfile.conditions;

    return `User Profile:
- Name: ${userProfile.fullName}
- Age: ${userProfile.age}
- Lifestyle: ${userProfile.lifestyle}
- Pre-existing Conditions: ${conditions}
- Income Band: ${userProfile.incomeBand}
- City Tier: ${userProfile.cityTier}`;
  }

  async generateResponse(userProfile, conversationHistory, userMessage, retrievedContext) {
    const userContext = this.buildUserContext(userProfile);
    
    const contextPrompt = retrievedContext && retrievedContext.length > 0
      ? `\n\nRelevant Policy Information:\n${retrievedContext.join('\n\n---\n\n')}`
      : '\n\nNo specific policy information was retrieved for this query.';

    // Use mock response if API quota exceeded
    if (process.env.USE_MOCK_EMBEDDINGS === 'true') {
      return this.generateMockResponse(userProfile, userMessage, retrievedContext);
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: userContext },
      { role: 'system', content: contextPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  generateMockResponse(userProfile, userMessage, retrievedContext) {
    const messageLower = userMessage.toLowerCase();
    
    if (messageLower.includes('waiting period')) {
      return `A waiting period is the time you must wait after purchasing a policy before certain benefits become available. Based on the policies we have:\n\n- Initial waiting period: Typically 30 days for general illnesses\n- Pre-existing conditions: Usually 24-36 months\n- Specific diseases: 12-24 months for conditions like hernia, cataract\n\nFor you at age ${userProfile.age} with ${Array.isArray(userProfile.conditions) ? userProfile.conditions.join(' and ') : userProfile.conditions}, some policies offer reduced waiting periods for chronic conditions. For example, diabetes-related complications may have only 12 months waiting instead of 24 months in specialized plans.`;
    }
    
    if (messageLower.includes('co-pay') || messageLower.includes('copay')) {
      return `Co-payment (co-pay) is the percentage of the claim amount that you need to pay from your own pocket, while the insurance company pays the rest.\n\nFor example, with a 10% co-pay:\n- If your hospital bill is ₹1,00,000\n- You pay ₹10,000 (10%)\n- Insurance pays ₹90,000 (90%)\n\nBased on your profile (age ${userProfile.age}, income ${userProfile.incomeBand}), most policies have 10-20% co-pay. Some premium policies offer zero co-pay for members below 60 years. The co-pay helps keep premiums affordable while encouraging responsible usage of insurance benefits.`;
    }
    
    if (messageLower.includes('diabetes') || messageLower.includes('hypertension')) {
      return `Great question! Since you mentioned ${Array.isArray(userProfile.conditions) ? userProfile.conditions.join(' and ') : userProfile.conditions} in your profile, here's what's typically covered:\n\n**Diabetes Coverage:**\n- Diabetes management programs\n- Glucometer and testing supplies reimbursement\n- Reduced waiting periods (12-24 months)\n- Complications like retinopathy, nephropathy, neuropathy\n- Insulin and medication support\n\n**Hypertension Coverage:**\n- Blood pressure monitoring equipment\n- Cardiac events related to hypertension\n- Medication discounts\n- Wellness programs\n\nAt age ${userProfile.age} in a ${userProfile.cityTier} city, you'll have access to network hospitals with specialized care for these conditions. The key is choosing a policy with comprehensive chronic disease management.`;
    }
    
    if (messageLower.includes('sub-limit') || messageLower.includes('sublimit')) {
      return `Sub-limits are maximum amounts the insurance will pay for specific items within your overall coverage. Common sub-limits include:\n\n**Room Rent:** ₹3,000-₹5,000 per day\n**ICU Charges:** ₹6,000-₹10,000 per day\n**Ambulance:** ₹2,000-₹5,000 per hospitalization\n\nFor your income bracket (${userProfile.incomeBand}), I'd recommend looking for policies with higher or no room rent capping. Some premium policies offer "any room" coverage, meaning no sub-limits on room rent. This is especially important in ${userProfile.cityTier} cities where hospital costs are higher.`;
    }
    
    // Default response
    return `That's a great question! Based on your profile (age ${userProfile.age}, ${userProfile.lifestyle} lifestyle, living in ${userProfile.cityTier}), I can help explain insurance terms in simple language.\n\nThe policies we've analyzed cover various aspects including hospitalization, pre and post-hospitalization care, daycare procedures, and special programs for conditions like ${Array.isArray(userProfile.conditions) ? userProfile.conditions.join(' and ') : userProfile.conditions}.\n\nCould you be more specific about what aspect you'd like to understand better? For example:\n- Waiting periods\n- Co-payment\n- Coverage for your specific conditions\n- Sub-limits\n- Claim process\n\nI'm here to make insurance easy to understand!`;
  }
}

module.exports = new AIAgent();
