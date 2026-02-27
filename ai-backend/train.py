"""
train.py – Vanna 학습 스크립트 (1회 실행)
실행: python train.py
"""
import json
import os
from vanna_setup import vn

TRAINING_DIR = os.path.join(os.path.dirname(__file__), "training")


def train_ddl():
    ddl_path = os.path.join(TRAINING_DIR, "ddl.sql")
    with open(ddl_path, encoding="utf-8") as f:
        ddl = f.read()

    # 각 CREATE TABLE 블록을 개별 학습
    blocks = [b.strip() for b in ddl.split(";") if "CREATE TABLE" in b]
    for block in blocks:
        try:
            vn.train(ddl=block + ";")
            table = block.split("TABLE IF NOT EXISTS")[-1].split("(")[0].strip()
            print(f"  [DDL] {table} 학습 완료")
        except Exception as e:
            print(f"  [DDL] 오류: {e}")


def train_documentation():
    doc_path = os.path.join(TRAINING_DIR, "documentation.md")
    with open(doc_path, encoding="utf-8") as f:
        doc = f.read()
    vn.train(documentation=doc)
    print("  [DOC] 비즈니스 문서 학습 완료")


def train_golden_sql():
    json_path = os.path.join(TRAINING_DIR, "golden_sql.json")
    with open(json_path, encoding="utf-8") as f:
        pairs = json.load(f)
    for pair in pairs:
        try:
            vn.train(question=pair["question"], sql=pair["sql"])
            print(f"  [SQL] 학습: {pair['question'][:40]}")
        except Exception as e:
            print(f"  [SQL] 오류 ({pair['question'][:30]}): {e}")


if __name__ == "__main__":
    print("=== Vanna 학습 시작 ===\n")
    print("[1/3] DDL 학습...")
    train_ddl()
    print("\n[2/3] 비즈니스 문서 학습...")
    train_documentation()
    print("\n[3/3] Golden SQL 학습...")
    train_golden_sql()
    print("\n=== 학습 완료 ===")
