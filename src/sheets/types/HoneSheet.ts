import HoneColumn from './HoneColumn';
import Rowset from './Rowset';

type HoneSheet = {
  name:string,
  columns:HoneColumn[],
  rows:Rowset
}

export default HoneSheet;