const agent = require('../ai/agent');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class RecommendationService {
  buildRetrievalQuery(userProfile) {
    const conditions = Array.isArray(userProfile.conditions) 
      ? userProfile.conditions.join(', ') 
      : userProfile.conditions;

    return `Health insurance policy for:
Age: ${userProfile.age}
Pre-existing conditions: ${conditions}
Lifestyle: ${userProfile.lifestyle}
Income: ${userProfile.incomeBand}
City: ${userProfile.cityTier}
Looking for coverage details, premiums, waiting periods, inclusions, exclusions, and benefits.`;
  }

  calculateSuitabilityScore(userProfile, policyText) {
    // Simple scoring logic based on user profile
    let score = 50; // Base score

    const age = parseInt(userProfile.age);
    const conditions = Array.isArray(userProfile.conditions) 
      ? userProfile.conditions 
      : [userProfile.conditions];
    
    const policyLower = policyText.toLowerCase();

    // Age-based scoring
    if (age < 30 && policyLower.includes('young')) score += 10;
    if (age >= 30 && age < 50 && policyLower.includes('family')) score += 10;
    if (age >= 50 && policyLower.includes('senior')) score += 10;

    // Condition coverage
    conditions.forEach(condition => {
      if (condition !== 'None' && policyLower.includes(condition.toLowerCase())) {
        score += 15;
      }
    });

    // Lifestyle matching
    if (userProfile.lifestyle === 'Athlete' && policyLower.includes('sports')) score += 5;
    if (userProfile.lifestyle === 'Sedentary' && policyLower.includes('wellness')) score += 5;

    // Income matching
    if (userProfile.incomeBand === 'under 3L' && policyLower.includes('affordable')) score += 10;
    if (userProfile.incomeBand === '15L+' && policyLower.includes('premium')) score += 10;

    return Math.min(score, 95); // Cap at 95
  }

  async generateRecommendation(userProfile) {
    try {
      // Step 1: Retrieve relevant policy chunks
      const query = this.buildRetrievalQuery(userProfile);
      const retrieved = await agent.retrievePolicyChunks(query, 10);

      if (retrieved.chunks.length === 0) {
        throw new Error('No policy documents found. Please upload policy documents first.');
      }

      // Step 2: Build context from retrieved chunks
      const policyContext = retrieved.chunks
        .map((chunk, idx) => {
          const meta = retrieved.metadata[idx];
          return `[${meta.policy_name} by ${meta.insurer}]\n${chunk}`;
        })
        .join('\n\n---\n\n');

      // Step 3: Generate structured recommendation
      const userContext = agent.buildUserContext(userProfile);
      
      // Use mock recommendation if API quota exceeded
      if (process.env.USE_MOCK_EMBEDDINGS === 'true') {
        return this.generateMockRecommendation(userProfile, retrieved);
      }

      const recommendationPrompt = `Based on the user profile and retrieved policy documents, generate a comprehensive insurance recommendation.

${userContext}

Retrieved Policy Information:
${policyContext}

Generate a JSON response with the following structure:
{
  "peerComparison": [
    {
      "policyName": "string",
      "insurer": "string",
      "premium": "string (e.g., ₹15,000/year)",
      "coverAmount": "string (e.g., ₹5 Lakhs)",
      "waitingPeriod": "string (e.g., 30 days)",
      "keyBenefit": "string (one key benefit)",
      "suitabilityScore": number (0-100)
    }
  ],
  "recommendedPolicy": {
    "policyName": "string",
    "insurer": "string",
    "coverageDetails": {
      "inclusions": ["string"],
      "exclusions": ["string"],
      "subLimits": ["string"],
      "coPayPercentage": "string",
      "claimType": "string (e.g., Cashless/Reimbursement)"
    }
  },
  "whyThisPolicy": "string (150-250 words explaining why this policy suits the user, referencing at least 3 user inputs: age, conditions, income, lifestyle, or city tier)"
}

CRITICAL: Only use information from the retrieved policy documents. If specific details are not available, use general terms like "As per policy terms" or "Subject to policy conditions".`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an insurance recommendation expert. Generate accurate, grounded recommendations based only on provided policy documents.' },
          { role: 'user', content: recommendationPrompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const recommendation = JSON.parse(response.choices[0].message.content);

      // Add metadata
      recommendation.generatedAt = new Date().toISOString();
      recommendation.userProfile = userProfile;
      recommendation.sourcesUsed = retrieved.metadata.map(m => ({
        policyName: m.policy_name,
        insurer: m.insurer
      }));

      return recommendation;
    } catch (error) {
      console.error('Recommendation service error:', error);
      throw error;
    }
  }

  generateMockRecommendation(userProfile, retrieved) {
    // Extract unique policies from retrieved chunks
    const policiesMap = new Map();
    retrieved.metadata.forEach(meta => {
      if (!policiesMap.has(meta.policy_name)) {
        policiesMap.set(meta.policy_name, meta);
      }
    });
    
    const policies = Array.from(policiesMap.values()).slice(0, 3);
    
    // Generate peer comparison
    const peerComparison = policies.map((policy, idx) => {
      const baseScore = 70 + (idx * 5);
      const score = this.calculateSuitabilityScore(userProfile, retrieved.chunks.join(' '));
      
      return {
        policyName: policy.policy_name,
        insurer: policy.insurer,
        premium: idx === 0 ? "₹15,000/year" : idx === 1 ? "₹28,000/year" : "₹35,000/year",
        coverAmount: idx === 0 ? "₹5 Lakhs" : idx === 1 ? "₹10 Lakhs" : "₹7 Lakhs",
        waitingPeriod: "30 days general, 24 months pre-existing",
        keyBenefit: idx === 0 ? "Diabetes management program" : idx === 1 ? "Zero room rent capping" : "Senior citizen focused",
        suitabilityScore: Math.min(score + (idx * 5), 95)
      };
    });

    // Sort by suitability score
    peerComparison.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    const recommendedPolicy = policies[0];
    const conditions = Array.isArray(userProfile.conditions) ? userProfile.conditions.join(', ') : userProfile.conditions;

    return {
      peerComparison,
      recommendedPolicy: {
        policyName: recommendedPolicy.policy_name,
        insurer: recommendedPolicy.insurer,
        coverageDetails: {
          inclusions: [
            "Hospitalization expenses (room, boarding, nursing)",
            "Pre and post hospitalization (60-90 days)",
            "Daycare procedures",
            "Ambulance charges",
            "AYUSH treatment"
          ],
          exclusions: [
            "Cosmetic surgery",
            "Dental treatment (unless accident-related)",
            "Self-inflicted injuries",
            "War and nuclear risks"
          ],
          subLimits: [
            "Room rent: ₹5,000 per day",
            "ICU charges: ₹10,000 per day"
          ],
          coPayPercentage: "10% for all claims",
          claimType: "Cashless and Reimbursement"
        }
      },
      whyThisPolicy: `Based on your profile, we recommend ${recommendedPolicy.policy_name} by ${recommendedPolicy.insurer}. At age ${userProfile.age}, with ${conditions}, and living in a ${userProfile.cityTier} city with an income of ${userProfile.incomeBand}, this policy offers the best value. Your ${userProfile.lifestyle} lifestyle is well-supported with wellness programs. The policy includes specialized diabetes and hypertension management programs with reduced waiting periods. The premium is affordable for your income bracket, and the ${userProfile.cityTier} location provides access to extensive network hospitals for cashless treatment. The comprehensive coverage includes pre and post hospitalization, daycare procedures, and AYUSH treatments, making it ideal for managing chronic conditions like yours.`,
      generatedAt: new Date().toISOString(),
      userProfile,
      sourcesUsed: policies.map(p => ({
        policyName: p.policy_name,
        insurer: p.insurer
      }))
    };
  }
}

module.exports = new RecommendationService();
