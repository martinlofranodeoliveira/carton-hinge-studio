import {validateDimensions,validateFoldTicks} from './validator';
export interface CliArguments {mode:'demo'|'study'|'svg';width:number;depth:number;height:number;fold:number;format:'text'|'json'|'svg';assert:boolean;json:boolean;}
export function parseCliArguments(args:readonly string[]):CliArguments{
  const first=args[0];const mode=first===undefined||first.startsWith('--')?'demo':first;
  if(mode!=='demo'&&mode!=='study'&&mode!=='svg')throw new Error('Invalid command');
  const options=first===mode?args.slice(1):args;
  const result:CliArguments={mode,width:120,depth:80,height:40,fold:mode==='svg'?0:1000,format:'text',assert:false,json:false};
  const seen=new Set<string>();
  for(const option of options){
    if(mode==='demo'){
      if((option!=='--assert'&&option!=='--json')||seen.has(option))throw new Error('Invalid demo options');
      seen.add(option);if(option==='--assert')result.assert=true;else result.json=true;continue;
    }
    const match=/^--(width|depth|height|fold|format)=(.+)$/.exec(option);
    if(!match||seen.has(match[1]))throw new Error('Invalid study options');
    const key=match[1];const value=match[2];seen.add(key);
    if(mode==='svg'&&(key==='fold'||key==='format'))throw new Error('Invalid SVG options');
    if(key==='format'){
      if(value!=='text'&&value!=='json'&&value!=='svg')throw new Error('Invalid format');result.format=value;
    }else{
      if(!/^(0|[1-9][0-9]*)$/.test(value))throw new Error('Expected canonical integer');
      result[key as 'width'|'depth'|'height'|'fold']=Number(value);
    }
  }
  if(validateDimensions(result)||validateFoldTicks(result.fold))throw new Error('Out of bounds');
  return result;
}
