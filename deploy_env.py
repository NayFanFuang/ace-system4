"""Shared loader for production deploy credentials.

Reads DEPLOY_* from the .env file next to this script (or real environment
variables, which take precedence). No external dependency required.

Keeps SSH credentials OUT of the deploy scripts so they can be committed/pushed
safely — secrets live only in .env, which is gitignored.
"""
import os


def _load_dotenv(path: str) -> None:
    """Minimal .env parser — sets os.environ for KEY=VALUE lines (no overwrite)."""
    if not os.path.isfile(path):
        return
    with open(path, "r", encoding="utf-8") as fh:
        for raw in fh:
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


def load_deploy_creds() -> dict:
    """Return {host, port, user, password}, raising if any are missing."""
    here = os.path.dirname(os.path.abspath(__file__))
    _load_dotenv(os.path.join(here, ".env"))

    host = os.getenv("DEPLOY_HOST")
    port = os.getenv("DEPLOY_PORT", "22")
    user = os.getenv("DEPLOY_USER")
    password = os.getenv("DEPLOY_PASSWORD")

    missing = [k for k, v in {"DEPLOY_HOST": host, "DEPLOY_USER": user, "DEPLOY_PASSWORD": password}.items() if not v]
    if missing:
        raise SystemExit(
            "Missing deploy credentials in .env: " + ", ".join(missing) +
            "\nAdd them to .env (see .env.example)."
        )
    return {"host": host, "port": int(port), "user": user, "password": password}
