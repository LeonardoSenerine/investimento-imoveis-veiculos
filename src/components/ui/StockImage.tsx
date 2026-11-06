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
      src={imageUrl(image, widths[Math.min(1, widths.length - 1)], quality)}
      srcSet={imageSrcSet(image, widths, quality)}
      sizes={sizes}
      alt={image.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      // atributo em minúsculas para compatibilidade com React 18
      {...({ fetchpriority: priority ? 'high' : 'auto' } as Record<string, string>)}
      style={{ objectPosition: image.focus, ...style }}
      {...props}
    />
  );
}
