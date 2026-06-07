'use client'
/**
 * ACE HR — Employee Management Page  v2
 *
 * Upgrades:
 *   - Mock data (standalone, no backend required)
 *   - List / Grid view toggle
 *   - Status quick-filter tabs
 *   - Metric cards wired to real counts
 *   - Sidebar nav interactive
 *   - InfoGrid React-key fix
 *   - Edit mode in Profile drawer tab
 *   - AddEmployee modal with dept / position dropdowns
 */

import { useState, useEffect, useMemo } from 'react'
import {
  Activity, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Bell, BookOpen, BriefcaseBusiness, Building2, CalendarDays, CheckCircle2,
  ChevronDown, ClipboardCheck, Command, FileCheck2, FileText, FolderTree,
  GraduationCap, Heart, Home, IdCard, Layers, LogOut, Menu, RefreshCw, Search,
  Settings, ShieldCheck, Sparkles, Stethoscope, UserCheck, Users, UserPlus, Wallet, X,
} from 'lucide-react'
import { buildHrEmployeesFromExcel } from './employeeSeed.js'
import { apiFetch } from './src/apiFetch.js'
import { formatDateYmd } from './src/dateFormat.js'

const PROJECT_EMPLOYEE_STORAGE_KEY = 'ace_project_employees_v2'
const API_BASE = '/api'
const COMPANY  = 'AirConnect Engineering'

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

let MOCK_DEPARTMENTS = [
  { id: 1,  code: 'HR',          name: 'Human Resources' },
  { id: 2,  code: 'PROJECT',     name: 'Project Management' },
  { id: 3,  code: 'ACCOUNTING',  name: 'Accounting' },
  { id: 4,  code: 'ADMIN',       name: 'Administrative' },
  { id: 5,  code: 'EXECUTIVE',   name: 'Executive Office' },
  { id: 6,  code: 'AI',          name: 'Computer Vision (AI)' },
  { id: 7,  code: 'BD',          name: 'Business Development' },
]

let MOCK_POSITIONS = [
  // HR
  { id: 1,  name: 'HR and Admin Manager',          dept_id: 1, clock_type: 'DAILY', gps_required: false, photo_required: false },
  { id: 2,  name: 'HR Recruiting and General',      dept_id: 1, clock_type: 'DAILY', gps_required: false, photo_required: false },
  { id: 3,  name: 'HR Admin',                       dept_id: 1, clock_type: 'DAILY', gps_required: false, photo_required: false },
  // Project Management (cross-team)
  { id: 8,  name: 'Project Director',               dept_id: 2, clock_type: 'DAILY', gps_required: false, photo_required: false },
  { id: 9,  name: 'Senior Project Manager',         dept_id: 2, clock_type: 'DAILY', gps_required: false, photo_required: false },
  { id: 14, name: 'Project Manager',                dept_id: 2, clock_type: 'DAILY', gps_required: false, photo_required: false },
  // Project - RF
  { id: 10, name: 'Drive Test Engineer',            dept_id: 2, clock_type: 'PER_SITE', gps_required: true,  photo_required: true  },
  { id: 11, name: 'Drive Test Analysis Engineer',   dept_id: 2, clock_type: 'PER_SITE', gps_required: true,  photo_required: true  },
  { id: 12, name: 'OSS Engineer',                   dept_id: 2, clock_type: 'PER_SITE', gps_required: true,  photo_required: true  },
  { id: 13, name: 'Report Preparation Engineer',    dept_id: 2, clock_type: 'DAILY',    gps_required: false, photo_required: false },
  { id: 15, name: 'OMC Engineer',                   dept_id: 2, clock_type: 'PER_SITE', gps_required: true,  photo_required: true  },
  // Project - TE
  { id: 20, name: 'Site Supervisor',                dept_id: 2, clock_type: 'PER_SITE', gps_required: true,  photo_required: true  },
  { id: 21, name: 'Senior Site Supervisor',         dept_id: 2, clock_type: 'PER_SITE', gps_required: true,  photo_required: true  },
  { id: 22, name: 'Site Engineer',                  dept_id: 2, clock_type: 'PER_SITE', gps_required: true,  photo_required: true  },
  { id: 24, name: 'Cost Analysis',                  dept_id: 2, clock_type: 'DAILY',    gps_required: false, photo_required: false },
  // Project - Enterprise
  { id: 30, name: 'Site Solution',                  dept_id: 2, clock_type: 'PER_SITE', gps_required: true,  photo_required: true  },
  { id: 31, name: 'Inventory Management',           dept_id: 2, clock_type: 'DAILY',    gps_required: false, photo_required: false },
  { id: 32, name: 'Safety Officer',                 dept_id: 2, clock_type: 'PER_SITE', gps_required: true,  photo_required: true  },
  // Project - Solar Energy
  { id: 35, name: 'Solar Energy Engineer',          dept_id: 2, clock_type: 'PER_SITE', gps_required: true,  photo_required: true  },
  { id: 36, name: 'Solar Site Supervisor',          dept_id: 2, clock_type: 'PER_SITE', gps_required: true,  photo_required: true  },
  // Accounting
  { id: 40, name: 'Accounting and Finance Manager', dept_id: 3, clock_type: 'DAILY', gps_required: false, photo_required: false },
  { id: 41, name: 'Accounting Officer',             dept_id: 3, clock_type: 'DAILY', gps_required: false, photo_required: false },
  { id: 42, name: 'Finance Officer',                dept_id: 3, clock_type: 'DAILY', gps_required: false, photo_required: false },
  // Admin / HQ
  { id: 50, name: 'General Admin Manager',          dept_id: 4, clock_type: 'DAILY', gps_required: false, photo_required: false },
  { id: 51, name: 'IT Support',                     dept_id: 4, clock_type: 'DAILY', gps_required: false, photo_required: false },
  { id: 52, name: 'Messenger',                      dept_id: 4, clock_type: 'DAILY', gps_required: false, photo_required: false },
  { id: 53, name: 'Maid',                           dept_id: 4, clock_type: 'DAILY', gps_required: false, photo_required: false },
  { id: 54, name: 'Secretary',                      dept_id: 4, clock_type: 'DAILY', gps_required: false, photo_required: false },
  { id: 55, name: 'Purchasing Officer',             dept_id: 4, clock_type: 'DAILY', gps_required: false, photo_required: false },
  // Executive
  { id: 60, name: 'Managing Director',              dept_id: 5, clock_type: 'DAILY', gps_required: false, photo_required: false },
  { id: 61, name: 'Sales and Business Development Director', dept_id: 5, clock_type: 'DAILY', gps_required: false, photo_required: false },
  { id: 62, name: 'Senior IT Sales Project Engineer',        dept_id: 5, clock_type: 'DAILY', gps_required: false, photo_required: false },
  { id: 63, name: 'EHS / QMS / Cyber Security',             dept_id: 5, clock_type: 'DAILY', gps_required: false, photo_required: false },
  // AI
  { id: 70, name: 'Senior Software Engineer',       dept_id: 6, clock_type: 'DAILY', gps_required: false, photo_required: false },
  { id: 71, name: 'Software Engineer',              dept_id: 6, clock_type: 'DAILY', gps_required: false, photo_required: false },
]

const DEPT_SECTIONS = {
  PROJECT: [
    { code: 'PM',          name: 'Project Management',  team: 'NPM'        },
    { code: 'RF',          name: 'RF Project',          team: 'RF'         },
    { code: 'TE',          name: 'TE Project',          team: 'TE'         },
    { code: 'Enterprise',  name: 'Enterprise Project',  team: 'Enterprise' },
    { code: 'Solar',       name: 'Solar Energy',        team: 'Solar'      },
  ],
  HR:         [{ code: 'HR',      name: 'Human Resources',       team: 'HR'      }],
  ACCOUNTING: [{ code: 'Finance', name: 'Accounting and Finance', team: 'Finance' }],
  ADMIN:      [{ code: 'HQ',      name: 'Head Office',            team: 'HQ'      }],
  EXECUTIVE:  [{ code: 'EXEC',    name: 'Executive Office',       team: 'HQ'      }],
  AI:         [{ code: 'AI',      name: 'Computer Vision (AI)',   team: 'AI'      }],
  BD:         [{ code: 'BD',      name: 'Business Development',   team: 'BD'      }],
}

// system_role: maps to auth_users.role for Leave workflow (PM / DC / HR / BOSS / EMPLOYEE)
const ROLE_BY_SECTION = {
  PM: [
    { id: 8,  code: 'PD',  name: 'Project Director',       clock_type: 'DAILY', gps: false, photo: false, system_role: 'DC'       },
    { id: 9,  code: 'SPM', name: 'Senior Project Manager', clock_type: 'DAILY', gps: false, photo: false, system_role: 'PM'       },
    { id: 14, code: 'PM',  name: 'Project Manager',        clock_type: 'DAILY', gps: false, photo: false, system_role: 'PM'       },
  ],
  RF: [
    { id: 10, code: 'DTE', name: 'Drive Test Engineer',          clock_type: 'PER_SITE', gps: true,  photo: true,  system_role: 'EMPLOYEE' },
    { id: 11, code: 'DTA', name: 'Drive Test Analysis Engineer', clock_type: 'DAILY',    gps: false, photo: true,  system_role: 'EMPLOYEE' },
    { id: 12, code: 'OSS', name: 'OSS Engineer',                 clock_type: 'PER_SITE', gps: true,  photo: true,  system_role: 'EMPLOYEE' },
    { id: 13, code: 'RPE', name: 'Report Preparation Engineer',  clock_type: 'DAILY',    gps: false, photo: false, system_role: 'EMPLOYEE' },
    { id: 15, code: 'OMC', name: 'OMC Engineer',                 clock_type: 'PER_SITE', gps: true,  photo: true,  system_role: 'EMPLOYEE' },
    { id: 16, code: 'TL',  name: 'Team Leader',                  clock_type: 'DAILY',    gps: false, photo: false, system_role: 'EMPLOYEE' },
  ],
  TE: [
    { id: 20, code: 'SS',  name: 'Site Supervisor',        clock_type: 'PER_SITE', gps: true,  photo: true,  system_role: 'EMPLOYEE' },
    { id: 21, code: 'SSR', name: 'Senior Site Supervisor', clock_type: 'PER_SITE', gps: true,  photo: true,  system_role: 'EMPLOYEE' },
    { id: 22, code: 'SE',  name: 'Site Engineer',          clock_type: 'PER_SITE', gps: true,  photo: true,  system_role: 'EMPLOYEE' },
    { id: 24, code: 'CA',  name: 'Cost Analysis',          clock_type: 'DAILY',    gps: false, photo: false, system_role: 'EMPLOYEE' },
  ],
  Enterprise: [
    { id: 30, code: 'SOL',  name: 'Site Solution',        clock_type: 'PER_SITE', gps: true,  photo: true,  system_role: 'EMPLOYEE' },
    { id: 31, code: 'INV',  name: 'Inventory Management', clock_type: 'DAILY',    gps: false, photo: false, system_role: 'EMPLOYEE' },
    { id: 32, code: 'SAFE', name: 'Safety Officer',       clock_type: 'PER_SITE', gps: true,  photo: true,  system_role: 'EMPLOYEE' },
  ],
  Solar: [
    { id: 35, code: 'SOE', name: 'Solar Energy Engineer', clock_type: 'PER_SITE', gps: true,  photo: true,  system_role: 'EMPLOYEE' },
    { id: 36, code: 'SOS', name: 'Solar Site Supervisor', clock_type: 'PER_SITE', gps: true,  photo: true,  system_role: 'EMPLOYEE' },
  ],
  HR: [
    { id: 1,  code: 'HAM',  name: 'HR and Admin Manager',    clock_type: 'DAILY', gps: false, photo: false, system_role: 'HR'       },
    { id: 2,  code: 'HRG',  name: 'HR Recruiting and General',clock_type: 'DAILY', gps: false, photo: false, system_role: 'HR'      },
    { id: 3,  code: 'HRA',  name: 'HR Admin',                clock_type: 'DAILY', gps: false, photo: false, system_role: 'HR'       },
  ],
  Finance: [
    { id: 40, code: 'AFM', name: 'Accounting and Finance Manager', clock_type: 'DAILY', gps: false, photo: false, system_role: 'EMPLOYEE' },
    { id: 41, code: 'ACO', name: 'Accounting Officer',             clock_type: 'DAILY', gps: false, photo: false, system_role: 'EMPLOYEE' },
    { id: 42, code: 'FIN', name: 'Finance Officer',                clock_type: 'DAILY', gps: false, photo: false, system_role: 'EMPLOYEE' },
  ],
  HQ: [
    { id: 50, code: 'GAM', name: 'General Admin Manager', clock_type: 'DAILY', gps: false, photo: false, system_role: 'EMPLOYEE' },
    { id: 51, code: 'ITS', name: 'IT Support',            clock_type: 'DAILY', gps: false, photo: false, system_role: 'EMPLOYEE' },
    { id: 52, code: 'MSG', name: 'Messenger',             clock_type: 'DAILY', gps: false, photo: false, system_role: 'EMPLOYEE' },
    { id: 53, code: 'MID', name: 'Maid',                  clock_type: 'DAILY', gps: false, photo: false, system_role: 'EMPLOYEE' },
    { id: 54, code: 'SEC', name: 'Secretary',             clock_type: 'DAILY', gps: false, photo: false, system_role: 'EMPLOYEE' },
    { id: 55, code: 'PUR', name: 'Purchasing Officer',    clock_type: 'DAILY', gps: false, photo: false, system_role: 'EMPLOYEE' },
  ],
  EXEC: [
    { id: 60, code: 'MD',   name: 'Managing Director',                      clock_type: 'DAILY', gps: false, photo: false, system_role: 'BOSS'     },
    { id: 61, code: 'SBD',  name: 'Sales and Business Development Director',clock_type: 'DAILY', gps: false, photo: false, system_role: 'BOSS'     },
    { id: 62, code: 'ITSE', name: 'Senior IT Sales Project Engineer',        clock_type: 'DAILY', gps: false, photo: false, system_role: 'EMPLOYEE' },
    { id: 63, code: 'EHS',  name: 'EHS / QMS / Cyber Security',             clock_type: 'DAILY', gps: false, photo: false, system_role: 'EMPLOYEE' },
  ],
  AI: [
    { id: 70, code: 'SSE', name: 'Senior Software Engineer', clock_type: 'DAILY', gps: false, photo: false, system_role: 'EMPLOYEE' },
    { id: 71, code: 'SWE', name: 'Software Engineer',        clock_type: 'DAILY', gps: false, photo: false, system_role: 'EMPLOYEE' },
  ],
}

const JOB_LEVELS = ['L1', 'L1.5', 'L2', 'L2.5', 'L3']

let MOCK_EMPLOYEES = [
  {
    id: 1, employee_code: 'ACE-001',
    full_name: 'Peerapol Piamsri', first_name: 'Peerapol', last_name: 'Piamsri',
    email: 'peerapol.p@airconnect-e.com', phone: '+66-81-234-5678',
    status: 'ACTIVE', hire_date: '2021-03-17',
    position: MOCK_POSITIONS[2], department: MOCK_DEPARTMENTS[1],
    current_contract: { contract_type: 'FULL_TIME' },
    work_location_name: 'AIS BKK Zone', work_latitude: 13.7433, work_longitude: 100.5588, allowed_radius_meters: 500,
  },
  {
    id: 2, employee_code: 'ACE-002',
    full_name: 'Malee Srisuk', first_name: 'Malee', last_name: 'Srisuk',
    email: 'malee.s@airconnect-e.com', phone: '+66-89-876-5432',
    status: 'ACTIVE', hire_date: '2020-06-01',
    position: MOCK_POSITIONS[0], department: MOCK_DEPARTMENTS[0],
    current_contract: { contract_type: 'FULL_TIME' },
    work_location_name: 'Head Office', work_latitude: 13.7563, work_longitude: 100.5018, allowed_radius_meters: 200,
  },
  {
    id: 3, employee_code: 'ACE-003',
    full_name: 'Wanchai Kamnan', first_name: 'Wanchai', last_name: 'Kamnan',
    email: 'wanchai.k@airconnect-e.com', phone: '+66-86-111-2222',
    status: 'ACTIVE', hire_date: '2022-01-10',
    position: MOCK_POSITIONS[3], department: MOCK_DEPARTMENTS[1],
    current_contract: { contract_type: 'FULL_TIME' },
    work_location_name: 'True NNT Zone', work_latitude: 13.8591, work_longitude: 100.5134, allowed_radius_meters: 500,
  },
  {
    id: 4, employee_code: 'ACE-004',
    full_name: 'Napas Duangjai', first_name: 'Napas', last_name: 'Duangjai',
    email: 'napas.d@airconnect-e.com', phone: '+66-92-333-4444',
    status: 'PROBATION', hire_date: '2026-02-15',
    position: MOCK_POSITIONS[1], department: MOCK_DEPARTMENTS[0],
    current_contract: { contract_type: 'PROBATION' },
    work_location_name: 'Head Office', work_latitude: 13.7563, work_longitude: 100.5018, allowed_radius_meters: 200,
  },
  {
    id: 5, employee_code: 'ACE-005',
    full_name: 'Prayuth Thongdi', first_name: 'Prayuth', last_name: 'Thongdi',
    email: 'prayuth.t@airconnect-e.com', phone: '+66-93-555-6666',
    status: 'PROBATION', hire_date: '2026-03-01',
    position: MOCK_POSITIONS[2], department: MOCK_DEPARTMENTS[1],
    current_contract: { contract_type: 'PROBATION' },
    work_location_name: 'NT RYG Zone', work_latitude: 14.0000, work_longitude: 100.6000, allowed_radius_meters: 400,
  },
  {
    id: 6, employee_code: 'VD-001',
    full_name: 'Ake Subcontract', first_name: 'Ake', last_name: 'Subcontract',
    email: 'ake.sub@vendor-co.com', phone: '+66-94-777-8888',
    status: 'ACTIVE', hire_date: '2025-01-01',
    position: MOCK_POSITIONS[2], department: MOCK_DEPARTMENTS[1],
    current_contract: { contract_type: 'SUBCONTRACT' },
    work_location_name: 'AIS BKK Zone', work_latitude: 13.7433, work_longitude: 100.5588, allowed_radius_meters: 500,
  },
  {
    id: 7, employee_code: 'ACE-006',
    full_name: 'Siriporn Klinkaew', first_name: 'Siriporn', last_name: 'Klinkaew',
    email: 'siriporn.k@airconnect-e.com', phone: '+66-95-999-0000',
    status: 'ON_LEAVE', hire_date: '2019-11-20',
    position: MOCK_POSITIONS[5], department: MOCK_DEPARTMENTS[2],
    current_contract: { contract_type: 'FULL_TIME' },
    work_location_name: 'Head Office', work_latitude: 13.7563, work_longitude: 100.5018, allowed_radius_meters: 200,
  },
  {
    id: 8, employee_code: 'ACE-007',
    full_name: 'Teerasak Moonthong', first_name: 'Teerasak', last_name: 'Moonthong',
    email: 'teerasak.m@airconnect-e.com', phone: '+66-81-000-1111',
    status: 'TERMINATED', hire_date: '2020-05-01',
    position: MOCK_POSITIONS[2], department: MOCK_DEPARTMENTS[1],
    current_contract: { contract_type: 'FULL_TIME' },
    work_location_name: '—', work_latitude: null, work_longitude: null, allowed_radius_meters: null,
  },
  {
    id: 9, employee_code: 'ACE-008',
    full_name: 'Kannika Phanit', first_name: 'Kannika', last_name: 'Phanit',
    email: 'kannika.p@airconnect-e.com', phone: '+66-82-222-3333',
    status: 'ACTIVE', hire_date: '2023-07-01',
    position: MOCK_POSITIONS[4], department: MOCK_DEPARTMENTS[1],
    current_contract: { contract_type: 'FULL_TIME' },
    work_location_name: 'Head Office', work_latitude: 13.7563, work_longitude: 100.5018, allowed_radius_meters: 200,
  },
  {
    id: 10, employee_code: 'ACE-009',
    full_name: 'Arthit Wongsawat', first_name: 'Arthit', last_name: 'Wongsawat',
    email: 'arthit.w@airconnect-e.com', phone: '+66-83-444-5555',
    status: 'ACTIVE', hire_date: '2018-01-15',
    position: MOCK_POSITIONS[7], department: MOCK_DEPARTMENTS[4],
    current_contract: { contract_type: 'FULL_TIME' },
    work_location_name: 'Head Office', work_latitude: 13.7563, work_longitude: 100.5018, allowed_radius_meters: 200,
  },
]

MOCK_EMPLOYEES = [
  ...buildHrEmployeesFromExcel({
    departments: MOCK_DEPARTMENTS,
    positions: MOCK_POSITIONS,
    existingEmployees: [],
  }),
]

const DEMO_DETAILS = {
  1: {
    employee: MOCK_EMPLOYEES[0],
    profile: {
      date_of_birth: '1992-05-14', gender: 'Male', blood_type: 'O',
      nationality: 'Thai', province: 'Bangkok',
      sso_no: '1100-700-123456',
      education_level: "Bachelor's", education_field: 'Electrical Engineering',
      education_institute: 'King Mongkut\'s University of Technology Thonburi',
      bank_name: 'Kasikorn Bank', bank_account_no: '123-4-56789-0', bank_account_name: 'Peerapol Piamsri',
    },
    emergency_contacts: [
      { id: 1, name: 'Suda Jaidee', relationship: 'Wife', phone: '+66-81-999-0000', is_primary: true },
    ],
    contracts: [
      { id: 1, contract_type: 'FULL_TIME', start_date: '2021-03-17', end_date: null, salary_band: 'B2', vendor_name: null, notes: 'Permanent employee', is_current: true },
      { id: 2, contract_type: 'PROBATION', start_date: '2020-12-17', end_date: '2021-03-16', salary_band: 'B1', vendor_name: null, notes: 'Probation period', is_current: false },
    ],
    documents: [
      { id: 1, doc_type: 'ID_CARD',        file_name: 'id_card_somchai.pdf',     file_url: '#', created_at: '2021-03-17' },
      { id: 2, doc_type: 'DIPLOMA',        file_name: 'diploma_kmutt.pdf',       file_url: '#', created_at: '2021-03-17' },
      { id: 3, doc_type: 'CONTRACT_SIGNED',file_name: 'contract_2021.pdf',       file_url: '#', created_at: '2021-03-17' },
      { id: 4, doc_type: 'BANK_BOOK',      file_name: 'bank_book_kbank.pdf',     file_url: '#', created_at: '2021-03-17' },
    ],
    status_log: [
      { id: 1, from_status: 'PROBATION', to_status: 'ACTIVE',    effective_date: '2021-03-17', reason: 'Passed probation review' },
      { id: 2, from_status: null,        to_status: 'PROBATION',  effective_date: '2020-12-17', reason: 'New hire' },
    ],
  },
}

const MOCK_DETAILS = {}

// Generate simple details for employees that don't have full mock data
function getEmployeeDetail(emp) {
  if (MOCK_DETAILS[emp.id]) return MOCK_DETAILS[emp.id]
  return {
    employee: emp,
    profile: {
      date_of_birth: '—', gender: '—', blood_type: '—',
      nationality: 'Thai', province: 'Bangkok', sso_no: '—',
      education_level: "Bachelor's", education_field: '—', education_institute: '—',
      bank_name: '—', bank_account_no: '—', bank_account_name: '—',
    },
    emergency_contacts: [],
    contracts: [
      { id: 1, contract_type: emp.current_contract?.contract_type || 'FULL_TIME', start_date: emp.hire_date, end_date: null, salary_band: 'B1', vendor_name: null, notes: '—', is_current: true },
    ],
    documents: [],
    status_log: [
      { id: 1, from_status: null, to_status: emp.status, effective_date: emp.hire_date, reason: 'Initial hire' },
    ],
  }
}

function fetchEmployeeList({ search, deptFilter, statusFilter, page, perPage }) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (deptFilter) params.set('department', deptFilter)
  if (statusFilter) params.set('status', statusFilter)

  return apiFetch(`${API_BASE}/employees?${params.toString()}`)
    .then(r => r.ok ? r.json() : Promise.reject(new Error('Employee API unavailable')))
    .then(payload => {
      const list = (payload.data || []).map(employeeFromApi)
      const total = list.length
      const total_pages = Math.max(1, Math.ceil(total / perPage))
      const data = list.slice((page - 1) * perPage, page * perPage)
      return { data, meta: { page, per_page: perPage, total, total_pages } }
    })
}

function fetchAllEmployeesForSummary() {
  return apiFetch(`${API_BASE}/employees`)
    .then(r => r.ok ? r.json() : Promise.reject(new Error('Employee summary unavailable')))
    .then(payload => (payload.data || []).map(employeeFromApi))
}

function employeeFromApi(row) {
  const rawDept = row.department_name || row.department || row.department_code || row.dept_name || (row.project_code ? 'Project Management' : '')
  const dept = MOCK_DEPARTMENTS.find(d =>
    d.code === String(rawDept).toUpperCase() ||
    d.name.toLowerCase() === String(rawDept).toLowerCase() ||
    d.name.toLowerCase().includes(String(rawDept).toLowerCase())
  ) || MOCK_DEPARTMENTS.find(d => d.code === 'PROJECT') || MOCK_DEPARTMENTS[1]
  const rawPosition = row.position_name || row.job_title || row.position || row.project_role || row.project_team
  const pos = MOCK_POSITIONS.find(p => p.name === rawPosition) || MOCK_POSITIONS.find(p => p.name === 'Other') || MOCK_POSITIONS[2]
  const parts = String(row.full_name || '').split(/\s+/)
  return {
    id: row.id,
    employee_code: row.employee_code,
    full_name: row.full_name,
    first_name: row.first_name || parts[0] || row.full_name,
    last_name: row.last_name || parts.slice(1).join(' ') || '-',
    email: row.email || '',
    phone: row.phone || row.work_phone || '-',
    status: row.status || 'ACTIVE',
    hire_date: row.hire_date || '2026-05-01',
    position: pos,
    department: dept,
    project_code: row.project_code,
    project_name: row.project_name,
    excel_position: row.project_role,
    current_contract: { contract_type: row.contract_type || row.employment_type || 'FULL_TIME' },
    work_location_name: row.work_location || row.project_code || '-',
    work_latitude: null,
    work_longitude: null,
    allowed_radius_meters: null,
    photo_url: row.photo_url || null,
    hr_profile: row,
  }
}

