import React, { useState, useEffect } from 'react';
import { fetchErrorsByDay, fetchMostReported } from '../apiClient';

const Statistics = ({ token }) => {
  const [errorsByDay, setErrorsByDay] = useState({});
  const [mostReported, setMostReported] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStatistics = async () => {
      const errorsResponse = await fetchErrorsByDay(token);
      if (errorsResponse.success) {
        setErrorsByDay(errorsResponse.errorsByDay);
      } else {
        setError(errorsResponse.message || 'Failed to fetch errors by day');
      }

      const mostReportedResponse = await fetchMostReported(token);
      if (mostReportedResponse.success) {
        setMostReported(mostReportedResponse.mostReported);
      } else {
        setError(mostReportedResponse.message || 'Failed to fetch most reported keywords');
      }
    };
    loadStatistics();
  }, [token]);

  return (
    <div>
      <h2 className="card-title">Statistics</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="card">
        <h3 className="card-title">Errors by Day (Last 7 Days)</h3>
        {Object.keys(errorsByDay).length === 0 ? (
          <p className="text-muted">No errors reported in the last 7 days.</p>
        ) : (
          <ul className="list">
            {Object.entries(errorsByDay).map(([date, count]) => (
              <li key={date} className="list-item">
                <span>{date}</span>
                <span className="badge primary">{count} errors</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="card">
        <h3 className="card-title">Most Reported Keywords</h3>
        {mostReported.length === 0 ? (
          <p className="text-muted">No keywords reported.</p>
        ) : (
          <ul className="list">
            {mostReported.map(([keyword, count]) => (
              <li key={keyword} className="list-item">
                <span>{keyword}</span>
                <span className="badge secondary">{count} occurrences</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Statistics;