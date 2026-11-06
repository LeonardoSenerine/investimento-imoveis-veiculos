"""Gera public/assets/og/chave-og-v1.jpg (1200x630), a capa usada nos links compartilhados.

O desenho fica em scripts/og/capa.html e é renderizado pelo Chrome (ou Edge) em
modo headless, para sair com a mesma tipografia do site (Archivo, Google Fonts).

Uso: python scripts/og-image.py   (precisa do Pillow e de internet para fontes e foto)
Ao mudar a capa, suba a versão no nome do arquivo (v2, v3...) e no index.html,
porque WhatsApp e Facebook guardam a imagem antiga em cache.
"""
import subprocess
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "scripts" / "og" / "capa.html"
OUT = ROOT / "public" / "assets" / "og" / "chave-og-v1.jpg"
W, H = 1200, 630

# Chrome primeiro: o Edge headless nem sempre grava o screenshot no Windows.
BROWSERS = [
    Path("C:/Program Files/Google/Chrome/Application/chrome.exe"),
    Path("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"),
    Path("C:/Program Files/Microsoft/Edge/Application/msedge.exe"),
]
browser = next((b for b in BROWSERS if b.exists()), None)
if browser is None:
    raise SystemExit("Edge ou Chrome não encontrado.")

with tempfile.TemporaryDirectory() as tmp:
    png = Path(tmp) / "capa.png"
    subprocess.run(
        [
            str(browser),
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--force-device-scale-factor=1",
            f"--window-size={W},{H}",
            "--virtual-time-budget=8000",  # tempo para fontes e foto carregarem
            f"--user-data-dir={tmp}",
            f"--screenshot={png}",
            TEMPLATE.as_uri(),
        ],
        check=True,
        capture_output=True,
        timeout=90,
    )
    if not png.exists():
        raise SystemExit(f"O navegador não gerou a imagem ({browser.name}).")
    img = Image.open(png).convert("RGB")
    if img.size != (W, H):
        img = img.crop((0, 0, W, H))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "JPEG", quality=88, optimize=True, progressive=True)

print(f"ok: {OUT} ({OUT.stat().st_size // 1024} KB)")
