<?php
// backend/seed_marketing_data.php
// Seeder script to insert high-fidelity marketing cohort and financial data

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db_connect.php';

$secretKey = $_REQUEST['key'] ?? '';
if ($secretKey !== 'Ideas2026') {
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized. Invalid secret key."]);
    exit;
}

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

    // Disable foreign key checks
    $conn->query("SET FOREIGN_KEY_CHECKS = 0");

    // Clean up previous demo marketing data to prevent clutter
    // We only clean up records that have specific phone patterns or marks so we don't destroy actual client work.
    $conn->query("DELETE FROM distribution_logs WHERE message = 'Seeded via marketing seeder'");
    $conn->query("DELETE FROM leads WHERE email LIKE '%@demo.marketing.test'");
    $conn->query("DELETE FROM contacts WHERE email LIKE '%@demo.marketing.test'");
    $conn->query("DELETE FROM persons WHERE email LIKE '%@demo.marketing.test'");
    $conn->query("DELETE FROM deals WHERE title LIKE 'Demo Marketing%'");
    $conn->query("DELETE FROM invoices WHERE title LIKE 'Demo SO%'");

    $conn->query("SET FOREIGN_KEY_CHECKS = 1");

    // We will generate data for the past 6 months: Feb, Mar, Apr, May, Jun, Jul 2026
    $months = ['2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'];
    $sources = ['Facebook Ads', 'Google Ads', 'Zalo Ads', 'TikTok Ads'];
    $platforms = ['Meta', 'Google', 'Zalo', 'TikTok'];
    
    $leadCount = 0;
    $contactCount = 0;
    $dealCount = 0;
    $invoiceCount = 0;

    // Retrieve active consultants to assign leads and deals
    $consultants = [];
    $resCons = $conn->query("SELECT id FROM consultants WHERE status = 'active' LIMIT 5");
    while ($row = $resCons->fetch_assoc()) {
        $consultants[] = (int)$row['id'];
    }
    if (empty($consultants)) {
        $consultants = [100012, 100015]; // fallback fallback IDs
    }

    foreach ($months as $monthIdx => $monthStr) {
        // Number of leads per month (cohort size)
        $numLeads = rand(25, 35);
        
        for ($i = 0; $i < $numLeads; $i++) {
            $day = rand(1, 28);
            $createdTime = "{$monthStr}-" . str_pad($day, 2, '0', STR_PAD_LEFT) . " " . str_pad(rand(8, 20), 2, '0', STR_PAD_LEFT) . ":" . str_pad(rand(0, 59), 2, '0', STR_PAD_LEFT) . ":" . str_pad(rand(0, 59), 2, '0', STR_PAD_LEFT);
            
            $srcIdx = rand(0, count($sources) - 1);
            $source = $sources[$srcIdx];
            $platform = $platforms[$srcIdx];
            
            $name = "Khách hàng Demo " . chr(rand(65, 90)) . chr(rand(65, 90)) . " " . ($monthIdx + 1) . "-" . $i;
            $phone = "09" . rand(10000000, 99999999);
            $email = "lead.demo." . $monthIdx . "." . $i . "@demo.marketing.test";

            // Insert into persons first to satisfy FK constraints
            $stmtP = $conn->prepare("INSERT INTO persons (phone, email, full_name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)");
            $stmtP->bind_param("sss", $phone, $email, $name);
            $stmtP->execute();
            $personId = $conn->insert_id;
            $stmtP->close();
            
            // 50% of leads are accepted
            $isAccepted = (rand(1, 100) <= 50) ? 1 : 0;
            $acceptedAt = null;
            if ($isAccepted) {
                $daysToAccept = rand(0, 3);
                $acceptedAt = date('Y-m-d H:i:s', strtotime($createdTime . " + {$daysToAccept} days"));
            }
            
            $assignedTo = $consultants[rand(0, count($consultants) - 1)];
            
            // Insert into leads
            $stmt = $conn->prepare("INSERT INTO leads (person_id, name, phone, email, source, platform, campaign_name, created_at, is_accepted, accepted_at, assigned_to, status) VALUES (?, ?, ?, ?, ?, ?, 'Chiến dịch Mùa Hè 2026', ?, ?, ?, ?, 'active')");
            $stmt->bind_param("issssssisi", $personId, $name, $phone, $email, $source, $platform, $createdTime, $isAccepted, $acceptedAt, $assignedTo);
            $stmt->execute();
            $leadId = $conn->insert_id;
            $stmt->close();
            $leadCount++;

            // Insert into distribution_logs to populate the Admin/Director operational stats
            $distStatus = $isAccepted ? 'assigned' : (rand(1, 10) <= 7 ? 'duplicate' : 'rejected');
            $stmtDL = $conn->prepare("INSERT INTO distribution_logs (lead_id, assigned_to, round_id, status, message, received_at) VALUES (?, ?, NULL, ?, 'Seeded via marketing seeder', ?)");
            $stmtDL->bind_param("iiss", $leadId, $assignedTo, $distStatus, $createdTime);
            $stmtDL->execute();
            $stmtDL->close();
            
            if ($isAccepted) {
                // Create a contact
                $fullName = "Khách hàng Demo " . ($monthIdx + 1) . "-" . $i;
                $contactStatus = (rand(1, 100) <= 40) ? 'customer' : 'lead';
                
                $stmtC = $conn->prepare("INSERT INTO contacts (tenant_id, person_id, full_name, email, phone, status, pipeline_status, owner_id, created_by, source, created_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $pStatus = ($contactStatus === 'customer') ? 'dat_coc' : 'quan_tam';
                $stmtC->bind_param("isssssiiss", $personId, $fullName, $email, $phone, $contactStatus, $pStatus, $assignedTo, $assignedTo, $source, $acceptedAt);
                $stmtC->execute();
                $contactId = $conn->insert_id;
                $stmtC->close();
                $contactCount++;
                
                // If they are customer, we create a Won Deal & Invoices
                if ($contactStatus === 'customer') {
                    // Time to win relative to lead creation date
                    $winChoice = rand(1, 100);
                    if ($winChoice <= 30) {
                        $daysToWin = rand(5, 29); // Converted in 1 month
                    } elseif ($winChoice <= 80) {
                        $daysToWin = rand(31, 59); // Converted in 2 months
                    } else {
                        $daysToWin = rand(61, 89); // Converted in 3 months
                    }
                    
                    $wonTime = date('Y-m-d H:i:s', strtotime($createdTime . " + {$daysToWin} days"));
                    $wonDate = date('Y-m-d', strtotime($wonTime));
                    $dealValue = rand(5, 50) * 1000000; // 5M to 50M VND
                    
                    $title = "Demo Marketing - Cơ hội " . $first;
                    $stmtD = $conn->prepare("INSERT INTO deals (tenant_id, contact_id, title, value, stage_id, owner_id, created_by, created_at, actual_close_date) VALUES (1, ?, ?, ?, 7, ?, ?, ?, ?)");
                    $stmtD->bind_param("isdiiss", $contactId, $title, $dealValue, $assignedTo, $assignedTo, $acceptedAt, $wonDate);
                    $stmtD->execute();
                    $dealId = $conn->insert_id;
                    $stmtD->close();
                    $dealCount++;
                    
                    // Create an Invoice (SO)
                    // 70% paid (realized revenue), 30% pending (projected revenue)
                    $isPaid = (rand(1, 100) <= 70) ? 'paid' : 'pending';
                    $invoiceNum = "SO-DEMO-" . rand(100000, 999999);
                    $invTitle = "Demo SO - Hóa đơn cho " . $first;
                    $dueDate = date('Y-m-d', strtotime($wonDate . " + 30 days"));
                    $paidAt = ($isPaid === 'paid') ? $wonTime : null;
                    
                    $stmtI = $conn->prepare("INSERT INTO invoices (tenant_id, deal_id, contact_id, created_by, invoice_number, title, status, issue_date, due_date, paid_at, total, created_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    $stmtI->bind_param("iiissssssds", $dealId, $contactId, $assignedTo, $invoiceNum, $invTitle, $isPaid, $wonDate, $dueDate, $paidAt, $dealValue, $wonTime);
                    $stmtI->execute();
                    $stmtI->close();
                    $invoiceCount++;
                }
            }
        }
    }

    echo json_encode([
        "success" => true,
        "message" => "Demo marketing data seeded successfully!",
        "stats" => [
            "leads" => $leadCount,
            "contacts" => $contactCount,
            "deals" => $dealCount,
            "invoices" => $invoiceCount
        ]
    ], JSON_PRETTY_PRINT);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error during seeding: " . $e->getMessage()
    ]);
}
