import type { AllowedTypes } from "../types/types";

export const allowedDocumentTypes: AllowedTypes = {
  pdf: "application/pdf",
  javascript: "text/javascript",
  python: "text/x-python",
  txt: "text/plain",
  html: "text/html",
  css: "text/css",
  md: "text/md",
  csv: "text/csv",
  xml: "text/xml",
  rtf: "text/rtf",
};

export const allowedAudioTypes: AllowedTypes = {
  wav: "audio/wav",
  mp3: "audio/mp3",
  aiff: "audio/aiff",
  aac: "audio/aac",
  ogg: "audio/ogg",
  flac: "audio/flac",
  oga: "audio/oga",
};

export const allowedImageTypes: AllowedTypes = {
  png: "image/png",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};
