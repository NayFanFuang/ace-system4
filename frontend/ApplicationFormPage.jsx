// ============================================================
// ACE — Application Form (ใบสมัครงาน) · FM-HR-04 Rev.00
// Self-contained ACE UI Kit page (local sidebar + sticky topbar),
// NOT PlatformShell. Mirrors the official Advance Enterprise
// job-application PDF, responsive for desktop + mobile, with
// localStorage draft auto-save, signature pad, photo upload and
// a print / Save-as-PDF layout.
// ============================================================
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Menu, Search, Bell, LogOut, ChevronDown, Command, Sparkles, X,
  User, FileText, GraduationCap, Briefcase, Cpu, Languages, Users,
  PenLine, Printer, Save, Plus, Trash2, Camera, Phone, ClipboardList,
  CheckCircle2, RotateCcw, Link2, Copy, Mail, Eye, Inbox, Loader2,
  AlertTriangle, ShieldCheck, ScanLine, Paperclip,
} from 'lucide-react'
import { Button, toast } from './src/ui/index.jsx'
import { apiFetch } from './src/apiFetch.js'

/* read ?t=<invite token> once */
function readInviteToken() {
  try { return new URLSearchParams(window.location.search).get('t') || '' } catch (_) { return '' }
}

const ACE_BLUE = '#2447d8'
const ACE_RED = '#c0392b'
const DRAFT_KEY = 'ace_application_form_draft_v1'

/* ---------- companies (HR picks one when creating an invite link) ---------- */
const COMPANIES = {
  ace: {
    id: 'ace',
    name: 'Advance Enterprise (Thailand) Co., Ltd.',
    addr: '61/70, Rama 9 Road, Huai Khwang, Bangkok 10310 THAILAND',
    tel: 'TEL 662 643 0633  ·  FAX 662 643 0634',
    formCode: 'FM-HR-04 Rev.00 17/11/18',
    logo: '/ace-logo.png',
  },
  airconnect: {
    id: 'airconnect',
    name: 'AIR CONNECT ENGINEERING (THAILAND) COMPANY LIMITED',
    // TODO: confirm address / tel / form code for AirConnect
    addr: '61/70, Rama 9 Road, Huai Khwang, Bangkok 10310 THAILAND',
    tel: 'TEL 662 643 0633  ·  FAX 662 643 0634',
    formCode: 'FM-HR-04 Rev.00 17/11/18',
    logo: '/ace-logo.png',
  },
}
const COMPANY_LIST = Object.values(COMPANIES)
const DEFAULT_COMPANY = 'ace'
const getCompany = (id) => COMPANIES[id] || COMPANIES[DEFAULT_COMPANY]

/* Advance Enterprise wordmark rebuilt as crisp inline SVG (no image file needed) */
function AdvanceLogo({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 340 66" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Advance Enterprise (Thailand) Co., Ltd.">
      <text x="170" y="34" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontStyle="italic" fontSize="40" letterSpacing="0.5" fill="#1b4ea0">ADVANCE</text>
      <text x="170" y="59" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="500" fontSize="17.5" fill="#33373b">Enterprise (Thailand) Co., Ltd.</text>
    </svg>
  )
}

function CompanyLogo({ company, className = '' }) {
  if (company.id === 'ace') return <AdvanceLogo className={className} />
  return <img src={company.logo} alt={company.name} className={className} onError={e => { if (e.currentTarget.src.indexOf('ace-logo') === -1) e.currentTarget.src = '/ace-logo.png'; else e.currentTarget.style.display = 'none' }} />
}

const todayISO = () => new Date().toISOString().slice(0, 10)

/* ---------- input formatters / masks ---------- */
const onlyDigits = (s) => String(s ?? '').replace(/\D/g, '')

// Thai national ID → X-XXXX-XXXXX-XX-X (13 digits, groups 1-4-5-2-1)
function formatThaiId(s) {
  const d = onlyDigits(s).slice(0, 13)
  return [d.slice(0, 1), d.slice(1, 5), d.slice(5, 10), d.slice(10, 12), d.slice(12, 13)]
    .filter(Boolean)
    .join('-')
}
// Thai mobile/phone → 0XX-XXX-XXXX (up to 10 digits, grouped 3-3-4)
function formatPhone(s) {
  const d = onlyDigits(s).slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
}
// Money with thousands separators (digits only)
function formatMoney(s) {
  const d = onlyDigits(s)
  return d ? Number(d).toLocaleString('en-US') : ''
}
// Plain integer (digits only)
const formatInt = (s) => onlyDigits(s).slice(0, 3)
// GPA / decimal → digits + single dot, e.g. 3.85
function formatGpa(s) {
  let v = String(s ?? '').replace(/[^\d.]/g, '')
  const i = v.indexOf('.')
  if (i !== -1) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, '')
  return v.slice(0, 4)
}
// 13-digit completeness check for soft validation
const isThaiIdComplete = (s) => onlyDigits(s).length === 13

// Lazy-loaded Thai postal-code → province/district dataset (separate JS chunk,
// fetched only when an applicant actually types a postcode — no initial bloat).
let _addrModPromise
function loadAddrDb() {
  if (!_addrModPromise) _addrModPromise = import('thai-address-database')
  return _addrModPromise
}
async function lookupZip(zip) {
  const m = await loadAddrDb()
  const fn = m.searchAddressByZipcode || m.default?.searchAddressByZipcode
  try { return (fn ? fn(zip) : []) || [] } catch (_) { return [] }
}

// Age in whole years from a YYYY-MM-DD date of birth (empty if invalid/future)
function calcAge(iso) {
  if (!iso) return ''
  const b = new Date(iso)
  if (isNaN(b.getTime())) return ''
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age >= 0 && age < 130 ? String(age) : ''
}

