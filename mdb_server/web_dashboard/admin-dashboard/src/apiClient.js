import axios from 'axios';

const API_URL = 'http://localhost:3002/api/reports';
const ADMIN_API_URL = 'http://localhost:3001/api/admins';

export const loginAdmin = async (email, password) => {
  try {
    const response = await axios.post(`${ADMIN_API_URL}/login`, { email, password });
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Login failed' };
  }
};

export const fetchReports = async (token) => {
  try {
    const response = await axios.get(API_URL, {
      headers: { 'Authorization': token }
    });
    return response.data;
  } catch (error) {
    return { success: false, message: 'Failed to fetch reports' };
  }
};

export const fetchErrorsByDay = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/statistics/errors-by-day`, {
      headers: { 'Authorization': token }
    });
    return response.data;
  } catch (error) {
    return { success: false, message: 'Failed to fetch errors by day' };
  }
};

export const fetchMostReported = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/statistics/most-reported`, {
      headers: { 'Authorization': token }
    });
    return response.data;
  } catch (error) {
    return { success: false, message: 'Failed to fetch most reported keywords' };
  }
};

export const deleteReport = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: { 'Authorization': token }
    });
    return response.data;
  } catch (error) {
    return { success: false, message: 'Failed to delete report' };
  }
};