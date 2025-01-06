export type TextBox = {
  key:string,
  x:number,
  y:number,
  width:number,
  height:number,
  className:string
}

type SvgTemplate = {
  url:string,
  svgText:string,
  textBoxes:TextBox[]
}

export default SvgTemplate;