const agent = require('../ai/agent');

class ChatService {
  async handleChat(userProfile, conversationHistory, message) {
    try {
      // Retrieve relevant policy chunks based on the question
      const retrievalQuery = `${message} ${agent.buildUserContext(userProfile)}`;
      const retrieved = await agent.retrievePolicyChunks(retrievalQuery, 5);

      // Generate response using the agent
      const response = await agent.generateResponse(
        userProfile,
        conversationHistory,
        message,
        retrieved.chunks
      );

      return {
        response,
        retrievedChunks: retrieved.chunks.length,
        sources: retrieved.metadata.map(m => ({
          policyName: m.policy_name,
          insurer: m.insurer
        }))
      };
    } catch (error) {
      console.error('Chat service error:', error);
      throw error;
    }
  }
}

module.exports = new ChatService();
