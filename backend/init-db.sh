#!/bin/bash

# Load environment variables
source .env

# Create database and tables
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -f src/db/schema.sql

# Insert sample data
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f src/db/seed.sql

echo "Database initialized successfully!" 