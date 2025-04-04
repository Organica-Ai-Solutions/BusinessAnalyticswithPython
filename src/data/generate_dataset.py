#!/usr/bin/env python3
"""
Generate Retail Dataset

This script uses the RetailDataProcessor to generate a synthetic retail dataset,
clean it, and prepare it for analysis.
"""

import os
import argparse
import sys
import logging
from pathlib import Path

# Add parent directory to path to import the data_processor module
sys.path.append(str(Path(__file__).resolve().parent))
from data_processor import RetailDataProcessor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Generate and process retail dataset")
    
    parser.add_argument(
        "--output", 
        type=str, 
        default="retail_sales.csv",
        help="Name of the output file (default: retail_sales.csv)"
    )
    
    parser.add_argument(
        "--stores", 
        type=int, 
        default=45,
        help="Number of stores to simulate (default: 45)"
    )
    
    parser.add_argument(
        "--products", 
        type=int, 
        default=100,
        help="Number of products to simulate (default: 100)"
    )
    
    parser.add_argument(
        "--days", 
        type=int, 
        default=365,
        help="Number of days of sales history (default: 365)"
    )
    
    parser.add_argument(
        "--data-dir", 
        type=str, 
        default="../../data",
        help="Directory to store the data (default: ../../data)"
    )
    
    parser.add_argument(
        "--format", 
        type=str, 
        choices=["csv", "excel", "parquet"],
        default="csv",
        help="Output file format (default: csv)"
    )
    
    parser.add_argument(
        "--no-features",
        action="store_true",
        help="Skip feature engineering step (default: False)"
    )
    
    return parser.parse_args()

def main():
    """Main function to generate and process the dataset"""
    # Parse command line arguments
    args = parse_args()
    
    # Ensure data directory exists
    data_dir = args.data_dir
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        logger.info(f"Created data directory: {data_dir}")
    
    # Create data processor
    processor = RetailDataProcessor(data_dir=data_dir)
    
    try:
        # Generate demo data
        logger.info(f"Generating data with {args.stores} stores, {args.products} products over {args.days} days")
        raw_data = processor._generate_demo_data(
            n_stores=args.stores, 
            n_products=args.products, 
            n_days=args.days
        )
        processor.raw_data = raw_data
        logger.info(f"Generated raw data: {raw_data.shape[0]} rows, {raw_data.shape[1]} columns")
        
        # Clean the data
        logger.info("Cleaning the data...")
        clean_data = processor.clean_data()
        logger.info(f"Cleaned data: {clean_data.shape[0]} rows, {clean_data.shape[1]} columns")
        
        # Add features if requested
        if not args.no_features:
            logger.info("Adding features...")
            final_data = processor.add_features()
            logger.info(f"Final data with features: {final_data.shape[0]} rows, {final_data.shape[1]} columns")
            processor.clean_data = final_data
        
        # Export the processed data
        output_filename = args.output
        if not output_filename.endswith(f".{args.format}"):
            output_filename = f"{output_filename}.{args.format}"
            
        logger.info(f"Exporting data to {output_filename}...")
        processor.export_data(output_filename, format=args.format)
        logger.info(f"Data successfully exported to {os.path.join(data_dir, output_filename)}")
        
        # Print sample of the data
        logger.info("Sample of the generated data:")
        print(processor.clean_data.head())
        
        # Print summary statistics
        logger.info("Summary statistics:")
        print(processor.clean_data.describe())
        
        return 0
    
    except Exception as e:
        logger.error(f"Error generating dataset: {e}", exc_info=True)
        return 1

if __name__ == "__main__":
    sys.exit(main()) 