export interface filterOptions {
  minPP?: number;
  maxPP?: number;
  minLength?: number;
  maxLength?: number;
  mods?: string;
}

export enum Mods {
  NM = "0",
  HD = "8",
  HR = "16",
  DT = "64",
  HDDT = "72",
  HDHR = "24",
  HDHRDT = "88",
  None = "",
}

export interface BeatmapDiffLegacy {
  m: number;
  b: number; // map id
  x: number;
  pp99: number;
  adj: number;
  v: string;
  s: number; // mapset id
  l: number;
  d: number;
  p: number;
  h: number;
  appr_h: number;
  k?: number;
}

export interface BeatmapSetLegacy {
  art: string;
  t: string;
  bpm: number;
  g: number;
  ln: number;
  s: number;
}

export interface BeatmapLegacy extends BeatmapDiffLegacy, BeatmapSetLegacy {}

export interface BeatmapDiff {
  beatmapId: number;
  mapsetId: number;
  farmValue: number;
  mods: number;
  pp: number | null;
  adjusted: number; // deprecate?
  version: string;
  length: number;
  difficulty: number;
  passCount: number;
  hoursSinceRanked: number;
  approvedHoursTimestamp: number;
  maniaKeys?: number;
}

export interface BeatmapSet {
  mapsetId: number;
  artist: string;
  title: string;
  bpm: number;
  genre: number;
  language: number;
}
