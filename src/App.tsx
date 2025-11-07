import React, { useState, useEffect } from "react";
import "./styles.css";
import Dashboard from "./components/Dashboard.js";

export function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState("Initializing...");

  useEffect(() => {
    const loadData = async () => {
  try {
    setLoadingProgress("Fetching data file...");

    const response = await fetch("/startup-data.json");
    
    if (!response.ok) {
      throw new Error(
        `Failed to load data (${response.status}): ${response.statusText}`
      );
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Invalid response type. Expected JSON.');
    }

    setLoadingProgress("Parsing JSON data...");
    const jsonData = await response.json();

    // Validate data structure
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('Invalid data structure: must be object or array');
    }

    if (Array.isArray(jsonData)) {
      if (jsonData.length === 0) {
        throw new Error('Data array is empty');
      }
      window.startupData = { Companies: [], Deals: jsonData };
    } else if (!jsonData.Companies && !jsonData.Deals) {
      throw new Error('Data must contain Companies and/or Deals arrays');
    } else {
      window.startupData = jsonData;
    }

    setLoadingProgress("Processing data...");
    await new Promise((resolve) => setTimeout(resolve, 500));

    setLoadingProgress("Finalizing dashboard...");
    setLoading(false);
  } catch (error) {
    const message = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    setError(message);
    setLoading(false);
  }
};

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="text-center max-w-md"
          style={{ maxWidth: "1020px", width: "100%", margin: "0 auto" }}
        >
          <img
            src="/logo.png"
            alt="Swiss Startup Ecosystem Logo"
            className="h-16 mx-auto mb-4"
          />
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Swiss Startup Ecosystem Dashboard
          </h2>
          <p className="text-gray-600 mb-4">{loadingProgress}</p>
          <div className="bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: "75%" }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">
            Loading Swiss companies and investment deals data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="text-center p-6"
          style={{ maxWidth: "1020px", width: "100%", margin: "0 auto" }}
        >
          <div className="text-red-600 text-6xl mb-4">🏢</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Data Loading Error
          </h2>
          <p className="text-gray-600 mb-4">
            Unable to load the Swiss startup ecosystem data.
          </p>

          <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg mb-4">
            <strong>Error:</strong> {error}
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold mb-2">Troubleshooting:</p>
            <ul className="text-left space-y-1">
              <li>
                • Ensure <code>startup-data.json</code> is in the{" "}
                <code>public</code> folder
              </li>
              <li>
                • Check that the JSON file contains Companies and/or Deals
                arrays
              </li>
              <li>
                • Verify JSON structure:{" "}
                <code>
                  {"{"}"Companies": [...], "Deals": [...]{"}"}
                </code>
              </li>
              <li>• Refresh the page to retry</li>
              <li>• Check browser console for additional errors</li>
            </ul>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app app-container">
      <Dashboard />
    </div>
  );
}

export default App;