function fetchEmployeeDetail(id) {
  return Promise.all([
    apiFetch(`${API_BASE}/employees/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Employee not found'))),
    apiFetch(`${API_BASE}/hr/employees/${id}/history`)
      .then(r => r.ok ? r.json() : { data: [] })
      .catch(() => ({ data: [] })),
  ])
    .then(([row, auditPayload]) => {
      const employee = employeeFromApi(row)
      return {
        employee,
        profile: {
          date_of_birth: row.date_of_birth || '—',
          gender: row.gender || '—',
          blood_type: '—',
          nationality: row.nationality || 'Thai',
          province: row.address || '—',
          sso_no: '—',
          id_card_no: row.id_card_no || '—',
          address: row.address || '—',
          personal_email: row.personal_email || '—',
          preferred_name: row.preferred_name || '—',
          work_phone: row.work_phone || '—',
          manager_name: row.manager_name || '—',
          manager_code: row.manager_code || '—',
          cost_center: row.cost_center || '—',
          work_location: row.work_location || '—',
          section_name: row.section_name || '—',
          job_title: row.job_title || row.position || '—',
          job_level: row.job_level || '—',
          employment_type: row.employment_type || '—',
          contract_type: row.contract_type || '—',
          probation_end_date: row.probation_end_date || '—',
          termination_date: row.termination_date || '—',
          source: row.source || '—',
          created_at: row.created_at || '—',
          updated_at: row.updated_at || '—',
          education_level: '—',
          education_field: '—',
          education_institute: '—',
          bank_name: row.bank_name || '—',
          bank_account_no: row.bank_account_no || '—',
          bank_account_name: row.bank_account_name || '—',
        },
        emergency_contacts: row.emergency_contact_name ? [
          {
            id: 1,
            name: row.emergency_contact_name,
            relationship: row.emergency_contact_relation || '—',
            phone: row.emergency_contact_phone || '—',
            is_primary: true,
          },
        ] : [],
        contracts: [
          {
            id: 1,
            contract_type: row.contract_type || row.employment_type || 'FULL_TIME',
            start_date: row.hire_date,
            end_date: row.termination_date,
            salary_band: row.job_level || '—',
            employment_type: row.employment_type || '—',
            probation_end_date: row.probation_end_date || '—',
            work_location: row.work_location || '—',
            manager_name: row.manager_name || '—',
            cost_center: row.cost_center || '—',
            vendor_name: null,
            notes: row.notes || '—',
            is_current: row.status !== 'TERMINATED',
          },
        ],
        documents: [],
        status_log: [
          {
            id: 1,
            from_status: null,
            to_status: row.status,
            effective_date: row.hire_date || row.created_at?.slice(0, 10) || '—',
            reason: 'HR database record',
          },
          {
            id: 2,
            from_status: null,
            to_status: 'PROFILE_CREATED',
            effective_date: row.created_at?.slice(0, 10) || '—',
            reason: `Created from ${row.source || 'HR database'}`,
          },
          {
            id: 3,
            from_status: null,
            to_status: 'LAST_UPDATED',
            effective_date: row.updated_at?.slice(0, 10) || '—',
            reason: 'Latest employee profile update',
          },
        ],
        audit_logs: auditPayload.data || [],
      }
    })
}

function fetchDataQualitySummary() {
  return apiFetch(`${API_BASE}/hr/data-quality/summary`)
    .then(r => r.ok ? r.json() : Promise.reject(new Error('Data quality summary unavailable')))
}

function fetchDataQualityIssues(filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value)
  })
  return apiFetch(`${API_BASE}/hr/data-quality/issues?${params.toString()}`)
    .then(r => r.ok ? r.json() : Promise.reject(new Error('Data quality issues unavailable')))
}

function recalculateDataQuality() {
  return apiFetch(`${API_BASE}/hr/data-quality/recalculate`, { method: 'POST' })
    .then(r => r.ok ? r.json() : Promise.reject(new Error('Recalculate failed')))
}

function fetchAuditLogs(filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value)
  })
  return apiFetch(`${API_BASE}/hr/audit-logs?${params.toString()}`)
    .then(r => r.ok ? r.json() : Promise.reject(new Error('Audit logs unavailable')))
}

function fetchSystemAccess(employeeId) {
  return apiFetch(`${API_BASE}/employees/${employeeId}/system-access`)
    .then(r => r.ok ? r.json() : Promise.reject(new Error('System access unavailable')))
}

function updateSystemAccess(employeeId, body) {
  return apiFetch(`${API_BASE}/employees/${employeeId}/system-access`, { method: 'PATCH', body: JSON.stringify(body) })
    .then(r => r.ok ? r.json() : r.json().then(data => Promise.reject(new Error(data.detail || 'Update failed'))))
}

function createLogin(employeeId) {
  return apiFetch(`${API_BASE}/employees/${employeeId}/create-login`, { method: 'POST' })
    .then(r => r.ok ? r.json() : r.json().then(data => Promise.reject(new Error(data.detail || 'Create login failed'))))
}

function resetEmployeePassword(employeeId) {
  return apiFetch(`${API_BASE}/employees/${employeeId}/reset-password`, { method: 'POST', body: JSON.stringify({ must_change_password: true }) })
    .then(r => r.ok ? r.json() : r.json().then(data => Promise.reject(new Error(data.detail || 'Reset password failed'))))
}

function fetchProjectReadiness(employeeId) {
  return apiFetch(`${API_BASE}/employees/${employeeId}/project-readiness`)
    .then(r => r.ok ? r.json() : Promise.reject(new Error('Project readiness unavailable')))
}

function fetchReadinessSummary() {
  return apiFetch(`${API_BASE}/hr/project-readiness/summary`)
    .then(r => r.ok ? r.json() : Promise.reject(new Error('Project readiness summary unavailable')))
}

function fetchHrAnalytics() {
  return apiFetch(`${API_BASE}/hr/analytics/summary`)
    .then(r => r.ok ? r.json() : Promise.reject(new Error('HR analytics unavailable')))
}

function fetchPermissions() {
  return apiFetch('/api/auth/permissions')
    .then(r => r.ok ? r.json() : Promise.reject(new Error('Permissions unavailable')))
}

function syncProjectEmployeeToStorage(employee) {
  if (typeof window === 'undefined' || employee.department?.code !== 'PROJECT') return
  const saved = JSON.parse(window.localStorage.getItem(PROJECT_EMPLOYEE_STORAGE_KEY) || '[]')
  const nextEmployee = {
    id: employee.id,
    employee_code: employee.employee_code,
    full_name: employee.full_name,
    email: employee.email,
    phone: employee.phone,
    project_team: employee.position?.name || 'Project',
    department: employee.department?.name || 'Project',
    position_name: employee.position?.name || 'Project',
    status: employee.status,
    hire_date: employee.hire_date,
  }
  const next = [nextEmployee, ...saved.filter(e => e.employee_code !== employee.employee_code)]
  window.localStorage.setItem(PROJECT_EMPLOYEE_STORAGE_KEY, JSON.stringify(next))
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM HOOKS
// ─────────────────────────────────────────────────────────────────────────────

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const h = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(h)
  }, [value, delay])
  return debouncedValue
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  ACTIVE:     { label: 'Active',     bg: '#dcfce7', color: '#15803d' },
  PROBATION:  { label: 'Probation',  bg: '#fef3c7', color: '#92400e' },
  ON_LEAVE:   { label: 'On Leave',   bg: '#dbeafe', color: '#2447d8' },
  SUSPENDED:  { label: 'Suspended',  bg: '#ffe4e6', color: '#be123c' },
  TERMINATED: { label: 'Terminated', bg: '#f1f5f9', color: '#475569' },
  RESIGNED:   { label: 'Resigned',   bg: '#f1f5f9', color: '#475569' },
}

const CONTRACT_CONFIG = {
  FULL_TIME:   { label: 'Full Time',   color: '#0369a1' },
  PART_TIME:   { label: 'Part Time',   color: '#0369a1' },
  CONTRACT:    { label: 'Contract',    color: '#7c3aed' },
  PROBATION:   { label: 'Probation',   color: '#92400e' },
  SUBCONTRACT: { label: 'Subcontract', color: '#16a34a' },
}

const DOC_ICONS = {
  ID_CARD: '🪪', PASSPORT: '📕', DIPLOMA: '🎓', TRANSCRIPT: '📄',
  CONTRACT_SIGNED: '📝', BANK_BOOK: '🏦', MEDICAL_CERT: '🏥', OTHER: '📎',
  HOUSE_REGISTER: '🏠', CERTIFICATE: '🏆', EDUCATION_CERT: '🎓', TRAINING_CERT: '🏆',
}

const REQUIRED_EMPLOYEE_DOCS = [
  { type: 'EDUCATION_CERT', label: 'Education Certificate', aliases: ['EDUCATION_CERT', 'DIPLOMA', 'TRANSCRIPT'] },
  { type: 'ID_CARD', label: 'National ID Card', aliases: ['ID_CARD'] },
  { type: 'HOUSE_REGISTER', label: 'House Registration', aliases: ['HOUSE_REGISTER'] },
  { type: 'TRAINING_CERT', label: 'Training Certificate', aliases: ['TRAINING_CERT', 'CERTIFICATE'] },
]

const REQUIRED_DATA_FIELDS = [
  { key: 'email', label: 'Email', get: e => e.email },
  { key: 'phone', label: 'Phone', get: e => e.phone },
  { key: 'department', label: 'Department', get: e => hrValue(e, ['department', 'department_name', 'department_code']) || e.department?.name },
  { key: 'position', label: 'Position', get: e => hrValue(e, ['position_name', 'job_title', 'project_role', 'project_team']) || e.position?.name },
  { key: 'hire_date', label: 'Hire Date', get: e => e.hire_date || hrValue(e, ['hire_date', 'start_date']) },
  { key: 'contract', label: 'Contract', get: e => e.current_contract?.contract_type || hrValue(e, ['contract_type', 'employment_type']) },
]

const STATUS_TABS = [
  { key: '',           label: 'All'        },
  { key: 'ACTIVE',     label: 'Active'     },
  { key: 'PROBATION',  label: 'Probation'  },
  { key: 'ON_LEAVE',   label: 'On Leave'   },
  { key: 'TERMINATED', label: 'Terminated' },
]

const HR_NAV = [
  { id: 'employees',        label: 'Employees',         icon: Users },
  { id: 'analytics',        label: 'HR Analytics',      icon: Activity },
  { id: 'dataQuality',      label: 'Data Quality',      icon: ShieldCheck },
  { id: 'projectReadiness', label: 'Project Readiness', icon: ClipboardCheck },
  { id: 'auditLogs',        label: 'Audit Logs',        icon: FileText },
  { id: 'attendance',       label: 'Attendance',        icon: CalendarDays },
  { id: 'organization',     label: 'Organization',      icon: FolderTree },
  { id: 'leave',            label: 'Leave',             icon: Heart },
  { id: 'recruitment',      label: 'Recruitment',       icon: UserPlus },
  { id: 'performance',      label: 'Performance',       icon: ArrowUpRight },
  { id: 'learning',         label: 'Learning',          icon: GraduationCap },
  { id: 'contracts',        label: 'Contracts',         icon: FileCheck2 },
  { id: 'documents',        label: 'Documents',         icon: BookOpen },
  { id: 'payroll',          label: 'Payroll',           icon: Wallet },
  { id: 'benefits',         label: 'Benefits',          icon: Stethoscope },
  { id: 'assets',           label: 'Assets',            icon: Layers },
  { id: 'compliance',       label: 'Compliance',        icon: IdCard },
  { id: 'reports',          label: 'Reports',           icon: BriefcaseBusiness },
  { id: 'settings',         label: 'Settings',          icon: Settings },
]

const ACE_GRADIENT = 'linear-gradient(135deg, #2447d8 0%, #6d3f8f 48%, #c0392b 100%)'
const ACE_BLUE     = '#2447d8'
const ACE_RED      = '#c0392b'
const ADMIN_NAVY   = '#1f2937'

const HR_MODULES = {
  attendance: {
    title: 'Attendance',
    subtitle: 'Daily attendance, late arrival, missing clock records, and overtime readiness.',
    metrics: [
      ['Present Today', '—', 'Live from ClockApp', '#16a34a'],
      ['Late Arrival', '—', 'Requires attendance rules', ACE_RED],
      ['Missing Clock Out', '—', 'Operational follow-up', '#d97706'],
      ['Overtime Pending', '—', 'Approval queue', ACE_BLUE],
    ],
    panels: [
      ['Operational Checks', ['Missing clock in/out', 'Late arrivals by department', 'Overtime approvals', 'Attendance exception audit']],
      ['Standard Views', ['Daily attendance board', 'Monthly timesheet', 'Site attendance for project staff', 'Export for payroll']],
    ],
  },
  organization: {
    title: 'Organization',
    subtitle: 'Company structure, departments, sections, reporting lines, and workforce planning.',
    metrics: [
      ['Departments', '—', 'Company structure', ACE_BLUE],
      ['Sections', '—', 'Team breakdown', '#6d3f8f'],
      ['Managers', '—', 'Reporting owners', '#16a34a'],
      ['Vacant Roles', '—', 'Workforce plan', ACE_RED],
    ],
    panels: [
      ['Organization Data', ['Department hierarchy', 'Manager mapping', 'Cost center mapping', 'Position catalog']],
      ['Executive Views', ['Headcount by department', 'Span of control', 'Vacancy planning', 'Internal transfer map']],
    ],
  },
  leave: {
    title: 'Leave Management',
    subtitle: 'Leave balances, approval workflow, policy control, and team availability.',
    metrics: [
      ['Pending Approval', '—', 'Manager / HR queue', '#d97706'],
      ['On Leave Today', '—', 'Daily availability', ACE_BLUE],
      ['Low Balance', '—', 'Policy warning', ACE_RED],
      ['Approved This Month', '—', 'Monthly workload', '#16a34a'],
    ],
    panels: [
      ['Approval Workflow', ['Employee request', 'Manager approval', 'HR verification', 'Email notification']],
      ['Policy Controls', ['Annual leave', 'Sick leave', 'Business leave', 'Leave carry-forward']],
    ],
  },
  recruitment: {
    title: 'Recruitment',
    subtitle: 'Hiring pipeline, candidate tracking, onboarding status, and open requisitions.',
    metrics: [
      ['Open Positions', '—', 'Hiring demand', ACE_BLUE],
      ['Candidates', '—', 'Active pipeline', '#6d3f8f'],
      ['Interviewing', '—', 'This week', '#d97706'],
      ['New Hires', '—', 'Onboarding', '#16a34a'],
    ],
    panels: [
      ['Hiring Pipeline', ['Requisition', 'Screening', 'Interview', 'Offer', 'Onboarding']],
      ['HR Checks', ['Job description approval', 'Salary range approval', 'Document collection', 'Account creation']],
    ],
  },
  performance: {
    title: 'Performance',
    subtitle: 'KPI cycles, probation review, annual evaluation, and development planning.',
    metrics: [
      ['KPI Cycle', '—', 'Current period', ACE_BLUE],
      ['Pending Reviews', '—', 'Manager action', '#d97706'],
      ['Probation Reviews', '—', 'Due soon', ACE_RED],
      ['Completed', '—', 'Evaluation progress', '#16a34a'],
    ],
    panels: [
      ['Evaluation Views', ['KPI score by department', 'Probation confirmation', 'Manager comments', 'Calibration report']],
      ['Development Actions', ['Training needs', 'Performance improvement plan', 'Promotion readiness', 'Succession notes']],
    ],
  },
  learning: {
    title: 'Learning & Training',
    subtitle: 'Training records, certificates, required compliance courses, and skill matrix.',
    metrics: [
      ['Required Training', '—', 'Compliance courses', ACE_BLUE],
      ['Expired Certificates', '—', 'Renewal needed', ACE_RED],
      ['Completed', '—', 'This year', '#16a34a'],
      ['Skill Gaps', '—', 'Development plan', '#d97706'],
    ],
    panels: [
      ['Training Records', ['Course history', 'Certificate upload', 'Expiry tracking', 'Training cost']],
      ['Skill Matrix', ['Role competency', 'Project readiness', 'Mandatory safety training', 'Manager assessment']],
    ],
  },
  contracts: {
    title: 'Contracts',
    subtitle: 'Employment contracts, outsource terms, probation dates, and renewal tracking.',
    metrics: [
      ['Permanent', '—', 'Direct employees', '#16a34a'],
      ['Outsource', '—', 'Vendor workforce', '#d97706'],
      ['Expiring Soon', '—', 'Renewal needed', ACE_RED],
      ['Missing Contract', '—', 'Document gap', ACE_BLUE],
    ],
    panels: [
      ['Contract Controls', ['Employment type', 'Contract period', 'Probation date', 'Renewal history']],
      ['Audit Checks', ['Signed contract file', 'Vendor contract', 'Salary band control', 'Approver record']],
    ],
  },
  documents: {
    title: 'Documents',
    subtitle: 'Employee document compliance, missing files, expiry dates, and HR document vault.',
    metrics: [
      ['Required Types', REQUIRED_EMPLOYEE_DOCS.length, 'Standard checklist', ACE_BLUE],
      ['Missing Files', '—', 'Need upload', ACE_RED],
      ['Expired', '—', 'Renewal alert', '#d97706'],
      ['Verified', '—', 'HR reviewed', '#16a34a'],
    ],
    panels: [
      ['Required Documents', REQUIRED_EMPLOYEE_DOCS.map(d => d.label)],
      ['Document Governance', ['Upload approval', 'Version history', 'Access control', 'Retention policy']],
    ],
  },
  payroll: {
    title: 'Payroll',
    subtitle: 'Payroll readiness, bank account status, attendance sync, allowance, and deduction checks.',
    metrics: [
      ['Payroll Ready', '—', 'Complete records', '#16a34a'],
      ['Missing Bank', '—', 'Payment risk', ACE_RED],
      ['Timesheet Issues', '—', 'Attendance sync', '#d97706'],
      ['Adjustments', '—', 'Allowance / deduction', ACE_BLUE],
    ],
    panels: [
      ['Payroll Inputs', ['Bank account', 'Salary band', 'Attendance summary', 'OT / allowance / deduction']],
      ['Monthly Close', ['Lock timesheet', 'Payroll review', 'Finance export', 'Payslip distribution']],
    ],
  },
  benefits: {
    title: 'Benefits',
    subtitle: 'Welfare, insurance, social security, benefit enrollment, and eligibility tracking.',
    metrics: [
      ['SSO Registered', '—', 'Social security', ACE_BLUE],
      ['Insurance Active', '—', 'Coverage status', '#16a34a'],
      ['Pending Enrollment', '—', 'HR action', '#d97706'],
      ['Missing Data', '—', 'Profile gap', ACE_RED],
    ],
    panels: [
      ['Benefit Programs', ['Social security', 'Health insurance', 'Annual health check', 'Company welfare']],
      ['Employee Eligibility', ['Employment type', 'Start date', 'Probation status', 'Dependent information']],
    ],
  },
  assets: {
    title: 'Assets',
    subtitle: 'Company asset assignment, return status, device control, and offboarding clearance.',
    metrics: [
      ['Assigned Assets', '—', 'Active holders', ACE_BLUE],
      ['Pending Return', '—', 'Offboarding', ACE_RED],
      ['Overdue Check', '—', 'Audit needed', '#d97706'],
      ['Cleared', '—', 'Returned assets', '#16a34a'],
    ],
    panels: [
      ['Asset Types', ['Laptop / PC', 'Phone / SIM', 'Uniform / PPE', 'Vehicle / tools']],
      ['Controls', ['Issue date', 'Return date', 'Condition check', 'Employee clearance']],
    ],
  },
  compliance: {
    title: 'Compliance',
    subtitle: 'HR audit readiness, policy acknowledgements, mandatory documents, and legal controls.',
    metrics: [
      ['Policy Pending', '—', 'Acknowledgement', '#d97706'],
      ['Missing ID', '—', 'Legal document', ACE_RED],
      ['Audit Ready', '—', 'Complete profiles', '#16a34a'],
      ['Exceptions', '—', 'Need HR review', ACE_BLUE],
    ],
    panels: [
      ['Compliance Areas', ['Employee identity', 'Contract documentation', 'Training certificate', 'Data privacy consent']],
      ['Audit Views', ['Missing documents', 'Expired documents', 'Unauthorized changes', 'Access review']],
    ],
  },
  reports: {
    title: 'Reports',
    subtitle: 'Management reporting, workforce analytics, payroll export, and compliance reports.',
    metrics: [
      ['Headcount Report', '—', 'Executive summary', ACE_BLUE],
      ['Payroll Export', '—', 'Monthly close', '#16a34a'],
      ['Compliance Report', '—', 'Audit package', ACE_RED],
      ['Custom Reports', '—', 'HR analytics', '#6d3f8f'],
    ],
    panels: [
      ['Standard Reports', ['Headcount by department', 'New hire / resignation', 'Attendance monthly', 'Document compliance']],
      ['Executive Analytics', ['Workforce trend', 'Cost center headcount', 'Project workforce', 'Outsource contract mix']],
    ],
  },
}

function getHRModuleQueue(moduleId, employees) {
  const rows = employees || []
  const missingBank = rows.filter(e => !hrDisplayValue(hrValue(e, ['bank_name', 'bank_account_no']) || e.hr_profile?.bank_name, '')).length
  const missingEmergency = rows.filter(e => !hrDisplayValue(hrValue(e, ['emergency_contact_name', 'emergency_contact_phone']), '')).length
  const missingEmail = rows.filter(e => !hrDisplayValue(e.email, '')).length
  const projectCount = rows.filter(e => String(hrValue(e, ['department']) || e.department?.name || '').toLowerCase().includes('project')).length

  const queues = {
    attendance: {
      action: 'Review Attendance',
      title: 'Attendance Exception Queue',
      columns: ['Item', 'Owner', 'Priority', 'Status'],
      rows: [
        ['Missing clock-out records', 'HR Operations', 'High', 'Needs review'],
        ['Late arrival monitoring', 'HR Operations', 'Medium', 'Rules setup'],
        ['Project site attendance sync', 'Project Admin', 'High', `${projectCount} project staff`],
        ['Payroll attendance export', 'HR / Finance', 'Medium', 'Monthly close'],
      ],
    },
    organization: {
      action: 'Update Org Chart',
      title: 'Organization Control Queue',
      columns: ['Item', 'Owner', 'Coverage', 'Status'],
      rows: [
        ['Department hierarchy', 'HR Admin', `${departmentCount(rows)} departments`, 'Active'],
        ['Manager mapping', 'HR Business Partner', 'Manager code', 'Data review'],
        ['Position catalog', 'HR Admin', 'Roles / levels', 'Active'],
        ['Cost center alignment', 'Finance / HR', 'Payroll control', 'Needs review'],
      ],
    },
    leave: {
      action: 'New Leave Rule',
      title: 'Leave Approval Queue',
      columns: ['Workflow', 'Approver', 'SLA', 'Status'],
      rows: [
        ['Annual leave approval', 'Line Manager', '2 business days', 'Ready'],
        ['Sick leave document check', 'HR Admin', '1 business day', 'Needs document rule'],
        ['Project leave coverage', 'Project Manager', 'Before leave date', 'Ready'],
        ['Email approval link', 'System', 'Immediate', 'SMTP dependent'],
      ],
    },
    recruitment: {
      action: 'Add Requisition',
      title: 'Recruitment Pipeline',
      columns: ['Stage', 'Owner', 'KPI', 'Status'],
      rows: [
        ['Open requisition', 'Hiring Manager', 'Vacancy approval', 'Planning'],
        ['Candidate screening', 'Recruiter', 'Shortlist', 'Ready'],
        ['Interview scheduling', 'HR Admin', 'Calendar / email', 'Needs workflow'],
        ['Onboarding handoff', 'HR Operations', 'Create employee + login', 'Ready'],
      ],
    },
    performance: {
      action: 'Start Review',
      title: 'Performance Review Cycle',
      columns: ['Cycle', 'Owner', 'Scope', 'Status'],
      rows: [
        ['Probation review', 'Line Manager', 'Probation employees', 'Due tracking'],
        ['Monthly KPI', 'Manager / HR', 'KPIPage data', 'Connected'],
        ['Annual review', 'HR Business Partner', 'All employees', 'Planning'],
        ['Calibration', 'Management', 'Department comparison', 'Not started'],
      ],
    },
    learning: {
      action: 'Add Training',
      title: 'Learning & Certificate Queue',
      columns: ['Training Area', 'Owner', 'Requirement', 'Status'],
      rows: [
        ['Safety training', 'HR / EHS', 'Mandatory', 'Needs tracking'],
        ['Project technical skill', 'Project Manager', 'Role based', 'Ready'],
        ['Certificate expiry', 'HR Admin', 'Renewal alert', 'Needs dates'],
        ['Training document upload', 'Employee / HR', 'Training Certificate', 'Ready'],
      ],
    },
    contracts: {
      action: 'Add Contract',
      title: 'Contract Control Queue',
      columns: ['Contract Area', 'Owner', 'Risk', 'Status'],
      rows: [
        ['Permanent contract files', 'HR Admin', 'Medium', 'Document check'],
        ['Outsource term review', 'HR / Vendor', 'High', 'Renewal tracking'],
        ['Probation end confirmation', 'Line Manager', 'Medium', 'Needs alert'],
        ['Missing contract documents', 'HR Admin', 'High', 'Audit check'],
      ],
    },
    documents: {
      action: 'Upload Document',
      title: 'Document Compliance Queue',
      columns: ['Document', 'Owner', 'Requirement', 'Status'],
      rows: REQUIRED_EMPLOYEE_DOCS.map(doc => [doc.label, 'HR Admin', 'Required', 'Tracking']),
    },
    payroll: {
      action: 'Payroll Export',
      title: 'Payroll Readiness Queue',
      columns: ['Payroll Check', 'Owner', 'Risk', 'Status'],
      rows: [
        ['Missing bank information', 'HR / Finance', 'High', `${missingBank} employees`],
        ['Attendance close', 'HR Operations', 'High', 'Monthly'],
        ['Salary band review', 'HR / Management', 'Medium', 'Controlled'],
        ['Finance export', 'Finance', 'Medium', 'Pending connector'],
      ],
    },
    benefits: {
      action: 'Enroll Benefit',
      title: 'Benefit Enrollment Queue',
      columns: ['Benefit', 'Owner', 'Eligibility', 'Status'],
      rows: [
        ['Social security', 'HR Admin', 'Permanent / eligible staff', 'Data needed'],
        ['Health insurance', 'HR Admin', 'Policy based', 'Planning'],
        ['Annual health check', 'HR Operations', 'All eligible staff', 'Planning'],
        ['Welfare records', 'HR / Finance', 'Company policy', 'Planning'],
      ],
    },
    assets: {
      action: 'Assign Asset',
      title: 'Asset Control Queue',
      columns: ['Asset Area', 'Owner', 'Control', 'Status'],
      rows: [
        ['Laptop / PC assignment', 'IT / HR', 'Issue-return', 'Needs asset DB'],
        ['Phone / SIM card', 'Admin', 'Monthly audit', 'Planning'],
        ['Uniform / PPE', 'Admin / EHS', 'Project readiness', 'Planning'],
        ['Offboarding clearance', 'HR / IT / Admin', 'Return required', 'Needs workflow'],
      ],
    },
    compliance: {
      action: 'Review Audit',
      title: 'Compliance Exception Queue',
      columns: ['Audit Area', 'Owner', 'Exception', 'Status'],
      rows: [
        ['Missing emergency contact', 'HR Admin', `${missingEmergency} employees`, 'Needs follow-up'],
        ['Missing email', 'HR Admin', `${missingEmail} employees`, 'Needs follow-up'],
        ['Document checklist', 'HR Admin', 'Required files', 'Tracking'],
        ['Access review', 'System Admin', 'Role permission', 'Planning'],
      ],
    },
    reports: {
      action: 'Generate Report',
      title: 'Management Report Library',
      columns: ['Report', 'Audience', 'Frequency', 'Status'],
      rows: [
        ['Executive headcount', 'Management', 'Monthly', 'Ready'],
        ['Payroll readiness', 'Finance / HR', 'Monthly', 'Planning'],
        ['Document compliance', 'HR Manager', 'Weekly', 'Ready'],
        ['Project workforce', 'Project Director', 'Weekly', 'Connected'],
      ],
    },
  }

  return queues[moduleId] || {
    action: 'New Item',
    title: 'Operational Queue',
    columns: ['Item', 'Owner', 'Priority', 'Status'],
    rows: [
      ['Employee record review', 'HR Admin', 'Medium', 'Ready'],
      ['Approval workflow', 'Manager / HR', 'Medium', 'Planning'],
      ['Monthly report', 'HR Manager', 'Low', 'Ready'],
      ['Audit trail', 'System', 'Medium', 'Planning'],
    ],
  }
}

function departmentCount(employees) {
  return new Set((employees || []).map(e => e.department?.name || hrValue(e, ['department', 'department_name'])).filter(Boolean)).size
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({ name, size = 36, photoUrl = null }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['#7c3aed', '#0369a1', '#16a34a', '#c0392b', '#b45309']
  const color  = colors[name.charCodeAt(0) % colors.length]
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #e2e8f0' }}
        onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, color: '#fff', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.36, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

function StatusBadge({ status, size = 'normal' }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#f1f5f9', color: '#475569' }
  const compact = size === 'compact'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}22`,
      fontSize: compact ? '.64rem' : '.7rem',
      fontWeight: 900,
      padding: compact ? '3px 7px' : '4px 9px',
      borderRadius: 999,
      lineHeight: 1,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

function ContractBadge({ type }) {
  const cfg = CONTRACT_CONFIG[type] || { label: type, color: '#475569' }
  return (
    <span style={{ background: cfg.color + '18', color: cfg.color, fontSize: '.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
      {cfg.label}
    </span>
  )
}

function ClockBadge({ clockType }) {
  const isPerSite = clockType === 'PER_SITE'
  return (
    <span style={{
      background: isPerSite ? '#ede9fe' : '#e0f2fe',
      color: isPerSite ? '#7c3aed' : '#0369a1',
      fontSize: '.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 99,
    }}>
      {isPerSite ? '📍 Per Site' : '📅 Daily'}
    </span>
  )
}

function FeatureTag({ icon, label }) {
  return (
    <span style={{ fontSize: '.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: 99, background: '#f0fdf4', color: '#15803d' }}>
      {icon} {label}
    </span>
  )
}

function isFilledValue(value) {
  if (value === null || value === undefined) return false
  const text = String(value).trim()
  return !!text && !['-', '—', 'null', 'undefined', 'n/a', 'na'].includes(text.toLowerCase())
}

function employeeMissingRequiredData(employee) {
  return REQUIRED_DATA_FIELDS
    .filter(field => !isFilledValue(field.get(employee)))
    .map(field => field.label)
}

function employeeCompleteness(employee) {
  const missing = employeeMissingRequiredData(employee)
  const total = REQUIRED_DATA_FIELDS.length
  return {
    missing,
    pct: total ? Math.round(((total - missing.length) / total) * 100) : 100,
  }
}

function employeeMissingDocuments(employee) {
  const raw = employee.hr_profile || employee
  const knownMissing = hrValue(raw, ['missing_documents', 'required_documents_missing', 'missing_document_count', 'required_doc_missing_count'])
  if (knownMissing !== undefined && knownMissing !== null && knownMissing !== '') {
    const n = Number(knownMissing)
    return Number.isFinite(n) ? n : 0
  }
  const docCount = Number(hrValue(raw, ['document_count', 'documents_count', 'uploaded_document_count']))
  if (Number.isFinite(docCount)) return Math.max(0, REQUIRED_EMPLOYEE_DOCS.length - docCount)
  return null
}

function employeeLoginMissing(employee) {
  const raw = employee.hr_profile || employee
  const hasLogin = hrValue(raw, ['has_login', 'login_created', 'auth_user_exists', 'auth_user_id', 'user_id'])
  if (hasLogin === undefined || hasLogin === null || hasLogin === '') return false
  if (typeof hasLogin === 'boolean') return !hasLogin
  return ['false', '0', 'no', 'none'].includes(String(hasLogin).trim().toLowerCase())
}

function employeeWelcomePending(employee) {
  const raw = employee.hr_profile || employee
  const status = String(hrValue(raw, ['welcome_email_status', 'email_status', 'notification_status']) || '').toUpperCase()
  if (['PENDING', 'QUEUED', 'FAILED', 'NOT_SENT'].includes(status)) return true
  const sent = hrValue(raw, ['welcome_email_sent', 'welcome_sent'])
  if (sent === undefined || sent === null || sent === '') return false
  if (typeof sent === 'boolean') return !sent
  return ['false', '0', 'no'].includes(String(sent).trim().toLowerCase())
}

function CompletenessIndicator({ employee, compact = false }) {
  const { pct, missing } = employeeCompleteness(employee)
  const color = pct >= 90 ? '#16a34a' : pct >= 70 ? '#d97706' : ACE_RED
  return (
    <div title={missing.length ? `Missing: ${missing.join(', ')}` : 'Required data complete'} style={{ minWidth: compact ? 78 : 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: compact ? '.62rem' : '.68rem', color: '#667085', fontWeight: 850 }}>Data</span>
        <span style={{ fontSize: compact ? '.62rem' : '.68rem', color, fontWeight: 950 }}>{pct}%</span>
      </div>
      <div style={{ height: compact ? 5 : 6, borderRadius: 99, background: '#e2e8f0', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99 }} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE LIST — CARD VIEW
// ─────────────────────────────────────────────────────────────────────────────

function EmployeeCardGrid({ employees, loading, onSelect, onSendEmail, onQuickAction }) {
  return (
    <div style={{
      minHeight: 0,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gridAutoRows: 'max-content',
      alignItems: 'start',
      gap: 14, paddingRight: 4,
    }}>
      {loading && Array.from({ length: 10 }).map((_, i) => <EmployeeCardSkeleton key={i} />)}
      {!loading && employees.map(emp => (
        <EmployeeCard key={emp.id} employee={emp} onOpen={() => onSelect(emp)} onSendEmail={onSendEmail} onQuickAction={onQuickAction} />
      ))}
    </div>
  )
}

function EmployeeCardSkeleton() {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: 12, alignSelf: 'start' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 16, height: 16, background: '#f3f4f6', borderRadius: 4 }} />
        <div style={{ width: 60, height: 20, background: '#f3f4f6', borderRadius: 4 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 56, height: 56, background: '#e2e8f0', borderRadius: '50%' }} />
        <div style={{ marginTop: 10, width: '80%', height: 14, background: '#f3f4f6', borderRadius: 4 }} />
        <div style={{ marginTop: 6,  width: '60%', height: 11, background: '#f3f4f6', borderRadius: 4 }} />
      </div>
      <div style={{ marginTop: 12, background: '#f5f7fb', border: '1px solid #edf2f7', borderRadius: 4, padding: '12px 10px' }}>
        <div style={{ height: 10, background: '#f3f4f6', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 10, background: '#f3f4f6', borderRadius: 4 }} />
      </div>
    </div>
  )
}

function EmployeeCard({ employee, onOpen, onSendEmail, onQuickAction }) {
  const [sending, setSending] = useState(false)
  const missingDocs = employeeMissingDocuments(employee)
  const loginMissing = employeeLoginMissing(employee)
  const welcomePending = employeeWelcomePending(employee)
  const ready = employeeCompleteness(employee).score >= 90 && !loginMissing && ['ACTIVE', 'PROBATION'].includes(employee.status)

  async function handleSendEmail(e) {
    e.stopPropagation()
    if (!employee.email || sending) return
    setSending(true)
    await onSendEmail([employee.employee_code])
    setSending(false)
  }

  return (
    <div
      onClick={onOpen}
      style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
        boxShadow: '0 10px 24px rgba(15,23,42,.07)',
        padding: 14, cursor: 'pointer', alignSelf: 'start',
        transition: 'box-shadow .15s, transform .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 28px rgba(15,23,42,.12)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 18px rgba(15,23,42,.06)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <StatusBadge status={employee.status} size="compact" />
        <EmployeeQuickActions employee={employee} onAction={onQuickAction} sending={sending} onSendEmail={handleSendEmail} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 10 }}>
        <Avatar name={employee.full_name} size={56} photoUrl={employee.photo_url} />
        <div style={{ marginTop: 10, fontSize: '.88rem', fontWeight: 950, color: '#0f172a', textAlign: 'center', lineHeight: 1.2 }}>{employee.full_name}</div>
        <div style={{ fontSize: '.76rem', color: '#667085', marginTop: 4, textAlign: 'center', minHeight: 18 }}>{employee.position.name}</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
          <ContractBadge type={employee.current_contract?.contract_type || '—'} />
          <EligibilityBadge label={loginMissing ? 'Login Disabled' : 'Login Active'} ok={!loginMissing} />
          <EligibilityBadge label={ready ? 'Project Ready' : 'Not Ready'} ok={ready} />
          {loginMissing && <RiskTag label="No login" tone="red" />}
          {welcomePending && <RiskTag label="Welcome pending" tone="amber" />}
        </div>
      </div>

      <div style={{ marginTop: 12, background: '#f5f7fb', border: '1px solid #edf2f7', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #e2e8f0' }}>
          <InfoTile label="Department" value={employee.department.name} />
          <InfoTile label="Date Hired"  value={employee.hire_date} />
        </div>
        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={CARD_LINE}>✉ {employee.email}</div>
          <div style={CARD_LINE}>📞 {employee.phone}</div>
          <CompletenessIndicator employee={employee} />
          {missingDocs !== null && missingDocs > 0 && <RiskTag label={`${missingDocs} docs missing`} tone="amber" />}
        </div>
      </div>
    </div>
  )
}

function RiskTag({ label, tone = 'red' }) {
  const cfg = tone === 'amber'
    ? { bg: '#fffbeb', color: '#b45309', border: '#fde68a' }
    : { bg: '#fef2f2', color: ACE_RED, border: '#fecaca' }
  return (
    <span style={{ alignSelf: 'flex-start', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 5, padding: '2px 7px', fontSize: '.62rem', fontWeight: 900 }}>
      {label}
    </span>
  )
}

function EligibilityBadge({ label, ok }) {
  return (
    <span style={{ alignSelf: 'flex-start', background: ok ? '#ecfdf3' : '#fef2f2', color: ok ? '#16a34a' : ACE_RED, border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`, borderRadius: 999, padding: '2px 7px', fontSize: '.62rem', fontWeight: 900 }}>
      {label}
    </span>
  )
}

function EmployeeQuickActions({ employee, onAction, sending = false, onSendEmail }) {
  function act(event, action) {
    event.preventDefault()
    event.stopPropagation()
    onAction?.(action, employee)
  }
  return (
    <details
      style={{ position: 'relative' }}
      onClick={event => event.stopPropagation()}
    >
      <summary
        title="Quick actions"
        style={{
          listStyle: 'none',
          width: 28,
          height: 28,
          display: 'grid',
          placeItems: 'center',
          border: '1px solid #e2e8f0',
          borderRadius: 6,
          background: '#fff',
          color: '#667085',
          cursor: 'pointer',
          fontWeight: 950,
        }}
      >
        ⋯
      </summary>
      <div style={{
        position: 'absolute',
        right: 0,
        top: 32,
        width: 174,
        zIndex: 30,
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        background: '#fff',
        boxShadow: '0 18px 42px rgba(15,23,42,.18)',
        padding: 6,
      }}>
        <QuickActionButton label="View" onClick={e => act(e, 'view')} />
        <QuickActionButton label="Edit Profile" onClick={e => act(e, 'editProfile')} />
        <QuickActionButton label="Edit Contract" onClick={e => act(e, 'editContract')} />
        <QuickActionButton label={sending ? 'Sending...' : 'Send Welcome Email'} disabled={!employee.email || sending} onClick={onSendEmail} />
        <QuickActionButton label="Reset Password" onClick={e => act(e, 'resetPassword')} />
        <QuickActionButton label="View History" onClick={e => act(e, 'history')} />
      </div>
    </details>
  )
}

function QuickActionButton({ label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        border: 'none',
        background: disabled ? '#f5f7fb' : '#fff',
        color: disabled ? '#94a3b8' : '#344054',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        borderRadius: 5,
        padding: '8px 9px',
        fontSize: '.74rem',
        fontWeight: 850,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = '#f5f7fb' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = '#fff' }}
    >
      {label}
    </button>
  )
}

function InfoTile({ label, value }) {
  return (
    <div style={{ padding: '8px 10px', minWidth: 0 }}>
      <div style={{ fontSize: '.58rem', color: '#94a3b8', fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: '.68rem', color: '#334155', fontWeight: 800, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE LIST — LIST (TABLE) VIEW
// ─────────────────────────────────────────────────────────────────────────────

function EmployeeListRow({ emp, onSelect, onSendEmail, onQuickAction }) {
  const [sending, setSending] = useState(false)
  const missingDocs = employeeMissingDocuments(emp)
  const loginMissing = employeeLoginMissing(emp)
  const welcomePending = employeeWelcomePending(emp)
  async function handleSendEmail(e) {
    e.stopPropagation()
    if (!emp.email || sending) return
    setSending(true)
    await onSendEmail([emp.employee_code])
    setSending(false)
  }
  return (
    <tr
      onClick={() => onSelect(emp)}
      style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background .1s' }}
      onMouseEnter={e => e.currentTarget.style.background = '#f5f7fb'}
      onMouseLeave={e => e.currentTarget.style.background = ''}
    >
      <td style={{ padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={emp.full_name} size={34} photoUrl={emp.photo_url} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{emp.full_name}</div>
            <div style={{ fontSize: '.72rem', color: '#94a3b8', maxWidth: 230, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.email || 'No email'}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '12px', color: '#475569', fontWeight: 800, whiteSpace: 'nowrap' }}>{emp.employee_code}</td>
      <td style={{ padding: '12px', color: '#475569' }}>{emp.department.name}</td>
      <td style={{ padding: '12px', color: '#475569', maxWidth: 210, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.position.name}</td>
      <td style={{ padding: '12px' }}><StatusBadge status={emp.status} /></td>
      <td style={{ padding: '12px' }}>
        <div style={{ display: 'grid', gap: 6, minWidth: 120 }}>
          <ContractBadge type={emp.current_contract?.contract_type || '—'} />
          {(loginMissing || welcomePending || (missingDocs !== null && missingDocs > 0)) && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {loginMissing && <RiskTag label="No login" />}
              {welcomePending && <RiskTag label="Email pending" tone="amber" />}
              {missingDocs !== null && missingDocs > 0 && <RiskTag label="Docs" tone="amber" />}
            </div>
          )}
        </div>
      </td>
      <td style={{ padding: '12px', minWidth: 116 }}><CompletenessIndicator employee={emp} compact /></td>
      <td style={{ padding: '12px', color: '#475569', fontWeight: 500, whiteSpace: 'nowrap' }}>{emp.hire_date}</td>
      <td style={{ padding: '12px' }}>
        <EmployeeQuickActions employee={emp} onAction={onQuickAction} sending={sending} onSendEmail={handleSendEmail} />
      </td>
    </tr>
  )
}

function EmployeeListView({ employees, loading, onSelect, onSendEmail, onQuickAction }) {
  return (
    <div style={{ minHeight: 0, overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '.8rem' }}>
        <thead>
          <tr style={{ background: '#f5f7fb', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 }}>
            {['Employee', 'Code', 'Department', 'Team / Function', 'Status', 'Contract / Flags', 'Data', 'Hire Date', 'Actions'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 900, fontSize: '.7rem', color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
              {Array.from({ length: 9 }).map((_, j) => (
                <td key={j} style={{ padding: '10px 12px' }}>
                  <div style={{ height: 12, background: '#f3f4f6', borderRadius: 4, width: j === 0 ? 140 : 80 }} />
                </td>
              ))}
            </tr>
          ))}
          {!loading && employees.map(emp => (
            <EmployeeListRow key={emp.id} emp={emp} onSelect={onSelect} onSendEmail={onSendEmail} onQuickAction={onQuickAction} />
          ))}
        </tbody>
      </table>
      {!loading && employees.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: '.85rem' }}>
          No employees match the current filters.
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOLBAR + STATUS TABS
// ─────────────────────────────────────────────────────────────────────────────

function EmployeeToolbar({
  total, loading,
  search, setSearch,
  deptFilter, setDeptFilter,
  statusFilter, setStatusFilter,
  viewMode, setViewMode,
  onAdd,
  counts,
  allCount,
  departmentOptions,
  onSendAll,
  sendingAll,
  currentPageEmployees,
  canWriteHr = false,
}) {
  return (
    <div className="flex flex-col gap-2.5 pb-3.5">
      {/* Top row */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="mr-auto text-lg font-black text-slate-950">
          {loading ? '…' : total} Employees
        </span>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name / code / email…"
          className="w-[210px] rounded-md border border-[#d8dee8] bg-white px-2.5 py-1.5 text-[.78rem] text-slate-700 outline-none focus:border-[#2447d8] focus:ring-3 focus:ring-[#2447d8]/10"
        />
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="w-[180px] rounded-md border border-[#d8dee8] bg-white px-2.5 py-1.5 text-[.78rem] text-slate-700 outline-none focus:border-[#2447d8] focus:ring-3 focus:ring-[#2447d8]/10">
          <option value="">All Depts</option>
          {departmentOptions.map(dept => <option key={dept} value={dept}>{dept}</option>)}
        </select>

        {/* Send all visible employees email */}
        {canWriteHr && currentPageEmployees.length > 0 && (
          <button
            onClick={onSendAll}
            disabled={sendingAll || loading}
            title={`Send welcome email to all ${currentPageEmployees.length} employees on this page`}
            style={{
              background: sendingAll ? '#e2e8f0' : '#f0f9ff',
              border: '1px solid #bae6fd',
              color: sendingAll ? '#94a3b8' : '#0369a1',
              borderRadius: 6, padding: '5px 12px',
              fontSize: '.76rem', fontWeight: 700, cursor: sendingAll ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            {sendingAll ? '⏳' : '✉'} Send to {currentPageEmployees.length}
          </button>
        )}

        {/* View toggle */}
        <div className="flex overflow-hidden rounded-md border border-[#dbe3ea]">
          {[{ v: 'grid', icon: '⊞' }, { v: 'list', icon: '☰' }].map(({ v, icon }) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={[
                'h-[30px] w-8 border-0 text-[.88rem]',
                viewMode === v ? 'bg-[#2447d8] text-white' : 'bg-white text-slate-500',
              ].join(' ')}
            >{icon}</button>
          ))}
        </div>

        {canWriteHr && <button onClick={onAdd} className="rounded-md bg-[#2447d8] px-3.5 py-1.5 text-[.78rem] font-bold text-white">+ Add Employee</button>}
      </div>

      {/* Status quick-filter tabs */}
      <div className="flex flex-wrap gap-1">
        {STATUS_TABS.map(tab => {
          const count = tab.key === '' ? allCount : (counts[tab.key] || 0)
          const active = statusFilter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={[
                'rounded-full border px-3 py-1 text-[.76rem]',
                active ? 'border-[#2447d8] bg-[#2447d8] font-bold text-white' : 'border-slate-200 bg-white font-medium text-slate-600',
              ].join(' ')}
            >
              {tab.label}
              <span className={['ml-1.5 rounded-full px-1.5 py-px text-[.68rem] font-bold', active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'].join(' ')}>{count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE DETAIL DRAWER
// ─────────────────────────────────────────────────────────────────────────────

function EmployeeDrawer({ employee, onClose, initialTab = 'profile', initialEditProfile = false, initialContractForm = false, currentUser = null }) {
  const [tab,  setTab]  = useState(initialTab)
  const [detail, setDetail] = useState(null)
  const [showContractForm, setShowContractForm] = useState(initialContractForm)
  const [reloadKey, setReloadKey] = useState(0)
  const refetch = () => setReloadKey(k => k + 1)

  useEffect(() => {
    if (!employee) return
    let cancelled = false
    setDetail(null)
    if (reloadKey === 0) setTab(initialTab)
    if (reloadKey === 0) setShowContractForm(initialContractForm)
    fetchEmployeeDetail(employee.id)
      .then(d  => { if (!cancelled) setDetail(d) })
      .catch(e => { if (!cancelled) setDetail({ error: e.message }) })
    return () => { cancelled = true }
  }, [employee?.id, initialTab, initialContractForm, reloadKey])

  if (!employee) return null

  const TABS = [
    { id: 'profile',   label: 'Profile'   },
    { id: 'contract',  label: 'Contract'  },
    { id: 'documents', label: 'Documents' },
    { id: 'access',    label: 'System Access' },
    { id: 'readiness', label: 'Readiness' },
    { id: 'history',   label: 'History'   },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-tertiary)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Avatar name={employee.full_name} size={48} photoUrl={employee.photo_url} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{employee.full_name}</span>
              <StatusBadge status={employee.status} />
            </div>
            <div style={{ fontSize: '.78rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
              {employee.employee_code} · {employee.position.name} · {employee.department.name}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <ClockBadge clockType={employee.position.clock_type} />
              {employee.position.gps_required   && <FeatureTag icon="🛰️" label="GPS"   />}
              {employee.position.photo_required  && <FeatureTag icon="📷" label="Photo" />}
            </div>
            <div style={{ marginTop: 10, maxWidth: 320 }}>
              <CompletenessIndicator employee={employee} compact />
            </div>
          </div>
          <button onClick={onClose} style={ICON_BTN}>✕</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-tertiary)', padding: '0 20px' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 14px', fontSize: '.8rem',
              fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? ACE_BLUE : 'var(--color-text-secondary)',
              borderBottom: `2px solid ${tab === t.id ? ACE_BLUE : 'transparent'}`,
              fontFamily: 'inherit',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {!detail ? (
          <DrawerSkeleton />
        ) : detail.error ? (
          <div style={{ padding: 20, background: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: '.85rem' }}>
            <strong>Error:</strong> {detail.error}
          </div>
        ) : (
          <>
            {tab === 'profile'   && <ProfileTab emp={detail.employee} profile={detail.profile} contacts={detail.emergency_contacts} initialEditing={initialEditProfile} />}
            {tab === 'contract'  && <ContractTab contracts={detail.contracts} employeeId={employee.id} onAdd={() => setShowContractForm(true)} onRefresh={refetch} />}
            {tab === 'documents' && <DocumentsTab docs={detail.documents} employeeId={employee.id} onRefresh={refetch} />}
            {tab === 'access'    && <SystemAccessTab employee={detail.employee} currentUser={currentUser} />}
            {tab === 'readiness' && <ReadinessTab employee={detail.employee} />}
            {tab === 'history'   && <HistoryTab logs={detail.status_log} auditLogs={detail.audit_logs} />}
          </>
        )}
      </div>

      {showContractForm && (
        <ContractFormModal
          employeeId={employee.id}
          currentContract={detail?.employee ? {
            employment_type: detail.employee.employment_type,
            contract_type: detail.employee.contract_type,
            contract_start_date: detail.employee.contract_start_date,
            contract_end_date: detail.employee.contract_end_date,
            hire_date: detail.employee.hire_date,
            job_level: detail.employee.job_level,
            notes: detail.employee.notes,
          } : null}
          onClose={() => setShowContractForm(false)}
          onSaved={() => { if (refetch) refetch() }}
        />
      )}
    </div>
  )
}

function DrawerSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[120, 180, 80].map((h, i) => (
        <div key={i} style={{ background: '#f5f7fb', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, height: h }} />
      ))}
    </div>
  )
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────
function ProfileTab({ emp, profile, contacts, initialEditing = false }) {
  const [editing, setEditing] = useState(initialEditing)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [form, setForm] = useState({
    phone: emp.phone || '',
    work_location: profile?.work_location || emp.work_location_name || '',
    manager_name: profile?.manager_name || '',
    manager_code: profile?.manager_code || '',
    cost_center: profile?.cost_center || '',
    job_level: profile?.job_level || '',
    emergency_contact_name: profile?.emergency_contact_name || contacts?.[0]?.name || '',
    emergency_contact_relation: profile?.emergency_contact_relation || contacts?.[0]?.relationship || '',
    emergency_contact_phone: profile?.emergency_contact_phone || contacts?.[0]?.phone || '',
    photo_url: emp.photo_url || '',
    notes: profile?.notes || '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    setEditing(initialEditing)
  }, [initialEditing, emp.id])

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      const res = await apiFetch(`${API_BASE}/employees/${emp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: form.phone || null,
          work_location: form.work_location || null,
          manager_name: form.manager_name || null,
          manager_code: form.manager_code || null,
          cost_center: form.cost_center || null,
          job_level: form.job_level || null,
          emergency_contact_name: form.emergency_contact_name || null,
          emergency_contact_relation: form.emergency_contact_relation || null,
          emergency_contact_phone: form.emergency_contact_phone || null,
          photo_url: form.photo_url || null,
          notes: form.notes || null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setEditing(false)
    } catch (e) {
      setSaveError(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {saveError && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 8, padding: '8px 12px', fontSize: '.78rem', fontWeight: 700 }}>
          ⚠ {saveError}
        </div>
      )}
      <Section title="Work Info" action={
        editing ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { setEditing(false); setSaveError('') }} style={{ ...BTN_SECONDARY, padding: '4px 10px', fontSize: '.72rem' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ ...BTN_PRIMARY, padding: '4px 10px', fontSize: '.72rem', background: saving ? '#94a3b8' : '#16a34a' }}>
              {saving ? 'Saving…' : '✓ Save'}
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} style={{ ...BTN_SECONDARY, padding: '4px 10px', fontSize: '.72rem' }}>✏ Edit</button>
        )
      }>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <InfoGrid rows={[
              ['Team / Function', emp.position?.name || '—'],
              ['Department',  `${emp.department.name}`],
              ['Employee ID', emp.employee_code || '—'],
              ['Hire Date',   emp.hire_date || '—'],
              ['Email',       emp.email],
            ]} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <FormField label="Phone">
                <input value={form.phone} onChange={e => set('phone', e.target.value)} style={INPUT} />
              </FormField>
              <FormField label="Work Location">
                <input value={form.work_location} onChange={e => set('work_location', e.target.value)} style={INPUT} />
              </FormField>
              <FormField label="Manager Name">
                <input value={form.manager_name} onChange={e => set('manager_name', e.target.value)} style={INPUT} />
              </FormField>
              <FormField label="Manager Code">
                <input value={form.manager_code} onChange={e => set('manager_code', e.target.value)} style={INPUT} placeholder="ACE###" />
              </FormField>
              <FormField label="Cost Center">
                <input value={form.cost_center} onChange={e => set('cost_center', e.target.value)} style={INPUT} />
              </FormField>
              <FormField label="Job Level">
                <input value={form.job_level} onChange={e => set('job_level', e.target.value)} style={INPUT} placeholder="L1, L2, L3…" />
              </FormField>
            </div>
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 4 }}>
              <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Emergency Contact</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <FormField label="Name">
                  <input value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} style={INPUT} />
                </FormField>
                <FormField label="Relation">
                  <input value={form.emergency_contact_relation} onChange={e => set('emergency_contact_relation', e.target.value)} style={INPUT} />
                </FormField>
                <FormField label="Phone">
                  <input value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} style={INPUT} />
                </FormField>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 4 }}>
              <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Profile Photo</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={emp.full_name} size={64} photoUrl={form.photo_url || null} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ display: 'inline-block', cursor: 'pointer' }}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={async e => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        const fd = new FormData()
                        fd.append('file', f)
                        try {
                          const r = await apiFetch(`${API_BASE}/employees/${emp.id}/photo`, { method: 'POST', body: fd })
                          if (!r.ok) throw new Error((await r.json()).detail || 'Upload failed')
                          const d = await r.json()
                          set('photo_url', d.photo_url)
                        } catch (err) {
                          alert(`Upload failed: ${err.message}`)
                        }
                      }}
                    />
                    <span style={{ ...BTN_PRIMARY, display: 'inline-flex', cursor: 'pointer' }}>📷 Upload Photo</span>
                  </label>
                  <FormField label="Photo URL">
                    <input
                      value={form.photo_url}
                      onChange={e => set('photo_url', e.target.value)}
                      placeholder="https://… or auto-filled after upload"
                      style={INPUT}
                    />
                  </FormField>
                </div>
              </div>
            </div>
            <FormField label="Notes">
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...INPUT, resize: 'vertical' }} />
            </FormField>
          </div>
        ) : (
          <InfoGrid rows={[
            ['Employee ID', emp.employee_code || '—'],
            ['Full Name', emp.full_name || '—'],
            ['Preferred Name', profile?.preferred_name || '—'],
            ['Department', emp.department.name],
            ['Section', profile?.section_name || '—'],
            ['Position', profile?.job_title || emp.position?.name || '—'],
            ['Job Level', profile?.job_level || '—'],
            ['Manager', profile?.manager_name || '—'],
            ['Manager Code', profile?.manager_code || '—'],
            ['Cost Center', profile?.cost_center || '—'],
            ['Hire Date', emp.hire_date || '—'],
            ['Status', STATUS_CONFIG[emp.status]?.label || emp.status || '—'],
          ]} />
        )}
      </Section>

      <Section title="Contact Information">
        <InfoGrid rows={[
          ['Company Email', emp.email || '—'],
          ['Personal Email', profile?.personal_email || '—'],
          ['Mobile Phone', form.phone || '—'],
          ['Work Phone', profile?.work_phone || '—'],
          ['Work Location', profile?.work_location || form.work_location_name || '—'],
          ['Address', profile?.address || '—'],
        ]} />
      </Section>

      {profile && (
        <Section title="Personal & Compliance">
          <InfoGrid rows={[
            ['Date of Birth', profile.date_of_birth || '—'],
            ['Gender',        profile.gender || '—'],
            ['National ID',    profile.id_card_no || '—'],
            ['Blood Type',    profile.blood_type || '—'],
            ['Nationality',   profile.nationality || '—'],
            ['SSO No.',       profile.sso_no || '—'],
            ['Education',     profile.education_level ? `${profile.education_level} — ${profile.education_field}` : '—'],
            ['Institute',     profile.education_institute || '—'],
          ]} />
        </Section>
      )}

      {profile && (
        <Section title="Employment Classification">
          <InfoGrid rows={[
            ['Employment Type', profile.employment_type || '—'],
            ['Contract Type', profile.contract_type || '—'],
            ['Probation End', profile.probation_end_date || '—'],
            ['Termination Date', profile.termination_date || '—'],
            ['Source', profile.source || '—'],
            ['Last Updated', profile.updated_at ? String(profile.updated_at).slice(0, 19) : '—'],
          ]} />
        </Section>
      )}

      {profile && (
        <Section title="Payroll & Bank Account">
          <InfoGrid rows={[
            ['Bank',    profile.bank_name || '—'],
            ['Account', profile.bank_account_no || '—'],
            ['Name',    profile.bank_account_name || '—'],
          ]} />
        </Section>
      )}

      <Section title="Emergency Contacts">
        {contacts.length > 0 ? contacts.map(c => (
          <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border-tertiary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '.85rem' }}>{c.name}</span>
              {c.is_primary && (
                <span style={{ fontSize: '.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: '#dbeafe', color: '#2447d8' }}>Primary</span>
              )}
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
              {c.relationship} · {c.phone}
            </div>
          </div>
        )) : (
          <div style={{ color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: 10, fontSize: '.78rem', fontWeight: 700 }}>
            Emergency contact is missing.
          </div>
        )}
      </Section>

      <Section title="Work Location (GPS)">
        <InfoGrid rows={[
          ['Location',       form.work_location_name || '—'],
          ['GPS Lat/Lng',    emp.work_latitude ? `${emp.work_latitude}, ${emp.work_longitude}` : '—'],
          ['Allowed Radius', emp.allowed_radius_meters ? `${emp.allowed_radius_meters} m` : '—'],
        ]} />
      </Section>
    </div>
  )
}

