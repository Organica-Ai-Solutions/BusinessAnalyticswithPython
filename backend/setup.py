from setuptools import setup, find_packages

setup(
    name="business-analytics-retail",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "Flask>=3.0.2",
        "Flask-Cors>=4.0.0",
        "SQLAlchemy>=2.0.27",
        "python-dotenv>=1.0.1",
        "requests>=2.31.0",
        "pandas>=2.2.1",
        "numpy>=1.26.4",
    ],
    extras_require={
        "dev": [
            "pytest>=8.0.2",
            "pytest-cov>=4.1.0",
            "coverage>=7.4.3",
            "black>=24.2.0",
            "flake8>=7.0.0",
            "isort>=5.13.2",
        ]
    },
) 