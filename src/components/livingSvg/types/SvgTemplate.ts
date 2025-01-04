import SvgCoordinates from "./SvgCoordinates";

type SvgTemplate = {
  url:string,
  svgText:string,
  parts:(string|SvgCoordinates)[]
}

export default SvgTemplate;