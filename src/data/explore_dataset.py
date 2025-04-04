#!/usr/bin/env python3
"""
Explore Retail Dataset

This script explores the retail dataset from Kaggle to understand its structure and content.
"""

import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def load_datasets():
    """Load the retail datasets"""
    
    # Set up data directory
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
    
    try:
        # Load the datasets
        sales_file = os.path.join(data_dir, "sales data-set.csv")
        features_file = os.path.join(data_dir, "Features data set.csv")
        stores_file = os.path.join(data_dir, "stores data-set.csv")
        
        sales_df = pd.read_csv(sales_file)
        features_df = pd.read_csv(features_file)
        stores_df = pd.read_csv(stores_file)
        
        logger.info(f"Loaded datasets: Sales ({sales_df.shape}), Features ({features_df.shape}), Stores ({stores_df.shape})")
        
        return sales_df, features_df, stores_df
    
    except Exception as e:
        logger.error(f"Error loading datasets: {e}")
        return None, None, None

def explore_dataset(df, name):
    """Explore a dataset"""
    
    logger.info(f"\n{'='*50}\nExploring {name} Dataset\n{'='*50}")
    
    # Basic info
    logger.info(f"Shape: {df.shape}")
    logger.info(f"Columns: {df.columns.tolist()}")
    
    # Data types
    logger.info("\nData Types:")
    for col in df.columns:
        logger.info(f"  {col}: {df[col].dtype}")
    
    # Missing values
    missing = df.isnull().sum()
    if missing.sum() > 0:
        logger.info("\nMissing Values:")
        for col in df.columns:
            missing_count = df[col].isnull().sum()
            if missing_count > 0:
                missing_percent = missing_count / len(df) * 100
                logger.info(f"  {col}: {missing_count} ({missing_percent:.2f}%)")
    else:
        logger.info("\nNo missing values")
    
    # Summary statistics
    logger.info("\nSummary Statistics:")
    summary = df.describe().T
    for idx, row in summary.iterrows():
        logger.info(f"  {idx}:")
        logger.info(f"    Min: {row['min']:.2f}, Max: {row['max']:.2f}, Mean: {row['mean']:.2f}, Median: {row['50%']:.2f}")
    
    # Unique values for categorical
    for col in df.select_dtypes(include=['object', 'bool']).columns:
        unique_vals = df[col].unique()
        if len(unique_vals) < 20:  # Only show if not too many unique values
            logger.info(f"\nUnique values for {col}: {unique_vals}")
        else:
            logger.info(f"\nUnique value count for {col}: {len(unique_vals)}")
    
    return df

def analyze_sales_trends(sales_df, features_df):
    """Analyze sales trends"""
    
    logger.info(f"\n{'='*50}\nSales Trends Analysis\n{'='*50}")
    
    # Convert date columns to datetime
    sales_df['Date'] = pd.to_datetime(sales_df['Date'])
    features_df['Date'] = pd.to_datetime(features_df['Date'])
    
    # Aggregate weekly sales by date
    weekly_sales = sales_df.groupby('Date')['Weekly_Sales'].sum().reset_index()
    
    # Calculate sales statistics
    total_sales = weekly_sales['Weekly_Sales'].sum()
    avg_weekly_sales = weekly_sales['Weekly_Sales'].mean()
    max_weekly_sales = weekly_sales['Weekly_Sales'].max()
    min_weekly_sales = weekly_sales['Weekly_Sales'].min()
    
    logger.info(f"Total Sales: ${total_sales:,.2f}")
    logger.info(f"Average Weekly Sales: ${avg_weekly_sales:,.2f}")
    logger.info(f"Maximum Weekly Sales: ${max_weekly_sales:,.2f}")
    logger.info(f"Minimum Weekly Sales: ${min_weekly_sales:,.2f}")
    
    # Sales by store
    store_sales = sales_df.groupby('Store')['Weekly_Sales'].sum().reset_index()
    top_stores = store_sales.sort_values('Weekly_Sales', ascending=False).head(5)
    
    logger.info("\nTop 5 Stores by Sales:")
    for idx, row in top_stores.iterrows():
        logger.info(f"  Store {row['Store']}: ${row['Weekly_Sales']:,.2f}")
    
    # Sales by department
    dept_sales = sales_df.groupby('Dept')['Weekly_Sales'].sum().reset_index()
    top_depts = dept_sales.sort_values('Weekly_Sales', ascending=False).head(5)
    
    logger.info("\nTop 5 Departments by Sales:")
    for idx, row in top_depts.iterrows():
        logger.info(f"  Department {row['Dept']}: ${row['Weekly_Sales']:,.2f}")
    
    # Holiday vs. Non-holiday sales
    holiday_sales = sales_df.groupby('IsHoliday')['Weekly_Sales'].mean()
    
    logger.info("\nAverage Sales:")
    logger.info(f"  Holiday: ${holiday_sales[True]:,.2f}")
    logger.info(f"  Non-Holiday: ${holiday_sales[False]:,.2f}")
    logger.info(f"  Difference: ${holiday_sales[True] - holiday_sales[False]:,.2f} ({(holiday_sales[True] / holiday_sales[False] - 1) * 100:.2f}%)")
    
    return weekly_sales, store_sales, dept_sales

def analyze_store_characteristics(sales_df, stores_df):
    """Analyze store characteristics"""
    
    logger.info(f"\n{'='*50}\nStore Characteristics Analysis\n{'='*50}")
    
    # Join sales and stores data
    store_data = sales_df.groupby('Store')['Weekly_Sales'].sum().reset_index()
    store_data = pd.merge(store_data, stores_df, on='Store')
    
    # Sales by store type
    type_sales = store_data.groupby('Type')['Weekly_Sales'].sum()
    
    logger.info("\nSales by Store Type:")
    for store_type, sales in type_sales.items():
        logger.info(f"  Type {store_type}: ${sales:,.2f}")
    
    # Store size analysis
    size_corr = store_data['Size'].corr(store_data['Weekly_Sales'])
    
    logger.info(f"\nCorrelation between Store Size and Sales: {size_corr:.4f}")
    
    # Average sales by store type
    type_avg_sales = store_data.groupby('Type')['Weekly_Sales'].mean()
    
    logger.info("\nAverage Sales by Store Type:")
    for store_type, avg_sales in type_avg_sales.items():
        logger.info(f"  Type {store_type}: ${avg_sales:,.2f}")
    
    return store_data

def main():
    """Main function to explore the dataset"""
    
    # Load the datasets
    sales_df, features_df, stores_df = load_datasets()
    
    if sales_df is None or features_df is None or stores_df is None:
        logger.error("Failed to load datasets")
        return
    
    # Explore each dataset
    sales_df = explore_dataset(sales_df, "Sales")
    features_df = explore_dataset(features_df, "Features")
    stores_df = explore_dataset(stores_df, "Stores")
    
    # Analyze sales trends
    weekly_sales, store_sales, dept_sales = analyze_sales_trends(sales_df, features_df)
    
    # Analyze store characteristics
    store_data = analyze_store_characteristics(sales_df, stores_df)
    
    logger.info("\nExploration complete!")

if __name__ == "__main__":
    main() 