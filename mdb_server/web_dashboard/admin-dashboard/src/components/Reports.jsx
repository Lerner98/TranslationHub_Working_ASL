import React, { useState, useEffect } from 'react';
import { fetchReports, deleteReport } from '../apiClient';

const Reports = ({ token }) => {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 10;

  useEffect(() => {
    const loadReports = async () => {
      const response = await fetchReports(token);
      if (response.success) {
        setReports(response.reports);
      } else {
        setError(response.message || 'Failed to fetch reports');
      }
    };
    loadReports();
  }, [token]);

  const handleSort = (field) => {
    const newSortOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
    setReports([...reports].sort((a, b) => {
      const valueA = a[field] || '';
      const valueB = b[field] || '';
      if (field === 'createdAt') {
        return newSortOrder === 'asc'
          ? new Date(valueA) - new Date(valueB)
          : new Date(valueB) - new Date(valueA);
      }
      return newSortOrder === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }));
  };

  const handleDelete = async (id) => {
    const response = await deleteReport(id, token);
    if (response.success) {
      setReports(reports.filter(r => r._id !== id));
    } else {
      setError(response.message || 'Failed to delete report');
    }
  };

  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = reports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(reports.length / reportsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="card">
      <h2 className="card-title">Error Reports</h2>
      {error && <div className="error-message">{error}</div>}
      {reports.length === 0 ? (
        <p className="text-muted">No reports available.</p>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th onClick={() => handleSort('createdAt')}>
                  Time {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('userId')}>
                  User ID {sortField === 'userId' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('type')}>
                  Type {sortField === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('message')}>
                  Message {sortField === 'message' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Stack</th>
                <th>Screen</th>
                <th>Platform</th>
                <th>App Version</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentReports.map(report => (
                <tr key={report._id}>
                  <td>{new Date(report.createdAt).toLocaleString()}</td>
                  <td>{report.userId || 'N/A'}</td>
                  <td>{report.type}</td>
                  <td>{report.message}</td>
                  <td><pre>{report.errorStack || 'N/A'}</pre></td>
                  <td>{report.screen || 'N/A'}</td>
                  <td>{report.platform || 'N/A'}</td>
                  <td>{report.appVersion || 'N/A'}</td>
                  <td>
                    <button className="delete-btn" onClick={() => handleDelete(report._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                className={currentPage === index + 1 ? 'active' : ''}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;