export interface Point {
  x: number;
  y: number;
}

export function getServerPositions(count: number, width: number, height: number): Point[] {
  const safeCount = Math.max(1, count);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.32;

  return Array.from({ length: safeCount }, (_, index) => {
    const angle = -Math.PI / 2 + (index * (Math.PI * 2)) / safeCount;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });
}

