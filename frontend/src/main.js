import 'bootstrap';
import * as bootstrap from 'bootstrap';
import Chart from 'chart.js/auto';
import { DashboardApi, analyticsApi, ReportsApi, RealtimeUpdates } from './services/api.js';
import { DataAnalysisService } from './services/dataAnalysis.js';
import './styles/analytics.css';

// Initialize loading state
let isLoading = false;
// Track chart instances so they can be destroyed when navigating away
let activeCharts = [];
const realtimeUpdates = new RealtimeUpdates();

// Initialize services
const dataAnalysisService = new DataAnalysisService();
const dashboardApi = new DashboardApi();
const reportsApi = new ReportsApi();

// Global state
const state = {
  theme: localStorage.getItem('theme') || 'light',
  currentView: null,
  filters: {
    period: '30d',
    store: 'all',
    storeType: null
  }
};

// Initialize tooltips
function initializeTooltips() {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}

// Initialize dashboard
async function initializeDashboard() {
  try {
    // Set theme
    document.documentElement.setAttribute('data-bs-theme', state.theme);
    updateThemeIcons();
    
    // Initialize Bootstrap components
    initializeBootstrapComponents();
    
    // Set up navigation
    setupNavigation();
    
    // Initialize WebSocket connection
    await initializeWebSocket();
    
    // Load initial data
    // Fetch stats first, then update summary and load route
    try {
        const statsData = await dashboardApi.getStats();
        updateDataSummary(statsData); // Pass fetched data
    } catch (error) {
        console.error("Failed to fetch initial stats:", error);
        updateDataSummary({}); // Update with N/A if fetch fails
    }
    
    await handleRoute(window.location.hash || '#dashboard');
    
    // Set up event listeners
    setupEventListeners();
    
    // Start periodic updates
    startPeriodicUpdates();
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    showToast('Error initializing dashboard. Please refresh the page.', 'danger');
  }
}

// Initialize WebSocket connection with retry logic
async function initializeWebSocket(retries = 3, delay = 1000) {
  try {
    await realtimeUpdates.connect();
    console.log('WebSocket connected successfully');
    showToast('Real-time updates connected', 'success'); // Show success toast
    
    // Set up event listeners for real-time updates
    realtimeUpdates.on('sales_update', (data) => {
      updateSalesMetrics(data);
    });
    
    realtimeUpdates.on('inventory_update', (data) => {
      updateInventoryMetrics(data);
    });
    
    // Clean up WebSocket connection when the window is closed
    window.addEventListener('beforeunload', () => {
      realtimeUpdates.disconnect();
    });
    
  } catch (error) {
    console.error(`WebSocket connection failed: ${error.message}. Retries left: ${retries}`);
    if (retries > 0) {
      showToast(`Real-time connection failed. Retrying in ${delay / 1000}s... (${retries} attempts left)`, 'warning');
      setTimeout(() => initializeWebSocket(retries - 1, delay * 2), delay); // Exponential backoff
    } else {
      console.error('WebSocket connection failed after multiple retries.');
      showToast('Real-time updates unavailable. Please refresh the page.', 'danger'); // Final failure message
    }
  }
}

// Set up event listeners
function setupEventListeners() {
  // Refresh button
  document.getElementById('refresh-data')?.addEventListener('click', async () => {
    try {
      showLoading(true);
      await handleRoute(window.location.hash || '#dashboard');
      showToast('Data refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showToast('Error refreshing data', 'danger');
    } finally {
      showLoading(false);
    }
  });

  // Export button
  document.getElementById('export-data')?.addEventListener('click', async () => {
    try {
      showLoading(true);
      await exportCurrentView();
      showToast('Data exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      showToast('Error exporting data', 'danger');
    } finally {
      showLoading(false);
    }
  });

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

// Start periodic updates
function startPeriodicUpdates() {
  // Update analytics every 5 minutes
  setInterval(async () => {
    try {
      await updateAnalytics();
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  }, 5 * 60 * 1000);
}

// Enhanced error handling for API calls
async function safeApiCall(apiFunction, errorMessage) {
  try {
    return await apiFunction();
  } catch (error) {
    console.error(errorMessage, error);
    showToast(errorMessage, 'danger');
    throw error;
  }
}

// Show toast notification
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;
  
  const toast = new bootstrap.Toast(toastContainer);
  const toastBody = toastContainer.querySelector('.toast-body');
  if (toastBody) {
    toastBody.textContent = message;
    toastContainer.classList.remove('bg-success', 'bg-danger', 'bg-info');
    toastContainer.classList.add(`bg-${type}`);
    toast.show();
  }
}

// Initialize Bootstrap components
function initializeBootstrapComponents() {
  try {
    // Initialize dropdowns
    const dropdownElementList = document.querySelectorAll('.dropdown-toggle');
    [...dropdownElementList].map(dropdownToggle => new bootstrap.Dropdown(dropdownToggle));
    
    // Initialize tooltips
    initializeTooltips();
    
    // Initialize popovers
    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
    [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
    
    // Initialize collapse for mobile navigation
    const collapseElementList = document.querySelectorAll('.collapse');
    [...collapseElementList].map(collapseEl => new bootstrap.Collapse(collapseEl, { toggle: false }));
  } catch (error) {
    console.error('Error initializing Bootstrap components:', error);
  }
}

// Helper function to create tooltip attributes
function tooltipAttr(title) {
  return `data-bs-toggle="tooltip" data-bs-placement="top" title="${title}"`;
}

// Setup navigation
function setupNavigation() {
  // Handle main navigation links
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href')?.startsWith('#')) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const hash = link.getAttribute('href');
        if (hash) {
          window.location.hash = hash;
          handleRoute(hash);
        }
      });
    }
  });
  
  // Handle dropdown menu items
  document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const text = this.textContent;
      const target = this.closest('.dropdown').querySelector('.dropdown-toggle');
      if (target) {
        // Update dropdown button text
        const icon = target.querySelector('i')?.outerHTML || '';
        target.innerHTML = icon + ' ' + text;
      }
      
      // Apply filters
      const period = this.getAttribute('data-period');
      const store = this.getAttribute('data-store');
      const storeType = this.getAttribute('data-store-type');
      
      if (period) state.filters.period = period;
      if (store) state.filters.store = store;
      if (storeType) state.filters.storeType = storeType;
    });
  });
  
  // Handle hash changes
  window.addEventListener('hashchange', () => {
    handleRoute(window.location.hash);
  });
}

// Update live data summary in sidebar
function updateDataSummary(stats) {
  const formatNumber = (num, options = {}) => num?.toLocaleString(undefined, options) || 'N/A';
  const formatCurrency = (num) => num?.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) || 'N/A';

  // Add checks to ensure elements exist before setting textContent
  const totalSalesEl = document.getElementById('total-sales');
  if (totalSalesEl) totalSalesEl.textContent = formatCurrency(stats?.total_sales);

  const totalOrdersEl = document.getElementById('total-orders');
  if (totalOrdersEl) totalOrdersEl.textContent = formatNumber(stats?.total_orders);

  const avgOrderValueEl = document.getElementById('avg-order-value');
  if (avgOrderValueEl) avgOrderValueEl.textContent = formatCurrency(stats?.average_order_value);

  // Conversion rate element removed previously
  // const conversionRateEl = document.getElementById('conversion-rate');
  // if (conversionRateEl) conversionRateEl.textContent = `${formatNumber(stats?.conversion_rate, { maximumFractionDigits: 2 })}%`;
}

// Show/hide loading indicator
function showLoading(show = true) {
  isLoading = show;
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.display = show ? 'flex' : 'none';
  }
}

