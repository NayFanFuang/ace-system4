from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class BillCorrection(Base):
    """บันทึกข้อมูลบิลที่ผู้ใช้ตรวจ/แก้แล้ว (ตอนกด Generate PV)

    ใช้ 2 อย่าง:
      1) Memory — ครั้งหน้าเจอ identifier เดิม ดึงค่ามาเติมให้อัตโนมัติ (ระบบฉลาดขึ้น)
      2) Dataset — เก็บคู่ (OCR เดา vs ค่าที่ถูก) ไว้เทรนโมเดลในอนาคต (Level 3)
    """
    __tablename__ = "bill_corrections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    bill_type: Mapped[str] = mapped_column(String(30), index=True, default="")
    vendor: Mapped[str] = mapped_column(String(255), default="")
    identifier: Mapped[str] = mapped_column(String(60), default="")
    identifier_norm: Mapped[str] = mapped_column(String(60), index=True, default="")  # ตัวเลขล้วน ไว้ match
    period: Mapped[str] = mapped_column(String(60), default="")
    amount: Mapped[float] = mapped_column(Float, default=0.0)
    vat: Mapped[float] = mapped_column(Float, default=0.0)
    wht: Mapped[float] = mapped_column(Float, default=0.0)
    net: Mapped[float] = mapped_column(Float, default=0.0)
    description: Mapped[str] = mapped_column(Text, default="")
    ocr_raw: Mapped[dict] = mapped_column(JSON, default=dict)  # ค่าที่ OCR เดามาตอนแรก (สำหรับเทรน)
    source_filename: Mapped[str] = mapped_column(String(255), default="")
    created_by: Mapped[str] = mapped_column(String(30), default="", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
