<?php
// backend/test_public_schedule.php
// PHP Test Harness for public student schedule action

require_once __DIR__ . '/test_bootstrap.php';

echo "=== STARTING PUBLIC STUDENT SCHEDULE API TESTS ===\n\n";

// 1. Verify that contact ID 101 exists in contacts table
$stmt = $conn->prepare("SELECT id, full_name, campaign_id FROM contacts WHERE id = 101 LIMIT 1");
$stmt->execute();
$contact = $stmt->get_result()->fetch_assoc();

assertTest(
    "Contact 101 exists in contacts table",
    !empty($contact),
    "Found: " . ($contact ? $contact['full_name'] : 'none')
);

if ($contact) {
    assertTest(
        "Contact 101 full name is Nguyễn Văn A",
        $contact['full_name'] === 'Nguyễn Văn A',
        "Name: " . $contact['full_name']
    );
    assertTest(
        "Contact 101 is enrolled in campaign 6",
        (int)$contact['campaign_id'] === 6,
        "Campaign ID: " . $contact['campaign_id']
    );
}

// 2. Mock GET request parameters and capture action output
$_GET['action'] = 'public_student_schedule';
$_GET['customer_id'] = 101;

// Use nested output buffers to capture flushes from api.php
ob_start();
ob_start();
try {
    include __DIR__ . '/api.php';
} catch (\Throwable $e) {
    // Catch any header output exceptions
}
$inner = ob_get_clean();
$outer = ob_get_clean();
$output = $outer . $inner;

// Check if output contains a valid JSON response
$response = json_decode($output, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    // Sometimes output might have some trailing content or require cleaning. Let's find JSON in the output string.
    $pos = strpos($output, '{');
    if ($pos !== false) {
        $jsonStr = substr($output, $pos);
        $response = json_decode($jsonStr, true);
    }
}

assertTest(
    "API returned a valid JSON response",
    is_array($response),
    "Raw response prefix: " . substr($output, 0, 100)
);

if (is_array($response)) {
    assertTest(
        "API response has success = true",
        isset($response['success']) && $response['success'] === true,
        "Success field: " . ($response['success'] ? 'true' : 'false') . (!empty($response['message']) ? " Message: " . $response['message'] : "")
    );

    if (!empty($response['data'])) {
        $data = $response['data'];
        assertTest(
            "API returned correct student details",
            isset($data['student']) && $data['student']['name'] === 'Nguyễn Văn A',
            "Student Name: " . ($data['student']['name'] ?? 'none')
        );
        assertTest(
            "API returned course details",
            isset($data['course']) && !empty($data['course']['name']),
            "Course Name: " . ($data['course']['name'] ?? 'none')
        );
        assertTest(
            "API returned course subjects list",
            isset($data['course']['subjects']) && is_array($data['course']['subjects']),
            "Subjects Count: " . count($data['course']['subjects'] ?? [])
        );
    }
}

echo "\n";
printTestSummary();