// Update active navigation link in the sidebar
function updateActiveNavLink(route) {
  // Remove 'active' class from all nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    link.removeAttribute('aria-current'); // Also remove aria-current for accessibility
  });

  // Add 'active' class to the link matching the current route
  const activeLink = document.querySelector(`.nav-link[href="${route}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
    activeLink.setAttribute('aria-current', 'page'); // Set aria-current for accessibility
  }
}

// Handle route changes
async function handleRoute(route) {
  try {
    showLoading(true);
    destroyActiveCharts();
    updateActiveNavLink(route); 
    
    const mainContent = document.getElementById('main-content');
    if (!mainContent) { showLoading(false); return; } // Guard clause

    // Load route content
    switch (route) {
      case '#dashboard':
        await loadDashboard(mainContent);
        break;
      case '#analytics':
        await loadAnalytics(mainContent);
        break;
      case '#inventory':
        await loadInventory(mainContent);
        break;
      case '#reports':
        await loadReports(mainContent);
        break;
      default: // Default to dashboard
        await loadDashboard(mainContent);
        window.location.hash = '#dashboard'; // Optionally correct the hash
    }

    // Initialize tooltips after content is loaded
    initializeTooltips();
    
  } catch (error) {
    console.error('Error handling route:', error);
    // Ensure mainContent exists before trying to set innerHTML in error case
    const mainContent = document.getElementById('main-content'); 
    if(mainContent) {
        mainContent.innerHTML = `<div class="alert alert-danger">Error loading page content.</div>`;
    }
    showToast('Error loading content', 'danger');
  } finally {
    showLoading(false);
  }
}

// Filter application functions
function applyTimeFilter(period) {
  console.log("Applying time filter:", period);
  // In a real app, this would update the data based on the selected time period
  // For now, we just reload the current view
  handleRoute(window.location.hash);
}

function applyStoreFilter(store) {
  console.log("Applying store filter:", store);
  // In a real app, this would update the data based on the selected store
  // For now, we just reload the current view
  handleRoute(window.location.hash);
}

function applyStoreTypeFilter(storeType) {
  console.log("Applying store type filter:", storeType);
  // In a real app, this would update the data based on the selected store type
  // For now, we just reload the current view
  handleRoute(window.location.hash);
}

// Export current view
function exportCurrentView() {
  const currentView = window.location.hash.replace('#', '') || 'dashboard';
  console.log("Exporting current view:", currentView);
  
  // Show toast notification
  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
  toastContainer.innerHTML = `
    <div class="toast align-items-center text-white bg-primary border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi bi-download me-2"></i> Exported ${currentView} data as CSV.
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;
  document.body.appendChild(toastContainer);
  
  const toast = new bootstrap.Toast(toastContainer.querySelector('.toast'));
  toast.show();
  
  // In a real app, this would trigger the actual export
  switch(currentView) {
    case 'dashboard':
      dashboardApi.exportReport('csv');
      break;
    case 'analytics':
      analyticsApi.createPurchaseOrder({format: 'csv', type: 'analytics'});
      break;
    case 'reports':
      reportsApi.getReportsList();
      break;
    case 'inventory':
      analyticsApi.getInventoryData();
      break;
  }
}

