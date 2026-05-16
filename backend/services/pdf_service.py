import asyncio
import logging

logger = logging.getLogger(__name__)


async def extract_pdf(pdf_path: str) -> tuple[str, str]:
    """Extract text from PDF. Returns (extracted_text, original_title)."""
    text, title = await asyncio.to_thread(_extract_sync, pdf_path)
    return text, title


def _extract_sync(pdf_path: str) -> tuple[str, str]:
    title = ""

    try:
        import pymupdf4llm
        import pymupdf

        doc = pymupdf.open(pdf_path)
        title = doc.metadata.get("title", "") or ""
        if not title and doc.page_count > 0:
            first_page = doc[0].get_text("text")
            lines = [l.strip() for l in first_page.split("\n") if l.strip()]
            title = lines[0] if lines else "Untitled"
        doc.close()

        md_text = pymupdf4llm.to_markdown(pdf_path)

        if len(md_text.strip()) > 500:
            table_text = _extract_tables(pdf_path)
            if table_text:
                md_text += "\n\n## Extracted Tables\n\n" + table_text
            return md_text, title

    except Exception as e:
        logger.warning(f"PyMuPDF4LLM extraction failed, falling back to pdfplumber: {e}")

    return _extract_with_pdfplumber(pdf_path, title)


def _extract_tables(pdf_path: str) -> str:
    try:
        import pdfplumber

        tables_md = []
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                for table in page.extract_tables():
                    if not table:
                        continue
                    header = table[0]
                    rows = table[1:]
                    md = f"**Table (Page {i + 1})**\n\n"
                    md += "| " + " | ".join(str(c or "") for c in header) + " |\n"
                    md += "| " + " | ".join("---" for _ in header) + " |\n"
                    for row in rows:
                        md += "| " + " | ".join(str(c or "") for c in row) + " |\n"
                    tables_md.append(md)
        return "\n\n".join(tables_md)
    except Exception as e:
        logger.warning(f"Table extraction failed: {e}")
        return ""


def _extract_with_pdfplumber(pdf_path: str, title: str) -> tuple[str, str]:
    import pdfplumber

    texts = []
    with pdfplumber.open(pdf_path) as pdf:
        if not title and pdf.pages:
            first_text = pdf.pages[0].extract_text() or ""
            lines = [l.strip() for l in first_text.split("\n") if l.strip()]
            title = lines[0] if lines else "Untitled"
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                texts.append(page_text)
    return "\n\n".join(texts), title
