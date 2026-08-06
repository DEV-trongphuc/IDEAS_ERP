<?php
// backend/add_financial_indexes.php
require_once __DIR__ . '/test_bootstrap.php';

echo "=== ADDING OPTIMIZED FINANCIAL INDEXES ===\n";

// Add index on invoices
try {
    $conn->query("ALTER TABLE invoices ADD INDEX idx_invoices_issue_date (deleted_at, issue_date, total)");
    echo "Successfully added idx_invoices_issue_date on invoices table.\n";
} catch (Exception $e) {
    echo "Index on invoices might already exist or error: " . $e->getMessage() . "\n";
}

// Add index on expenses
try {
    $conn->query("ALTER TABLE expenses ADD INDEX idx_expenses_refunded_date (deleted_at, refunded_at, date, amount)");
    echo "Successfully added idx_expenses_refunded_date on expenses table.\n";
} catch (Exception $e) {
    echo "Index on expenses might already exist or error: " . $e->getMessage() . "\n";
}

echo "=== INDEXES SCRIPT COMPLETED ===\n";
unlink(__FILE__);
