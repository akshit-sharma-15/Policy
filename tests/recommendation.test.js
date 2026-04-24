require('dotenv').config();
const recommendationService = require('../services/recommendationService');

describe('RecommendationService', () => {
  describe('buildRetrievalQuery', () => {
    it('should build a proper query from user profile', () => {
      const userProfile = {
        age: 35,
        conditions: ['Diabetes', 'Hypertension'],
        lifestyle: 'Moderate',
        incomeBand: '8-15L',
        cityTier: 'Metro'
      };

      const query = recommendationService.buildRetrievalQuery(userProfile);

      expect(query).toContain('35');
      expect(query).toContain('Diabetes');
      expect(query).toContain('Hypertension');
      expect(query).toContain('Moderate');
      expect(query).toContain('8-15L');
      expect(query).toContain('Metro');
    });

    it('should handle single condition string', () => {
      const userProfile = {
        age: 25,
        conditions: 'None',
        lifestyle: 'Active',
        incomeBand: 'under 3L',
        cityTier: 'Tier-2'
      };

      const query = recommendationService.buildRetrievalQuery(userProfile);

      expect(query).toContain('None');
      expect(query).toContain('Active');
    });
  });

  describe('calculateSuitabilityScore', () => {
    it('should calculate higher score for matching conditions', () => {
      const userProfile = {
        age: 40,
        conditions: ['Diabetes'],
        lifestyle: 'Moderate',
        incomeBand: '8-15L',
        cityTier: 'Metro'
      };

      const policyText = 'This policy covers diabetes with no waiting period for pre-existing conditions';
      const score = recommendationService.calculateSuitabilityScore(userProfile, policyText);

      expect(score).toBeGreaterThan(50);
    });

    it('should not exceed maximum score of 95', () => {
      const userProfile = {
        age: 25,
        conditions: ['Diabetes', 'Hypertension'],
        lifestyle: 'Athlete',
        incomeBand: '15L+',
        cityTier: 'Metro'
      };

      const policyText = 'Young diabetes hypertension sports premium family senior affordable wellness';
      const score = recommendationService.calculateSuitabilityScore(userProfile, policyText);

      expect(score).toBeLessThanOrEqual(95);
    });

    it('should return base score for no matches', () => {
      const userProfile = {
        age: 30,
        conditions: ['None'],
        lifestyle: 'Sedentary',
        incomeBand: '3-8L',
        cityTier: 'Tier-3'
      };

      const policyText = 'Basic health insurance policy';
      const score = recommendationService.calculateSuitabilityScore(userProfile, policyText);

      expect(score).toBeGreaterThanOrEqual(50);
    });
  });
});
