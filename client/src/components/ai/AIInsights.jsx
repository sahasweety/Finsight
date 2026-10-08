import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../../utils/api';

const AIInsights = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchedRef = useRef(false);
  const inFlightRef = useRef(false);

  const fetchInsights = async (forceRefresh = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      setLoading(true);
      setError(null);

      // Check cache if not forcing refresh
      if (!forceRefresh) {
        const cachedStr = sessionStorage.getItem('finsight_ai_insights');
        if (cachedStr) {
          try {
            const cached = JSON.parse(cachedStr);
            const age = Date.now() - cached.timestamp;
            // 10 minutes cache lifetime
            if (age < 10 * 60 * 1000 && cached.insights) {
              setData(cached.insights);
              setLoading(false);
              return; // Exit early, skipping the API call
            }
          } catch (e) {
            // Ignore parse errors and fetch fresh
          }
        }
      }

      // Fetch fresh data
      const response = await fetchApi('/ai/insights', {
        method: 'POST',
      });
      
      if (response.success) {
        setData(response.insights);
        // Save successful response to cache
        sessionStorage.setItem('finsight_ai_insights', JSON.stringify({
          insights: response.insights,
          timestamp: Date.now()
        }));
      } else {
        setError(response.message || 'Failed to fetch AI insights.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching insights.');
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchInsights(false);
  }, []);

  const getInsightIcon = (type) => {
    switch (type) {
      case 'positive': return '🌟';
      case 'warning': return '⚠️';
      case 'suggestion': return '💡';
      case 'trend': return '📈';
      default: return '📌';
    }
  };

  const getInsightClass = (type) => {
    switch (type) {
      case 'positive': return 'insight-card--positive';
      case 'warning': return 'insight-card--warning';
      case 'suggestion': return 'insight-card--suggestion';
      case 'trend': return 'insight-card--trend';
      default: return '';
    }
  };

  // ── Shared section header (always visible) ──────────────────────────────
  const sectionHeader = (
    <div className="ai-header">
      <div>
        <h3>AI Financial Insights 🤖</h3>
        <p className="dashboard-subtitle">Personalized insights based on your financial activity</p>
      </div>
      {/* Show Refresh button only when data is already present */}
      {data && (
        <button onClick={() => fetchInsights(true)} className="btn-refresh" disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Insights'}
        </button>
      )}
    </div>
  );

  // ── Inner content, keyed by state ────────────────────────────────────────
  let innerContent;

  if (loading && !data) {
    // Initial load — spinner below the header, no data yet
    innerContent = (
      <div className="ai-loading-body">
        <div className="loading-spinner" />
        <p>Generating AI insights based on your recent activity...</p>
      </div>
    );
  } else if (error) {
    // Error state
    innerContent = (
      <div className="ai-error-body">
        <p className="error-text">{error}</p>
        <button onClick={() => fetchInsights(true)} className="btn btn-secondary">Try Again</button>
      </div>
    );
  } else if (!data) {
    // Empty state — no transactions yet
    innerContent = (
      <div className="ai-empty-body">
        <div className="ai-empty-icon">📊</div>
        <h4 className="ai-empty-title">No insights yet</h4>
        <p className="ai-empty-desc">
          AI Financial Insights analyses your income and expense transactions to generate
          personalised recommendations. Add a few transactions to get started.
        </p>
        <button
          className="btn-add-transaction"
          onClick={() => navigate('/transactions')}
        >
          + Add Transaction
        </button>
      </div>
    );
  } else {
    // Successful state — full insights
    innerContent = (
      <>
        <div className="ai-summary-box">
          <p>{data.summary}</p>
        </div>

        <div className="ai-insights-grid">
          {data.insights && data.insights.map((insight, idx) => (
            <div key={idx} className={`ai-insight-item ${getInsightClass(insight.type)}`}>
              <div className="ai-insight-icon">{getInsightIcon(insight.type)}</div>
              <div className="ai-insight-content">
                <h4>{insight.title}</h4>
                <p>{insight.message}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="ai-footer-stats">
          <div className="ai-stat-box">
            <span className="stat-label">Top Spending Category</span>
            <span className="stat-value">{data.topSpendingCategory || 'None'}</span>
          </div>
          <div className="ai-stat-box">
            <span className="stat-label">Saving Suggestion</span>
            <span className="stat-value text-suggestion">{data.savingSuggestion || 'Add more data for suggestions.'}</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={`card ai-insights-card${loading && data ? ' ai-refreshing' : ''}`}>
      {sectionHeader}
      {innerContent}
    </div>
  );
};

export default AIInsights;
