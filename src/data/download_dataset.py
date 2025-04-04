#!/usr/bin/env python3
"""
Download Retail Dataset from Kaggle

This script downloads the retail dataset from Kaggle and saves it to the data directory.
"""

import os
import kagglehub
import sys
import logging
import shutil
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def download_retail_dataset():
    """Download the retail dataset from Kaggle"""
    
    # Set up data directory
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
    os.makedirs(data_dir, exist_ok=True)
    logger.info(f"Data will be stored in: {data_dir}")
    
    try:
        # Download the dataset
        logger.info("Downloading retail dataset from Kaggle...")
        path = kagglehub.dataset_download("manjeetsingh/retaildataset")
        
        logger.info(f"Dataset downloaded to: {path}")
        
        # List the downloaded files
        all_files = []
        for root, dirs, files in os.walk(path):
            for file in files:
                file_path = os.path.join(root, file)
                all_files.append(file_path)
                
                # Copy the file to our data directory
                dest_file = os.path.join(data_dir, file)
                shutil.copy2(file_path, dest_file)
                logger.info(f"Copied file to: {dest_file}")
        
        logger.info(f"Total files downloaded: {len(all_files)}")
        return path, all_files
    
    except Exception as e:
        logger.error(f"Error downloading dataset: {e}")
        return None, []

if __name__ == "__main__":
    download_retail_dataset() 