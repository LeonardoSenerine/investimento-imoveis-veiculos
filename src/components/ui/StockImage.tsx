import type { ImgHTMLAttributes } from 'react';
import { imageSrcSet, imageUrl, type StockImage as Img } from '../../config/images';

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'alt'> {
  image: Img;
  widths?: number[];
  /** Tamanho renderizado (atributo `sizes`). */
  sizes: string;
  priority?: boolean;
  quality?: number;
}

export function StockImage({
  image,
  widths = [480, 768, 1080, 1440, 1920, 2560],
  sizes,
  priority = false,
  quality = 80,
  style,
  ...props
}: Props) {
  return (
    <img
      // IMPORTANTE: `loading` e `decoding` precisam vir ANTES de `src`/`srcSet`.
      // O React aplica os atributos na ordem escrita; se o `src` chegar
      // primeiro, o navegador inicia o download antes de saber que é lazy.
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      // atributo em minúsculas para compatibilidade com React 18
      {...({ fetchpriority: priority ? 'high' : 'low' } as Record<string, string>)}
      sizes={sizes}
      srcSet={imageSrcSet(image, widths, quality)}
      src={imageUrl(image, widths[Math.min(1, widths.length - 1)], quality)}
      alt={image.alt}
      style={{ objectPosition: image.focus, ...style }}
      {...props}
    />
  );
}
