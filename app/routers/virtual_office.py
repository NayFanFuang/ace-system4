"""Virtual Office (Pixel Town) — realtime presence + chat + WebRTC voice signaling.

A single WebSocket endpoint backs the pixel office at /office. It carries ONLY tiny
control messages (position, chat, WebRTC signaling). The actual voice runs peer-to-peer
over WebRTC, so it never touches this server — keeping load off the shared event loop.

Design constraints (see CLAUDE.md "will it slow other systems"):
  * Fully async, no blocking calls.
  * No database access — player presence is ephemeral in-memory state.
  * Position updates are throttled client-side; we just relay.

State is per-process. The backend runs a single uvicorn worker, so one in-memory hub is
enough. If this is ever scaled to multiple workers, swap the broadcast for Redis pub/sub.
"""
from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError

from app.services.auth_service import decode_access_token

router = APIRouter()

# Spawn point = centre of the Lobby (tile 21,6 @ 32px tiles). Mirrors the frontend map.
SPAWN_X = 21 * 32
SPAWN_Y = 6 * 32


class OfficeHub:
    """Holds every connected player. Pure in-memory, single process."""

    def __init__(self) -> None:
        self.players: dict[int, dict] = {}
        self._seq = 0

    def next_id(self) -> int:
        self._seq += 1
        return self._seq


hub = OfficeHub()


def _public(p: dict) -> dict:
    """The view of a player that is safe to send to other clients (no ws handle)."""
    return {
        "id": p["id"],
        "name": p["name"],
        "code": p["code"],
        "role": p["role"],
        "x": p["x"],
        "y": p["y"],
        "dir": p["dir"],
        "room": p["room"],
        "muted": p["muted"],
    }


async def _broadcast(message: dict, exclude: int | None = None) -> None:
    """Send to everyone (optionally excluding one). Drops dead connections silently."""
    dead: list[int] = []
    for pid, p in list(hub.players.items()):
        if pid == exclude:
            continue
        try:
            await p["ws"].send_json(message)
        except Exception:
            dead.append(pid)
    for pid in dead:
        hub.players.pop(pid, None)


@router.websocket("/api/ws/office")
async def office_ws(ws: WebSocket) -> None:
    # Auth: JWT is passed as a query param because browsers can't set headers on a WS.
    token = ws.query_params.get("token")
    try:
        payload = decode_access_token(token or "")
    except JWTError:
        await ws.close(code=4001)
        return

    await ws.accept()
    pid = hub.next_id()
    me = {
        "ws": ws,
        "id": pid,
        "name": payload.get("name") or payload.get("sub") or "Unknown",
        "code": payload.get("sub") or "",
        "role": payload.get("role") or "EMPLOYEE",
        "x": SPAWN_X,
        "y": SPAWN_Y,
        "dir": "down",
        "room": None,
        "muted": False,
    }
    hub.players[pid] = me

    # Tell the newcomer who is already here, then announce them to everyone else.
    others = [_public(p) for q, p in hub.players.items() if q != pid]
    await ws.send_json({"type": "init", "id": pid, "you": _public(me), "players": others})
    await _broadcast({"type": "join", "player": _public(me)}, exclude=pid)

    try:
        while True:
            msg = await ws.receive_json()
            t = msg.get("type")

            if t == "move":
                me["x"] = msg.get("x", me["x"])
                me["y"] = msg.get("y", me["y"])
                me["dir"] = msg.get("dir", me["dir"])
                me["room"] = msg.get("room")
                await _broadcast(
                    {"type": "move", "id": pid, "x": me["x"], "y": me["y"],
                     "dir": me["dir"], "room": me["room"]},
                    exclude=pid,
                )

            elif t == "chat":
                text = (msg.get("text") or "").strip()[:300]
                if text:
                    await _broadcast({"type": "chat", "id": pid, "name": me["name"], "text": text})

            elif t == "state":
                me["muted"] = bool(msg.get("muted"))
                await _broadcast({"type": "state", "id": pid, "muted": me["muted"]}, exclude=pid)

            elif t == "signal":
                # WebRTC offer/answer/ICE — relay verbatim to the single target peer.
                target = hub.players.get(msg.get("to"))
                if target:
                    try:
                        await target["ws"].send_json(
                            {"type": "signal", "from": pid, "data": msg.get("data")}
                        )
                    except Exception:
                        pass

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        hub.players.pop(pid, None)
        await _broadcast({"type": "leave", "id": pid})
