import sys
import os
from io import BytesIO

# Add pipelines to path
sys.path.append(os.path.join(os.getcwd(), "pipelines"))
sys.path.append(os.getcwd())

from pipelines.process import extract_text_from_pdf, clean_text
import pypdf

def test_extraction_logic():
    print("--- Testing Adaptive Extraction Logic ---")
    
    # 1. Test with a real PDF if available
    real_pdf = r"E:\PROJECTS\ARAS\backend\local_storage\documents\69b81823030353158caabf15\a6e56c6c-cde4-4ba8-92f5-79f66ce71b9b-s1.pdf"
    if os.path.exists(real_pdf):
        with open(real_pdf, "rb") as f:
            content = f.read()
        text, pages = extract_text_from_pdf(content)
        print(f"Real PDF: {pages} pages, {len(text)} chars. Avg: {len(text)/pages:.1f} chars/page")
        if pages > 0 and len(text) > 50:
            print("PASS: Real PDF extracted successfully.")
        else:
            print("FAIL: Real PDF extraction failed or too low density.")
    
    # 2. Test classification logic (Simulated)
    print("\n--- Testing Classification Logic (Simulated) ---")
    
    def simulate_pipeline(pages, total_chars):
        print(f"Testing: {pages} pages, {total_chars} chars")
        try:
            if pages == 0:
                 print("RESULT: REJECTED (No pages)")
                 return
            
            if total_chars == 0:
                print("RESULT: REJECTED (Scanned PDF - 0 chars)")
                return
            
            classification = "healthy"
            if pages >= 2:
                ratio = total_chars / pages
                if ratio < 10:
                    classification = "suspicious"
            
            print(f"RESULT: COMPLETED (Classification: {classification})")
        except Exception as e:
            print(f"RESULT: REJECTED ({e})")

    simulate_pipeline(0, 0)
    simulate_pipeline(5, 0)      # Strict rejection expected
    simulate_pipeline(10, 50)    # 5 chars/page -> should be SUSPICIOUS
    simulate_pipeline(1, 2)      # 1 page, 2 chars -> should be HEALTHY (not enough pages for ratio check)
    simulate_pipeline(5, 5000)   # healthy

if __name__ == "__main__":
    test_extraction_logic()