// Load settings page
function loadSettings() {
  const mainContent = document.getElementById('main-content');
  
  // Get current settings from localStorage or use defaults
  const currentSettings = {
    apiEndpoint: localStorage.getItem('apiEndpoint') || 'http://localhost:5001/api',
    useMockData: localStorage.getItem('useMockData') !== 'false',
    defaultView: localStorage.getItem('defaultView') || 'dashboard',
    theme: localStorage.getItem('theme') || 'light',
    enableAnimations: localStorage.getItem('enableAnimations') !== 'false',
    enableRealtime: localStorage.getItem('enableRealtime') !== 'false',
    chartStyle: localStorage.getItem('chartStyle') || 'modern'
  };
  
  mainContent.innerHTML = `
    <div class="container-fluid py-4">
      <div class="row mb-4">
        <div class="col">
          <h2>Settings</h2>
          <p class="text-muted">Configure dashboard preferences and data options</p>
        </div>
      </div>
      
      <div class="row g-4">
        <div class="col-md-6">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Data Configuration</h5>
              <form class="mt-3" id="dataConfigForm">
                <div class="mb-3">
                  <label class="form-label">API Endpoint</label>
                  <div class="input-group">
                    <input type="text" class="form-control" id="apiEndpoint" value="${currentSettings.apiEndpoint}">
                    <button class="btn btn-outline-secondary" type="button" id="testApiBtn">Test</button>
                  </div>
                </div>
                <div class="mb-3 form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="useMockData" ${currentSettings.useMockData ? 'checked' : ''}>
                  <label class="form-check-label" for="useMockData">Use Mock Data</label>
                </div>
                <div class="mb-3">
                  <label class="form-label">Default View</label>
                  <select class="form-select" id="defaultView">
                    <option value="dashboard" ${currentSettings.defaultView === 'dashboard' ? 'selected' : ''}>Dashboard</option>
                    <option value="analytics" ${currentSettings.defaultView === 'analytics' ? 'selected' : ''}>Analytics</option>
                    <option value="reports" ${currentSettings.defaultView === 'reports' ? 'selected' : ''}>Reports</option>
                    <option value="inventory" ${currentSettings.defaultView === 'inventory' ? 'selected' : ''}>Inventory</option>
                  </select>
                </div>
                <button type="button" class="btn btn-primary" id="saveDataConfigBtn">Save Changes</button>
              </form>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Display Settings</h5>
              <form class="mt-3" id="displaySettingsForm">
                <div class="mb-3">
                  <label class="form-label">Theme</label>
                  <select class="form-select" id="themeSelect">
                    <option value="light" ${currentSettings.theme === 'light' ? 'selected' : ''}>Light</option>
                    <option value="dark" ${currentSettings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                    <option value="system" ${currentSettings.theme === 'system' ? 'selected' : ''}>System Default</option>
                  </select>
                </div>
                <div class="mb-3 form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="showAnimations" ${currentSettings.enableAnimations ? 'checked' : ''}>
                  <label class="form-check-label" for="showAnimations">Enable Animations</label>
                </div>
                <div class="mb-3 form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="enableRealtime" ${currentSettings.enableRealtime ? 'checked' : ''}>
                  <label class="form-check-label" for="enableRealtime">Enable Real-time Updates</label>
                </div>
                <div class="mb-3">
                  <label class="form-label">Chart Style</label>
                  <select class="form-select" id="chartStyle">
                    <option value="modern" ${currentSettings.chartStyle === 'modern' ? 'selected' : ''}>Modern</option>
                    <option value="classic" ${currentSettings.chartStyle === 'classic' ? 'selected' : ''}>Classic</option>
                    <option value="minimal" ${currentSettings.chartStyle === 'minimal' ? 'selected' : ''}>Minimal</option>
                  </select>
                </div>
                <button type="button" class="btn btn-primary" id="applyDisplaySettingsBtn">Apply Settings</button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row g-4 mt-2">
        <div class="col-md-12">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">About This Dashboard</h5>
              <p class="card-text">
                This retail analytics dashboard is built to accompany the book 
                "Business Analytics with Python: A Practical Guide for Data Analysts & Business Professionals."
                It uses a retail dataset with sales data from 45 stores across various departments.
              </p>
              <p class="card-text">
                <strong>Version:</strong> 1.0.0<br>
                <strong>Last Updated:</strong> April 2024<br>
                <strong>Dataset:</strong> Kaggle Retail Dataset (2010-2012)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add event listener for theme toggle
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    // Set current theme
    document.documentElement.setAttribute('data-bs-theme', currentSettings.theme);
    
    themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      document.documentElement.setAttribute('data-bs-theme', theme);
      localStorage.setItem('theme', theme);
      showToast('Theme updated successfully', 'success');
    });
  }
  
  // Add event listener for mock data toggle
  const mockDataToggle = document.getElementById('useMockData');
  if (mockDataToggle) {
    mockDataToggle.addEventListener('change', (e) => {
      localStorage.setItem('useMockData', e.target.checked);
    });
  }
  
  // Save data config button
  const saveDataConfigBtn = document.getElementById('saveDataConfigBtn');
  if (saveDataConfigBtn) {
    saveDataConfigBtn.addEventListener('click', () => {
      const apiEndpoint = document.getElementById('apiEndpoint').value;
      const useMockData = document.getElementById('useMockData').checked;
      const defaultView = document.getElementById('defaultView').value;
      
      localStorage.setItem('apiEndpoint', apiEndpoint);
      localStorage.setItem('useMockData', useMockData);
      localStorage.setItem('defaultView', defaultView);
      
      showToast('Data configuration saved successfully', 'success');
    });
  }
  
  // Apply display settings button
  const applyDisplaySettingsBtn = document.getElementById('applyDisplaySettingsBtn');
  if (applyDisplaySettingsBtn) {
    applyDisplaySettingsBtn.addEventListener('click', () => {
      const enableAnimations = document.getElementById('showAnimations').checked;
      const enableRealtime = document.getElementById('enableRealtime').checked;
      const chartStyle = document.getElementById('chartStyle').value;
      
      localStorage.setItem('enableAnimations', enableAnimations);
      localStorage.setItem('enableRealtime', enableRealtime);
      localStorage.setItem('chartStyle', chartStyle);
      
      if (!enableRealtime) {
        realtimeUpdates.disconnect();
      } else {
        realtimeUpdates.connect();
      }
      
      showToast('Display settings applied successfully', 'success');
    });
  }
  
  // Test API button
  const testApiBtn = document.getElementById('testApiBtn');
  if (testApiBtn) {
    testApiBtn.addEventListener('click', () => {
      const apiEndpoint = document.getElementById('apiEndpoint').value;
      
      // Simulate API test
      testApiBtn.disabled = true;
      testApiBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Testing...';
      
      setTimeout(() => {
        testApiBtn.disabled = false;
        testApiBtn.textContent = 'Test';
        showToast('API connection successful', 'success');
      }, 1500);
    });
  }
}

// Global functions for report management
window.viewReport = async function(id) {
  try {
    const report = await reportsApi.downloadReport(id);
    const url = URL.createObjectURL(report);
    window.open(url, '_blank');
    URL.revokeObjectURL(url);
  } catch (error) {
    showToast('Error viewing report: ' + error.message, 'danger');
  }
};

window.downloadReport = async function(id) {
  try {
    const report = await reportsApi.downloadReport(id);
    const url = URL.createObjectURL(report);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${id}-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Report downloaded successfully', 'success');
  } catch (error) {
    showToast('Error downloading report: ' + error.message, 'danger');
  }
};

window.deleteReport = async function(id) {
  try {
    await reportsApi.deleteReport(id);
    showToast('Report deleted successfully', 'success');
    loadReports(); // Refresh the reports list
  } catch (error) {
    console.error('Error deleting report:', error);
    showToast('Error deleting report', 'danger');
  }
};

// Load reports content
async function loadReports(mainContent) {
  try {
    const [reportsResponse, holidayResponse] = await Promise.all([
      reportsApi.getReportsList().catch(e => { console.error("Error fetching reports list:", e); return []; }),
      reportsApi.getScheduledReports().catch(e => { console.error("Error fetching scheduled reports:", e); return null; })
    ]);

    const reports = Array.isArray(reportsResponse) ? reportsResponse : [];
    
    // Define a default structure for holiday comparison
    const defaultHolidayComparison = { by_store_type: [], overall: { holiday_avg: 0, non_holiday_avg: 0, percentage_increase: 0 } };
    
    // Safely check holidayResponse structure
    const holidayComparison = 
      holidayResponse &&
      typeof holidayResponse === 'object' &&
      Array.isArray(holidayResponse.by_store_type) && 
      holidayResponse.overall && typeof holidayResponse.overall === 'object'
        ? holidayResponse
        : defaultHolidayComparison;

    if (!mainContent) return;

    // Construct HTML using safe access (?.) and default values
    mainContent.innerHTML = `
      <div class="container-fluid py-4">
        <div class="row mb-4">
          <div class="col">
            <h2>Sales Reports</h2>
            <p class="text-muted">Create, view, and schedule retail sales reports</p>
          </div>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-md-3">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body">
                <h5 class="card-title">Report Categories</h5>
                <div class="list-group list-group-flush mt-3">
                  <a href="#" class="list-group-item list-group-item-action d-flex align-items-center">
                    <i class="bi bi-graph-up text-primary me-3"></i>
                    <div>
                      <h6 class="mb-1">Sales Reports</h6>
                      <p class="mb-0 text-muted small">Revenue, growth, trends</p>
                    </div>
                  </a>
                  <a href="#" class="list-group-item list-group-item-action d-flex align-items-center">
                    <i class="bi bi-people text-success me-3"></i>
                    <div>
                      <h6 class="mb-1">Customer Reports</h6>
                      <p class="mb-0 text-muted small">Segments, behavior, loyalty</p>
                    </div>
                  </a>
                  <a href="#" class="list-group-item list-group-item-action d-flex align-items-center">
                    <i class="bi bi-box text-warning me-3"></i>
                    <div>
                      <h6 class="mb-1">Inventory Reports</h6>
                      <p class="mb-0 text-muted small">Stock levels, turnover</p>
                    </div>
                  </a>
                  <a href="#" class="list-group-item list-group-item-action d-flex align-items-center">
                    <i class="bi bi-shop text-info me-3"></i>
                    <div>
                      <h6 class="mb-1">Store Reports</h6>
                      <p class="mb-0 text-muted small">Performance, comparison</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-md-9">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-4">
                  <h5 class="card-title">Recent Reports</h5>
                  <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#createReportModal" ${tooltipAttr('Open the report creation wizard.')}>
                    <i class="bi bi-plus-lg me-1"></i> Create Report
                  </button>
                </div>
                
                <div class="row mb-3">
                  <div class="col-md-6">
                    <div class="input-group">
                      <input type="text" class="form-control" placeholder="Search reports...">
                      <button class="btn btn-outline-secondary" type="button">
                        <i class="bi bi-search"></i>
                      </button>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <select class="form-select">
                      <option selected>All Types</option>
                      <option>Sales</option>
                      <option>Customer</option>
                      <option>Inventory</option>
                      <option>Store</option>
                    </select>
                  </div>
                  <div class="col-md-3">
                    <select class="form-select">
                      <option selected>Sort by Date</option>
                      <option>Name (A-Z)</option>
                      <option>Type</option>
                      <option>Status</option>
                    </select>
                  </div>
                </div>
                
                <div class="table-responsive">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Report Name</th>
                        <th>Type</th>
                        <th>Last Generated</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${reports.length > 0 ? reports.map(report => `
                        <tr>
                          <td>
                            ${report?.name || 'Unnamed Report'}  
                            ${report?.isNew ? '<span class="badge bg-success ms-2">New</span>' : ''}
                          </td>
                          <td><span class="badge bg-light text-dark">${report?.type || 'N/A'}</span></td>
                          <td>${report?.lastGenerated || 'N/A'}</td>
                          <td>
                            <span class="badge ${report?.status === 'completed' ? 'bg-success' : report?.status === 'pending' ? 'bg-warning' : 'bg-danger'}">
                              ${report?.status || 'unknown'}
                            </span>
                          </td>
                          <td>
                            <div class="btn-group btn-group-sm">
                              <button class="btn btn-outline-primary" title="View" onclick="viewReport('${report?.id}')" ${!report?.id ? 'disabled' : ''}>
                                <i class="bi bi-eye"></i>
                              </button>
                              <button class="btn btn-outline-primary" title="Download" onclick="downloadReport('${report?.id}')" ${!report?.id ? 'disabled' : ''}>
                                <i class="bi bi-download"></i>
                              </button>
                              <button class="btn btn-outline-danger" title="Delete" onclick="deleteReport('${report?.id}')" ${!report?.id ? 'disabled' : ''}>
                                <i class="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      `).join('') : '<tr><td colspan="5">No reports available.</td></tr>'}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="row g-4">
          <div class="col-md-6">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h5 class="card-title">Holiday Impact Analysis</h5>
                <p class="text-muted mb-3 small">Comparison of sales during holiday vs. non-holiday periods</p>
                
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Store Type</th>
                        <th>Holiday Avg</th>
                        <th>Non-Holiday Avg</th>
                        <th>Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${holidayComparison.by_store_type.length > 0 ? holidayComparison.by_store_type.map(type => `
                        <tr>
                          <td>Type ${type?.type || 'N/A'}</td>
                          <td>$${type?.holiday_avg?.toLocaleString(undefined, {maximumFractionDigits: 2}) || '0.00'}</td>
                          <td>$${type?.non_holiday_avg?.toLocaleString(undefined, {maximumFractionDigits: 2}) || '0.00'}</td>
                          <td class="text-${(type?.percentage_increase || 0) >= 0 ? 'success' : 'danger'}">
                            ${(type?.percentage_increase || 0) >= 0 ? '+' : ''}${(type?.percentage_increase || 0).toFixed(2)}%
                          </td>
                        </tr>
                      `).join('') : '<tr><td colspan="4">No holiday comparison data.</td></tr>'}
                      <tr class="table-secondary">
                        <td><strong>Overall</strong></td>
                        <td><strong>$${holidayComparison.overall?.holiday_avg?.toLocaleString(undefined, {maximumFractionDigits: 2}) || '0.00'}</strong></td>
                        <td><strong>$${holidayComparison.overall?.non_holiday_avg?.toLocaleString(undefined, {maximumFractionDigits: 2}) || '0.00'}</strong></td>
                        <td class="text-${(holidayComparison.overall?.percentage_increase || 0) >= 0 ? 'success' : 'danger'}">
                          <strong>${(holidayComparison.overall?.percentage_increase || 0) >= 0 ? '+' : ''}${(holidayComparison.overall?.percentage_increase || 0).toFixed(2)}%</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div class="d-flex justify-content-end mt-3">
                  <button class="btn btn-sm btn-primary">
                    <i class="bi bi-download me-1"></i> Export Analysis
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h5 class="card-title">Report Templates</h5>
                <p class="text-muted mb-3 small">Use these templates to quickly generate standardized reports</p>
                
                <div class="list-group">
                  <a href="#" class="list-group-item list-group-item-action" data-bs-toggle="modal" data-bs-target="#createReportModal" data-template="sales" ${tooltipAttr('Quickly generate a sales performance report.')}>
                    <div class="d-flex w-100 justify-content-between">
                      <h6 class="mb-1">Sales Performance Report</h6>
                      <span class="badge bg-primary">Sales</span>
                    </div>
                    <p class="mb-1 small text-muted">Comprehensive sales analysis by store, department, and time period</p>
                  </a>
                  <a href="#" class="list-group-item list-group-item-action" data-bs-toggle="modal" data-bs-target="#createReportModal" data-template="inventory" ${tooltipAttr('Quickly generate an inventory status report.')}>
                    <div class="d-flex w-100 justify-content-between">
                      <h6 class="mb-1">Inventory Status Report</h6>
                      <span class="badge bg-warning text-dark">Inventory</span>
                    </div>
                    <p class="mb-1 small text-muted">Stock levels, turnover rates, and inefficiency identification</p>
                  </a>
                  <a href="#" class="list-group-item list-group-item-action" data-bs-toggle="modal" data-bs-target="#createReportModal" data-template="store" ${tooltipAttr('Quickly generate a store comparison report.')}>
                    <div class="d-flex w-100 justify-content-between">
                      <h6 class="mb-1">Store Comparison Report</h6>
                      <span class="badge bg-info">Store</span>
                    </div>
                    <p class="mb-1 small text-muted">Side-by-side performance metrics for all store locations</p>
                  </a>
                  <a href="#" class="list-group-item list-group-item-action" data-bs-toggle="modal" data-bs-target="#createReportModal" data-template="holiday" ${tooltipAttr('Quickly generate a holiday impact analysis report.')}>
                    <div class="d-flex w-100 justify-content-between">
                      <h6 class="mb-1">Holiday Impact Analysis</h6>
                      <span class="badge bg-success">Sales</span>
                    </div>
                    <p class="mb-1 small text-muted">Detailed analysis of sales uplift during holiday periods</p>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Report Modal -->
      <div class="modal fade" id="createReportModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Create New Report</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="createReportForm">
                <div class="mb-3">
                  <label class="form-label">Report Name</label>
                  <input type="text" class="form-control" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Report Type</label>
                  <select class="form-select" required>
                    <option value="sales">Sales Report</option>
                    <option value="inventory">Inventory Report</option>
                    <option value="customer">Customer Report</option>
                    <option value="store">Store Report</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Time Period</label>
                  <select class="form-select" id="reportTimePeriod" required>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="1y">Last Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                <div id="customDateRange" class="mb-3 d-none">
                  <div class="row">
                    <div class="col-md-6">
                      <label class="form-label">From</label>
                      <input type="date" class="form-control">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">To</label>
                      <input type="date" class="form-control">
                    </div>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Metrics to Include</label>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="metricRevenue" checked>
                    <label class="form-check-label" for="metricRevenue">Revenue</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="metricUnits" checked>
                    <label class="form-check-label" for="metricUnits">Units Sold</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="metricAOV">
                    <label class="form-check-label" for="metricAOV">Average Order Value</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="metricGrowth">
                    <label class="form-check-label" for="metricGrowth">Growth Rate</label>
                  </div>
                </div>
                <div class="mb-3">
                  <div class="form-check">
                    <input type="checkbox" class="form-check-input" id="scheduleReport">
                    <label class="form-check-label" for="scheduleReport">Schedule Report</label>
                  </div>
                </div>
                <div id="scheduleOptions" class="d-none">
                  <div class="mb-3">
                    <label class="form-label">Frequency</label>
                    <select class="form-select">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Recipients</label>
                    <input type="text" class="form-control" placeholder="Enter email addresses">
                    <small class="text-muted">Separate multiple emails with commas</small>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" onclick="createReport()">Create Report</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize the report form handlers (ensure these elements exist in the modal)
    const scheduleCheckbox = document.getElementById('scheduleReport');
    const scheduleOptions = document.getElementById('scheduleOptions');
    if (scheduleCheckbox && scheduleOptions) {
      scheduleCheckbox.addEventListener('change', (e) => {
        scheduleOptions.classList.toggle('d-none', !e.target.checked);
      });
    }

    const reportTimePeriod = document.getElementById('reportTimePeriod');
    const customDateRange = document.getElementById('customDateRange');
    if (reportTimePeriod && customDateRange) {
      reportTimePeriod.addEventListener('change', (e) => {
        customDateRange.classList.toggle('d-none', e.target.value !== 'custom');
      });
    }

    // Set up template handlers (ensure these elements exist)
    document.querySelectorAll('[data-template]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const template = e.currentTarget.getAttribute('data-template');
        prepopulateReportTemplate(template);
      });
    });

  } catch (error) {
    console.error('Error loading reports:', error);
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = `<div class="alert alert-danger">Error loading reports: ${error.message}</div>`;
    }
  }
}

