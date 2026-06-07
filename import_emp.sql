BEGIN;
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE001','Bunlay.seng@airconnect-e.com',NULL,'Seng Bun Lay','Seng','Bun Lay','Seng','089-922-1328','Executive','Head Office','HQ','Managing Director','Managing Director','Managing Director','Office Management','Office Management','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME',NULL,'Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE005','Phannarai@airconnect-e.com',NULL,'Phannarai Phagasri','Phannarai','Phagasri','Phan','090-990-4133','HR','Administrative','HQ','General Admin Manager','General Admin Manager','General Admin Manager','Office Management','Office Management','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2007-05-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE009','Narong@airconnect-e.com',NULL,'Narong Saemaphakdee','Narong','Saemaphakdee','Narong','081-912-4966','Project','Project Management','PM','Project Director','Project Director','Project Director','Project Management','Project Management','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2007-12-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE010','Atthapol@airconnect-e.com','Atthapol.ru@gmail.com','Atthapol Ruangboot','Atthapol','Ruangboot','Bom','095-995-6261','Project','Project Management','PM','Senior Project Manager','Senior Project Manager','Senior Project Manager','Project Management','Project Management','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2008-01-15','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE056','Peerapol@airconnect-e.com',NULL,'Peerapol Piamsri','Peerapol','Piamsri','Nueng','083-895-8506','Project','RF Project','RF','Project Manager','Project Manager','Project Manager','NBTC2501 : NBTC NSA/SA Benchmarking Project','NBTC2501 : NBTC NSA/SA Benchmarking Project','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2011-06-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE125','Ananchai@airconnect-e.com','Ananchai.mittha@gmail.com','Ananchai Mittha','Ananchai','Mittha','Bew','087-008-2326','Project','RF Project','RF','Drive Test Analysis Engineer','Drive Test Analysis Engineer','DTA-L2','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2012-01-10','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE174','Anong@airconnect-e.com',NULL,'Anong Jantaraeng','Anong','Jantaraeng','Kook','090-990-4113','Accounting','Accounting and Finance','Finance','Finance Officer','Finance Officer','Accounts Payable','Office Management','Office Management','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2012-10-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE246','Tip83574@gmail.com',NULL,'Porntip Chotchaug','Porntip','Chotchaug','Tip','085-240-7042','HR','Administrative','HQ','Maid','Maid','Maid','Office Management','Office Management','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2013-06-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE292','Phumipat@airconnect-e.com',NULL,'Phumipat Yupracham','Phumipat','Yupracham','M','081-256-3327','Project','RF Project','RF','Drive Test Analysis Engineer','Drive Test Analysis Engineer','DTA-L2','NBTC2501 : NBTC NSA/SA Benchmarking Project','NBTC2501 : NBTC NSA/SA Benchmarking Project','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2013-11-10','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE603','Rungnapa@airconnect-e.com',NULL,'Rungnapa Pangkaew','Rungnapa','Pangkaew','Boombim','081-666-3575','Accounting','Accounting and Finance','Finance','Accounting and Finance Manager','Accounting and Finance Manager','Accounting and Finance','Office Management','Office Management','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2020-02-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE618','Sujitra@airconnect-e.com','Paw.rmuti@gmail.com','Sujitra Khuenkhiao','Sujitra','Khuenkhiao','Paw','097-953-8856','Project','TE Project','TE','Report Preparation Engineer','Report Preparation Engineer','Report Preparation Engineer','HWT2607: HWT IBS BMA&EAS Project','HWT2607: HWT IBS BMA&EAS Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2020-06-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE623','Wachara@airconnect-e.com','Watcharaboonthai1992@gmail.com','Wachara Boonthai','Wachara','Boonthai','Bon','088-344-4504','Project','TE Project','TE','Report Preparation Engineer','Report Preparation Engineer','RPE-L1','HWT2607: HWT IBS BMA&EAS Project','HWT2607: HWT IBS BMA&EAS Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2021-06-21','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE624','Bandasak@airconnect-e.com','BandasakSukpheng@gmail.com','Bandasak Sukpheng','Bandasak','Sukpheng','Bank','084-657-2276','Project','Project Management','PM','Senior Site Supervisor','Senior Site Supervisor','Senior Site Supervisor','Project Management','Project Management','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2019-01-03','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE630','Artit.m@airconnect-e.com','Mean0607@gmail.com','Artit Malawaichan','Artit','Malawaichan','Mean','062-706-7728','Project','Project Management','PM','Senior Systems Engineer','Senior Systems Engineer','Senior Systems Engineer','Project Management','Project Management','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2022-01-25','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE652','Boonsong.ns@airconnect-e.com',NULL,'Boonsong Nisap','Boonsong','Nisap','Au','087-703-5566','Project','Enterprise Project','Enterprise','Site Solution','Site Solution','Site Solution','WW2503 : WW Orange Line Project','WW2503 : WW Orange Line Project','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2022-08-25','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS002','Sajja@airconnect-e.com','Skangkan@gmail.com','Sajja Kaengkan','Sajja','Kaengkan','Tang','089-646-4356','Project','RF Project','RF','Project Manager','Project Manager','Project Manager','HWT2601 : RF TRUE/HWT Flash EAS&BMA Project','HWT2601 : RF TRUE/HWT Flash EAS&BMA Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2015-09-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AE008','Chainarong@airconnect-e.com','Chainarong-songsee@outlook.co.th','Chainarong Songsee','Chainarong','Songsee','Gla','082-958-2152','Project','TE Project','TE','Site Supervisor','Site Supervisor','Senior Site Supervisor','HWT2502 : TE AIS MBB Expansion BMA Project','HWT2502 : TE AIS MBB Expansion BMA Project','AE','ACTIVE','FULL_TIME' ,'FULL_TIME','2013-04-02','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AE013','Thachatham@airconnect-e.com','Thachatham@outlook.com','Thachatham Monton','Thachatham','Monton','Pe-Tong','093-134-4310','Project','RF Project','RF','Drive Test Analysis Engineer','Drive Test Analysis Engineer','DTA-L1','HWT2601 : RF TRUE/HWT Flash EAS&BMA Project','HWT2601 : RF TRUE/HWT Flash EAS&BMA Project','AE','ACTIVE','FULL_TIME' ,'FULL_TIME','2016-03-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AE106','Tipparat@airconnect-e.com','Imtipparatb@gmail.com','Tipparat Buntaweelert','Tipparat','Buntaweelert','Kwangdaow','064-954-4192','Project','Project Management','PM','RF Project Admin','RF Project Admin','Project Admin','Project Management','Project Management','AE','ACTIVE','FULL_TIME' ,'FULL_TIME','2019-08-15','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AE129','Peerayu@airconnect-e.com','Bluepeerayu@gmail.com','Peerayu Chunlaphan','Peerayu','Chunlaphan','Blue','094-346-3555','Project','Enterprise Project','Enterprise','Site Engineer','Site Engineer','Site Engineer','WW2503 : WW Orange Line Project','WW2503 : WW Orange Line Project','AE','ACTIVE','FULL_TIME' ,'FULL_TIME','2020-05-11','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AE151','Rattana.kpk@airconnect-e.com','Rattanajj1989@gmail.com','Rattana Kerdprakob','Rattana','Kerdprakob','J','090-199-2388','Project','TE Project','TE','Report Preparation Engineer','Report Preparation Engineer','Report Preparation Engineer','HWT2305 : TE TRUE Merge/HWT_Rollout BMA Project','HWT2305 : TE TRUE Merge/HWT_Rollout BMA Project','AE','ACTIVE','FULL_TIME' ,'CONTRACT','2019-12-11','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AE152','Beesomphon@gmail.com',NULL,'Somphon Wongwattanagonchai','Somphon','Wongwattanagonchai','Bee','080-456-7672','Project','TE Project','TE','Store Officer','Store Officer','Store','HWT2305 : TE TRUE Merge/HWT_Rollout BMA Project','HWT2305 : TE TRUE Merge/HWT_Rollout BMA Project','AE','ACTIVE','FULL_TIME' ,'CONTRACT','2019-12-11','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AE180','Wattana@airconnect-e.com',NULL,'Wathana Lamoon','Wathana','Lamoon','Bird','090-904-9173','Project','Project Management','PM','Senior Project Manager','Senior Project Manager','Senior Project Manager','Project Management','Project Management','AE','ACTIVE','FULL_TIME' ,'CONTRACT','2018-06-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AE192','Packaphon.May@airconnect-e.com','Zechange@gmail.com','Packaphon Maythamongkolkate','Packaphon','Maythamongkolkate','Chai','086-042-2444','Project','Enterprise Project','Enterprise','Site Supervisor','Site Supervisor','Site Supervisor','WW2503 : WW Orange Line Project','WW2503 : WW Orange Line Project','AE','ACTIVE','FULL_TIME' ,'CONTRACT','2023-09-18','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AE194','Nattapon.sa@airconnect-e.com','S.nattapon1989@gmail.com','Nattapon Sangtienprapai','Nattapon','Sangtienprapai','Ole','088-280-9181','Project','TE Project','TE','Project Manager','Project Manager','Project Manager','HWT2305 : TE TRUE Merge/HWT_Rollout BMA Project','HWT2305 : TE TRUE Merge/HWT_Rollout BMA Project','AE','ACTIVE','FULL_TIME' ,'CONTRACT','2023-09-18','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AECS212','Hs3pol@gmail.com',NULL,'Thanachai Mothong','Thanachai','Mothong','Oil','081-141-7166','Project','RF Project','RF','Rigger','Rigger','Rigger','HWT2601 : RF TRUE/HWT Flash EAS&BMA Project','HWT2601 : RF TRUE/HWT Flash EAS&BMA Project','AE','ACTIVE','FULL_TIME' ,'CONTRACT','2023-04-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AECS224','Yodsawee@airconnect-e.com','Plugoriginal@gmail.com','Yodsawee Khawsri','Yodsawee','Khawsri','Plug','091-064-2202','Project','RF Project','RF','Team Leader','Team Leader','Team Leader/DTA-L2','HWT2601 : RF TRUE/HWT Flash EAS&BMA Project','HWT2601 : RF TRUE/HWT Flash EAS&BMA Project','AE','ACTIVE','FULL_TIME' ,'CONTRACT','2015-03-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS401','Kidsakond.huawei@gmail.com','En13.0000@gmail.com','Kidsakon Deeprasert','Kidsakon','Deeprasert','Champ','087-690-7598','Project','RF Project','RF','Drive Test Analysis Engineer','Drive Test Analysis Engineer','DTA-L1.8','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2016-01-10','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS403','panut.png@airconnect-e.com','Panutman@hotmail.co.th','Panut Pang-nga','Panut','Pang-nga','Man','088-033-6727','Project','RF Project','RF','Drive Test Analysis Engineer','Drive Test Analysis Engineer','DTA-L1.8','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2016-10-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AECS228','Sukreephon_maichum@hotmail.com',NULL,'Sukreephon Maichum','Sukreephon','Maichum','Nueng','094-363-6391','Project','RF Project','RF','OMC Engineer','OMC Engineer','OMC/OSS-L1','HWT2601 : RF TRUE/HWT Flash EAS&BMA Project','HWT2601 : RF TRUE/HWT Flash EAS&BMA Project','AE','ACTIVE','FULL_TIME' ,'CONTRACT','2017-02-15','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS258','Jeerasakwongphapa@gmail.com',NULL,'Chirasak Wongphapa','Chirasak','Wongphapa','Not','082-847-2990','Project','RF Project','RF','Drive Test Engineer','Drive Test Engineer','DTE-L1','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2023-10-24','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AECS279','Hdyuyryom@gmail.com',NULL,'Akkarawut Promriew','Akkarawut','Promriew','Ton','061-874-1086','Project','TE Project','TE','Rigger','Rigger','Rigger','HWT2305 : TE TRUE Merge/HWT_Rollout BMA Project','HWT2305 : TE TRUE Merge/HWT_Rollout BMA Project','AE','ACTIVE','FULL_TIME' ,'CONTRACT','2023-11-10','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AECS298','Puksiri.kha@airconnect-e.com','Puksirikh@gmail.com','Paksiri Khattiset','Paksiri','Khattiset','Ing','089-639-9699','Project','Enterprise Project','Enterprise','Inventory Management','Inventory Management','Inventory Management','WW2503 : WW Orange Line Project','WW2503 : WW Orange Line Project','AE','ACTIVE','FULL_TIME' ,'CONTRACT','2024-02-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS286','Kankanit.suw@airconnect-e.com','Kankanit.dreamm@gmail.com','Kankanit Suwannathorn','Kankanit','Suwannathorn','Dream','098-414-7739','HR','Human Resources','HR','HR Coordinator','HR Coordinator','HR Coordinator','Office Management','Office Management','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2024-03-06','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE685','Keattichai.kon@airconnect-e.com','J.keattichai@gmail.com','Keattichai Konggun','Keattichai','Konggun','Job','082-691-0478','HR','Human Resources','HR','HR Labor Relations','HR Labor Relations','HR Labor Relations','Office Management','Office Management','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2024-08-29','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AECS343','metineeb.huawei@gmail.com','Maymayy1709@gmail.com','Metinee Boonkerd','Metinee','Boonkerd','May','061-076-2049','Project','RF Project','RF','Drive Test Analysis Engineer','Drive Test Analysis Engineer','DTA-L1','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2024-09-23','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE690','Woraphat1100@gmail.com',NULL,'Woraphat Chery','Woraphat','Chery','Sun','085-379-5112','Project','RF Project','RF','Drive Test Engineer','Drive Test Engineer','RPE-L1','HWT2601 : RF TRUE/HWT Flash EAS&BMA Project','HWT2601 : RF TRUE/HWT Flash EAS&BMA Project','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2024-10-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AE196','Thitipong.Pro@airconnect-e.com','Thitipong.vat@gmail.com','Thitipong Promtrirat','Thitipong','Promtrirat','Fame','099-364-5415','Accounting','Accounting and Finance','Finance','Accounting Officer','Accounting Officer','Accounting and Finance','Office Management','Office Management','AE','ACTIVE','FULL_TIME' ,'FULL_TIME','2024-10-15','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AECS357','Krittasin.dua@airconnect-e.com','Krittasin.d@gmail.com','Krittasin Duangta','Krittasin','Duangta','Dream','062-442-9595','Project','RF Project','RF','Project Manager','Project Manager','Project Manager','HWT2604 : RF AIS/HWT Expansion EAS&BMA Project','HWT2604 : RF AIS/HWT Expansion EAS&BMA Project','AE','ACTIVE','FULL_TIME' ,'CONTRACT','2024-10-21','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AECS359','Jatsada.me@gmail.com',NULL,'Chetsada Thauaonsang','Chetsada','Thauaonsang','Mean','063-771-0679','Project','RF Project','RF','Drive Test Analysis Engineer','Drive Test Analysis Engineer','DTA-L1','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2024-11-04','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AE201','Pimwaree.s@advance-e.net','Pat.pimwaree@gmail.com','Pimwaree Sriwun','Pimwaree','Sriwun','Pat','082-062-5796','Accounting','Accounting and Finance','Finance','Accounting Officer (Cambodia Support)','Accounting Officer (Cambodia Support)','Accounting and Finance','Office Management','Office Management','AE','ACTIVE','FULL_TIME' ,'FULL_TIME','2025-01-29','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AE202','Sasivimol.p@airconnect-e.com','Sasivimol.po@gmail.com','Sasivimon Phoraksa','Sasivimon','Phoraksa','Film','093-553-5541','HR','Human Resources','HR','HR Recruiter','HR Recruiter','HR Recruiter','Office Management','Office Management','AE','ACTIVE','FULL_TIME' ,'FULL_TIME','2025-03-04','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE692','Nitcha.b@airconnect-e.com','Pong_kis@hotmail.com','Nitcha Buanak','Nitcha','Buanak','Pong','080-905-9351','Executive','Head Office','HQ','Secretary','Secretary','Secretary','Office Management','Office Management','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2025-04-08','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS404','Prasittipon.pp@airconnect-e.com','Prasittipon1991@hotmail.com','Prasittipon Ployphum','Prasittipon','Ployphum','Got','088-564-1079','Project','RF Project','RF','Drive Test Analysis Engineer','Drive Test Analysis Engineer','DTA-L2','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2025-04-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS406','Payonrat.jub.rf@gmail.com',NULL,'Payonrat Phothiwat','Payonrat','Phothiwat','Jub','095-989-1781','Project','RF Project','RF','Drive Test Engineer','Drive Test Engineer','DTE-L1','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2025-08-25','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE693','thaweephong.t@airconnect-e.com','darkvaderskytrooper@gmail.com','Thaweephong Thumphung','Thaweephong','Thumphung','Mai','095-235-5979','AI','Computer Vision (AI)','AI','Senior Software Engineer','Senior Software Engineer','Senior Software Engineer','Computer Vision (AI)','Computer Vision (AI)','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2025-10-08','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE694','ravit.a@airconnect-e.com','mrravit@gmai.com','Ravit Anuvongnukroh','Ravit','Anuvongnukroh','Micky','096-302-7922','AI','Computer Vision (AI)','AI','Project Manager','Project Manager','Project Manager','Computer Vision (AI)','Computer Vision (AI)','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2025-11-03','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AE204','tengteng0153@gmail.com',NULL,'Suriya Chareeun','Suriya','Chareeun','Teng','094-787-7127','HR','Administrative','HQ','Messenger','Messenger','Messenger','Office Management','Office Management','AE','ACTIVE','FULL_TIME' ,'FULL_TIME','2025-09-15','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE696','thammanoon.m@airconnect-e.com','thammanoon.mal@gmail.com','Thammanoon Malaicharoen','Thammanoon','Malaicharoen','Aek','082-640-7472','AI','Computer Vision (AI)','AI','Software Engineer','Software Engineer','Software Engineer','Computer Vision (AI)','Computer Vision (AI)','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2025-10-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE697','poommanat.d@airconnect-e.com','poommanat.d@gmail.com','Poommanat Darachalermkul','Poommanat','Darachalermkul','Monman','097-921-1793','AI','Computer Vision (AI)','AI','Software Engineer','Software Engineer','Software Engineer','Computer Vision (AI)','Computer Vision (AI)','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2025-10-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS384','Chanton225@gmail.com',NULL,'Thanawut Kuwangkadilok','Thanawut','Kuwangkadilok','Ohm','091-664-4336','Project','RF Project','RF','Drive Test Engineer','Drive Test Engineer','DTE-L1','NBTC2502 : NBTC DRONE Thai Border Verification Pro','NBTC2502 : NBTC DRONE Thai Border Verification Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2025-10-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS385','Sasikarn.b@airconnect-e.com','Sasikarn4932@gmail.com','Sasikarn Boot-ngarm','Sasikarn','Boot-ngarm','Meiw','098-107-4932','Project','Enterprise Project','Enterprise','Safety Officer','Safety Officer','Safety Officer','WW2503 : WW Orange Line Project','WW2503 : WW Orange Line Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2025-11-11','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('AE205','Tugsadon@airconnect-e.com','bboatum2468@gmail.com','Tugsadon Bovontanaphaisai','Tugsadon','Bovontanaphaisai','Boat','096-872-2760','HR','Administrative','HQ','IT Support','IT Support','IT Support','Office Management','Office Management','AE','ACTIVE','FULL_TIME' ,'FULL_TIME','2025-12-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS386','jukkraphon.mee@airconnect-e.com','mr.jukkraphon@gmail.com','Jukkraphon Meechai','Jukkraphon','Meechai','Mac','095-649-8147','Project','RF Project','RF','Drive Test Analysis​ Engineer/TL','Drive Test Analysis​ Engineer/TL','Team Leader (RF)','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2025-12-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS388','lin.sal@airconnect-e.com','lin40171@gmail.com','Lin Saleepan','Lin','Saleepan','Nam','098-746-4117','Project','RF Project','RF','Drive Test Analysis Engineer','Drive Test Analysis Engineer','DTA-L1.5','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2025-12-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS389','sulimat.son@airconnect-e.com','sulimatsonain@gmail.com','Sulimat Sonain','Sulimat','Sonain','Pun','098-712-9102','Project','RF Project','RF','Drive Test Analysis Engineer','Drive Test Analysis Engineer','DTA-L1.5','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2025-12-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS390','phudit.chu@airconnect-e.com','phuchuad@gmail.com','Phudit Chuadnuch','Phudit','Chuadnuch','Tim','094-171-9925','Project','RF Project','RF','Drive Test Analysis Engineer','Drive Test Analysis Engineer','DTA-L1','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2025-12-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS392','pawaran.puy@airconnect-e.com','pawaranpuyati@gmail.com','Pawaran Puyati','Pawaran','Puyati','Yo','097-341-9903','Project','RF Project','RF','Drive Test Analysis Engineer','Drive Test Analysis Engineer','DTA-L1','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2025-12-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS393','chonlada.boo@airconnect-e.com','Chonlada.boon18@gmail.com','Chonlada Boonchottiphong','Chonlada','Boonchottiphong','Pang','096-167-6119','Project','RF Project','RF','Drive Test Analysis Engineer','Drive Test Analysis Engineer','DTA-L1','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2025-12-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS394','kunwadee.hoi@airconnect-e.com','kunwadeehoimala@gmail.com','Kunwadee Hoi-mala','Kunwadee','Hoi-mala','Bam','092-412-2182','Project','RF Project','RF','Drive Test Analysis Engineer','Drive Test Analysis Engineer','DTA-L1','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2025-12-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS395','wuttisit.see@airconnect-e.com','wuttisit41829@gmail.com','Wuttisit Seewasao','Wuttisit','Seewasao','Den','097-359-9945','Project','RF Project','RF','Drive Test Analysis Engineer','Drive Test Analysis Engineer','DTA-L1','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2025-12-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS396','phonlawat.kwa@airconnect-e.com','pollawat2344@gmail.com','Phonlawat Khwanthong','Phonlawat','Khwanthong','Toey','083-521-4741','Project','RF Project','RF','Drive Test Analysis Engineer','Drive Test Analysis Engineer','DTA-L1','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2025-12-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS397','Macdrums78@gmail.com',NULL,'Patsakorn Witenjit','Patsakorn','Witenjit','Mac','099-324-8347','Project','RF Project','RF','Drive Test Engineer','Drive Test Engineer','DTE-L1','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2025-12-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS398','chokzee.cc@gmail.com',NULL,'Chokchai Chinnarach','Chokchai','Chinnarach','M','084-921-1566','Project','RF Project','RF','Drive Test Engineer','Drive Test Engineer','DTE-L1','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2025-12-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS399+F81','Pathanin2538@gmail.com',NULL,'Pathanin Neampiboon','Pathanin','Neampiboon','Pop','063-224-1109','Project','RF Project','RF','Drive Test Engineer','Drive Test Engineer','DTE-L1','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2025-12-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS400','thanaphongtri@gmail.com',NULL,'Thanaphong Triphanitkun','Thanaphong','Triphanitkun','Aof','093-419-6924','Project','RF Project','RF','Drive Test Engineer','Drive Test Engineer','DTE-L1','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2025-12-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS407','Yuiyuiyui803@gmail.com',NULL,'Panukon Sonsinpong','Panukon','Sonsinpong','Ton','063-8528845','Project','RF Project','RF','Drive Test Engineer','Drive Test Engineer','DTE-L1','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-01-05','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS408','panuwat.phiw@gmail.com',NULL,'Panuwat Piwngam','Panuwat','Piwngam','Bird','061-390-3596','Project','RF Project','RF','Drive Test Analysis Engineer','Drive Test Analysis Engineer','DTA-L1','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-02-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE698','Chayaporn.s@airconnect-e.com','verbtobeebie@gmail.com','Chayaporn Suchaiya','Chayaporn','Suchaiya','Bee','093-141-2083','HR','Human Resources','HR','HR and Admin Manager','HR and Admin Manager','HR and Admin Manager','Office Management','Office Management','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2026-02-09','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE699','Pornpimon.chard@airconnect-e.com','Jeedprew52@gmail.com','Pornpimon Chardram','Pornpimon','Chardram','Jeed','096-758-6939','HR','Purchasing','HQ','Purchasing Specialist','Purchasing Specialist','Purchasing Specialist','Office Management','Office Management','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2026-03-09','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS410','kittiphong.psauto@gmail.com',NULL,'Kittiphong Wongsakul','Kittiphong','Wongsakul','Aek','065-082-6499','Project','RF Project','RF','Drive Test Engineer','Drive Test Engineer','DTE-L1','AIS2601 : AIS BMA Optimization Service Project','AIS2601 : AIS BMA Optimization Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-04-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS411','Wilairat.Khan@airconnect-e.com','wilairat.khantikool@gmail.com','Wilairat Khantikool','Wilairat','Khantikool','Megan','084-392-3788','BD','Business Development','BD','Sales Manager','Sales Manager','Sales Manager','Sales and Business Development','Sales and Business Development','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2026-04-20','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS412','Fangfyhunter@gmail.com',NULL,'Nattdanai Kittaponsakun','Nattdanai','Kittaponsakun','Hunter','064-146-8444','Project','RF Project','RF','Drive Test Engineer','Drive Test Engineer','DTE-L1','HWT2602 : RF NPM Basic Package EAS Project','HWT2602 : RF NPM Basic Package EAS Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-04-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS413','Niramol.huawei@gmail.com',NULL,'Niramol Kuldilok','Niramol','Kuldilok','Not','084-090-5898','Project','RF Project','RF','Drive Test Engineer','Drive Test Engineer','DTE-L1','HWT2602 : RF NPM Basic Package EAS Project','HWT2602 : RF NPM Basic Package EAS Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-04-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS414','Wuttinan.wongwut@gmail.com',NULL,'Wuttinan Wongwut','Wuttinan','Wongwut','Park','088-690-3679','Project','RF Project','RF','Rf Professional L2','Rf Professional L2','Rf Professional L2','HWT2602 : RF NPM Basic Package EAS Project','HWT2602 : RF NPM Basic Package EAS Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-04-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS415','Ponrawat1996@gmail.com',NULL,'Ponlawat Sangdanjak','Ponlawat','Sangdanjak','Tum','088-466-9756','Project','RF Project','RF','Rf Professional L2','Rf Professional L2','Rf Professional L2','HWT2602 : RF NPM Basic Package EAS Project','HWT2602 : RF NPM Basic Package EAS Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-04-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS416','Zom.jantira04@gmail.com',NULL,'Jantira Prathumwong','Jantira','Prathumwong','Zom','080-352-5145','Project','RF Project','RF','Rf Professional L2','Rf Professional L2','Rf Professional L2','HWT2602 : RF NPM Basic Package EAS Project','HWT2602 : RF NPM Basic Package EAS Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-04-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS417','Sutnatie@gmail.com',NULL,'Sutnatie Boonyalekha','Sutnatie','Boonyalekha','Pan','083-064-9065','Project','RF Project','RF','Rf Professional L3','Rf Professional L3','Rf Professional L3','HWT2602 : RF NPM Basic Package EAS Project','HWT2602 : RF NPM Basic Package EAS Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-04-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS418','Suwanna.pradittara@gmail.com',NULL,'Suwanna Pradittara','Suwanna','Pradittara','Mod','065-414-9595','Project','RF Project','RF','Rf Professional L3','Rf Professional L3','Rf Professional L3','HWT2602 : RF NPM Basic Package EAS Project','HWT2602 : RF NPM Basic Package EAS Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-04-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS419','Taned79@gmail.com',NULL,'Taned Yusabai','Taned','Yusabai','Tom','093-2959393','Project','RF Project','RF','Drive Test Engineer','Drive Test Engineer','DTE-L1','HWT2603 : RF NPM Professional Package EAS Project','HWT2603 : RF NPM Professional Package EAS Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-04-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS420','lonaraiwaew@gmail.com',NULL,'Tippawan Lonarai','Tippawan','Lonarai','Waew','065-515-4188','Project','RF Project','RF','Rf Professional L2','Rf Professional L2','Rf Professional L2','HWT2603 : RF NPM Professional Package EAS Project','HWT2603 : RF NPM Professional Package EAS Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-04-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS421','Sas_pnp@hotmail.com',NULL,'Sastra Thongmak','Sastra','Thongmak','Pokpong','081-632-5336','Project','RF Project','RF','Rf Professional L3','Rf Professional L3','Rf Professional L3','HWT2603 : RF NPM Professional Package EAS Project','HWT2603 : RF NPM Professional Package EAS Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-04-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACE700','Chotika.p@airconnect-e.com','Chotikabg88@gmail.com','Chotika Pimpisan','Chotika','Pimpisan','Nan','066-125-8868','Accounting','Accounting and Finance','Finance','Senior Accountant','Senior Accountant','Accounting and Finance','Office Management','Office Management','ACE','ACTIVE','FULL_TIME' ,'FULL_TIME','2026-05-05','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS425','thanakit1986boo@gmail.com',NULL,'Thanakit Bunrak','Thanakit','Bunrak','Tum','064-454-6517','Project','RF Project','RF','RF Professional L2','RF Professional L2','RF Professional L2','HWT2603 : RF NPM Professional Package EAS Project','HWT2603 : RF NPM Professional Package EAS Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-05-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS426','somchaiklinhomsophon@gmail.com',NULL,'Somchai Klinhomsophon','Somchai','Klinhomsophon','Ae','095-579-2627','Project','RF Project','RF','RF Professional L2','RF Professional L2','RF Professional L2','HWT2603 : RF NPM Professional Package EAS Project','HWT2603 : RF NPM Professional Package EAS Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-05-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS427','kriangkaisit@outlook.com',NULL,'Kriangkaisit Meekhun','Kriangkaisit','Meekhun','Man','064-995-3244','Project','RF Project','RF','RF Professional L2','RF Professional L2','RF Professional L2','HWT2603 : RF NPM Professional Package EAS Project','HWT2603 : RF NPM Professional Package EAS Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-05-01','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS428','sarany21012535@gmail.com',NULL,'Saranya Tonohueng','Saranya','Tonohueng',NULL,'061-294-6227','Project','TE Project','TE','Team Leader','Team Leader','Team Leader','AIS2602 : AIS NER Installation Service Project','AIS2602 : AIS NER Installation Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-03-04','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS429','Anuwat.promt@gmail.com',NULL,'Anuwat Ramring','Anuwat','Ramring',NULL,'084-888-0648','Project','TE Project','TE','Team Leader','Team Leader','Team Leader','AIS2602 : AIS NER Installation Service Project','AIS2602 : AIS NER Installation Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-03-04','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS430','sakrapree@gmail.com',NULL,'Sakraphi Champapho','Sakraphi','Champapho',NULL,'084-605-4320','Project','TE Project','TE','Team Leader','Team Leader','Team Leader','AIS2602 : AIS NER Installation Service Project','AIS2602 : AIS NER Installation Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-03-04','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,preferred_name,phone,department,section_name,project_team,position,job_title,job_level,project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)
VALUES ('ACECS431','papontanai@hotmail.com',NULL,'Papontanai Amnouysawatchai','Papontanai','Amnouysawatchai',NULL,'088-573-4611','Project','TE Project','TE','Project Coordinator and Store Officer','Project Coordinator and Store Officer','Project Coordinator and Store Officer','AIS2602 : AIS NER Installation Service Project','AIS2602 : AIS NER Installation Service Project','ACE','ACTIVE','FULL_TIME' ,'CONTRACT','2026-03-04','Employee2.xlsx')
ON CONFLICT (employee_code) DO UPDATE SET
  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,
  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,
  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,
  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,
  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,
  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,
  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();
UPDATE employees SET status='INACTIVE' WHERE source != 'Employee2.xlsx';
COMMIT;
SELECT source, COUNT(*) FROM employees GROUP BY source ORDER BY source;
SELECT status, COUNT(*) FROM employees GROUP BY status;