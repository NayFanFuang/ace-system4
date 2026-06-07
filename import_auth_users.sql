-- Auto-generated auth_users import from Employee2.xlsx
-- Initial password: ACE1234 (must_change_password=true)
-- Skips employees that already have an account (ON CONFLICT DO NOTHING)
BEGIN;

INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE001', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Seng', 'Bun Lay', 'Bunlay.seng@airconnect-e.com', 'Executive', 'HQ', 'OTHER', 'Managing Director', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE005', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Phannarai', 'Phagasri', 'Phannarai@airconnect-e.com', 'HR', 'HQ', 'OTHER', 'General Admin Manager', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE009', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Narong', 'Saemaphakdee', 'Narong@airconnect-e.com', 'Project', 'PM', 'OTHER', 'Project Director', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE010', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Atthapol', 'Ruangboot', 'Atthapol@airconnect-e.com', 'Project', 'PM', 'OTHER', 'Senior Project Manager', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE056', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Peerapol', 'Piamsri', 'Peerapol@airconnect-e.com', 'Project', 'RF', 'OTHER', 'Project Manager', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE125', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Ananchai', 'Mittha', 'Ananchai@airconnect-e.com', 'Project', 'RF', 'OTHER', 'Drive Test Analysis Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE174', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Anong', 'Jantaraeng', 'Anong@airconnect-e.com', 'Accounting', 'Finance', 'OTHER', 'Finance Officer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE246', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Porntip', 'Chotchaug', 'Tip83574@gmail.com', 'HR', 'HQ', 'OTHER', 'Maid', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE292', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Phumipat', 'Yupracham', 'Phumipat@airconnect-e.com', 'Project', 'RF', 'OTHER', 'Drive Test Analysis Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE603', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Rungnapa', 'Pangkaew', 'Rungnapa@airconnect-e.com', 'Accounting', 'Finance', 'OTHER', 'Accounting and Finance Manager', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE618', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Sujitra', 'Khuenkhiao', 'Sujitra@airconnect-e.com', 'Project', 'TE', 'OTHER', 'Report Preparation Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE623', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Wachara', 'Boonthai', 'Wachara@airconnect-e.com', 'Project', 'TE', 'OTHER', 'Report Preparation Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE624', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Bandasak', 'Sukpheng', 'Bandasak@airconnect-e.com', 'Project', 'PM', 'OTHER', 'Senior Site Supervisor', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE630', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Artit', 'Malawaichan', 'Artit.m@airconnect-e.com', 'Project', 'PM', 'OTHER', 'Senior Systems Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE652', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Boonsong', 'Nisap', 'Boonsong.ns@airconnect-e.com', 'Project', 'Enterprise', 'OTHER', 'Site Solution', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS002', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Sajja', 'Kaengkan', 'Sajja@airconnect-e.com', 'Project', 'RF', 'OTHER', 'Project Manager', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AE008', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Chainarong', 'Songsee', 'Chainarong@airconnect-e.com', 'Project', 'TE', 'OTHER', 'Site Supervisor', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AE013', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Thachatham', 'Monton', 'Thachatham@airconnect-e.com', 'Project', 'RF', 'OTHER', 'Drive Test Analysis Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AE106', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Tipparat', 'Buntaweelert', 'Tipparat@airconnect-e.com', 'Project', 'PM', 'OTHER', 'RF Project Admin', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AE129', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Peerayu', 'Chunlaphan', 'Peerayu@airconnect-e.com', 'Project', 'Enterprise', 'OTHER', 'Site Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AE151', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Rattana', 'Kerdprakob', 'Rattana.kpk@airconnect-e.com', 'Project', 'TE', 'OTHER', 'Report Preparation Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AE152', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Somphon', 'Wongwattanagonchai', 'Beesomphon@gmail.com', 'Project', 'TE', 'OTHER', 'Store Officer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AE180', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Wathana', 'Lamoon', 'Wattana@airconnect-e.com', 'Project', 'PM', 'OTHER', 'Senior Project Manager', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AE192', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Packaphon', 'Maythamongkolkate', 'Packaphon.May@airconnect-e.com', 'Project', 'Enterprise', 'OTHER', 'Site Supervisor', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AE194', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Nattapon', 'Sangtienprapai', 'Nattapon.sa@airconnect-e.com', 'Project', 'TE', 'OTHER', 'Project Manager', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AECS212', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Thanachai', 'Mothong', 'Hs3pol@gmail.com', 'Project', 'RF', 'OTHER', 'Rigger', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AECS224', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Yodsawee', 'Khawsri', 'Yodsawee@airconnect-e.com', 'Project', 'RF', 'OTHER', 'Team Leader', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS401', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Kidsakon', 'Deeprasert', 'Kidsakond.huawei@gmail.com', 'Project', 'RF', 'OTHER', 'Drive Test Analysis Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS403', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Panut', 'Pang-nga', 'panut.png@airconnect-e.com', 'Project', 'RF', 'OTHER', 'Drive Test Analysis Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AECS228', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Sukreephon', 'Maichum', 'Sukreephon_maichum@hotmail.com', 'Project', 'RF', 'OTHER', 'OMC Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS258', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Chirasak', 'Wongphapa', 'Jeerasakwongphapa@gmail.com', 'Project', 'RF', 'OTHER', 'Drive Test Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AECS279', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Akkarawut', 'Promriew', 'Hdyuyryom@gmail.com', 'Project', 'TE', 'OTHER', 'Rigger', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AECS298', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Paksiri', 'Khattiset', 'Puksiri.kha@airconnect-e.com', 'Project', 'Enterprise', 'OTHER', 'Inventory Management', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS286', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Kankanit', 'Suwannathorn', 'Kankanit.suw@airconnect-e.com', 'HR', 'HR', 'OTHER', 'HR Coordinator', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE685', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Keattichai', 'Konggun', 'Keattichai.kon@airconnect-e.com', 'HR', 'HR', 'OTHER', 'HR Labor Relations', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AECS343', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Metinee', 'Boonkerd', 'metineeb.huawei@gmail.com', 'Project', 'RF', 'OTHER', 'Drive Test Analysis Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE690', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Woraphat', 'Chery', 'Woraphat1100@gmail.com', 'Project', 'RF', 'OTHER', 'Drive Test Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AE196', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Thitipong', 'Promtrirat', 'Thitipong.Pro@airconnect-e.com', 'Accounting', 'Finance', 'OTHER', 'Accounting Officer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AECS357', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Krittasin', 'Duangta', 'Krittasin.dua@airconnect-e.com', 'Project', 'RF', 'OTHER', 'Project Manager', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AECS359', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Chetsada', 'Thauaonsang', 'Jatsada.me@gmail.com', 'Project', 'RF', 'OTHER', 'Drive Test Analysis Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AE201', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Pimwaree', 'Sriwun', 'Pimwaree.s@advance-e.net', 'Accounting', 'Finance', 'OTHER', 'Accounting Officer (Cambodia Support)', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AE202', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Sasivimon', 'Phoraksa', 'Sasivimol.p@airconnect-e.com', 'HR', 'HR', 'OTHER', 'HR Recruiter', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE692', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Nitcha', 'Buanak', 'Nitcha.b@airconnect-e.com', 'Executive', 'HQ', 'OTHER', 'Secretary', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS404', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Prasittipon', 'Ployphum', 'Prasittipon.pp@airconnect-e.com', 'Project', 'RF', 'OTHER', 'Drive Test Analysis Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS406', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Payonrat', 'Phothiwat', 'Payonrat.jub.rf@gmail.com', 'Project', 'RF', 'OTHER', 'Drive Test Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE693', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Thaweephong', 'Thumphung', 'thaweephong.t@airconnect-e.com', 'AI', 'AI', 'OTHER', 'Senior Software Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE694', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Ravit', 'Anuvongnukroh', 'ravit.a@airconnect-e.com', 'AI', 'AI', 'OTHER', 'Project Manager', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AE204', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Suriya', 'Chareeun', 'tengteng0153@gmail.com', 'HR', 'HQ', 'OTHER', 'Messenger', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE696', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Thammanoon', 'Malaicharoen', 'thammanoon.m@airconnect-e.com', 'AI', 'AI', 'OTHER', 'Software Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE697', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Poommanat', 'Darachalermkul', 'poommanat.d@airconnect-e.com', 'AI', 'AI', 'OTHER', 'Software Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS384', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Thanawut', 'Kuwangkadilok', 'Chanton225@gmail.com', 'Project', 'RF', 'OTHER', 'Drive Test Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS385', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Sasikarn', 'Boot-ngarm', 'Sasikarn.b@airconnect-e.com', 'Project', 'Enterprise', 'OTHER', 'Safety Officer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('AE205', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Tugsadon', 'Bovontanaphaisai', 'Tugsadon@airconnect-e.com', 'HR', 'HQ', 'OTHER', 'IT Support', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS386', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Jukkraphon', 'Meechai', 'jukkraphon.mee@airconnect-e.com', 'Project', 'RF', 'OTHER', 'Drive Test Analysis​ Engineer/TL', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS388', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Lin', 'Saleepan', 'lin.sal@airconnect-e.com', 'Project', 'RF', 'OTHER', 'Drive Test Analysis Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS389', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Sulimat', 'Sonain', 'sulimat.son@airconnect-e.com', 'Project', 'RF', 'OTHER', 'Drive Test Analysis Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS390', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Phudit', 'Chuadnuch', 'phudit.chu@airconnect-e.com', 'Project', 'RF', 'OTHER', 'Drive Test Analysis Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS392', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Pawaran', 'Puyati', 'pawaran.puy@airconnect-e.com', 'Project', 'RF', 'OTHER', 'Drive Test Analysis Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS393', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Chonlada', 'Boonchottiphong', 'chonlada.boo@airconnect-e.com', 'Project', 'RF', 'OTHER', 'Drive Test Analysis Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS394', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Kunwadee', 'Hoi-mala', 'kunwadee.hoi@airconnect-e.com', 'Project', 'RF', 'OTHER', 'Drive Test Analysis Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS395', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Wuttisit', 'Seewasao', 'wuttisit.see@airconnect-e.com', 'Project', 'RF', 'OTHER', 'Drive Test Analysis Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS396', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Phonlawat', 'Khwanthong', 'phonlawat.kwa@airconnect-e.com', 'Project', 'RF', 'OTHER', 'Drive Test Analysis Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS397', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Patsakorn', 'Witenjit', 'Macdrums78@gmail.com', 'Project', 'RF', 'OTHER', 'Drive Test Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS398', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Chokchai', 'Chinnarach', 'chokzee.cc@gmail.com', 'Project', 'RF', 'OTHER', 'Drive Test Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS399+F81', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Pathanin', 'Neampiboon', 'Pathanin2538@gmail.com', 'Project', 'RF', 'OTHER', 'Drive Test Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS400', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Thanaphong', 'Triphanitkun', 'thanaphongtri@gmail.com', 'Project', 'RF', 'OTHER', 'Drive Test Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS407', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Panukon', 'Sonsinpong', 'Yuiyuiyui803@gmail.com', 'Project', 'RF', 'OTHER', 'Drive Test Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS408', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Panuwat', 'Piwngam', 'panuwat.phiw@gmail.com', 'Project', 'RF', 'OTHER', 'Drive Test Analysis Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE698', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Chayaporn', 'Suchaiya', 'Chayaporn.s@airconnect-e.com', 'HR', 'HR', 'OTHER', 'HR and Admin Manager', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE699', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Pornpimon', 'Chardram', 'Pornpimon.chard@airconnect-e.com', 'HR', 'HQ', 'OTHER', 'Purchasing Specialist', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS410', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Kittiphong', 'Wongsakul', 'kittiphong.psauto@gmail.com', 'Project', 'RF', 'OTHER', 'Drive Test Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS411', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Wilairat', 'Khantikool', 'Wilairat.Khan@airconnect-e.com', 'BD', 'BD', 'OTHER', 'Sales Manager', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS412', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Nattdanai', 'Kittaponsakun', 'Fangfyhunter@gmail.com', 'Project', 'RF', 'OTHER', 'Drive Test Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS413', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Niramol', 'Kuldilok', 'Niramol.huawei@gmail.com', 'Project', 'RF', 'OTHER', 'Drive Test Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS414', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Wuttinan', 'Wongwut', 'Wuttinan.wongwut@gmail.com', 'Project', 'RF', 'OTHER', 'Rf Professional L2', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS415', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Ponlawat', 'Sangdanjak', 'Ponrawat1996@gmail.com', 'Project', 'RF', 'OTHER', 'Rf Professional L2', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS416', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Jantira', 'Prathumwong', 'Zom.jantira04@gmail.com', 'Project', 'RF', 'OTHER', 'Rf Professional L2', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS417', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Sutnatie', 'Boonyalekha', 'Sutnatie@gmail.com', 'Project', 'RF', 'OTHER', 'Rf Professional L3', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS418', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Suwanna', 'Pradittara', 'Suwanna.pradittara@gmail.com', 'Project', 'RF', 'OTHER', 'Rf Professional L3', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS419', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Taned', 'Yusabai', 'Taned79@gmail.com', 'Project', 'RF', 'OTHER', 'Drive Test Engineer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS420', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Tippawan', 'Lonarai', 'lonaraiwaew@gmail.com', 'Project', 'RF', 'OTHER', 'Rf Professional L2', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS421', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Sastra', 'Thongmak', 'Sas_pnp@hotmail.com', 'Project', 'RF', 'OTHER', 'Rf Professional L3', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACE700', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Chotika', 'Pimpisan', 'Chotika.p@airconnect-e.com', 'Accounting', 'Finance', 'OTHER', 'Senior Accountant', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS425', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Thanakit', 'Bunrak', 'thanakit1986boo@gmail.com', 'Project', 'RF', 'OTHER', 'RF Professional L2', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS426', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Somchai', 'Klinhomsophon', 'somchaiklinhomsophon@gmail.com', 'Project', 'RF', 'OTHER', 'RF Professional L2', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS427', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Kriangkaisit', 'Meekhun', 'kriangkaisit@outlook.com', 'Project', 'RF', 'OTHER', 'RF Professional L2', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS428', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Saranya', 'Tonohueng', 'sarany21012535@gmail.com', 'Project', 'TE', 'OTHER', 'Team Leader', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS429', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Anuwat', 'Ramring', 'Anuwat.promt@gmail.com', 'Project', 'TE', 'OTHER', 'Team Leader', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS430', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Sakraphi', 'Champapho', 'sakrapree@gmail.com', 'Project', 'TE', 'OTHER', 'Team Leader', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;
INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, role, clock_type, gps_required, photo_required, allowed_radius_m, must_change_password, is_active, failed_login_count, token_version)
VALUES ('ACECS431', '$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC', 'Papontanai', 'Amnouysawatchai', 'papontanai@hotmail.com', 'Project', 'TE', 'OTHER', 'Project Coordinator and Store Officer', 'EMPLOYEE', 'DAILY', false, false, 300, true, true, 0, 1)
ON CONFLICT (employee_code) DO NOTHING;

COMMIT;

-- Summary
SELECT COUNT(*) AS total_auth_users FROM auth_users;
SELECT COUNT(*) AS active_employees FROM employees WHERE source='Employee2.xlsx' AND status='ACTIVE';
SELECT e.employee_code, e.full_name, e.email
FROM employees e
LEFT JOIN auth_users a ON a.employee_code = e.employee_code
WHERE e.source='Employee2.xlsx' AND e.status='ACTIVE' AND a.employee_code IS NULL
ORDER BY e.employee_code;