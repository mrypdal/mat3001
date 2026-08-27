import fitz
import os

pdf_path = "Calculus_of_variations.pdf"
out_path = os.path.join("src", "data", "pdf_knowledge.txt")

if not os.path.exists(pdf_path):
    print("PDF not found!")
    exit(1)

text = ""
with fitz.open(pdf_path) as doc:
    for page in doc:
        text += page.get_text() + "\n\n"

with open(out_path, "w", encoding="utf-8") as f:
    f.write(text)

print(f"Extracted {len(doc)} pages of text to {out_path}")
