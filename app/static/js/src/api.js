// src/api.js

/**
 * Fetches data from the server using the provided URL, method, and body.
 *
 * @param {string} url - The API endpoint URL.
 * @param {string} [method='GET'] - The HTTP method to use (e.g., 'GET', 'POST').
 * @param {Object|null} [body=null] - The request body to send.
 * @returns {Promise<Object>} - The parsed JSON response from the server.
 */
export async function fetchData(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`/api${url}`, options);
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response.json();
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    alert(error.message || 'An error occurred while fetching data.');
  }
}

/**
 * Loads all necessary data for the application.
 *
 * @returns {Promise<Object>} - An object containing categories, transactions, pay periods, category rules, and recurring templates.
 */
export async function loadAllData() {
  const [categories, transactions, payPeriods, categoryRules, recurringTemplates, plannedAmounts] = await Promise.all([
    fetchData('/categories'),
    fetchData('/transactions'),
    fetchData('/pay-periods'),
    fetchData('/category-rules'),
    fetchData('/recurring-templates'),
    fetchData('/planned-amounts'),
  ]);
  
  return {
    categories,
    transactions,
    payPeriods,
    categoryRules,
    recurringTemplates,
    plannedAmounts
  };
}