function prepopulateReportTemplate(template) {
  const form = document.getElementById('createReportForm');
  if (!form) return;

  const nameInput = form.querySelector('input[type="text"]');
  const typeSelect = form.querySelector('select.form-select');
  
  // Preset values based on template
  switch (template) {
    case 'sales':
      nameInput.value = 'Sales Performance Report';
      typeSelect.value = 'sales';
      break;
    case 'inventory':
      nameInput.value = 'Inventory Status Report';
      typeSelect.value = 'inventory';
      break;
    case 'store':
      nameInput.value = 'Store Comparison Report';
      typeSelect.value = 'store';
      break;
    case 'holiday':
      nameInput.value = 'Holiday Impact Analysis';
      typeSelect.value = 'sales';
      break;
  }
}

// Load inventory content (Polished with Real Data)
async function loadInventory(mainContent) {
  if (!mainContent) return;
  showLoading(true);
  try {
    // Fetch updated data
    const [inventoryDataResult, metricsDataResult] = await Promise.all([
      analyticsApi.getInventoryData(),
      analyticsApi.getInventoryMetrics()
    ]);
    
    // --- Log the raw results from the API calls --- 
    console.log("Inventory Data API Result:", inventoryDataResult);
    console.log("Inventory Metrics API Result:", metricsDataResult);
    
    // Extract data directly, as these routes don't use format_response
    const inventoryData = Array.isArray(inventoryDataResult) ? inventoryDataResult : []; 
    const metricsData = typeof metricsDataResult === 'object' && metricsDataResult !== null ? metricsDataResult : {};
    
    // --- Log the processed data --- 
    console.log("Processed inventoryData:", inventoryData);
    console.log("Processed metricsData:", metricsData);

    // Construct the HTML first
    mainContent.innerHTML = `
      <div class="container-fluid py-4">
        <div class="row mb-4">
          <div class="col">
            <h2>Inventory Management</h2>
            <p class="text-muted">Overview of departments and estimated inventory value</p>
          </div>
        </div>

        <!-- Inventory Metrics Row -->
        <div class="row g-4 mb-4">
          <div class="col-md-4">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h6 class="card-subtitle mb-2 text-muted" ${tooltipAttr('Total number of unique product departments.')}>Total Departments</h6>
                <h3 class="card-title mb-0" id="total-items">${metricsData?.total_items?.toLocaleString() || 'N/A'}</h3> 
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h6 class="card-subtitle mb-2 text-muted" ${tooltipAttr('Total number of distinct product categories.')}>Total Categories</h6>
                 <h3 class="card-title mb-0" id="total-categories">${metricsData?.total_categories?.toLocaleString() || 'N/A'}</h3>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h6 class="card-subtitle mb-2 text-muted" ${tooltipAttr('Estimated inventory value based on historical sales (proxy).')}>Est. Total Value</h6>
                <h3 class="card-title mb-0" id="total-inventory-value">${metricsData?.total_inventory_value?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || 'N/A'}</h3>
              </div>
            </div>
          </div>
          <!-- Removed Low Stock card as data is unavailable -->
        </div>

        <!-- Inventory Table -->
        <div class="row">
           <h5 class="mb-3">Department Overview</h5>
          <div class="col">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <!-- Removed card title as it's above -->
                <div class="table-responsive">
                  <table class="table table-hover table-sm">
                    <thead>
                      <tr>
                        <th ${tooltipAttr('Unique department identifier.')}>Dept ID</th>
                        <th ${tooltipAttr('Name of the department.')}>Department Name</th>
                        <th ${tooltipAttr('Category the department belongs to.')}>Category</th>
                        <th class="text-end" ${tooltipAttr('Average weekly sales for this department (proxy for price/value).')}>Avg Weekly Sales</th>
                        <th class="text-end" ${tooltipAttr('Total historical sales for this department.')}>Total Sales</th>
                        <th class="text-center" ${tooltipAttr('Number of stores this department appears in.')}>Store Count</th>
                        <!-- Removed Status/Last Updated/Actions -->
                      </tr>
                    </thead>
                    <tbody id="inventory-table-body">
                      ${inventoryData && inventoryData.length > 0 ? inventoryData.map(item => `
                        <tr>
                          <td>${item.dept_id}</td>
                          <td>${item.product_name}</td> <!-- Use product_name alias from backend -->
                          <td>${item.category || 'N/A'}</td>
                          <td class="text-end">${item.avg_sales_price?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || 'N/A'}</td> <!-- Use calculated value -->
                          <td class="text-end">${item.total_sales?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || 'N/A'}</td>
                          <td class="text-center">${item.store_count?.toLocaleString() || 'N/A'}</td>
                          <!-- Removed Status/Last Updated/Actions columns -->
                        </tr>
                      `).join('') : '<tr><td colspan="6" class="text-center text-muted">No department data available.</td></tr>'} <!-- Updated colspan -->
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // No need to update metrics separately as they are in the main HTML
    initializeTooltips(); // Initialize tooltips

  } catch (error) {
    console.error('Error loading inventory data:', error);
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = `<div class="container-fluid py-4"><div class="alert alert-danger">Error loading inventory: ${error.message}. <button class="btn btn-sm btn-outline-danger" onclick="loadInventory(document.getElementById('main-content'))">Retry</button></div></div>`;
    }
  } finally {
      showLoading(false);
  }
}

// Helper functions for inventory management
async function adjustStock(itemId) {
  const item = await analyticsApi.getInventoryItem(itemId);
  // Show adjustment modal (implementation needed)
}

async function viewHistory(itemId) {
  const history = await analyticsApi.getInventoryHistory(itemId);
  // Show history modal (implementation needed)
}

async function createOrder(itemId) {
  const item = await analyticsApi.getInventoryItem(itemId);
  // Pre-fill and show order modal (implementation needed)
}

async function submitOrder() {
  const form = document.getElementById('createOrderForm');
  if (form) {
    // Implement order submission
    const orderData = {
      // Get form data
    };
    try {
      const result = await analyticsApi.createPurchaseOrder(orderData);
      // Show success message and close modal
    } catch (error) {
      // Show error message
    }
  }
}

// Export functions
async function exportAnalytics(format) {
  try {
    const result = await dashboardApi.exportReport(format);
    // Show success message
  } catch (error) {
    // Show error message
  }
}

// Update the sparkline initialization to fix sizing issues
function initializeSparkline(element, values) {
  try {
    // Create a canvas element inside the container
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '30px';
    element.innerHTML = ''; // Clear any existing content
    element.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array(values.length).fill(''),
        datasets: [{
          data: values,
          borderColor: '#0d6efd',
          borderWidth: 1,
          pointRadius: 0,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: { display: false },
          y: { display: false }
        },
        elements: {
          line: {
            tension: 0.4
          }
        }
      }
    });
  } catch (error) {
    console.error('Error initializing sparkline:', error);
    return null;
  }
}

// Analytics update function
async function updateAnalytics() {
  try {
    showLoading(true);
    const salesData = await fetchSalesData();
    const inventoryData = await fetchInventoryData();
    
    // Analyze sales trends
    const salesTrends = await dataAnalysisService.analyzeSalesTrends(salesData);
    updateSalesMetrics(salesTrends);
    updateSalesCharts(salesTrends);
    
    // Analyze product performance
    const productPerformance = await dataAnalysisService.analyzeProductPerformance(salesData);
    updateProductMetrics(productPerformance);
    
    // Analyze regional performance
    const regionalPerformance = await dataAnalysisService.analyzeRegionalPerformance(salesData);
    updateRegionalMetrics(regionalPerformance);
    
    // Analyze inventory
    const inventoryMetrics = await dataAnalysisService.analyzeInventoryMetrics(inventoryData);
    updateInventoryMetrics(inventoryMetrics);
    
  } catch (error) {
    console.error('Error updating analytics:', error);
    showToast('Error updating analytics: ' + error.message, 'danger');
  } finally {
    showLoading(false);
  }
}

function updateSalesMetrics(salesTrends) {
  const elements = {
    averageSales: document.getElementById('average-sales'),
    growthRate: document.getElementById('growth-rate'),
    yearOverYear: document.getElementById('year-over-year'),
    stabilityScore: document.getElementById('stability-score'),
    volatility: document.getElementById('volatility'),
    medianSales: document.getElementById('median-sales'),
    distribution: document.getElementById('distribution-range')
  };

  if (elements.averageSales) elements.averageSales.textContent = salesTrends.metrics.averageSales;
  if (elements.growthRate) elements.growthRate.textContent = salesTrends.metrics.growthRate;
  if (elements.yearOverYear) elements.yearOverYear.textContent = salesTrends.metrics.yearOverYear;
  if (elements.stabilityScore) elements.stabilityScore.textContent = salesTrends.metrics.stabilityScore;
  if (elements.volatility) elements.volatility.textContent = salesTrends.metrics.volatility;
  if (elements.medianSales) elements.medianSales.textContent = salesTrends.metrics.medianSales;
  if (elements.distribution) {
    elements.distribution.textContent = 
      `${salesTrends.metrics.lowerQuartile} - ${salesTrends.metrics.upperQuartile}`;
  }
}

function updateSalesCharts(salesTrends) {
  const salesChartCtx = document.getElementById('sales-chart');
  const patternChartCtx = document.getElementById('pattern-chart');

  if (salesChartCtx) {
    const salesChart = new Chart(salesChartCtx, {
      type: 'line',
      data: {
        labels: salesTrends.timeSeriesData.map(d => d.date),
        datasets: [
          {
            label: 'Sales',
            data: salesTrends.timeSeriesData.map(d => d.value),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          },
          {
            label: 'Short-term Trend (7-day)',
            data: salesTrends.trends.shortTerm,
            borderColor: 'rgba(255, 99, 132, 0.8)',
            borderDash: [5, 5],
            fill: false
          },
          {
            label: 'Long-term Trend (90-day)',
            data: salesTrends.trends.longTerm,
            borderColor: 'rgba(54, 162, 235, 0.8)',
            borderDash: [10, 10],
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Sales Trends Analysis'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Sales Amount'
            }
          }
        }
      }
    });
    activeCharts.push(salesChart);
  }

  if (patternChartCtx) {
    const patternChart = new Chart(patternChartCtx, {
      type: 'radar',
      data: {
        labels: salesTrends.patterns.map(p => p.type),
        datasets: [{
          label: 'Pattern Strength',
          data: salesTrends.patterns.map(p => p.strength * 100),
          fill: true,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgb(54, 162, 235)',
          pointBackgroundColor: 'rgb(54, 162, 235)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(54, 162, 235)'
        }]
      },
      options: {
        elements: {
          line: {
            borderWidth: 3
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Pattern Analysis'
          }
        }
      }
    });
    activeCharts.push(patternChart);
  }
}

function updateProductMetrics(productPerformance) {
  const productTable = document.getElementById('product-performance-table');
  if (productTable) {
    productTable.innerHTML = productPerformance.map(product => `
      <tr>
        <td>${product.productId}</td>
        <td>${product.metrics.averageSales}</td>
        <td>${product.metrics.totalQuantity}</td>
        <td>${product.metrics.profitMargin}</td>
      </tr>
    `).join('');
  }
}

function updateRegionalMetrics(regionalPerformance) {
  const regionalTable = document.getElementById('regional-performance-table');
  if (regionalTable) {
    regionalTable.innerHTML = regionalPerformance.map(region => `
      <tr>
        <td>${region.region}</td>
        <td>${region.metrics.totalSales}</td>
        <td>${region.metrics.profitability}</td>
        <td>${region.metrics.orderCount}</td>
      </tr>
    `).join('');
  }
}

function updateInventoryMetrics(inventoryMetrics) {
  const inventoryTable = document.getElementById('inventory-metrics-table');
  if (inventoryTable) {
    inventoryTable.innerHTML = inventoryMetrics.map(item => `
      <tr>
        <td>${item.productId}</td>
        <td>${item.metrics.currentStock}</td>
        <td>${item.metrics.daysUntilReorder}</td>
        <td>${item.metrics.averageLeadTime}</td>
      </tr>
    `).join('');
  }
}

async function exportAnalysisReport() {
  try {
    showLoading(true);
    const salesData = await fetchSalesData();
    const inventoryData = await fetchInventoryData();
    
    const report = {
      salesTrends: await dataAnalysisService.analyzeSalesTrends(salesData),
      productPerformance: await dataAnalysisService.analyzeProductPerformance(salesData),
      regionalPerformance: await dataAnalysisService.analyzeRegionalPerformance(salesData),
      inventoryMetrics: await dataAnalysisService.analyzeInventoryMetrics(inventoryData)
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Analysis report exported successfully', 'success');
  } catch (error) {
    console.error('Error exporting analysis report:', error);
    showToast('Error exporting analysis report', 'danger');
  } finally {
    showLoading(false);
  }
}

// Load dashboard page
async function loadDashboard(mainContent) {
  if (!mainContent) return;

  try {
    showLoading(true);
    // Fetch data
    const [stats, salesData, categoryData, regionalData, topProducts] = await Promise.all([
      dashboardApi.getStats(), // Fetch general stats
      dashboardApi.getSalesData(),
      dashboardApi.getCategoryData(),
      dashboardApi.getRegionalData(),
      dashboardApi.getTopProducts()
    ]);

    // Analyze sales data (gets trend and projection)
    const salesAnalysis = dataAnalysisService.analyzeSalesTrends(salesData);

    mainContent.innerHTML = `
      <div class="container-fluid py-4">
        <!-- Sales Overview -->
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h6 class="card-subtitle mb-2 text-muted" ${tooltipAttr('Total revenue from all sales in the current year.')}>Total Sales</h6>
                <h3 class="card-title mb-0">$${stats?.total_sales?.toLocaleString() || '0'}</h3>
                 <small class="text-${salesAnalysis?.trend === 'Upward' ? 'success' : salesAnalysis?.trend === 'Downward' ? 'danger' : 'muted'}">
                  <i class="bi bi-arrow-${salesAnalysis?.trend === 'Upward' ? 'up' : salesAnalysis?.trend === 'Downward' ? 'down' : 'right'}"></i>
                  ${salesAnalysis?.trend || 'N/A'}
                </small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h6 class="card-subtitle mb-2 text-muted" ${tooltipAttr('Average value of each transaction in the current year.')}>Average Order Value</h6>
                <h3 class="card-title mb-0">$${stats?.average_order_value?.toFixed(2) || '0.00'}</h3>
                <small class="text-muted">Current Year</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h6 class="card-subtitle mb-2 text-muted" ${tooltipAttr('Total number of unique orders placed in the current year.')}>Total Orders</h6>
                <h3 class="card-title mb-0">${stats?.total_orders?.toLocaleString() || '0'}</h3>
                <small class="text-muted">Current Year</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h6 class="card-subtitle mb-2 text-muted" ${tooltipAttr('Percentage of store visits resulting in an order (current year).')}>Conversion Rate</h6>
                 <h3 class="card-title mb-0">${stats?.conversion_rate?.toFixed(2) || '0.00'}%</h3>
                <small class="text-muted">Current Year</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="row mb-4">
          <div class="col-md-8">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h5 class="card-title" ${tooltipAttr('Daily sales revenue over the last 30 days.')}>Sales Trend (Last 30 Days)</h5>
                <div class="chart-container">
                  <canvas id="salesTrendChart"></canvas>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h5 class="card-title" ${tooltipAttr('Total sales revenue per department category.')}>Sales by Category</h5>
                 <div class="chart-container">
                  <canvas id="categoryChart"></canvas>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Products and Regional Performance -->
        <div class="row">
          <div class="col-md-6">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h5 class="card-title" ${tooltipAttr('Top 10 performing departments by total sales revenue.')}>Top Departments (by Sales)</h5>
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th>Sales</th>
                        <th>Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${topProducts && topProducts.length > 0 ? topProducts.slice(0, 5).map(product => `
                        <tr>
                          <td>${product?.name || 'N/A'}</td>
                          <td>$${product?.sales?.toLocaleString() || '0'}</td>
                          <td>${product?.total_orders?.toLocaleString() || '0'}</td> 
                        </tr>
                      `).join('') : '<tr><td colspan="3">No data</td></tr>'}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h5 class="card-title" ${tooltipAttr('Total sales revenue per store region.')}>Sales by Region</h5>
                 <div class="chart-container">
                  <canvas id="regionalChart"></canvas>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize charts
    const salesTrendCtx = document.getElementById('salesTrendChart')?.getContext('2d');
    if (salesTrendCtx && salesData?.dates && salesData?.sales) {
      const salesTrendChart = new Chart(salesTrendCtx, {
        type: 'line',
        data: {
          labels: salesData.dates,
          datasets: [{
            label: 'Sales',
            data: salesData.sales,
            borderColor: '#0d6efd',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: value => '$' + value.toLocaleString()
              }
            }
          }
        }
      });
      activeCharts.push(salesTrendChart);
    }

    const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
    if (categoryCtx && categoryData?.categories && categoryData?.sales) {
      const categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
          labels: categoryData.categories,
          datasets: [{
            data: categoryData.sales,
            backgroundColor: ['#0d6efd', '#6f42c1', '#d63384', '#fd7e14', '#198754', '#20c997', '#ffc107', '#dc3545', '#0dcaf0', '#6c757d'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12 } },
            tooltip: { callbacks: { label: (context) => `${context.label}: $${context.raw.toLocaleString()}` } }
          }
        }
      });
      activeCharts.push(categoryChart);
    }

    const regionalCtx = document.getElementById('regionalChart')?.getContext('2d');
    if (regionalCtx && regionalData?.regions && regionalData?.sales) {
      const regionalChart = new Chart(regionalCtx, {
        type: 'bar',
        data: {
          labels: regionalData.regions, // Use regions array
          datasets: [{
            label: 'Sales',
            data: regionalData.sales, // Use sales array
            backgroundColor: '#0d6efd'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: value => '$' + value.toLocaleString()
              }
            }
          }
        }
      });
      activeCharts.push(regionalChart);
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
    if (mainContent) { // Check if mainContent exists before modifying
      mainContent.innerHTML = `
        <div class="container-fluid py-4">
          <div class="alert alert-danger" role="alert">
            <h4 class="alert-heading">Error Loading Dashboard</h4>
            <p>${error.message}</p>
            <hr>
            <button class="btn btn-outline-danger" onclick="window.location.reload()">Retry</button>
          </div>
        </div>
      `;
    }
  } finally {
    showLoading(false);
  }
}

