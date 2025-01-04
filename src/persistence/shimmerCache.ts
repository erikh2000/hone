import { fillTemplate } from "@/common/stringUtil";
import { getAllKeysAtPath, setText, getText } from "./pathStore";
import { SHIMMER_FRAMES_PATH } from "./pathTemplates";
import { MIMETYPE_SVG } from "./mimeTypes";

function _urlToFilename(url:string):string {
  const querystringPos = url.indexOf('?');
  if (querystringPos !== -1) url = url.substring(0, querystringPos);
  const lastSlash = url.lastIndexOf('/');
  if (lastSlash === -1) return url;
  return url.substring(lastSlash + 1);
}

function _urlToKeyPath(url:string):string {
  const svgUrlFilename = _urlToFilename(url);
  return fillTemplate(SHIMMER_FRAMES_PATH, {svgUrlFilename});
}

export async function getShimmerFrames(url:string):Promise<string[]|null> {
  const keyPath = _urlToKeyPath(url);
  const keys = await getAllKeysAtPath(keyPath);
  if (keys.length === 0) return null;

  const promises = keys.map(key => getText(key));
  const svgDataUrls = await Promise.all(promises);
  return svgDataUrls.filter(svgDataUrl => svgDataUrl !== null) as string[];
}

export async function setShimmerFrames(url:string, frames:string[]) {
  const keyPath = _urlToKeyPath(url);
  const promises = frames.map((frame, frameI) => setText(`${keyPath}${frameI}.svg`, frame, MIMETYPE_SVG));
  await Promise.all(promises);
}