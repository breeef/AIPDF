import uuid
from datetime import datetime, timezone

from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Paper(Base):
    __tablename__ = "papers"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    original_title: Mapped[str] = mapped_column(default="")
    short_title: Mapped[str | None] = mapped_column(default=None)
    pdf_path: Mapped[str] = mapped_column(default="")
    extracted_text: Mapped[str | None] = mapped_column(Text, default=None)
    status: Mapped[str] = mapped_column(default="uploading")
    error_message: Mapped[str | None] = mapped_column(default=None)
    created_at: Mapped[datetime] = mapped_column(default=_now)
    updated_at: Mapped[datetime] = mapped_column(default=_now, onupdate=_now)


class Graph(Base):
    __tablename__ = "graphs"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    paper_id: Mapped[str] = mapped_column(ForeignKey("papers.id"))
    nodes: Mapped[str] = mapped_column(Text, default="[]")
    edges: Mapped[str] = mapped_column(Text, default="[]")
    version: Mapped[int] = mapped_column(default=1)
    created_at: Mapped[datetime] = mapped_column(default=_now)
    updated_at: Mapped[datetime] = mapped_column(default=_now, onupdate=_now)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    paper_id: Mapped[str] = mapped_column(ForeignKey("papers.id"))
    role: Mapped[str] = mapped_column(default="user")
    content: Mapped[str] = mapped_column(Text, default="")
    graph_snapshot: Mapped[str | None] = mapped_column(Text, default=None)
    created_at: Mapped[datetime] = mapped_column(default=_now)
