#!/bin/bash

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run tests with coverage
pytest tests/ -v --cov=src --cov-report=term-missing --cov-report=html

# Run linting
echo "\nRunning flake8..."
flake8 src/ tests/

# Run code formatting check
echo "\nChecking code formatting..."
black --check src/ tests/

# Run import sorting check
echo "\nChecking import sorting..."
isort --check-only src/ tests/

# Deactivate virtual environment if it was activated
if [ -n "$VIRTUAL_ENV" ]; then
    deactivate
fi 