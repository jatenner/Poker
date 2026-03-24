/**
 * Caricature body SVG renderer.
 * Generates funny cartoon body proportions from AvatarData parameters.
 * All body values are on a 1-10 scale.
 */

import type { AvatarData } from "@poker/shared";

export interface BodyProportions {
  viewBoxWidth: number;
  viewBoxHeight: number;
  headCx: number;
  headCy: number;
  headRadius: number;
  neckTop: number;
  neckBottom: number;
  neckWidth: number;
  shoulderWidth: number;
  shoulderY: number;
  torsoWidth: number;
  torsoHeight: number;
  bellyBulge: number;
  armWidth: number;
  bodyBottom: number;
}

export function getBodyProportions(data: AvatarData): BodyProportions {
  const h = data.height;
  const w = data.weight;
  const nl = data.neckLength;
  const hs = data.headSize;

  // Head size: range 30-65 (dramatically bigger for bobblehead effect)
  const headRadius = 30 + (hs - 1) * 3.9;

  // Neck: very visible range 5-60
  const neckLen = 5 + (nl - 1) * 6.1;
  const neckWidth = Math.max(8, 14 + (w - 1) * 2 - (nl - 1) * 0.8);

  // Body: shoulders 50-130, torso 40-140
  const shoulderWidth = 50 + (w - 1) * 8.9;
  const torsoHeight = 40 + (h - 1) * 11.1;
  const torsoWidth = shoulderWidth * 0.9;
  const bellyBulge = Math.max(0, (w - 4) * 5);
  const armWidth = 8 + (w - 1) * 2;

  // Center everything at cx=100
  const headCx = 100;
  const headCy = headRadius + 4;
  const neckTop = headCy + headRadius - 6;
  const neckBottom = neckTop + neckLen;
  const shoulderY = neckBottom;
  const bodyBottom = shoulderY + torsoHeight;

  // Tight viewbox: figure out max width needed
  const maxHalfWidth = Math.max(
    headRadius + 2,
    shoulderWidth / 2 + armWidth + 18,
    torsoWidth / 2 + bellyBulge + 5,
  );
  const viewBoxWidth = Math.ceil(maxHalfWidth * 2) + 10;
  const viewBoxHeight = Math.ceil(bodyBottom + 8);

  return {
    viewBoxWidth,
    viewBoxHeight,
    headCx,
    headCy,
    headRadius,
    neckTop,
    neckBottom,
    neckWidth,
    shoulderWidth,
    shoulderY,
    torsoWidth,
    torsoHeight,
    bellyBulge,
    armWidth,
    bodyBottom,
  };
}

export function generateNeckPath(p: BodyProportions): string {
  const hw = p.neckWidth / 2;
  // Slightly tapered neck — wider at shoulders
  const topW = hw * 0.85;
  return `M ${p.headCx - topW} ${p.neckTop}
          C ${p.headCx - topW} ${p.neckTop + p.neckWidth * 0.3}, ${p.headCx - hw} ${p.neckBottom - 2}, ${p.headCx - hw} ${p.neckBottom}
          L ${p.headCx + hw} ${p.neckBottom}
          C ${p.headCx + hw} ${p.neckBottom - 2}, ${p.headCx + topW} ${p.neckTop + p.neckWidth * 0.3}, ${p.headCx + topW} ${p.neckTop}
          Z`;
}

export function generateTorsoPath(p: BodyProportions): string {
  const cx = p.headCx;
  const sw = p.shoulderWidth / 2;
  const tw = p.torsoWidth / 2;
  const bb = p.bellyBulge;
  const sy = p.shoulderY;
  const by = p.bodyBottom;
  const midY = sy + p.torsoHeight * 0.45;

  // Rounded cartoon body with shoulder curve and belly
  return `M ${cx} ${sy}
          C ${cx - sw * 0.3} ${sy}, ${cx - sw} ${sy + 3}, ${cx - sw} ${sy + 12}
          C ${cx - sw} ${sy + 20}, ${cx - tw - bb} ${midY - 8}, ${cx - tw - bb} ${midY}
          C ${cx - tw - bb} ${midY + 12}, ${cx - tw * 0.65} ${by - 3}, ${cx - tw * 0.55} ${by}
          L ${cx + tw * 0.55} ${by}
          C ${cx + tw * 0.65} ${by - 3}, ${cx + tw + bb} ${midY + 12}, ${cx + tw + bb} ${midY}
          C ${cx + tw + bb} ${midY - 8}, ${cx + sw} ${sy + 20}, ${cx + sw} ${sy + 12}
          C ${cx + sw} ${sy + 3}, ${cx + sw * 0.3} ${sy}, ${cx} ${sy}
          Z`;
}

export function generateArmPaths(p: BodyProportions): { left: string; right: string } {
  const cx = p.headCx;
  const sw = p.shoulderWidth / 2;
  const aw = p.armWidth;
  const sy = p.shoulderY;
  const armLen = p.torsoHeight * 0.65;

  // Arms hang slightly out and curve down
  const left = `M ${cx - sw + 2} ${sy + 10}
                C ${cx - sw - 6} ${sy + armLen * 0.25}, ${cx - sw - 14} ${sy + armLen * 0.55}, ${cx - sw - 10} ${sy + armLen}
                Q ${cx - sw - 10 + aw / 2} ${sy + armLen + 4}, ${cx - sw - 10 + aw} ${sy + armLen}
                C ${cx - sw - 14 + aw} ${sy + armLen * 0.55}, ${cx - sw + aw - 2} ${sy + armLen * 0.25}, ${cx - sw + aw + 2} ${sy + 10}
                Z`;

  const right = `M ${cx + sw - 2} ${sy + 10}
                 C ${cx + sw + 6} ${sy + armLen * 0.25}, ${cx + sw + 14} ${sy + armLen * 0.55}, ${cx + sw + 10} ${sy + armLen}
                 Q ${cx + sw + 10 - aw / 2} ${sy + armLen + 4}, ${cx + sw + 10 - aw} ${sy + armLen}
                 C ${cx + sw + 14 - aw} ${sy + armLen * 0.55}, ${cx + sw - aw + 2} ${sy + armLen * 0.25}, ${cx + sw - aw - 2} ${sy + 10}
                 Z`;

  return { left, right };
}

/** Generate simple hand circles at the end of each arm */
export function generateHands(p: BodyProportions): { leftX: number; leftY: number; rightX: number; rightY: number; radius: number } {
  const cx = p.headCx;
  const sw = p.shoulderWidth / 2;
  const aw = p.armWidth;
  const sy = p.shoulderY;
  const armLen = p.torsoHeight * 0.65;

  return {
    leftX: cx - sw - 10 + aw / 2,
    leftY: sy + armLen + 2,
    rightX: cx + sw + 10 - aw / 2,
    rightY: sy + armLen + 2,
    radius: aw * 0.55,
  };
}
