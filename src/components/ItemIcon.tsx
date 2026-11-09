/**
 * Hollowfall - ItemIcon Component
 * Рендерит настоящий pixel-art спрайт предмета из кэша текстур.
 * УБИРАЕТ буквы в квадратах навсегда, обеспечивая аутентичный стиль Terraria!
 */

import React from 'react';
import { getItemIconDataUrl } from '../game/textures.ts';

interface ItemIconProps {
  itemId: string;
  size?: number; // size in px, defaults to 28
  className?: string;
  alt?: string;
}

export const ItemIcon: React.FC<ItemIconProps> = ({
  itemId,
  size = 28,
  className = '',
  alt = '',
}) => {
  const iconSrc = getItemIconDataUrl(itemId);

  return (
    <img
      src={iconSrc}
      alt={alt || itemId}
      width={size}
      height={size}
      draggable={false}
      className={`select-none pointer-events-none ${className}`}
      style={{
        imageRendering: 'pixelated',
        width: `${size}px`,
        height: `${size}px`,
        maxWidth: `${size}px`,
        maxHeight: `${size}px`,
        objectFit: 'contain',
      }}
    />
  );
};