// Helper function to destroy active charts
function destroyActiveCharts() {
  activeCharts.forEach(chart => chart.destroy());
  activeCharts = [];
}

// Start initialization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeDashboard().catch(error => {
    console.error('Error during initialization:', error);
    showToast('Failed to initialize the dashboard. Please refresh the page.', 'danger');
  });
});

// Update the fetchSalesData and fetchInventoryData functions
async function fetchSalesData() {
  return dashboardApi.getSalesData();
}

async function fetchInventoryData() {
  return analyticsApi.getInventoryData();
}

// Toggle theme
function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', state.theme);
  document.documentElement.setAttribute('data-bs-theme', state.theme);
  updateThemeIcons();
}

// Update theme icons
function updateThemeIcons() {
  const lightIcon = document.querySelector('.theme-icon-light');
  const darkIcon = document.querySelector('.theme-icon-dark');
  
  if (state.theme === 'dark') {
    lightIcon.classList.add('d-none');
    darkIcon.classList.remove('d-none');
  } else {
    lightIcon.classList.remove('d-none');
    darkIcon.classList.add('d-none');
  }
}

// Load analytics content (Enhanced with Charts)
async function loadAnalytics(mainContent, filters = {}) { // Add filters parameter back
  if (!mainContent) return;
  showLoading(true);
  
  // Define default/current dates for filters
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const currentStoreId = filters.storeId || ''; // Use '' for "All Stores"
  const currentStartDate = filters.startDate || defaultStartDate;
  const currentEndDate = filters.endDate || defaultEndDate;

  try {
    // Fetch necessary data in parallel (add stores back)
    const [inventoryMetrics, productPerformance, categoryData, stores] = await Promise.all([
      analyticsApi.getInventoryMetrics(),
      // Pass current filters to getProductPerformance
      analyticsApi.getProductPerformance({ 
          storeId: currentStoreId, 
          startDate: currentStartDate, 
          endDate: currentEndDate 
      }), 
      dashboardApi.getCategoryData(), 
      dashboardApi.getStores() // Fetch store list again
    ]);

    // --- Extract actual data from response object ---
    const actualProductPerformance = productPerformance?.data || []; // Access .data field
    
    // --- Log raw data --- 
    console.log('Raw productPerformance data object:', productPerformance);
    console.log('Extracted actualProductPerformance array:', actualProductPerformance);

    // --- Prepare Data for Charts ---
    // Use the extracted array
    const safeProductPerformance = Array.isArray(actualProductPerformance) ? actualProductPerformance : [];
    console.log('Safe productPerformance array:', safeProductPerformance); 
    
    const topSalesProducts = [...safeProductPerformance]
      .sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0))
      .slice(0, 5);
    console.log('Top 5 Sales Products:', topSalesProducts); // Log result
      
    const topGrowthProducts = [...safeProductPerformance]
      .filter(p => p.sales_growth_rate != null && p.sales_growth_rate > 0)
      .sort((a, b) => (b.sales_growth_rate || 0) - (a.sales_growth_rate || 0))
      .slice(0, 5);
    console.log('Top 5 Growth Products:', topGrowthProducts); // Log result
      
    // Build Store Filter Dropdown Options (re-add)
    const storeOptions = stores && stores.length > 0 
        ? stores.map(store => `<option value="${store.store_id}" ${store.store_id == currentStoreId ? 'selected' : ''}>${store.name} (ID: ${store.store_id})</option>`).join('')
        : '<option value="" disabled>No stores found</option>';
      
    mainContent.innerHTML = `
      <div class="container-fluid py-4">
        <h3 class="mb-4">Advanced Analytics</h3>
        
        <!-- Filter Row (Re-add) -->
        <div class="row mb-4">
          <div class="col-md-4">
            <label for="storeFilter" class="form-label">Store</label>
            <select id="storeFilter" class="form-select">
              <option value="" ${currentStoreId === '' ? 'selected' : ''}>All Stores</option>
              ${storeOptions}
            </select>
          </div>
          <div class="col-md-3">
            <label for="startDateFilter" class="form-label">Start Date</label>
            <input type="date" id="startDateFilter" class="form-control" value="${currentStartDate}">
          </div>
          <div class="col-md-3">
            <label for="endDateFilter" class="form-label">End Date</label>
            <input type="date" id="endDateFilter" class="form-control" value="${currentEndDate}">
          </div>
           <div class="col-md-2 d-flex align-items-end">
             <button id="applyFiltersBtn" class="btn btn-primary w-100" type="button">Apply Filters</button> <!-- Added type="button" -->
           </div>
        </div>

        <!-- Key Inventory Metrics -->
        <div class="row mb-4">
          <h5 class="mb-3" ${tooltipAttr('Overall inventory health indicators.')}>Key Inventory Metrics (Overall)</h5>
          <!-- ... (Metrics cards remain the same) ... -->
           <div class="col-md-6"> 
             <div class="card border-0 shadow-sm mb-3">
               <div class="card-body">
                 <h6 class="card-subtitle mb-2 text-muted" ${tooltipAttr('Total number of unique product departments tracked across all stores.')}>Total Products (Overall)</h6>
                 <h3 class="card-title mb-0">${inventoryMetrics?.total_products?.toLocaleString() || 'N/A'}</h3>
               </div>
             </div>
           </div>
           <div class="col-md-6">
             <div class="card border-0 shadow-sm mb-3">
               <div class="card-body">
                 <h6 class="card-subtitle mb-2 text-muted" ${tooltipAttr('Total number of distinct product categories across all stores.')}>Total Categories (Overall)</h6>
                 <h3 class="card-title mb-0">${inventoryMetrics?.total_categories?.toLocaleString() || 'N/A'}</h3>
               </div>
             </div>
           </div>
        </div>
        
        <!-- Charts Row -->
        <div class="row mb-4">
          <h5 class="mb-3">Visual Insights (Filtered)</h5> <!-- Clarify charts are filtered -->
           <!-- ... (Chart canvas elements remain the same) ... -->
             <div class="col-md-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body">
                <h6 class="card-title" ${tooltipAttr('Sales distribution across product categories.')}>Sales by Category</h6>
                <div class="chart-container" style="height: 250px;"> 
                  <canvas id="categoryDistributionChart"></canvas>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body">
                <h6 class="card-title" ${tooltipAttr('Top 5 products by total sales based on filters.')}>Top 5 Products (by Sales)</h6>
                 <div class="chart-container" style="height: 250px;">
                  <canvas id="topSalesChart"></canvas>
                 </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body">
                <h6 class="card-title" ${tooltipAttr('Top 5 products by sales growth rate based on filters.')}>Top 5 Products (by Growth %)</h6>
                 <div class="chart-container" style="height: 250px;">
                  <canvas id="topGrowthChart"></canvas>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Product Performance Table -->
        <div class="row">
           <h5 class="mb-3">Detailed Product Performance (Filtered)</h5> <!-- Clarify table is filtered -->
          <div class="col-12">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-hover table-sm">
                     <thead>
                      <tr>
                        <th ${tooltipAttr('Department Name')}>Product (Dept)</th>
                        <th ${tooltipAttr('Product Category')}>Category</th>
                        <th class="text-end" ${tooltipAttr('Total sales revenue in the selected period.')}>Total Sales</th> <!-- Update tooltip/header -->
                        <th class="text-end" ${tooltipAttr('Average weekly sales revenue over the product\'s lifetime (overall).')}>Avg. Weekly Sales</th> <!-- Update tooltip/header -->
                        <th class="text-end" ${tooltipAttr('Sales growth percentage comparing selected period to prior equivalent period.')}>Sales Growth Rate (%)</th>
                        <th class="text-center" ${tooltipAttr('Number of stores the product is present in.')}>Store Presence</th>
                        <th class="text-center" ${tooltipAttr('Number of months the product has recorded sales.')}>Months Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${safeProductPerformance && safeProductPerformance.length > 0 ? safeProductPerformance.map(p => `
                        <tr>
                          <td>${p.name || 'N/A'}</td>
                          <td>${p.category || 'N/A'}</td>
                          <td class="text-end">$${p.total_sales?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</td>
                          <td class="text-end">$${p.avg_sales?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</td>
                          <td class="text-end ${p.sales_growth_rate == null ? 'text-muted' : p.sales_growth_rate > 0 ? 'text-success' : p.sales_growth_rate < 0 ? 'text-danger' : ''}">
                            ${p.sales_growth_rate != null ? p.sales_growth_rate.toFixed(2) + '%' : 'N/A'}
                          </td>
                          <td class="text-center">${p.store_presence?.toLocaleString() || '0'}</td>
                          <td class="text-center">${p.months_active?.toLocaleString() || '0'}</td>
                        </tr>
                      `).join('') : '<tr><td colspan="7" class="text-center text-muted">No product data found for the selected filters.</td></tr>'} <!-- Update message -->
                    </tbody>
                  </table>
                </div>
                <p class="text-muted small mt-2">
                  <i class="bi bi-info-circle me-1"></i> Sales Growth Rate compares the selected period's sales to the immediately preceding period of the same duration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // --- Initialize Charts (remains the same) --- 
    destroyActiveCharts(); 
    // ... (Chart initialization code for category, top sales, top growth) ...
    // Category Distribution Chart
    const categoryCtx = document.getElementById('categoryDistributionChart')?.getContext('2d');
    if (categoryCtx && categoryData?.categories && categoryData?.sales) {
      const categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
          labels: categoryData.categories,
          datasets: [{
            data: categoryData.sales,
            backgroundColor: ['#0d6efd', '#6f42c1', '#d63384', '#fd7e14', '#198754', '#20c997', '#ffc107', '#dc3545', '#0dcaf0', '#6c757d'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12 } },
            tooltip: { callbacks: { label: (context) => `${context.label}: $${context.raw.toLocaleString()}` } }
          }
        }
      });
      activeCharts.push(categoryChart);
    }
    // Top Sales Chart
    const topSalesCtx = document.getElementById('topSalesChart')?.getContext('2d');
    if (topSalesCtx && topSalesProducts.length > 0) {
      const topSalesChart = new Chart(topSalesCtx, {
        type: 'bar',
        data: {
          labels: topSalesProducts.map(p => p.name),
          datasets: [{
            label: 'Total Sales',
            data: topSalesProducts.map(p => p.total_sales),
            backgroundColor: '#198754' // Green
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => `$${context.raw.toLocaleString()}` } } },
          scales: { x: { beginAtZero: true, ticks: { callback: value => '$' + value.toLocaleString() } } }
        }
      });
      activeCharts.push(topSalesChart);
    }
    // Top Growth Chart
    const topGrowthCtx = document.getElementById('topGrowthChart')?.getContext('2d');
    if (topGrowthCtx && topGrowthProducts.length > 0) {
      const topGrowthChart = new Chart(topGrowthCtx, {
        type: 'bar',
        data: {
          labels: topGrowthProducts.map(p => p.name),
          datasets: [{
            label: 'Sales Growth Rate (%)',
            data: topGrowthProducts.map(p => p.sales_growth_rate),
            backgroundColor: '#0d6efd' // Blue
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => `${context.raw.toFixed(2)}%` } } },
          scales: { x: { beginAtZero: true, ticks: { callback: value => value + '%' } } }
        }
      });
      activeCharts.push(topGrowthChart);
    }

    // Add event listeners for filter changes (re-add)
    const applyBtn = document.getElementById('applyFiltersBtn');
    const storeFilter = document.getElementById('storeFilter');
    const startDateFilter = document.getElementById('startDateFilter');
    const endDateFilter = document.getElementById('endDateFilter');

    if (applyBtn && storeFilter && startDateFilter && endDateFilter) {
       applyBtn.addEventListener('click', (event) => { // Add event parameter
         event.preventDefault(); // Prevent default button behavior (like page reload)
         const newFilters = {
           storeId: storeFilter.value,
           startDate: startDateFilter.value,
           endDate: endDateFilter.value
         };
         // Call loadAnalytics again with the new filters
         loadAnalytics(mainContent, newFilters); 
       });
    } else {
      console.error("Filter elements not found after loading analytics content.");
    }
    
    initializeTooltips(); // Re-initialize tooltips

  } catch (error) {
    console.error('Error loading enhanced analytics page:', error);
    // Error handling remains the same
    mainContent.innerHTML = `
      <div class="container-fluid py-4">
        <div class="alert alert-danger" role="alert">
          <h4 class="alert-heading">Error Loading Analytics</h4>
          <p>${error.message}</p>
          <hr>
          <button class="btn btn-outline-danger" onclick="loadAnalytics(document.getElementById('main-content'))">Retry</button>
        </div>
      </div>
    `;
  } finally {
    showLoading(false);
  }
}

// Make loadAnalytics globally accessible for inline retry buttons
window.loadAnalytics = loadAnalytics;
window.loadDashboard = loadDashboard; // Also make dashboard loader global if it has retry
window.loadInventory = loadInventory; // Add other view loaders as needed
window.loadReports = loadReports;