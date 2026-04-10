// ── Tonal palettes per party ──────────────────────────────
// Light mode: airy, desaturated, party-tinted
// Dark mode:  deep atmospheric sky
//
// Keys:
//   bgTop    — sky/top gradient colour (light: soft tint, dark: deep shade)
//   bgMid    — mid gradient
//   bgBot    — bottom gradient
//   sil      — silhouette colour (darker party shade)
//   hero     — hero number colour (deepest tonal shade)
//   pr       — primary/accent
//   c0       — card background (light: 40% white, dark: 7% white)
//   c1       — card background secondary
//   sf       — surface (sheet/screen bg)
//   th       — text high
//   tm       — text medium
//   tl       — text low
//   orb1/2   — atmospheric orb colours

export const LIGHT = {
  reform: {
    bgTop:'#e8f8fc', bgMid:'#cdf0f7', bgBot:'#a8e4f0',
    sil:'#0a8fa8', silOp:0.10,
    hero:'#041C24', pr:'#12B7D4',
    c0:'rgba(255,255,255,0.82)', c1:'rgba(255,255,255,0.35)',
    sf:'#f0fafd', th:'#041C24', tm:'#1A6880', tl:'#0c3a50',
    cardBorder:'rgba(0,0,0,0.09)',
    cardTint:'rgba(18,183,212,0.05)',
    orb1:'#12B7D422', orb2:'#a8e4f015',
    bg1:'#0d4a5c', bg2:'#1a8fa8', bg3:'#a8e4f0',
  },
  labour: {
    bgTop:'#fdf0f2', bgMid:'#fad5db', bgBot:'#f5a0aa',
    sil:'#9a0c22', silOp:0.10,
    hero:'#28000A', pr:'#C8102E',
    c0:'rgba(255,255,255,0.82)', c1:'rgba(255,255,255,0.35)',
    sf:'#fef5f6', th:'#28000A', tm:'#7A1020', tl:'#6e0e1c',
    cardBorder:'rgba(0,0,0,0.09)',
    cardTint:'rgba(200,16,46,0.05)',
    orb1:'#C8102E22', orb2:'#f5a0aa15',
    bg1:'#5c0010', bg2:'#a81424', bg3:'#f5a0aa',
  },
  con: {
    bgTop:'#eef3ff', bgMid:'#d0e4ff', bgBot:'#a0c8f5',
    sil:'#0055a0', silOp:0.10,
    hero:'#001230', pr:'#0087DC',
    c0:'rgba(255,255,255,0.82)', c1:'rgba(255,255,255,0.35)',
    sf:'#f2f6ff', th:'#001230', tm:'#1A3E80', tl:'#0c2858',
    cardBorder:'rgba(0,0,0,0.09)',
    cardTint:'rgba(0,135,220,0.05)',
    orb1:'#0087DC22', orb2:'#a0c8f515',
    bg1:'#001a5c', bg2:'#0055a8', bg3:'#a0c8f5',
  },
  green: {
    bgTop:'#ecfbf3', bgMid:'#c4f0d8', bgBot:'#90e0b8',
    sil:'#017838', silOp:0.10,
    hero:'#002814', pr:'#02A95B',
    c0:'rgba(255,255,255,0.82)', c1:'rgba(255,255,255,0.35)',
    sf:'#f0fdf5', th:'#002814', tm:'#1A6838', tl:'#0a3c22',
    cardBorder:'rgba(0,0,0,0.09)',
    cardTint:'rgba(2,169,91,0.05)',
    orb1:'#02A95B22', orb2:'#90e0b815',
    bg1:'#003a18', bg2:'#02803a', bg3:'#90e0b8',
  },
  ld: {
    bgTop:'#fff8e8', bgMid:'#fce8c0', bgBot:'#f5cc80',
    sil:'#c87800', silOp:0.10,
    hero:'#281200', pr:'#FAA61A',
    c0:'rgba(255,255,255,0.82)', c1:'rgba(255,255,255,0.35)',
    sf:'#fffbf0', th:'#281200', tm:'#784800', tl:'#4a3000',
    cardBorder:'rgba(0,0,0,0.09)',
    cardTint:'rgba(250,166,26,0.05)',
    orb1:'#FAA61A22', orb2:'#f5cc8015',
    bg1:'#5c2800', bg2:'#b87000', bg3:'#f5cc80',
  },
  rb: {
    bgTop:'#f0eeff', bgMid:'#d8ccff', bgBot:'#b8a0f0',
    sil:'#5c20c0', silOp:0.10,
    hero:'#180038', pr:'#7C3AED',
    c0:'rgba(255,255,255,0.82)', c1:'rgba(255,255,255,0.35)',
    sf:'#f5f0ff', th:'#180038', tm:'#4A1888', tl:'#5028A0',
    cardBorder:'rgba(0,0,0,0.09)',
    cardTint:'rgba(124,58,237,0.05)',
    orb1:'#7C3AED22', orb2:'#b8a0f015',
    bg1:'#2a0060', bg2:'#5c20c0', bg3:'#c0a0f0',
  },
  base: {
    bgTop:'#eff6fa', bgMid:'#dce8f5', bgBot:'#90c0e0',
    sil:'#0055a0', silOp:0.10,
    hero:'#001229', pr:'#0061A4',
    c0:'rgba(255,255,255,0.82)', c1:'rgba(255,255,255,0.35)',
    sf:'#f2f8fc', th:'#001229', tm:'#1A4060', tl:'#0c3648',
    cardBorder:'rgba(0,0,0,0.09)',
    cardTint:'rgba(0,97,164,0.05)',
    orb1:'#0061A422', orb2:'#90c0e015',
    bg1:'#001a3c', bg2:'#0055a0', bg3:'#90c0e0',
  },
}