// ─── Contract Tab ─────────────────────────────────────────────────────────────
function ExtendContractModal({ employeeId, currentEnd, onClose, onSaved }) {
  const [employmentType, setEmploymentType] = useState('Outsource')
  const [contractType, setContractType] = useState('Contract 6 Months')
  const [startDate, setStartDate] = useState(currentEnd ? new Date(new Date(currentEnd).getTime() + 86400000).toISOString().slice(0,10) : new Date().toISOString().slice(0,10))
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const months = contractDurationMonths(contractType)
  const autoEnd = months && startDate ? addMonths(startDate, months) : ''
  const effectiveEnd = endDate || autoEnd

  useEffect(() => {
    if (months && startDate) setEndDate(addMonths(startDate, months))
  }, [contractType, startDate, months])

  async function handleSave() {
    setSaving(true); setError('')
    try {
      const r = await apiFetch(`${API_BASE}/employees/${employeeId}/contracts/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_type: contractType,
          duration_months: months,
          start_date: startDate || null,
          end_date: effectiveEnd || null,
          notes: notes || null,
        }),
      })
      if (!r.ok) throw new Error((await r.json()).detail || 'Failed')
      onSaved?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}
         onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 480, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 14 }}>↻ Extend / Renew Contract</div>
        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '8px 12px', borderRadius: 6, fontSize: '.78rem', marginBottom: 10 }}>⚠ {error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FormField label="Employment Type">
              <select value={employmentType} onChange={e => { const v = e.target.value; setEmploymentType(v); setContractType(CONTRACT_TYPE_OPTIONS[v][0]) }} style={INPUT}>
                {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Contract Type">
              <select value={contractType} onChange={e => setContractType(e.target.value)} style={INPUT}>
                {(CONTRACT_TYPE_OPTIONS[employmentType] || []).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FormField label="New Start Date">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={INPUT} />
            </FormField>
            <FormField label={months ? `New End (auto +${months}m)` : 'New End Date'}>
              <input type="date" value={effectiveEnd} onChange={e => setEndDate(e.target.value)} style={INPUT} />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Reason for renewal…" style={{ ...INPUT, resize: 'vertical' }} />
          </FormField>
        </div>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 12px', borderRadius: 8, fontSize: '.78rem', color: '#15803d', marginTop: 12 }}>
          ↻ Will close current ACTIVE contract → create new contract row → update employee.contract_end_date. If TERMINATED, status will revert to ACTIVE.
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
          <button onClick={onClose} style={BTN_SECONDARY}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ ...BTN_PRIMARY, background: '#16a34a' }}>
            {saving ? 'Saving…' : '✓ Renew Contract'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ContractTab({ contracts, onAdd, employeeId, onRefresh }) {
  const [history, setHistory] = useState(null)
  const [showExtend, setShowExtend] = useState(false)

  useEffect(() => {
    if (!employeeId) return
    apiFetch(`${API_BASE}/employees/${employeeId}/contracts`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => setHistory(d.data || []))
      .catch(() => setHistory([]))
  }, [employeeId])

  const histList = history || []
  const current = histList.find(h => h.status === 'ACTIVE') || histList[0] || contracts.find(c => c.is_current) || contracts[0]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: '.88rem' }}>Contract History {history && `(${history.length})`}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setShowExtend(true)} style={{ ...BTN_PRIMARY, background: '#16a34a' }}>↻ Extend / Renew</button>
          <button onClick={onAdd} style={BTN_PRIMARY}>+ New Contract</button>
        </div>
      </div>
      {showExtend && (
        <ExtendContractModal
          employeeId={employeeId}
          currentEnd={current?.end_date}
          onClose={() => setShowExtend(false)}
          onSaved={() => {
            setShowExtend(false)
            apiFetch(`${API_BASE}/employees/${employeeId}/contracts`).then(r => r.json()).then(d => setHistory(d.data || []))
            onRefresh?.()
          }}
        />
      )}
      {history && history.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Section title="Contract History (real)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map(h => (
                <div key={h.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 10, padding: '8px 12px', background: h.status === 'ACTIVE' ? '#f0fdf4' : '#f5f7fb', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '.82rem' }}>
                  <span style={{ fontWeight: 700 }}>{h.contract_type}</span>
                  <span style={{ color: '#64748b' }}>{h.start_date || '—'} → {h.end_date || 'Ongoing'}</span>
                  <span style={{ color: '#64748b' }}>{h.duration_months ? `${h.duration_months}m` : '—'}</span>
                  <span style={{ fontSize: '.7rem', padding: '2px 8px', borderRadius: 99, background: h.status === 'ACTIVE' ? '#dcfce7' : '#e2e8f0', color: h.status === 'ACTIVE' ? '#15803d' : '#475569', fontWeight: 700 }}>{h.status}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
      {current && (
        <Section title="Current Contract Summary">
          <InfoGrid rows={[
            ['Employment Type', current.employment_type || '—'],
            ['Contract Type', current.contract_type || '—'],
            ['Effective Period', `${current.start_date || '—'} → ${current.end_date || 'Ongoing'}`],
            ['Probation End', current.probation_end_date || '—'],
            ['Job Level / Band', current.salary_band || '—'],
            ['Manager', current.manager_name || '—'],
            ['Cost Center', current.cost_center || '—'],
            ['Work Location', current.work_location || '—'],
          ]} />
        </Section>
      )}
      {contracts.map(c => (
        <div key={c.id} style={{ ...CARD_STYLE, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <ContractBadge type={c.contract_type} />
            {c.is_current && (
              <span style={{ fontSize: '.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: '#dcfce7', color: '#15803d' }}>Current</span>
            )}
          </div>
          <InfoGrid rows={[
            ['Employment Type', c.employment_type || '—'],
            ['Contract Type', c.contract_type || '—'],
            ['Period',      `${c.start_date} → ${c.end_date || 'Ongoing'}`],
            ['Probation End', c.probation_end_date || '—'],
            ['Salary Band', c.salary_band || '—'],
            ['Manager', c.manager_name || '—'],
            ['Cost Center', c.cost_center || '—'],
            ['Vendor',      c.vendor_name || '—'],
            ['Notes',       c.notes || '—'],
          ]} />
        </div>
      ))}
    </div>
  )
}

// ─── Documents Tab ────────────────────────────────────────────────────────────
function DocumentUploadModal({ employeeId, defaultType, onClose, onSaved }) {
  const [docType, setDocType] = useState(defaultType || 'ID_CARD')
  const [file, setFile] = useState(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleUpload() {
    if (!file) { setError('Please select a file'); return }
    setSaving(true); setError('')
    try {
      const fd = new FormData()
      fd.append('doc_type', docType)
      if (notes) fd.append('notes', notes)
      fd.append('file', file)
      const r = await apiFetch(`${API_BASE}/employees/${employeeId}/documents`, { method: 'POST', body: fd })
      if (!r.ok) throw new Error((await r.json()).detail || 'Upload failed')
      onSaved?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}
         onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 460, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 14 }}>📎 Upload Document</div>
        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '8px 12px', borderRadius: 6, fontSize: '.78rem', marginBottom: 10 }}>⚠ {error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <FormField label="Document Type">
            <select value={docType} onChange={e => setDocType(e.target.value)} style={INPUT}>
              <optgroup label="Required">
                {REQUIRED_EMPLOYEE_DOCS.map(d => <option key={d.type} value={d.type}>{d.label}</option>)}
              </optgroup>
              <optgroup label="Other">
                <option value="CONTRACT_SIGNED">Signed Contract</option>
                <option value="BANK_BOOK">Bank Book</option>
                <option value="MEDICAL_CERT">Medical Certificate</option>
                <option value="PASSPORT">Passport</option>
                <option value="OTHER">Other</option>
              </optgroup>
            </select>
          </FormField>
          <FormField label="File">
            <input type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} style={INPUT} />
          </FormField>
          <FormField label="Notes (optional)">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...INPUT, resize: 'vertical' }} />
          </FormField>
        </div>
        <div style={{ fontSize: '.7rem', color: '#64748b', marginTop: 8 }}>Max 10 MB · JPG / PNG / WebP / PDF</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
          <button onClick={onClose} style={BTN_SECONDARY}>Cancel</button>
          <button onClick={handleUpload} disabled={saving || !file} style={{ ...BTN_PRIMARY, opacity: saving || !file ? .6 : 1 }}>
            {saving ? 'Uploading…' : '↑ Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DocumentsTab({ docs, employeeId, onRefresh }) {
  const [liveDocs, setLiveDocs] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [defaultType, setDefaultType] = useState('')

  async function reload() {
    if (!employeeId) return
    const r = await apiFetch(`${API_BASE}/employees/${employeeId}/documents`)
    if (r.ok) {
      const d = await r.json()
      setLiveDocs((d.data || []).map(x => ({ ...x, created_at: x.uploaded_at })))
    }
  }
  useEffect(() => { reload() }, [employeeId])

  async function handleDelete(doc) {
    if (!confirm(`Delete "${doc.file_name}"?`)) return
    const r = await apiFetch(`${API_BASE}/employees/${employeeId}/documents/${doc.id}`, { method: 'DELETE' })
    if (r.ok) reload()
  }

  const all = liveDocs !== null ? liveDocs : (docs || [])
  const docsByType = new Map(all.map(doc => [doc.doc_type, doc]))
  const requiredRows = REQUIRED_EMPLOYEE_DOCS.map(item => ({
    ...item,
    doc: item.aliases.map(type => docsByType.get(type)).find(Boolean),
  }))
  const requiredTypes = new Set(REQUIRED_EMPLOYEE_DOCS.flatMap(item => item.aliases))
  const otherDocs = all.filter(doc => !requiredTypes.has(doc.doc_type))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: '.88rem' }}>Documents</span>
        <button onClick={() => { setDefaultType(''); setShowUpload(true) }} style={BTN_PRIMARY}>+ Upload</button>
      </div>

      {showUpload && (
        <DocumentUploadModal
          employeeId={employeeId}
          defaultType={defaultType}
          onClose={() => setShowUpload(false)}
          onSaved={() => { setShowUpload(false); reload(); onRefresh?.() }}
        />
      )}

      <Section title="Document Compliance">
        <InfoGrid rows={[
          ['Required Documents', REQUIRED_EMPLOYEE_DOCS.length],
          ['Uploaded', requiredRows.filter(item => item.doc).length],
          ['Missing', requiredRows.filter(item => !item.doc).length],
          ['Other Documents', otherDocs.length],
        ]} />
      </Section>

      <div style={{ display: 'grid', gap: 8 }}>
        {requiredRows.map(item => (
          <div
            key={item.type}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              background: item.doc ? '#f5f7fb' : '#fff',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '.82rem', fontWeight: 850, color: '#101828' }}>{item.label}</div>
              <div style={{ fontSize: '.7rem', color: '#667085', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.doc ? `${item.doc.file_name} · ${item.doc.created_at}` : 'Required document'}
              </div>
            </div>
            {item.doc ? (
              <>
                <a href={item.doc.file_url} target="_blank" rel="noreferrer" style={{ fontSize: '.75rem', color: ACE_BLUE, fontWeight: 800, textDecoration: 'none' }}>
                  View
                </a>
                <button onClick={() => handleDelete(item.doc)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '.72rem', fontWeight: 800, cursor: 'pointer', marginLeft: 8 }}>
                  Delete
                </button>
              </>
            ) : (
              <button
                onClick={() => { setDefaultType(item.type); setShowUpload(true) }}
                style={{ fontSize: '.68rem', fontWeight: 900, color: '#b45309', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 4, padding: '3px 7px', cursor: 'pointer' }}
              >
                + Upload
              </button>
            )}
          </div>
        ))}
      </div>

      {otherDocs.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: '.72rem', color: '#667085', fontWeight: 900, marginBottom: 6 }}>Other Documents</div>
          {otherDocs.map(d => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--color-border-tertiary)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '.82rem', fontWeight: 600 }}>{d.file_name}</div>
                <div style={{ fontSize: '.7rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {d.doc_type.replace(/_/g, ' ')} · {d.created_at}
                </div>
              </div>
              <a href={d.file_url} target="_blank" rel="noreferrer" style={{ fontSize: '.75rem', color: ACE_BLUE, fontWeight: 600, textDecoration: 'none' }}>
                View
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SystemAccessTab({ employee, currentUser = null }) {
  const [access, setAccess] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    fetchSystemAccess(employee.id)
      .then(setAccess)
      .catch(err => setError(err.message || 'Cannot load system access'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [employee.id])

  async function run(label, fn) {
    setActionLoading(label)
    setError('')
    try {
      const result = await fn()
      setAccess(result.system_access || result)
      if (result.initial_password) {
        setError(`Temporary password: ${result.initial_password}`)
      }
    } catch (err) {
      setError(err.message || `${label} failed`)
    } finally {
      setActionLoading('')
    }
  }

  if (loading) return <DrawerSkeleton />
  if (!access) return <div style={{ color: ACE_RED, fontWeight: 800 }}>{error || 'System access unavailable'}</div>

  const canManageAccess = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'HR_ADMIN'].includes(currentUser?.role)
  const disabled = !!actionLoading || access.read_only || !canManageAccess
  const Button = ({ children, onClick, danger = false, forcedDisabled = false }) => (
    <button
      onClick={onClick}
      disabled={disabled || forcedDisabled}
      style={{ ...BTN_SECONDARY, borderRadius: 6, color: danger ? ACE_RED : '#344054', opacity: disabled || forcedDisabled ? .45 : 1 }}
    >
      {actionLoading === children ? 'Working...' : children}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {error && <div style={{ background: error.startsWith('Temporary') ? '#ecfdf3' : '#fee2e2', color: error.startsWith('Temporary') ? '#16a34a' : ACE_RED, borderRadius: 8, padding: 10, fontSize: '.78rem', fontWeight: 800 }}>{error}</div>}
      <Section title="System Access">
        <InfoGrid rows={[
          ['Login Created', access.login_created ? 'Yes' : 'No'],
          ['Login Active', access.login_active ? 'Yes' : 'No'],
          ['Username', access.username || '—'],
          ['Company Email', access.company_email || '—'],
          ['Role', access.role_name || '—'],
          ['Account Status', access.account_status],
          ['Last Login', access.last_login_at || '—'],
          ['Welcome Email', access.welcome_email_sent ? 'Sent' : 'Pending'],
          ['Welcome Sent At', access.welcome_email_sent_at || '—'],
          ['Password Reset Required', access.password_reset_required ? 'Yes' : 'No'],
          ['Account Locked', access.account_locked ? 'Yes' : 'No'],
          ['Permission Scope', (access.permission_scope || []).join(', ') || '—'],
        ]} />
      </Section>
      {!canManageAccess && <RiskTag label="View only: system access actions require HR Admin or System Admin" tone="amber" />}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Button onClick={() => run('Create Login', () => createLogin(employee.id))} forcedDisabled={access.login_created || !access.company_email}>Create Login</Button>
        <Button onClick={() => run('Send Welcome Email', () => apiFetch('/api/auth/send-welcome', { method: 'POST', body: JSON.stringify({ employee_codes: [employee.employee_code] }) }).then(r => r.ok ? fetchSystemAccess(employee.id) : Promise.reject(new Error('Send failed'))))} forcedDisabled={!access.login_created}>Send Welcome Email</Button>
        <Button onClick={() => run('Resend Welcome Email', () => apiFetch('/api/auth/send-welcome', { method: 'POST', body: JSON.stringify({ employee_codes: [employee.employee_code] }) }).then(r => r.ok ? fetchSystemAccess(employee.id) : Promise.reject(new Error('Send failed'))))} forcedDisabled={!access.login_created}>Resend Welcome Email</Button>
        <Button onClick={() => run('Reset Password', () => resetEmployeePassword(employee.id))} forcedDisabled={!access.login_created}>Reset Password</Button>
        <Button onClick={() => run('Enable Login', () => updateSystemAccess(employee.id, { is_active: true }))} forcedDisabled={!access.login_created || access.login_active}>Enable Login</Button>
        <Button danger onClick={() => run('Disable Login', () => updateSystemAccess(employee.id, { is_active: false }))} forcedDisabled={!access.login_created || !access.login_active}>Disable Login</Button>
        <Button danger onClick={() => run('Lock Account', () => updateSystemAccess(employee.id, { locked: true }))} forcedDisabled={!access.login_created || access.account_locked}>Lock Account</Button>
        <Button onClick={() => run('Unlock Account', () => updateSystemAccess(employee.id, { locked: false }))} forcedDisabled={!access.login_created || !access.account_locked}>Unlock Account</Button>
      </div>
      {!access.company_email && <RiskTag label="Company email is required before login creation" />}
      {employee.status === 'TERMINATED' && access.login_active && <RiskTag label="Terminated employees must not have active login" />}
      {access.read_only && <RiskTag label="Archived employee is read-only" tone="amber" />}
    </div>
  )
}

function ReadinessTab({ employee }) {
  const [row, setRow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    setLoading(true)
    fetchProjectReadiness(employee.id)
      .then(setRow)
      .catch(err => setError(err.message || 'Readiness unavailable'))
      .finally(() => setLoading(false))
  }, [employee.id])
  if (loading) return <DrawerSkeleton />
  if (!row) return <div style={{ color: ACE_RED, fontWeight: 800 }}>{error || 'Readiness unavailable'}</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Section title="Project Readiness">
        <InfoGrid rows={[
          ['Readiness Status', row.readiness_status],
          ['Readiness Score', `${row.readiness_score}%`],
          ['Project Assignment Required', row.project_assignment_required ? 'Yes' : 'No'],
          ['Active Assignments', row.active_assignment_count],
          ['Clock Eligibility', row.clock?.status || '—'],
          ['KPI Eligibility', row.kpi?.status || '—'],
        ]} />
      </Section>
      <RequirementList title="Missing Requirements" rows={row.missing_requirements || []} empty="Ready for project assignment" />
      <RequirementList title="Clock Blocking Reasons" rows={row.clock?.blocking_reasons || []} empty="Clock eligible" />
      <RequirementList title="KPI Blocking Reasons" rows={row.kpi?.blocking_reasons || []} empty="KPI eligible" />
    </div>
  )
}

function RequirementList({ title, rows, empty }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', padding: 12 }}>
      <div style={{ fontSize: '.82rem', fontWeight: 900, color: '#344054', marginBottom: 8 }}>{title}</div>
      {rows.length === 0 ? (
        <div style={{ fontSize: '.76rem', fontWeight: 800, color: '#16a34a' }}>{empty}</div>
      ) : rows.map(row => (
        <div key={row} style={{ fontSize: '.76rem', color: '#b45309', fontWeight: 800, padding: '5px 0', borderTop: '1px solid #f2f4f7' }}>{row}</div>
      ))}
    </div>
  )
}

// ─── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab({ logs, auditLogs = [] }) {
  const lifecycleRows = logs || []
  const auditRows = auditLogs || []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Section title="Audit Summary">
        <InfoGrid rows={[
          ['Lifecycle Events', lifecycleRows.length],
          ['Audit Events', auditRows.length],
          ['Latest Audit', auditRows[0]?.action_label || lifecycleRows[0]?.to_status || '—'],
          ['Latest Date', auditRows[0]?.created_at?.slice(0, 10) || lifecycleRows[0]?.effective_date || '—'],
        ]} />
      </Section>

      {auditRows.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 12 }}>Audit Timeline</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {auditRows.map(log => (
              <div key={log.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '.82rem', fontWeight: 900, color: '#101828' }}>{log.action_label || log.action}</div>
                    <div style={{ fontSize: '.72rem', color: '#667085', marginTop: 3 }}>
                      {log.changed_by_name || 'System'} · {formatDateYmd(log.created_at) || log.created_at || '—'} · {log.source || 'HR'}
                    </div>
                  </div>
                  <span style={{ fontSize: '.68rem', fontWeight: 900, color: ACE_BLUE, background: '#eef2ff', borderRadius: 99, padding: '3px 8px', whiteSpace: 'nowrap' }}>
                    {(log.changed_fields || []).length} fields
                  </span>
                </div>
                {(log.changed_fields || []).length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
                    {log.changed_fields.slice(0, 8).map(field => (
                      <span key={field} style={{ fontSize: '.68rem', fontWeight: 800, color: '#475467', background: '#f2f4f7', borderRadius: 4, padding: '3px 6px' }}>{field}</span>
                    ))}
                  </div>
                )}
                {log.old_value && log.new_value && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                    <AuditValueBox title="Before" value={log.old_value} />
                    <AuditValueBox title="After" value={log.new_value} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
      <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 12 }}>Lifecycle History</div>
      <div style={{ position: 'relative', paddingLeft: 24 }}>
        <div style={{ position: 'absolute', left: 8, top: 6, bottom: 6, width: 2, background: 'var(--color-border-tertiary)' }} />
        {lifecycleRows.map(log => {
          const cfg = STATUS_CONFIG[log.to_status] || {}
          return (
            <div key={log.id} style={{ position: 'relative', marginBottom: 16 }}>
              <div style={{ position: 'absolute', left: -20, top: 2, width: 10, height: 10, borderRadius: '50%', background: cfg.color || '#94a3b8', border: '2px solid white' }} />
              <div style={{ fontSize: '.78rem', fontWeight: 700, color: cfg.color || 'var(--color-text-primary)' }}>
                {log.from_status ? `${log.from_status} → ` : ''}{log.to_status}
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                {log.effective_date}{log.reason ? ` · ${log.reason}` : ''}
              </div>
            </div>
          )
        })}
      </div>
      </div>
    </div>
  )
}

function AuditValueBox({ title, value }) {
  const entries = Object.entries(value || {}).slice(0, 4)
  return (
    <div style={{ border: '1px solid #edf0f5', background: '#f5f7fb', borderRadius: 6, padding: 8, minWidth: 0 }}>
      <div style={{ fontSize: '.66rem', fontWeight: 900, color: '#667085', marginBottom: 5 }}>{title}</div>
      {entries.length === 0 ? (
        <div style={{ fontSize: '.7rem', color: '#98a2b3' }}>—</div>
      ) : entries.map(([key, val]) => (
        <div key={key} style={{ fontSize: '.7rem', color: '#475467', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <b>{key}:</b> {String(val ?? '—')}
        </div>
      ))}
    </div>
  )
}

// ─── Reset Password Modal ──────────────────────────────────────────────────────
function ResetPasswordModal({ employee, onClose, onSuccess }) {
  const [password, setPassword] = useState('ACE1234')
  const [mustChange, setMustChange] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const isLong = password.length >= 8
  const policyOk = hasLetter && hasNumber && isLong

  async function submit(e) {
    e.preventDefault()
    if (!policyOk) { setError('รหัสผ่านต้องมีตัวอักษร + ตัวเลข อย่างน้อย 8 ตัว'); return }
    setSaving(true); setError('')
    try {
      const res = await apiFetch(`/api/auth/users/${employee.employee_code}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password: password, must_change_password: mustChange }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.detail || 'Reset failed'); return }
      onSuccess?.(`รีเซ็ตรหัสผ่านของ ${employee.full_name} เรียบร้อย`)
      onClose()
    } catch { setError('ไม่สามารถเชื่อมต่อ server') } finally { setSaving(false) }
  }

  const overlay = { position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const card = { background: '#fff', borderRadius: 14, boxShadow: '0 24px 60px rgba(15,23,42,.22)', padding: 28, width: 360, maxWidth: '92vw' }
  const inp = { width: '100%', boxSizing: 'border-box', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '9px 12px', fontSize: '.9rem', outline: 'none' }
  const Rule = ({ ok, text }) => <div style={{ fontSize: 12, color: ok ? '#16a34a' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}><span>{ok ? '✓' : '○'}</span>{text}</div>

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={card}>
        <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>Reset Password</div>
        <div style={{ fontSize: '.82rem', color: '#64748b', marginBottom: 18 }}>{employee.full_name} ({employee.employee_code})</div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 4, fontSize: '.82rem', fontWeight: 600, color: '#374151' }}>รหัสผ่านใหม่</div>
          <input style={inp} value={password} onChange={e => setPassword(e.target.value)} type="text" placeholder="ACE1234" />
          {password.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6 }}>
              <Rule ok={isLong} text="อย่างน้อย 8 ตัวอักษร" />
              <Rule ok={hasLetter} text="มีตัวอักษร (a-z, A-Z)" />
              <Rule ok={hasNumber} text="มีตัวเลข (0-9)" />
            </div>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: '.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={mustChange} onChange={e => setMustChange(e.target.checked)} style={{ width: 16, height: 16 }} />
            บังคับให้ตั้งรหัสผ่านใหม่เมื่อ login ครั้งแรก
          </label>
          {error && <div style={{ marginTop: 10, fontSize: '.83rem', color: '#dc2626', fontWeight: 600 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button type="submit" disabled={saving || !policyOk} style={{ flex: 1, background: policyOk ? '#2447d8' : '#94a3b8', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 700, cursor: policyOk ? 'pointer' : 'default', fontSize: '.88rem' }}>
              {saving ? 'กำลัง Reset…' : 'Reset Password'}
            </button>
            <button type="button" onClick={onClose} style={{ flex: 1, background: '#f1f5f9', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 0', fontWeight: 600, cursor: 'pointer', fontSize: '.88rem' }}>
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Contract Form Modal ───────────────────────────────────────────────────────
const EMPLOYMENT_TYPES = ['Permanent', 'Outsource', 'Subcontractor']
const CONTRACT_TYPE_OPTIONS = {
  Permanent: ['Permanent'],
  Outsource: ['Contract 2 Months', 'Contract 3 Months', 'Contract 5 Months', 'Contract 6 Months', 'Contract 12 Months'],
  Subcontractor: ['Subcontractor DAILY', 'Subcontractor Per-Site'],
}

function contractDurationMonths(contractType) {
  if (!contractType) return null
  const m = /(\d+)\s*Months?/i.exec(contractType)
  return m ? parseInt(m[1], 10) : null
}

function addMonths(dateStr, months) {
  if (!dateStr || !months) return ''
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function ContractFormModal({ employeeId, currentContract, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    const c = currentContract || {}
    return {
      employment_type: c.employment_type || 'Permanent',
      contract_type: c.contract_type || 'Permanent',
      contract_start_date: c.contract_start_date || '',
      contract_end_date: c.contract_end_date || '',
      hire_date: c.hire_date || '',
      job_level: c.job_level || '',
      notes: c.notes || '',
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  function setEmploymentType(v) {
    const firstCt = CONTRACT_TYPE_OPTIONS[v][0]
    setForm(p => ({ ...p, employment_type: v, contract_type: firstCt }))
  }

  function setContractType(v) {
    const months = contractDurationMonths(v)
    setForm(p => {
      const next = { ...p, contract_type: v }
      if (months && p.contract_start_date) {
        next.contract_end_date = addMonths(p.contract_start_date, months)
      }
      return next
    })
  }

  function setStartDate(v) {
    const months = contractDurationMonths(form.contract_type)
    setForm(p => ({
      ...p,
      contract_start_date: v,
      contract_end_date: months ? addMonths(v, months) : p.contract_end_date,
    }))
  }

  const contractOptions = CONTRACT_TYPE_OPTIONS[form.employment_type] || []
  const durationMonths = contractDurationMonths(form.contract_type)

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await apiFetch(`${API_BASE}/employees/${employeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employment_type: form.employment_type || null,
          contract_type: form.contract_type || null,
          contract_start_date: form.contract_start_date || null,
          contract_end_date: form.contract_end_date || null,
          contract_duration_months: durationMonths,
          hire_date: form.hire_date || null,
          job_level: form.job_level || null,
          notes: form.notes || null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      onSaved?.()
      onClose()
    } catch (e) {
      setError(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--color-background-primary)', borderRadius: 16, padding: 24, width: 500, boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>Update Contract / Employment</div>
        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 8, padding: '8px 12px', fontSize: '.78rem', fontWeight: 700, marginBottom: 12 }}>⚠ {error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FormField label="Employment Type">
              <select value={form.employment_type} onChange={e => setEmploymentType(e.target.value)} style={INPUT}>
                {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Contract Type">
              <select value={form.contract_type} onChange={e => setContractType(e.target.value)} style={INPUT}>
                {contractOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <FormField label="Hire Date">
              <input type="date" value={form.hire_date} onChange={e => set('hire_date', e.target.value)} style={INPUT} />
            </FormField>
            <FormField label="Contract Start">
              <input type="date" value={form.contract_start_date} onChange={e => setStartDate(e.target.value)} style={INPUT} />
            </FormField>
            <FormField label={durationMonths ? `Contract End (auto +${durationMonths}m)` : 'Contract End'}>
              <input type="date" value={form.contract_end_date} onChange={e => set('contract_end_date', e.target.value)} style={INPUT} />
            </FormField>
          </div>
          <FormField label="Job Level"><input value={form.job_level} onChange={e => set('job_level', e.target.value)} placeholder="L1, L2, L3…" style={INPUT} /></FormField>
          <FormField label="Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...INPUT, resize: 'vertical' }} /></FormField>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={BTN_SECONDARY}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ ...BTN_PRIMARY, background: saving ? '#94a3b8' : '#16a34a' }}>
            {saving ? 'Saving…' : '✓ Save Contract'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HR SETTINGS MODAL  — Manage Departments & Positions
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_DEPT = { code: '', name: '' }
const EMPTY_POS  = { name: '', dept_id: '', clock_type: 'DAILY', gps_required: false, photo_required: false }

function HRSettingsModal({ onClose, onSaved }) {
  const [tab, setTab] = useState('depts')
  const [saving, setSaving] = useState(false)

  // local working copies — commit to module-level on Save
  const [depts,     setDepts]     = useState(() => MOCK_DEPARTMENTS.map(d => ({ ...d })))
  const [positions, setPositions] = useState(() => MOCK_POSITIONS.map(p => ({ ...p })))

  // Load from API on mount (override MOCK if API has data)
  useEffect(() => {
    apiFetch(`${API_BASE}/hr/departments?active_only=false`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.data?.length) {
          setDepts(d.data.map(x => ({ id: x.id, code: x.code, name: x.name, sort_order: x.sort_order, is_active: x.is_active, _api: true })))
        }
      }).catch(() => {})
    apiFetch(`${API_BASE}/hr/positions?active_only=false`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.data?.length) {
          setPositions(d.data.map(x => ({
            id: x.id, name: x.name, dept_code: x.dept_code, dept_id: x.id,  // local dept_id fallback
            clock_type: x.clock_type, gps_required: x.gps_required, photo_required: x.photo_required,
            system_role: x.system_role, section_name: x.section_name, sort_order: x.sort_order, is_active: x.is_active, _api: true,
          })))
        }
      }).catch(() => {})
  }, [])

  // Department CRUD state
  const [deptEditId, setDeptEditId] = useState(null)
  const [deptDraft,  setDeptDraft]  = useState(EMPTY_DEPT)
  const [addingDept, setAddingDept] = useState(false)
  const [newDept,    setNewDept]    = useState(EMPTY_DEPT)
  const [deptError,  setDeptError]  = useState('')

  // Position CRUD state
  const [posEditId,  setPosEditId]  = useState(null)
  const [posDraft,   setPosDraft]   = useState(EMPTY_POS)
  const [addingPos,  setAddingPos]  = useState(false)
  const [newPos,     setNewPos]     = useState({ ...EMPTY_POS, dept_id: MOCK_DEPARTMENTS[0]?.id || 1 })
  const [posFilter,  setPosFilter]  = useState('')
  const [posError,   setPosError]   = useState('')

  // ── Save all changes to API + module-level fallback ──────────
  async function handleSave() {
    setSaving(true)
    try {
      // Sync departments to API
      for (const d of depts) {
        const body = JSON.stringify({ code: d.code, name: d.name, sort_order: d.sort_order || 0, is_active: d.is_active !== false })
        if (d._api && d.id) {
          await apiFetch(`${API_BASE}/hr/departments/${d.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body })
        } else {
          await apiFetch(`${API_BASE}/hr/departments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
        }
      }
      // Sync positions
      for (const p of positions) {
        const body = JSON.stringify({
          name: p.name, dept_code: p.dept_code || null, section_name: p.section_name || null,
          clock_type: p.clock_type || 'DAILY', gps_required: !!p.gps_required, photo_required: !!p.photo_required,
          system_role: p.system_role || 'EMPLOYEE', sort_order: p.sort_order || 0, is_active: p.is_active !== false,
        })
        if (p._api && p.id) {
          await apiFetch(`${API_BASE}/hr/positions/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body })
        } else {
          await apiFetch(`${API_BASE}/hr/positions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
        }
      }
      MOCK_DEPARTMENTS = depts
      MOCK_POSITIONS   = positions
      onSaved()
      onClose()
    } catch (e) {
      alert(`Save failed: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  // ── Department helpers ────────────────────────────────────────
  function startEditDept(d) {
    setDeptEditId(d.id)
    setDeptDraft({ code: d.code, name: d.name })
    setDeptError('')
    setAddingDept(false)
  }

  function confirmEditDept() {
    if (!deptDraft.code.trim() || !deptDraft.name.trim()) { setDeptError('Code and Name are required'); return }
    const codeUpper = deptDraft.code.trim().toUpperCase()
    if (depts.some(d => d.code === codeUpper && d.id !== deptEditId)) { setDeptError('Code already used'); return }
    setDepts(prev => prev.map(d => d.id === deptEditId ? { ...d, code: codeUpper, name: deptDraft.name.trim() } : d))
    setDeptEditId(null)
    setDeptError('')
  }

  function confirmAddDept() {
    if (!newDept.code.trim() || !newDept.name.trim()) { setDeptError('Code and Name are required'); return }
    const codeUpper = newDept.code.trim().toUpperCase()
    if (depts.some(d => d.code === codeUpper)) { setDeptError('Code already used'); return }
    const id = Math.max(...depts.map(d => d.id), 0) + 1
    setDepts(prev => [...prev, { id, code: codeUpper, name: newDept.name.trim() }])
    setNewDept(EMPTY_DEPT)
    setAddingDept(false)
    setDeptError('')
  }

  function deleteDept(id) {
    if (positions.some(p => p.dept_id === id)) {
      setDeptError('Cannot delete — positions are using this department.')
      return
    }
    setDepts(prev => prev.filter(d => d.id !== id))
    setDeptError('')
  }

  // ── Position helpers ──────────────────────────────────────────
  function startEditPos(p) {
    setPosEditId(p.id)
    setPosDraft({ name: p.name, dept_id: p.dept_id, clock_type: p.clock_type, gps_required: p.gps_required, photo_required: p.photo_required })
    setPosError('')
    setAddingPos(false)
  }

  function confirmEditPos() {
    if (!posDraft.name.trim()) { setPosError('Name is required'); return }
    setPositions(prev => prev.map(p => p.id === posEditId ? { ...p, ...posDraft, dept_id: parseInt(posDraft.dept_id, 10), name: posDraft.name.trim() } : p))
    setPosEditId(null)
    setPosError('')
  }

  function confirmAddPos() {
    if (!newPos.name.trim() || !newPos.dept_id) { setPosError('Name and Department are required'); return }
    const id = Math.max(...positions.map(p => p.id), 0) + 1
    setPositions(prev => [...prev, { id, ...newPos, dept_id: parseInt(newPos.dept_id, 10), name: newPos.name.trim() }])
    setNewPos({ ...EMPTY_POS, dept_id: depts[0]?.id || 1 })
    setAddingPos(false)
    setPosError('')
  }

  function deletePos(id) {
    if (MOCK_EMPLOYEES.some(e => e.position?.id === id)) {
      setPosError('Cannot delete — employees are assigned to this position.')
      return
    }
    setPositions(prev => prev.filter(p => p.id !== id))
    setPosError('')
  }

  const filteredPositions = posFilter
    ? positions.filter(p => p.dept_id === parseInt(posFilter, 10))
    : positions

  const deptName = id => depts.find(d => d.id === id)?.name || '—'

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 18, width: 640, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 28px 80px rgba(0,0,0,.22)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: ACE_GRADIENT, padding: '18px 24px', color: '#fff', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>⚙ HR Settings</div>
              <div style={{ fontSize: '.76rem', color: 'rgba(255,255,255,.75)', marginTop: 2 }}>Manage departments and positions</div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontWeight: 900 }}>✕</button>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
            {[{ id: 'depts', label: '🏢 Departments', count: depts.length }, { id: 'positions', label: '💼 Positions', count: positions.length }].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '.8rem',
                  background: tab === t.id ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.15)',
                  color:      tab === t.id ? ACE_BLUE : '#fff',
                }}
              >
                {t.label}
                <span style={{ marginLeft: 6, background: tab === t.id ? ACE_BLUE : 'rgba(255,255,255,.25)', color: tab === t.id ? '#fff' : '#fff', fontSize: '.68rem', padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

          {/* ── Departments Tab ── */}
          {tab === 'depts' && (
            <div>
              {deptError && <ErrBanner msg={deptError} onClose={() => setDeptError('')} />}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '.78rem', color: '#64748b', fontWeight: 600 }}>{depts.length} departments</span>
                <button
                  onClick={() => { setAddingDept(true); setDeptEditId(null); setDeptError('') }}
                  style={{ ...BTN_PRIMARY, padding: '6px 14px', fontSize: '.76rem' }}
                >+ Add Department</button>
              </div>

              {/* Add form */}
              {addingDept && (
                <div style={{ ...SETTINGS_ROW, background: '#f0f9ff', border: '1px solid #bae6fd', marginBottom: 8 }}>
                  <input autoFocus value={newDept.code} onChange={e => setNewDept(p => ({ ...p, code: e.target.value }))} placeholder="CODE" style={{ ...INPUT_SM, width: 90, textTransform: 'uppercase' }} />
                  <input value={newDept.name} onChange={e => setNewDept(p => ({ ...p, name: e.target.value }))} placeholder="Department Name" style={{ ...INPUT_SM, flex: 1 }} />
                  <button onClick={confirmAddDept} style={{ ...BTN_PRIMARY, padding: '5px 12px', fontSize: '.76rem' }}>Add</button>
                  <button onClick={() => { setAddingDept(false); setNewDept(EMPTY_DEPT); setDeptError('') }} style={{ ...BTN_SECONDARY, padding: '5px 10px', fontSize: '.76rem' }}>✕</button>
                </div>
              )}

              {/* List */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 80px', background: '#f5f7fb', borderBottom: '1px solid #e2e8f0', padding: '8px 14px' }}>
                  {['Code', 'Name', 'Positions', 'Actions'].map(h => (
                    <span key={h} style={{ fontSize: '.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{h}</span>
                  ))}
                </div>
                {depts.map((d, i) => (
                  <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 80px', alignItems: 'center', padding: '10px 14px', borderBottom: i < depts.length - 1 ? '1px solid #f1f5f9' : 'none', background: deptEditId === d.id ? '#fefce8' : '#fff' }}>
                    {deptEditId === d.id ? (
                      <>
                        <input value={deptDraft.code} onChange={e => setDeptDraft(p => ({ ...p, code: e.target.value }))} style={{ ...INPUT_SM, textTransform: 'uppercase' }} />
                        <input value={deptDraft.name} onChange={e => setDeptDraft(p => ({ ...p, name: e.target.value }))} style={{ ...INPUT_SM, marginLeft: 4 }} />
                        <span style={{ fontSize: '.75rem', color: '#94a3b8' }}>{positions.filter(p => p.dept_id === d.id).length} positions</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={confirmEditDept} style={{ ...BTN_PRIMARY, padding: '3px 8px', fontSize: '.72rem' }}>✓</button>
                          <button onClick={() => { setDeptEditId(null); setDeptError('') }} style={{ ...BTN_SECONDARY, padding: '3px 8px', fontSize: '.72rem' }}>✕</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '.78rem', fontWeight: 800, color: ACE_BLUE }}>{d.code}</span>
                        <span style={{ fontSize: '.82rem', fontWeight: 600, color: '#0f172a' }}>{d.name}</span>
                        <span style={{ fontSize: '.74rem', color: '#64748b' }}>{positions.filter(p => p.dept_id === d.id).length} positions</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => startEditDept(d)} style={CRUD_BTN} title="Edit">✏</button>
                          <button onClick={() => deleteDept(d.id)} style={{ ...CRUD_BTN, color: '#dc2626' }} title="Delete">🗑</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {depts.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: '.82rem' }}>No departments yet</div>
                )}
              </div>
            </div>
          )}

          {/* ── Positions Tab ── */}
          {tab === 'positions' && (
            <div>
              {posError && <ErrBanner msg={posError} onClose={() => setPosError('')} />}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <select value={posFilter} onChange={e => setPosFilter(e.target.value)} style={{ ...INPUT_SM, width: 180 }}>
                  <option value="">All Departments</option>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <button
                  onClick={() => { setAddingPos(true); setPosEditId(null); setPosError('') }}
                  style={{ ...BTN_PRIMARY, padding: '6px 14px', fontSize: '.76rem' }}
                >+ Add Position</button>
              </div>

              {/* Add form */}
              {addingPos && (
                <div style={{ ...CARD_STYLE, marginBottom: 10, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                  <div style={{ fontWeight: 700, fontSize: '.8rem', marginBottom: 10, color: ACE_BLUE }}>New Position</div>
                  <PosForm form={newPos} setForm={setNewPos} depts={depts} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                    <button onClick={() => { setAddingPos(false); setNewPos({ ...EMPTY_POS, dept_id: depts[0]?.id || 1 }); setPosError('') }} style={{ ...BTN_SECONDARY, padding: '5px 12px', fontSize: '.76rem' }}>Cancel</button>
                    <button onClick={confirmAddPos} style={{ ...BTN_PRIMARY, padding: '5px 12px', fontSize: '.76rem' }}>Add Position</button>
                  </div>
                </div>
              )}

              {/* List */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 80px 60px 60px 70px', background: '#f5f7fb', borderBottom: '1px solid #e2e8f0', padding: '8px 14px', gap: 4 }}>
                  {['Name', 'Department', 'Clock', 'GPS', 'Photo', 'Actions'].map(h => (
                    <span key={h} style={{ fontSize: '.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{h}</span>
                  ))}
                </div>
                {filteredPositions.map((p, i) => (
                  <div key={p.id} style={{ borderBottom: i < filteredPositions.length - 1 ? '1px solid #f1f5f9' : 'none', background: posEditId === p.id ? '#fefce8' : '#fff' }}>
                    {posEditId === p.id ? (
                      <div style={{ padding: '12px 14px' }}>
                        <PosForm form={posDraft} setForm={setPosDraft} depts={depts} />
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => { setPosEditId(null); setPosError('') }} style={{ ...BTN_SECONDARY, padding: '4px 10px', fontSize: '.74rem' }}>Cancel</button>
                          <button onClick={confirmEditPos} style={{ ...BTN_PRIMARY, padding: '4px 10px', fontSize: '.74rem' }}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 80px 60px 60px 70px', alignItems: 'center', padding: '10px 14px', gap: 4 }}>
                        <span style={{ fontSize: '.82rem', fontWeight: 600, color: '#0f172a' }}>{p.name}</span>
                        <span style={{ fontSize: '.74rem', color: '#64748b' }}>{deptName(p.dept_id)}</span>
                        <span>
                          <span style={{ fontSize: '.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: p.clock_type === 'PER_SITE' ? '#ede9fe' : '#e0f2fe', color: p.clock_type === 'PER_SITE' ? '#7c3aed' : '#0369a1' }}>
                            {p.clock_type === 'PER_SITE' ? 'Per Site' : 'Daily'}
                          </span>
                        </span>
                        <BoolDot val={p.gps_required} />
                        <BoolDot val={p.photo_required} />
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => startEditPos(p)} style={CRUD_BTN} title="Edit">✏</button>
                          <button onClick={() => deletePos(p.id)} style={{ ...CRUD_BTN, color: '#dc2626' }} title="Delete">🗑</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {filteredPositions.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: '.82rem' }}>No positions found</div>
                )}
              </div>
            </div>
          )}
        </div>
        {errors.submit && <div style={{ padding: '0 24px 10px', color: '#dc2626', fontSize: '.78rem', fontWeight: 800 }}>{errors.submit}</div>}

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: '#f5f7fb' }}>
          <span style={{ fontSize: '.76rem', color: '#94a3b8' }}>Changes apply when you click Save</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ ...BTN_SECONDARY, padding: '7px 18px' }}>Cancel</button>
            <button onClick={handleSave} style={{ ...BTN_PRIMARY, padding: '7px 18px', background: '#16a34a' }}>✓ Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Sub-form: position fields (shared by add + edit)
function PosForm({ form, setForm, depts }) {
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <FormField label="Position Name *">
          <input value={form.name} onChange={e => set('name', e.target.value)} style={INPUT} placeholder="e.g. RF Engineer" />
        </FormField>
        <FormField label="Department *">
          <select value={form.dept_id} onChange={e => set('dept_id', e.target.value)} style={INPUT}>
            <option value="">— Select —</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </FormField>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <FormField label="Clock Type">
          <select value={form.clock_type} onChange={e => set('clock_type', e.target.value)} style={INPUT}>
            <option value="DAILY">Daily</option>
            <option value="PER_SITE">Per Site</option>
          </select>
        </FormField>
        <FormField label="GPS Required">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, paddingLeft: 4 }}>
            <input type="checkbox" id="gps" checked={form.gps_required} onChange={e => set('gps_required', e.target.checked)} style={{ width: 16, height: 16, accentColor: ACE_BLUE }} />
            <label htmlFor="gps" style={{ fontSize: '.8rem', cursor: 'pointer', fontWeight: 600, color: form.gps_required ? ACE_BLUE : '#64748b' }}>GPS Required</label>
          </div>
        </FormField>
        <FormField label="Photo Required">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, paddingLeft: 4 }}>
            <input type="checkbox" id="photo" checked={form.photo_required} onChange={e => set('photo_required', e.target.checked)} style={{ width: 16, height: 16, accentColor: ACE_BLUE }} />
            <label htmlFor="photo" style={{ fontSize: '.8rem', cursor: 'pointer', fontWeight: 600, color: form.photo_required ? ACE_BLUE : '#64748b' }}>Photo Required</label>
          </div>
        </FormField>
      </div>
    </div>
  )
}

function BoolDot({ val }) {
  return (
    <span style={{ width: 10, height: 10, borderRadius: '50%', background: val ? '#16a34a' : '#e2e8f0', display: 'inline-block', marginLeft: 4 }} title={val ? 'Yes' : 'No'} />
  )
}

function ErrBanner({ msg, onClose }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fee2e2', color: '#b91c1c', padding: '8px 12px', borderRadius: 8, marginBottom: 10, fontSize: '.78rem', fontWeight: 600 }}>
      <span>⚠ {msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 900, fontSize: '.9rem' }}>✕</button>
    </div>
  )
}

const SETTINGS_ROW = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10 }
const CRUD_BTN = { border: '1px solid #e2e8f0', background: '#f5f7fb', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontFamily: 'inherit', fontSize: '.78rem', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }

// ─────────────────────────────────────────────────────────────────────────────
// ADD EMPLOYEE MODAL  — 3-step wizard
// ─────────────────────────────────────────────────────────────────────────────

function generateEmployeeCode() {
  // placeholder shown while modal opens; user can edit or re-click ↻ Auto
  const ts = Date.now().toString().slice(-4)
  return `ACE-NEW-${ts}`
}

async function fetchNextEmployeeCode() {
  try {
    const r = await apiFetch(`${API_BASE}/employees/next-code`)
    if (r.ok) { const d = await r.json(); return d.next_code || generateEmployeeCode() }
  } catch (_) {}
  return generateEmployeeCode()
}

const WIZARD_STEPS = [
  { id: 1, label: 'Personal', icon: '👤' },
  { id: 2, label: 'Work',     icon: '💼' },
  { id: 3, label: 'Review',   icon: '✅' },
]

function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
      {WIZARD_STEPS.map((s, i) => {
        const done   = current > s.id
        const active = current === s.id
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < WIZARD_STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: done ? '.9rem' : '.85rem',
                background: done ? '#16a34a' : active ? ACE_BLUE : '#e2e8f0',
                color:      done || active ? '#fff' : '#94a3b8',
                transition: 'all .2s',
              }}>
                {done ? '✓' : s.icon}
              </div>
              <span style={{ fontSize: '.68rem', fontWeight: active ? 700 : 500, color: active ? ACE_BLUE : '#94a3b8', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#16a34a' : '#e2e8f0', margin: '0 8px', marginBottom: 18, transition: 'background .2s' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function FieldError({ msg }) {
  if (!msg) return null
  return <div style={{ fontSize: '.72rem', color: '#dc2626', marginTop: 3, fontWeight: 600 }}>{msg}</div>
}

function AddEmployeeModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showSettings, setShowSettings] = useState(false)
  const [settingsKey, setSettingsKey] = useState(0)   // bump to re-read MOCK_* after settings save

  const today = formatDateYmd(new Date())

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    gender: '', date_of_birth: '', password: '',
    employee_code: '',
    dept_code: 'PROJECT',
    section_code: 'RF',
    role_id: '',
    job_level: '',
    status: 'ACTIVE',
    employment_type: 'Permanent',
    contract_type: 'Permanent',
    contract_start_date: today,
    contract_end_date: '',
    hire_date: today,
  })

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  useEffect(() => {
    fetchNextEmployeeCode().then(code => set('employee_code', code))
  }, [])

  // Re-read module-level arrays after settings save
  // eslint-disable-next-line no-unused-expressions
  settingsKey  // intentional read so React re-renders after settings change

  const deptSections    = DEPT_SECTIONS[form.dept_code] || []
  const selectedSection = deptSections.find(s => s.code === form.section_code) || deptSections[0]
  const sectionRoles    = ROLE_BY_SECTION[form.section_code] || []
  const selectedRole    = sectionRoles.find(r => r.id === parseInt(form.role_id, 10))
  const selectedDept    = MOCK_DEPARTMENTS.find(d => d.code === form.dept_code)
  const isProjectDept   = form.dept_code === 'PROJECT'
  const projectAssignmentManaged = isProjectDept
  const showSection     = !projectAssignmentManaged && deptSections.length > 1
  const showProjectRole = !projectAssignmentManaged
  const showLevel       = !projectAssignmentManaged

  // ── Validation ────────────────────────────────────────────────
  function validateStep1() {
    const e = {}
    if (!form.first_name.trim())  e.first_name = 'Required'
    if (!form.last_name.trim())   e.last_name  = 'Required'
    if (!form.email.trim())       e.email      = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (form.password.trim() && (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password) || form.password.length < 8)) {
      e.password = 'Use at least 8 characters with letters and numbers'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep2() {
    const e = {}
    if (!form.employee_code.trim()) e.employee_code = 'Required'
    if (!isProjectDept && !form.role_id) e.role_id = 'Select a role / position'
    if (!form.hire_date)   e.hire_date   = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function nextStep() {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep(s => s + 1)
  }

  // ── Submit ────────────────────────────────────────────────────
  async function handleSubmit() {
    setLoading(true)
    const dept    = MOCK_DEPARTMENTS.find(d => d.code === form.dept_code)
    const sects   = DEPT_SECTIONS[form.dept_code] || []
    const section = isProjectDept ? null : (sects.find(s => s.code === form.section_code) || sects[0])
    const roles   = ROLE_BY_SECTION[form.section_code] || []
    const role    = isProjectDept ? null : roles.find(r => r.id === parseInt(form.role_id, 10))
    try {
      const response = await apiFetch(`${API_BASE}/employees`, {
        method: 'POST',
        body: JSON.stringify({
          employee_code: form.employee_code.trim(),
          email: form.email.trim(),
          full_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone: form.phone.trim() || null,
          department: dept?.name || 'Project',
          section_name: section?.name || null,
          project_team: isProjectDept ? 'UNASSIGNED' : (selectedDept?.code || 'HQ'),
          project_role: null,
          job_level: isProjectDept ? null : (form.job_level || null),
          position: isProjectDept ? 'Pending Project Assignment' : (role?.name || null),
          job_title: isProjectDept ? 'Pending Project Assignment' : (role?.name || null),
          system_role: isProjectDept ? 'EMPLOYEE' : (role?.system_role || (form.dept_code === 'HR' ? 'HR' : 'EMPLOYEE')),
          status: form.status,
          employment_type: form.employment_type,
          contract_type: form.contract_type,
          contract_start_date: form.contract_start_date || null,
          contract_end_date: form.contract_end_date || null,
          contract_duration_months: contractDurationMonths(form.contract_type),
          hire_date: form.hire_date,
          password: form.password.trim() || null,
          create_login: true,
          send_welcome_email: true,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.detail || 'Cannot create employee')
      const newEmployee = {
        id: payload.id,
        employee_code: payload.employee_code,
        full_name: payload.full_name,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: payload.email,
        phone: form.phone.trim() || '—',
        status: payload.status,
        hire_date: payload.hire_date,
        position: { name: isProjectDept ? 'Pending Project Assignment' : (role?.name || '—'), clock_type: role?.clock_type || 'DAILY', gps_required: role?.gps || false, photo_required: role?.photo || false },
        department: { id: dept?.id || 0, code: form.dept_code, name: dept?.name || '—' },
        current_contract: { contract_type: form.contract_type },
        work_location_name: '—', work_latitude: null, work_longitude: null, allowed_radius_meters: null,
      }
      MOCK_EMPLOYEES = [...MOCK_EMPLOYEES, newEmployee]
      setLoading(false)
      onSuccess(newEmployee, payload.notification)
    } catch (error) {
      setLoading(false)
      setErrors(e => ({ ...e, submit: error.message }))
    }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 18, width: 520,
        boxShadow: '0 28px 80px rgba(0,0,0,.22)',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ background: ACE_GRADIENT, padding: '20px 24px 18px', color: '#fff', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>Add New Employee</div>
              <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.75)', marginTop: 2 }}>
                Step {step} of {WIZARD_STEPS.length}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontWeight: 900, fontSize: '1rem' }}>✕</button>
          </div>
          <StepIndicator current={step} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px' }}>

          {/* ─── Step 1: Personal ─── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="First Name *">
                  <input value={form.first_name} onChange={e => set('first_name', e.target.value)} style={{ ...INPUT, borderColor: errors.first_name ? '#dc2626' : undefined }} placeholder="Peerapol" />
                  <FieldError msg={errors.first_name} />
                </FormField>
                <FormField label="Last Name *">
                  <input value={form.last_name} onChange={e => set('last_name', e.target.value)} style={{ ...INPUT, borderColor: errors.last_name ? '#dc2626' : undefined }} placeholder="Jaidee" />
                  <FieldError msg={errors.last_name} />
                </FormField>
              </div>

              <FormField label="Email *">
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={{ ...INPUT, borderColor: errors.email ? '#dc2626' : undefined }} placeholder="name@airconnect-e.com" />
                <FieldError msg={errors.email} />
              </FormField>

              <FormField label="Password">
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} style={{ ...INPUT, borderColor: errors.password ? '#dc2626' : undefined }} placeholder="Leave blank to auto-generate" />
                <FieldError msg={errors.password} />
              </FormField>

              <FormField label="Phone">
                <input value={form.phone} onChange={e => set('phone', e.target.value)} style={INPUT} placeholder="+66-81-000-0000" />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Gender">
                  <select value={form.gender} onChange={e => set('gender', e.target.value)} style={INPUT}>
                    <option value="">— Select —</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </FormField>
                <FormField label="Date of Birth">
                  <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} style={INPUT} />
                </FormField>
              </div>
            </div>
          )}

          {/* ─── Step 2: Work ─── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FormField label="Employee Code *">
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={form.employee_code}
                    onChange={e => set('employee_code', e.target.value.toUpperCase())}
                    style={{ ...INPUT, borderColor: errors.employee_code ? '#dc2626' : undefined, flex: 1 }}
                    placeholder="ACE-001"
                  />
                  <button
                    onClick={() => fetchNextEmployeeCode().then(code => set('employee_code', code))}
                    style={{ ...BTN_SECONDARY, padding: '7px 12px', fontSize: '.75rem', whiteSpace: 'nowrap', borderRadius: 10 }}
                    title="Auto-generate next code"
                  >
                    ↻ Auto
                  </button>
                </div>
                <FieldError msg={errors.employee_code} />
              </FormField>

              {/* Department */}
              <FormField label="Department">
                <select
                  value={form.dept_code}
                  onChange={e => {
                    const dc = e.target.value
                    const sects = DEPT_SECTIONS[dc] || []
                    set('dept_code', dc)
                    set('section_code', sects[0]?.code || '')
                    set('role_id', '')
                    set('job_level', '')
                  }}
                  style={INPUT}
                >
                  {MOCK_DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                </select>
              </FormField>

              {/* Section (only shown when dept has multiple sections, e.g. Project) */}
              {showSection && (
                <FormField label="Section">
                  <select
                    value={form.section_code}
                    onChange={e => { set('section_code', e.target.value); set('role_id', ''); set('job_level', '') }}
                    style={INPUT}
                  >
                    {deptSections.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                  </select>
                </FormField>
              )}

              {projectAssignmentManaged && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 14px', fontSize: '.78rem', color: '#2447d8', fontWeight: 750, lineHeight: 1.55 }}>
                  Project Management role setup is handled in ProjectPageManagement.
                  HR creates the employee profile only. RF/TE, Role / Position, Job Level, project code, and assignment will be completed by Project Operations.
                  <div style={{ marginTop: 8 }}>
                    <a href="/ProjectPageManagement" style={{ color: ACE_BLUE, fontWeight: 900, textDecoration: 'none' }}>Open ProjectPageManagement</a>
                  </div>
                </div>
              )}

              {/* Role fields — HR manages all non-Project departments. Project Management is assigned in ProjectPageManagement. */}
              {showProjectRole ? (
                <div style={{ display: 'grid', gridTemplateColumns: showLevel ? '1fr 1fr' : '1fr', gap: 12 }}>
                  <FormField label="Role / Position *">
                    <select
                      value={form.role_id}
                      onChange={e => { set('role_id', e.target.value); set('job_level', '') }}
                      style={{ ...INPUT, borderColor: errors.role_id ? '#dc2626' : undefined }}
                    >
                      <option value="">— Select —</option>
                      {sectionRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <FieldError msg={errors.role_id} />
                  </FormField>
                  {showLevel && (
                    <FormField label="Job Level">
                      <select value={form.job_level} onChange={e => set('job_level', e.target.value)} style={INPUT}>
                        <option value="">— Select —</option>
                        {JOB_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </FormField>
                  )}
                </div>
              ) : !projectAssignmentManaged ? (
                <div style={{ background: '#f5f7fb', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', fontSize: '.76rem', color: '#667085', fontWeight: 700 }}>
                  Role / Position and Job Level are managed by the target operations module. This department does not require project role setup.
                </div>
              ) : null}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Initial Status">
                  <select value={form.status} onChange={e => set('status', e.target.value)} style={INPUT}>
                    <option value="ACTIVE">Active</option>
                    <option value="PROBATION">Probation</option>
                  </select>
                </FormField>
                <FormField label="Employment Type">
                  <select value={form.employment_type} onChange={e => {
                    const v = e.target.value
                    const firstCt = CONTRACT_TYPE_OPTIONS[v][0]
                    setForm(p => ({ ...p, employment_type: v, contract_type: firstCt }))
                  }} style={INPUT}>
                    {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Contract Type">
                  <select value={form.contract_type} onChange={e => {
                    const v = e.target.value
                    const months = contractDurationMonths(v)
                    setForm(p => ({
                      ...p,
                      contract_type: v,
                      contract_end_date: months && p.contract_start_date ? addMonths(p.contract_start_date, months) : p.contract_end_date,
                    }))
                  }} style={INPUT}>
                    {(CONTRACT_TYPE_OPTIONS[form.employment_type] || []).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>
                <FormField label="Hire Date *">
                  <input type="date" value={form.hire_date} onChange={e => set('hire_date', e.target.value)} style={{ ...INPUT, borderColor: errors.hire_date ? '#dc2626' : undefined }} />
                  <FieldError msg={errors.hire_date} />
                </FormField>
              </div>

              {/* Contract dates — only if not Permanent */}
              {form.employment_type !== 'Permanent' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <FormField label="Contract Start *">
                    <input type="date" value={form.contract_start_date} onChange={e => {
                      const v = e.target.value
                      const months = contractDurationMonths(form.contract_type)
                      setForm(p => ({ ...p, contract_start_date: v, contract_end_date: months ? addMonths(v, months) : p.contract_end_date }))
                    }} style={INPUT} />
                  </FormField>
                  <FormField label={contractDurationMonths(form.contract_type) ? `Contract End (auto +${contractDurationMonths(form.contract_type)}m)` : 'Contract End'}>
                    <input type="date" value={form.contract_end_date} onChange={e => set('contract_end_date', e.target.value)} style={INPUT} />
                  </FormField>
                </div>
              )}

              {/* Auto-derive clock_type info */}
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 14px', fontSize: '.78rem', color: '#0369a1' }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Auto-derived Settings</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>⏱ Clock: <b>{
                    form.contract_type?.includes('Per-Site') ? 'PER_SITE'
                    : form.employment_type === 'Subcontractor' && form.contract_type === 'Subcontractor DAILY' ? 'DAILY'
                    : selectedRole?.clock_type === 'PER_SITE' ? 'PER_SITE'
                    : 'DAILY'
                  }</b></span>
                  <span>🛰️ GPS: <b>Required</b></span>
                  <span>📷 Photo: <b>Required</b></span>
                </div>
              </div>

              {/* Clock type info */}
              {!isProjectDept && selectedRole && (
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 14px', fontSize: '.78rem', color: '#0369a1' }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Role Settings</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>⏱ Clock: <b>{selectedRole.clock_type === 'PER_SITE' ? 'Per Site' : 'Daily'}</b></span>
                    <span>🛰️ GPS: <b>{selectedRole.gps ? 'Required' : 'No'}</b></span>
                    <span>📷 Photo: <b>{selectedRole.photo ? 'Required' : 'No'}</b></span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Step 3: Review ─── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#f5f7fb', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                {/* Avatar preview */}
                <div style={{ background: ACE_GRADIENT, padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Avatar name={`${form.first_name} ${form.last_name}`} size={52} />
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#fff' }}>
                      {form.first_name} {form.last_name}
                    </div>
                    <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.8)', marginTop: 2 }}>
                      {form.employee_code} · {isProjectDept ? 'Pending Project Assignment' : (selectedDept?.name || '—')} {form.job_level ? `(${form.job_level})` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <StatusBadge status={form.status} />
                      <ContractBadge type={form.contract_type} />
                    </div>
                  </div>
                </div>

                {/* Info summary */}
                <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <ReviewRow label="Email"       value={form.email} />
                  <ReviewRow label="Phone"       value={form.phone || '—'} />
                  <ReviewRow label="Gender"      value={form.gender || '—'} />
                  <ReviewRow label="Date of Birth" value={form.date_of_birth || '—'} />
                  <ReviewRow label="Department"  value={selectedDept?.name || '—'} />
                  {isProjectDept && <ReviewRow label="Project Assignment" value="Pending in ProjectPageManagement" />}
                  {isProjectDept && <ReviewRow label="Role / Position" value="Managed by Project Operations" />}
                  {isProjectDept && <ReviewRow label="Job Level" value="Managed by Project Operations" />}
                  {!isProjectDept && selectedRole && <ReviewRow label="Role / Position" value={selectedRole.name} />}
                  {!isProjectDept && form.job_level && <ReviewRow label="Job Level" value={form.job_level} />}
                  <ReviewRow label="Hire Date"   value={form.hire_date} last />
                </div>
              </div>

              <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', fontSize: '.78rem', color: '#92400e', fontWeight: 600 }}>
                ⚠️ Please review all details before creating the employee record. This action will add the employee to the system.
              </div>
            </div>
          )}
        </div>

        {errors.submit && (
          <div style={{ padding: '0 24px 10px', color: '#b91c1c', fontSize: '.78rem', fontWeight: 800 }}>
            {errors.submit}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={() => step === 1 ? onClose() : setStep(s => s - 1)}
            style={{ ...BTN_SECONDARY, padding: '8px 18px' }}
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>

          {step < 3 ? (
            <button onClick={nextStep} style={{ ...BTN_PRIMARY, padding: '8px 22px', fontSize: '.84rem' }}>
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} style={{ ...BTN_PRIMARY, padding: '8px 22px', fontSize: '.84rem', background: loading ? '#94a3b8' : '#16a34a', minWidth: 140 }}>
              {loading ? '⏳ Creating…' : '✓ Create Employee'}
            </button>
          )}
        </div>
      </div>

      {/* Settings sub-modal — opens on top of wizard */}
      {showSettings && (
        <HRSettingsModal
          onClose={() => setShowSettings(false)}
          onSaved={() => {
            setSettingsKey(k => k + 1)
          }}
        />
      )}
    </div>
  )
}

function ReviewRow({ label, value, last }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: last ? 'none' : '1px solid #f1f5f9' }}>
      <span style={{ fontSize: '.75rem', color: '#64748b', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '.78rem', color: '#0f172a', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Section({ title, action, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--color-text-secondary)' }}>{title}</div>
        {action}
      </div>
      <div style={CARD_STYLE}>{children}</div>
    </div>
  )
}

function InfoGrid({ rows }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 6, columnGap: 12 }}>
      {rows.map(([label, val]) => [
        <span key={`${label}-l`} style={{ fontSize: '.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</span>,
        <span key={`${label}-v`} style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>{val}</span>,
      ])}
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  )
}

function Card({ children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)] ${className}`}>
      {children}
    </section>
  )
}

function IconButton({ children, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-[#2447d8] hover:shadow-md disabled:opacity-50"
    >
      {children}
    </button>
  )
}

function initials(name) {
  return String(name || 'HR').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'HR'
}
function formatToday() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

function MetricCard({ label, value, note, color, tone = 'neutral', icon: Icon = Activity }) {
  const isRisk = tone === 'risk'
  const isWarn = tone === 'warn'
  const accent = color || ACE_BLUE
  return (
    <div className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_70px_rgba(36,71,216,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${accent}12`, color: accent }}>
          <Icon size={21} strokeWidth={2.3} />
        </div>
        {(isRisk || isWarn) && Number(value) > 0 && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${isRisk ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
            <AlertTriangle size={13} /> Review
          </span>
        )}
      </div>
      <div className="mt-5 truncate text-sm font-bold text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black leading-none tracking-normal text-slate-950">{value}</div>
      {note && <div className="mt-2 min-h-[16px] text-xs font-semibold text-slate-400">{note}</div>}
    </div>
  )
}

function hrValue(row, keys) {
  const source = row?.hr_profile || row || {}
  for (const key of keys) {
    const value = source[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') return value
  }
  return ''
}

function hrDisplayValue(value, fallback = 'Unspecified') {
  const text = String(value || '').trim()
  return text && text !== '-' && text !== '—' ? text : fallback
}

function hrCountBy(rows, picker, fallback = 'Unspecified') {
  const counts = {}
  rows.forEach(row => {
    const key = hrDisplayValue(picker(row), fallback)
    counts[key] = (counts[key] || 0) + 1
  })
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
}

function normalizeHrCategory(value, fallback = 'Unspecified') {
  const text = String(value || '').trim()
  if (!text || text === '-' || text === '—') return fallback
  const key = text.replace(/[\s_-]+/g, ' ').trim().toUpperCase()
  const map = {
    'FULL TIME': 'Permanent',
    FULLTIME: 'Permanent',
    PERMANENT: 'Permanent',
    REGULAR: 'Permanent',
    CONTRACT: 'Contract',
    CONTRACTOR: 'Contract',
    'FIXED TERM': 'Contract',
    TEMPORARY: 'Contract',
    OUTSOURCE: 'Outsource',
    OUTSOURCED: 'Outsource',
    SUBCONTRACT: 'Outsource',
    'SUB CONTRACT': 'Outsource',
    VENDOR: 'Outsource',
    PROBATION: 'Probation',
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    TERMINATED: 'Terminated',
  }
  return map[key] || text.replace(/\b\w/g, c => c.toUpperCase())
}

function normalizeEmploymentType(value) {
  const key = String(value || '').replace(/[\s_-]+/g, ' ').trim().toUpperCase()
  if (['SUBCONTRACTOR', 'SUBCONTRACT', 'SUB CONTRACT', 'SUB CONTRACTOR'].includes(key)) return 'Subcontractor'
  if (['OUTSOURCE', 'OUTSOURCED', 'VENDOR', 'CONTRACT', 'CONTRACTOR'].includes(key)) return 'Outsource'
  return 'Permanent'
}

function normalizeOutsourceContractType(value) {
  const text = String(value || '').trim()
  if (!text || text === '-' || text === '—' || text.toUpperCase() === 'PERMANENT') return 'Unspecified'
  return text.replace(/^contract\s+/i, '').replace(/\s+/g, ' ').trim()
}

function isCurrentMonth(dateValue) {
  if (!dateValue) return false
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return false
  const now = new Date()
  return parsed.getFullYear() === now.getFullYear() && parsed.getMonth() === now.getMonth()
}

function SummaryPill({ label, value, color = ACE_BLUE }) {
  return (
    <div className="min-w-0 rounded border border-[#e2e8f0] bg-white px-3.5 py-3">
      <div className="text-[.68rem] font-extrabold uppercase text-slate-500">{label}</div>
      <div className="mt-[7px] flex items-center gap-2">
        <span className="text-xl font-black leading-none text-[#101828]">{value}</span>
        <span className="h-[7px] w-[7px] rounded-full" style={{ background: color }} />
      </div>
    </div>
  )
}

function HRDistributionPanel({ title, rows, color = ACE_BLUE, empty = 'No data' }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0)
  const visible = rows.slice(0, 6)
  return (
    <div className="min-h-[190px] rounded border border-[#e2e8f0] bg-white p-4">
      <div className="mb-3 text-[.82rem] font-black text-[#344054]">{title}</div>
      {visible.length === 0 ? (
        <div className="text-[.78rem] text-slate-400">{empty}</div>
      ) : visible.map(row => {
        const pct = total ? Math.round((row.value / total) * 100) : 0
        return (
          <div key={row.label} className="mb-2.5">
            <div className="flex justify-between gap-2.5 text-[.74rem] font-extrabold text-[#475467]">
              <span className="min-w-0 truncate whitespace-nowrap">{row.label}</span>
              <span>{row.value}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eef2f7]">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HRExecutiveSummary({ employees, loading }) {
  const summary = useMemo(() => {
    const rows = employees || []
    const active = rows.filter(e => e.status === 'ACTIVE').length
    const probation = rows.filter(e => e.status === 'PROBATION').length
    const subcontract = rows.filter(e => normalizeEmploymentType(hrValue(e, ['employment_type', 'employee_type', 'staff_type']) || e.current_contract?.contract_type) === 'Subcontractor').length
    const fullTime = rows.filter(e => ['FULL_TIME', 'PERMANENT'].includes(String(e.current_contract?.contract_type || '').toUpperCase())).length
    const projectPeople = rows.filter(e => String(hrValue(e, ['department', 'department_name', 'department_code']) || e.department?.name || '').toLowerCase().includes('project')).length
    const newThisMonth = rows.filter(e => isCurrentMonth(e.hire_date || hrValue(e, ['hire_date', 'start_date']))).length

    const missing = {
      email: rows.filter(e => !hrDisplayValue(e.email, '')).length,
      phone: rows.filter(e => !hrDisplayValue(e.phone, '')).length,
      department: rows.filter(e => !hrDisplayValue(hrValue(e, ['department', 'department_name', 'department_code']) || e.department?.name, '')).length,
      role: rows.filter(e => !hrDisplayValue(hrValue(e, ['position_name', 'job_title', 'project_role', 'project_team']) || e.position?.name, '')).length,
      emergency: rows.filter(e => !hrDisplayValue(hrValue(e, ['emergency_contact_name', 'emergency_contact_phone']), '')).length,
      bank: rows.filter(e => !hrDisplayValue(hrValue(e, ['bank_name', 'bank_account_no', 'bank_account_name']), '')).length,
    }

    return {
      total: rows.length,
      active,
      probation,
      subcontract,
      fullTime,
      projectPeople,
      newThisMonth,
      missing,
      byDepartment: hrCountBy(rows, e => hrValue(e, ['department', 'department_name', 'department_code']) || e.department?.name),
      byStatus: hrCountBy(rows, e => normalizeHrCategory(STATUS_CONFIG[e.status]?.label || e.status)),
      byContract: hrCountBy(
        rows.filter(e => normalizeEmploymentType(hrValue(e, ['employment_type', 'employee_type', 'staff_type']) || e.current_contract?.contract_type) === 'Outsource'),
        e => normalizeOutsourceContractType(e.current_contract?.contract_type || hrValue(e, ['contract_type']))
      ),
      byEmployment: hrCountBy(rows, e => normalizeEmploymentType(hrValue(e, ['employment_type', 'employee_type', 'staff_type']) || e.current_contract?.contract_type)),
      byRole: hrCountBy(rows, e => hrValue(e, ['position_name', 'job_title', 'project_role', 'project_team']) || e.position?.name),
    }
  }, [employees])

  const checks = [
    { label: 'Missing email', value: summary.missing.email },
    { label: 'Missing phone', value: summary.missing.phone },
    { label: 'Missing department', value: summary.missing.department },
    { label: 'Missing position / role', value: summary.missing.role },
    { label: 'Missing emergency contact', value: summary.missing.emergency },
    { label: 'Missing bank information', value: summary.missing.bank },
  ]

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 950, color: '#101828' }}>Executive Summary</div>
          <div style={{ fontSize: '.76rem', color: '#667085', marginTop: 3 }}>
            {loading ? 'Refreshing employee intelligence...' : 'Company headcount, workforce mix, and HR data readiness'}
          </div>
        </div>
        <div style={{ fontSize: '.72rem', color: '#667085', fontWeight: 800 }}>
          Source: /api/employees
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 2xl:grid-cols-6">
        <SummaryPill label="Headcount" value={summary.total} color={ACE_BLUE} />
        <SummaryPill label="Project" value={summary.projectPeople} color="#0ea5e9" />
        <SummaryPill label="Active" value={summary.active} color="#16a34a" />
        <SummaryPill label="Probation" value={summary.probation} color={ACE_RED} />
        <SummaryPill label="Subcontract" value={summary.subcontract} color="#6d3f8f" />
        <SummaryPill label="New This Month" value={summary.newThisMonth} color="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
        <HRDistributionPanel title="By Department" rows={summary.byDepartment} color={ACE_BLUE} />
        <HRDistributionPanel title="Employment Type" rows={summary.byEmployment} color="#0ea5e9" />
        <HRDistributionPanel title="Employee Status" rows={summary.byStatus} color="#16a34a" />
        <div className="rounded border border-[#e2e8f0] bg-white p-4">
          <div className="mb-3 text-[.82rem] font-black text-[#344054]">Recommended Checks</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {checks.map(check => (
              <div key={check.label} className={['rounded border border-[#edf0f5] px-2.5 py-2', check.value ? 'bg-orange-50' : 'bg-slate-50'].join(' ')}>
                <div className="text-[.66rem] font-extrabold text-slate-500">{check.label}</div>
                <div className={['mt-1 text-base font-black', check.value ? 'text-[#c0392b]' : 'text-green-600'].join(' ')}>{check.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <HRDistributionPanel title="Top Positions / Roles" rows={summary.byRole} color="#6d3f8f" />
        <HRDistributionPanel title="Outsource Contract Type" rows={summary.byContract} color={ACE_RED} />
      </div>
    </section>
  )
}

function EmptyDetailPanel() {
  return (
    <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#64748b', padding: 30 }}>
      <div style={{ maxWidth: 360, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 10 }}>👤</div>
        <div style={{ fontWeight: 850, color: '#0f172a', fontSize: '1rem' }}>Select an employee</div>
        <div style={{ fontSize: '.82rem', marginTop: 6, lineHeight: 1.55 }}>
          Choose a person from the list to view profile, contract, documents, and status history.
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

function HRSidebar({ activeNav, setActiveNav, mobileOpen, onMobileClose }) {
  return (
    <aside className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'} w-72 flex-col border-r border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:shadow-none lg:overflow-y-auto`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${ACE_BLUE}, ${ACE_RED})` }}>
          <Command size={24} />
        </div>
        <div className="min-w-0">
          <div className="text-base font-black text-slate-950">ACE HR Suite</div>
          <div className="text-xs font-bold text-slate-400">People Operations</div>
        </div>
        <button
          onClick={onMobileClose}
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="mt-9 space-y-1">
        {HR_NAV.map(item => {
          const active = item.id === activeNav
          const Icon = item.icon || Activity
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => { setActiveNav(item.id); onMobileClose?.() }}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-black transition ${active ? 'bg-blue-50 text-[#2447d8] shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <Sparkles size={18} style={{ color: ACE_BLUE }} />
          HR Workspace
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
          Employee database · Compliance · Workforce analytics &amp; readiness.
        </p>
      </div>
    </aside>
  )
}

function ContractAlertBanner({ canWriteHr, showToast }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [sending, setSending] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const r = await apiFetch(`${API_BASE}/hr/contract-alerts?days=30`)
      if (r.ok) setData(await r.json())
    } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function sendDigest() {
    if (!confirm('Send contract expiry digest email to all HR Admins?')) return
    setSending(true)
    try {
      const r = await apiFetch(`${API_BASE}/hr/contract-alerts/send-digest?days=30`, { method: 'POST' })
      const payload = await r.json()
      if (r.ok) {
        const status = payload.status
        const recipients = (payload.recipients || []).join(', ')
        if (status === 'SENT') showToast?.(`✓ Digest sent — ${payload.total} contracts to ${recipients}`)
        else if (status === 'no_expiring_contracts') showToast?.('No expiring contracts in this period')
        else showToast?.(`⚠ Send failed: ${payload.error_message || status}`)
      } else {
        showToast?.(`⚠ Send failed: ${payload.detail || r.statusText}`)
      }
    } catch (e) { showToast?.(`⚠ Error: ${e.message}`) }
    setSending(false)
  }

  if (loading) return null
  if (!data || data.total === 0) return null

  const buckets = data.buckets || { overdue: 0, lte_7: 0, '8_14': 0, '15_30': 0 }
  const hasOverdue = buckets.overdue > 0
  return (
    <>
      <section className={`rounded-2xl border p-5 shadow-sm ${hasOverdue ? 'border-red-300 bg-gradient-to-r from-red-50 to-orange-50' : 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50'}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className={`rounded-full p-3 ${hasOverdue ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className={`text-xs font-black uppercase tracking-wider ${hasOverdue ? 'text-red-700' : 'text-orange-700'}`}>Contract Expiry Alert</div>
              <div className="mt-1 text-xl font-black text-slate-900">
                {data.total} contract{data.total === 1 ? '' : 's'} need attention
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold">
                {buckets.overdue > 0 && (
                  <span className="rounded-full bg-red-200 px-2.5 py-1 text-red-900">⚠ Overdue: {buckets.overdue}</span>
                )}
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-700">≤7 days: {buckets.lte_7}</span>
                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-orange-700">8-14 days: {buckets['8_14']}</span>
                <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-yellow-700">15-30 days: {buckets['15_30']}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setOpenModal(true)}
              className="rounded-xl border border-orange-300 bg-white px-4 py-2.5 text-sm font-black text-orange-700 shadow-sm transition hover:bg-orange-50"
            >
              View List ({data.total})
            </button>
            {canWriteHr && (
              <button
                onClick={sendDigest}
                disabled={sending}
                className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-60"
              >
                {sending ? 'Sending…' : '📧 Email HR'}
              </button>
            )}
          </div>
        </div>
      </section>
      {openModal && (
        <ContractAlertModal data={data} onClose={() => setOpenModal(false)} />
      )}
    </>
  )
}

function ContractAlertModal({ data, onClose }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 920, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,.25)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>Contracts Expiring within {data.within_days} days</div>
            <div style={{ fontSize: '.78rem', opacity: .9, marginTop: 2 }}>{data.total} employees · as of {data.as_of_date}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 8, color: '#fff', width: 32, height: 32, cursor: 'pointer', fontWeight: 900 }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f5f7fb' }}>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 800, fontSize: '.72rem', color: '#475569', textTransform: 'uppercase' }}>Code</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 800, fontSize: '.72rem', color: '#475569', textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 800, fontSize: '.72rem', color: '#475569', textTransform: 'uppercase' }}>Department</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 800, fontSize: '.72rem', color: '#475569', textTransform: 'uppercase' }}>Contract</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 800, fontSize: '.72rem', color: '#475569', textTransform: 'uppercase' }}>End Date</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 800, fontSize: '.72rem', color: '#475569', textTransform: 'uppercase' }}>Days Left</th>
              </tr>
            </thead>
            <tbody>
              {(data.data || []).map(r => {
                const d = r.days_until_expiry
                const overdue = d < 0
                const color = overdue ? '#991b1b' : d <= 7 ? '#dc2626' : d <= 14 ? '#ea580c' : '#ca8a04'
                const label = overdue ? `${-d} days overdue` : `${d} days`
                return (
                  <tr key={r.employee_code} style={{ borderBottom: '1px solid #f1f5f9', background: overdue ? '#fef2f2' : undefined }}>
                    <td style={{ padding: '10px 16px', fontWeight: 700 }}>{r.employee_code}</td>
                    <td style={{ padding: '10px 16px' }}>{r.full_name}</td>
                    <td style={{ padding: '10px 16px', color: '#64748b', fontSize: '.78rem' }}>{r.department || '—'}</td>
                    <td style={{ padding: '10px 16px', color: '#64748b', fontSize: '.78rem' }}>{r.contract_type || '—'}</td>
                    <td style={{ padding: '10px 16px' }}>{r.contract_end_date}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 900, color }}>{label}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PlaceholderPage({ label }) {
  return (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: '#94a3b8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#475569' }}>{label}</div>
        <div style={{ fontSize: '.82rem', marginTop: 6 }}>Coming soon</div>
      </div>
    </div>
  )
}

const DEFAULT_LEAVE_ENTITLEMENTS = {
  'Sick Leave': 30,
  'Personal Leave': 3,
  'Annual Leave': 6,
  'Other Leave': null,
}

function LeavePolicyPanel({ showToast }) {
  const [entitlements, setEntitlements] = useState(DEFAULT_LEAVE_ENTITLEMENTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    async function loadPolicy() {
      setLoading(true)
      try {
        const res = await apiFetch('/api/leave/policy')
        if (res.ok) {
          const data = await res.json()
          if (alive) setEntitlements({ ...DEFAULT_LEAVE_ENTITLEMENTS, ...(data.entitlements || {}) })
        }
      } catch (_) {
        if (alive) showToast?.('Load leave policy failed', 'error')
      }
      if (alive) setLoading(false)
    }
    loadPolicy()
    return () => { alive = false }
  }, [showToast])

  function setDays(type, value) {
    setEntitlements(prev => ({
      ...prev,
      [type]: value === '' ? 0 : Math.max(0, Number(value || 0)),
    }))
  }

  function setPolicyBased(type, checked) {
    setEntitlements(prev => ({
      ...prev,
      [type]: checked ? null : DEFAULT_LEAVE_ENTITLEMENTS[type],
    }))
  }

  async function savePolicy() {
    setSaving(true)
    try {
      const res = await apiFetch('/api/leave/policy', {
        method: 'PUT',
        body: JSON.stringify({ entitlements }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Save leave policy failed')
      setEntitlements({ ...DEFAULT_LEAVE_ENTITLEMENTS, ...(data.entitlements || {}) })
      showToast?.('Leave policy saved')
    } catch (err) {
      showToast?.(err.message || 'Save leave policy failed', 'error')
    }
    setSaving(false)
  }

  return (
    <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, padding: 16, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ marginRight: 'auto' }}>
          <div style={{ fontWeight: 900, color: '#1d2939' }}>Leave Statistics Policy</div>
          <div style={{ fontSize: '.76rem', color: '#667085', marginTop: 3 }}>Yearly entitlement used by ClockApp and leave emails.</div>
        </div>
        <button onClick={savePolicy} disabled={saving || loading} style={{ ...BTN_PRIMARY, borderRadius: 4, opacity: saving || loading ? .65 : 1 }}>
          {saving ? 'Saving...' : 'Save Policy'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
        {Object.keys(DEFAULT_LEAVE_ENTITLEMENTS).map(type => {
          const policyBased = entitlements[type] == null
          return (
            <div key={type} style={{ border: '1px solid #edf0f5', background: '#f5f7fb', borderRadius: 4, padding: 12 }}>
              <div style={{ fontSize: '.78rem', fontWeight: 900, color: '#344054', marginBottom: 8 }}>{type}</div>
              <input
                type="number"
                min="0"
                step="0.5"
                disabled={policyBased || loading}
                value={policyBased ? '' : entitlements[type]}
                onChange={e => setDays(type, e.target.value)}
                style={{ ...INPUT_SM, width: '100%', opacity: policyBased ? .5 : 1 }}
                placeholder="Policy-based"
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 9, fontSize: '.72rem', fontWeight: 800, color: '#667085' }}>
                <input type="checkbox" checked={policyBased} disabled={loading} onChange={e => setPolicyBased(type, e.target.checked)} />
                Policy-based
              </label>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── Org Chart Page ───────────────────────────────────────────────────────────
function OrgChartPage({ onOpenEmployee }) {
  const [view, setView] = useState('dept')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  // expanded set — empty by default (only depth 0 root → its children always render)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    setLoading(true)
    apiFetch(`${API_BASE}/hr/org-chart?view=${view}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); setExpanded({}) })
      .catch(() => setLoading(false))
  }, [view])

  const matchesSearch = (text) => {
    if (!search.trim()) return true
    return (text || '').toLowerCase().includes(search.toLowerCase())
  }

  const toggle = (path) => setExpanded(c => ({ ...c, [path]: !c[path] }))

  // Expand all when searching so matches are visible
  function expandAllPaths() {
    function walk(node, path, acc) {
      if (!node) return
      if (path) acc[path] = true
      ;(node.children || []).forEach(c => walk(c, `${path}/${c.name}`, acc))
    }
    if (data?.tree) {
      const acc = {}
      walk(data.tree, '', acc)
      setExpanded(acc)
    }
  }
  function collapseAll() { setExpanded({}) }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 flex flex-col gap-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-[#2447d8]">
            <FolderTree size={14} />
            ACE · HR · Organization Chart
          </div>
          <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">Organization Chart</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Company structure by department, section, position, project, or reporting line.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {[
              { id: 'dept',    label: '🏢 Department' },
              { id: 'project', label: '📋 Project' },
              { id: 'manager', label: '👥 Manager' },
            ].map(t => (
              <button key={t.id} onClick={() => setView(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${view === t.id ? 'bg-[#2447d8] text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="🔍 Search name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm focus:border-[#2447d8] focus:outline-none"
          />
          <button onClick={expandAllPaths} className="org-no-print rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-600 shadow-sm hover:bg-slate-50">⊕ Expand All</button>
          <button onClick={collapseAll} className="org-no-print rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-600 shadow-sm hover:bg-slate-50">⊖ Collapse</button>
          <button
            onClick={() => { document.body.classList.add('printing-org-chart'); setTimeout(() => { window.print(); document.body.classList.remove('printing-org-chart') }, 100) }}
            className="org-no-print rounded-xl border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-black text-white shadow-md hover:bg-black transition"
          >🖨 Print A4</button>
        </div>
      </div>

      {loading && <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">Loading…</div>}

      {!loading && data && (
        <div id="org-chart-printable" className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-auto">
          <div className="org-print-title hidden text-center py-3 border-b border-slate-200">
            <div className="text-xs uppercase tracking-wider text-slate-500">ACE · Organization Chart</div>
            <div className="text-lg font-black text-slate-900">
              {view === 'dept' ? 'By Department' : view === 'project' ? 'By Project' : 'By Manager'}
              {data?.total != null && ` · ${data.total} employees`}
            </div>
            <div className="text-[.7rem] text-slate-400 mt-1">Printed {new Date().toLocaleString()}</div>
          </div>
          <div className="p-6 flex justify-center min-w-max">
            {view === 'manager'
              ? <ManagerTree roots={data.roots || []} onOpenEmployee={onOpenEmployee} matchesSearch={matchesSearch} collapsed={expanded} toggle={toggle} />
              : <GroupTree node={data.tree} onOpenEmployee={onOpenEmployee} matchesSearch={matchesSearch} expanded={expanded} toggle={toggle} path="" depth={0} />
            }
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          /* CRITICAL: force background colors to print */
          html, body, * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body.printing-org-chart * { visibility: hidden !important; }
          body.printing-org-chart #org-chart-printable,
          body.printing-org-chart #org-chart-printable * { visibility: visible !important; }
          body.printing-org-chart #org-chart-printable {
            position: absolute !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            overflow: visible !important;
          }
          body.printing-org-chart .org-no-print { display: none !important; }
          body.printing-org-chart .org-print-title { display: block !important; }
          body.printing-org-chart #org-chart-printable button { cursor: default !important; }
          /* shrink for fit */
          body.printing-org-chart #org-chart-printable { font-size: 10px; }
          body.printing-org-chart #org-chart-printable .shadow-md,
          body.printing-org-chart #org-chart-printable .shadow,
          body.printing-org-chart #org-chart-printable .shadow-lg { box-shadow: 0 1px 2px rgba(0,0,0,.15) !important; }
        }
      `}</style>
    </div>
  )
}

function nodeColor(type) {
  return ({
    root: '#1e293b',
    department: '#2447d8',
    section: '#6d3f8f',
    position: '#0891b2',
    project: '#16a34a',
  })[type] || '#475569'
}

function GroupTree({ node, onOpenEmployee, matchesSearch, expanded, toggle, path, depth }) {
  if (!node) return null
  const isLeaf = !node.children || node.children.length === 0
  const hasEmployees = Array.isArray(node.employees) && node.employees.length > 0
  const hasChildren = !isLeaf || hasEmployees
  // Root (depth 0) — always expanded
  // Depth >= 1 — expanded only if user clicked
  const isOpen = depth === 0 || !!expanded[path]
  const clickable = hasChildren && depth > 0

  function handleClick() { if (clickable) toggle(path) }

  return (
    <div className="flex flex-col items-center">
      {/* Node card */}
      <div
        className={`relative rounded-xl px-3 py-2 text-white shadow-md text-center select-none transition ${clickable ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''}`}
        style={{
          background: nodeColor(node.type),
          width: 170,
          minHeight: 64,
        }}
        onClick={handleClick}
        title={clickable ? (isOpen ? 'Click to collapse' : 'Click to expand') : ''}
      >
        {clickable && (
          <span className="absolute right-1.5 top-1 text-[.6rem] opacity-80">{isOpen ? '▼' : '▶'}</span>
        )}
        <div className="text-[.6rem] uppercase tracking-wider opacity-75">{node.type}</div>
        <div className="text-[.78rem] font-black leading-tight whitespace-normal break-words px-1">{node.name}</div>
        <div className="text-[.65rem] font-bold opacity-90 mt-0.5">{node.count} ppl</div>
      </div>

      {/* Children */}
      {!isLeaf && isOpen && (
        <>
          <div className="w-px bg-slate-300 h-3" />
          <div className="flex flex-row gap-3 items-start border-t-2 border-slate-300 pt-3 px-1">
            {node.children.map((c, i) => (
              <div key={`${path}/${c.name}-${i}`} className="flex flex-col items-center">
                <div className="w-px bg-slate-300 h-3 -mt-3" />
                <GroupTree
                  node={c}
                  onOpenEmployee={onOpenEmployee}
                  matchesSearch={matchesSearch}
                  expanded={expanded}
                  toggle={toggle}
                  path={`${path}/${c.name}`}
                  depth={depth + 1}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Leaf employees list */}
      {hasEmployees && isOpen && (
        <div className="mt-2 flex flex-wrap gap-1.5 max-w-[260px] justify-center">
          {node.employees.map(e => {
            const dim = !matchesSearch(e.full_name) && !matchesSearch(e.employee_code)
            return (
              <button key={e.id} onClick={() => onOpenEmployee?.(e)}
                style={{ opacity: dim ? .25 : 1 }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-1.5 py-1 hover:border-blue-400 hover:shadow transition">
                <Avatar name={e.full_name} size={22} photoUrl={e.photo_url} />
                <div className="text-left">
                  <div className="text-[.68rem] font-black text-slate-900 leading-tight">{e.full_name}</div>
                  <div className="text-[.58rem] text-slate-500 leading-tight">{e.employee_code}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ManagerTree({ roots, onOpenEmployee, matchesSearch, collapsed, toggle }) {
  if (!roots.length) {
    return (
      <div className="text-center text-slate-400 py-12">
        <div className="text-6xl mb-3">👥</div>
        <div className="font-bold">No manager hierarchy yet</div>
        <div className="text-sm mt-1">Edit employee profile → set Manager Code to populate this view</div>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      {roots.map(r => <ManagerNode key={r.id} node={r} onOpenEmployee={onOpenEmployee} matchesSearch={matchesSearch} collapsed={collapsed} toggle={toggle} depth={0} />)}
    </div>
  )
}

function ManagerNode({ node, onOpenEmployee, matchesSearch, collapsed, toggle, depth }) {
  const isCollapsed = collapsed[`mgr:${node.employee_code}`]
  const hasChildren = node.children?.length > 0
  const dim = !matchesSearch(node.full_name) && !matchesSearch(node.employee_code)
  return (
    <div style={{ marginLeft: depth * 28 }}>
      <div className="flex items-center gap-2 py-1" style={{ opacity: dim ? .35 : 1 }}>
        {hasChildren ? (
          <button onClick={() => toggle(`mgr:${node.employee_code}`)} className="w-5 text-slate-500 font-bold">{isCollapsed ? '▶' : '▼'}</button>
        ) : <span className="w-5 text-slate-300">·</span>}
        <button onClick={() => onOpenEmployee?.(node)} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 hover:border-blue-400 hover:shadow transition">
          <Avatar name={node.full_name} size={28} photoUrl={node.photo_url} />
          <div className="text-left">
            <div className="text-[.78rem] font-black text-slate-900 leading-tight">{node.full_name}</div>
            <div className="text-[.66rem] text-slate-500 leading-tight">{node.position} · {node.employee_code}</div>
          </div>
        </button>
        {hasChildren && <span className="text-[.66rem] text-slate-400 font-bold">({node.children.length} reports)</span>}
      </div>
      {hasChildren && !isCollapsed && node.children.map(c => (
        <ManagerNode key={c.id} node={c} onOpenEmployee={onOpenEmployee} matchesSearch={matchesSearch} collapsed={collapsed} toggle={toggle} depth={depth + 1} />
      ))}
    </div>
  )
}

function HRModulePage({ moduleId, employees = [], label, showToast }) {
  const module = HR_MODULES[moduleId] || {
    title: label || 'HR Module',
    subtitle: 'Operational workspace for HR administration.',
    metrics: [
      ['Total Employees', employees.length, 'HR database', ACE_BLUE],
      ['Active', employees.filter(e => e.status === 'ACTIVE').length, 'Currently employed', '#16a34a'],
      ['Pending Items', '—', 'Needs workflow setup', '#d97706'],
      ['Exceptions', '—', 'Needs HR review', ACE_RED],
    ],
    panels: [
      ['Core Views', ['Employee records', 'Approval queue', 'Monthly summary', 'Audit report']],
      ['Controls', ['Access control', 'Notification rules', 'Export policy', 'Workflow settings']],
    ],
  }

  const queue = getHRModuleQueue(moduleId, employees)
  const deptRows = hrCountBy(employees, e => hrValue(e, ['department', 'department_name']) || e.department?.name).slice(0, 6)
  const statusRows = hrCountBy(employees, e => normalizeHrCategory(e.status)).slice(0, 6)

  return (
    <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <section style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ minWidth: 0, marginRight: 'auto' }}>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1d2939', lineHeight: 1.1 }}>
            {module.title}
          </div>
          <div style={{ fontSize: '.82rem', color: '#667085', marginTop: 4 }}>
            {module.subtitle}
          </div>
        </div>
        <button style={{ ...BTN_SECONDARY, background: '#fff', border: '1px solid #e2e8f0', color: '#344054' }}>Export</button>
        <button style={{ ...BTN_PRIMARY, borderRadius: 4 }}>{queue.action}</button>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, flexShrink: 0 }}>
        {module.metrics.map(([metricLabel, value, note, color]) => (
          <MetricCard key={metricLabel} label={metricLabel} value={value} note={note} color={color || ACE_BLUE} />
        ))}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: 12 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, padding: 16 }}>
          <div style={{ fontSize: '.82rem', fontWeight: 900, color: '#344054', marginBottom: 12 }}>Module Workspaces</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {module.panels.map(([panelTitle, items]) => (
              <div key={panelTitle} style={{ border: '1px solid #edf0f5', background: '#f5f7fb', borderRadius: 4, padding: 12 }}>
                <div style={{ fontSize: '.76rem', color: '#344054', fontWeight: 900, marginBottom: 8 }}>{panelTitle}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map(item => (
                    <div key={item} style={{ fontSize: '.72rem', color: '#667085', fontWeight: 700, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span>{item}</span>
                      <span style={{ color: '#98a2b3' }}>Ready</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <HRDistributionPanel title="Employee Status" rows={statusRows} color="#16a34a" />
        <HRDistributionPanel title="Department Coverage" rows={deptRows} color={ACE_BLUE} />
      </section>

      {moduleId === 'leave' && <LeavePolicyPanel showToast={showToast} />}

      <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #edf0f5', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontWeight: 900, color: '#1d2939' }}>{queue.title}</div>
          <span style={{ fontSize: '.72rem', color: '#667085', background: '#f2f4f7', borderRadius: 99, padding: '2px 8px', fontWeight: 800 }}>{queue.rows.length}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760, fontSize: '.78rem' }}>
            <thead>
              <tr style={{ background: '#f5f7fb', borderBottom: '1px solid #edf0f5' }}>
                {queue.columns.map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#667085', fontWeight: 900, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queue.rows.map((row, index) => (
                <tr key={`${moduleId}-${index}`} style={{ borderBottom: '1px solid #edf0f5' }}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${moduleId}-${index}-${cellIndex}`} style={{ padding: '9px 12px', color: cellIndex === 0 ? '#101828' : '#667085', fontWeight: cellIndex === 0 ? 850 : 700, whiteSpace: 'nowrap' }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

function DataQualityPage({ employees = [], onOpenEmployee, showToast }) {
  const [summary, setSummary] = useState(null)
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    severity: '',
    issue_type: '',
    department: '',
    status: '',
    employment_type: '',
    missing_documents: false,
    system_access_issue: false,
    search: '',
  })

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([fetchDataQualitySummary(), fetchDataQualityIssues(filters)])
      .then(([summaryPayload, issuePayload]) => {
        setSummary(summaryPayload)
        setIssues(issuePayload.data || [])
      })
      .catch(err => setError(err.message || 'Data quality unavailable'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filters.severity, filters.issue_type, filters.department, filters.status, filters.employment_type, filters.missing_documents, filters.system_access_issue])

  const debouncedSearch = useDebounce(filters.search, 300)
  useEffect(() => {
    fetchDataQualityIssues({ ...filters, search: debouncedSearch })
      .then(payload => setIssues(payload.data || []))
      .catch(() => {})
  }, [debouncedSearch])

  const issueTypes = [...new Set(issues.map(i => i.issue_type).filter(Boolean))].sort()
  const depts = [...new Set((employees || []).map(e => e.department?.name || e.hr_profile?.department || e.department).filter(Boolean))].sort()
  const score = summary?.overall_score ?? 0
  const scoreColor = score >= 90 ? '#16a34a' : score >= 75 ? '#d97706' : ACE_RED

  async function handleRecalculate() {
    try {
      const result = await recalculateDataQuality()
      showToast?.(`Recalculated ${result.issues} data quality issues`)
      load()
    } catch (err) {
      showToast?.(err.message || 'Recalculate failed', 'error')
    }
  }

  const metricCards = [
    ['Missing Required Data', summary?.missing_required_data, 'Profile score fields', ACE_RED, 'risk'],
    ['Missing Documents', summary?.missing_documents, 'Required checklist', '#b45309', 'warn'],
    ['Missing Company Email', summary?.missing_company_email, 'Email required', ACE_RED, 'risk'],
    ['Missing Phone', summary?.missing_phone, 'Contact readiness', '#d97706', 'warn'],
    ['Missing Manager', summary?.missing_manager, 'Reporting line', '#d97706', 'warn'],
    ['Missing Cost Center', summary?.missing_cost_center, 'Finance mapping', '#d97706', 'warn'],
    ['Missing Work Location', summary?.missing_work_location, 'Work setup', '#d97706', 'warn'],
    ['Missing Job Level', summary?.missing_job_level, 'Grade mapping', '#d97706', 'warn'],
    ['Login Not Created', summary?.login_not_created, 'System access', ACE_RED, 'risk'],
    ['Welcome Email Pending', summary?.welcome_email_pending, 'Invite follow-up', '#f59e0b', 'warn'],
    ['Duplicate Employee Code', summary?.duplicate_employee_code, 'Identity conflict', ACE_RED, 'risk'],
    ['Duplicate Company Email', summary?.duplicate_company_email, 'Email conflict', ACE_RED, 'risk'],
    ['Active With Term Date', summary?.active_employee_with_termination_date, 'Status conflict', ACE_RED, 'risk'],
    ['Terminated Active Login', summary?.terminated_employee_with_active_login, 'Access risk', ACE_RED, 'risk'],
    ['Probation Ending Soon', summary?.probation_ending_soon, 'Review due', '#0ea5e9', ''],
    ['Contract Expiring Soon', summary?.contract_expiring_soon, 'Renewal review', '#0ea5e9', ''],
  ]

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 md:p-7">
      <section className="flex shrink-0 flex-col gap-3 xl:flex-row xl:items-center">
        <div className="min-w-0 xl:mr-auto">
          <div className="text-[1.45rem] font-black leading-tight text-[#1d2939]">HR Data Quality</div>
          <div className="mt-1 text-[.82rem] text-slate-500">Profile, document, and system access readiness across employee records.</div>
        </div>
        <button onClick={handleRecalculate} className="rounded bg-[#2447d8] px-3.5 py-2 text-xs font-bold text-white">Recalculate</button>
      </section>

      {error && <div className="rounded-lg bg-red-100 px-4 py-2.5 text-[.82rem] font-semibold text-red-700">{error}</div>}

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[280px_1fr]">
        <div className="rounded border border-[#e2e8f0] bg-white p-5">
          <div className="text-xs font-black uppercase text-slate-500">Overall Data Quality Score</div>
          <div className="mt-4 flex items-end gap-3">
            <div className="text-5xl font-black leading-none" style={{ color: scoreColor }}>{loading ? '...' : score}</div>
            <div className="pb-1 text-lg font-black text-slate-400">/100</div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: `${score}%`, background: scoreColor }} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <QualityWeight label="Profile" value="50%" />
            <QualityWeight label="Docs" value="30%" />
            <QualityWeight label="Access" value="20%" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map(([label, value, note, color, tone]) => (
            <MetricCard key={label} label={label} value={loading ? '...' : (value ?? 0)} note={note} color={color} tone={tone} />
          ))}
        </div>
      </section>

      <section className="rounded border border-[#e2e8f0] bg-white p-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4 xl:grid-cols-8">
          <input value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder="Search issue / employee" className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold outline-none md:col-span-2" />
          <select value={filters.severity} onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold">
            <option value="">All severity</option><option>High</option><option>Medium</option><option>Low</option>
          </select>
          <select value={filters.issue_type} onChange={e => setFilters(f => ({ ...f, issue_type: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold">
            <option value="">All issue types</option>{issueTypes.map(type => <option key={type}>{type}</option>)}
          </select>
          <select value={filters.department} onChange={e => setFilters(f => ({ ...f, department: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold">
            <option value="">All departments</option>{depts.map(dept => <option key={dept}>{dept}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold">
            <option value="">All status</option><option>Open</option><option>Resolved</option><option>Ignored</option>
          </select>
          <label className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">
            <input type="checkbox" checked={filters.missing_documents} onChange={e => setFilters(f => ({ ...f, missing_documents: e.target.checked }))} /> Missing docs
          </label>
          <label className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">
            <input type="checkbox" checked={filters.system_access_issue} onChange={e => setFilters(f => ({ ...f, system_access_issue: e.target.checked }))} /> Access issue
          </label>
        </div>
      </section>

      <section className="min-h-0 overflow-hidden rounded border border-[#e2e8f0] bg-white">
        <div className="flex items-center justify-between border-b border-[#edf0f5] px-4 py-3">
          <div className="font-black text-[#1d2939]">Issue Register</div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">{issues.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-[.76rem]">
            <thead className="bg-slate-50 text-left text-[.68rem] uppercase text-slate-500">
              <tr>{['Issue Type', 'Severity', 'Employee Code', 'Employee Name', 'Department', 'Problem Field', 'Recommended Action', 'Status', 'Last Updated', 'Action'].map(h => <th key={h} className="px-3 py-2.5 font-black">{h}</th>)}</tr>
            </thead>
            <tbody>
              {(loading ? [] : issues).map(issue => {
                const emp = employees.find(e => e.id === issue.employee_id)
                return (
                  <tr key={issue.id} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-black text-slate-900">{issue.issue_type}</td>
                    <td className="px-3 py-3"><SeverityBadge severity={issue.severity} /></td>
                    <td className="px-3 py-3 font-bold text-slate-600">{issue.employee_code}</td>
                    <td className="px-3 py-3 font-bold text-slate-900">{issue.employee_name}</td>
                    <td className="px-3 py-3 text-slate-600">{issue.department || '—'}</td>
                    <td className="px-3 py-3 text-slate-600">{issue.problem_field}</td>
                    <td className="px-3 py-3 text-slate-600">{issue.recommended_action}</td>
                    <td className="px-3 py-3"><span className="rounded-full bg-orange-50 px-2 py-1 text-[.68rem] font-black text-orange-700">{issue.status}</span></td>
                    <td className="px-3 py-3 text-slate-500">{formatDateYmd(issue.last_updated) || '—'}</td>
                    <td className="px-3 py-3">
                      <button onClick={() => emp && onOpenEmployee?.(emp, { tab: 'profile' })} className="rounded border border-slate-200 px-2.5 py-1 text-xs font-black text-[#2447d8] disabled:opacity-40" disabled={!emp}>Open</button>
                    </td>
                  </tr>
                )
              })}
              {!loading && issues.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-10 text-center text-sm font-bold text-slate-400">No data quality issues found</td></tr>
              )}
              {loading && (
                <tr><td colSpan={10} className="px-3 py-10 text-center text-sm font-bold text-slate-400">Loading data quality...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

function QualityWeight({ label, value }) {
  return (
    <div className="rounded bg-slate-50 p-2">
      <div className="text-[.66rem] font-black text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-black text-slate-700">{value}</div>
    </div>
  )
}

function SeverityBadge({ severity }) {
  const styles = {
    High: 'bg-red-50 text-red-700 border-red-100',
    Medium: 'bg-orange-50 text-orange-700 border-orange-100',
    Low: 'bg-blue-50 text-[#2447d8] border-blue-100',
  }
  return <span className={['rounded-full border px-2 py-1 text-[.68rem] font-black', styles[severity] || styles.Low].join(' ')}>{severity || 'Low'}</span>
}

function HRAnalyticsPage() {
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    search: '', dateFrom: '', dateTo: '', department: '', section: '', position: '', status: '',
    employmentType: '', contractType: '', manager: '', readiness: '', clock: '', kpi: '', dataQuality: '',
  })

  useEffect(() => {
    setLoading(true)
    fetchHrAnalytics()
      .then(setPayload)
      .catch(err => setError(err.message || 'Analytics unavailable'))
      .finally(() => setLoading(false))
  }, [])

  const summary = payload?.summary || {}
  const charts = payload?.charts || {}
  const insights = payload?.insights || []
  const rows = payload?.rows || []
  const filteredRows = rows.filter(row => {
    const q = filters.search.toLowerCase()
    const qualityOk = !filters.dataQuality || (filters.dataQuality === 'good' ? row.data_quality_score >= 80 : row.data_quality_score < 80)
    const hireTime = row.hire_date ? new Date(row.hire_date).getTime() : null
    const dateOk = (!filters.dateFrom || (hireTime && hireTime >= new Date(filters.dateFrom).getTime()))
      && (!filters.dateTo || (hireTime && hireTime <= new Date(filters.dateTo).getTime()))
    return (!q || `${row.employee_name} ${row.employee_code} ${row.email}`.toLowerCase().includes(q))
      && dateOk
      && (!filters.department || row.department === filters.department)
      && (!filters.section || row.section === filters.section)
      && (!filters.position || row.position === filters.position)
      && (!filters.status || row.status === filters.status)
      && (!filters.employmentType || row.employment_type === filters.employmentType)
      && (!filters.contractType || row.contract_type === filters.contractType)
      && (!filters.manager || row.manager === filters.manager)
      && (!filters.readiness || row.project_readiness_status === filters.readiness)
      && (!filters.clock || String(row.clock_eligible) === filters.clock)
      && (!filters.kpi || String(row.kpi_eligible) === filters.kpi)
      && qualityOk
  })
  const depts = [...new Set(rows.map(r => r.department).filter(Boolean))].sort()
  const sections = [...new Set(rows.map(r => r.section).filter(Boolean))].sort()
  const positions = [...new Set(rows.map(r => r.position).filter(Boolean))].sort()
  const statuses = [...new Set(rows.map(r => r.status).filter(Boolean))].sort()
  const empTypes = [...new Set(rows.map(r => r.employment_type).filter(Boolean))].sort()
  const contractTypes = [...new Set(rows.map(r => r.contract_type).filter(Boolean))].sort()
  const managers = [...new Set(rows.map(r => r.manager).filter(Boolean))].sort()
  const readinessStatuses = [...new Set(rows.map(r => r.project_readiness_status).filter(Boolean))].sort()

  const kpis = [
    ['Total Employees', summary.total_employees, 'All records', ACE_BLUE],
    ['Active Employees', summary.active_employees, 'Currently employed', '#16a34a'],
    ['Probation Employees', summary.probation_employees, 'Review pipeline', '#d97706', 'warn'],
    ['Subcontract Employees', summary.subcontract_employees, 'Vendor workforce', '#6d3f8f'],
    ['On Leave Employees', summary.on_leave_employees, 'Away / approved', '#0ea5e9'],
    ['Terminated Employees', summary.terminated_employees, 'Inactive records', '#64748b'],
    ['New Hires This Month', summary.new_hires_this_month, 'Monthly intake', '#16a34a'],
    ['Terminations This Month', summary.terminations_this_month, 'Monthly exits', ACE_RED, 'risk'],
    ['Average Data Quality Score', `${summary.average_data_quality_score || 0}%`, 'Profile readiness', ACE_BLUE],
    ['Project Ready Employees', summary.project_ready_employees, 'Assignment ready', '#16a34a'],
    ['Clock Eligible Employees', summary.clock_eligible_employees, 'Can clock in/out', '#0ea5e9'],
    ['KPI Eligible Employees', summary.kpi_eligible_employees, 'KPI-ready records', '#6d3f8f'],
    ['Missing Required Data', summary.missing_required_data, 'Profile blockers', ACE_RED, 'risk'],
    ['Missing Documents', summary.missing_documents, 'Checklist gaps', '#b45309', 'warn'],
    ['Login Not Created', summary.login_not_created, 'Access missing', ACE_RED, 'risk'],
    ['Welcome Email Pending', summary.welcome_email_pending, 'Invite follow-up', '#f59e0b', 'warn'],
    ['Contract Expiring Soon', summary.contract_expiring_soon, 'Renewal risk', '#d97706', 'warn'],
    ['Probation Ending Soon', summary.probation_ending_soon, 'Review due', '#d97706', 'warn'],
  ]

  const chartBlocks = [
    ['Headcount by Department', 'bar', charts.headcount_by_department],
    ['Headcount by Section', 'bar', charts.headcount_by_section],
    ['Employee Status Distribution', 'donut', charts.status_distribution],
    ['Employment Type Distribution', 'donut', charts.employment_type_distribution],
    ['Monthly New Hire Trend', 'line', charts.monthly_hiring_trend],
    ['Monthly Termination Trend', 'line', charts.monthly_termination_trend],
    ['New Hire vs Termination', 'dual', charts.new_hire_vs_termination],
    ['Data Quality Score by Department', 'bar', charts.data_quality_by_department],
    ['Missing Data Breakdown', 'bar', charts.missing_data_breakdown],
    ['Project Readiness Funnel', 'funnel', charts.project_readiness_funnel],
    ['Clock Eligibility Status', 'donut', charts.clock_eligibility],
    ['KPI Eligibility Status', 'donut', charts.kpi_eligibility],
    ['Contract Expiring Timeline', 'bar', charts.contract_expiring],
    ['Probation Ending Timeline', 'bar', charts.probation_ending],
    ['Employee Tenure Distribution', 'bar', charts.tenure_distribution],
    ['Employee Age Range Distribution', 'bar', charts.age_distribution],
    ['Login / Welcome Email Status', 'bar', charts.login_welcome_status],
  ]

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 md:p-7">
      <section className="flex shrink-0 flex-col gap-3 xl:flex-row xl:items-center">
        <div className="min-w-0 xl:mr-auto">
          <div className="text-[1.45rem] font-black leading-tight text-[#1d2939]">HR Analytics</div>
          <div className="mt-1 text-[.82rem] text-slate-500">Executive workforce analytics, readiness, risk, and report exports.</div>
        </div>
        <ReportExportMenu />
      </section>
      {error && <div className="rounded-lg bg-red-100 px-4 py-2.5 text-[.82rem] font-semibold text-red-700">{error}</div>}
      <section className="rounded border border-[#e2e8f0] bg-white p-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-5 xl:grid-cols-8">
          <input value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder="Search name/code/email" className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold md:col-span-2" />
          <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold" />
          <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold" />
          <select value={filters.department} onChange={e => setFilters(f => ({ ...f, department: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold"><option value="">All departments</option>{depts.map(v => <option key={v}>{v}</option>)}</select>
          <select value={filters.section} onChange={e => setFilters(f => ({ ...f, section: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold"><option value="">All sections</option>{sections.map(v => <option key={v}>{v}</option>)}</select>
          <select value={filters.position} onChange={e => setFilters(f => ({ ...f, position: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold"><option value="">All positions</option>{positions.map(v => <option key={v}>{v}</option>)}</select>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold"><option value="">All status</option>{statuses.map(v => <option key={v}>{v}</option>)}</select>
          <select value={filters.employmentType} onChange={e => setFilters(f => ({ ...f, employmentType: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold"><option value="">All employment types</option>{empTypes.map(v => <option key={v}>{v}</option>)}</select>
          <select value={filters.contractType} onChange={e => setFilters(f => ({ ...f, contractType: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold"><option value="">All contract types</option>{contractTypes.map(v => <option key={v}>{v}</option>)}</select>
          <select value={filters.manager} onChange={e => setFilters(f => ({ ...f, manager: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold"><option value="">All managers</option>{managers.map(v => <option key={v}>{v}</option>)}</select>
          <select value={filters.readiness} onChange={e => setFilters(f => ({ ...f, readiness: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold"><option value="">All readiness</option>{readinessStatuses.map(v => <option key={v}>{v}</option>)}</select>
          <select value={filters.clock} onChange={e => setFilters(f => ({ ...f, clock: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold"><option value="">All clock eligibility</option><option value="true">Clock Eligible</option><option value="false">Clock Blocked</option></select>
          <select value={filters.kpi} onChange={e => setFilters(f => ({ ...f, kpi: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold"><option value="">All KPI eligibility</option><option value="true">KPI Eligible</option><option value="false">KPI Blocked</option></select>
          <select value={filters.dataQuality} onChange={e => setFilters(f => ({ ...f, dataQuality: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold"><option value="">All quality levels</option><option value="good">Good 80+</option><option value="risk">Risk below 80</option></select>
          <div className="rounded bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">Filtered: {filteredRows.length}</div>
        </div>
      </section>
      <section className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {kpis.map(([label, value, note, color, tone]) => <MetricCard key={label} label={label} value={loading ? '...' : (value ?? 0)} note={note} color={color} tone={tone} />)}
      </section>
      <section className="grid grid-cols-1 gap-3 xl:grid-cols-4">
        {insights.map(card => <InsightCard key={card.title} insight={card} />)}
      </section>
      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {chartBlocks.map(([title, type, data]) => <AnalyticsChart key={title} title={title} type={type} data={data || []} />)}
        <RiskMatrix data={insights} />
      </section>
    </main>
  )
}

function ReportExportMenu() {
  const reports = ['employee-master', 'headcount-by-department', 'new-hire', 'termination', 'contract-expiring', 'probation-ending', 'missing-data', 'data-quality', 'project-readiness', 'clock-eligibility', 'kpi-eligibility', 'system-access', 'audit-log']
  const [report, setReport] = useState(reports[0])
  async function download(format) {
    const res = await apiFetch(`${API_BASE}/hr/reports/export?report=${encodeURIComponent(report)}&format=${format}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="flex flex-wrap gap-2">
      <select value={report} onChange={e => setReport(e.target.value)} className="rounded border border-slate-200 bg-white px-3 py-2 text-xs font-bold">{reports.map(r => <option key={r}>{r}</option>)}</select>
      {['csv', 'xlsx', 'pdf'].map(format => <button key={format} onClick={() => download(format)} className="rounded bg-[#2447d8] px-3.5 py-2 text-xs font-bold uppercase text-white">{format}</button>)}
    </div>
  )
}

function InsightCard({ insight }) {
  const color = insight.severity === 'critical' ? ACE_RED : insight.severity === 'warning' ? '#d97706' : insight.severity === 'success' ? '#16a34a' : ACE_BLUE
  return (
    <div className="rounded border border-[#e2e8f0] bg-white p-4">
      <div className="text-[.68rem] font-black uppercase text-slate-500">{insight.title}</div>
      <div className="mt-2 text-xl font-black" style={{ color }}>{String(insight.value)}</div>
    </div>
  )
}

function AnalyticsChart({ title, type, data }) {
  return (
    <div className="rounded border border-[#e2e8f0] bg-white p-4">
      <div className="mb-3 text-[.86rem] font-black text-[#344054]">{title}</div>
      {type === 'donut' ? <DonutChart data={data} /> : type === 'line' ? <LineChart data={data} /> : type === 'dual' ? <DualLineChart data={data} /> : type === 'funnel' ? <FunnelChart data={data} /> : <BarChart data={data} />}
    </div>
  )
}

function BarChart({ data }) {
  const max = Math.max(1, ...data.map(d => d.value || 0))
  return <div className="grid gap-2">{data.slice(0, 10).map((d, i) => <div key={d.label} className="grid grid-cols-[150px_1fr_42px] items-center gap-2 text-xs"><div className="truncate font-bold text-slate-600">{d.label}</div><div className="h-2 rounded bg-slate-100"><div className="h-full rounded" style={{ width: `${((d.value || 0) / max) * 100}%`, background: [ACE_BLUE, '#0ea5e9', '#16a34a', '#d97706', ACE_RED][i % 5] }} /></div><div className="text-right font-black text-slate-700">{d.value}</div></div>)}</div>
}

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1
  return <div className="grid grid-cols-[130px_1fr] items-center gap-4"><svg viewBox="0 0 42 42" className="h-[130px] w-[130px] -rotate-90">{data.reduce((acc, d, i) => { const value = (d.value || 0) / total * 100; const dash = `${value} ${100 - value}`; const offset = 25 - acc.sum; acc.items.push(<circle key={d.label} cx="21" cy="21" r="15.915" fill="transparent" stroke={[ACE_BLUE, '#16a34a', '#d97706', ACE_RED, '#64748b'][i % 5]} strokeWidth="7" strokeDasharray={dash} strokeDashoffset={offset} />); acc.sum += value; return acc }, { sum: 0, items: [] }).items}</svg><div className="grid gap-1">{data.map((d, i) => <div key={d.label} className="flex justify-between gap-2 text-xs"><span className="truncate font-bold text-slate-600">{d.label}</span><b>{d.value}</b></div>)}</div></div>
}

function LineChart({ data }) {
  const max = Math.max(1, ...data.map(d => d.value || 0))
  const points = data.map((d, i) => `${(i / Math.max(1, data.length - 1)) * 100},${60 - ((d.value || 0) / max) * 48}`).join(' ')
  return <svg viewBox="0 0 100 70" className="h-[180px] w-full"><polyline fill="none" stroke={ACE_BLUE} strokeWidth="2.5" points={points} />{data.map((d, i) => <text key={d.label} x={(i / Math.max(1, data.length - 1)) * 100} y="68" fontSize="4" textAnchor="middle" fill="#64748b">{d.label.slice(5)}</text>)}</svg>
}

function DualLineChart({ data }) {
  const max = Math.max(1, ...data.flatMap(d => [d.new_hires || 0, d.terminations || 0]))
  const path = key => data.map((d, i) => `${(i / Math.max(1, data.length - 1)) * 100},${60 - ((d[key] || 0) / max) * 48}`).join(' ')
  return <svg viewBox="0 0 100 70" className="h-[180px] w-full"><polyline fill="none" stroke="#16a34a" strokeWidth="2.5" points={path('new_hires')} /><polyline fill="none" stroke={ACE_RED} strokeWidth="2.5" points={path('terminations')} /></svg>
}

function FunnelChart({ data }) {
  const max = Math.max(1, data[0]?.value || 1)
  return <div className="grid gap-2">{data.map((d, i) => <div key={d.label} className="mx-auto rounded px-3 py-2 text-center text-xs font-black text-white" style={{ width: `${Math.max(28, ((d.value || 0) / max) * 100)}%`, background: [ACE_BLUE, '#0ea5e9', '#16a34a', '#d97706', ACE_RED, '#64748b'][i % 6] }}>{d.label}: {d.value}</div>)}</div>
}

function RiskMatrix({ data }) {
  return <div className="rounded border border-[#e2e8f0] bg-white p-4"><div className="mb-3 text-[.86rem] font-black text-[#344054]">HR Risk Summary</div><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{data.map(item => <InsightCard key={item.title} insight={item} />)}</div></div>
}

function ProjectReadinessPage({ employees = [], onOpenEmployee }) {
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    fetchReadinessSummary()
      .then(setPayload)
      .catch(err => setError(err.message || 'Project readiness unavailable'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const rows = payload?.data || []
  return (
    <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 md:p-7">
      <section className="flex shrink-0 flex-col gap-3 xl:flex-row xl:items-center">
        <div className="min-w-0 xl:mr-auto">
          <div className="text-[1.45rem] font-black leading-tight text-[#1d2939]">Project Readiness</div>
          <div className="mt-1 text-[.82rem] text-slate-500">Assignment readiness, Clock In/Out eligibility, and KPI eligibility in one operational view.</div>
        </div>
        <button onClick={load} className="rounded border border-[#e2e8f0] bg-white px-3.5 py-2 text-xs font-bold text-[#344054]">Refresh</button>
      </section>
      {error && <div className="rounded-lg bg-red-100 px-4 py-2.5 text-[.82rem] font-semibold text-red-700">{error}</div>}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Average Readiness" value={loading ? '...' : `${payload?.average_score ?? 0}%`} note="All employees" color={ACE_BLUE} />
        <MetricCard label="Project Ready" value={payload?.ready ?? 0} note="Ready / assigned" color="#16a34a" />
        <MetricCard label="Not Ready" value={payload?.not_ready ?? 0} note="Missing blockers" color={ACE_RED} tone="risk" />
        <MetricCard label="Clock Eligible" value={rows.filter(r => r.clock_eligible).length} note="Can clock in/out" color="#0ea5e9" />
        <MetricCard label="KPI Eligible" value={rows.filter(r => r.kpi_eligible).length} note="KPI-ready records" color="#6d3f8f" />
      </section>
      <section className="min-h-0 overflow-hidden rounded border border-[#e2e8f0] bg-white">
        <div className="flex items-center justify-between border-b border-[#edf0f5] px-4 py-3">
          <div className="font-black text-[#1d2939]">Readiness Register</div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">{rows.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-[.76rem]">
            <thead className="bg-slate-50 text-left text-[.68rem] uppercase text-slate-500">
              <tr>{['Employee Code', 'Employee Name', 'Department', 'Project Readiness', 'Score', 'Clock', 'KPI', 'Missing Requirements', 'Action'].map(h => <th key={h} className="px-3 py-2.5 font-black">{h}</th>)}</tr>
            </thead>
            <tbody>
              {(loading ? [] : rows).map(row => {
                const emp = employees.find(e => e.id === row.employee_id)
                return (
                  <tr key={row.employee_id} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-bold text-slate-600">{row.employee_code}</td>
                    <td className="px-3 py-3 font-black text-slate-900">{row.employee_name}</td>
                    <td className="px-3 py-3 text-slate-600">{row.department || '—'}</td>
                    <td className="px-3 py-3"><EligibilityBadge label={row.readiness_status} ok={row.readiness_status !== 'Not Ready'} /></td>
                    <td className="px-3 py-3 font-black text-slate-700">{row.readiness_score}%</td>
                    <td className="px-3 py-3"><EligibilityBadge label={row.clock_eligible ? 'Clock Eligible' : 'Clock Blocked'} ok={row.clock_eligible} /></td>
                    <td className="px-3 py-3"><EligibilityBadge label={row.kpi_eligible ? 'KPI Eligible' : 'KPI Blocked'} ok={row.kpi_eligible} /></td>
                    <td className="px-3 py-3 text-slate-600">{(row.missing_requirements || []).slice(0, 3).join(', ') || '—'}</td>
                    <td className="px-3 py-3"><button onClick={() => emp && onOpenEmployee?.(emp, { tab: 'readiness' })} className="rounded border border-slate-200 px-2.5 py-1 text-xs font-black text-[#2447d8]" disabled={!emp}>Open</button></td>
                  </tr>
                )
              })}
              {!loading && rows.length === 0 && <tr><td colSpan={9} className="px-3 py-10 text-center text-sm font-bold text-slate-400">No readiness data</td></tr>}
              {loading && <tr><td colSpan={9} className="px-3 py-10 text-center text-sm font-bold text-slate-400">Loading readiness...</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

function AuditLogsPage({ employees = [] }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ date_from: '', date_to: '', action: '', employee: '', changed_by: '', entity_type: '', source: '' })

  const load = () => {
    setLoading(true)
    setError('')
    fetchAuditLogs(filters)
      .then(payload => setLogs(payload.data || []))
      .catch(err => setError(err.message || 'Audit logs unavailable'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filters.date_from, filters.date_to, filters.action, filters.entity_type, filters.source])
  const debouncedEmployee = useDebounce(filters.employee, 300)
  const debouncedChangedBy = useDebounce(filters.changed_by, 300)
  useEffect(load, [debouncedEmployee, debouncedChangedBy])

  const actions = [...new Set(logs.map(row => row.action).filter(Boolean))].sort()
  const entityTypes = [...new Set(logs.map(row => row.entity_type).filter(Boolean))].sort()
  const sources = [...new Set(logs.map(row => row.source).filter(Boolean))].sort()

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 md:p-7">
      <section className="flex shrink-0 flex-col gap-3 xl:flex-row xl:items-center">
        <div className="min-w-0 xl:mr-auto">
          <div className="text-[1.45rem] font-black leading-tight text-[#1d2939]">Audit Logs</div>
          <div className="mt-1 text-[.82rem] text-slate-500">Append-only HR activity trail for employee, access, email, and data quality actions.</div>
        </div>
        <button onClick={load} className="rounded border border-[#e2e8f0] bg-white px-3.5 py-2 text-xs font-bold text-[#344054]">Refresh</button>
      </section>

      {error && <div className="rounded-lg bg-red-100 px-4 py-2.5 text-[.82rem] font-semibold text-red-700">{error}</div>}

      <section className="rounded border border-[#e2e8f0] bg-white p-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4 xl:grid-cols-7">
          <input type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold" />
          <input type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold" />
          <select value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold">
            <option value="">All actions</option>{actions.map(action => <option key={action}>{action}</option>)}
          </select>
          <input value={filters.employee} onChange={e => setFilters(f => ({ ...f, employee: e.target.value }))} placeholder="Employee" className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold" />
          <input value={filters.changed_by} onChange={e => setFilters(f => ({ ...f, changed_by: e.target.value }))} placeholder="Changed by" className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold" />
          <select value={filters.entity_type} onChange={e => setFilters(f => ({ ...f, entity_type: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold">
            <option value="">All entity types</option>{entityTypes.map(type => <option key={type}>{type}</option>)}
          </select>
          <select value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))} className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold">
            <option value="">All sources</option>{sources.map(source => <option key={source}>{source}</option>)}
          </select>
        </div>
      </section>

      <section className="min-h-0 overflow-hidden rounded border border-[#e2e8f0] bg-white">
        <div className="flex items-center justify-between border-b border-[#edf0f5] px-4 py-3">
          <div className="font-black text-[#1d2939]">System Audit Trail</div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">{logs.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-[.76rem]">
            <thead className="bg-slate-50 text-left text-[.68rem] uppercase text-slate-500">
              <tr>{['Date/Time', 'Action', 'Employee Code', 'Employee Name', 'Changed By', 'Changed Fields', 'Source', 'IP Address', 'Detail'].map(h => <th key={h} className="px-3 py-2.5 font-black">{h}</th>)}</tr>
            </thead>
            <tbody>
              {(loading ? [] : logs).map(log => (
                <tr key={log.id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-3 font-bold text-slate-600">{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td>
                  <td className="px-3 py-3 font-black text-slate-900">{log.action_label || log.action}</td>
                  <td className="px-3 py-3 font-bold text-slate-600">{log.employee_code || '—'}</td>
                  <td className="px-3 py-3 font-bold text-slate-900">{log.employee_name || '—'}</td>
                  <td className="px-3 py-3 text-slate-600">{log.changed_by_name || log.changed_by_email || 'System'}</td>
                  <td className="px-3 py-3">
                    <div className="flex max-w-[240px] flex-wrap gap-1">{(log.changed_fields || []).slice(0, 5).map(field => <span key={field} className="rounded bg-slate-100 px-1.5 py-0.5 text-[.66rem] font-black text-slate-500">{field}</span>)}</div>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{log.source || '—'}</td>
                  <td className="px-3 py-3 text-slate-600">{log.ip_address || '—'}</td>
                  <td className="px-3 py-3 text-slate-500">{auditDetailText(log)}</td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-10 text-center text-sm font-bold text-slate-400">No audit logs found</td></tr>
              )}
              {loading && (
                <tr><td colSpan={9} className="px-3 py-10 text-center text-sm font-bold text-slate-400">Loading audit logs...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

function auditDetailText(log) {
  const next = log.new_value || {}
  if (next.status) return `Status: ${next.status}`
  if (next.issue_type) return `${next.issue_type} · ${next.problem_field || ''}`
  if (next.email) return next.email
  return (log.changed_fields || []).join(', ') || log.entity_type || '—'
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('ace-hr-styles')) {
  const s = document.createElement('style')
  s.id = 'ace-hr-styles'
  s.textContent = `@keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(12px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }`
  document.head.appendChild(s)
}

const INPUT = {
  width: '100%', border: '1px solid var(--color-border-secondary)',
  borderRadius: 10, padding: '8px 10px', fontSize: '.82rem',
  color: 'var(--color-text-primary)', background: 'var(--color-background-primary)',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}
const INPUT_SM     = { ...INPUT, padding: '6px 10px', fontSize: '.78rem', background: '#fff', borderRadius: 6 }
const BTN_PRIMARY  = { padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: ACE_BLUE, color: '#fff', fontWeight: 700, fontSize: '.78rem', fontFamily: 'inherit' }
const BTN_SECONDARY = { ...BTN_PRIMARY, background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-secondary)' }
const ICON_BTN     = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '1rem', padding: 4 }
const ICON_BTN_MUTED = { border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 900, padding: '0 2px' }
const TOP_ICON     = { width: 34, height: 34, borderRadius: 99, border: '1px solid #edf0f5', background: '#f5f7fb', color: '#667085', cursor: 'pointer', display: 'grid', placeItems: 'center' }
const CARD_LINE    = { fontSize: '.68rem', color: '#334155', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
const CARD_STYLE   = { background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, padding: '12px 14px' }

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function HREmployeePage({ authenticatedUser = null, onLogout = null }) {
  const [activeNav,    setActiveNav]    = useState('employees')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selected,      setSelected]     = useState(null)
  const [drawerMode,    setDrawerMode]   = useState({ tab: 'profile', editProfile: false, contractForm: false })
  const [showAdd,       setShowAdd]      = useState(false)
  const [showSettings,  setShowSettings] = useState(false)
  const [viewMode,      setViewMode]     = useState('grid')

  const [employees,    setEmployees]    = useState([])
  const [allEmployees, setAllEmployees] = useState([])
  const [pagination,   setPagination]   = useState({ page: 1, per_page: 20, total: 0, total_pages: 1 })
  const [loading,      setLoading]      = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [error,        setError]        = useState(null)

  const [search,       setSearch]       = useState('')
  const [deptFilter,   setDeptFilter]   = useState('')
  const [statusFilter, setStatusFilter] = useState('ACTIVE')
  const [refreshKey,   setRefreshKey]   = useState(0)

  const debouncedSearch = useDebounce(search, 300)
  const canWriteHr = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'HR_ADMIN'].includes(authenticatedUser?.role)

  const counts = useMemo(() => {
    const c = {}
    const source = allEmployees.length ? allEmployees : employees
    source.forEach(e => { c[e.status] = (c[e.status] || 0) + 1 })
    return c
  }, [allEmployees, employees])

  const departmentOptions = useMemo(() => {
    const source = allEmployees.length ? allEmployees : employees
    return [...new Set(source.map(e => e.department?.name || hrValue(e, ['department', 'department_name'])).filter(Boolean))].sort()
  }, [allEmployees, employees])

  const metricCounts = useMemo(() => {
    const source = allEmployees.length ? allEmployees : employees
    return {
      total:          (allEmployees.length ? allEmployees.length : pagination.total),
      active:         source.filter(e => e.status === 'ACTIVE').length,
      probation:      source.filter(e => e.status === 'PROBATION').length,
      subcontract:    source.filter(e => normalizeEmploymentType(hrValue(e, ['employment_type', 'employee_type', 'staff_type']) || e.current_contract?.contract_type) === 'Subcontractor').length,
      onLeave:        source.filter(e => e.status === 'ON_LEAVE').length,
      terminated:     source.filter(e => ['TERMINATED', 'RESIGNED'].includes(e.status)).length,
      missingData:    source.filter(e => employeeMissingRequiredData(e).length > 0).length,
      missingDocs:    source.filter(e => {
        const count = employeeMissingDocuments(e)
        return count !== null && count > 0
      }).length,
      loginMissing:   source.filter(employeeLoginMissing).length,
      welcomePending: source.filter(employeeWelcomePending).length,
    }
  }, [allEmployees, employees, pagination.total])

  useEffect(() => {
    if (!['employees', 'analytics', 'dataQuality', 'projectReadiness', 'auditLogs'].includes(activeNav)) return
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchEmployeeList({ search: debouncedSearch, deptFilter, statusFilter, page: pagination.page, perPage: 20 })
      .then(result => {
        if (cancelled) return
        setEmployees(result.data)
        setPagination(result.meta)
      })
      .catch(e => { if (!cancelled) { setError(e.message); setEmployees([]) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [debouncedSearch, deptFilter, statusFilter, pagination.page, refreshKey, activeNav])

  useEffect(() => {
    if (activeNav !== 'employees') return
    let cancelled = false
    setSummaryLoading(true)
    fetchAllEmployeesForSummary()
      .then(list => { if (!cancelled) setAllEmployees(list) })
      .catch(() => { if (!cancelled) setAllEmployees([]) })
      .finally(() => { if (!cancelled) setSummaryLoading(false) })
    return () => { cancelled = true }
  }, [refreshKey, activeNav])

  const [toast, setToast] = useState(null)
  const [sendingAll, setSendingAll] = useState(false)
  const [resetPasswordTarget, setResetPasswordTarget] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4500)
  }

  async function sendWelcomeEmail(codes) {
    try {
      const res = await apiFetch('/api/auth/send-welcome', {
        method: 'POST',
        body: JSON.stringify({ employee_codes: codes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Send failed')
      const failedCount = Array.isArray(data.failed) ? data.failed.length : (data.total - data.sent)
      if (codes.length === 1) {
        if (data.sent === 1) {
          showToast('✉ ส่งอีเมลสำเร็จ', 'success')
        } else {
          const r = data.results?.[0]
          const errMsg = r?.error_code === 'RECIPIENT_REJECTED'
            ? `อีเมลไม่มีในระบบ (${r.email})`
            : (r?.error || 'ไม่สำเร็จ')
          showToast(`ส่งอีเมลไม่สำเร็จ: ${errMsg}`, 'error')
        }
      } else {
        showToast(`✉ ส่งอีเมล ${data.sent}/${data.total} สำเร็จ${failedCount > 0 ? ` (ล้มเหลว ${failedCount})` : ''}`, failedCount > 0 ? 'error' : 'success')
      }
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleSendAll() {
    const codes = employees.filter(e => e.email).map(e => e.employee_code)
    if (!codes.length) { showToast('ไม่มีพนักงานที่มีอีเมล', 'error'); return }
    setSendingAll(true)
    await sendWelcomeEmail(codes)
    setSendingAll(false)
  }

  function openEmployee(employee, mode = {}) {
    setDrawerMode({
      tab: mode.tab || 'profile',
      editProfile: !!mode.editProfile,
      contractForm: !!mode.contractForm,
    })
    setSelected(employee)
  }

  function handleQuickAction(action, employee) {
    if (action === 'editProfile') {
      openEmployee(employee, { tab: 'profile', editProfile: true })
      return
    }
    if (action === 'editContract') {
      openEmployee(employee, { tab: 'contract', contractForm: true })
      return
    }
    if (action === 'history') {
      openEmployee(employee, { tab: 'history' })
      return
    }
    if (action === 'resetPassword') {
      setResetPasswordTarget(employee)
      return
    }
    openEmployee(employee, { tab: 'profile' })
  }

  useEffect(() => {
    if (activeNav === 'settings') {
      setShowSettings(true)
    }
  }, [activeNav])

  const handleAddSuccess = (newEmp, notification) => {
    setShowAdd(false)
    setRefreshKey(k => k + 1)
    if (notification?.status === 'SENT') {
      showToast(`Employee "${newEmp.full_name}" created — login email sent`)
    } else if (notification?.status === 'FAILED') {
      showToast(`Employee created, but email failed: ${notification.error_code}`, 'error')
    } else {
      showToast(`Employee "${newEmp.full_name}" created — ${newEmp.employee_code}`)
    }
  }

  const navItem = HR_NAV.find(n => n.id === activeNav)

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <HRSidebar
          activeNav={activeNav}
          setActiveNav={id => { setActiveNav(id); setSelected(null) }}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        {mobileMenuOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="min-w-0 flex-1">
          {/* Sticky top header */}
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/86 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <IconButton label="Open menu" onClick={() => setMobileMenuOpen(true)}>
                <Menu size={19} />
              </IconButton>
              <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-400 md:flex">
                <Search size={18} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, code, email..."
                  className="w-full border-0 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <IconButton label="Notifications">
                  <Bell size={18} />
                </IconButton>
                <button className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: ACE_BLUE }}>
                    {initials(authenticatedUser?.name || 'HR Admin')}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-slate-900">{authenticatedUser?.name || 'HR Admin'}</div>
                    <div className="text-xs font-bold text-slate-400">{authenticatedUser?.positionName || 'Employee Database'}</div>
                  </div>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
                {onLogout && (
                  <IconButton label="Logout" onClick={onLogout}>
                    <LogOut size={18} />
                  </IconButton>
                )}
              </div>
            </div>
          </header>

        {activeNav !== 'employees' ? (
          activeNav === 'settings' ? (
            <PlaceholderPage label={navItem?.label} />
          ) : activeNav === 'analytics' ? (
            <HRAnalyticsPage />
          ) : activeNav === 'dataQuality' ? (
            <DataQualityPage
              employees={allEmployees.length ? allEmployees : employees}
              onOpenEmployee={openEmployee}
              showToast={showToast}
            />
          ) : activeNav === 'projectReadiness' ? (
            <ProjectReadinessPage
              employees={allEmployees.length ? allEmployees : employees}
              onOpenEmployee={openEmployee}
            />
          ) : activeNav === 'auditLogs' ? (
            <AuditLogsPage employees={allEmployees.length ? allEmployees : employees} />
          ) : activeNav === 'organization' ? (
            <OrgChartPage onOpenEmployee={openEmployee} />
          ) : (
            <HRModulePage moduleId={activeNav} label={navItem?.label} employees={allEmployees.length ? allEmployees : employees} showToast={showToast} />
          )
        ) : (
          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 flex flex-col gap-6">
            {/* Title section — eyebrow + h1 + actions */}
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-[#2447d8]">
                  <Home size={14} />
                  {COMPANY} · HR · {navItem?.label || 'Suite'}
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
                  {navItem?.label || 'HR Suite'}
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  ACE Human Resources · People Operations · Employee database, contracts, compliance &amp; analytics.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm">
                  <CalendarDays size={17} style={{ color: ACE_RED }} />
                  {formatToday()}
                </div>
                <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50">
                  Export
                </button>
                {canWriteHr && (
                  <button
                    onClick={() => setShowAdd(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#2447d8] px-4 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#1d3bb8]"
                  >
                    <UserPlus size={17} />
                    Add Employee
                  </button>
                )}
              </div>
            </div>

            {/* Metric cards */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <MetricCard label="Total Employees"      value={metricCounts.total}          note="All profiles"          color={ACE_BLUE}  icon={Users} />
              <MetricCard label="Active"               value={metricCounts.active}         note="Currently employed"    color="#16a34a"   icon={CheckCircle2} />
              <MetricCard label="Probation"            value={metricCounts.probation}      note="Pending confirmation"  color="#d97706"   icon={UserCheck} tone="warn" />
              <MetricCard label="On Leave"             value={metricCounts.onLeave}        note="Away today / approved" color="#0ea5e9"   icon={CalendarDays} />
              <MetricCard label="Terminated"           value={metricCounts.terminated}     note="Inactive records"      color="#64748b"   icon={X} />
              <MetricCard label="Missing Required Data" value={metricCounts.missingData}   note="Profile fields to fix" color={ACE_RED}   icon={AlertTriangle} tone="risk" />
              <MetricCard label="Missing Documents"    value={metricCounts.missingDocs}    note="Checklist incomplete"  color="#b45309"   icon={FileText} tone="warn" />
              <MetricCard label="Login Not Created"    value={metricCounts.loginMissing}   note="Auth account missing"  color={ACE_RED}   icon={ShieldCheck} tone="risk" />
              <MetricCard label="Welcome Email Pending" value={metricCounts.welcomePending} note="Invite needs action"  color="#f59e0b"   icon={Bell} tone="warn" />
              <MetricCard label="Subcontractors"       value={metricCounts.subcontract}    note="Vendor workforce"      color="#6d3f8f"   icon={Building2} />
            </section>

            <ContractAlertBanner canWriteHr={canWriteHr} showToast={showToast} />

            <HRExecutiveSummary employees={allEmployees.length ? allEmployees : employees} loading={summaryLoading} />

            {/* Toolbar */}
            <EmployeeToolbar
              total={pagination.total}
              loading={loading}
              search={search}           setSearch={setSearch}
              deptFilter={deptFilter}   setDeptFilter={v => { setDeptFilter(v); setPagination(p => ({ ...p, page: 1 })) }}
              statusFilter={statusFilter} setStatusFilter={v => { setStatusFilter(v); setPagination(p => ({ ...p, page: 1 })) }}
              viewMode={viewMode}       setViewMode={setViewMode}
              onAdd={() => setShowAdd(true)}
              counts={counts}
              allCount={(allEmployees.length ? allEmployees : employees).length}
              departmentOptions={departmentOptions}
              onSendAll={handleSendAll}
              sendingAll={sendingAll}
              currentPageEmployees={employees}
              canWriteHr={canWriteHr}
            />

            {/* Error */}
            {error && (
              <div className="shrink-0 rounded-lg bg-red-100 px-4 py-2.5 text-[.82rem] font-semibold text-red-700">
                {error}
              </div>
            )}

            {/* Employee list */}
            <section className="flex min-h-0 flex-col">
              {viewMode === 'grid'
                ? <EmployeeCardGrid employees={employees} loading={loading} onSelect={openEmployee} onSendEmail={sendWelcomeEmail} onQuickAction={handleQuickAction} />
                : <EmployeeListView employees={employees} loading={loading} onSelect={openEmployee} onSendEmail={sendWelcomeEmail} onQuickAction={handleQuickAction} />
              }
            </section>

            {/* Pagination */}
            <div className="flex shrink-0 items-center justify-center gap-3">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1 || loading}
                style={{ ...BTN_SECONDARY, opacity: pagination.page <= 1 ? .4 : 1 }}
              >‹ Prev</button>
              <span style={{ fontSize: '.8rem', fontWeight: 600, color: '#64748b' }}>
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.total_pages || loading}
                style={{ ...BTN_SECONDARY, opacity: pagination.page >= pagination.total_pages ? .4 : 1 }}
              >Next ›</button>
            </div>
          </div>
        )}
        </main>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,.35)', display: 'flex', justifyContent: 'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}
        >
          <div style={{ width: 560, maxWidth: '92vw', height: '100%', background: '#fff', boxShadow: '-24px 0 60px rgba(15,23,42,.22)', position: 'relative' }}>
            <EmployeeDrawer
              employee={selected}
              onClose={() => setSelected(null)}
              initialTab={drawerMode.tab}
              initialEditProfile={drawerMode.editProfile}
              initialContractForm={drawerMode.contractForm}
              currentUser={authenticatedUser}
            />
          </div>
        </div>
      )}

      {/* Settings modal — accessible from toolbar */}
      {showSettings && (
        <HRSettingsModal
          onClose={() => {
            setShowSettings(false)
            if (activeNav === 'settings') setActiveNav('employees')
          }}
          onSaved={() => { setRefreshKey(k => k + 1); showToast('Settings saved') }}
        />
      )}

      {/* Add employee modal */}
      {showAdd && (
        <AddEmployeeModal onClose={() => setShowAdd(false)} onSuccess={handleAddSuccess} />
      )}

      {/* Reset password modal */}
      {resetPasswordTarget && (
        <ResetPasswordModal
          employee={resetPasswordTarget}
          onClose={() => setResetPasswordTarget(null)}
          onSuccess={msg => { setResetPasswordTarget(null); showToast(msg) }}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? '#dc2626' : '#16a34a',
          color: '#fff', padding: '12px 24px', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,.18)', zIndex: 999,
          fontWeight: 700, fontSize: '.88rem', display: 'flex', alignItems: 'center', gap: 10,
          animation: 'slideUp .25s ease',
          whiteSpace: 'nowrap',
        }}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}
    </div>
  )
}