/* ---------- blank form shape ---------- */
const blankForm = () => ({
  position: '', expectedSalary: '',
  // personal
  fullName: '', nickname: '', idCard: '', idCardExpiry: '',
  dob: '', religion: '', sex: '', age: '', height: '', weight: '',
  currentAddress: '', zipcode: '', province: '', amphoe: '', subdistrict: '',
  birthPlace: '', birthZipcode: '', birthProvince: '', birthAmphoe: '', birthSubdistrict: '',
  tel: '', email: '', photo: '',
  // tables
  education: [emptyEdu()],
  training: [emptyTraining()],
  work: [emptyWork()],
  hobbies: '',
  typing: { thai: '', english: '' },
  language: {
    thai: { speaking: '', writing: '', reading: '', understanding: '' },
    english: { speaking: '', writing: '', reading: '', understanding: '' },
    other: { label: '', speaking: '', writing: '', reading: '', understanding: '' },
  },
  computer: [emptyComputer()],
  references: [emptyRef()],
  emergency: { name: '', address: '', relation: '', phone: '' },
  signature: '', signDate: todayISO(),
  attachments: [],         // [{ id, name, size }] — CV / resume / transcript
  pdpaConsent: false,      // PDPA consent (required to submit)
  // for interviewer (internal)
  interview: { first: '', second: '', conclusion: '', interviewer: '' },
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* Required fields → which section to scroll to when invalid */
const FIELD_SECTION = {
  position: 'sec-position', fullName: 'sec-personal', idCard: 'sec-personal',
  email: 'sec-personal', signature: 'sec-sign', pdpaConsent: 'sec-sign',
}
const FIELD_LABEL = {
  position: 'ตำแหน่งที่สมัคร (Position)', fullName: 'ชื่อ-นามสกุล (Name)',
  idCard: 'เลขบัตรประชาชน (ID card)', email: 'อีเมล (Email)',
  signature: 'ลายมือชื่อ (Signature)', pdpaConsent: 'ยินยอม PDPA (Consent)',
}
const emptyEdu = () => ({ period: '', institute: '', faculty: '', major: '', gpax: '' })
const emptyTraining = () => ({ period: '', course: '', institute: '' })
const emptyWork = () => ({ period: '', company: '', jobTitle: '', responsibilities: '', salary: '', reason: '' })
const emptyComputer = () => ({ program: '', ability: '' })
const emptyRef = () => ({ name: '', company: '', relation: '', phone: '' })

/* ---------- page sub-section nav ---------- */
const SECTIONS = [
  { id: 'sec-position', icon: ClipboardList, label: 'ตำแหน่งที่สมัคร', en: 'Position' },
  { id: 'sec-personal', icon: User, label: 'ข้อมูลส่วนตัว', en: 'Personal' },
  { id: 'sec-education', icon: GraduationCap, label: 'ประวัติการศึกษา', en: 'Education' },
  { id: 'sec-training', icon: FileText, label: 'การฝึกอบรม', en: 'Training' },
  { id: 'sec-work', icon: Briefcase, label: 'ประสบการณ์ทำงาน', en: 'Work Experience' },
  { id: 'sec-skills', icon: Cpu, label: 'ทักษะ', en: 'Skills' },
  { id: 'sec-refs', icon: Users, label: 'บุคคลอ้างอิง / ฉุกเฉิน', en: 'References' },
  { id: 'sec-sign', icon: PenLine, label: 'ลงนาม & ส่งใบสมัคร', en: 'Sign & Submit' },
]

/* ---------- combobox suggestion lists (เลือกหรือพิมพ์เพิ่มเองได้) ---------- */
const OPT_POSITION = [
  'วิศวกร (Engineer)', 'Site Engineer', 'RF Engineer', 'Project Manager', 'ช่างเทคนิค (Technician)',
  'Admin / ธุรการ', 'HR / บุคคล', 'Accounting / บัญชี', 'IT Support', 'Sales / ขาย',
  'Foreman / หัวหน้าช่าง', 'Driver / พนักงานขับรถ', 'Safety Officer',
]
const OPT_RELIGION = ['พุทธ (Buddhist)', 'อิสลาม (Muslim)', 'คริสต์ (Christian)', 'ฮินดู (Hindu)', 'ไม่ระบุ (None)']
const OPT_RELATION = [
  'บิดา (Father)', 'มารดา (Mother)', 'คู่สมรส (Spouse)', 'พี่ (Elder sibling)', 'น้อง (Younger sibling)',
  'ญาติ (Relative)', 'เพื่อน (Friend)', 'หัวหน้างาน (Supervisor)', 'เพื่อนร่วมงาน (Colleague)',
]
const OPT_PROGRAM = [
  'Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint', 'Microsoft Outlook',
  'Google Workspace', 'AutoCAD', 'Adobe Photoshop', 'Adobe Illustrator', 'Canva',
  'SQL', 'Python', 'SAP', 'Power BI', 'SketchUp',
]
const OPT_ABILITY = ['ดีมาก (Excellent)', 'ดี (Good)', 'ปานกลาง (Fair)', 'พื้นฐาน (Basic)']
const OPT_FACULTY = [
  'วิศวกรรมศาสตร์ (Engineering)', 'วิทยาศาสตร์ (Science)', 'บริหารธุรกิจ (Business Admin)',
  'บัญชี (Accounting)', 'เทคโนโลยีสารสนเทศ (IT)', 'ครุศาสตร์ (Education)',
  'นิเทศศาสตร์ (Communication Arts)', 'มนุษยศาสตร์ (Humanities)', 'นิติศาสตร์ (Law)',
]

function validateForm(form) {
  const e = {}
  if (!form.position.trim()) e.position = 'กรุณากรอกตำแหน่งที่สมัคร'
  if (!form.fullName.trim()) e.fullName = 'กรุณากรอกชื่อ-นามสกุล'
  if (!isThaiIdComplete(form.idCard)) e.idCard = 'เลขบัตรประชาชนต้องครบ 13 หลัก'
  if (!EMAIL_RE.test(form.email)) e.email = 'รูปแบบอีเมลไม่ถูกต้อง'
  if (!form.signature) e.signature = 'กรุณาเซ็นลายมือชื่อ'
  if (!form.pdpaConsent) e.pdpaConsent = 'กรุณายอมรับเงื่อนไขความยินยอม (PDPA)'
  return e
}

function initials(name) {
  return String(name || 'ACE').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'ACE'
}

/* ============================================================
   Page
   ============================================================ */
export default function ApplicationFormPage({ authenticatedUser = null, onLogout = null }) {
  const [form, setForm] = useState(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) return { ...blankForm(), ...JSON.parse(raw) }
    } catch (_) {}
    return blankForm()
  })
  const [mobileNav, setMobileNav] = useState(false)
  const [activeSec, setActiveSec] = useState(SECTIONS[0].id)
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [ocrBusy, setOcrBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState({})
  const [triedSubmit, setTriedSubmit] = useState(false)
  const [refNo, setRefNo] = useState('')
  const [savedAt, setSavedAt] = useState('')
  const [companyId, setCompanyId] = useState(DEFAULT_COMPANY)
  const company = getCompany(companyId)

  // Load Thai webfont once for crisp Thai rendering
  useEffect(() => {
    const id = 'afp-noto-thai'
    if (!document.getElementById(id)) {
      const l = document.createElement('link')
      l.id = id; l.rel = 'stylesheet'
      l.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700;800;900&display=swap'
      document.head.appendChild(l)
    }
  }, [])

  // ── Access gate ─────────────────────────────────────────────
  // HR (authenticated) opens the page as a console/preview — no token needed.
  // Public applicants must arrive via an invite link: /apply?t=<token>.
  const isPublic = !authenticatedUser
  const inviteToken = useRef(readInviteToken())
  const [gate, setGate] = useState(isPublic ? 'checking' : 'ok') // checking | ok | invalid
  const [invite, setInvite] = useState(null)

  useEffect(() => {
    if (!isPublic) return
    const t = inviteToken.current
    if (!t) { setGate('invalid'); return }
    let alive = true
    fetch(`/api/applications/validate?t=${encodeURIComponent(t)}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('invalid'))))
      .then(info => {
        if (!alive) return
        setInvite(info)
        setGate('ok')
        if (info.company) setCompanyId(info.company)
        setForm(f => ({ ...f, fullName: f.fullName || info.name || '', email: f.email || info.email || '' }))
      })
      .catch(() => { if (alive) setGate('invalid') })
    return () => { alive = false }
  }, [isPublic])

  // debounced draft auto-save
  const saveTimer = useRef(null)
  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
        setSavedAt(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }))
      } catch (_) {}
    }, 800)
    return () => clearTimeout(saveTimer.current)
  }, [form])

  // Re-validate live once the applicant has attempted a submit
  useEffect(() => { if (triedSubmit) setErrors(validateForm(form)) }, [form, triedSubmit])

  // Per-section completion (for sidebar ticks + progress)
  const sectionDone = useMemo(() => ({
    'sec-position': !!form.position.trim(),
    'sec-personal': !!(form.fullName.trim() && isThaiIdComplete(form.idCard) && EMAIL_RE.test(form.email)),
    'sec-education': form.education.some(r => (r.institute || '').trim()),
    'sec-training': form.training.some(r => (r.course || '').trim()),
    'sec-work': form.work.some(r => (r.company || '').trim()),
    'sec-skills': !!(form.hobbies.trim() || form.computer.some(r => (r.program || '').trim()) || form.typing.thai || form.typing.english),
    'sec-refs': form.references.some(r => (r.name || '').trim()) || !!form.emergency.name.trim(),
    'sec-sign': !!(form.signature && form.pdpaConsent),
  }), [form])

  const REQUIRED_KEYS = ['position', 'fullName', 'idCard', 'email', 'signature', 'pdpaConsent']
  const progress = useMemo(() => {
    const e = validateForm(form)
    const ok = REQUIRED_KEYS.filter(k => !e[k]).length
    return Math.round((ok / REQUIRED_KEYS.length) * 100)
  }, [form])

  /* ---- field helpers ---- */
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))
  const patch = (obj) => setForm(f => ({ ...f, ...obj }))
  const setNested = (group, key, value) => setForm(f => ({ ...f, [group]: { ...f[group], [key]: value } }))
  const setRow = (list, idx, key, value) =>
    setForm(f => ({ ...f, [list]: f[list].map((r, i) => (i === idx ? { ...r, [key]: value } : r)) }))
  const addRow = (list, blank) => setForm(f => ({ ...f, [list]: [...f[list], blank()] }))
  const delRow = (list, idx) =>
    setForm(f => ({ ...f, [list]: f[list].length > 1 ? f[list].filter((_, i) => i !== idx) : f[list] }))
  const setLang = (lang, aspect, value) =>
    setForm(f => ({ ...f, language: { ...f.language, [lang]: { ...f.language[lang], [aspect]: value } } }))

  function goSection(id) {
    setActiveSec(id)
    setMobileNav(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function onPhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) { toast('Photo must be ≤ 4MB · รูปไม่เกิน 4MB', 'err'); return }
    const reader = new FileReader()
    reader.onload = () => set('photo', reader.result)
    reader.readAsDataURL(file)
  }

  function resetForm() {
    if (!confirm('Clear all data and start over? · ล้างข้อมูลทั้งหมดและเริ่มใหม่?')) return
    setForm(blankForm())
    try { localStorage.removeItem(DRAFT_KEY) } catch (_) {}
    setSubmitted(false)
    toast('Form cleared · ล้างฟอร์มแล้ว', 'ok')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handlePrint() { window.print() }

  // Scan Thai ID card (offline OCR) → auto-fill ID / name / DOB / expiry
  async function onIdCardOcr(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setOcrBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      // Public applicants send their invite token; logged-in HR uses the JWT (apiFetch).
      let res
      if (inviteToken.current) {
        fd.append('token', inviteToken.current)
        res = await fetch('/api/applications/ocr-idcard', { method: 'POST', body: fd })
      } else {
        res = await apiFetch('/api/applications/ocr-idcard', { method: 'POST', body: fd })
      }
      if (!res.ok) { toast('อ่านบัตรไม่สำเร็จ ลองถ่ายใหม่ให้ชัด · Could not read card', 'err'); return }
      const d = await res.json()
      const next = {}
      if (d.idCard) next.idCard = formatThaiId(d.idCard)
      if (d.fullName) next.fullName = d.fullName
      if (d.dob) { next.dob = d.dob; next.age = calcAge(d.dob) }
      if (d.idCardExpiry) next.idCardExpiry = d.idCardExpiry
      if (!Object.keys(next).length) { toast('อ่านข้อมูลจากบัตรไม่ได้ กรุณากรอกเอง · No data found', 'err'); return }
      patch(next)
      toast('อ่านบัตรแล้ว — กรุณาตรวจสอบความถูกต้อง · Scanned, please verify', 'ok')
    } catch (_) {
      toast('เชื่อมต่อไม่ได้ · Network error', 'err')
    } finally {
      setOcrBusy(false)
    }
  }

  // Upload CV / resume / transcript attachments
  async function onUploadFiles(e) {
    const files = [...(e.target.files || [])]
    e.target.value = ''
    if (!files.length) return
    setUploading(true)
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        let res
        if (inviteToken.current) {
          fd.append('token', inviteToken.current)
          res = await fetch('/api/applications/upload', { method: 'POST', body: fd })
        } else {
          res = await apiFetch('/api/applications/upload', { method: 'POST', body: fd })
        }
        if (!res.ok) {
          const m = await res.json().catch(() => ({}))
          toast(m.detail || `อัปโหลด ${file.name} ไม่สำเร็จ`, 'err')
          continue
        }
        const meta = await res.json()
        setForm(f => ({ ...f, attachments: [...f.attachments, meta] }))
      }
      toast('แนบไฟล์แล้ว · Files attached', 'ok')
    } catch (_) {
      toast('เชื่อมต่อไม่ได้ · Network error', 'err')
    } finally {
      setUploading(false)
    }
  }
  const removeAttachment = (id) => setForm(f => ({ ...f, attachments: f.attachments.filter(a => a.id !== id) }))
  async function downloadAttachment(a) {
    try {
      const res = await apiFetch(`/api/applications/file/${a.id}`)
      if (!res.ok) { toast('ดาวน์โหลดไม่ได้ · Download failed', 'err'); return }
      const url = URL.createObjectURL(await res.blob())
      const link = document.createElement('a'); link.href = url; link.download = a.name || a.id; link.click()
      URL.revokeObjectURL(url)
    } catch (_) { toast('ดาวน์โหลดไม่ได้ · Download failed', 'err') }
  }

  // HR: load a submitted application into the form for review / printing
  function loadApplication(data) {
    setForm({ ...blankForm(), ...data })
    if (data.company) setCompanyId(data.company)
    setSubmitted(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast('Loaded application · โหลดใบสมัครแล้ว', 'ok')
  }

  async function handleSubmit() {
    setTriedSubmit(true)
    const errs = validateForm(form)
    setErrors(errs)
    const keys = Object.keys(errs)
    if (keys.length) {
      toast(`กรอกไม่ครบ ${keys.length} ช่อง · ${keys.length} field(s) need attention`, 'err')
      goSection(FIELD_SECTION[keys[0]] || 'sec-position')
      return
    }
    // Applicants (public) submit to the backend with their invite token.
    if (isPublic) {
      if (sending) return
      setSending(true)
      try {
        const res = await fetch('/api/applications/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: inviteToken.current, data: { ...form, company: companyId } }),
        })
        if (res.status === 401) { setGate('invalid'); return }
        if (!res.ok) {
          const msg = await res.json().catch(() => ({}))
          toast(msg.detail || 'Submit failed · ส่งไม่สำเร็จ', 'err')
          return
        }
        const out = await res.json().catch(() => ({}))
        setRefNo(out.refNo || '')
        try { localStorage.removeItem(DRAFT_KEY) } catch (_) {}
        setSubmitted(true)
        toast('Application submitted · ส่งใบสมัครเรียบร้อย', 'ok')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (_) {
        toast('Network error · เชื่อมต่อไม่ได้', 'err')
      } finally {
        setSending(false)
      }
      return
    }
    // HR preview mode (no token): keep a local record only.
    try {
      const list = JSON.parse(localStorage.getItem('ace_application_submissions_v1') || '[]')
      list.push({ submittedAt: new Date().toISOString(), data: form })
      localStorage.setItem('ace_application_submissions_v1', JSON.stringify(list))
    } catch (_) {}
    setRefNo('')
    setSubmitted(true)
    toast('Saved locally (HR preview) · บันทึกในเครื่อง', 'ok')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isPublic && gate === 'checking') return <GateScreen mode="checking" />
  if (isPublic && gate === 'invalid') return <GateScreen mode="invalid" />

  return (
    <div className="afp-root min-h-screen bg-[#f5f7fb] text-slate-950" style={{ fontFamily: "'Noto Sans Thai', ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
      <PrintStyles />
      <div className="flex min-h-screen">
        <FormSidebar
          activeSec={activeSec}
          onGo={goSection}
          mobileOpen={mobileNav}
          onMobileClose={() => setMobileNav(false)}
          done={sectionDone}
          progress={progress}
        />
        {mobileNav && (
          <button
            type="button"
            className="afp-noprint fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileNav(false)}
          />
        )}

        <main className="afp-main min-w-0 flex-1">
          {/* Sticky topbar */}
          <header className="afp-noprint sticky top-0 z-20 border-b border-slate-200/80 bg-white/86 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <IconBtn label="Open menu" className="lg:hidden" onClick={() => setMobileNav(true)}>
                <Menu size={19} />
              </IconBtn>
              <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-400 md:flex">
                <Search size={18} />
                <span className="text-sm font-semibold text-slate-400">ใบสมัครงาน · Application Form · {company.formCode}</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <IconBtn label="Notifications"><Bell size={18} /></IconBtn>
                <button className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: ACE_BLUE }}>
                    {initials(authenticatedUser?.name || 'ACE')}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-slate-900">{authenticatedUser?.name || 'Applicant'}</div>
                    <div className="text-xs font-bold text-slate-400">Recruitment</div>
                  </div>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
                {onLogout && (
                  <IconBtn label="Logout" onClick={onLogout}><LogOut size={18} /></IconBtn>
                )}
              </div>
            </div>
          </header>

          {/* Mobile stepper (sections as scrollable chips) */}
          {!submitted && (
            <div className="afp-noprint border-b border-slate-200/70 bg-white/70 px-4 py-2 backdrop-blur lg:hidden">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {SECTIONS.map(s => {
                  const active = s.id === activeSec
                  const ok = sectionDone[s.id]
                  return (
                    <button key={s.id} type="button" onClick={() => goSection(s.id)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black transition ${active ? 'border-[#2447d8] bg-blue-50 text-[#2447d8]' : 'border-slate-200 bg-white text-slate-500'}`}>
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${ok ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {ok ? '✓' : ''}
                      </span>
                      {s.en}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mx-auto w-full max-w-4xl px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
            {submitted && <SubmittedBanner refNo={refNo} onPrint={handlePrint} onNew={resetForm} />}

            {/* Validation summary (after a failed submit) */}
            {triedSubmit && Object.keys(errors).length > 0 && !submitted && (
              <div className="afp-noprint mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2 text-sm font-black text-red-700">
                  <AlertTriangle size={18} /> กรอกไม่ครบ {Object.keys(errors).length} ช่อง · Please complete {Object.keys(errors).length} field(s)
                </div>
                <ul className="mt-2 space-y-1">
                  {Object.keys(errors).map(k => (
                    <li key={k}>
                      <button type="button" onClick={() => goSection(FIELD_SECTION[k])} className="text-xs font-bold text-red-600 hover:underline">
                        • {FIELD_LABEL[k]} — {errors[k]}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* HR console (authenticated only) — invite links + submissions */}
            {authenticatedUser && <HrConsole onLoad={loadApplication} onCompanyChange={setCompanyId} />}

            {/* Document header (prints) */}
            <div className="afp-section mb-6 rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-sm">
              <CompanyLogo company={company} className="mx-auto mb-3 h-14 w-auto max-w-[260px] object-contain" />
              <div className="text-lg font-black tracking-tight text-slate-900">{company.name}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">{company.addr}</div>
              <div className="text-xs font-semibold text-slate-500">{company.tel}</div>
              <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-black text-white" style={{ background: `linear-gradient(135deg, ${ACE_BLUE}, ${ACE_RED})` }}>
                <ClipboardList size={16} /> Application Form (ใบสมัครงาน)
              </div>
            </div>

            {/* Action bar */}
            <div className="afp-noprint mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <CheckCircle2 size={14} className="text-emerald-500" />
                {savedAt ? `บันทึกร่างอัตโนมัติแล้ว ${savedAt} · Draft auto-saved` : 'ระบบบันทึกร่างอัตโนมัติ · Auto-saving'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" icon={RotateCcw} onClick={resetForm}>Reset / ล้าง</Button>
                <Button variant="ghost" icon={Printer} onClick={handlePrint}>Print / PDF</Button>
                <Button variant="primary" icon={CheckCircle2} loading={sending} onClick={handleSubmit}>{sending ? 'Submitting… / กำลังส่ง' : 'Submit / ส่งใบสมัคร'}</Button>
              </div>
            </div>

            {/* ---- Position ---- */}
            <Section id="sec-position" icon={ClipboardList} title="ตำแหน่งที่สมัคร" en="Position Applied">
              <div className="grid gap-4 sm:grid-cols-2">
                <ComboField th="ตำแหน่ง" en="Position" required value={form.position} onChange={v => set('position', v)} options={OPT_POSITION} placeholder="เลือกหรือพิมพ์ตำแหน่ง" invalid={!!errors.position} />
                <TextField th="เงินเดือนที่ต้องการ" en="Expected Salary" value={form.expectedSalary} onChange={v => set('expectedSalary', v)} format={formatMoney} inputMode="numeric" placeholder="e.g. 25,000" />
              </div>
            </Section>

            {/* ---- Personal ---- */}
            <Section id="sec-personal" icon={User} title="ข้อมูลส่วนตัว" en="Personal Information">
              {(isPublic || authenticatedUser) && (
                <div className="afp-noprint mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-white p-2 text-[#2447d8] shadow-sm"><ScanLine size={20} /></div>
                    <div>
                      <div className="text-sm font-black text-slate-800">Scan ID card to auto-fill <span className="font-semibold text-slate-400">(สแกนบัตรประชาชนกรอกอัตโนมัติ)</span></div>
                      <div className="text-xs font-semibold text-slate-500">ถ่าย/อัปโหลดรูปหน้าบัตร ระบบจะกรอกเลขบัตร ชื่อ และวันเกิดให้ · ข้อมูลไม่ออกนอกระบบ</div>
                    </div>
                  </div>
                  <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-white shadow-sm transition ${ocrBusy ? 'cursor-not-allowed opacity-70' : 'hover:opacity-90'}`} style={{ background: ACE_BLUE }}>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onIdCardOcr} disabled={ocrBusy} />
                    {ocrBusy ? <><Loader2 size={16} className="animate-spin" /> กำลังอ่าน…</> : <><Camera size={16} /> ถ่าย/อัปโหลดบัตร</>}
                  </label>
                </div>
              )}
              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="flex-1">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField th="ชื่อ-นามสกุล" en="Name" required value={form.fullName} onChange={v => set('fullName', v)} invalid={!!errors.fullName} />
                    <TextField th="ชื่อเล่น" en="Nickname" value={form.nickname} onChange={v => set('nickname', v)} />
                    <TextField th="เลขที่บัตรประชาชน" en="Identity card no." value={form.idCard} onChange={v => set('idCard', v)}
                      format={formatThaiId} inputMode="numeric" maxLength={17} placeholder="X-XXXX-XXXXX-XX-X"
                      hint={form.idCard && !isThaiIdComplete(form.idCard) ? 'กรุณากรอกให้ครบ 13 หลัก · 13 digits required' : 'X-XXXX-XXXXX-XX-X'}
                      invalid={(!!form.idCard && !isThaiIdComplete(form.idCard)) || !!errors.idCard} />
                    <TextField th="บัตรหมดอายุ" en="Expiration date" type="date" value={form.idCardExpiry} onChange={v => set('idCardExpiry', v)} />
                    <TextField th="วันเดือนปีเกิด" en="Date of Birth" type="date" value={form.dob} onChange={v => setForm(f => ({ ...f, dob: v, age: calcAge(v) }))} />
                    <ComboField th="ศาสนา" en="Religion" value={form.religion} onChange={v => set('religion', v)} options={OPT_RELIGION} />
                  </div>
                </div>
                {/* Photo */}
                <div className="flex w-full shrink-0 flex-col items-center sm:w-40">
                  <span className="mb-1 block text-xs font-bold text-slate-600">Recent Photo <span className="font-semibold text-slate-400">(รูปถ่าย)</span></span>
                  <label className="afp-noprint group relative flex aspect-[3/4] w-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-[#2447d8] hover:text-[#2447d8] sm:w-full">
                    {form.photo ? (
                      <img src={form.photo} alt="photo" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex flex-col items-center gap-1 text-center text-[11px] font-bold"><Camera size={22} />Upload (อัปโหลด)</span>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
                  </label>
                  {form.photo && (
                    <button onClick={() => set('photo', '')} className="afp-noprint mt-2 text-xs font-bold text-red-500 hover:underline">Remove (ลบรูป)</button>
                  )}
                  {/* print-only image */}
                  <div className="afp-print-only hidden aspect-[3/4] w-32 items-center justify-center overflow-hidden rounded-xl border border-slate-300">
                    {form.photo && <img src={form.photo} alt="photo" className="h-full w-full object-cover" />}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <TextField th="เพศ" en="Sex" value={form.sex} onChange={v => set('sex', v)} type="select" options={['', 'ชาย', 'หญิง']} />
                <TextField th="อายุ" en="Age" value={form.age ? `${form.age} ปี / yrs` : ''} onChange={() => {}} readOnly placeholder="คำนวณจากวันเกิด" hint="คำนวณอัตโนมัติจากวันเกิด · auto from Date of Birth" />
                <TextField th="ส่วนสูง (ซม.)" en="Height (cm)" value={form.height} onChange={v => set('height', v)} format={formatInt} inputMode="numeric" placeholder="ซม. / cm" />
                <TextField th="น้ำหนัก (กก.)" en="Weight (kg)" value={form.weight} onChange={v => set('weight', v)} format={formatInt} inputMode="numeric" placeholder="กก. / kg" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ThaiAddress
                  titleEn="Current Address" titleTh="ที่อยู่ปัจจุบัน"
                  values={{ address: form.currentAddress, zipcode: form.zipcode, province: form.province, amphoe: form.amphoe, subdistrict: form.subdistrict }}
                  names={{ address: 'currentAddress', zipcode: 'zipcode', province: 'province', amphoe: 'amphoe', subdistrict: 'subdistrict' }}
                  onPatch={patch}
                />
                <ThaiAddress
                  titleEn="Birth Place / Domicile" titleTh="ที่อยู่ภูมิลำเนา"
                  values={{ address: form.birthPlace, zipcode: form.birthZipcode, province: form.birthProvince, amphoe: form.birthAmphoe, subdistrict: form.birthSubdistrict }}
                  names={{ address: 'birthPlace', zipcode: 'birthZipcode', province: 'birthProvince', amphoe: 'birthAmphoe', subdistrict: 'birthSubdistrict' }}
                  onPatch={patch}
                />
                <TextField th="เบอร์โทร" en="Tel" value={form.tel} onChange={v => set('tel', v)} format={formatPhone} inputMode="tel" maxLength={12} placeholder="0XX-XXX-XXXX" />
                <TextField th="อีเมล" en="E-mail" required value={form.email} onChange={v => set('email', v)} type="email" inputMode="email" placeholder="name@example.com"
                  invalid={(!!form.email && !EMAIL_RE.test(form.email)) || !!errors.email} />
              </div>
            </Section>

            {/* ---- Education ---- */}
            <Section id="sec-education" icon={GraduationCap} title="ประวัติการศึกษา" en="Education Background">
              {form.education.map((row, i) => (
                <RowCard key={i} index={i} onRemove={() => delRow('education', i)} removable={form.education.length > 1}>
                  <TextField th="ระยะเวลา (จาก-ถึง)" en="Period" value={row.period} onChange={v => setRow('education', i, 'period', v)} />
                  <TextField th="สถาบัน" en="Institute" value={row.institute} onChange={v => setRow('education', i, 'institute', v)} />
                  <ComboField th="คณะ" en="Faculty" value={row.faculty} onChange={v => setRow('education', i, 'faculty', v)} options={OPT_FACULTY} />
                  <TextField th="สาขาวิชา" en="Major" value={row.major} onChange={v => setRow('education', i, 'major', v)} />
                  <TextField th="เกรดเฉลี่ย" en="GPAX" value={row.gpax} onChange={v => setRow('education', i, 'gpax', v)} format={formatGpa} inputMode="decimal" placeholder="0.00" />
                </RowCard>
              ))}
              <AddBtn onClick={() => addRow('education', emptyEdu)}>Add Education / เพิ่มประวัติการศึกษา</AddBtn>
            </Section>

            {/* ---- Training ---- */}
            <Section id="sec-training" icon={FileText} title="ประสบการณ์การฝึกอบรม" en="Training Experiences">
              {form.training.map((row, i) => (
                <RowCard key={i} index={i} onRemove={() => delRow('training', i)} removable={form.training.length > 1}>
                  <TextField th="ระยะเวลา (จาก-ถึง)" en="Period" value={row.period} onChange={v => setRow('training', i, 'period', v)} />
                  <TextField th="หลักสูตร" en="Training Course" value={row.course} onChange={v => setRow('training', i, 'course', v)} />
                  <TextField th="สถาบัน" en="Institute" value={row.institute} onChange={v => setRow('training', i, 'institute', v)} />
                </RowCard>
              ))}
              <AddBtn onClick={() => addRow('training', emptyTraining)}>Add Training / เพิ่มการฝึกอบรม</AddBtn>
            </Section>

            {/* ---- Work ---- */}
            <Section id="sec-work" icon={Briefcase} title="ประสบการณ์การทำงาน" en="Working Experiences (เริ่มจากงานก่อนหน้า)">
              {form.work.map((row, i) => (
                <RowCard key={i} index={i} onRemove={() => delRow('work', i)} removable={form.work.length > 1}>
                  <TextField th="ระยะเวลา (จาก-ถึง)" en="Period" value={row.period} onChange={v => setRow('work', i, 'period', v)} />
                  <TextField th="ชื่อบริษัท / ที่อยู่" en="Company / Address" value={row.company} onChange={v => setRow('work', i, 'company', v)} />
                  <TextField th="ตำแหน่งงาน" en="Job title" value={row.jobTitle} onChange={v => setRow('work', i, 'jobTitle', v)} />
                  <TextField th="เงินเดือน" en="Salary" value={row.salary} onChange={v => setRow('work', i, 'salary', v)} format={formatMoney} inputMode="numeric" placeholder="e.g. 25,000" />
                  <AreaField className="sm:col-span-2" th="ความรับผิดชอบ" en="Responsibilities" value={row.responsibilities} onChange={v => setRow('work', i, 'responsibilities', v)} />
                  <AreaField className="sm:col-span-2" th="เหตุผลที่ออก" en="Reason to leave" value={row.reason} onChange={v => setRow('work', i, 'reason', v)} />
                </RowCard>
              ))}
              <AddBtn onClick={() => addRow('work', emptyWork)}>Add Work Experience / เพิ่มประสบการณ์ทำงาน</AddBtn>
            </Section>

            {/* ---- Skills ---- */}
            <Section id="sec-skills" icon={Cpu} title="ทักษะ" en="Skills">
              <AreaField th="งานอดิเรก / งานนอกเวลา" en="Hobbies / Free times" value={form.hobbies} onChange={v => set('hobbies', v)} />

              {/* Typing */}
              <div className="mt-5">
                <SubHead>Typing Skills <span className="font-semibold text-slate-400">(ทักษะพิมพ์ดีด — words/min)</span></SubHead>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField th="ภาษาไทย (ความเร็ว)" en="Thai — words/min" value={form.typing.thai} onChange={v => setNested('typing', 'thai', v)} format={formatInt} inputMode="numeric" placeholder="คำ/นาที" />
                  <TextField th="ภาษาอังกฤษ (ความเร็ว)" en="English — words/min" value={form.typing.english} onChange={v => setNested('typing', 'english', v)} format={formatInt} inputMode="numeric" placeholder="words/min" />
                </div>
              </div>

              {/* Language skills matrix */}
              <div className="mt-5">
                <SubHead>Language Skills <span className="font-semibold text-slate-400">(ทักษะด้านภาษา)</span></SubHead>
                <div className="space-y-4">
                  <LangBlock title="ไทย (Thai)" data={form.language.thai} onSet={(a, v) => setLang('thai', a, v)} />
                  <LangBlock title="อังกฤษ (English)" data={form.language.english} onSet={(a, v) => setLang('english', a, v)} />
                  <LangBlock
                    title="อื่น ๆ (Other)"
                    data={form.language.other}
                    onSet={(a, v) => setLang('other', a, v)}
                    labelField={
                      <input
                        className={INPUT_CLS + ' max-w-[180px]'}
                        placeholder="Specify (ระบุภาษา)"
                        value={form.language.other.label}
                        onChange={e => setLang('other', 'label', e.target.value)}
                      />
                    }
                  />
                </div>
              </div>

              {/* Computer skills */}
              <div className="mt-5">
                <SubHead>Computer Skills <span className="font-semibold text-slate-400">(ทักษะด้านคอมพิวเตอร์)</span></SubHead>
                {form.computer.map((row, i) => (
                  <RowCard key={i} index={i} onRemove={() => delRow('computer', i)} removable={form.computer.length > 1}>
                    <ComboField th="โปรแกรม" en="Program" value={row.program} onChange={v => setRow('computer', i, 'program', v)} options={OPT_PROGRAM} placeholder="เลือกหรือพิมพ์โปรแกรม" />
                    <ComboField th="ระดับความสามารถ" en="Ability level" value={row.ability} onChange={v => setRow('computer', i, 'ability', v)} options={OPT_ABILITY} placeholder="เลือกหรือพิมพ์ระดับ" />
                  </RowCard>
                ))}
                <AddBtn onClick={() => addRow('computer', emptyComputer)}>Add Program / เพิ่มโปรแกรม</AddBtn>
              </div>
            </Section>

            {/* ---- References & emergency ---- */}
            <Section id="sec-refs" icon={Users} title="บุคคลอ้างอิง / ผู้ติดต่อฉุกเฉิน" en="References & Emergency Contact">
              <SubHead>Reference Peoples <span className="font-semibold text-slate-400">(บุคคลอ้างอิง)</span></SubHead>
              {form.references.map((row, i) => (
                <RowCard key={i} index={i} onRemove={() => delRow('references', i)} removable={form.references.length > 1}>
                  <TextField th="ชื่อ-นามสกุล" en="Name" value={row.name} onChange={v => setRow('references', i, 'name', v)} />
                  <TextField th="บริษัท / ตำแหน่งงาน" en="Company / Job title" value={row.company} onChange={v => setRow('references', i, 'company', v)} />
                  <ComboField th="ความสัมพันธ์" en="Relation" value={row.relation} onChange={v => setRow('references', i, 'relation', v)} options={OPT_RELATION} />
                  <TextField th="เบอร์โทร" en="Phone number" value={row.phone} onChange={v => setRow('references', i, 'phone', v)} format={formatPhone} inputMode="tel" maxLength={12} placeholder="0XX-XXX-XXXX" />
                </RowCard>
              ))}
              <AddBtn onClick={() => addRow('references', emptyRef)}>Add Reference / เพิ่มบุคคลอ้างอิง</AddBtn>

              <div className="mt-5">
                <SubHead>Emergency Contact <span className="font-semibold text-slate-400">(ผู้ติดต่อกรณีฉุกเฉิน)</span></SubHead>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField th="ชื่อ" en="Name" value={form.emergency.name} onChange={v => setNested('emergency', 'name', v)} />
                    <ComboField th="ความสัมพันธ์" en="Relation" value={form.emergency.relation} onChange={v => setNested('emergency', 'relation', v)} options={OPT_RELATION} />
                    <AreaField th="ที่อยู่" en="Address" value={form.emergency.address} onChange={v => setNested('emergency', 'address', v)} />
                    <TextField th="เบอร์โทร" en="Phone number" value={form.emergency.phone} onChange={v => setNested('emergency', 'phone', v)} format={formatPhone} inputMode="tel" maxLength={12} placeholder="0XX-XXX-XXXX" />
                  </div>
                </div>
              </div>
            </Section>

            {/* ---- Signature ---- */}
            <Section id="sec-sign" icon={PenLine} title="ลงนามผู้สมัคร" en="Applicant Signature">
              {/* Attachments */}
              <div className="afp-noprint mb-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700">
                  <Paperclip size={18} style={{ color: ACE_BLUE }} /> Attachments <span className="font-semibold text-slate-400">(แนบเอกสาร — CV / Resume / วุฒิการศึกษา)</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-black text-slate-500 transition hover:border-[#2447d8] hover:bg-blue-50 hover:text-[#2447d8] ${uploading ? 'pointer-events-none opacity-70' : ''}`}>
                    <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={onUploadFiles} disabled={uploading} />
                    {uploading ? <><Loader2 size={16} className="animate-spin" /> กำลังอัปโหลด…</> : <><Plus size={16} /> แนบไฟล์ / Add file</>}
                  </label>
                  <span className="text-xs font-semibold text-slate-400">PDF / รูป / Word · ไม่เกิน 10MB ต่อไฟล์</span>
                </div>
                {form.attachments.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {form.attachments.map(a => (
                      <li key={a.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <span className="flex min-w-0 items-center gap-2 truncate text-sm font-bold text-slate-700"><FileText size={15} className="shrink-0 text-slate-400" /> <span className="truncate">{a.name}</span></span>
                        <span className="flex shrink-0 items-center gap-3">
                          {authenticatedUser && <button onClick={() => downloadAttachment(a)} className="text-xs font-bold text-[#2447d8] hover:underline">ดาวน์โหลด</button>}
                          <button onClick={() => removeAttachment(a.id)} className="text-xs font-bold text-red-500 hover:underline">ลบ</button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <span className="mb-1 block text-xs font-bold text-slate-600">Applicant Signature <span className="font-semibold text-slate-400">(ลายมือชื่อผู้สมัคร)</span></span>
                  <SignaturePad value={form.signature} onChange={v => set('signature', v)} />
                </div>
                <div className="flex flex-col gap-4">
                  <TextField th="ชื่อ-นามสกุล (ตัวบรรจง)" en="Name" value={form.fullName} onChange={v => set('fullName', v)} />
                  <TextField th="วันที่" en="Date" type="date" value={form.signDate} onChange={v => set('signDate', v)} />
                </div>
              </div>

              {/* For interviewer (internal) */}
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
                <SubHead>For Interviewer <span className="font-semibold text-slate-400">(สำหรับการสัมภาษณ์ — เจ้าหน้าที่)</span></SubHead>
                <div className="grid gap-4 sm:grid-cols-2">
                  <AreaField th="ความเห็นครั้งที่ 1" en="1st" value={form.interview.first} onChange={v => setNested('interview', 'first', v)} />
                  <AreaField th="ความเห็นครั้งที่ 2" en="2nd" value={form.interview.second} onChange={v => setNested('interview', 'second', v)} />
                  <AreaField th="สรุป" en="Conclusion" value={form.interview.conclusion} onChange={v => setNested('interview', 'conclusion', v)} />
                  <TextField th="ผู้สัมภาษณ์" en="Interviewer" value={form.interview.interviewer} onChange={v => setNested('interview', 'interviewer', v)} />
                </div>
              </div>

              {/* PDPA consent */}
              <div className={`mt-6 rounded-2xl border p-4 ${errors.pdpaConsent ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-blue-50/40'}`}>
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={form.pdpaConsent} onChange={e => set('pdpaConsent', e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#2447d8]" />
                  <span className="text-xs font-semibold leading-5 text-slate-600">
                    <span className="font-black text-slate-800">ความยินยอม PDPA / Consent <span className="text-red-500">*</span></span><br />
                    ข้าพเจ้ายินยอมให้บริษัทเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคล (รวมถึงสำเนาบัตรประชาชนและเอกสารแนบ) เพื่อวัตถุประสงค์ในการพิจารณารับสมัครงานและการบริหารงานบุคคล ตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562<br />
                    <span className="text-slate-400">I consent to ACE collecting, using and disclosing my personal data (including ID-card copy and attachments) for recruitment and HR purposes under Thailand's PDPA (2019).</span>
                  </span>
                </label>
              </div>

              <div className="afp-noprint mt-6 flex flex-wrap justify-end gap-2">
                <Button variant="ghost" icon={Printer} onClick={handlePrint}>Print / Save PDF</Button>
                <Button variant="primary" icon={CheckCircle2} loading={sending} onClick={handleSubmit}>{sending ? 'Submitting… / กำลังส่ง' : 'Submit / ส่งใบสมัคร'}</Button>
              </div>
            </Section>

            <div className="afp-section mt-2 text-center text-[11px] font-semibold text-slate-400">{company.formCode}</div>
          </div>

          {/* Sticky mobile action bar */}
          {!submitted && (
            <div className="afp-noprint fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-slate-200 bg-white/95 px-4 py-2.5 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] backdrop-blur lg:hidden">
              <span className="flex-1 text-xs font-black text-slate-500">
                {progress}% <span className="font-bold text-slate-400">เสร็จแล้ว</span>
                {savedAt && <span className="ml-1 inline-flex items-center gap-0.5 font-bold text-emerald-500"><CheckCircle2 size={11} /> บันทึกอัตโนมัติ</span>}
              </span>
              <Button variant="primary" icon={CheckCircle2} loading={sending} onClick={handleSubmit}>{sending ? 'กำลังส่ง…' : 'ส่งใบสมัคร'}</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

/* ============================================================
   Sub-components
   ============================================================ */
const INPUT_CLS =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#2447d8] focus:ring-2 focus:ring-blue-100 placeholder:font-normal placeholder:text-slate-300'

function FormSidebar({ activeSec, onGo, mobileOpen, onMobileClose, done = {}, progress = 0 }) {
  return (
    <aside className={`afp-noprint ${mobileOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'} w-72 flex-col border-r border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:shadow-none lg:overflow-y-auto`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${ACE_BLUE}, ${ACE_RED})` }}>
          <Command size={24} />
        </div>
        <div className="min-w-0">
          <div className="text-base font-black text-slate-950">ACE Recruitment</div>
          <div className="text-xs font-bold text-slate-400">Application Form · ใบสมัครงาน</div>
        </div>
        <button onClick={onMobileClose} className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 lg:hidden" aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      {/* Progress */}
      <div className="mt-6">
        <div className="mb-1.5 flex items-center justify-between text-xs font-black">
          <span className="text-slate-500">ความคืบหน้า · Progress</span>
          <span style={{ color: ACE_BLUE }}>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${ACE_BLUE}, #22c55e)` }} />
        </div>
      </div>

      <nav className="mt-6 space-y-1">
        {SECTIONS.map(s => {
          const active = s.id === activeSec
          const ok = done[s.id]
          const Icon = s.icon
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onGo(s.id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-2 text-left text-sm font-black transition ${active ? 'bg-blue-50 text-[#2447d8] shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${ok ? 'bg-emerald-500 text-white' : active ? 'bg-blue-100 text-[#2447d8]' : 'bg-slate-100 text-slate-400'}`}>
                {ok ? <CheckCircle2 size={15} /> : <Icon size={14} />}
              </span>
              <span className="flex-1 leading-tight">
                <span className="block">{s.en}</span>
                <span className="block text-[10px] font-bold text-slate-400">{s.label}</span>
              </span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <Sparkles size={18} style={{ color: ACE_BLUE }} />
          Draft auto-saved
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
          Works on desktop &amp; mobile. Data stays on this device until submitted.<br />
          กรอกได้ทั้งคอมและมือถือ · ข้อมูลเก็บในเครื่องนี้จนกว่าจะส่ง
        </p>
      </div>
    </aside>
  )
}

function IconBtn({ children, label, onClick, className = '' }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-[#2447d8] ${className}`}
    >
      {children}
    </button>
  )
}

function Section({ id, icon: Icon, title, en, children }) {
  return (
    <section id={id} className="afp-section mb-6 scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${ACE_BLUE}12`, color: ACE_BLUE }}>
          <Icon size={20} strokeWidth={2.3} />
        </div>
        <div>
          <div className="text-base font-black text-slate-900">{en}</div>
          <div className="text-xs font-bold text-slate-400">{title}</div>
        </div>
      </div>
      {children}
    </section>
  )
}

function SubHead({ children }) {
  return <div className="mb-3 text-sm font-black text-slate-700">{children}</div>
}

function TextField({ th, en, value, onChange, type = 'text', required, options, inputMode, format, maxLength, placeholder, hint, invalid, readOnly, className = '' }) {
  const handle = e => onChange(format ? format(e.target.value) : e.target.value)
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-bold text-slate-600">
        {en || th}{required && <span className="text-red-500"> *</span>}
        {en && th && <span className="ml-1 font-semibold text-slate-400">({th})</span>}
      </span>
      {type === 'select' ? (
        <select className={INPUT_CLS} value={value} onChange={e => onChange(e.target.value)}>
          {(options || []).map((o, i) => <option key={i} value={o}>{o || '—'}</option>)}
        </select>
      ) : (
        <input
          className={`${INPUT_CLS} ${invalid ? 'border-red-300 focus:border-red-400' : ''} ${readOnly ? 'cursor-not-allowed bg-slate-100 text-slate-500' : ''}`}
          type={type}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          value={value}
          onChange={handle}
          readOnly={readOnly}
        />
      )}
      {hint && <span className={`mt-1 block text-[11px] font-semibold ${invalid ? 'text-red-500' : 'text-slate-400'}`}>{hint}</span>}
    </label>
  )
}

let _comboSeq = 0
function ComboField({ th, en, value, onChange, options = [], required, placeholder, format, maxLength, inputMode, invalid, className = '' }) {
  const listId = useRef('combo-' + (++_comboSeq)).current
  const handle = e => onChange(format ? format(e.target.value) : e.target.value)
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-bold text-slate-600">
        {en || th}{required && <span className="text-red-500"> *</span>}
        {en && th && <span className="ml-1 font-semibold text-slate-400">({th})</span>}
      </span>
      <div className="relative">
        <input
          className={`${INPUT_CLS} pr-8 ${invalid ? 'border-red-300 focus:border-red-400' : ''}`}
          list={listId}
          value={value}
          onChange={handle}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder || 'เลือกหรือพิมพ์ · Select or type'}
        />
        <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <datalist id={listId}>
          {options.map((o, i) => <option key={i} value={o} />)}
        </datalist>
      </div>
    </label>
  )
}

function AreaField({ th, en, value, onChange, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-bold text-slate-600">
        {en || th}{en && th && <span className="ml-1 font-semibold text-slate-400">({th})</span>}
      </span>
      <textarea className={INPUT_CLS + ' min-h-[64px] resize-y'} rows={2} value={value} onChange={e => onChange(e.target.value)} />
    </label>
  )
}

/* ============================================================
   Thai address block — type a postcode, auto-fill จังหวัด/อำเภอ/ตำบล
   ============================================================ */
function ThaiAddress({ titleEn, titleTh, values, names, onPatch }) {
  const { address, zipcode, province, amphoe, subdistrict } = values
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let alive = true
    const zip = onlyDigits(zipcode)
    if (zip.length !== 5) { setRows([]); setNotFound(false); return }
    setLoading(true)
    lookupZip(zip).then(r => {
      if (!alive) return
      setLoading(false)
      setRows(r)
      if (!r.length) { setNotFound(true); return }
      setNotFound(false)
      const amphoes = [...new Set(r.map(x => x.amphoe))]
      const nextAmphoe = amphoes.length === 1 ? amphoes[0] : (amphoes.includes(amphoe) ? amphoe : '')
      const districts = r.filter(x => !nextAmphoe || x.amphoe === nextAmphoe).map(x => x.district)
      const nextSub = districts.length === 1 ? districts[0] : (districts.includes(subdistrict) ? subdistrict : '')
      onPatch({ [names.province]: r[0].province, [names.amphoe]: nextAmphoe, [names.subdistrict]: nextSub })
    }).catch(() => { if (alive) setLoading(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zipcode])

  const amphoeOptions = useMemo(() => [...new Set(rows.map(x => x.amphoe))], [rows])
  const subdistrictOptions = useMemo(
    () => [...new Set(rows.filter(x => !amphoe || x.amphoe === amphoe).map(x => x.district))],
    [rows, amphoe],
  )

  return (
    <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700">
        <span>{titleEn}</span>
        <span className="font-semibold text-slate-400">({titleTh})</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block sm:col-span-1">
          <span className="mb-1 block text-xs font-bold text-slate-600">Postal code <span className="font-semibold text-slate-400">(รหัสไปรษณีย์)</span></span>
          <input
            className={`${INPUT_CLS} ${notFound ? 'border-red-300' : ''}`}
            inputMode="numeric"
            maxLength={5}
            placeholder="เช่น 10310"
            value={zipcode}
            onChange={e => onPatch({ [names.zipcode]: onlyDigits(e.target.value).slice(0, 5) })}
          />
          <span className={`mt-1 block text-[11px] font-semibold ${notFound ? 'text-red-500' : 'text-slate-400'}`}>
            {loading ? 'กำลังค้นหา… · Looking up…' : notFound ? 'ไม่พบรหัสนี้ · Postcode not found' : 'กรอกรหัสแล้วระบบเติมจังหวัด/อำเภอให้'}
          </span>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-600">Province <span className="font-semibold text-slate-400">(จังหวัด)</span></span>
          <input className={`${INPUT_CLS} cursor-not-allowed bg-slate-100 text-slate-600`} value={province} readOnly placeholder="—" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-600">District <span className="font-semibold text-slate-400">(อำเภอ/เขต)</span></span>
          {amphoeOptions.length > 1 ? (
            <select className={INPUT_CLS} value={amphoe} onChange={e => onPatch({ [names.amphoe]: e.target.value, [names.subdistrict]: '' })}>
              <option value="">— เลือก —</option>
              {amphoeOptions.map((o, i) => <option key={i} value={o}>{o}</option>)}
            </select>
          ) : (
            <input className={`${INPUT_CLS} cursor-not-allowed bg-slate-100 text-slate-600`} value={amphoe} readOnly placeholder="—" />
          )}
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-600">Sub-district <span className="font-semibold text-slate-400">(ตำบล/แขวง)</span></span>
          {subdistrictOptions.length > 0 ? (
            <select className={INPUT_CLS} value={subdistrict} onChange={e => onPatch({ [names.subdistrict]: e.target.value })}>
              <option value="">— เลือก —</option>
              {subdistrictOptions.map((o, i) => <option key={i} value={o}>{o}</option>)}
            </select>
          ) : (
            <input className={INPUT_CLS} value={subdistrict} onChange={e => onPatch({ [names.subdistrict]: e.target.value })} placeholder="ตำบล/แขวง" />
          )}
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-bold text-slate-600">House no. / Street / Moo <span className="font-semibold text-slate-400">(บ้านเลขที่ / หมู่ / ถนน)</span></span>
          <textarea className={INPUT_CLS + ' min-h-[44px] resize-y'} rows={1} value={address} onChange={e => onPatch({ [names.address]: e.target.value })} placeholder="เช่น 61/70 ถ.พระราม 9" />
        </label>
      </div>
    </div>
  )
}

function RowCard({ index, children, onRemove, removable }) {
  return (
    <div className="relative mb-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-2 text-xs font-black text-slate-500 shadow-sm">{index + 1}</span>
        {removable && (
          <button onClick={onRemove} className="afp-noprint inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-red-500 transition hover:bg-red-50" aria-label="Remove">
            <Trash2 size={14} /> Remove
          </button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  )
}

function AddBtn({ onClick, children }) {
  return (
    <button onClick={onClick} className="afp-noprint inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-black text-slate-500 transition hover:border-[#2447d8] hover:bg-blue-50 hover:text-[#2447d8]">
      <Plus size={16} /> {children}
    </button>
  )
}

const LANG_ASPECTS = [
  { key: 'speaking', label: 'Speaking (พูด)' },
  { key: 'writing', label: 'Writing (เขียน)' },
  { key: 'reading', label: 'Reading (อ่าน)' },
  { key: 'understanding', label: 'Understanding (ความเข้าใจ)' },
]
const LANG_LEVELS = [
  { key: 'good', short: 'Good', label: 'Good (ดี)' },
  { key: 'fair', short: 'Fair', label: 'Fair (ปานกลาง)' },
  { key: 'poor', short: 'Poor', label: 'Poor (พอใช้)' },
]
function LangBlock({ title, data, onSet, labelField }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700">
        {title}
        {labelField}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {LANG_ASPECTS.map(a => (
          <div key={a.key}>
            <div className="mb-1 text-xs font-bold text-slate-500">{a.label}</div>
            <div className="grid grid-cols-3 gap-1.5">
              {LANG_LEVELS.map(lv => {
                const on = data[a.key] === lv.key
                return (
                  <button
                    key={lv.key}
                    type="button"
                    onClick={() => onSet(a.key, on ? '' : lv.key)}
                    className={`afp-seg rounded-lg px-2 py-1.5 text-xs font-bold transition ${on ? 'afp-seg-on bg-[#2447d8] text-white shadow-sm' : 'bg-white text-slate-500 hover:bg-blue-50'}`}
                    title={lv.label}
                  >
                    {lv.short}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SignaturePad({ value, onChange }) {
  const ref = useRef(null)
  const drawing = useRef(false)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0f172a'
    if (value) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, c.width, c.height)
      img.src = value
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function point(e) {
    const c = ref.current
    const r = c.getBoundingClientRect()
    const t = e.touches ? e.touches[0] : e
    return { x: (t.clientX - r.left) * (c.width / r.width), y: (t.clientY - r.top) * (c.height / r.height) }
  }
  function start(e) {
    e.preventDefault()
    drawing.current = true
    const ctx = ref.current.getContext('2d')
    const p = point(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
  }
  function move(e) {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = ref.current.getContext('2d')
    const p = point(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }
  function end() {
    if (!drawing.current) return
    drawing.current = false
    onChange(ref.current.toDataURL('image/png'))
  }
  function clear() {
    const c = ref.current
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
    onChange('')
  }

  return (
    <div>
      <canvas
        ref={ref}
        width={460}
        height={150}
        className="w-full touch-none rounded-xl border-2 border-dashed border-slate-300 bg-white"
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <div className="afp-noprint mt-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">Sign with mouse or finger · เซ็นด้วยเมาส์หรือนิ้ว</span>
        <button onClick={clear} className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:underline">
          <RotateCcw size={13} /> Clear (ล้าง)
        </button>
      </div>
    </div>
  )
}

function SubmittedBanner({ refNo, onPrint, onNew }) {
  return (
    <div className="afp-noprint mb-6 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-emerald-100 p-2.5 text-emerald-600"><CheckCircle2 size={22} /></div>
          <div>
            <div className="text-base font-black text-slate-900">Application Submitted · ส่งใบสมัครเรียบร้อยแล้ว</div>
            <div className="text-xs font-semibold text-slate-500">We have received your application — thank you · ระบบได้รับใบสมัครของท่านแล้ว ขอบคุณครับ</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" icon={Printer} onClick={onPrint}>Print / PDF</Button>
          <Button variant="primary" icon={Plus} onClick={onNew}>New Form / กรอกใหม่</Button>
        </div>
      </div>
      {refNo && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3">
          <span className="text-xs font-bold text-slate-400">เลขที่อ้างอิง · Reference No.</span>
          <span className="text-lg font-black tracking-wider" style={{ color: ACE_BLUE }}>{refNo}</span>
          <span className="text-xs font-semibold text-slate-400">กรุณาเก็บไว้อ้างอิง · please keep this for your records</span>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Access gate screen (public applicants without a valid link)
   ============================================================ */
function GateScreen({ mode }) {
  const checking = mode === 'checking'
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <img src="/ace-logo.png" alt="ACE" className="mx-auto mb-4 h-12 w-12 rounded-xl object-contain" onError={e => { e.currentTarget.style.display = 'none' }} />
        {checking ? (
          <>
            <Loader2 size={34} className="mx-auto mb-3 animate-spin" style={{ color: ACE_BLUE }} />
            <div className="text-base font-black text-slate-900">Checking invite link…</div>
            <div className="mt-1 text-sm font-semibold text-slate-500">กำลังตรวจสอบลิงก์เชิญ</div>
          </>
        ) : (
          <>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertTriangle size={30} />
            </div>
            <div className="text-lg font-black text-slate-900">Invalid or expired link</div>
            <div className="mt-1 text-sm font-bold text-slate-500">ลิงก์ไม่ถูกต้องหรือหมดอายุ</div>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">
              This application form can only be opened with a personal invite link.<br />
              ฟอร์มนี้เปิดได้เฉพาะผู้ที่ได้รับลิงก์เชิญส่วนตัวเท่านั้น
            </p>
            <p className="mt-4 text-xs font-bold text-slate-400">
              Please contact HR for a new link · กรุณาติดต่อฝ่ายบุคคลเพื่อขอลิงก์ใหม่
            </p>
          </>
        )}
      </div>
    </div>
  )
}

/* ============================================================
   HR console — generate invite links + review submissions
   ============================================================ */
function HrConsole({ onLoad, onCompanyChange }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [days, setDays] = useState(14)
  const [sendEmail, setSendEmail] = useState(false)
  const [company, setCompany] = useState(DEFAULT_COMPANY)
  const [busy, setBusy] = useState(false)
  const [link, setLink] = useState('')
  const [items, setItems] = useState([])
  const [loadingList, setLoadingList] = useState(false)

  async function refresh() {
    setLoadingList(true)
    try {
      const res = await apiFetch('/api/applications')
      if (res.ok) { const j = await res.json(); setItems(j.items || []) }
    } catch (_) {} finally { setLoadingList(false) }
  }
  useEffect(() => { refresh() }, [])

  async function generate() {
    setBusy(true); setLink('')
    try {
      const res = await apiFetch('/api/applications/invite', {
        method: 'POST',
        body: JSON.stringify({ name, email, expiresDays: Number(days) || 14, sendEmail, company }),
      })
      if (!res.ok) { toast('Failed to create link · สร้างลิงก์ไม่สำเร็จ', 'err'); return }
      const j = await res.json()
      setLink(j.url)
      toast(j.emailed ? 'Link created & emailed · สร้างลิงก์และส่งอีเมลแล้ว' : 'Invite link created · สร้างลิงก์แล้ว', 'ok')
    } catch (_) { toast('Network error · เชื่อมต่อไม่ได้', 'err') } finally { setBusy(false) }
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(link); toast('Copied · คัดลอกแล้ว', 'ok') } catch (_) {}
  }

  async function viewApp(id) {
    try {
      const res = await apiFetch(`/api/applications/${id}`)
      if (res.ok) { const j = await res.json(); onLoad(j.data || {}) }
    } catch (_) {}
  }

  const fmt = (s) => { try { return new Date(s).toLocaleString() } catch (_) { return s || '' } }

  return (
    <div className="afp-noprint mb-6 space-y-4">
      {/* Invite generator */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
          <ShieldCheck size={18} style={{ color: ACE_BLUE }} /> HR · สร้างลิงก์เชิญผู้สมัคร (Generate Invite Link)
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-xs font-bold text-slate-600">บริษัท · Company</label>
          <select value={company} onChange={e => { setCompany(e.target.value); onCompanyChange?.(e.target.value) }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-blue-400 sm:max-w-md">
            {COMPANY_LIST.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Applicant name · ชื่อผู้สมัคร"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400" />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400" />
          <input type="number" min={1} max={120} value={days} onChange={e => setDays(e.target.value)} placeholder="Days"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400" />
          <Button variant="primary" icon={Link2} loading={busy} onClick={generate}>Generate / สร้างลิงก์</Button>
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600">
          <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} />
          <Mail size={14} /> Email the link to the applicant · ส่งลิงก์ทางอีเมลให้ผู้สมัคร
        </label>
        {link && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2">
            <input readOnly value={link} className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-700 outline-none" onFocus={e => e.target.select()} />
            <button onClick={copyLink} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-black text-white" style={{ background: ACE_BLUE }}>
              <Copy size={13} /> Copy
            </button>
          </div>
        )}
      </div>

      {/* Submissions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-black text-slate-900">
            <Inbox size={18} style={{ color: ACE_BLUE }} /> ใบสมัครที่ส่งเข้ามา (Submissions) · {items.length}
          </div>
          <button onClick={refresh} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900">
            <RotateCcw size={13} /> Refresh
          </button>
        </div>
        {loadingList ? (
          <div className="py-6 text-center text-sm font-semibold text-slate-400">Loading…</div>
        ) : items.length === 0 ? (
          <div className="py-6 text-center text-sm font-semibold text-slate-400">No applications yet · ยังไม่มีใบสมัคร</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <th className="px-2 py-2">Name · ชื่อ</th>
                  <th className="px-2 py-2">Position · ตำแหน่ง</th>
                  <th className="px-2 py-2 hidden sm:table-cell">Contact</th>
                  <th className="px-2 py-2 hidden md:table-cell">Submitted</th>
                  <th className="px-2 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-2 py-2 font-bold text-slate-900">
                      {it.fullName || '-'}
                      <span className="block text-[10px] font-bold text-slate-400">
                        {it.refNo}{it.attachmentCount ? ` · 📎${it.attachmentCount}` : ''}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-slate-600">{it.position || '-'}</td>
                    <td className="px-2 py-2 text-slate-500 hidden sm:table-cell">{it.email || it.phone || '-'}</td>
                    <td className="px-2 py-2 text-slate-400 hidden md:table-cell">{fmt(it.createdAt)}</td>
                    <td className="px-2 py-2 text-right">
                      <button onClick={() => viewApp(it.id)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700">
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function PrintStyles() {
  return (
    <style>{`
      .afp-print-only { display: none; }
      @media print {
        .afp-noprint { display: none !important; }
        .afp-root { background: #fff !important; }
        .afp-main { padding: 0 !important; }
        .afp-print-only { display: flex !important; }
        .afp-section { box-shadow: none !important; border: 1px solid #cbd5e1 !important; break-inside: avoid; }
        .afp-seg-on { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        input, textarea, select { border-color: #94a3b8 !important; }
        @page { margin: 12mm; }
      }
    `}</style>
  )
}
