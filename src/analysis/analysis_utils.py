"""
Retail Analysis Utilities

This module contains utility functions for retail data analysis,
organized by the book chapters.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from sklearn.metrics import silhouette_score
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Set default matplotlib style
plt.style.use('seaborn-whitegrid')
plt.rcParams['figure.figsize'] = (12, 8)

###########################################
# Chapter 3: Retail KPI Functions
###########################################

def calculate_sales_kpis(data):
    """
    Calculate sales-related KPIs
    
    Parameters:
    -----------
    data : pandas.DataFrame
        Retail sales data
        
    Returns:
    --------
    dict
        Dictionary of KPIs
    """
    kpis = {}
    
    # Sales per department
    kpis['sales_by_department'] = data.groupby('Department')['Sales'].sum()
    
    # Sales per store
    kpis['sales_by_store'] = data.groupby('Store')['Sales'].sum()
    
    # Average transaction value
    if 'Transaction_ID' in data.columns:
        kpis['avg_transaction_value'] = data.groupby('Transaction_ID')['Sales'].sum().mean()
    
    # Revenue per square foot (requires store size data)
    # This would need store metadata with square footage
    
    return kpis

def calculate_customer_kpis(data):
    """
    Calculate customer-related KPIs
    
    Parameters:
    -----------
    data : pandas.DataFrame
        Retail sales data
        
    Returns:
    --------
    dict
        Dictionary of KPIs
    """
    kpis = {}
    
    # Customer count
    if 'Customers' in data.columns:
        kpis['total_customers'] = data['Customers'].sum()
    
    # Conversion rate (requires visits data)
    if 'Transaction_ID' in data.columns and 'Customers' in data.columns:
        transactions = data['Transaction_ID'].nunique()
        customers = data['Customers'].sum()
        kpis['conversion_rate'] = transactions / customers if customers > 0 else 0
    
    # Other KPIs would require additional data like:
    # - Customer Acquisition Cost (would need marketing spend data)
    # - Customer Lifetime Value (would need historical customer data)
    
    return kpis

def calculate_time_kpis(data):
    """
    Calculate time-related KPIs and seasonality indices
    
    Parameters:
    -----------
    data : pandas.DataFrame
        Retail sales data with a 'Date' column
        
    Returns:
    --------
    dict
        Dictionary of KPIs
    """
    kpis = {}
    
    if 'Date' not in data.columns:
        logger.warning("Date column not found in data")
        return kpis
    
    # Ensure Date is datetime
    data = data.copy()
    data['Date'] = pd.to_datetime(data['Date'])
    
    # Monthly sales
    monthly_sales = data.groupby(data['Date'].dt.to_period('M'))['Sales'].sum()
    kpis['monthly_sales'] = monthly_sales
    
    # Seasonality indices (monthly)
    avg_monthly_sales = monthly_sales.mean()
    kpis['monthly_seasonality_indices'] = monthly_sales / avg_monthly_sales * 100
    
    # Day of week patterns
    dow_sales = data.groupby(data['Date'].dt.dayofweek)['Sales'].sum()
    total_sales = dow_sales.sum()
    kpis['day_of_week_distribution'] = dow_sales / total_sales * 100
    
    return kpis

def calculate_operational_kpis(data, inventory_data=None):
    """
    Calculate operational KPIs
    
    Parameters:
    -----------
    data : pandas.DataFrame
        Retail sales data
    inventory_data : pandas.DataFrame, optional
        Inventory data with stock levels
        
    Returns:
    --------
    dict
        Dictionary of KPIs
    """
    kpis = {}
    
    # These KPIs would typically require additional data:
    # - Stockout rate (would need inventory data)
    # - Inventory turnover (would need inventory data)
    
    if inventory_data is not None:
        # Example calculation if inventory data was provided
        logger.info("Inventory data provided, calculating inventory KPIs")
        # Calculations would go here
    else:
        logger.warning("Inventory data not provided, skipping inventory KPIs")
    
    return kpis

###########################################
# Chapter 4: Data Pattern Functions
###########################################

def analyze_sales_seasonality(data):
    """
    Analyze sales seasonality patterns
    
    Parameters:
    -----------
    data : pandas.DataFrame
        Retail sales data with 'Date' and 'Sales' columns
        
    Returns:
    --------
    dict
        Dictionary of seasonality analyses
    """
    results = {}
    
    if 'Date' not in data.columns:
        logger.warning("Date column not found in data")
        return results
    
    # Ensure Date is datetime
    data = data.copy()
    data['Date'] = pd.to_datetime(data['Date'])
    
    # Add time components
    data['Year'] = data['Date'].dt.year
    data['Month'] = data['Date'].dt.month
    data['DayOfWeek'] = data['Date'].dt.dayofweek
    data['Quarter'] = data['Date'].dt.quarter
    
    # Monthly patterns
    monthly_sales = data.groupby(['Year', 'Month'])['Sales'].sum().unstack(level=0)
    results['monthly_sales'] = monthly_sales
    
    # Quarterly patterns
    quarterly_sales = data.groupby(['Year', 'Quarter'])['Sales'].sum().unstack(level=0)
    results['quarterly_sales'] = quarterly_sales
    
    # Day of week patterns
    dow_sales = data.groupby('DayOfWeek')['Sales'].sum()
    results['dow_sales'] = dow_sales
    
    # Department seasonality
    if 'Department' in data.columns:
        dept_monthly_sales = data.groupby(['Department', 'Month'])['Sales'].sum().unstack(level=0)
        results['department_monthly_sales'] = dept_monthly_sales
    
    # Plot seasonality patterns
    plt.figure(figsize=(14, 8))
    sns.lineplot(data=data.groupby(['Year', 'Month'])['Sales'].sum().reset_index(), 
                 x='Month', y='Sales', hue='Year')
    plt.title('Monthly Sales by Year')
    plt.xlabel('Month')
    plt.ylabel('Total Sales')
    results['seasonality_plot'] = plt.gcf()
    plt.close()
    
    return results

def segment_stores(data, n_clusters=4):
    """
    Segment stores based on performance metrics
    
    Parameters:
    -----------
    data : pandas.DataFrame
        Retail sales data with 'Store' and 'Sales' columns
    n_clusters : int
        Number of clusters for segmentation
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with store segments and metrics
    """
    if 'Store' not in data.columns:
        logger.warning("Store column not found in data")
        return pd.DataFrame()
    
    # Calculate store-level metrics
    store_metrics = data.groupby('Store').agg({
        'Sales': 'sum',
        'Quantity': 'sum'
    })
    
    if 'Transaction_ID' in data.columns:
        transaction_count = data.groupby('Store')['Transaction_ID'].nunique()
        store_metrics['TransactionCount'] = transaction_count
        store_metrics['AvgTransactionValue'] = store_metrics['Sales'] / store_metrics['TransactionCount']
    
    if 'Customers' in data.columns:
        store_metrics['Customers'] = data.groupby('Store')['Customers'].sum()
        store_metrics['SalesPerCustomer'] = store_metrics['Sales'] / store_metrics['Customers']
    
    # Prepare data for clustering
    features = ['Sales']
    if 'TransactionCount' in store_metrics.columns:
        features.append('AvgTransactionValue')
    if 'Customers' in store_metrics.columns:
        features.append('SalesPerCustomer')
    
    # Standardize the data
    scaler = StandardScaler()
    X = scaler.fit_transform(store_metrics[features])
    
    # Apply K-means clustering
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    store_metrics['Cluster'] = kmeans.fit_predict(X)
    
    # Calculate silhouette score for cluster quality
    silhouette_avg = silhouette_score(X, store_metrics['Cluster'])
    logger.info(f"Store segmentation silhouette score: {silhouette_avg:.4f}")
    
    # Add cluster centers back to original scale
    centers = scaler.inverse_transform(kmeans.cluster_centers_)
    cluster_centers = pd.DataFrame(centers, columns=features)
    
    # Add additional info about clusters
    for i, cluster in enumerate(store_metrics['Cluster'].unique()):
        # Calculate the count and percentage of stores in each cluster
        count = (store_metrics['Cluster'] == cluster).sum()
        percentage = count / len(store_metrics) * 100
        logger.info(f"Cluster {cluster}: {count} stores ({percentage:.2f}%)")
    
    return store_metrics

def analyze_promotion_impact(data, promotion_column=None):
    """
    Analyze the impact of promotions on sales
    
    Parameters:
    -----------
    data : pandas.DataFrame
        Retail sales data
    promotion_column : str
        Column name containing promotion information
        
    Returns:
    --------
    dict
        Dictionary of promotion analyses
    """
    results = {}
    
    # This function ideally needs a column indicating whether a product was on promotion
    if promotion_column is None or promotion_column not in data.columns:
        logger.warning(f"Promotion column '{promotion_column}' not found in data")
        return results
    
    # Calculate sales with and without promotion
    promo_sales = data.groupby(promotion_column)['Sales'].sum()
    results['promotion_sales'] = promo_sales
    
    # Calculate uplift
    if 0 in promo_sales.index and 1 in promo_sales.index:
        baseline = promo_sales[0]
        promo = promo_sales[1]
        uplift = (promo - baseline) / baseline * 100
        results['promotion_uplift_pct'] = uplift
    
    # Analyze by department if available
    if 'Department' in data.columns:
        dept_promo = data.groupby(['Department', promotion_column])['Sales'].sum().unstack()
        results['department_promotion_sales'] = dept_promo
        
        # Calculate department-specific uplift
        if 0 in dept_promo.columns and 1 in dept_promo.columns:
            dept_uplift = (dept_promo[1] - dept_promo[0]) / dept_promo[0] * 100
            results['department_uplift'] = dept_uplift
    
    return results

def analyze_customer_behavior(data):
    """
    Analyze customer behavior patterns
    
    Parameters:
    -----------
    data : pandas.DataFrame
        Retail sales data
        
    Returns:
    --------
    dict
        Dictionary of customer behavior analyses
    """
    results = {}
    
    # This function would be more effective with customer ID data
    # but we can still derive some insights from transaction-level data
    
    if 'Transaction_ID' not in data.columns:
        logger.warning("Transaction_ID column not found in data")
        return results
    
    # Items per transaction
    items_per_transaction = data.groupby('Transaction_ID').size()
    results['items_per_transaction'] = {
        'mean': items_per_transaction.mean(),
        'median': items_per_transaction.median(),
        'distribution': items_per_transaction.value_counts().sort_index()
    }
    
    # Sales per transaction
    sales_per_transaction = data.groupby('Transaction_ID')['Sales'].sum()
    results['sales_per_transaction'] = {
        'mean': sales_per_transaction.mean(),
        'median': sales_per_transaction.median(),
        'distribution': pd.qcut(sales_per_transaction, 5).value_counts()
    }
    
    # Department popularity
    if 'Department' in data.columns:
        dept_popularity = data.groupby('Department')['Sales'].sum().sort_values(ascending=False)
        results['department_popularity'] = dept_popularity
    
    # Product popularity
    if 'Product' in data.columns:
        product_popularity = data.groupby('Product')['Quantity'].sum().sort_values(ascending=False)
        results['product_popularity'] = product_popularity.head(20)  # Top 20 products
    
    # Market basket analysis would be added here in a more comprehensive implementation
    
    return results

###########################################
# Chapter 6: Analytical Techniques
###########################################

def time_series_forecast(data, forecast_periods=30, method='arima'):
    """
    Perform time series forecasting using various methods
    
    Parameters:
    -----------
    data : pandas.DataFrame
        Time series data with 'Date' and 'Sales' columns
    forecast_periods : int
        Number of periods to forecast
    method : str
        Forecasting method ('arima', 'exponential_smoothing', 'prophet')
        
    Returns:
    --------
    dict
        Dictionary containing forecast results
    """
    results = {}
    
    if 'Date' not in data.columns or 'Sales' not in data.columns:
        logger.warning("Required columns (Date, Sales) not found in data")
        return results
    
    # Prepare time series data
    data = data.copy()
    data['Date'] = pd.to_datetime(data['Date'])
    
    # Aggregate to daily level
    daily_sales = data.groupby('Date')['Sales'].sum().reset_index()
    daily_sales = daily_sales.set_index('Date')
    
    # Split into train/test
    train_size = int(len(daily_sales) * 0.8)
    train = daily_sales.iloc[:train_size]
    test = daily_sales.iloc[train_size:]
    
    # Store original data
    results['train_data'] = train
    results['test_data'] = test
    
    if method == 'arima':
        # Fit ARIMA model
        try:
            model = SARIMAX(train, order=(1, 1, 1), seasonal_order=(0, 0, 0, 0))
            model_fit = model.fit(disp=False)
            
            # Generate forecast
            forecast = model_fit.get_forecast(steps=forecast_periods)
            forecast_index = pd.date_range(start=train.index[-1], periods=forecast_periods+1, freq='D')[1:]
            forecast_df = pd.DataFrame({
                'forecast': forecast.predicted_mean,
                'lower_ci': forecast.conf_int().iloc[:, 0],
                'upper_ci': forecast.conf_int().iloc[:, 1]
            }, index=forecast_index)
            
            results['forecast'] = forecast_df
            results['model'] = model_fit
        except Exception as e:
            logger.error(f"Error in ARIMA forecasting: {e}")
    
    elif method == 'exponential_smoothing':
        # Fit Exponential Smoothing model
        try:
            model = ExponentialSmoothing(
                train, 
                trend='add', 
                seasonal='add',
                seasonal_periods=7  # Assuming daily data with weekly seasonality
            )
            model_fit = model.fit()
            
            # Generate forecast
            forecast = model_fit.forecast(forecast_periods)
            forecast_index = pd.date_range(start=train.index[-1], periods=forecast_periods+1, freq='D')[1:]
            forecast_df = pd.DataFrame({
                'forecast': forecast
            }, index=forecast_index)
            
            results['forecast'] = forecast_df
            results['model'] = model_fit
        except Exception as e:
            logger.error(f"Error in Exponential Smoothing forecasting: {e}")
    
    elif method == 'prophet':
        # This would require Prophet package
        logger.warning("Prophet method requires additional package. Please install prophet package.")
        # Implementation would go here if Prophet is available
    
    return results

def detect_anomalies(data, method='isolation_forest', contamination=0.05):
    """
    Detect anomalies in time series data
    
    Parameters:
    -----------
    data : pandas.DataFrame
        Time series data with 'Date' and 'Sales' columns
    method : str
        Anomaly detection method ('isolation_forest', 'zscore', 'iqr')
    contamination : float
        Expected proportion of outliers (for isolation_forest)
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with anomaly flags
    """
    if 'Date' not in data.columns or 'Sales' not in data.columns:
        logger.warning("Required columns (Date, Sales) not found in data")
        return pd.DataFrame()
    
    # Prepare data
    data = data.copy()
    data['Date'] = pd.to_datetime(data['Date'])
    
    # Aggregate to daily level
    daily_sales = data.groupby('Date')['Sales'].sum().reset_index()
    
    if method == 'isolation_forest':
        # Apply Isolation Forest
        clf = IsolationForest(contamination=contamination, random_state=42)
        daily_sales['anomaly'] = clf.fit_predict(daily_sales[['Sales']])
        daily_sales['anomaly'] = daily_sales['anomaly'].map({1: 0, -1: 1})  # Convert to binary flag
    
    elif method == 'zscore':
        # Z-score method
        mean = daily_sales['Sales'].mean()
        std = daily_sales['Sales'].std()
        daily_sales['zscore'] = (daily_sales['Sales'] - mean) / std
        daily_sales['anomaly'] = (abs(daily_sales['zscore']) > 3).astype(int)
    
    elif method == 'iqr':
        # IQR method
        Q1 = daily_sales['Sales'].quantile(0.25)
        Q3 = daily_sales['Sales'].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        daily_sales['anomaly'] = ((daily_sales['Sales'] < lower_bound) | 
                                  (daily_sales['Sales'] > upper_bound)).astype(int)
    
    else:
        logger.warning(f"Unknown anomaly detection method: {method}")
        daily_sales['anomaly'] = 0
    
    # Count anomalies
    anomaly_count = daily_sales['anomaly'].sum()
    logger.info(f"Detected {anomaly_count} anomalies out of {len(daily_sales)} days ({anomaly_count/len(daily_sales)*100:.2f}%)")
    
    return daily_sales

def perform_market_basket_analysis(data, min_support=0.01, min_threshold=1):
    """
    Perform market basket analysis on transaction data
    
    Parameters:
    -----------
    data : pandas.DataFrame
        Transaction data with 'Transaction_ID' and 'Product' columns
    min_support : float
        Minimum support threshold
    min_threshold : float
        Minimum threshold for metrics (lift)
        
    Returns:
    --------
    dict
        Dictionary containing market basket analysis results
    """
    try:
        from mlxtend.frequent_patterns import apriori, association_rules
    except ImportError:
        logger.error("mlxtend package not found. Please install it with: pip install mlxtend")
        return {}
    
    results = {}
    
    if 'Transaction_ID' not in data.columns or 'Product' not in data.columns:
        logger.warning("Required columns (Transaction_ID, Product) not found in data")
        return results
    
    # Create transaction-product matrix
    basket = pd.crosstab(data['Transaction_ID'], data['Product'])
    
    # Convert to binary representation (1 if product was purchased, 0 otherwise)
    basket_sets = (basket > 0).astype(int)
    
    # Generate frequent itemsets
    try:
        frequent_itemsets = apriori(basket_sets, min_support=min_support, use_colnames=True)
        results['frequent_itemsets'] = frequent_itemsets
        
        # Generate association rules
        if not frequent_itemsets.empty:
            rules = association_rules(frequent_itemsets, metric='lift', min_threshold=min_threshold)
            results['association_rules'] = rules
            
            # Top rules by lift
            if not rules.empty:
                top_rules = rules.sort_values('lift', ascending=False).head(10)
                results['top_rules'] = top_rules
        else:
            logger.warning(f"No frequent itemsets found with min_support={min_support}")
    except Exception as e:
        logger.error(f"Error in market basket analysis: {e}")
    
    return results

###########################################
# Chapter 7: Dashboard Functions
###########################################

def generate_kpi_summary(data):
    """
    Generate a summary of KPIs for dashboards
    
    Parameters:
    -----------
    data : pandas.DataFrame
        Retail sales data
        
    Returns:
    --------
    dict
        Dictionary of KPI summaries
    """
    summary = {}
    
    # Calculate high-level KPIs
    summary['total_sales'] = data['Sales'].sum()
    summary['total_transactions'] = data['Transaction_ID'].nunique() if 'Transaction_ID' in data.columns else None
    summary['total_customers'] = data['Customers'].sum() if 'Customers' in data.columns else None
    summary['total_units'] = data['Quantity'].sum() if 'Quantity' in data.columns else None
    
    # Calculate derived KPIs
    if summary['total_transactions']:
        summary['avg_transaction_value'] = summary['total_sales'] / summary['total_transactions']
    
    if summary['total_customers']:
        summary['sales_per_customer'] = summary['total_sales'] / summary['total_customers']
    
    if summary['total_units']:
        summary['avg_unit_price'] = summary['total_sales'] / summary['total_units']
    
    # Store count
    summary['store_count'] = data['Store'].nunique() if 'Store' in data.columns else None
    
    # Department count
    summary['department_count'] = data['Department'].nunique() if 'Department' in data.columns else None
    
    # Product count
    summary['product_count'] = data['Product'].nunique() if 'Product' in data.columns else None
    
    # Date range
    if 'Date' in data.columns:
        summary['date_min'] = data['Date'].min()
        summary['date_max'] = data['Date'].max()
        summary['days_count'] = (data['Date'].max() - data['Date'].min()).days + 1
    
    return summary

def plot_sales_trend(data):
    """
    Generate a sales trend plot for dashboards
    
    Parameters:
    -----------
    data : pandas.DataFrame
        Retail sales data with 'Date' and 'Sales' columns
        
    Returns:
    --------
    matplotlib.figure.Figure
        Sales trend plot
    """
    if 'Date' not in data.columns or 'Sales' not in data.columns:
        logger.warning("Required columns (Date, Sales) not found in data")
        return None
    
    # Prepare data
    data = data.copy()
    data['Date'] = pd.to_datetime(data['Date'])
    
    # Aggregate to daily level
    daily_sales = data.groupby('Date')['Sales'].sum().reset_index()
    
    # Create plot
    fig, ax = plt.subplots(figsize=(12, 6))
    ax.plot(daily_sales['Date'], daily_sales['Sales'])
    ax.set_title('Daily Sales Trend')
    ax.set_xlabel('Date')
    ax.set_ylabel('Total Sales')
    ax.grid(True)
    
    # Format x-axis dates
    fig.autofmt_xdate()
    
    return fig

def plot_store_performance(data, top_n=10):
    """
    Generate a store performance plot for dashboards
    
    Parameters:
    -----------
    data : pandas.DataFrame
        Retail sales data with 'Store' and 'Sales' columns
    top_n : int
        Number of top stores to show
        
    Returns:
    --------
    matplotlib.figure.Figure
        Store performance plot
    """
    if 'Store' not in data.columns or 'Sales' not in data.columns:
        logger.warning("Required columns (Store, Sales) not found in data")
        return None
    
    # Calculate store sales
    store_sales = data.groupby('Store')['Sales'].sum().sort_values(ascending=False)
    
    # Select top N stores
    top_stores = store_sales.head(top_n)
    
    # Create plot
    fig, ax = plt.subplots(figsize=(12, 6))
    ax.bar(top_stores.index, top_stores.values)
    ax.set_title(f'Top {top_n} Stores by Sales')
    ax.set_xlabel('Store')
    ax.set_ylabel('Total Sales')
    ax.grid(True, axis='y')
    
    return fig

def plot_department_breakdown(data):
    """
    Generate a department sales breakdown plot for dashboards
    
    Parameters:
    -----------
    data : pandas.DataFrame
        Retail sales data with 'Department' and 'Sales' columns
        
    Returns:
    --------
    matplotlib.figure.Figure
        Department breakdown plot
    """
    if 'Department' not in data.columns or 'Sales' not in data.columns:
        logger.warning("Required columns (Department, Sales) not found in data")
        return None
    
    # Calculate department sales
    dept_sales = data.groupby('Department')['Sales'].sum().sort_values(ascending=False)
    
    # Create plot
    fig, ax = plt.subplots(figsize=(10, 8))
    ax.pie(dept_sales, labels=dept_sales.index, autopct='%1.1f%%', startangle=90)
    ax.set_title('Sales by Department')
    ax.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle
    
    return fig 