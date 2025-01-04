import { useEffect, useState } from "react";
import { getOrCreateShimmerBlobUrls } from "./svgUtil";
import styles from './LivingSvg.module.css';

type Props = {
  url:string,
  textReplacements?:{[key:string]:string}
  shimmerAmount?:number,
  framesPerSecond?:number
}

const DEFAULT_FRAME_INTERVAL = 1000 / 15; // 15 FPS
const DEFAULT_SHIMMER_AMOUNT = .05;

function LivingSvg({url, framesPerSecond, shimmerAmount}:Props) {
  const [frameNo, setFrameNo] = useState(0);
  const [frames, setFrames] = useState<string[]>([]);
  const [frameInterval, setFrameInterval] = useState(DEFAULT_FRAME_INTERVAL);

  useEffect(() => {
    if (framesPerSecond) setFrameInterval(1000 / framesPerSecond);
    getOrCreateShimmerBlobUrls(url, shimmerAmount ?? DEFAULT_SHIMMER_AMOUNT, 3, false).then(setFrames);
  }, [url, framesPerSecond, shimmerAmount]);

  useEffect(() => {
    const timer = setTimeout(
      () => setFrameNo(frameNo + 1), frameInterval);
    return () => clearTimeout(timer);
  }, [frameNo]);

  if (!frames) return null;

  const svgBlobUrl = frames[0];

  return <>
    <svg display="none">
      <filter id="turbulence-1">
        <feTurbulence type="fractalNoise" baseFrequency="0.0001" numOctaves="2" data-filterid="3" />
        <feDisplacementMap xChannelSelector="R" yChannelSelector="G" in="SourceGraphic" scale="25" />
      </filter>

      <filter id="turbulence-2">
        <feTurbulence type="fractalNoise" baseFrequency="0.00015" numOctaves="2" data-filterid="3" />
        <feDisplacementMap xChannelSelector="R" yChannelSelector="G" in="SourceGraphic" scale="25" />
      </filter>

      <filter id="turbulence-3">
        <feTurbulence type="fractalNoise" baseFrequency="0.0002" numOctaves="2" data-filterid="3" />
        <feDisplacementMap xChannelSelector="R" yChannelSelector="G" in="SourceGraphic" scale="25" />
      </filter>

      <filter id="turbulence-4">
        <feTurbulence type="fractalNoise" baseFrequency="0.00025" numOctaves="2" data-filterid="3" />
        <feDisplacementMap xChannelSelector="R" yChannelSelector="G" in="SourceGraphic" scale="25" />
      </filter>

      <filter id="turbulence-5">
        <feTurbulence type="fractalNoise" baseFrequency="0.0003" numOctaves="2" data-filterid="3" />
        <feDisplacementMap xChannelSelector="R" yChannelSelector="G" in="SourceGraphic" scale="25" />
      </filter>
    </svg>
    <img src={svgBlobUrl} className={styles.jiggleImage} />
  </>;
}

export default LivingSvg;