export const DARK = {
  reform: {
    bgTop:'#0a9ab8', bgMid:'#0d7a94', bgBot:'#020c12',
    sil:'#ffffff', silOp:0.13,
    hero:'#ffffff', pr:'#12B7D4',
    c0:'rgba(18,28,38,0.80)', c1:'rgba(255,255,255,0.35)',
    sf:'#041e2a', th:'#ffffff', tm:'rgba(255,255,255,0.85)', tl:'rgba(255,255,255,0.60)',
    cardBorder:'rgba(0,0,0,0.09)',
    cardTint:'rgba(18,183,212,0.08)',
    orb1:'#12B7D455', orb2:'#0a9ab830',
    bg1:'#0d4a5c', bg2:'#1a8fa8', bg3:'#a8e4f0',
  },
  labour: {
    bgTop:'#b01028', bgMid:'#8a0c1e', bgBot:'#200008',
    sil:'#ffffff', silOp:0.13,
    hero:'#ffffff', pr:'#E4003B',
    c0:'rgba(18,28,38,0.80)', c1:'rgba(255,255,255,0.35)',
    sf:'#200008', th:'#ffffff', tm:'rgba(255,255,255,0.85)', tl:'rgba(255,255,255,0.60)',
    cardBorder:'rgba(0,0,0,0.09)',
    cardTint:'rgba(228,0,59,0.08)',
    orb1:'#E4003B38', orb2:'#b0102830',
    bg1:'#5c0010', bg2:'#a81424', bg3:'#f5a0aa',
  },
  con: {
    bgTop:'#0060b8', bgMid:'#004a94', bgBot:'#001428',
    sil:'#ffffff', silOp:0.13,
    hero:'#ffffff', pr:'#0087DC',
    c0:'rgba(18,28,38,0.80)', c1:'rgba(255,255,255,0.35)',
    sf:'#001428', th:'#ffffff', tm:'rgba(255,255,255,0.85)', tl:'rgba(255,255,255,0.60)',
    cardBorder:'rgba(0,0,0,0.09)',
    cardTint:'rgba(0,135,220,0.08)',
    orb1:'#0087DC38', orb2:'#006ab830',
    bg1:'#001a5c', bg2:'#0055a8', bg3:'#a0c8f5',
  },
  green: {
    bgTop:'#017838', bgMid:'#015c2c', bgBot:'#011a0c',
    sil:'#ffffff', silOp:0.13,
    hero:'#ffffff', pr:'#02A95B',
    c0:'rgba(18,28,38,0.80)', c1:'rgba(255,255,255,0.35)',
    sf:'#011a0c', th:'#ffffff', tm:'rgba(255,255,255,0.85)', tl:'rgba(255,255,255,0.60)',
    cardBorder:'rgba(0,0,0,0.09)',
    cardTint:'rgba(2,169,91,0.08)',
    orb1:'#02A95B35', orb2:'#01783830',
    bg1:'#003a18', bg2:'#02803a', bg3:'#90e0b8',
  },
  ld: {
    bgTop:'#c8820e', bgMid:'#a06610', bgBot:'#281800',
    sil:'#ffffff', silOp:0.13,
    hero:'#ffffff', pr:'#FAA61A',
    c0:'rgba(18,28,38,0.80)', c1:'rgba(255,255,255,0.35)',
    sf:'#281800', th:'#ffffff', tm:'rgba(255,255,255,0.85)', tl:'rgba(255,255,255,0.60)',
    cardBorder:'rgba(0,0,0,0.09)',
    cardTint:'rgba(250,166,26,0.08)',
    orb1:'#FAA61A35', orb2:'#c8820e28',
    bg1:'#5c2800', bg2:'#b87000', bg3:'#f5cc80',
  },
  rb: {
    bgTop:'#1a4a9e', bgMid:'#122878', bgBot:'#060e28',
    sil:'#ffffff', silOp:0.13,
    hero:'#ffffff', pr:'#7C3AED',
    c0:'rgba(18,28,38,0.80)', c1:'rgba(255,255,255,0.35)',
    sf:'#060e28', th:'#ffffff', tm:'rgba(255,255,255,0.85)', tl:'rgba(255,255,255,0.60)',
    cardBorder:'rgba(0,0,0,0.09)',
    cardTint:'rgba(124,58,237,0.08)',
    orb1:'#7C3AED38', orb2:'#1a4a9e28',
    bg1:'#2a0060', bg2:'#5c20c0', bg3:'#c0a0f0',
  },
  base: {
    bgTop:'#0a9ab8', bgMid:'#0d7a94', bgBot:'#020c12',
    sil:'#ffffff', silOp:0.13,
    hero:'#ffffff', pr:'#0061A4',
    c0:'rgba(18,28,38,0.80)', c1:'rgba(255,255,255,0.35)',
    sf:'#041e2a', th:'#ffffff', tm:'rgba(255,255,255,0.85)', tl:'rgba(255,255,255,0.60)',
    cardBorder:'rgba(0,0,0,0.09)',
    cardTint:'rgba(0,97,164,0.08)',
    orb1:'#0061A438', orb2:'#90c0e030',
    bg1:'#001a3c', bg2:'#0055a0', bg3:'#90c0e0',
  },
}

import { getPartyByName } from './data/partyRegistry'

export const THEMES = { ...LIGHT }

export const partyTheme = (name) => {
  return getPartyByName(name).themeKey || 'base'
}

export const getTheme = (name, dark = false) => {
  const key = partyTheme(name)
  return dark ? DARK[key] : LIGHT[key]
}
