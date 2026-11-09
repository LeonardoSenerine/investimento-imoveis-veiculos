"""
Prepara as fotos de fundo (imóvel / veículo) enviadas pelo cliente.

As originais vêm com 736 px de largura (tamanho do Pinterest), pequenas para
cobrir uma tela de desktop. Fluxo:

  1. ampliar 4x com IA (Real-ESRGAN, modelo realesrgan-x4plus), fora deste script:
       realesrgan-ncnn-vulkan.exe -i original.jpg -o <prefixo>.png -n realesrgan-x4plus -t 64
     (https://github.com/xinntao/Real-ESRGAN/releases, versão ncnn-vulkan para Windows)
  2. este script reduz para as larguras do srcset e exporta WebP.

Uso:  python scripts/scenes.py <pasta-com-os-png-ampliados>
Saída: public/assets/scenes/<nome>-<largura>.webp
"""
import sys
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

# nome de saída -> arquivo ampliado (prefixo do upload original)
SOURCES = {
    'casa-piscina': 'e38d2014',
    'casa-noturna': '47ff9e91',
    'casa-garagem': 'e6153bc2',
    'casa-sedan': '7d51934b',
    'moto-showroom': 'c22f6fc7',
    'moto-noite': '09e9e611',
    'moto-urbana': 'e674c14a',
    'moto-por-do-sol': '80efa825',
    'carro-branco-serra': 'a8817059',
    'carro-vermelho-noite': '9d61856e',
    'carro-vermelho-rio': 'cf34ba1a',
    'carro-preto-cidade': '6bb8c02f',
}

# Celular (até 3x), notebook e desktop grande. Precisa bater com src/config/images.ts.
WIDTHS = (828, 1440, 2160)

OUT = Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'scenes'


def main(src_dir: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob('*.webp'):
        old.unlink()
    src = Path(src_dir)
    for name, prefix in SOURCES.items():
        big = Image.open(src / f'{prefix}.png').convert('RGB')
        for w in WIDTHS:
            h = round(big.height * w / big.width)
            out = big.resize((w, h), Image.Resampling.LANCZOS)
            # reduzir suaviza: devolve um pouco de nitidez e contraste
            out = out.filter(ImageFilter.UnsharpMask(radius=0.8, percent=35, threshold=2))
            out = ImageEnhance.Contrast(out).enhance(1.03)
            path = OUT / f'{name}-{w}.webp'
            out.save(path, 'WEBP', quality=80, method=6)
            print(f'{path.name}: {w}x{h}, {path.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main(sys.argv[1])
