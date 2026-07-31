<?php
// backend/cron_academic_reminders.php
// Cron job to automatically send thesis milestone reminders and lecturer seminar reminders before deadline.

echo "[" . date('Y-m-d H:i:s') . "] Starting automated academic reminders check...\n";

require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/mailer.php';

try {
    // 1. Fetch active campaigns with non-empty reminders_json
    $res = $conn->query("SELECT id, name, tenant_id, subjects_json, thesis_milestones_json, reminders_json FROM marketing_campaigns WHERE status = 'active'");
    if (!$res) {
        throw new Exception("Error querying campaigns: " . $conn->error);
    }

    $countThesisReminders = 0;
    $countLecturerReminders = 0;

    $todayStr = date('Y-m-d');
    $nowTime = time();

    while ($camp = $res->fetch_assoc()) {
        $reminders = !empty($camp['reminders_json']) ? json_decode($camp['reminders_json'], true) : [];
        if (empty($reminders)) {
            continue;
        }

        // --- A. LECTURER SEMINAR REMINDERS ---
        $lectCfg = $reminders['lecturer_seminar'] ?? [];
        if (!empty($lectCfg['enabled']) && !empty($camp['subjects_json'])) {
            $hoursBefore = intval($lectCfg['hours_before'] ?? 12);
            $subjects = json_decode($camp['subjects_json'], true) ?: [];

            foreach ($subjects as $sub) {
                if (empty($sub['seminars'])) continue;
                $subLecturerId = $sub['lecturer_id'] ?? null;

                foreach ($sub['seminars'] as $semIdx => $sem) {
                    if (empty($sem['date'])) continue;

                    $startTime = '08:30';
                    if (!empty($sem['session1_start'])) {
                        $startTime = $sem['session1_start'];
                    } else if (!empty($sem['time_slot'])) {
                        $parts = explode('-', $sem['time_slot']);
                        if (!empty($parts[0])) {
                            $startTime = trim($parts[0]);
                        }
                    }

                    $semDateTimeStr = $sem['date'] . ' ' . $startTime;
                    $semTimestamp = strtotime($semDateTimeStr);
                    $reminderStartTimestamp = $semTimestamp - ($hoursBefore * 3600);

                    if ($nowTime >= $reminderStartTimestamp && $nowTime < $semTimestamp) {
                        $notifyType = "acad_lect_" . $camp['id'] . "_" . ($sub['id'] ?? 'sub') . "_" . $semIdx;
                        $lectId = !empty($sem['lecturer_id']) ? $sem['lecturer_id'] : $subLecturerId;
                        if (!$lectId) continue;

                        $chk = $conn->prepare("SELECT id FROM sent_notifications WHERE user_id = ? AND notify_type = ?");
                        $chk->bind_param("is", $lectId, $notifyType);
                        $chk->execute();
                        $alreadySent = $chk->get_result()->num_rows > 0;
                        $chk->close();

                        if (!$alreadySent) {
                            $stmtL = $conn->prepare("SELECT name, email, phone FROM companies WHERE id = ?");
                            $stmtL->bind_param("i", $lectId);
                            $stmtL->execute();
                            $lectInfo = $stmtL->get_result()->fetch_assoc();
                            $stmtL->close();

                            if ($lectInfo) {
                                $lectName = $lectInfo['name'];
                                $lectEmail = $lectInfo['email'];

                                $msgTitle = "⏰ NHẮC NHỞ LỊCH GIẢNG DẠY CHUYÊN ĐỀ";
                                $msgBody = "Chào Thầy/Cô $lectName, đây là nhắc nhở tự động về lịch giảng dạy chuyên đề: \"{$sem['topic']}\" vào ngày " . date('d/m/Y', strtotime($sem['date'])) . " lúc $startTime. Địa điểm: " . ($sem['location'] ?? 'Online') . ". Vui lòng chuẩn bị và lên lớp đúng giờ.";

                                if (!empty($lectEmail)) {
                                    try {
                                        sendEmailNotification($lectEmail, "[IDEAS] Nhắc nhở lịch giảng dạy chuyên đề - Thầy/Cô $lectName", $msgTitle, $msgBody);
                                        echo "  [Lecturer] Email sent to $lectName ($lectEmail)\n";
                                    } catch (\Throwable $emEx) {
                                        echo "  [Lecturer] Email send error: " . $emEx->getMessage() . "\n";
                                    }
                                }

                                $ins = $conn->prepare("INSERT INTO sent_notifications (user_id, notify_type, notify_date) VALUES (?, ?, ?)");
                                $ins->bind_param("iss", $lectId, $notifyType, $todayStr);
                                $ins->execute();
                                $ins->close();

                                $countLecturerReminders++;
                            }
                        }
                    }
                }
            }
        }

        // --- B. THESIS MILESTONE REMINDERS ---
        $thesisCfg = $reminders['thesis_milestone'] ?? [];
        if (!empty($thesisCfg['enabled']) && !empty($camp['thesis_milestones_json'])) {
            $hoursBefore = intval($thesisCfg['hours_before'] ?? 12);
            $milestones = json_decode($camp['thesis_milestones_json'], true) ?: [];

            foreach ($milestones as $msIdx => $ms) {
                if (empty($ms['due_date'])) continue;

                $dueDateTimeStr = $ms['due_date'] . ' 09:00:00';
                $dueTimestamp = strtotime($dueDateTimeStr);
                $reminderStartTimestamp = $dueTimestamp - ($hoursBefore * 3600);

                if ($nowTime >= $reminderStartTimestamp && $nowTime < $dueTimestamp) {
                    $notifyType = "acad_thesis_" . $camp['id'] . "_" . $msIdx;

                    $stmtC = $conn->prepare("SELECT id, name, email, phone FROM contacts WHERE campaign_id = ? AND tenant_id = ?");
                    $stmtC->bind_param("ii", $camp['id'], $camp['tenant_id']);
                    $stmtC->execute();
                    $students = $stmtC->get_result();
                    $stmtC->close();

                    while ($student = $students->fetch_assoc()) {
                        $studentId = $student['id'];

                        $chk = $conn->prepare("SELECT id FROM sent_notifications WHERE user_id = ? AND notify_type = ?");
                        $chk->bind_param("is", $studentId, $notifyType);
                        $chk->execute();
                        $alreadySent = $chk->get_result()->num_rows > 0;
                        $chk->close();

                        if (!$alreadySent) {
                            $studName = $student['name'];
                            $studEmail = $student['email'];

                            $msgTitle = "⏰ NHẮC NHỞ CỘT MỐC LUẬN VĂN";
                            $msgBody = "Chào Anh/Chị $studName, đây là thông báo nhắc nhở tự động về hạn hoàn thành cột mốc luận văn/đề cương: \"{$ms['milestone']}\" trước ngày " . date('d/m/Y', strtotime($ms['due_date'])) . ". Vui lòng hoàn thành đúng tiến độ.";

                            if (!empty($studEmail)) {
                                try {
                                    sendEmailNotification($studEmail, "[IDEAS] Nhắc nhở hạn nộp luận văn: {$ms['milestone']}", $msgTitle, $msgBody);
                                    echo "  [Thesis] Email sent to student $studName ($studEmail)\n";
                                } catch (\Throwable $emEx) {
                                    echo "  [Thesis] Email send error: " . $emEx->getMessage() . "\n";
                                }
                            }

                            $ins = $conn->prepare("INSERT INTO sent_notifications (user_id, notify_type, notify_date) VALUES (?, ?, ?)");
                            $ins->bind_param("iss", $studentId, $notifyType, $todayStr);
                            $ins->execute();
                            $ins->close();

                            $countThesisReminders++;
                        }
                    }
                }
            }
        }
    }

    echo "[" . date('Y-m-d H:i:s') . "] Completed check. Sent $countLecturerReminders lecturer reminders and $countThesisReminders student thesis reminders.\n";

} catch (Throwable $e) {
    echo "[" . date('Y-m-d H:i:s') . "] ERROR in academic reminders cron: " . $e->getMessage() . "\n";
}
