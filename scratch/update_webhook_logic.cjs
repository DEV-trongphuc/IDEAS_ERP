const fs = require('fs');
const path = 'backend/webhook_logic.php';
let content = fs.readFileSync(path, 'utf8');

// Normalize newlines to LF for matching
const originalIsCrlf = content.includes('\r\n');
if (originalIsCrlf) {
    content = content.replace(/\r\n/g, '\n');
}

const targetBlock = `                    // Update lead
                    $upLead = $conn->prepare("UPDATE leads SET assigned_to = ?, status = 'active', next_attempt_date = NULL, last_interaction_date = NOW(), is_accepted = 0 WHERE id = ?");
                    $upLead->bind_param("ii", $newConsultantId, $leadId);
                    $upLead->execute();
                    $upLead->close();`;

const replacementBlock = `                    // Get claim setting
                    $requireClaim = 0; // Default off (0)
                    $reqRes = $conn->query("SELECT setting_value FROM system_settings WHERE setting_key = 'require_lead_claim' LIMIT 1");
                    if ($reqRes && $rRow = $reqRes->fetch_assoc()) {
                        $requireClaim = (int)$rRow['setting_value'];
                    }

                    $isAcceptedVal = ($requireClaim === 0) ? 1 : 0;
                    $acceptedAtSql = ($requireClaim === 0) ? "NOW()" : "NULL";

                    // Update lead
                    $upLead = $conn->prepare("UPDATE leads SET assigned_to = ?, status = 'active', next_attempt_date = NULL, last_interaction_date = NOW(), is_accepted = ?, accepted_at = " . $acceptedAtSql . " WHERE id = ?");
                    $upLead->bind_param("iii", $newConsultantId, $isAcceptedVal, $leadId);
                    $upLead->execute();
                    $upLead->close();

                    if ($isAcceptedVal === 1) {
                        ensurePersonAndContact($conn, $leadId);
                    }`;

if (content.includes(targetBlock)) {
    content = content.replace(targetBlock, replacementBlock);
    console.log("Found and replaced target block!");
} else {
    console.log("Error: Target block NOT found!");
}

// Convert back to CRLF if it was original
if (originalIsCrlf) {
    content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(path, content, 'utf8');
console.log("Finished updating webhook_logic.php!");
