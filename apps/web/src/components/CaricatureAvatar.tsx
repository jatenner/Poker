"use client";

import { useId } from "react";
import type { AvatarData } from "@poker/shared";
import {
  getBodyProportions,
  generateNeckPath,
  generateTorsoPath,
  generateArmPaths,
  generateHands,
} from "@/lib/caricatureRenderer";
import { buildAvatarUrl, type AvatarConfig } from "@/lib/avatarConfig";

interface CaricatureAvatarProps {
  data: AvatarData;
  mode?: "seat" | "full" | "mini";
  className?: string;
}

function avatarDataToFaceUrl(data: AvatarData): string {
  const faceConfig: AvatarConfig = {
    top: data.faceConfig.top ?? "",
    accessories: data.faceConfig.accessories ?? "",
    clothing: data.faceConfig.clothing ?? "blazerAndShirt",
    clothingGraphic: data.faceConfig.clothingGraphic ?? "",
    eyebrows: data.faceConfig.eyebrows ?? "",
    eyes: data.faceConfig.eyes ?? "",
    facialHair: data.faceConfig.facialHair ?? "",
    mouth: data.faceConfig.mouth ?? "",
    skinColor: data.skinColor,
    hairColor: data.faceConfig.hairColor ?? "",
    clothesColor: data.faceConfig.clothesColor ?? "",
    facialHairColor: data.faceConfig.facialHairColor ?? "",
    backgroundColor: "transparent",
    height: String(data.height),
    weight: String(data.weight),
    neckLength: String(data.neckLength),
    headSize: String(data.headSize),
    bodyColor: data.bodyColor,
  };
  return buildAvatarUrl(faceConfig);
}

export default function CaricatureAvatar({
  data,
  mode = "full",
  className = "",
}: CaricatureAvatarProps) {
  const uid = useId().replace(/:/g, "");
  const p = getBodyProportions(data);
  const neckPath = generateNeckPath(p);
  const torsoPath = generateTorsoPath(p);
  const arms = generateArmPaths(p);
  const hands = generateHands(p);
  const faceUrl = avatarDataToFaceUrl(data);

  const skinHex = `#${data.skinColor}`;
  const bodyHex = `#${data.bodyColor}`;

  // DiceBear avataaars: the face is in the top ~62% of the SVG.
  // We need to clip out the built-in shoulders/clothing so only the head shows.
  // We render the DiceBear image larger and offset upward, then clip to a circle.
  const headClipId = `head-clip-${uid}`;
  const seatClipId = `seat-clip-${uid}`;

  // The DiceBear image is rendered at 2x head size to get good resolution,
  // positioned so the face portion aligns with our head circle.
  // The clip circle crops out the built-in body.
  const imgSize = p.headRadius * 2.8; // oversized to get just the face portion
  const imgX = p.headCx - imgSize / 2;
  const imgY = p.headCy - imgSize * 0.38; // shift up so face (not shoulders) is centered

  const headElements = (
    <>
      <defs>
        <clipPath id={headClipId}>
          <circle cx={p.headCx} cy={p.headCy} r={p.headRadius * 1.05} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${headClipId})`}>
        <image
          href={faceUrl}
          x={imgX}
          y={imgY}
          width={imgSize}
          height={imgSize}
        />
      </g>
    </>
  );

  if (mode === "seat") {
    const cropRadius = p.headRadius * 1.6;
    const cropCy = p.headCy + p.headRadius * 0.15;
    return (
      <svg
        viewBox={`${p.headCx - cropRadius} ${cropCy - cropRadius} ${cropRadius * 2} ${cropRadius * 2}`}
        width="100%"
        height="100%"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id={seatClipId}>
            <circle cx={p.headCx} cy={cropCy} r={cropRadius} />
          </clipPath>
          <clipPath id={headClipId}>
            <circle cx={p.headCx} cy={p.headCy} r={p.headRadius * 1.05} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${seatClipId})`}>
          <path d={neckPath} fill={skinHex} />
          <path d={torsoPath} fill={bodyHex} />
          <path d={torsoPath} fill="white" opacity={0.08} />
          <path d={arms.left} fill={bodyHex} opacity={0.75} />
          <path d={arms.right} fill={bodyHex} opacity={0.75} />
          <g clipPath={`url(#${headClipId})`}>
            <image href={faceUrl} x={imgX} y={imgY} width={imgSize} height={imgSize} />
          </g>
        </g>
      </svg>
    );
  }

  if (mode === "mini") {
    const cropRadius = p.headRadius * 1.3;
    return (
      <svg
        viewBox={`${p.headCx - cropRadius} ${p.headCy - cropRadius} ${cropRadius * 2} ${cropRadius * 2}`}
        width="100%"
        height="100%"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id={headClipId}>
            <circle cx={p.headCx} cy={p.headCy} r={p.headRadius * 1.05} />
          </clipPath>
        </defs>
        <path d={neckPath} fill={skinHex} />
        <path d={torsoPath} fill={bodyHex} />
        <g clipPath={`url(#${headClipId})`}>
          <image href={faceUrl} x={imgX} y={imgY} width={imgSize} height={imgSize} />
        </g>
      </svg>
    );
  }

  // Full body mode
  const halfVB = p.viewBoxWidth / 2;
  const vbX = p.headCx - halfVB;

  return (
    <svg
      viewBox={`${vbX} 0 ${p.viewBoxWidth} ${p.viewBoxHeight}`}
      width="100%"
      height="100%"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={headClipId}>
          <circle cx={p.headCx} cy={p.headCy} r={p.headRadius * 1.05} />
        </clipPath>
      </defs>

      {/* Arms behind body */}
      <path d={arms.left} fill={bodyHex} opacity={0.75} />
      <path d={arms.right} fill={bodyHex} opacity={0.75} />
      {/* Hands */}
      <circle cx={hands.leftX} cy={hands.leftY} r={hands.radius} fill={skinHex} />
      <circle cx={hands.rightX} cy={hands.rightY} r={hands.radius} fill={skinHex} />

      {/* Neck */}
      <path d={neckPath} fill={skinHex} />

      {/* Torso */}
      <path d={torsoPath} fill={bodyHex} />
      <path d={torsoPath} fill="white" opacity={0.07} />

      {/* Head — clipped to circle so DiceBear's built-in body is hidden */}
      <g clipPath={`url(#${headClipId})`}>
        <image
          href={faceUrl}
          x={imgX}
          y={imgY}
          width={imgSize}
          height={imgSize}
        />
      </g>
    </svg>
  );
}
