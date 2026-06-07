"""
Bill Profile Registry — นิยามชนิดบิลแต่ละแบบ (ขยายง่าย)

แต่ละ profile บอก: วิธีจำแนก (keywords), อัตรา WHT, จะอ่าน VAT ไหม,
ฟอร์ม PV ปลายทาง, ชนิด identifier, และรูปแบบ desc

เพิ่มชนิดบิลใหม่ = เพิ่ม BillProfile 1 ตัวใน PROFILES — ไม่ต้องแก้ pipeline
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class BillProfile:
    key: str                       # รหัสภายใน เช่น 'telecom', 'electricity'
    label: str                     # ชื่อแสดงผล (ไทย)
    keywords: list[str]            # คำที่ใช้จำแนกชนิด (เทียบแบบ lowercase ใน OCR)
    wht_rate: float                # อัตราหัก ณ ที่จ่าย (0.03 / 0.05 / 0.0)
    extract_vat: bool              # True=อ่าน VAT 7% / False=ยอดรวมอยู่แล้ว (vat=0, net=amount)
    pv_template: str               # 'pv03' | 'pv04'
    id_kind: str                   # 'phone' | 'meter' | 'contract' | 'site' | 'none'
    desc_prefix: str               # นำหน้า desc เช่น 'AIS no.', 'Electricity', 'Fleet card'
    default_vendor: str = ""       # ชื่อผู้ให้บริการเริ่มต้น (ถ้า OCR ไม่เจอ)


# ลำดับสำคัญ: ตัวที่เฉพาะเจาะจงกว่าอยู่ก่อน 'other'
PROFILES: list[BillProfile] = [
    BillProfile(
        key="telecom", label="Telephone (AIS/True/DTAC/NT)",
        keywords=["ais", "awn", "true move", "truemove", "dtac", "total access",
                  "national telecom", " nt ", "tot", "ใบแจ้งค่าใช้บริการ", "เลขหมาย"],
        wht_rate=0.03, extract_vat=True, pv_template="pv03",
        id_kind="phone", desc_prefix="",  # desc ใช้ brand+phone
    ),
    BillProfile(
        key="electricity", label="Electricity / Water",
        keywords=["การไฟฟ้า", "electricity", "metropolitan electricity", "provincial electricity",
                  "mea", "pea", "การประปา", "water works", "ค่าไฟฟ้า", "ค่าน้ำ"],
        wht_rate=0.0, extract_vat=True, pv_template="pv03",
        id_kind="meter", desc_prefix="Electricity charge",
        default_vendor="Metropolitan Electricity Authority of Thailand (MEA Payment)",
    ),
    BillProfile(
        key="fleet", label="Fleet card / Fuel",
        keywords=["fleet card", "fleet", "บัตรเติมน้ำมัน", "น้ำมัน", "gasoline", "diesel",
                  "ptt", "bangchak", "บางจาก", "krungthai", "กรุงไทย"],
        wht_rate=0.0, extract_vat=False, pv_template="pv03",
        id_kind="none", desc_prefix="Fleet card for gasoline and diesel",
        default_vendor="KrungThai Bank Public Company Limited (Bill Payment)",
    ),
    BillProfile(
        key="rental", label="Rental",
        keywords=["ค่าเช่า", "เช่า", "rental", "lease", "สัญญาเช่า"],
        wht_rate=0.05, extract_vat=True, pv_template="pv03",
        id_kind="contract", desc_prefix="Rental",
    ),
    BillProfile(
        key="subcon_te", label="Subcontractor (TE)",
        keywords=["subcontractor", "subcon", "ผู้รับเหมา", "ผรม", "te project", "งวดงาน"],
        wht_rate=0.03, extract_vat=True, pv_template="pv04",
        id_kind="site", desc_prefix="Subcontractor",
    ),
    BillProfile(
        key="other", label="Other (general service)",
        keywords=[],
        wht_rate=0.03, extract_vat=True, pv_template="pv03",
        id_kind="none", desc_prefix="Service",
    ),
]

PROFILE_BY_KEY = {p.key: p for p in PROFILES}
DEFAULT_PROFILE = PROFILE_BY_KEY["other"]


def classify(full_text: str) -> BillProfile:
    """เดาชนิดบิลจากข้อความ OCR ทั้งไฟล์ (นับคำที่เจอ) — เลือกคะแนนสูงสุด"""
    low = (full_text or "").lower()
    best, best_score = DEFAULT_PROFILE, 0
    for p in PROFILES:
        if not p.keywords:
            continue
        score = sum(low.count(k.lower()) for k in p.keywords)
        if score > best_score:
            best, best_score = p, score
    return best


def get_profile(key: str | None) -> BillProfile:
    return PROFILE_BY_KEY.get(key or "", DEFAULT_PROFILE)


def public_list() -> list[dict]:
    """รายการ profile สำหรับ dropdown ฝั่ง frontend"""
    return [
        {"key": p.key, "label": p.label, "wht_rate": p.wht_rate,
         "extract_vat": p.extract_vat, "pv_template": p.pv_template,
         "id_kind": p.id_kind, "desc_prefix": p.desc_prefix}
        for p in PROFILES
    ]
