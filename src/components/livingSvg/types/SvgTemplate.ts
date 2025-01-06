export type TextBox = {
  key:string,
  x:number,
  y:number,
  width:number,
  height:number
}

type SvgTemplate = {
  url:string,
  svgText:string,
  textBoxes:TextBox[]
}

export default SvgTemplate;