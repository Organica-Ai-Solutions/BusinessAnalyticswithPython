"""
Data Processor for Retail Analytics

This module handles:
1. Data retrieval from various sources
2. Data cleaning and preprocessing
3. Basic feature engineering
4. Data export for analysis
"""

import pandas as pd
import numpy as np
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class RetailDataProcessor:
    """Handles retrieval and preprocessing of retail data"""
    
    def __init__(self, data_dir='../../data'):
        """
        Initialize the data processor
        
        Parameters:
        -----------
        data_dir : str
            Directory where data files are stored
        """
        self.data_dir = data_dir
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
            logger.info(f"Created data directory: {data_dir}")
        
        self.raw_data = None
        self.clean_data = None

    def retrieve_data(self, source_type='csv', file_path=None, url=None):
        """
        Retrieve data from a source (local file or URL)
        
        Parameters:
        -----------
        source_type : str
            Type of data source ('csv', 'excel', 'sql', 'api')
        file_path : str
            Path to the local data file (if applicable)
        url : str
            URL to fetch data from (if applicable)
            
        Returns:
        --------
        pandas.DataFrame
            The retrieved raw data
        """
        logger.info(f"Retrieving data from {source_type} source")
        
        if source_type == 'csv' and file_path:
            file_path = os.path.join(self.data_dir, file_path) if not os.path.isabs(file_path) else file_path
            try:
                self.raw_data = pd.read_csv(file_path)
                logger.info(f"Successfully loaded data from {file_path}")
            except Exception as e:
                logger.error(f"Error loading CSV file: {e}")
                raise
        
        elif source_type == 'excel' and file_path:
            file_path = os.path.join(self.data_dir, file_path) if not os.path.isabs(file_path) else file_path
            try:
                self.raw_data = pd.read_excel(file_path)
                logger.info(f"Successfully loaded data from {file_path}")
            except Exception as e:
                logger.error(f"Error loading Excel file: {e}")
                raise
        
        elif source_type == 'api' and url:
            try:
                self.raw_data = pd.read_json(url)
                logger.info(f"Successfully loaded data from API: {url}")
            except Exception as e:
                logger.error(f"Error fetching API data: {e}")
                raise
        
        elif source_type == 'demo':
            # Generate synthetic retail data for demonstration purposes
            logger.info("Generating synthetic retail demo data")
            self.raw_data = self._generate_demo_data()
        
        else:
            logger.error(f"Unsupported data source type: {source_type}")
            raise ValueError(f"Unsupported data source type: {source_type}")
        
        logger.info(f"Retrieved {len(self.raw_data)} records")
        return self.raw_data
    
    def clean_data(self):
        """
        Clean and preprocess the raw data
        
        Returns:
        --------
        pandas.DataFrame
            The cleaned dataset
        """
        if self.raw_data is None:
            logger.error("No raw data available for cleaning")
            raise ValueError("Please retrieve data before cleaning")
        
        logger.info("Starting data cleaning process")
        df = self.raw_data.copy()
        
        # Step 1: Handle date columns
        logger.info("Converting date columns")
        if 'Date' in df.columns:
            df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
        
        # Step 2: Handle missing values
        logger.info("Handling missing values")
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            # Fill numeric missing values with median
            if df[col].isna().sum() > 0:
                logger.info(f"Filling missing values in {col}")
                df[col] = df[col].fillna(df[col].median())
        
        # For categorical columns, fill with mode
        categorical_cols = df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            if df[col].isna().sum() > 0:
                logger.info(f"Filling missing values in {col}")
                df[col] = df[col].fillna(df[col].mode()[0])
        
        # Step 3: Remove duplicates
        logger.info("Removing duplicate records")
        initial_rows = len(df)
        df = df.drop_duplicates()
        logger.info(f"Removed {initial_rows - len(df)} duplicate records")
        
        # Step 4: Fix outliers using IQR
        logger.info("Handling outliers in sales and quantity data")
        for col in ['Sales', 'Quantity']:
            if col in df.columns:
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                
                # Cap outliers instead of removing them
                df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
                logger.info(f"Capped outliers in {col}")
        
        self.clean_data = df
        logger.info("Data cleaning completed")
        return self.clean_data
    
    def add_features(self):
        """
        Add useful features to the cleaned data
        
        Returns:
        --------
        pandas.DataFrame
            Dataset with additional features
        """
        if self.clean_data is None:
            logger.error("No clean data available for feature engineering")
            raise ValueError("Please clean data before adding features")
        
        logger.info("Starting feature engineering process")
        df = self.clean_data.copy()
        
        # Add time-based features
        if 'Date' in df.columns:
            logger.info("Adding time-based features")
            df['Year'] = df['Date'].dt.year
            df['Month'] = df['Date'].dt.month
            df['Day'] = df['Date'].dt.day
            df['DayOfWeek'] = df['Date'].dt.dayofweek
            df['Weekend'] = df['DayOfWeek'].isin([5, 6]).astype(int)
            df['Quarter'] = df['Date'].dt.quarter
        
        # Calculate transaction-based features
        if all(col in df.columns for col in ['Transaction_ID', 'Product']):
            logger.info("Calculating transaction-based features")
            # Items per transaction
            transaction_counts = df.groupby('Transaction_ID')['Product'].count()
            transaction_map = transaction_counts.to_dict()
            df['ItemsPerTransaction'] = df['Transaction_ID'].map(transaction_map)
        
        # Calculate store-based features if possible
        if 'Store' in df.columns and 'Sales' in df.columns:
            logger.info("Calculating store performance metrics")
            # Store average daily sales
            store_daily_avg = df.groupby(['Store', 'Date'])['Sales'].sum().groupby('Store').mean()
            df['StoreAvgDailySales'] = df['Store'].map(store_daily_avg.to_dict())
        
        logger.info("Feature engineering completed")
        return df
    
    def export_data(self, output_path, format='csv'):
        """
        Export the processed data
        
        Parameters:
        -----------
        output_path : str
            Path where to save the processed data
        format : str
            Export format ('csv', 'excel', 'parquet')
        """
        if self.clean_data is None:
            logger.error("No processed data available for export")
            raise ValueError("Please process data before exporting")
        
        output_path = os.path.join(self.data_dir, output_path) if not os.path.isabs(output_path) else output_path
        
        logger.info(f"Exporting processed data to {output_path}")
        
        try:
            if format == 'csv':
                self.clean_data.to_csv(output_path, index=False)
            elif format == 'excel':
                self.clean_data.to_excel(output_path, index=False)
            elif format == 'parquet':
                self.clean_data.to_parquet(output_path, index=False)
            else:
                logger.error(f"Unsupported export format: {format}")
                raise ValueError(f"Unsupported export format: {format}")
                
            logger.info(f"Data successfully exported to {output_path}")
        except Exception as e:
            logger.error(f"Error exporting data: {e}")
            raise
    
    def _generate_demo_data(self, n_stores=10, n_products=50, n_days=90):
        """
        Generate synthetic retail data for demonstration
        
        Parameters:
        -----------
        n_stores : int
            Number of stores to simulate
        n_products : int
            Number of products to simulate
        n_days : int
            Number of days of sales history
            
        Returns:
        --------
        pandas.DataFrame
            Synthetic retail dataset
        """
        logger.info(f"Generating demo data with {n_stores} stores, {n_products} products over {n_days} days")
        
        # Set random seed for reproducibility
        np.random.seed(42)
        
        # Generate date range
        end_date = datetime.now().date()
        date_range = pd.date_range(end=end_date, periods=n_days)
        
        # Generate store IDs
        store_ids = [f'S{i:03d}' for i in range(1, n_stores + 1)]
        
        # Generate department names
        departments = ['Clothing', 'Electronics', 'Grocery', 'Home', 'Beauty', 'Toys', 'Sports']
        
        # Generate product names
        products = []
        for dept in departments:
            for i in range(1, n_products // len(departments) + 2):
                products.append(f'{dept}_{i:03d}')
        products = products[:n_products]  # Ensure exactly n_products
        
        # Create empty list to store data
        data = []
        
        # Generate transaction counter
        transaction_counter = 1
        
        # Generate rows
        for date in date_range:
            for store in store_ids:
                # Determine number of transactions for this store-day
                n_transactions = np.random.poisson(50)  # Average 50 transactions per store per day
                
                for _ in range(n_transactions):
                    transaction_id = f'T{transaction_counter:07d}'
                    transaction_counter += 1
                    
                    # Determine number of items in this transaction
                    n_items = np.random.geometric(p=0.3)  # Geometric distribution for number of items
                    n_items = min(max(n_items, 1), 10)  # Between 1 and 10 items
                    
                    # Select products for this transaction
                    transaction_products = np.random.choice(products, size=n_items, replace=False)
                    department_for_products = [p.split('_')[0] for p in transaction_products]
                    
                    # Customer count is usually 1, occasionally 2
                    customer_count = np.random.choice([1, 2], p=[0.9, 0.1])
                    
                    for product, department in zip(transaction_products, department_for_products):
                        # Generate quantity
                        quantity = np.random.randint(1, 5)
                        
                        # Generate unit price based on department
                        if department == 'Electronics':
                            unit_price = np.random.uniform(50, 500)
                        elif department == 'Clothing':
                            unit_price = np.random.uniform(10, 100)
                        elif department == 'Grocery':
                            unit_price = np.random.uniform(2, 20)
                        elif department == 'Home':
                            unit_price = np.random.uniform(15, 150)
                        else:
                            unit_price = np.random.uniform(5, 50)
                        
                        # Calculate sales
                        sales = quantity * unit_price
                        
                        # Add noise to make it realistic
                        sales = sales * np.random.uniform(0.95, 1.05)
                        
                        # Append to data
                        data.append({
                            'Date': date,
                            'Store': store,
                            'Department': department,
                            'Product': product,
                            'Quantity': quantity,
                            'Sales': round(sales, 2),
                            'Transaction_ID': transaction_id,
                            'Customers': customer_count
                        })
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        
        # Add some missing values to make it realistic
        mask = np.random.random(len(df)) < 0.01  # 1% missing rate
        df.loc[mask, 'Quantity'] = np.nan
        
        mask = np.random.random(len(df)) < 0.01  # 1% missing rate
        df.loc[mask, 'Sales'] = np.nan
        
        # Add a few true outliers
        outlier_mask = np.random.random(len(df)) < 0.005  # 0.5% outlier rate
        df.loc[outlier_mask, 'Sales'] = df.loc[outlier_mask, 'Sales'] * 10
        
        logger.info(f"Generated {len(df)} records of synthetic retail data")
        return df


# Example usage if run as script
if __name__ == "__main__":
    processor = RetailDataProcessor()
    
    # Generate demo data
    raw_data = processor.retrieve_data(source_type='demo')
    print(f"Raw data shape: {raw_data.shape}")
    
    # Clean the data
    clean_data = processor.clean_data()
    print(f"Clean data shape: {clean_data.shape}")
    
    # Add features
    enriched_data = processor.add_features()
    print(f"Enriched data shape: {enriched_data.shape}")
    
    # Export the processed data
    processor.export_data('retail_sales_processed.csv') 