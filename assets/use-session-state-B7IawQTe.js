import{a as u}from"./index-BEJ8K2gv.js";import{r}from"./vendor-Pz6HhvY5.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=u("Filter",[["polygon",{points:"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3",key:"1yg77f"}]]);function g(e,o){const[n,a]=r.useState(()=>{try{const t=sessionStorage.getItem(e);if(t!==null)return JSON.parse(t)}catch{}return o}),c=r.useCallback(t=>{a(i=>{const s=typeof t=="function"?t(i):t;try{sessionStorage.setItem(e,JSON.stringify(s))}catch{}return s})},[e]);return[n,c]}export{p as F,g as u};
