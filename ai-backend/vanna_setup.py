import os
from dotenv import load_dotenv
from vanna.ollama import Ollama
from vanna.chromadb import ChromaDB_VectorStore

load_dotenv()

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_db")
DB_PATH = os.getenv("DB_PATH", "./db/insidebi.db")


class MyVanna(ChromaDB_VectorStore, Ollama):
    def __init__(self):
        ChromaDB_VectorStore.__init__(self, config={"path": CHROMA_PATH})
        Ollama.__init__(self, config={"model": OLLAMA_MODEL})


vn = MyVanna()
vn.connect_to_sqlite(DB_PATH)
