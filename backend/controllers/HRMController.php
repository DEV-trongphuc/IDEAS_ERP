<?php
class HRMController {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    private function isAdmin(array $auth): bool {
        return in_array($auth['role'], ['admin', 'super_admin', 'superadmin', 'director'], true);
    }

    // --- PROFILES & CONTRACTS ---

    public function indexProfiles(array $auth): void {
        if (!$this->isAdmin($auth)) respond(403, null, 'Quyền admin là bắt buộc', false);

        $stmt = $this->db->prepare("
            SELECT u.id, u.full_name, u.email, u.phone, u.role, u.is_active, u.dob, u.gender, u.citizen_id, u.address, u.bank_name, u.bank_account,
                   p.joined_date, p.base_salary, p.deal_salary, p.has_insurance, p.allowance_meal, p.allowance_travel, p.allowance_phone, p.kpi_target, p.kpi_multiplier_rules
            FROM users u
            LEFT JOIN hrm_profiles p ON u.id = p.user_id
            WHERE u.tenant_id = ?
            ORDER BY u.full_name
        ");
        $stmt->execute([$auth['tenant_id']]);
        respond(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function saveProfile(array $auth): void {
        if (!$this->isAdmin($auth)) respond(403, null, 'Quyền admin là bắt buộc', false);
        $b = getBody();
        if (empty($b['user_id']) || empty($b['joined_date'])) {
            respond(400, null, 'Thiếu thông tin user_id hoặc ngày vào làm', false);
        }

        $stmt = $this->db->prepare("
            INSERT INTO hrm_profiles (user_id, joined_date, base_salary, deal_salary, has_insurance, allowance_meal, allowance_travel, allowance_phone, kpi_target, kpi_multiplier_rules)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                joined_date = VALUES(joined_date),
                base_salary = VALUES(base_salary),
                deal_salary = VALUES(deal_salary),
                has_insurance = VALUES(has_insurance),
                allowance_meal = VALUES(allowance_meal),
                allowance_travel = VALUES(allowance_travel),
                allowance_phone = VALUES(allowance_phone),
                kpi_target = VALUES(kpi_target),
                kpi_multiplier_rules = VALUES(kpi_multiplier_rules)
        ");

        $stmt->execute([
            (int)$b['user_id'],
            $b['joined_date'],
            (float)($b['base_salary'] ?? 0),
            (float)($b['deal_salary'] ?? 0),
            (int)($b['has_insurance'] ?? 1),
            (float)($b['allowance_meal'] ?? 0),
            (float)($b['allowance_travel'] ?? 0),
            (float)($b['allowance_phone'] ?? 0),
            (float)($b['kpi_target'] ?? 0),
            isset($b['kpi_multiplier_rules']) ? (is_array($b['kpi_multiplier_rules']) ? json_encode($b['kpi_multiplier_rules']) : $b['kpi_multiplier_rules']) : null
        ]);

        respond(200, ['success' => true]);
    }

    // --- LEAVE REQUESTS ---

    public function indexLeaves(array $auth): void {
        if ($this->isAdmin($auth)) {
            $stmt = $this->db->prepare("
                SELECT l.*, u.full_name as employee_name
                FROM hrm_leave_requests l
                JOIN users u ON l.user_id = u.id
                WHERE u.tenant_id = ?
                ORDER BY l.created_at DESC
            ");
            $stmt->execute([$auth['tenant_id']]);
        } else {
            $stmt = $this->db->prepare("
                SELECT l.*, u.full_name as employee_name
                FROM hrm_leave_requests l
                JOIN users u ON l.user_id = u.id
                WHERE l.user_id = ?
                ORDER BY l.created_at DESC
            ");
            $stmt->execute([$auth['user_id']]);
        }
        respond(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function createLeave(array $auth): void {
        $b = getBody();
        if (empty($b['start_date']) || empty($b['end_date']) || empty($b['leave_type'])) {
            respond(400, null, 'Thiếu thông tin đăng ký nghỉ phép', false);
        }

        $stmt = $this->db->prepare("
            INSERT INTO hrm_leave_requests (user_id, leave_type, start_date, end_date, total_days, reason, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
        ");
        $stmt->execute([
            $auth['user_id'],
            $b['leave_type'],
            $b['start_date'],
            $b['end_date'],
            (float)($b['total_days'] ?? 1.0),
            $b['reason'] ?? ''
        ]);

        // Dispatch Notification
        try {
            $stmtUser = $this->db->prepare("SELECT full_name FROM users WHERE id = ?");
            $stmtUser->execute([$auth['user_id']]);
            $userName = $stmtUser->fetchColumn() ?: 'Nhân viên';

            $leaveTypeText = $b['leave_type'] === 'annual' ? 'Phép năm' : ($b['leave_type'] === 'sick' ? 'Nghỉ ốm' : ($b['leave_type'] === 'compensatory' ? 'Nghỉ bù' : ($b['leave_type'] === 'late_early' ? 'Đi trễ/Về sớm' : 'Không lương')));

            require_once __DIR__ . '/../NotificationService.php';
            NotificationService::send($this->db, $auth['tenant_id'], 'HRM_LEAVE_REQUEST', [
                'user_name' => $userName,
                'leave_type_text' => $leaveTypeText,
                'start_date' => $b['start_date'],
                'end_date' => $b['end_date'],
                'total_days' => (float)($b['total_days'] ?? 1.0),
                'reason' => $b['reason'] ?? '',
                'date' => date('Y-m-d')
            ]);
        } catch (\Throwable $e) {}

        respond(200, ['success' => true]);
    }

    public function approveLeave(array $auth): void {
        if (!$this->isAdmin($auth)) respond(403, null, 'Quyền admin là bắt buộc', false);
        $b = getBody();
        if (empty($b['id']) || empty($b['status'])) {
            respond(400, null, 'Thiếu ID hoặc trạng thái phê duyệt', false);
        }

        $stmt = $this->db->prepare("UPDATE hrm_leave_requests SET status = ?, approved_by = ? WHERE id = ?");
        $stmt->execute([$b['status'], $auth['user_id'], (int)$b['id']]);

        // Dispatch Notification
        try {
            $stmtL = $this->db->prepare("SELECT l.*, u.full_name FROM hrm_leave_requests l JOIN users u ON l.user_id = u.id WHERE l.id = ?");
            $stmtL->execute([(int)$b['id']]);
            $leaveRow = $stmtL->fetch(PDO::FETCH_ASSOC);
            if ($leaveRow) {
                $leaveTypeText = $leaveRow['leave_type'] === 'annual' ? 'Phép năm' : ($leaveRow['leave_type'] === 'sick' ? 'Nghỉ ốm' : ($leaveRow['leave_type'] === 'compensatory' ? 'Nghỉ bù' : ($leaveRow['leave_type'] === 'late_early' ? 'Đi trễ/Về sớm' : 'Không lương')));
                $statusText = $b['status'] === 'approved' ? 'Phê duyệt' : 'Từ chối';

                require_once __DIR__ . '/../NotificationService.php';
                NotificationService::send($this->db, $auth['tenant_id'], 'HRM_LEAVE_APPROVAL', [
                    'user_id' => $leaveRow['user_id'],
                    'user_name' => $leaveRow['full_name'],
                    'leave_type_text' => $leaveTypeText,
                    'start_date' => $leaveRow['start_date'],
                    'end_date' => $leaveRow['end_date'],
                    'status_text' => $statusText,
                    'reason' => $b['reason'] ?? 'Không có ghi chú thêm'
                ]);
            }
        } catch (\Throwable $e) {}

        respond(200, ['success' => true]);
    }

    // --- SALARY ADVANCES ---

    public function indexAdvances(array $auth): void {
        if ($this->isAdmin($auth)) {
            $stmt = $this->db->prepare("
                SELECT a.*, u.full_name as employee_name
                FROM hrm_salary_advances a
                JOIN users u ON a.user_id = u.id
                WHERE u.tenant_id = ?
                ORDER BY a.created_at DESC
            ");
            $stmt->execute([$auth['tenant_id']]);
        } else {
            $stmt = $this->db->prepare("
                SELECT a.*, u.full_name as employee_name
                FROM hrm_salary_advances a
                JOIN users u ON a.user_id = u.id
                WHERE a.user_id = ?
                ORDER BY a.created_at DESC
            ");
            $stmt->execute([$auth['user_id']]);
        }
        respond(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function createAdvance(array $auth): void {
        $b = getBody();
        if (empty($b['amount']) || (float)$b['amount'] <= 0) {
            respond(400, null, 'Số tiền tạm ứng phải lớn hơn 0', false);
        }

        $stmt = $this->db->prepare("
            INSERT INTO hrm_salary_advances (user_id, amount, request_date, reason, status)
            VALUES (?, ?, CURDATE(), ?, 'pending')
        ");
        $stmt->execute([
            $auth['user_id'],
            (float)$b['amount'],
            $b['reason'] ?? ''
        ]);

        // Dispatch Notification
        try {
            $stmtUser = $this->db->prepare("SELECT full_name FROM users WHERE id = ?");
            $stmtUser->execute([$auth['user_id']]);
            $userName = $stmtUser->fetchColumn() ?: 'Nhân viên';

            require_once __DIR__ . '/../NotificationService.php';
            NotificationService::send($this->db, $auth['tenant_id'], 'HRM_ADVANCE_REQUEST', [
                'user_name' => $userName,
                'amount' => (float)$b['amount'],
                'reason' => $b['reason'] ?? '',
                'date' => date('Y-m-d')
            ]);
        } catch (\Throwable $e) {}

        respond(200, ['success' => true]);
    }

    public function approveAdvance(array $auth): void {
        if (!$this->isAdmin($auth)) respond(403, null, 'Quyền admin là bắt buộc', false);
        $b = getBody();
        if (empty($b['id']) || empty($b['status'])) {
            respond(400, null, 'Thiếu ID hoặc trạng thái phê duyệt', false);
        }

        $stmt = $this->db->prepare("UPDATE hrm_salary_advances SET status = ? WHERE id = ?");
        $stmt->execute([$b['status'], (int)$b['id']]);

        // Dispatch Notification
        try {
            $stmtA = $this->db->prepare("SELECT a.*, u.full_name FROM hrm_salary_advances a JOIN users u ON a.user_id = u.id WHERE a.id = ?");
            $stmtA->execute([(int)$b['id']]);
            $advRow = $stmtA->fetch(PDO::FETCH_ASSOC);
            if ($advRow) {
                $statusText = $b['status'] === 'approved' ? 'Phê duyệt giải ngân' : 'Từ chối';

                require_once __DIR__ . '/../NotificationService.php';
                NotificationService::send($this->db, $auth['tenant_id'], 'HRM_ADVANCE_APPROVAL', [
                    'user_id' => $advRow['user_id'],
                    'user_name' => $advRow['full_name'],
                    'amount' => (float)$advRow['amount'],
                    'status_text' => $statusText,
                    'reason' => $b['reason'] ?? 'Không có ghi chú thêm'
                ]);
            }
        } catch (\Throwable $e) {}

        respond(200, ['success' => true]);
    }

    // --- PAYROLL CALCULATION ENGINE ---

    public function calculatePayroll(array $auth): void {
        if (!$this->isAdmin($auth)) respond(403, null, 'Quyền admin là bắt buộc', false);
        $b = getBody();
        $monthYear = $b['month_year'] ?? ''; // Format: YYYY-MM
        if (empty($monthYear)) respond(400, null, 'Thiếu tháng tính lương (Định dạng YYYY-MM)', false);

        // Standard work days in month (usually 26, custom if provided)
        $workDaysRequired = (int)($b['work_days_required'] ?? 26);

        // Fetch system settings for grace minutes
        $stmtGrace = $this->db->prepare("SELECT setting_value FROM system_settings WHERE setting_key = ? LIMIT 1");
        
        $stmtGrace->execute(['hrm_late_grace_male']);
        $graceMale = (int)($stmtGrace->fetchColumn() ?: 30); // Default 30 mins
        
        $stmtGrace->execute(['hrm_late_grace_female']);
        $graceFemale = (int)($stmtGrace->fetchColumn() ?: 60); // Default 60 mins

        // Fetch all employees in tenant
        $empStmt = $this->db->prepare("
            SELECT u.id, u.full_name, u.gender, p.base_salary, p.deal_salary, p.has_insurance,
                   p.allowance_meal, p.allowance_travel, p.allowance_phone, p.kpi_target, p.joined_date
            FROM users u
            JOIN hrm_profiles p ON u.id = p.user_id
            WHERE u.tenant_id = ? AND u.is_active = 1
        ");
        $empStmt->execute([$auth['tenant_id']]);
        $employees = $empStmt->fetchAll(PDO::FETCH_ASSOC);

        $results = [];

        foreach ($employees as $emp) {
            $userId = (int)$emp['id'];

            // 1. Calculate Actual Work Days from check_ins & apply late_early waivers
            $leStmt = $this->db->prepare("
                SELECT DATE(start_date) as le_date
                FROM hrm_leave_requests
                WHERE user_id = ? AND status = 'approved' AND leave_type = 'late_early'
                  AND DATE_FORMAT(start_date, '%Y-%m') = ?
            ");
            $leStmt->execute([$userId, $monthYear]);
            $waivedDates = $leStmt->fetchAll(PDO::FETCH_COLUMN) ?: [];

            $attStmt = $this->db->prepare("
                SELECT check_in_date, late_minutes
                FROM check_ins
                WHERE user_id = ? AND status = 'approved' AND DATE_FORMAT(check_in_date, '%Y-%m') = ?
            ");
            $attStmt->execute([$userId, $monthYear]);
            $checkinsList = $attStmt->fetchAll(PDO::FETCH_ASSOC);

            $actualWorkedDays = count($checkinsList);
            $totalLateMinutes = 0;
            foreach ($checkinsList as $ci) {
                if (!in_array($ci['check_in_date'], $waivedDates)) {
                    $totalLateMinutes += (int)$ci['late_minutes'];
                }
            }

            // 2. Add approved leaves that are paid (leave_type = 'annual', 'sick', or 'compensatory')
            $lvStmt = $this->db->prepare("
                SELECT SUM(total_days) as paid_days
                FROM hrm_leave_requests
                WHERE user_id = ? AND status = 'approved' AND leave_type IN ('annual', 'sick', 'compensatory')
                  AND DATE_FORMAT(start_date, '%Y-%m') = ?
            ");
            $lvStmt->execute([$userId, $monthYear]);
            $lv = $lvStmt->fetch(PDO::FETCH_ASSOC);
            $paidLeaveDays = (float)($lv['paid_days'] ?? 0);

            $totalWorkDays = $actualWorkedDays + $paidLeaveDays;
            if ($totalWorkDays > $workDaysRequired) $totalWorkDays = $workDaysRequired;

            // 3. Prorate Salary
            $baseSalary = (float)$emp['deal_salary'];
            $basicSalaryCalculated = ($workDaysRequired > 0) ? ($baseSalary / $workDaysRequired) * $totalWorkDays : 0;

            // 4. Lateness Deduction Penalty with Gender Grace Threshold
            $gender = trim(mb_strtolower($emp['gender'] ?? ''));
            $graceMinutes = 0;
            if ($gender === 'male' || $gender === 'nam') {
                $graceMinutes = $graceMale;
            } elseif ($gender === 'female' || $gender === 'nữ' || $gender === 'nu') {
                $graceMinutes = $graceFemale;
            }
            
            $penalizedLateMinutes = max(0, $totalLateMinutes - $graceMinutes);
            $latenessPenalty = $penalizedLateMinutes * 5000;

            // 5. Allowances
            $allowanceTotal = (float)$emp['allowance_meal'] + (float)$emp['allowance_travel'] + (float)$emp['allowance_phone'];

            // 6. Thưởng KPI based on revenue collected in approved milestones for YYYY-MM
            $kpiBonus = 0.0;
            $revenueCollected = 0.0;

            // Fetch all approved deposit milestones in the selected month
            $milestonesStmt = $this->db->prepare("
                SELECT m.expected_amount, d.contact_id, d.created_by
                FROM deposit_milestones m
                JOIN deposits d ON m.deposit_id = d.id
                WHERE m.status = 'approved' AND DATE_FORMAT(m.approval_date, '%Y-%m') = ?
            ");
            $milestonesStmt->execute([$monthYear]);
            $milestonesList = $milestonesStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($milestonesList as $mRow) {
                $contactId = (int)$mRow['contact_id'];
                $depositCreator = (int)$mRow['created_by'];
                $amount = (float)$mRow['expected_amount'];

                // Check if this contact has a cooperation slip for commission splitting
                $csStmt = $this->db->prepare("SELECT shares_json FROM cooperation_slips WHERE contact_id = ? LIMIT 1");
                $csStmt->execute([$contactId]);
                $csRow = $csStmt->fetch(PDO::FETCH_ASSOC);

                if ($csRow) {
                    $shares = json_decode($csRow['shares_json'] ?? '[]', true) ?: [];
                    if (isset($shares[$userId])) {
                        $percent = (float)$shares[$userId];
                        $revenueCollected += $amount * ($percent / 100.0);
                    }
                } else {
                    // No cooperation slip, 100% of the revenue belongs to the deposit creator
                    if ($userId === $depositCreator) {
                        $revenueCollected += $amount;
                    }
                }
            }

            $kpiTarget = (float)$emp['kpi_target'];
            if ($kpiTarget > 0) {
                $achievementRate = $revenueCollected / $kpiTarget;
                if ($achievementRate >= 1.2) {
                    $kpiBonus = $revenueCollected * 0.15; // 15% reward
                } else if ($achievementRate >= 1.0) {
                    $kpiBonus = $revenueCollected * 0.10; // 10% reward
                } else if ($achievementRate >= 0.8) {
                    $kpiBonus = $revenueCollected * 0.05; // 5% reward
                } else {
                    $kpiBonus = 0.0;
                }
            }

            // 7. Insurance Deductions (social: 8%, health: 1.5%, unemployment: 1% of base_salary)
            $insuranceBase = (float)$emp['base_salary'];
            $bhxh = 0;
            $bhyt = 0;
            $bhtn = 0;
            if ((int)$emp['has_insurance'] === 1 && $insuranceBase > 0) {
                $bhxh = $insuranceBase * 0.08;
                $bhyt = $insuranceBase * 0.015;
                $bhtn = $insuranceBase * 0.01;
            }

            // 8. Tax PIT (Thuế TNCN lũy tiến)
            $taxableMeal = max(0, (float)$emp['allowance_meal'] - 730000);
            $grossIncomeForTax = $basicSalaryCalculated + $kpiBonus + (float)$emp['allowance_travel'] + (float)$emp['allowance_phone'] + $taxableMeal;
            
            $insuranceDeductions = $bhxh + $bhyt + $bhtn;
            $personalDeduction = 11000000; // 11M VND
            $dependentsDeduction = 0; 
            
            $taxIncome = $grossIncomeForTax - $insuranceDeductions - $personalDeduction - $dependentsDeduction;
            $pit = 0;
            if ($taxIncome > 0) {
                if ($taxIncome <= 5000000) {
                    $pit = $taxIncome * 0.05;
                } else if ($taxIncome <= 10000000) {
                    $pit = ($taxIncome * 0.10) - 250000;
                } else if ($taxIncome <= 18000000) {
                    $pit = ($taxIncome * 0.15) - 750000;
                } else if ($taxIncome <= 32000000) {
                    $pit = ($taxIncome * 0.20) - 1650000;
                } else if ($taxIncome <= 52000000) {
                    $pit = ($taxIncome * 0.25) - 3250000;
                } else if ($taxIncome <= 80000000) {
                    $pit = ($taxIncome * 0.30) - 5850000;
                } else {
                    $pit = ($taxIncome * 0.35) - 9850000;
                }
            }

            // 9. Approved salary advances to deduct
            $advStmt = $this->db->prepare("
                SELECT SUM(amount) as adv_amt
                FROM hrm_salary_advances
                WHERE user_id = ? AND status = 'approved' AND deducted_payslip_id IS NULL
            ");
            $advStmt->execute([$userId]);
            $advVal = $advStmt->fetch(PDO::FETCH_ASSOC);
            $advanceDeduction = (float)($advVal['adv_amt'] ?? 0);

            // 10. Net Pay calculation
            $netSalary = $basicSalaryCalculated + $allowanceTotal + $kpiBonus - $insuranceDeductions - $latenessPenalty - $pit - $advanceDeduction;
            if ($netSalary < 0) $netSalary = 0;

            // Save or Update into monthly_payslips
            $saveStmt = $this->db->prepare("
                INSERT INTO monthly_payslips (user_id, month_year, work_days_required, work_days_actual, lateness_minutes, lateness_penalty, salary_basic_calculated, allowance_total, kpi_bonus, insurance_bhxh, insurance_bhyt, insurance_bhtn, tax_pit, advance_deduction, net_salary, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
                ON DUPLICATE KEY UPDATE
                    work_days_required = VALUES(work_days_required),
                    work_days_actual = VALUES(work_days_actual),
                    lateness_minutes = VALUES(lateness_minutes),
                    lateness_penalty = VALUES(lateness_penalty),
                    salary_basic_calculated = VALUES(salary_basic_calculated),
                    allowance_total = VALUES(allowance_total),
                    kpi_bonus = VALUES(kpi_bonus),
                    insurance_bhxh = VALUES(insurance_bhxh),
                    insurance_bhyt = VALUES(insurance_bhyt),
                    insurance_bhtn = VALUES(insurance_bhtn),
                    tax_pit = VALUES(tax_pit),
                    advance_deduction = VALUES(advance_deduction),
                    net_salary = VALUES(net_salary)
            ");
            $saveStmt->execute([
                $userId,
                $monthYear,
                $workDaysRequired,
                $totalWorkDays,
                $totalLateMinutes,
                $latenessPenalty,
                $basicSalaryCalculated,
                $allowanceTotal,
                $kpiBonus,
                $bhxh,
                $bhyt,
                $bhtn,
                $pit,
                $advanceDeduction,
                $netSalary
            ]);

            // Link advances to this payslip once generated
            $payslipId = (int)$this->db->lastInsertId();
            if ($payslipId > 0 && $advanceDeduction > 0) {
                $upAdv = $this->db->prepare("UPDATE hrm_salary_advances SET deducted_payslip_id = ? WHERE user_id = ? AND status = 'approved' AND deducted_payslip_id IS NULL");
                $upAdv->execute([$payslipId, $userId]);
            }

            $results[] = [
                'user_id' => $userId,
                'full_name' => $emp['full_name'],
                'work_days_actual' => $totalWorkDays,
                'lateness_minutes' => $totalLateMinutes,
                'net_salary' => $netSalary
            ];
        }

        respond(200, ['success' => true, 'data' => $results]);
    }

    // --- PAYSLIP CONTROLS ---

    public function indexPayslips(array $auth): void {
        $monthYear = $_GET['month_year'] ?? '';
        if (empty($monthYear)) respond(400, null, 'Thiếu tham số tháng (month_year)', false);

        if ($this->isAdmin($auth)) {
            $stmt = $this->db->prepare("
                SELECT p.*, u.full_name as employee_name, u.email, u.phone, u.job_title
                FROM monthly_payslips p
                JOIN users u ON p.user_id = u.id
                WHERE u.tenant_id = ? AND p.month_year = ?
            ");
            $stmt->execute([$auth['tenant_id'], $monthYear]);
        } else {
            $stmt = $this->db->prepare("
                SELECT p.*, u.full_name as employee_name, u.email, u.phone, u.job_title
                FROM monthly_payslips p
                JOIN users u ON p.user_id = u.id
                WHERE p.user_id = ? AND p.month_year = ?
            ");
            $stmt->execute([$auth['user_id'], $monthYear]);
        }
        respond(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function sendPayslips(array $auth): void {
        if (!$this->isAdmin($auth)) respond(403, null, 'Quyền admin là bắt buộc', false);
        $b = getBody();
        $monthYear = $b['month_year'] ?? '';
        if (empty($monthYear)) respond(400, null, 'Thiếu tháng gửi phiếu lương', false);

        // Fetch users who have draft payslips in this month to notify them
        $stmtUsers = $this->db->prepare("SELECT DISTINCT user_id FROM monthly_payslips WHERE month_year = ? AND status = 'draft'");
        $stmtUsers->execute([$monthYear]);
        $userIds = $stmtUsers->fetchAll(PDO::FETCH_COLUMN) ?: [];

        $stmt = $this->db->prepare("UPDATE monthly_payslips SET status = 'sent' WHERE month_year = ? AND status = 'draft'");
        $stmt->execute([$monthYear]);

        // Dispatch Notifications
        try {
            require_once __DIR__ . '/../NotificationService.php';
            foreach ($userIds as $uid) {
                $stmtU = $this->db->prepare("SELECT full_name FROM users WHERE id = ?");
                $stmtU->execute([$uid]);
                $uName = $stmtU->fetchColumn() ?: 'Nhân viên';

                NotificationService::send($this->db, $auth['tenant_id'], 'HRM_PAYSLIP_PUBLISHED', [
                    'user_id' => $uid,
                    'user_name' => $uName,
                    'month_year' => $monthYear
                ]);
            }
        } catch (\Throwable $e) {}

        respond(200, ['success' => true]);
    }

    public function confirmPayslip(array $auth): void {
        $b = getBody();
        $id = (int)($b['id'] ?? 0);
        $signatureUrl = $b['signature_url'] ?? '';

        if (empty($signatureUrl)) respond(400, null, 'Chữ ký là bắt buộc để xác nhận phiếu lương', false);

        $stmt = $this->db->prepare("UPDATE monthly_payslips SET status = 'confirmed', signature_url = ?, confirmed_at = NOW() WHERE id = ? AND user_id = ? AND status = 'sent'");
        $stmt->execute([$signatureUrl, $id, $auth['user_id']]);

        // Dispatch Notification
        try {
            $stmtP = $this->db->prepare("SELECT p.*, u.full_name FROM monthly_payslips p JOIN users u ON p.user_id = u.id WHERE p.id = ?");
            $stmtP->execute([$id]);
            $psRow = $stmtP->fetch(PDO::FETCH_ASSOC);
            if ($psRow) {
                require_once __DIR__ . '/../NotificationService.php';
                NotificationService::send($this->db, $auth['tenant_id'], 'HRM_PAYSLIP_CONFIRMED', [
                    'user_name' => $psRow['full_name'],
                    'month_year' => $psRow['month_year']
                ]);
            }
        } catch (\Throwable $e) {}

        respond(200, ['success' => true]);
    }

    public function lockPayroll(array $auth): void {
        if (!$this->isAdmin($auth)) respond(403, null, 'Quyền admin là bắt buộc', false);
        $b = getBody();
        $monthYear = $b['month_year'] ?? '';
        if (empty($monthYear)) respond(400, null, 'Thiếu tháng khóa lương', false);

        $stmt = $this->db->prepare("UPDATE monthly_payslips SET status = 'locked' WHERE month_year = ?");
        $stmt->execute([$monthYear]);

        respond(200, ['success' => true]);
    }

    public function getPendingApprovals(array $auth): void {
        if (!$this->isAdmin($auth)) respond(403, null, 'Quyền admin là bắt buộc', false);

        $pending = [];

        // 1. Pending Leaves
        $stmtLeaves = $this->db->prepare("
            SELECT l.id, u.full_name as employee_name, l.leave_type, 
                   l.start_date, l.end_date, l.total_days, l.reason, l.status, l.created_at
            FROM hrm_leave_requests l
            JOIN users u ON l.user_id = u.id
            WHERE u.tenant_id = ? AND l.status = 'pending'
        ");
        $stmtLeaves->execute([$auth['tenant_id']]);
        $leaves = $stmtLeaves->fetchAll(PDO::FETCH_ASSOC);
        foreach ($leaves as $l) {
            $pending[] = [
                'id' => (int)$l['id'],
                'type' => 'leave',
                'employee_name' => $l['employee_name'],
                'title' => 'Đơn xin nghỉ phép (' . ($l['leave_type'] === 'annual' ? 'Phép năm' : ($l['leave_type'] === 'sick' ? 'Nghỉ ốm' : ($l['leave_type'] === 'compensatory' ? 'Nghỉ bù' : ($l['leave_type'] === 'late_early' ? 'Đi trễ/Về sớm' : 'Không lương')))) . ')',
                'description' => 'Thời gian: ' . $l['start_date'] . ' -> ' . $l['end_date'] . ' (' . $l['total_days'] . ' ngày). Lý do: "' . $l['reason'] . '"',
                'created_at' => $l['created_at']
            ];
        }

        // 2. Pending Advances
        $stmtAdvances = $this->db->prepare("
            SELECT a.id, u.full_name as employee_name, a.amount, a.reason, a.status, a.created_at
            FROM hrm_salary_advances a
            JOIN users u ON a.user_id = u.id
            WHERE u.tenant_id = ? AND a.status = 'pending'
        ");
        $stmtAdvances->execute([$auth['tenant_id']]);
        $advances = $stmtAdvances->fetchAll(PDO::FETCH_ASSOC);
        foreach ($advances as $a) {
            $pending[] = [
                'id' => (int)$a['id'],
                'type' => 'advance',
                'employee_name' => $a['employee_name'],
                'title' => 'Đề xuất tạm ứng lương',
                'description' => 'Số tiền: ' . number_format($a['amount'], 0, ',', '.') . 'đ. Lý do: "' . $a['reason'] . '"',
                'created_at' => $a['created_at']
            ];
        }

        // 3. Pending Expenses
        $stmtExpenses = $this->db->prepare("
            SELECT e.id, u.full_name as employee_name, e.title, e.amount, e.notes, e.status, e.created_at
            FROM expenses e
            JOIN users u ON e.created_by = u.id
            WHERE e.tenant_id = ? AND e.status = 'pending' AND e.deleted_at IS NULL
        ");
        $stmtExpenses->execute([$auth['tenant_id']]);
        $expenses = $stmtExpenses->fetchAll(PDO::FETCH_ASSOC);
        foreach ($expenses as $e) {
            $pending[] = [
                'id' => (int)$e['id'],
                'type' => 'expense',
                'employee_name' => $e['employee_name'],
                'title' => 'Yêu cầu chi phí: ' . $e['title'],
                'description' => 'Số tiền: ' . number_format($e['amount'], 0, ',', '.') . 'đ. Ghi chú: "' . $e['notes'] . '"',
                'created_at' => $e['created_at']
            ];
        }

        // 4. Pending Checkins
        $stmtCheckins = $this->db->prepare("
            SELECT c.id, u.full_name as employee_name, c.check_in_date, c.check_in_time, c.late_minutes, c.reason, c.status, c.created_at
            FROM check_ins c
            JOIN users u ON c.user_id = u.id
            WHERE u.tenant_id = ? AND c.status = 'pending_approval'
        ");
        $stmtCheckins->execute([$auth['tenant_id']]);
        $checkins = $stmtCheckins->fetchAll(PDO::FETCH_ASSOC);
        foreach ($checkins as $c) {
            $pending[] = [
                'id' => (int)$c['id'],
                'type' => 'checkin',
                'employee_name' => $c['employee_name'],
                'title' => 'Giải trình đi trễ ngày ' . $c['check_in_date'],
                'description' => 'Đi trễ ' . $c['late_minutes'] . ' phút (Check-in lúc ' . $c['check_in_time'] . '). Lý do: "' . $c['reason'] . '"',
                'created_at' => $c['created_at']
            ];
        }

        // Sort by created_at DESC
        usort($pending, function($a, $b) {
            return strcmp($b['created_at'], $a['created_at']);
        });

        respond(200, $pending);
    }

    public function getMyRequests(array $auth): void {
        $pending = [];

        // 1. My Leaves
        $stmtLeaves = $this->db->prepare("
            SELECT l.id, l.leave_type, l.start_date, l.end_date, l.total_days, l.reason, l.status, l.created_at
            FROM hrm_leave_requests l
            WHERE l.user_id = ?
        ");
        $stmtLeaves->execute([$auth['user_id']]);
        $leaves = $stmtLeaves->fetchAll(PDO::FETCH_ASSOC);
        foreach ($leaves as $l) {
            $pending[] = [
                'id' => (int)$l['id'],
                'type' => 'leave',
                'title' => 'Đơn xin nghỉ phép (' . ($l['leave_type'] === 'annual' ? 'Phép năm' : ($l['leave_type'] === 'sick' ? 'Nghỉ ốm' : ($l['leave_type'] === 'compensatory' ? 'Nghỉ bù' : ($l['leave_type'] === 'late_early' ? 'Đi trễ/Về sớm' : 'Không lương')))) . ')',
                'description' => 'Thời gian: ' . $l['start_date'] . ' -> ' . $l['end_date'] . ' (' . $l['total_days'] . ' ngày). Lý do: "' . $l['reason'] . '"',
                'status' => $l['status'],
                'created_at' => $l['created_at']
            ];
        }

        // 2. My Advances
        $stmtAdvances = $this->db->prepare("
            SELECT a.id, a.amount, a.reason, a.status, a.created_at
            FROM hrm_salary_advances a
            WHERE a.user_id = ?
        ");
        $stmtAdvances->execute([$auth['user_id']]);
        $advances = $stmtAdvances->fetchAll(PDO::FETCH_ASSOC);
        foreach ($advances as $a) {
            $pending[] = [
                'id' => (int)$a['id'],
                'type' => 'advance',
                'title' => 'Đề xuất tạm ứng lương',
                'description' => 'Số tiền: ' . number_format($a['amount'], 0, ',', '.') . 'đ. Lý do: "' . $a['reason'] . '"',
                'status' => $a['status'],
                'created_at' => $a['created_at']
            ];
        }

        // 3. My Expenses
        $stmtExpenses = $this->db->prepare("
            SELECT e.id, e.title, e.amount, e.notes, e.status, e.created_at
            FROM expenses e
            WHERE e.created_by = ? AND e.deleted_at IS NULL
        ");
        $stmtExpenses->execute([$auth['user_id']]);
        $expenses = $stmtExpenses->fetchAll(PDO::FETCH_ASSOC);
        foreach ($expenses as $e) {
            $pending[] = [
                'id' => (int)$e['id'],
                'type' => 'expense',
                'title' => 'Yêu cầu chi phí: ' . $e['title'],
                'description' => 'Số tiền: ' . number_format($e['amount'], 0, ',', '.') . 'đ. Ghi chú: "' . $e['notes'] . '"',
                'status' => $e['status'],
                'created_at' => $e['created_at']
            ];
        }

        // 4. My Checkins
        $stmtCheckins = $this->db->prepare("
            SELECT c.id, c.check_in_date, c.check_in_time, c.late_minutes, c.reason, c.status, c.created_at
            FROM check_ins c
            WHERE c.user_id = ? AND c.late_minutes > 0
        ");
        $stmtCheckins->execute([$auth['user_id']]);
        $checkins = $stmtCheckins->fetchAll(PDO::FETCH_ASSOC);
        foreach ($checkins as $c) {
            $pending[] = [
                'id' => (int)$c['id'],
                'type' => 'checkin',
                'title' => 'Giải trình đi trễ ngày ' . $c['check_in_date'],
                'description' => 'Đi trễ ' . $c['late_minutes'] . ' phút (Check-in lúc ' . $c['check_in_time'] . '). Lý do: "' . $c['reason'] . '"',
                'status' => $c['status'],
                'created_at' => $c['created_at']
            ];
        }

        // Sort by created_at DESC
        usort($pending, function($a, $b) {
            return strcmp($b['created_at'], $a['created_at']);
        });

        respond(200, $pending);
    }
}
