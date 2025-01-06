import styles from './SquiggleFilter.module.css';

export enum SquiggleType {
  NONE = 'none',
  DETECTABLE = 'detectable',
  SUBTLE = 'subtle',
  SWIMMING_POOL = 'swimmingPool',
  PLYMPTON = 'plympton',
  BOILING = 'boiling',
  DISINTEGRATING = 'disintegrating',
  GASEOUS = 'gaseous',
  STATIC = 'static',
  JANK_TV = 'jankTv'
}

export function classNameForSquiggleType(style:SquiggleType):string {
  return styles[style];
}

type Props = {
  squiggleType:SquiggleType
}

type SquiggleSettings = {
  baseFrequencyMultiplier:number,
  scale:number
}

const settingsByType:{[key in SquiggleType]:SquiggleSettings} = {
  [SquiggleType.NONE]: {baseFrequencyMultiplier:0, scale:0}, // Settings not used.
  [SquiggleType.DETECTABLE]: {baseFrequencyMultiplier:.1, scale:25},
  [SquiggleType.SUBTLE]: {baseFrequencyMultiplier:1, scale:25},
  [SquiggleType.SWIMMING_POOL]: {baseFrequencyMultiplier:10, scale:25},
  [SquiggleType.PLYMPTON]: {baseFrequencyMultiplier:10, scale:200},
  [SquiggleType.BOILING]: {baseFrequencyMultiplier:100, scale:25},
  [SquiggleType.DISINTEGRATING]: {baseFrequencyMultiplier:500, scale:25},
  [SquiggleType.GASEOUS]: {baseFrequencyMultiplier:1000, scale:25},
  [SquiggleType.STATIC]: {baseFrequencyMultiplier:5000, scale:25},
  [SquiggleType.JANK_TV]: {baseFrequencyMultiplier:8000, scale:25}
}

// The filter is output into the DOM, which allows the CSS animation defined in Squiggle.module.css to reference it. To use the filter
// other elements, output this component into the DOM. And call classNameForSquiggleType() to get the class name to apply to the
// animated element.
function SquiggleFilter({squiggleType}:Props) {
  if (squiggleType === SquiggleType.NONE) return null;
  const settings = settingsByType[squiggleType];
  return (
    <svg display="none" className={styles.container}>
      <filter id={`${squiggleType}-1`}>
        <feTurbulence type="fractalNoise" baseFrequency={0.0001*settings.baseFrequencyMultiplier} numOctaves="2" data-filterid="3" />
        <feDisplacementMap xChannelSelector="R" yChannelSelector="G" in="SourceGraphic" scale={settings.scale} />
      </filter>

      <filter id={`${squiggleType}-2`}>
        <feTurbulence type="fractalNoise" baseFrequency={0.00015*settings.baseFrequencyMultiplier} numOctaves="2" data-filterid="3" />
        <feDisplacementMap xChannelSelector="R" yChannelSelector="G" in="SourceGraphic" scale={settings.scale} />
      </filter>

      <filter id={`${squiggleType}-3`}>
        <feTurbulence type="fractalNoise" baseFrequency={0.0002*settings.baseFrequencyMultiplier} numOctaves="2" data-filterid="3" />
        <feDisplacementMap xChannelSelector="R" yChannelSelector="G" in="SourceGraphic" scale={settings.scale} />
      </filter>

      <filter id={`${squiggleType}-4`}>
        <feTurbulence type="fractalNoise" baseFrequency={0.00025*settings.baseFrequencyMultiplier} numOctaves="2" data-filterid="3" />
        <feDisplacementMap xChannelSelector="R" yChannelSelector="G" in="SourceGraphic" scale={settings.scale} />
      </filter>

      <filter id={`${squiggleType}-5`}>
        <feTurbulence type="fractalNoise" baseFrequency={0.0003*settings.baseFrequencyMultiplier} numOctaves="2" data-filterid="3" />
        <feDisplacementMap xChannelSelector="R" yChannelSelector="G" in="SourceGraphic" scale={settings.scale} />
      </filter>
    </svg>
  );
}

export default SquiggleFilter;