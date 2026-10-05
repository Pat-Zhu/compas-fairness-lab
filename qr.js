/* QR Code Model 2, byte mode, version 6 / M, mask 0, <=106 UTF-8 bytes.
 * Finder/format placement adapted from QRCode for JavaScript.
 * Copyright (c) 2009 Kazuhiko Arase. MIT license; see QR-LICENSE.txt.
 * Fixed version keeps this bundled classroom encoder small and offline-capable.
 */
(function(root){
'use strict';
function matrix(text){
 const bytes=Array.from(new TextEncoder().encode(text));
 if(bytes.length>106)throw new Error('Student link is too long for this QR. Use Copy student link.');
 const bits=[]; const put=(v,n)=>{for(let i=n-1;i>=0;i--)bits.push((v>>>i)&1);};
 put(4,4);put(bytes.length,8);bytes.forEach(v=>put(v,8));
 put(0,Math.min(4,864-bits.length));while(bits.length%8)bits.push(0);
 const data=[];for(let i=0;i<bits.length;i+=8)data.push(bits.slice(i,i+8).reduce((a,b)=>(a<<1)|b,0));
 for(let i=0;data.length<108;i++)data.push(i%2?17:236);
 const exp=Array(512),log=Array(256);let x=1;
 for(let i=0;i<255;i++){exp[i]=x;log[x]=i;x<<=1;if(x&256)x^=285;}
 for(let i=255;i<512;i++)exp[i]=exp[i-255];
 const mul=(a,b)=>a&&b?exp[log[a]+log[b]]:0;
 let gen=[1];for(let i=0;i<16;i++){const next=Array(gen.length+1).fill(0);gen.forEach((v,j)=>{next[j]^=v;next[j+1]^=mul(v,exp[i]);});gen=next;}
 const blocks=[],ecc=[];
 for(let b=0;b<4;b++){
  const block=data.slice(b*27,(b+1)*27);blocks.push(block);const rem=block.concat(Array(16).fill(0));
  for(let i=0;i<27;i++){const f=rem[i];for(let j=0;j<gen.length;j++)rem[i+j]^=mul(gen[j],f);}
  ecc.push(rem.slice(27));
 }
 const code=[];for(let i=0;i<27;i++)for(let b=0;b<4;b++)code.push(blocks[b][i]);
 for(let i=0;i<16;i++)for(let b=0;b<4;b++)code.push(ecc[b][i]);
 const n=41,a=Array.from({length:n},()=>Array(n).fill(null));
 function finder(y,x){for(let r=-1;r<=7;r++)for(let c=-1;c<=7;c++)if(y+r>=0&&y+r<n&&x+c>=0&&x+c<n){a[y+r][x+c]=(r>=0&&r<=6&&(c===0||c===6))||(c>=0&&c<=6&&(r===0||r===6))||(r>=2&&r<=4&&c>=2&&c<=4);}}
 finder(0,0);finder(34,0);finder(0,34);
 for(let r=-2;r<=2;r++)for(let c=-2;c<=2;c++)a[34+r][34+c]=Math.max(Math.abs(r),Math.abs(c))!==1;
 for(let i=8;i<n-8;i++){if(a[i][6]===null)a[i][6]=i%2===0;if(a[6][i]===null)a[6][i]=i%2===0;}
 const format=0x5412;
 for(let i=0;i<15;i++){
  const bit=((format>>>i)&1)===1;
  a[i<6?i:i<8?i+1:n-15+i][8]=bit;
  a[8][i<8?n-i-1:i<9?15-i:15-i-1]=bit;
 }
 a[n-8][8]=true;let row=n-1,dir=-1,pos=0;
 for(let col=n-1;col>0;col-=2){if(col===6)col--;while(true){for(let c=0;c<2;c++)if(a[row][col-c]===null){let v=pos<code.length*8?((code[pos>>>3]>>>(7-(pos&7)))&1):0;pos++;if((row+col-c)%2===0)v^=1;a[row][col-c]=!!v;}row+=dir;if(row<0||row>=n){row-=dir;dir=-dir;break;}}}
 return a;
}
function svg(text){
 const a=matrix(text);let path='';a.forEach((row,y)=>row.forEach((dark,x)=>{if(dark)path+='M'+(x+4)+','+(y+4)+'h1v1h-1z';}));
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 49 49" role="img" aria-label="Scan to join this classroom" shape-rendering="crispEdges"><rect width="49" height="49" fill="white"/><path d="'+path+'" fill="black"/></svg>';
}
root.ClassroomQR={matrix,svg};
})(typeof window==='undefined'?globalThis:window);
