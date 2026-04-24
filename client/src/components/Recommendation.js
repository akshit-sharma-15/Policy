import React from 'react';

function Recommendation({ recommendation, userProfile, onReset }) {
  const getScoreClass = (score) => {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-medium';
    return 'score-low';
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Your Personalized Recommendation</h2>
          <button onClick={onReset} className="btn-secondary">
            Start New Search
          </button>
        </div>
        
        <p style={{ marginBottom: '1rem', color: '#666' }}>
          Hello {userProfile.fullName}, based on your profile, here's what we recommend:
        </p>
      </div>

      {/* Peer Comparison Table */}
      <div className="card">
        <h2>Policy Comparison</h2>
        <table>
          <thead>
            <tr>
              <th>Policy Name</th>
              <th>Insurer</th>
              <th>Premium</th>
              <th>Cover Amount</th>
              <th>Waiting Period</th>
              <th>Key Benefit</th>
              <th>Suitability</th>
            </tr>
          </thead>
          <tbody>
            {recommendation.peerComparison?.map((policy, idx) => (
              <tr key={idx}>
                <td><strong>{policy.policyName}</strong></td>
                <td>{policy.insurer}</td>
                <td>{policy.premium}</td>
                <td>{policy.coverAmount}</td>
                <td>{policy.waitingPeriod}</td>
                <td>{policy.keyBenefit}</td>
                <td>
                  <span className={`score-badge ${getScoreClass(policy.suitabilityScore)}`}>
                    {policy.suitabilityScore}/100
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recommended Policy Details */}
      {recommendation.recommendedPolicy && (
        <div className="card">
          <h2>Recommended: {recommendation.recommendedPolicy.policyName}</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            by {recommendation.recommendedPolicy.insurer}
          </p>

          <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: '#667eea' }}>
            Coverage Details
          </h3>
          
          <table>
            <tbody>
              <tr>
                <td><strong>Inclusions</strong></td>
                <td>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                    {recommendation.recommendedPolicy.coverageDetails?.inclusions?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </td>
              </tr>
              <tr>
                <td><strong>Exclusions</strong></td>
                <td>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                    {recommendation.recommendedPolicy.coverageDetails?.exclusions?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </td>
              </tr>
              <tr>
                <td><strong>Sub-limits</strong></td>
                <td>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                    {recommendation.recommendedPolicy.coverageDetails?.subLimits?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </td>
              </tr>
              <tr>
                <td><strong>Co-pay</strong></td>
                <td>{recommendation.recommendedPolicy.coverageDetails?.coPayPercentage}</td>
              </tr>
              <tr>
                <td><strong>Claim Type</strong></td>
                <td>{recommendation.recommendedPolicy.coverageDetails?.claimType}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Why This Policy */}
      <div className="card">
        <h2>Why This Policy is Right for You</h2>
        <p style={{ lineHeight: '1.8', color: '#555' }}>
          {recommendation.whyThisPolicy}
        </p>
      </div>

      {/* Sources */}
      {recommendation.sourcesUsed && recommendation.sourcesUsed.length > 0 && (
        <div className="card" style={{ background: '#f8f9fa' }}>
          <h3 style={{ fontSize: '1rem', color: '#666', marginBottom: '0.5rem' }}>
            Data Sources
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#888' }}>
            This recommendation is based on: {' '}
            {recommendation.sourcesUsed.map((s, idx) => (
              <span key={idx}>
                {s.policyName} ({s.insurer})
                {idx < recommendation.sourcesUsed.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}

export default Recommendation;
