"""
Knowledge-base loader and retriever.

Reads `bedrock_knowledge_base.pdf` (or `.md` for the sample), splits on section
headers, and supports retrieval via TF-IDF similarity over the section bodies.

Why TF-IDF and not embeddings: the KB is small (~7 sections), retrieval is
deterministic, no API calls, and the sections themselves are the right unit
of grounding — the agent grounds on a section, not a 200-token chunk.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SAMPLE_DIR = DATA_DIR / "sample"


@dataclass
class KnowledgeSection:
    title: str
    body: str


def _resolve_kb() -> Path:
    for name in ("bedrock_knowledge_base.pdf", "bedrock_knowledge_base.md"):
        for parent in (DATA_DIR, SAMPLE_DIR):
            path = parent / name
            if path.exists():
                return path
    raise FileNotFoundError("No knowledge base file found in data/ or data/sample/.")


def _read_pdf(path: Path) -> str:
    from pypdf import PdfReader
    reader = PdfReader(str(path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _read_md(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _split_sections(text: str) -> list[KnowledgeSection]:
    """Split on lines that look like section headers (markdown ## only).

    A previous version also accepted ``\\d+\\.\\s+`` as a header marker, but
    that misclassifies ordinary numbered list items inside a section as new
    sections. Section headers in this KB are always ``## Title`` — keep the
    parser strict.
    """
    pattern = re.compile(r"^##\s+(.+)$", re.MULTILINE)
    matches = list(pattern.finditer(text))
    if not matches:
        return [KnowledgeSection(title="Knowledge Base", body=text.strip())]
    sections: list[KnowledgeSection] = []
    for i, m in enumerate(matches):
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        sections.append(KnowledgeSection(title=m.group(1).strip(), body=text[start:end].strip()))
    return sections


class KnowledgeBase:
    def __init__(self, sections: list[KnowledgeSection]):
        self.sections = sections
        bodies = [s.body for s in sections]
        self._vectorizer = TfidfVectorizer(stop_words="english", max_df=0.9)
        self._matrix = self._vectorizer.fit_transform(bodies)

    @classmethod
    def load(cls) -> "KnowledgeBase":
        path = _resolve_kb()
        text = _read_pdf(path) if path.suffix.lower() == ".pdf" else _read_md(path)
        return cls(_split_sections(text))

    def retrieve(self, query: str, k: int = 3) -> list[KnowledgeSection]:
        q = self._vectorizer.transform([query])
        scores = cosine_similarity(q, self._matrix).flatten()
        top = scores.argsort()[-k:][::-1]
        return [self.sections[i] for i in top if scores[i] > 0]
