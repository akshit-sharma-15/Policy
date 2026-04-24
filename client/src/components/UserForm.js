import React, { useState } from 'react';
import axios from 'axios';

const CONDITIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Cardiac', 'None', 'Other'];
const LIFESTYLES = ['Sedentary', 'Moderate', 'Active', 'Athlete'];
const INCOME_BANDS = ['under 3L', '3-8L', '8-15L', '15L+'];
const CITY_TIERS = ['Metro', 'Tier-2', 'Tier-3'];

function UserForm({ onRecommendation, loading, setLoading }) {
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    lifestyle: '',
    conditions: [],
    incomeBand: '',
    cityTier: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleConditionChange = (condition) => {
    setFormData(prev => {
      const conditions = prev.conditions.includes(condition)
        ? prev.conditions.filter(c => c !== condition)
        : [...prev.conditions, condition];
      return { ...prev, conditions };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.fullName || !formData.age || !formData.lifestyle || 
        formData.conditions.length === 0 || !formData.incomeBand || !formData.cityTier) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/user/recommend', formData);
      onRecommendation(formData, response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get recommendation. Please ensure policy documents are uploaded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Get Your Personalized Insurance Recommendation</h2>
      
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fullName">Full Name *</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="age">Age *</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="Enter your age"
            min="18"
            max="100"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="lifestyle">Lifestyle *</label>
          <select
            id="lifestyle"
            name="lifestyle"
            value={formData.lifestyle}
            onChange={handleChange}
            required
          >
            <option value="">Select lifestyle</option>
            {LIFESTYLES.map(ls => (
              <option key={ls} value={ls}>{ls}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Pre-existing Conditions * (Select all that apply)</label>
          <div className="checkbox-group">
            {CONDITIONS.map(condition => (
              <div key={condition} className="checkbox-item">
                <input
                  type="checkbox"
                  id={condition}
                  checked={formData.conditions.includes(condition)}
                  onChange={() => handleConditionChange(condition)}
                />
                <label htmlFor={condition}>{condition}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="incomeBand">Income Band *</label>
          <select
            id="incomeBand"
            name="incomeBand"
            value={formData.incomeBand}
            onChange={handleChange}
            required
          >
            <option value="">Select income band</option>
            {INCOME_BANDS.map(band => (
              <option key={band} value={band}>{band}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="cityTier">City Tier *</label>
          <select
            id="cityTier"
            name="cityTier"
            value={formData.cityTier}
            onChange={handleChange}
            required
          >
            <option value="">Select city tier</option>
            {CITY_TIERS.map(tier => (
              <option key={tier} value={tier}>{tier}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Analyzing...' : 'Get Recommendation'}
        </button>
      </form>
    </div>
  );
}

export default UserForm;
