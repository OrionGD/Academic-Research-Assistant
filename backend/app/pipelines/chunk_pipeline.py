from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List

class ChunkPipeline:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            is_separator_regex=False,
        )

    def split_text(self, text: str) -> List[str]:
        return self.splitter.split_text(text)
