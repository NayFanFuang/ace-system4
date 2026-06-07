"""FTP service — push DTE report .rar files to the team logfile server.

Folder convention (matches the team's existing structure):
    {BASE_DIR}/Y{YYYY}/{YYYY-MMmon}/{YYYY-MM-DD}/{filename}
e.g.
    /1_Logfile DT Day/Y2026/2026-04Apr/2026-04-30/CBR7995_conso__East R3.rar

The date used is the DT-done date of the site (so reports land in the same
day-folder as the rest of that day's logs).

ftplib is blocking, so callers run these via asyncio.to_thread().
"""
import ftplib
import os
import tempfile
from datetime import date, datetime


FTP_HOST = os.getenv("FTP_HOST", "")
FTP_PORT = int(os.getenv("FTP_PORT", "21"))
FTP_USER = os.getenv("FTP_USER", "")
FTP_PASSWORD = os.getenv("FTP_PASSWORD", "")
FTP_BASE_DIR = os.getenv("FTP_BASE_DIR", "/1_Logfile DT Day")
FTP_TIMEOUT = int(os.getenv("FTP_TIMEOUT", "60"))


def is_configured() -> bool:
    return bool(FTP_HOST and FTP_USER and FTP_PASSWORD)


def date_folder_parts(d: date) -> list[str]:
    """Return the folder chain for a date, relative to BASE_DIR.
    e.g. date(2026,4,30) -> ['Y2026', '2026-04Apr', '2026-04-30']
    """
    return [
        f"Y{d.strftime('%Y')}",
        d.strftime("%Y-%m%b"),   # 2026-04Apr
        d.strftime("%Y-%m-%d"),  # 2026-04-30
    ]


def _connect() -> ftplib.FTP:
    ftp = ftplib.FTP()
    ftp.connect(FTP_HOST, FTP_PORT, timeout=FTP_TIMEOUT)
    ftp.login(FTP_USER, FTP_PASSWORD)
    ftp.set_pasv(True)
    return ftp


def _ensure_dir_chain(ftp: ftplib.FTP, base: str, parts: list[str]) -> str:
    """cd to base, then create+enter each part. Returns the final absolute dir."""
    ftp.cwd(base)
    for p in parts:
        try:
            ftp.cwd(p)
        except ftplib.error_perm:
            ftp.mkd(p)
            ftp.cwd(p)
    return ftp.pwd()


def upload_report_sync(local_path: str, dt_date: date, filename: str) -> str:
    """Upload local file to the date folder. Returns the full remote path.
    Raises on failure (caller maps to HTTP error).
    """
    if not is_configured():
        raise RuntimeError("FTP is not configured (FTP_HOST/USER/PASSWORD)")
    ftp = _connect()
    try:
        remote_dir = _ensure_dir_chain(ftp, FTP_BASE_DIR, date_folder_parts(dt_date))
        with open(local_path, "rb") as fh:
            ftp.storbinary(f"STOR {filename}", fh)
        full = remote_dir.rstrip("/") + "/" + filename
        return full
    finally:
        try:
            ftp.quit()
        except Exception:
            pass


def download_report_sync(remote_path: str) -> str:
    """RETR remote file to a temp local file. Returns the temp path.
    Caller is responsible for deleting the temp file after streaming.
    """
    if not is_configured():
        raise RuntimeError("FTP is not configured")
    ftp = _connect()
    try:
        directory, _, name = remote_path.rpartition("/")
        if directory:
            ftp.cwd(directory)
        fd, tmp = tempfile.mkstemp(suffix=".rar")
        os.close(fd)
        with open(tmp, "wb") as out:
            ftp.retrbinary(f"RETR {name}", out.write)
        return tmp
    finally:
        try:
            ftp.quit()
        except Exception:
            pass


def remote_exists_sync(remote_path: str) -> bool:
    """Check a remote file exists (SIZE command)."""
    if not is_configured():
        return False
    ftp = _connect()
    try:
        try:
            ftp.voidcmd("TYPE I")
            ftp.size(remote_path)
            return True
        except ftplib.error_perm:
            return False
    finally:
        try:
            ftp.quit()
        except Exception:
            pass
