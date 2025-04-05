-- Connect to the database
\c retail_analytics;

-- Insert sample data
INSERT INTO sales (date, sales, customer_id, store_id, department_id)
VALUES 
    (NOW() - INTERVAL '1 day', 1500.00, 'CUST001', 'STORE001', 1),
    (NOW() - INTERVAL '2 days', 2000.00, 'CUST002', 'STORE001', 1),
    (NOW() - INTERVAL '3 days', 1750.00, 'CUST003', 'STORE002', 2),
    (NOW() - INTERVAL '4 days', 3000.00, 'CUST004', 'STORE002', 2),
    (NOW() - INTERVAL '5 days', 2500.00, 'CUST005', 'STORE003', 3),
    (NOW() - INTERVAL '6 days', 1800.00, 'CUST006', 'STORE003', 3),
    (NOW() - INTERVAL '7 days', 2200.00, 'CUST007', 'STORE001', 1),
    (NOW() - INTERVAL '8 days', 1900.00, 'CUST008', 'STORE002', 2),
    (NOW() - INTERVAL '9 days', 2800.00, 'CUST009', 'STORE003', 3),
    (NOW() - INTERVAL '10 days', 3200.00, 'CUST010', 'STORE001', 1),
    -- Previous period data for comparison
    (NOW() - INTERVAL '31 days', 1400.00, 'CUST011', 'STORE001', 1),
    (NOW() - INTERVAL '32 days', 1900.00, 'CUST012', 'STORE001', 1),
    (NOW() - INTERVAL '33 days', 1650.00, 'CUST013', 'STORE002', 2),
    (NOW() - INTERVAL '34 days', 2800.00, 'CUST014', 'STORE002', 2),
    (NOW() - INTERVAL '35 days', 2300.00, 'CUST015', 'STORE003', 3); 