import{$ as e,A as t,D as n,E as r,F as i,G as a,J as o,K as s,L as c,N as l,O as u,P as d,Q as f,S as p,T as m,W as h,X as g,Z as _,_t as v,a as y,at as b,b as x,ct as S,d as C,f as w,gt as T,h as E,j as D,k as O,lt as k,m as A,mt as j,nt as M,p as N,pt as P,rt as F,s as I,st as L,ut as R,v as z,w as B,y as V,z as H}from"./Dk-S2qyk.js";import"./xihTtKlq.js";var U=Object.freeze({}),W=new class{constructor(){this.panels=new Map,this.listeners=new Map,this.globalListeners=new Set,this.snapshots=new Map,this.actionListeners=new Map,this.presets=new Map,this.activePreset=new Map,this.baseValues=new Map}registerPanel(e,t,n,r){let i=this.parseConfig(n,``,r),a=this.flattenValues(n,``);this.initTransitionModes(n,``,a),this.panels.set(e,{id:e,name:t,controls:i,values:a,shortcuts:r??{}}),this.snapshots.set(e,{...a}),this.baseValues.set(e,{...a}),this.notifyGlobal()}updatePanel(e,t,n,r){let i=this.panels.get(e);if(!i){this.registerPanel(e,t,n,r);return}let a=this.parseConfig(n,``,r),o=this.mapControlsByPath(a),s=this.flattenValues(n,``),c={};for(let[e,t]of Object.entries(s))c[e]=this.normalizePreservedValue(i.values[e],t,o.get(e));this.initTransitionModes(n,``,c);for(let[e,t]of Object.entries(i.values)){if(!e.endsWith(`.__mode`))continue;let n=e.slice(0,-7);o.get(n)?.type===`transition`&&(c[e]=t)}let l={id:e,name:t,controls:a,values:c,shortcuts:r??i.shortcuts};this.panels.set(e,l),this.snapshots.set(e,{...c});let u=this.baseValues.get(e)??{},d={};for(let[e,t]of Object.entries(s))d[e]=this.normalizePreservedValue(u[e],t,o.get(e));for(let[e,t]of Object.entries(c))e.endsWith(`.__mode`)&&(d[e]=t);this.baseValues.set(e,d),this.notify(e),this.notifyGlobal()}unregisterPanel(e){this.panels.delete(e),this.listeners.delete(e),this.snapshots.delete(e),this.actionListeners.delete(e),this.baseValues.delete(e),this.notifyGlobal()}updateValue(e,t,n){let r=this.panels.get(e);if(!r)return;r.values[t]=n;let i=this.activePreset.get(e);if(i){let r=(this.presets.get(e)??[]).find(e=>e.id===i);r&&(r.values[t]=n)}else{let r=this.baseValues.get(e);r&&(r[t]=n)}this.snapshots.set(e,{...r.values}),this.notify(e)}updateSpringMode(e,t,n){this.updateTransitionMode(e,t,n)}getSpringMode(e,t){let n=this.getTransitionMode(e,t);return n===`easing`?`simple`:n}updateTransitionMode(e,t,n){let r=this.panels.get(e);r&&(r.values[`${t}.__mode`]=n,this.snapshots.set(e,{...r.values}),this.notify(e))}getTransitionMode(e,t){let n=this.panels.get(e);return n&&n.values[`${t}.__mode`]||`simple`}getValue(e,t){return this.panels.get(e)?.values[t]}getValues(e){return this.snapshots.get(e)??U}getPanels(){return Array.from(this.panels.values())}getPanel(e){return this.panels.get(e)}subscribe(e,t){return this.listeners.has(e)||this.listeners.set(e,new Set),this.listeners.get(e).add(t),()=>{this.listeners.get(e)?.delete(t)}}subscribeGlobal(e){return this.globalListeners.add(e),()=>this.globalListeners.delete(e)}subscribeActions(e,t){return this.actionListeners.has(e)||this.actionListeners.set(e,new Set),this.actionListeners.get(e).add(t),()=>{this.actionListeners.get(e)?.delete(t)}}triggerAction(e,t){this.actionListeners.get(e)?.forEach(e=>e(t))}savePreset(e,t){let n=this.panels.get(e);if(!n)throw Error(`Panel ${e} not found`);let r=`preset-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,i={id:r,name:t,values:{...n.values}},a=this.presets.get(e)??[];return this.presets.set(e,[...a,i]),this.activePreset.set(e,r),this.snapshots.set(e,{...n.values}),this.notify(e),r}loadPreset(e,t){let n=this.panels.get(e);if(!n)return;let r=(this.presets.get(e)??[]).find(e=>e.id===t);r&&(n.values={...r.values},this.snapshots.set(e,{...n.values}),this.activePreset.set(e,t),this.notify(e))}deletePreset(e,t){let n=this.presets.get(e)??[];this.presets.set(e,n.filter(e=>e.id!==t)),this.activePreset.get(e)===t&&this.activePreset.set(e,null);let r=this.panels.get(e);r&&this.snapshots.set(e,{...r.values}),this.notify(e)}getPresets(e){return this.presets.get(e)??[]}getActivePresetId(e){return this.activePreset.get(e)??null}clearActivePreset(e){let t=this.panels.get(e),n=this.baseValues.get(e);t&&n&&(t.values={...n},this.snapshots.set(e,{...t.values})),this.activePreset.set(e,null),this.notify(e)}resolveShortcutTarget(e,t){for(let n of this.panels.values())for(let[r,i]of Object.entries(n.shortcuts)){if(!i.key||i.key.toLowerCase()!==e.toLowerCase()||(i.modifier??void 0)!==t)continue;let a=this.findControlByPath(n.controls,r);if(a)return{panelId:n.id,path:r,control:a}}return null}resolveScrollOnlyTargets(){let e=[];for(let t of this.panels.values())for(let[n,r]of Object.entries(t.shortcuts)){if((r.interaction??`scroll`)!==`scroll-only`)continue;let i=this.findControlByPath(t.controls,n);i&&e.push({panelId:t.id,path:n,control:i,shortcut:r})}return e}findControlByPath(e,t){for(let n of e){if(n.path===t)return n;if(n.type===`folder`&&n.children){let e=this.findControlByPath(n.children,t);if(e)return e}}return null}notify(e){this.listeners.get(e)?.forEach(e=>e())}notifyGlobal(){this.globalListeners.forEach(e=>e())}initTransitionModes(e,t,n){for(let[r,i]of Object.entries(e)){if(r===`_collapsed`)continue;let e=t?`${t}.${r}`:r;if(this.isEasingConfig(i))n[`${e}.__mode`]=`easing`;else if(this.isSpringConfig(i)){let t=i.stiffness!==void 0||i.damping!==void 0||i.mass!==void 0,r=i.visualDuration!==void 0||i.bounce!==void 0;n[`${e}.__mode`]=t&&!r?`advanced`:`simple`}else typeof i==`object`&&i&&!Array.isArray(i)&&!this.isActionConfig(i)&&!this.isSelectConfig(i)&&!this.isColorConfig(i)&&!this.isTextConfig(i)&&this.initTransitionModes(i,e,n)}}parseConfig(e,t,n){let r=[];for(let[i,a]of Object.entries(e)){if(i===`_collapsed`)continue;let e=t?`${t}.${i}`:i,o=this.formatLabel(i),s=n?.[e];if(Array.isArray(a)&&a.length<=4&&typeof a[0]==`number`)r.push({type:`slider`,path:e,label:o,min:a[1],max:a[2],step:a[3]??this.inferStep(a[1],a[2]),shortcut:s});else if(typeof a==`number`){let{min:t,max:n,step:i}=this.inferRange(a);r.push({type:`slider`,path:e,label:o,min:t,max:n,step:i,shortcut:s})}else if(typeof a==`boolean`)r.push({type:`toggle`,path:e,label:o,shortcut:s});else if(this.isSpringConfig(a)||this.isEasingConfig(a))r.push({type:`transition`,path:e,label:o});else if(this.isActionConfig(a))r.push({type:`action`,path:e,label:a.label||o});else if(this.isSelectConfig(a))r.push({type:`select`,path:e,label:o,options:a.options});else if(this.isColorConfig(a))r.push({type:`color`,path:e,label:o});else if(this.isTextConfig(a))r.push({type:`text`,path:e,label:o,placeholder:a.placeholder});else if(typeof a==`string`)this.isHexColor(a)?r.push({type:`color`,path:e,label:o}):r.push({type:`text`,path:e,label:o});else if(typeof a==`object`&&a){let t=a,i=`_collapsed`in t?!t._collapsed:!0;r.push({type:`folder`,path:e,label:o,defaultOpen:i,children:this.parseConfig(t,e,n)})}}return r}flattenValues(e,t){let n={};for(let[r,i]of Object.entries(e)){if(r===`_collapsed`)continue;let e=t?`${t}.${r}`:r;if(Array.isArray(i)&&i.length<=4&&typeof i[0]==`number`)n[e]=i[0];else if(typeof i==`number`||typeof i==`boolean`||typeof i==`string`)n[e]=i;else if(this.isSpringConfig(i)||this.isEasingConfig(i))n[e]=i;else if(this.isActionConfig(i))n[e]=i;else if(this.isSelectConfig(i)){let t=i.options[0],r=typeof t==`string`?t:t.value;n[e]=i.default??r}else this.isColorConfig(i)?n[e]=i.default??`#000000`:this.isTextConfig(i)?n[e]=i.default??``:typeof i==`object`&&i&&Object.assign(n,this.flattenValues(i,e))}return n}isSpringConfig(e){return typeof e==`object`&&!!e&&`type`in e&&e.type===`spring`}isEasingConfig(e){return typeof e==`object`&&!!e&&`type`in e&&e.type===`easing`}isActionConfig(e){return typeof e==`object`&&!!e&&`type`in e&&e.type===`action`}isSelectConfig(e){return typeof e==`object`&&!!e&&`type`in e&&e.type===`select`&&`options`in e&&Array.isArray(e.options)}isColorConfig(e){return typeof e==`object`&&!!e&&`type`in e&&e.type===`color`}isTextConfig(e){return typeof e==`object`&&!!e&&`type`in e&&e.type===`text`}isHexColor(e){return/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(e)}formatLabel(e){return e.replace(/([A-Z])/g,` $1`).replace(/^./,e=>e.toUpperCase()).trim()}inferRange(e){return e>=0&&e<=1?{min:0,max:1,step:.01}:e>=0&&e<=10?{min:0,max:e*3||10,step:.1}:e>=0&&e<=100?{min:0,max:e*3||100,step:1}:e>=0?{min:0,max:e*3||1e3,step:10}:{min:e*3,max:-e*3,step:1}}inferStep(e,t){let n=t-e;return n<=1?.01:n<=10?.1:n<=100?1:10}normalizePreservedValue(e,t,n){if(e===void 0||!n)return t;switch(n.type){case`slider`:{if(typeof e!=`number`||typeof t!=`number`)return t;let r=n.min??-1/0,i=n.max??1/0,a=Math.min(i,Math.max(r,e));return typeof n.step!=`number`||n.step<=0?a:this.roundToStep(a,r,i,n.step)}case`toggle`:return typeof e==`boolean`?e:t;case`select`:{if(typeof e!=`string`)return t;let r=n.options??[];return new Set(r.map(e=>typeof e==`string`?e:e.value)).has(e)?e:t}case`color`:case`text`:return typeof e==`string`?e:t;case`transition`:return this.isSpringConfig(t)?this.isSpringConfig(e)?e:t:this.isEasingConfig(t)&&this.isEasingConfig(e)?e:t;case`action`:return t;default:return t}}roundToStep(e,t,n,r){let i=t+Math.round((e-t)/r)*r,a=Math.min(n,Math.max(t,i)),o=this.stepPrecision(r);return Number(a.toFixed(o))}stepPrecision(e){let t=String(e),n=t.indexOf(`.`);return n===-1?0:t.length-n-1}mapControlsByPath(e){let t=new Map,n=e=>{for(let r of e){if(r.type===`folder`&&r.children){n(r.children);continue}t.set(r.path,r)}};return n(e),t}},G=0;function K(t,n,r){let i=`${t}-${++G}`,a=()=>q(n,W.getValues(i),``),o=F(e(a()));return s(()=>{W.registerPanel(i,t,n,r?.shortcuts),M(o,a(),!0);let e=W.subscribe(i,()=>{M(o,a(),!0)}),s=r?.onAction?W.subscribeActions(i,r.onAction):void 0;return()=>{e(),s?.(),W.unregisterPanel(i)}}),c(o)}function q(e,t,n){let r={};for(let[i,a]of Object.entries(e)){if(i===`_collapsed`)continue;let e=n?`${n}.${i}`:i;if(Array.isArray(a)&&a.length<=4&&typeof a[0]==`number`)r[i]=t[e]??a[0];else if(typeof a==`number`||typeof a==`boolean`||typeof a==`string`)r[i]=t[e]??a;else if(ee(a)||te(a))r[i]=t[e]??a;else if(ne(a))r[i]=t[e]??a;else if(re(a)){let n=a.default??oe(a.options);r[i]=t[e]??n}else ie(a)?r[i]=t[e]??a.default??`#000000`:ae(a)?r[i]=t[e]??a.default??``:typeof a==`object`&&a&&(r[i]=q(a,t,e))}return r}function J(e,t){return typeof e==`object`&&!!e&&`type`in e&&e.type===t}function ee(e){return J(e,`spring`)}function te(e){return J(e,`easing`)}function ne(e){return J(e,`action`)}function re(e){return J(e,`select`)&&`options`in e&&Array.isArray(e.options)}function ie(e){return J(e,`color`)}function ae(e){return J(e,`text`)}function oe(e){let t=e[0];return typeof t==`string`?t:t.value}var se=`@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap');

/* Dialkit Theme - Dark glassmorphic design */
.dialkit-root {
  /* Surfaces */
  --dial-surface: rgba(255, 255, 255, 0.05);
  --dial-surface-hover: rgba(255, 255, 255, 0.1);
  --dial-surface-active: rgba(255, 255, 255, 0.11);
  --dial-surface-subtle: rgba(255, 255, 255, 0.06);

  /* Text hierarchy - 3 levels */
  --dial-text-root: #FFFFFF;   /* Root title */
  --dial-text-section: rgba(255, 255, 255, 0.7); /* Section titles + carets */
  --dial-text-label: rgba(255, 255, 255, 0.7);   /* Input labels */
  --dial-text-focus: #ffffff;

  /* Legacy aliases */
  --dial-text-primary: rgba(255, 255, 255, 0.95);
  --dial-text-secondary: rgba(255, 255, 255, 0.6);
  --dial-text-tertiary: rgba(255, 255, 255, 0.4);

  /* Borders */
  --dial-border: rgba(255, 255, 255, 0.1);
  --dial-border-hover: rgba(255, 255, 255, 0.15);

  /* Glassmorphic panel */
  --dial-glass-bg: #212121;
  --dial-dropdown-bg: #2a2a2a;
  --dial-backdrop-blur: 20px;
  --dial-radius: 8px;
  --dial-row-height: 36px;
  --dial-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  --dial-shadow-collapsed: 0 4px 16px rgba(0, 0, 0, 0.25);
  --dial-shadow-dropdown: 0 8px 24px rgba(0, 0, 0, 0.4);

  /* Fonts */
  font-family: system-ui, -apple-system, 'SF Pro Display', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.dialkit-panel {
  position: fixed;
  z-index: 9999;
  max-height: calc(100vh - 32px);
  overflow: visible;
}

/* Inline mode */
.dialkit-root[data-mode="inline"] {
  height: 100%;
}

.dialkit-panel[data-mode="inline"] {
  position: static;
  z-index: auto;
  max-height: 100%;
  height: 100%;
  overflow: hidden;
}

.dialkit-panel-inner {
  background: var(--dial-glass-bg);
  border: 1px solid var(--dial-border);
  border-radius: 14px;
  backdrop-filter: blur(var(--dial-backdrop-blur));
  -webkit-backdrop-filter: blur(var(--dial-backdrop-blur));
  padding: 10px 12px 0 12px;
  transform: translateZ(0);
  transform-origin: top right;
}

.dialkit-panel[data-position="top-left"] .dialkit-panel-inner {
  transform-origin: top left;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
}


.dialkit-panel-inner[data-collapsed="true"] {
  border-radius: 50%;
  padding: 12px;
  box-sizing: border-box;
}

.dialkit-panel-inner[data-collapsed="true"] .dialkit-panel-header {
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: none;
}

.dialkit-panel-inner[data-collapsed="true"] .dialkit-folder-title-row {
  display: none;
}

.dialkit-panel-inner[data-collapsed="true"] .dialkit-folder-header-top {
  justify-content: center;
  padding: 0;
}

.dialkit-panel-inner::-webkit-scrollbar {
  display: none;
}

.dialkit-panel-inner {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.dialkit-panel-inline {
  width: 100%;
  height: 100%;
  max-height: none;
  overflow-y: auto;
  box-shadow: none;
  border-radius: 0;
  border: none;
  box-sizing: border-box;
}

.dialkit-panel[data-mode="inline"] .dialkit-panel-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

/* Position variants */
.dialkit-panel[data-position="top-right"] {
  top: 16px;
  right: 16px;
}

.dialkit-panel[data-position="top-left"] {
  top: 16px;
  left: 16px;
}

.dialkit-panel[data-position="bottom-right"] {
  bottom: 16px;
  right: 16px;
}

.dialkit-panel[data-position="bottom-left"] {
  bottom: 16px;
  left: 16px;
}

/* Folder */
.dialkit-folder {
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--dial-surface-subtle);
}

.dialkit-folder:last-child:not(.dialkit-folder-root) {
  padding-bottom: 0;
  margin-bottom: 0;
}

.dialkit-folder-root {
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: none;
}

.dialkit-panel-header {
  padding-bottom: 6px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--dial-surface-subtle);
}

.dialkit-folder-header {
  cursor: pointer;
  user-select: none;
}

.dialkit-folder-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 8px 0;
}


.dialkit-folder-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--dial-text-section);
  letter-spacing: -0.01em;
  transform: translateY(-0.5px);
  transition: color 0.15s;
}

.dialkit-folder-title-root {
  font-size: 15px;
  font-weight: 600;
  color: var(--dial-text-root);
  transform: translateZ(0);
}

.dialkit-folder-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
}

.dialkit-folder-copy {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
}

.dialkit-folder-copy svg {
  width: 14px;
  height: 14px;
  color: var(--dial-text-section);
}

.dialkit-folder-icon {
  width: 20px;
  height: 20px;
  padding: 2px;
  box-sizing: border-box;
  flex-shrink: 0;
  color: var(--dial-text-label);
  opacity: 0.6;
}

.dialkit-panel-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 16px;
  height: 16px;
  color: var(--dial-text-focus);
  z-index: 1;
}

.dialkit-folder-content {
  will-change: transform;
}

.dialkit-folder-inner {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 10px;
}

/* Non-root folders - top & bottom HR dividers */
.dialkit-folder:not(.dialkit-folder-root) {
  border-top: 1px solid var(--dial-surface-subtle);
  border-bottom: 1px solid var(--dial-surface-subtle);
  margin-top: 4px;
  margin-bottom: 4px;
  padding-bottom: 0;
}

/* Adjacent non-root folders collapse gap and share a single divider */
.dialkit-folder:not(.dialkit-folder-root) + .dialkit-folder:not(.dialkit-folder-root) {
  margin-top: -10px;
  border-top: none;
}

/* Non-root folder header - match row height */
.dialkit-folder:not(.dialkit-folder-root) > .dialkit-folder-header {
  height: var(--dial-row-height);
  padding: 0;
}

.dialkit-folder:not(.dialkit-folder-root) > .dialkit-folder-header > .dialkit-folder-header-top {
  padding: 0;
  height: 100%;
}

/* Root folder inner needs no extra bottom padding */
.dialkit-folder-root > .dialkit-folder-content > .dialkit-folder-inner {
  padding-bottom: 0;
}

/* Content spacing handled by folder-inner gap */


/* Slider */
.dialkit-slider-wrapper {
  position: relative;
  height: var(--dial-row-height);
}

.dialkit-slider {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  user-select: none;
  overflow: hidden;
  background: var(--dial-surface);
  border-radius: var(--dial-radius);
  touch-action: none;
}

.dialkit-slider-hashmarks {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.dialkit-slider-hashmark {
  position: absolute;
  top: 50%;
  width: 1px;
  height: 8px;
  border-radius: 999px;
  transform: translateX(-50%) translateY(-50%);
  background: rgba(255, 255, 255, 0);
  transition: background 200ms;
}

.dialkit-slider-active .dialkit-slider-hashmark {
  background: var(--dial-border-hover);
}

.dialkit-slider-active .dialkit-slider-value {
  color: var(--dial-text-focus);
}

.dialkit-slider-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: var(--dial-surface-active);
  transition: background 0.15s;
  pointer-events: none;
}

.dialkit-slider-active .dialkit-slider-fill {
  background: var(--dial-border-hover);
}

.dialkit-slider-handle {
  position: absolute;
  top: 50%;
  width: 3px;
  height: 20px;
  border-radius: 999px;
  background: var(--dial-text-primary);
  pointer-events: none;
}

.dialkit-slider-label {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(calc(-50% - 0.5px));
  font-size: 13px;
  font-weight: 500;
  color: var(--dial-text-label);
  pointer-events: none;
  transition: color 0.15s;
  display: inline-flex;
  align-items: center;
}

.dialkit-slider-value {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(calc(-50% + 0.5px));
  font-size: 13px;
  font-weight: 500;
  font-family: 'Geist Mono', monospace;
  color: var(--dial-text-label);
  pointer-events: auto;
  transition: color 0.15s, border-color 0.15s;
  border-bottom: 1px solid transparent;
  padding-bottom: 1px;
}

.dialkit-slider-value-editable {
  border-bottom-color: var(--dial-text-label);
}

.dialkit-slider-input {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 4ch;
  min-width: 3ch;
  max-width: 6ch;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Geist Mono', monospace;
  color: var(--dial-text-label);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--dial-text-label);
  padding: 0 0 1px 0;
  outline: none;
  text-align: right;
}

.dialkit-slider-input:focus {
  color: var(--dial-text-focus);
}

/* Segmented Control */
.dialkit-segmented {
  position: relative;
  display: flex;
  padding: 2px;
  background: transparent;
  border-radius: var(--dial-radius);
}

.dialkit-segmented-pill {
  position: absolute;
  top: 2px;
  bottom: 2px;
  background: var(--dial-surface-active);
  border-radius: 6px;
  z-index: 0;
  pointer-events: none;
}

.dialkit-segmented-button {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  padding: 6px 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
}

.dialkit-segmented-button[data-active="true"] {
  color: var(--dial-text-primary);
}

.dialkit-segmented-button[data-active="false"] {
  color: var(--dial-text-label);
}

/* Toggle */
.dialkit-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--dial-surface);
  border-radius: var(--dial-radius);
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.dialkit-toggle:hover {
  background: var(--dial-surface-hover);
}

.dialkit-toggle-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--dial-text-label);
  transition: color 0.15s;
}

.dialkit-toggle[data-checked="true"] .dialkit-toggle-label {
  color: var(--dial-text-primary);
}

.dialkit-toggle-track {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: var(--dial-surface-active);
  transition: background 0.2s;
  position: relative;
}

.dialkit-toggle[data-checked="true"] .dialkit-toggle-track {
  background: var(--dial-border-hover);
}

.dialkit-toggle-thumb {
  position: absolute;
  top: 2px;
  width: 16px;
  height: 16px;
  border-radius: 8px;
  background: var(--dial-text-primary);
}

/* Button Group */
.dialkit-button-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dialkit-button {
  flex: 1;
  padding: 10px 16px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--dial-text-secondary);
  background: var(--dial-surface);
  border: none;
  border-radius: var(--dial-radius);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.dialkit-button:hover {
  background: var(--dial-surface-hover);
  color: var(--dial-text-primary);
}

.dialkit-button:active {
  background: var(--dial-surface-active);
}

/* Labeled Control Row (label + control side by side) */
.dialkit-labeled-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: var(--dial-row-height);
  padding: 2px 10px 2px 12px;
  background: var(--dial-surface);
  border-radius: var(--dial-radius);
}

.dialkit-labeled-control-label {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  color: var(--dial-text-label);
  flex-shrink: 0;
  line-height: 17px;
}

.dialkit-labeled-control .dialkit-segmented {
  flex-shrink: 0;
  margin-right: -6px;
}

.dialkit-action-button {
  width: 160px;
  flex-shrink: 0;
  padding: 10px 16px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--dial-text-secondary);
  background: var(--dial-surface);
  border: none;
  border-radius: var(--dial-radius);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.dialkit-action-button:hover {
  background: var(--dial-surface-hover);
  color: var(--dial-text-primary);
}

.dialkit-action-button:active {
  background: var(--dial-surface-active);
}

.dialkit-actions-group {
  align-items: flex-start;
}

.dialkit-actions-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 160px;
}

/* Spring Visualization */
.dialkit-spring-viz {
  width: 100%;
  border-radius: var(--dial-radius);
  background: var(--dial-surface);
  overflow: visible;
}

.dialkit-easing-viz {
  width: 100%;
  aspect-ratio: 256 / 140;
}

/* Panel Wrapper (contains panel + toolbar) */
.dialkit-panel-wrapper {
  display: inline-flex;
  flex-direction: column;
}

/* Panel Toolbar */
.dialkit-panel-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  height: var(--dial-row-height);
  margin-bottom: 6px;
  min-width: 0;
  overflow: hidden;
}

.dialkit-toolbar-add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--dial-row-height);
  height: var(--dial-row-height);
  padding: 0;
  flex-shrink: 0;
  background: var(--dial-surface);
  border: none;
  border-radius: var(--dial-radius);
  cursor: pointer;
  transition: background 0.15s;
}

.dialkit-toolbar-add:hover {
  background: var(--dial-surface-hover);
}

.dialkit-toolbar-add svg {
  width: 16px;
  height: 16px;
  color: var(--dial-text-label);
}

.dialkit-toolbar-copy {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  height: var(--dial-row-height);
  padding: 0 12px;
  flex-shrink: 0;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--dial-text-label);
  background: var(--dial-surface);
  border: none;
  border-radius: var(--dial-radius);
  cursor: pointer;
  transition: background 0.15s;
}

.dialkit-toolbar-copy:hover {
  background: var(--dial-surface-hover);
}

.dialkit-toolbar-copy-icon-wrap {
  position: relative;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.dialkit-toolbar-copy-icon {
  position: absolute;
  inset: 0;
  width: 16px;
  height: 16px;
}

/* Text Control */
.dialkit-text-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: var(--dial-row-height);
  padding: 0 12px;
  background: var(--dial-surface);
  border-radius: var(--dial-radius);
}

.dialkit-text-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--dial-text-label);
  flex-shrink: 0;
}

.dialkit-text-input {
  flex: 1;
  min-width: 0;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--dial-text-label);
  background: transparent;
  border: none;
  padding: 0;
  outline: none;
  text-align: right;
  cursor: text;
}

.dialkit-text-input:focus {
  color: var(--dial-text-focus);
}

.dialkit-text-input::placeholder {
  color: var(--dial-text-tertiary);
}

/* Select Control - Full-width row */
.dialkit-select-row {
}

.dialkit-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: var(--dial-row-height);
  padding: 0 12px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--dial-text-label);
  background: var(--dial-surface);
  border: none;
  border-radius: var(--dial-radius);
  cursor: pointer;
  transition: background 0.15s;
}

.dialkit-select-trigger:hover {
  background: var(--dial-surface-hover);
}

.dialkit-select-trigger[data-open="true"] {
  background: var(--dial-surface-active);
}

.dialkit-select-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--dial-text-label);
  flex-shrink: 0;
  transform: translateY(-0.5px);
}

.dialkit-select-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dialkit-select-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--dial-text-label);
  transform: translateY(-0.5px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dialkit-select-chevron {
  width: 20px;
  height: 20px;
  padding: 2px;
  box-sizing: border-box;
  flex-shrink: 0;
  opacity: 0.6;
}

/* Select Dropdown (portaled to body) */
.dialkit-select-dropdown {
  background: var(--dial-glass-bg);
  border: 1px solid var(--dial-border);
  border-radius: var(--dial-radius);
  padding: 4px;
  z-index: 10000;
  box-shadow: var(--dial-shadow-dropdown);
}

.dialkit-select-option {
  display: block;
  width: 100%;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--dial-text-label);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, color 0.15s;
}

.dialkit-select-option:hover {
  background: var(--dial-surface-hover);
}

.dialkit-select-option[data-selected="true"] {
  color: var(--dial-text-primary);
  background: var(--dial-surface-active);
}

/* Color Control */
.dialkit-color-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: var(--dial-row-height);
  padding: 0 12px;
  background: var(--dial-surface);
  border-radius: var(--dial-radius);
}

.dialkit-color-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--dial-text-label);
  flex-shrink: 0;
  transform: translateY(-0.5px);
}

.dialkit-color-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dialkit-color-hex {
  font-size: 13px;
  font-weight: 500;
  font-family: 'Geist Mono', monospace;
  color: var(--dial-text-label);
  cursor: text;
  transform: translateY(-0.5px);
}

.dialkit-color-hex-input {
  width: 7ch;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Geist Mono', monospace;
  color: var(--dial-text-label);
  background: transparent;
  border: none;
  padding: 0;
  outline: none;
  text-transform: uppercase;
  transform: translateY(-0.5px);
}

.dialkit-color-hex-input:focus {
  color: var(--dial-text-focus);
}

.dialkit-color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--dial-border-hover);
  cursor: pointer;
  transition: transform 0.15s;
}

.dialkit-color-swatch:hover {
  transform: scale(1.1);
}

.dialkit-color-picker-native {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

/* Preset Manager */
.dialkit-preset-manager {
  position: relative;
  flex: 1;
}

.dialkit-preset-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: var(--dial-row-height);
  padding: 0 12px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--dial-text-label);
  background: var(--dial-surface);
  border: none;
  border-radius: var(--dial-radius);
  cursor: pointer;
  transition: background 0.15s;
}

.dialkit-preset-trigger:hover {
  background: var(--dial-surface-hover);
}

.dialkit-preset-trigger[data-disabled="true"] {
  cursor: default;
}

.dialkit-preset-trigger[data-disabled="true"]:hover {
  background: var(--dial-surface);
}

.dialkit-preset-trigger[data-open="true"] {
  background: var(--dial-surface-active);
}

.dialkit-preset-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.dialkit-preset-dropdown {
  width: max-content;
  background: var(--dial-dropdown-bg);
  border: 1px solid var(--dial-border);
  border-radius: 12px;
  padding: 4px;
  z-index: 10000;
  box-shadow: var(--dial-shadow-dropdown);
}

.dialkit-preset-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 4px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--dial-border);
}

.dialkit-preset-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px 8px 10px;
  gap: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.dialkit-preset-item:hover {
  background: var(--dial-surface-hover);
}

.dialkit-preset-item[data-active="true"] {
  background: var(--dial-surface-active);
}

.dialkit-preset-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--dial-text-label);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dialkit-preset-item[data-active="true"] .dialkit-preset-name {
  color: var(--dial-text-primary);
}

.dialkit-preset-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.dialkit-preset-item:hover .dialkit-preset-delete {
  opacity: 0.6;
}

.dialkit-preset-delete:hover {
  opacity: 1 !important;
}

.dialkit-preset-delete svg {
  width: 14px;
  height: 14px;
  color: var(--dial-text-focus);
  pointer-events: none;
}

.dialkit-preset-save-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--dial-text-label);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.dialkit-preset-save-btn:hover {
  background: var(--dial-surface-hover);
  color: var(--dial-text-primary);
}

.dialkit-preset-save-btn svg {
  width: 12px;
  height: 12px;
}

.dialkit-preset-save-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
}

.dialkit-preset-input {
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  font-family: inherit;
  font-size: 13px;
  color: var(--dial-text-primary);
  background: var(--dial-surface);
  border: 1px solid var(--dial-border);
  border-radius: 6px;
  outline: none;
}

.dialkit-preset-input:focus {
  border-color: var(--dial-text-label);
}

.dialkit-preset-input::placeholder {
  color: var(--dial-text-tertiary);
}

.dialkit-preset-confirm {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: var(--dial-surface);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.dialkit-preset-confirm:hover:not(:disabled) {
  background: var(--dial-surface-hover);
}

.dialkit-preset-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.dialkit-preset-confirm svg {
  width: 14px;
  height: 14px;
  color: var(--dial-text-label);
}

/* Shortcut Pill */
.dialkit-shortcut-pill {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  font-family: system-ui, -apple-system, sans-serif;
  color: var(--dial-text-tertiary);
  background: var(--dial-surface-subtle);
  padding: 1px 5px;
  border-radius: 4px;
  margin-left: 6px;
  letter-spacing: 0.02em;
  line-height: 16px;
  white-space: nowrap;
  vertical-align: middle;
  transition: color 0.15s, background 0.15s;
}

.dialkit-shortcut-pill-active {
  color: var(--dial-text-primary);
  background: var(--dial-border-hover);
}

/* Shortcuts Menu Trigger */
.dialkit-shortcuts-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--dial-row-height);
  height: var(--dial-row-height);
  padding: 0;
  flex-shrink: 0;
  background: var(--dial-surface);
  border: none;
  border-radius: var(--dial-radius);
  cursor: pointer;
  transition: background 0.15s;
}

.dialkit-shortcuts-trigger:hover {
  background: var(--dial-surface-hover);
}

.dialkit-shortcuts-trigger svg {
  width: 16px;
  height: 16px;
  color: var(--dial-text-label);
}

/* Shortcuts Dropdown */
.dialkit-shortcuts-dropdown {
  background: var(--dial-dropdown-bg);
  border: 1px solid var(--dial-border);
  border-radius: 12px;
  padding: 8px;
  z-index: 10000;
  box-shadow: var(--dial-shadow-dropdown);
  min-width: 200px;
}

.dialkit-shortcuts-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--dial-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 8px 8px;
}

.dialkit-shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dialkit-shortcuts-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 6px;
}

.dialkit-shortcuts-row-key {
  font-size: 11px;
  font-weight: 600;
  font-family: ui-monospace, 'SF Mono', 'Courier New', monospace;
  color: var(--dial-text-secondary);
  background: var(--dial-surface-subtle);
  padding: 2px 6px;
  border-radius: 4px;
  min-width: 28px;
  text-align: center;
}

.dialkit-shortcuts-row-label {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--dial-text-label);
}

.dialkit-shortcuts-row-mode {
  font-size: 11px;
  font-weight: 500;
  color: var(--dial-text-tertiary);
  font-style: italic;
}

.dialkit-shortcuts-hint {
  font-size: 11px;
  color: var(--dial-text-tertiary);
  padding: 6px 8px 2px;
  border-top: 1px solid var(--dial-border);
  margin-top: 4px;
}

/* ── Light Theme ── */
.dialkit-root[data-theme="light"] {
  --dial-surface: rgba(0, 0, 0, 0.04);
  --dial-surface-hover: rgba(0, 0, 0, 0.08);
  --dial-surface-active: rgba(0, 0, 0, 0.1);
  --dial-surface-subtle: rgba(0, 0, 0, 0.06);

  --dial-text-root: #000000;
  --dial-text-section: rgba(0, 0, 0, 0.65);
  --dial-text-label: rgba(0, 0, 0, 0.6);
  --dial-text-focus: #000000;

  --dial-text-primary: rgba(0, 0, 0, 0.9);
  --dial-text-secondary: rgba(0, 0, 0, 0.55);
  --dial-text-tertiary: rgba(0, 0, 0, 0.35);

  --dial-border: rgba(0, 0, 0, 0.1);
  --dial-border-hover: rgba(0, 0, 0, 0.15);

  --dial-glass-bg: #fafafa;
  --dial-dropdown-bg: #ffffff;
  --dial-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  --dial-shadow-collapsed: 0 2px 10px rgba(0, 0, 0, 0.06);
  --dial-shadow-dropdown: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* Light mode: SVG visualization overrides */
.dialkit-root[data-theme="light"] .dialkit-spring-viz line {
  stroke: rgba(0, 0, 0, 0.08);
}

.dialkit-root[data-theme="light"] .dialkit-spring-viz line[stroke-dasharray] {
  stroke: rgba(0, 0, 0, 0.15);
}

.dialkit-root[data-theme="light"] .dialkit-spring-viz path {
  stroke: rgba(0, 0, 0, 0.5);
}

/* Light mode: toggle thumb needs shadow for definition */
.dialkit-root[data-theme="light"] .dialkit-toggle-thumb {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.08);
}

/* ── System preference: light ── */
@media (prefers-color-scheme: light) {
  .dialkit-root[data-theme="system"] {
    --dial-surface: rgba(0, 0, 0, 0.04);
    --dial-surface-hover: rgba(0, 0, 0, 0.08);
    --dial-surface-active: rgba(0, 0, 0, 0.1);
    --dial-surface-subtle: rgba(0, 0, 0, 0.06);

    --dial-text-root: #000000;
    --dial-text-section: rgba(0, 0, 0, 0.65);
    --dial-text-label: rgba(0, 0, 0, 0.6);
    --dial-text-focus: #000000;

    --dial-text-primary: rgba(0, 0, 0, 0.9);
    --dial-text-secondary: rgba(0, 0, 0, 0.55);
    --dial-text-tertiary: rgba(0, 0, 0, 0.35);

    --dial-border: rgba(0, 0, 0, 0.1);
    --dial-border-hover: rgba(0, 0, 0, 0.15);

    --dial-glass-bg: #fafafa;
    --dial-dropdown-bg: #ffffff;
    --dial-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    --dial-shadow-collapsed: 0 2px 10px rgba(0, 0, 0, 0.06);
    --dial-shadow-dropdown: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  .dialkit-root[data-theme="system"] .dialkit-spring-viz line {
    stroke: rgba(0, 0, 0, 0.08);
  }

  .dialkit-root[data-theme="system"] .dialkit-spring-viz line[stroke-dasharray] {
    stroke: rgba(0, 0, 0, 0.15);
  }

  .dialkit-root[data-theme="system"] .dialkit-spring-viz path {
    stroke: rgba(0, 0, 0, 0.5);
  }

  .dialkit-root[data-theme="system"] .dialkit-toggle-thumb {
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.08);
  }

}
`,ce=t(`<div style="display: contents;"><!></div>`);function le(e,t){k(t,!0);let n=y(t,`target`,3,`body`),i,a=()=>typeof document>`u`?null:n()?typeof n()==`string`?document.querySelector(n()):n():document.body;s(()=>{if(!i)return;let e=a();if(e)return e.appendChild(i),()=>{i?.remove()}});var o=ce(),c=g(o),l=e=>{var n=O();p(_(n),()=>t.children),u(e,n)};r(c,e=>{t.children&&e(l)}),j(o),I(o,e=>i=e,()=>i),u(e,o),S()}function ue(e){return Object.prototype.toString.call(e)===`[object Date]`}function de(e,t,n,r){if(typeof n==`number`||ue(n)){let i=r-n,a=(n-t)/(e.dt||1/60),o=(a+(e.opts.stiffness*i-e.opts.damping*a)*e.inv_mass)*e.dt;return Math.abs(o)<e.opts.precision&&Math.abs(i)<e.opts.precision?r:(e.settled=!1,ue(n)?new Date(n.getTime()+o):n+o)}else if(Array.isArray(n))return n.map((i,a)=>de(e,t[a],n[a],r[a]));else if(typeof n==`object`){let i={};for(let a in n)i[a]=de(e,t[a],n[a],r[a]);return i}else throw Error(`Cannot spring ${typeof n} values`)}var Y=class e{#e=F(.15);#t=F(.8);#n=F(.01);#r;#i;#a=void 0;#o=0;#s=1;#c=0;#l=null;#u=null;constructor(e,t={}){this.#r=F(e),this.#i=F(e),typeof t.stiffness==`number`&&(this.#e.v=fe(t.stiffness,0,1)),typeof t.damping==`number`&&(this.#t.v=fe(t.damping,0,1)),typeof t.precision==`number`&&(this.#n.v=t.precision)}static of(t,n){let r=new e(t(),n);return h(()=>{r.set(t())}),r}#d(e){if(M(this.#i,e),this.#r.v??=e,this.#a??=this.#r.v,!this.#l){this.#o=x.now();var t=1e3/(this.#c*60);this.#l??=V(e=>{this.#s=Math.min(this.#s+t,1);let n=Math.min(e-this.#o,1e3/30),r={inv_mass:this.#s,opts:{stiffness:this.#e.v,damping:this.#t.v,precision:this.#n.v},settled:!0,dt:n*60/1e3};var i=de(r,this.#a,this.#r.v,this.#i.v);return this.#a=this.#r.v,this.#o=e,M(this.#r,i),r.settled&&(this.#l=null),!r.settled})}return this.#l.promise}set(e,t){if(this.#u?.reject(Error(`Aborted`)),t?.instant||this.#r.v===void 0)return this.#l?.abort(),this.#l=null,M(this.#r,M(this.#i,e)),this.#a=e,Promise.resolve();t?.preserveMomentum&&(this.#s=0,this.#c=t.preserveMomentum);var n=this.#u=T();return n.promise.catch(v),this.#d(e).then(()=>{n===this.#u&&n.resolve(void 0)}),n.promise}get current(){return c(this.#r)}get damping(){return c(this.#t)}set damping(e){M(this.#t,fe(e,0,1))}get precision(){return c(this.#n)}set precision(e){M(this.#n,e)}get stiffness(){return c(this.#e)}set stiffness(e){M(this.#e,fe(e,0,1))}get target(){return c(this.#i)}set target(e){this.set(e)}};function fe(e,t,n){return Math.max(t,Math.min(n,e))}function pe(e){let t=e-1;return t*t*t+1}function me(e,{delay:t=0,duration:n=400,easing:r=pe,axis:i=`y`}={}){let a=getComputedStyle(e),o=+a.opacity,s=i===`y`?`height`:`width`,c=parseFloat(a[s]),l=i===`y`?[`top`,`bottom`]:[`left`,`right`],u=l.map(e=>`${e[0].toUpperCase()}${e.slice(1)}`),d=parseFloat(a[`padding${u[0]}`]),f=parseFloat(a[`padding${u[1]}`]),p=parseFloat(a[`margin${u[0]}`]),m=parseFloat(a[`margin${u[1]}`]),h=parseFloat(a[`border${u[0]}Width`]),g=parseFloat(a[`border${u[1]}Width`]);return{delay:t,duration:n,easing:r,css:e=>`overflow: hidden;opacity: ${Math.min(e*20,1)*o};${s}: ${e*c}px;padding-${l[0]}: ${e*d}px;padding-${l[1]}: ${e*f}px;margin-${l[0]}: ${e*p}px;margin-${l[1]}: ${e*m}px;border-${l[0]}-width: ${e*h}px;border-${l[1]}-width: ${e*g}px;min-${s}: 0`}}var he=`M6 9l6 6 6-6`,ge=`M20 6 9 17l-5-5`,_e=[`M3 6h18`,`M8 6V4h8v2`,`M6 6l1 14h10l1-14`,`M10 11v5`,`M14 11v5`],ve=[`M5 5h9v9H5z`,`M8 2h9v9`,`M17 14v6`,`M14 17h6`,`M8 9h3`],ye={board:`M9 4h6l1 2h2v15H6V6h2z`,sparkle:`M17.5 3l.8 1.7L20 5.5l-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8z`,body:`M9 4h6M9 10h6M9 14h5`},X={path:`M5 5h14v14H5z`,circles:[{cx:9,cy:9,r:1.25},{cx:15,cy:9,r:1.25},{cx:9,cy:15,r:1.25}]},be=t(`<div class="dialkit-panel-inner dialkit-panel-inline"><div class="dialkit-folder dialkit-folder-root"><div class="dialkit-folder-header dialkit-panel-header"><div class="dialkit-folder-header-top"><div class="dialkit-folder-title-row"><span class="dialkit-folder-title dialkit-folder-title-root"> </span></div></div> <div class="dialkit-panel-toolbar"><!></div></div> <div class="dialkit-folder-content"><div class="dialkit-folder-inner"><!></div></div></div></div>`),xe=t(`<div class="dialkit-folder-title-row"><span class="dialkit-folder-title dialkit-folder-title-root"> </span></div>`),Se=t(`<div class="dialkit-panel-toolbar"><!></div>`),Z=t(`<div class="dialkit-folder-content"><div class="dialkit-folder-inner"><!></div></div>`),Ce=t(`<div class="dialkit-panel-inner"><div class="dialkit-folder dialkit-folder-root"><div class="dialkit-folder-header dialkit-panel-header"><div class="dialkit-folder-header-top"><!> <svg class="dialkit-panel-icon" viewBox="0 0 16 16" fill="none"><path opacity="0.5" fill="currentColor"></path><circle fill="currentColor" stroke="currentColor" stroke-width="1.25"></circle><circle fill="currentColor" stroke="currentColor" stroke-width="1.25"></circle><circle fill="currentColor" stroke="currentColor" stroke-width="1.25"></circle></svg></div> <!></div> <!></div></div>`),we=t(`<div class="dialkit-folder-content" style="clip-path: inset(0 -20px);"><div class="dialkit-folder-inner"><!></div></div>`),Te=t(`<div class="dialkit-folder"><div class="dialkit-folder-header"><div class="dialkit-folder-header-top"><div class="dialkit-folder-title-row"><span class="dialkit-folder-title"> </span></div> <svg class="dialkit-folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path></path></svg></div></div> <!></div>`);function Q(t,o){k(o,!0);let l=y(o,`defaultOpen`,3,!0),m=y(o,`isRoot`,3,!1),h=y(o,`inline`,3,!1),v=F(e(l())),x=F(!l()),C=F(void 0),T,E,D=F(e(typeof window<`u`?window.innerHeight:800));s(()=>{if(!m())return;let e=()=>{M(D,window.innerHeight,!0)};return window.addEventListener(`resize`,e),()=>window.removeEventListener(`resize`,e)});let N=new Y(l()?0:180,{stiffness:.2,damping:.6}),P=new Y(l()?280:42,{stiffness:.2,damping:.62}),L=new Y(l()?220:42,{stiffness:.2,damping:.62}),R=new Y(l()?14:21,{stiffness:.2,damping:.62}),B=new Y(1,{stiffness:.25,damping:.7});s(()=>{if(!m()||!T||typeof ResizeObserver>`u`)return;let e=new ResizeObserver(()=>{if(!c(v))return;let e=T?.offsetHeight;e&&M(C,e,!0)});return e.observe(T),T.offsetHeight>0&&M(C,T.offsetHeight,!0),()=>{e.disconnect()}}),s(()=>{m()||N.set(c(v)?0:180)}),s(()=>{if(!m())return;let e=c(C)??E?.getBoundingClientRect().height??42,t=c(v)?Math.min(e+10,c(D)-32):42;P.set(c(v)?280:42),L.set(t),R.set(c(v)?14:21)});let V=()=>{if(h()&&m())return;let e=!c(v);M(v,e),M(x,!e),o.onOpenChange?.(e)},H=()=>{c(v)||(document.activeElement?.blur?.(),B.set(.9))},U=()=>{c(v)||B.set(1)},W=b(()=>`width:${P.current}px;height:${L.current}px;border-radius:${R.current}px;box-shadow:${c(v)?`var(--dial-shadow)`:`var(--dial-shadow-collapsed)`};cursor:${c(v)?``:`pointer`};overflow:${c(v)?`hidden auto`:`hidden`};transform:scale(${B.current});`);var G=O(),K=_(G),q=e=>{var t=be(),i=g(t),s=g(i),c=g(s),l=g(c),m=g(l),h=g(m,!0);j(m),j(l),j(c);var v=f(c,2),y=g(v),b=e=>{var t=O();p(_(t),()=>o.toolbar),u(e,t)};r(y,e=>{o.toolbar&&e(b)}),j(v),j(s);var x=f(s,2),S=g(x),C=g(S),w=e=>{var t=O();p(_(t),()=>o.children),u(e,t)};r(C,e=>{o.children&&e(w)}),j(S),j(x),j(i),I(i,e=>T=e,()=>T),j(t),a(()=>n(h,o.title)),d(`click`,s,e=>{e.stopPropagation(),V()}),d(`click`,v,e=>e.stopPropagation()),u(e,t)},J=e=>{var t=Ce(),s=g(t),l=g(s),m=g(l),h=g(m),y=e=>{var t=xe(),r=g(t),i=g(r,!0);j(r),j(t),a(()=>n(i,o.title)),u(e,t)};r(h,e=>{c(v)&&e(y)});var b=f(h,2),S=g(b),C=f(S),D=f(C),k=f(D);j(b),j(m);var M=f(m,2),N=e=>{var t=Se(),n=g(t),i=e=>{var t=O();p(_(t),()=>o.toolbar),u(e,t)};r(n,e=>{o.toolbar&&e(i)}),j(t),d(`click`,t,e=>e.stopPropagation()),u(e,t)};r(M,e=>{c(v)&&e(N)}),j(l);var P=f(l,2),F=e=>{var t=Z(),n=g(t),i=g(n),a=e=>{var t=O();p(_(t),()=>o.children),u(e,t)};r(i,e=>{o.children&&e(a)}),j(n),j(t),u(e,t)};r(P,e=>{c(v)&&e(F)}),j(s),I(s,e=>T=e,()=>T),j(t),I(t,e=>E=e,()=>E),a(e=>{w(t,`data-collapsed`,e),A(t,c(W)),w(S,`d`,X.path),w(C,`cx`,X.circles[0].cx),w(C,`cy`,X.circles[0].cy),w(C,`r`,X.circles[0].r),w(D,`cx`,X.circles[1].cx),w(D,`cy`,X.circles[1].cy),w(D,`r`,X.circles[1].r),w(k,`cx`,X.circles[2].cx),w(k,`cy`,X.circles[2].cy),w(k,`r`,X.circles[2].r)},[()=>String(c(x))]),d(`pointerdown`,t,H),d(`pointerup`,t,U),i(`pointercancel`,t,U),i(`pointerleave`,t,U),d(`click`,t,()=>{c(v)||V()}),d(`click`,l,e=>{e.stopPropagation(),V()}),u(e,t)},ee=e=>{var t=Te(),i=g(t),s=g(i),l=g(s),m=g(l),h=g(m,!0);j(m),j(l);var y=f(l,2);let b;var x=g(y);j(y),j(s),j(i);var S=f(i,2),C=e=>{var t=we(),n=g(t),i=g(n),a=e=>{var t=O();p(_(t),()=>o.children),u(e,t)};r(i,e=>{o.children&&e(a)}),j(n),j(t),z(3,t,()=>me,()=>({duration:220})),u(e,t)};r(S,e=>{c(v)&&e(C)}),j(t),a(()=>{n(h,o.title),b=A(y,``,b,{transform:`rotate(${N.current}deg)`}),w(x,`d`,he)}),d(`click`,i,V),u(e,t)};r(K,e=>{m()&&h()?e(q):m()?e(J,1):e(ee,-1)}),u(t,G),S()}l([`click`,`pointerdown`,`pointerup`]);function Ee(e,t){let n=t?.above??!1,r=t?.duration??150,i=n?8:-8;return{duration:r,css:e=>{let t=e;return`opacity:${t};transform:translateY(${(1-t)*i}px) scale(${.95+.05*t});`}}}var De=t(`<div class="dialkit-preset-item"><span class="dialkit-preset-name"> </span> <button class="dialkit-preset-delete" title="Delete preset"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path></path><path></path><path></path><path></path><path></path></svg></button></div>`),Oe=t(`<div class="dialkit-root dialkit-preset-dropdown"><div class="dialkit-preset-item"><span class="dialkit-preset-name">Version 1</span></div> <!></div>`),ke=t(`<div class="dialkit-preset-manager"><button class="dialkit-preset-trigger"><span class="dialkit-preset-label"> </span> <svg class="dialkit-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path></path></svg></button> <!></div>`);function Ae(t,i){k(i,!0);let o=F(!1),l=F(e({top:0,left:0,width:0})),p=F(null),m,h,v=new Y(0,{stiffness:.2,damping:.6}),y=new Y(.25,{stiffness:.2,damping:.6}),x=b(()=>i.presets.length>0),C=b(()=>i.presets.find(e=>e.id===i.activePresetId)),T=()=>{let e=m?.getBoundingClientRect();e&&M(l,{top:e.bottom+4,left:e.left,width:e.width},!0)},E=()=>{c(x)&&(T(),M(o,!0))},D=()=>{M(o,!1)};s(()=>{typeof document>`u`||!m||M(p,m.closest(`.dialkit-root`)??document.body,!0)}),s(()=>{v.set(c(o)?180:0),y.set(c(x)?.6:.25)}),s(()=>{if(!c(o)||typeof window>`u`)return;let e=()=>T(),t=e=>{let t=e.target;m?.contains(t)||h?.contains(t)||D()};return T(),document.addEventListener(`mousedown`,t),window.addEventListener(`resize`,e),window.addEventListener(`scroll`,e,!0),()=>{document.removeEventListener(`mousedown`,t),window.removeEventListener(`resize`,e),window.removeEventListener(`scroll`,e,!0)}});let N=e=>{e?W.loadPreset(i.panelId,e):W.clearActivePreset(i.panelId),D()},P=(e,t)=>{e.stopPropagation(),W.deletePreset(i.panelId,t)};var L=ke(),R=g(L),V=g(R),H=g(V,!0);j(V);var U=f(V,2);let G;var K=g(U);j(U),j(R),I(R,e=>m=e,()=>m);var q=f(R,2),J=e=>{le(e,{get target(){return c(p)},children:(e,t)=>{var s=O(),p=_(s),m=e=>{var t=Oe(),r=g(t);B(f(r,2),17,()=>i.presets,e=>e.id,(e,t)=>{var r=De(),o=g(r),s=g(o,!0);j(o);var l=f(o,2),p=g(l),m=g(p),h=f(m),_=f(h),v=f(_),y=f(v);j(p),j(l),j(r),a(e=>{w(r,`data-active`,e),n(s,c(t).name),w(m,`d`,_e[0]),w(h,`d`,_e[1]),w(_,`d`,_e[2]),w(v,`d`,_e[3]),w(y,`d`,_e[4])},[()=>String(c(t).id===i.activePresetId)]),d(`click`,r,()=>N(c(t).id)),d(`click`,l,e=>P(e,c(t).id)),u(e,r)}),j(t),I(t,e=>h=e,()=>h),a(e=>{A(t,`position:fixed;top:${c(l).top}px;left:${c(l).left}px;min-width:${c(l).width}px;`),w(r,`data-active`,e)},[()=>String(!i.activePresetId)]),d(`click`,r,()=>N(null)),z(3,t,()=>Ee,()=>({above:!1})),u(e,t)};r(p,e=>{c(o)&&e(m)}),u(e,s)},$$slots:{default:!0}})};r(q,e=>{c(p)&&e(J)}),j(L),a((e,t,r)=>{w(R,`data-open`,e),w(R,`data-has-preset`,t),w(R,`data-disabled`,r),n(H,c(C)?c(C).name:`Version 1`),G=A(U,``,G,{transform:`rotate(${v.current}deg)`,opacity:y.current}),w(K,`d`,he)},[()=>String(c(o)),()=>String(!!c(C)),()=>String(!c(x))]),d(`click`,R,()=>c(o)?D():E()),u(t,L),S()}l([`click`]);function je(e=1){if(!Number.isFinite(e))return 0;let t=String(e);return t.includes(`e-`)?Number(t.split(`e-`)[1]??0):t.includes(`.`)?t.split(`.`)[1].length:0}function Me(e,t=1){let n=je(t);return Number(e.toFixed(n))}function Ne(e,t,n){let r=n-t;if(!Number.isFinite(r)||r<=0)return e;let i=r/10;return t+Math.round((e-t)/i)*i}function Pe(e){return Ve(e)}function Fe(e){return Ve(e)}function Ie(e,t){let n=e.step??1;return t?.mode===`fine`?n/10:t?.mode===`coarse`?n*10:n}function Le(e,t,n,r,i){let a=Number(W.getValue(e,t)??0),o=n.min??-1/0,s=n.max??1/0,c=Math.max(o,Math.min(s,Me(a+r*i,n.step??r)));W.updateValue(e,t,c)}function Re(e,t){for(let n of e){if(n.path===t)return n;if(n.children){let e=Re(n.children,t);if(e)return e}}return null}function ze(){let e=document.activeElement;if(!e)return!1;let t=e.tagName.toLowerCase();return t===`input`||t===`textarea`||e.getAttribute(`contenteditable`)===`true`}function Be(e){if(e.altKey)return`alt`;if(e.shiftKey)return`shift`;if(e.metaKey)return`meta`}function Ve(e){let t=[];return e.modifier&&t.push(e.modifier),e.key&&t.push(e.key),t.join(`+`).toUpperCase()}var He=t(`<div class="dialkit-slider-hashmark"></div>`),Ue=t(`<span> </span>`),We=t(`<input type="text" class="dialkit-slider-input"/>`),Ge=t(`<div class="dialkit-slider-wrapper"><div><div class="dialkit-slider-hashmarks"></div> <div class="dialkit-slider-fill"></div> <div class="dialkit-slider-handle"></div> <span class="dialkit-slider-label"> <!></span> <!></div></div>`);function $(e,t){k(t,!0);let o=y(t,`min`,3,0),l=y(t,`max`,3,1),p=y(t,`step`,3,.01),m=y(t,`shortcutActive`,3,!1),h,_,v,x,w=F(!1),T=F(!1),D=F(!1),O=F(!1),P=F(!1),L=F(!1),R=F(``),z=new Y((t.value-o())/(l()-o())*100,{stiffness:.25,damping:.7}),V=new Y(0,{stiffness:.2,damping:.65}),U=new Y(0,{stiffness:.3,damping:.75}),W=new Y(.25,{stiffness:.2,damping:.6}),G=new Y(1,{stiffness:.2,damping:.6}),K=null,q=!0,J=null,ee=1,te=null,ne=e=>(e-o())/(l()-o())*100,re=e=>{if(!J||!h)return t.value;let n=(e-J.left)/ee,r=h.offsetWidth||J.width,i=Math.max(0,Math.min(1,n/r)),a=o()+i*(l()-o());return Math.max(o(),Math.min(l(),a))},ie=(e,t)=>{if(!J)return 0;let n=t<0?J.left-e:e-J.right,r=Math.max(0,n-32);return t*8*Math.sqrt(Math.min(r/200,1))};s(()=>{t.value,c(w)||z.set((t.value-o())/(l()-o())*100,{instant:!0})}),s(()=>(te&&=(clearTimeout(te),null),c(O)&&!c(L)&&!c(P)?te=setTimeout(()=>{M(P,!0)},800):!c(O)&&!c(L)&&M(P,!1),()=>{te&&=(clearTimeout(te),null)})),s(()=>{c(L)&&H().then(()=>{x?.focus(),x?.select()})});let ae=b(()=>(t.value-o())/(l()-o())*100),oe=b(()=>c(w)||c(D)),se=b(()=>{let e=h?.offsetWidth;return e&&_?(10+_.offsetWidth+8)/e*100:30}),ce=b(()=>{let e=h?.offsetWidth;return e&&v?(e-10-v.offsetWidth-8)/e*100:78}),le=b(()=>c(ae)<c(se)||c(ae)>c(ce)),ue=b(()=>c(oe)?c(le)?.1:c(T)?.9:.5:0);s(()=>{U.set(c(ue)),W.set(c(oe)?1:.25),G.set(c(oe)&&c(le)?.75:1)});let de=b(()=>(l()-o())/p()),fe=b(()=>c(de)<=10?Array.from({length:Math.max(c(de)-1,0)},(e,t)=>({key:`d-${t+1}`,left:(t+1)*p()/(l()-o())*100})):Array.from({length:9},(e,t)=>({key:`t-${t+1}`,left:(t+1)*10}))),pe=e=>{c(L)||(e.preventDefault(),e.currentTarget.setPointerCapture(e.pointerId),K={x:e.clientX,y:e.clientY},q=!0,M(w,!0),h&&(J=h.getBoundingClientRect(),ee=J.width/h.offsetWidth))},me=e=>{if(!c(w)||!K)return;let n=e.clientX-K.x,r=e.clientY-K.y,i=Math.sqrt(n*n+r*r);if(q&&i>3&&(q=!1,M(T,!0)),!q){J&&(e.clientX<J.left?V.set(ie(e.clientX,-1),{instant:!0}):e.clientX>J.right?V.set(ie(e.clientX,1),{instant:!0}):V.set(0,{instant:!0}));let n=re(e.clientX);z.set(ne(n),{instant:!0}),t.onChange(Me(n,p()))}},he=e=>{if(c(w)){if(q){let n=re(e.clientX),r=(l()-o())/p()<=10?Math.max(o(),Math.min(l(),o()+Math.round((n-o())/p())*p())):Ne(n,o(),l());z.set(ne(r)),t.onChange(Me(r,p()))}V.current!==0&&V.set(0),M(w,!1),M(T,!1),K=null}},ge=()=>{c(w)&&(M(w,!1),M(T,!1),V.set(0,{instant:!0}),K=null)},_e=()=>{let e=Number.parseFloat(c(R));if(!Number.isNaN(e)){let n=Math.max(o(),Math.min(l(),e));t.onChange(Me(n,p()))}M(L,!1),M(O,!1),M(P,!1)},ve=e=>{c(P)&&(e.stopPropagation(),e.preventDefault(),M(L,!0),M(R,t.value.toFixed(je(p())),!0))},ye=b(()=>t.value.toFixed(je(p()))),X=b(()=>`width:calc(100% + ${Math.abs(V.current)}px);transform:translateX(${V.current<0?V.current:0}px);`),be=b(()=>`width:${z.current}%;`),xe=b(()=>`left:max(5px, calc(${z.current}% - 9px));opacity:${U.current};transform:translateY(-50%) scaleX(${W.current}) scaleY(${G.current});`);var Se=Ge(),Z=g(Se),Ce=g(Z);B(Ce,21,()=>c(fe),e=>e.key,(e,t)=>{var n=He();let r;a(()=>r=A(n,``,r,{left:`${c(t).left}%`})),u(e,n)}),j(Ce);var we=f(Ce,2),Te=f(we,2),Q=f(Te,2),Ee=g(Q),De=f(Ee),Oe=e=>{var r=Ue(),i=g(r,!0);j(r),a(e=>{E(r,1,`dialkit-shortcut-pill${m()?` dialkit-shortcut-pill-active`:``}`),n(i,e)},[()=>Pe(t.shortcut)]),u(e,r)};r(De,e=>{t.shortcut&&e(Oe)}),j(Q),I(Q,e=>_=e,()=>_);var ke=f(Q,2),Ae=e=>{var t=We();C(t),I(t,e=>x=e,()=>x),a(()=>N(t,c(R))),d(`input`,t,e=>M(R,e.currentTarget.value,!0)),d(`keydown`,t,e=>{e.key===`Enter`?_e():e.key===`Escape`&&(M(L,!1),M(O,!1))}),i(`blur`,t,_e),d(`click`,t,e=>e.stopPropagation()),d(`mousedown`,t,e=>e.stopPropagation()),u(e,t)},Fe=e=>{var t=Ue();let r;var o=g(t,!0);j(t),I(t,e=>v=e,()=>v),a(()=>{E(t,1,`dialkit-slider-value ${c(P)?`dialkit-slider-value-editable`:``}`),r=A(t,``,r,{cursor:c(P)?`text`:`default`}),n(o,c(ye))}),i(`mouseenter`,t,()=>M(O,!0)),i(`mouseleave`,t,()=>M(O,!1)),d(`click`,t,ve),d(`mousedown`,t,e=>c(P)&&e.stopPropagation()),u(e,t)};r(ke,e=>{c(L)?e(Ae):e(Fe,-1)}),j(Z),j(Se),I(Se,e=>h=e,()=>h),a(()=>{E(Z,1,`dialkit-slider ${c(oe)?`dialkit-slider-active`:``}`),A(Z,c(X)),A(we,c(be)),A(Te,c(xe)),n(Ee,`${t.label??``} `)}),d(`pointerdown`,Z,pe),d(`pointermove`,Z,me),d(`pointerup`,Z,he),i(`pointercancel`,Z,ge),i(`mouseenter`,Z,()=>M(D,!0)),i(`mouseleave`,Z,()=>M(D,!1)),u(e,Se),S()}l([`pointerdown`,`pointermove`,`pointerup`,`input`,`keydown`,`click`,`mousedown`]);var Ke=t(`<div class="dialkit-segmented-pill"></div>`),qe=t(`<button class="dialkit-segmented-button"> </button>`),Je=t(`<div class="dialkit-segmented"><!> <!></div>`);function Ye(e,t){k(t,!0);let i=F(void 0),o=!1,l=F(null),p=F(null);function m(){if(!c(i))return;let e=c(i).querySelector(`[data-active="true"]`);e&&(M(l,e.offsetLeft,!0),M(p,e.offsetWidth,!0))}s(()=>{t.value,t.options.length,m()});let h=b(()=>o?!0:(o=!0,!1));var _=Je(),v=g(_),y=e=>{var t=Ke();let n;a(()=>n=A(t,``,n,{left:`${c(l)??``}px`,width:`${c(p)??``}px`,transition:c(h)?`left 0.2s cubic-bezier(0.25, 1, 0.5, 1), width 0.2s cubic-bezier(0.25, 1, 0.5, 1)`:`none`})),u(e,t)};r(v,e=>{c(l)!==null&&c(p)!==null&&e(y)}),B(f(v,2),17,()=>t.options,e=>e.value,(e,r)=>{var i=qe(),o=g(i,!0);j(i),a(e=>{w(i,`data-active`,e),n(o,c(r).label)},[()=>String(t.value===c(r).value)]),d(`click`,i,()=>t.onChange(c(r).value)),u(e,i)}),j(_),I(_,e=>M(i,e),()=>c(i)),u(e,_),S()}l([`click`]);var Xe=t(`<span> </span>`),Ze=t(`<div class="dialkit-labeled-control"><span class="dialkit-labeled-control-label"> <!></span> <!></div>`);function Qe(e,t){k(t,!0);let i=y(t,`shortcutActive`,3,!1);var o=Ze(),s=g(o),l=g(s),d=f(l),p=e=>{var r=Xe(),o=g(r,!0);j(r),a(e=>{E(r,1,`dialkit-shortcut-pill${i()?` dialkit-shortcut-pill-active`:``}`),n(o,e)},[()=>Fe(t.shortcut)]),u(e,r)};r(d,e=>{t.shortcut&&e(p)}),j(s);var m=f(s,2);{let e=b(()=>t.checked?`on`:`off`);Ye(m,{options:[{value:`off`,label:`Off`},{value:`on`,label:`On`}],get value(){return c(e)},onChange:e=>t.onChange(e===`on`)})}j(o),a(()=>n(l,`${t.label??``} `)),u(e,o),S()}var $e=D(`<line stroke="rgba(255, 255, 255, 0.08)" stroke-width="1"></line>`),et=D(`<svg class="dialkit-spring-viz"><!><line stroke="rgba(255, 255, 255, 0.15)" stroke-width="1" stroke-dasharray="4,4"></line><path fill="none" stroke="rgba(255, 255, 255, 0.6)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`);function tt(e,t){k(t,!0);function n(e,t,n,r){let i=[],a=r/100,o=0,s=0;for(let r=0;r<=100;r++){let c=r*a;i.push([c,o]);let l=(-e*(o-1)+-t*s)/n;s+=l*a,o+=s*a}return i}let r=b(()=>{let e,r,i;if(t.isSimpleMode){let n=t.spring.visualDuration??.3,a=t.spring.bounce??.2;i=1,e=(2*Math.PI/n)**2,r=2*(1-a)*Math.sqrt(e*i)}else e=t.spring.stiffness??400,r=t.spring.damping??17,i=t.spring.mass??1;let a=n(e,r,i,2),o=a.map(([,e])=>e),s=Math.min(...o),c=Math.max(...o)-s;return a.map(([e,t],n)=>{let r=e/2*256,i=140-((t-s)/(c||1)*140*.6+140*.2);return`${n===0?`M`:`L`} ${r} ${i}`}).join(` `)}),i=b(()=>{let e=[];for(let t=1;t<4;t++){let n=256/4*t,r=140/4*t;e.push({x1:n,y1:0,x2:n,y2:140}),e.push({x1:0,y1:r,x2:256,y2:r})}return e});var o=et();w(o,`viewBox`,`0 0 256 140`);var s=g(o);B(s,17,()=>c(i),m,(e,t)=>{var n=$e();a(()=>{w(n,`x1`,c(t).x1),w(n,`y1`,c(t).y1),w(n,`x2`,c(t).x2),w(n,`y2`,c(t).y2)}),u(e,n)});var l=f(s);w(l,`x1`,0),w(l,`y1`,140/2),w(l,`x2`,256),w(l,`y2`,140/2);var d=f(l);j(o),a(()=>w(d,`d`,c(r))),u(e,o),S()}var nt=t(`<!> <!>`,1),rt=t(`<!> <!> <!>`,1),it=t(`<div style="display: flex; flex-direction: column; gap: 6px;"><!> <div class="dialkit-labeled-control"><span class="dialkit-labeled-control-label">Type</span> <!></div> <!></div>`);function at(t,n){k(n,!0);let i=F(e(W.getSpringMode(n.panelId,n.path)));s(()=>W.subscribe(n.panelId,()=>{M(i,W.getSpringMode(n.panelId,n.path),!0)}));let a=b(()=>c(i)===`simple`),o={simple:n.spring.visualDuration===void 0?{type:`spring`,visualDuration:.3,bounce:.2}:n.spring,advanced:n.spring.stiffness===void 0?{type:`spring`,stiffness:200,damping:25,mass:1}:n.spring},l=e=>{let t=e;c(a)?o.simple=n.spring:o.advanced=n.spring,W.updateSpringMode(n.panelId,n.path,t),t===`simple`?n.onChange(o.simple):n.onChange(o.advanced)},d=(e,t)=>{if(c(a)){let{stiffness:r,damping:i,mass:a,...o}=n.spring;n.onChange({...o,[e]:t})}else{let{visualDuration:r,bounce:i,...a}=n.spring;n.onChange({...a,[e]:t})}};Q(t,{get title(){return n.label},defaultOpen:!0,children:(e,t)=>{var o=it(),s=g(o);tt(s,{get spring(){return n.spring},get isSimpleMode(){return c(a)}});var p=f(s,2);Ye(f(g(p),2),{options:[{value:`simple`,label:`Time`},{value:`advanced`,label:`Physics`}],get value(){return c(i)},onChange:l}),j(p);var m=f(p,2),h=e=>{var t=nt(),r=_(t);{let e=b(()=>n.spring.visualDuration??.3);$(r,{label:`Duration`,get value(){return c(e)},onChange:e=>d(`visualDuration`,e),min:.1,max:1,step:.05,unit:`s`})}var i=f(r,2);{let e=b(()=>n.spring.bounce??.2);$(i,{label:`Bounce`,get value(){return c(e)},onChange:e=>d(`bounce`,e),min:0,max:1,step:.05})}u(e,t)},v=e=>{var t=rt(),r=_(t);{let e=b(()=>n.spring.stiffness??400);$(r,{label:`Stiffness`,get value(){return c(e)},onChange:e=>d(`stiffness`,e),min:1,max:1e3,step:10})}var i=f(r,2);{let e=b(()=>n.spring.damping??17);$(i,{label:`Damping`,get value(){return c(e)},onChange:e=>d(`damping`,e),min:1,max:100,step:1})}var a=f(i,2);{let e=b(()=>n.spring.mass??1);$(a,{label:`Mass`,get value(){return c(e)},onChange:e=>d(`mass`,e),min:.1,max:10,step:.1})}u(e,t)};r(m,e=>{c(a)?e(h):e(v,-1)}),j(o),u(e,o)},$$slots:{default:!0}}),S()}var ot=D(`<svg preserveAspectRatio="xMidYMid slice" class="dialkit-spring-viz dialkit-easing-viz"><line stroke="rgba(255, 255, 255, 0.15)" stroke-width="1" stroke-dasharray="4,4"></line><path fill="none" stroke="rgba(255, 255, 255, 0.6)" stroke-width="2" stroke-linecap="round"></path></svg>`);function st(e,t){k(t,!0);let n={linear:[0,0,1,1],easeIn:[.42,0,1,1],easeOut:[0,0,.58,1],easeInOut:[.42,0,.58,1]},r=(e,t)=>({x:10+(e+.5)*90,y:10+(1.5-t)*90}),i=b(()=>{let e=t.easing.ease,n=r(0,0),i=r(1,1),a=r(e[0],e[1]),o=r(e[2],e[3]);return{start:n,end:i,curvePath:`M ${n.x} ${n.y} C ${a.x} ${a.y}, ${o.x} ${o.y}, ${i.x} ${i.y}`}});var o={easingPresets:n},s=ot();w(s,`viewBox`,`0 0 200 200`);var l=g(s),d=f(l);return j(s),a(()=>{w(l,`x1`,c(i).start.x),w(l,`y1`,c(i).start.y),w(l,`x2`,c(i).end.x),w(l,`y2`,c(i).end.y),w(d,`d`,c(i).curvePath)}),u(e,s),S(o)}var ct=t(`<!> <!> <!> <!> <!> <div class="dialkit-labeled-control"><span class="dialkit-labeled-control-label">Ease</span> <input type="text" class="dialkit-text-input"/></div>`,1),lt=t(`<!> <!>`,1),ut=t(`<!> <!> <!>`,1),dt=t(`<div style="display: flex; flex-direction: column; gap: 6px;"><!> <div class="dialkit-labeled-control"><span class="dialkit-labeled-control-label">Type</span> <!></div> <!></div>`);function ft(t,n){k(n,!0);let o=F(e(W.getTransitionMode(n.panelId,n.path))),l=F(!1),p=F(``);s(()=>W.subscribe(n.panelId,()=>{M(o,W.getTransitionMode(n.panelId,n.path),!0)}));let m=b(()=>c(o)===`easing`),h=b(()=>c(o)===`simple`),v={easing:n.value.type===`easing`?n.value:{type:`easing`,duration:.3,ease:[1,-.4,.5,1]},simple:n.value.type===`spring`&&n.value.visualDuration!==void 0?n.value:{type:`spring`,visualDuration:.3,bounce:.2},advanced:n.value.type===`spring`&&n.value.stiffness!==void 0?n.value:{type:`spring`,stiffness:200,damping:25,mass:1}},y=b(()=>n.value.type===`spring`?n.value:v.simple),x=b(()=>n.value.type===`easing`?n.value:v.easing);s(()=>{c(m)&&n.value.type===`easing`?v.easing=n.value:c(h)&&n.value.type===`spring`?v.simple=n.value:c(o)===`advanced`&&n.value.type===`spring`&&(v.advanced=n.value)});let T=e=>e.map(e=>Number(e.toFixed(2))).join(`, `),E=e=>{let t=e.split(`,`).map(e=>Number.parseFloat(e.trim()));return t.length!==4||t.some(e=>Number.isNaN(e))?null:t},D=e=>{let t=e;W.updateTransitionMode(n.panelId,n.path,t),t===`easing`?n.onChange(v.easing):t===`simple`?n.onChange(v.simple):n.onChange(v.advanced)},O=(e,t)=>{if(c(h)){let{stiffness:r,damping:i,mass:a,...o}=c(y);n.onChange({...o,[e]:t})}else{let{visualDuration:r,bounce:i,...a}=c(y);n.onChange({...a,[e]:t})}},A=(e,t)=>{let r=[...c(x).ease];r[e]=t,n.onChange({...c(x),ease:r})},P=()=>{M(p,T(c(x).ease),!0),M(l,!0)},I=()=>{let e=E(c(p));e&&n.onChange({...c(x),ease:e}),M(l,!1)};Q(t,{get title(){return n.label},defaultOpen:!0,children:(e,t)=>{var s=dt(),v=g(s),S=e=>{st(e,{get easing(){return c(x)}})},E=e=>{tt(e,{get spring(){return c(y)},get isSimpleMode(){return c(h)}})};r(v,e=>{c(m)?e(S):e(E,-1)});var k=f(v,2);Ye(f(g(k),2),{options:[{value:`easing`,label:`Easing`},{value:`simple`,label:`Time`},{value:`advanced`,label:`Physics`}],get value(){return c(o)},onChange:D}),j(k);var F=f(k,2),L=e=>{var t=ct(),r=_(t);$(r,{label:`x1`,get value(){return c(x).ease[0]},onChange:e=>A(0,e),min:0,max:1,step:.01});var o=f(r,2);$(o,{label:`y1`,get value(){return c(x).ease[1]},onChange:e=>A(1,e),min:-1,max:2,step:.01});var s=f(o,2);$(s,{label:`x2`,get value(){return c(x).ease[2]},onChange:e=>A(2,e),min:0,max:1,step:.01});var m=f(s,2);$(m,{label:`y2`,get value(){return c(x).ease[3]},onChange:e=>A(3,e),min:-1,max:2,step:.01});var h=f(m,2);$(h,{label:`Duration`,get value(){return c(x).duration},onChange:e=>n.onChange({...c(x),duration:e}),min:.1,max:2,step:.05,unit:`s`});var v=f(h,2),y=f(g(v),2);C(y),w(y,`spellcheck`,!1),j(v),a(e=>N(y,e),[()=>c(l)?c(p):T(c(x).ease)]),d(`input`,y,e=>M(p,e.currentTarget.value,!0)),i(`focus`,y,P),i(`blur`,y,I),d(`keydown`,y,e=>{e.key===`Enter`&&e.currentTarget.blur()}),u(e,t)},R=e=>{var t=lt(),n=_(t);{let e=b(()=>c(y).visualDuration??.3);$(n,{label:`Duration`,get value(){return c(e)},onChange:e=>O(`visualDuration`,e),min:.1,max:1,step:.05,unit:`s`})}var r=f(n,2);{let e=b(()=>c(y).bounce??.2);$(r,{label:`Bounce`,get value(){return c(e)},onChange:e=>O(`bounce`,e),min:0,max:1,step:.05})}u(e,t)},z=e=>{var t=ut(),n=_(t);{let e=b(()=>c(y).stiffness??400);$(n,{label:`Stiffness`,get value(){return c(e)},onChange:e=>O(`stiffness`,e),min:1,max:1e3,step:10})}var r=f(n,2);{let e=b(()=>c(y).damping??17);$(r,{label:`Damping`,get value(){return c(e)},onChange:e=>O(`damping`,e),min:1,max:100,step:1})}var i=f(r,2);{let e=b(()=>c(y).mass??1);$(i,{label:`Mass`,get value(){return c(e)},onChange:e=>O(`mass`,e),min:.1,max:10,step:.1})}u(e,t)};r(F,e=>{c(m)?e(L):c(h)?e(R,1):e(z,-1)}),j(s),u(e,s)},$$slots:{default:!0}}),S()}l([`input`,`keydown`]);var pt=t(`<div class="dialkit-text-control"><label class="dialkit-text-label"> </label> <input type="text" class="dialkit-text-input"/></div>`);function mt(e,t){k(t,!0);var r=pt(),i=g(r),o=g(i,!0);j(i);var s=f(i,2);C(s),j(r),a(()=>{n(o,t.label),N(s,t.value),w(s,`placeholder`,t.placeholder)}),d(`input`,s,e=>t.onChange(e.currentTarget.value)),u(e,r),S()}l([`input`]);var ht=t(`<button class="dialkit-select-option"> </button>`),gt=t(`<div class="dialkit-select-dropdown"></div>`),_t=t(`<div class="dialkit-select-row"><button class="dialkit-select-trigger"><span class="dialkit-select-label"> </span> <div class="dialkit-select-right"><span class="dialkit-select-value"> </span> <svg class="dialkit-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path></path></svg></div></button> <!></div>`);function vt(e,t){k(t,!0);let i=F(!1),o=F(null),l=F(null),p,m,h=new Y(0,{stiffness:.2,damping:.6}),v=e=>e.replace(/\b\w/g,e=>e.toUpperCase()),y=b(()=>t.options.map(e=>typeof e==`string`?{value:e,label:v(e)}:e)),x=b(()=>c(y).find(e=>e.value===t.value)),C=()=>{if(!p||typeof window>`u`)return;let e=p.getBoundingClientRect(),t=8+c(y).length*36,n=window.innerHeight-e.bottom-4,r=n<t&&e.top>n;M(o,{top:r?e.top-4:e.bottom+4,left:e.left,width:e.width,above:r},!0)},T=()=>{C(),M(i,!0)},E=()=>{M(i,!1)},D=b(()=>!c(o)||typeof window>`u`?``:c(o).above?`position:fixed;left:${c(o).left}px;width:${c(o).width}px;bottom:${window.innerHeight-c(o).top}px;transform-origin:bottom;`:`position:fixed;left:${c(o).left}px;width:${c(o).width}px;top:${c(o).top}px;transform-origin:top;`);s(()=>{typeof document>`u`||!p||M(l,p.closest(`.dialkit-root`)??document.body,!0)}),s(()=>{h.set(c(i)?180:0)}),s(()=>{if(!c(i)||typeof window>`u`)return;let e=()=>C(),t=e=>{let t=e.target;p?.contains(t)||m?.contains(t)||E()};return C(),document.addEventListener(`mousedown`,t),window.addEventListener(`resize`,e),window.addEventListener(`scroll`,e,!0),()=>{document.removeEventListener(`mousedown`,t),window.removeEventListener(`resize`,e),window.removeEventListener(`scroll`,e,!0)}});var N=_t(),P=g(N),L=g(P),R=g(L,!0);j(L);var V=f(L,2),H=g(V),U=g(H,!0);j(H);var W=f(H,2);let G;var K=g(W);j(W),j(V),j(P),I(P,e=>p=e,()=>p);var q=f(P,2),J=e=>{le(e,{get target(){return c(l)},children:(e,s)=>{var l=O(),f=_(l),p=e=>{var r=gt();B(r,21,()=>c(y),e=>e.value,(e,r)=>{var i=ht(),o=g(i,!0);j(i),a(e=>{w(i,`data-selected`,e),n(o,c(r).label)},[()=>String(c(r).value===t.value)]),d(`click`,i,()=>{t.onChange(c(r).value),E()}),u(e,i)}),j(r),I(r,e=>m=e,()=>m),a(()=>A(r,c(D))),z(3,r,()=>Ee,()=>({above:c(o).above})),u(e,r)};r(f,e=>{c(i)&&c(o)&&e(p)}),u(e,l)},$$slots:{default:!0}})};r(q,e=>{c(l)&&e(J)}),j(N),a(e=>{w(P,`data-open`,e),n(R,t.label),n(U,c(x)?.label??t.value),G=A(W,``,G,{transform:`rotate(${h.current}deg)`}),w(K,`d`,he)},[()=>String(c(i))]),d(`click`,P,()=>c(i)?E():T()),u(e,N),S()}l([`click`]);var yt=t(`<input type="text" class="dialkit-color-hex-input"/>`),bt=t(`<span class="dialkit-color-hex"> </span>`),xt=t(`<div class="dialkit-color-control"><label class="dialkit-color-label"> </label> <div class="dialkit-color-inputs"><!> <button class="dialkit-color-swatch" title="Pick color"></button> <input type="color" class="dialkit-color-picker-native"/></div></div>`);function St(t,l){k(l,!0);let p=/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/,m=F(!1),h=F(e(l.value)),_,v=e=>e.length===4?`#${e[1]}${e[1]}${e[2]}${e[2]}${e[3]}${e[3]}`:e;s(()=>{l.value,c(m)||M(h,l.value,!0)});let y=()=>{M(m,!1),p.test(c(h))?l.onChange(c(h)):M(h,l.value,!0)},b=e=>{e.key===`Enter`?y():e.key===`Escape`&&(M(m,!1),M(h,l.value,!0))};var x=xt(),T=g(x),E=g(T,!0);j(T);var D=f(T,2),O=g(D),P=e=>{var t=yt();C(t),o(t,!0),a(()=>N(t,c(h))),d(`input`,t,e=>M(h,e.currentTarget.value,!0)),i(`blur`,t,y),d(`keydown`,t,b),u(e,t)},L=e=>{var t=bt(),r=g(t,!0);j(t),a(e=>n(r,e),[()=>(l.value??``).toUpperCase()]),d(`click`,t,()=>M(m,!0)),u(e,t)};r(O,e=>{c(m)?e(P):e(L,-1)});var R=f(O,2);let z;var B=f(R,2);C(B),I(B,e=>_=e,()=>_),j(D),j(x),a(e=>{n(E,l.label),w(R,`aria-label`,`Pick color for ${l.label}`),z=A(R,``,z,{"background-color":l.value}),w(B,`aria-label`,`${l.label} color picker`),N(B,e)},[()=>l.value.length===4?v(l.value):l.value.slice(0,7)]),d(`click`,R,()=>_?.click()),d(`input`,B,e=>l.onChange(e.currentTarget.value)),u(t,x),S()}l([`input`,`keydown`,`click`]);var Ct=Symbol(`dialkit-shortcut`);function wt(e,t){k(t,!0);let n=F(null),i=F(null);R(Ct,{get activePanelId(){return c(n)},get activePath(){return c(i)}});let a=new Set,o=!1,l=null,d=0;function f(e){for(let t of a){let n=W.getPanels();for(let r of n)for(let[n,i]of Object.entries(r.shortcuts)){if(!i.key||i.key.toLowerCase()!==t||(i.interaction??`scroll`)!==e)continue;let a=W.getPanel(r.id)?.controls?Re(r.controls,n):null;if(a&&a.type===`slider`)return{panelId:r.id,path:n,control:a,shortcut:i}}}return null}function m(e){if(ze())return;let t=e.key.toLowerCase();if((t===`arrowleft`||t===`arrowright`||t===`arrowup`||t===`arrowdown`)&&a.size>0){let n=f(`scroll`)||f(`drag`)||f(`move`);if(n&&n.control.type===`slider`){e.preventDefault();let r=t===`arrowright`||t===`arrowup`?1:-1,i=Ie(n.control,n.shortcut);Le(n.panelId,n.path,n.control,i,r);return}}let r=a.has(t);a.add(t);let o=Be(e),s=W.resolveShortcutTarget(t,o);if(s&&(M(n,s.panelId,!0),M(i,s.path,!0),!r&&s.control.type===`toggle`)){let e=W.getValue(s.panelId,s.path);W.updateValue(s.panelId,s.path,!e)}r||(l=null,d=0)}function h(e){let t=e.key.toLowerCase();if(a.delete(t),o=!1,l=null,d=0,a.size===0)M(n,null),M(i,null);else{let t=!1;for(let r of a){let a=Be(e),o=W.resolveShortcutTarget(r,a);if(o){M(n,o.panelId,!0),M(i,o.path,!0),t=!0;break}}t||(M(n,null),M(i,null))}}function g(e){if(ze())return;let t=Be(e);if(a.size>0)for(let n of a){let r=W.resolveShortcutTarget(n,t);if(!r)continue;let{panelId:i,path:a,control:o}=r;if(!((o.shortcut?.interaction??`scroll`)!==`scroll`||o.type!==`slider`)){e.preventDefault(),Le(i,a,o,Ie(o,o.shortcut),e.deltaY>0?-1:1);return}}let n=W.resolveScrollOnlyTargets();for(let{panelId:t,path:r,control:i,shortcut:a}of n)if(i.type===`slider`){e.preventDefault(),Le(t,r,i,Ie(i,a),e.deltaY>0?-1:1);return}}function v(e){ze()||a.size!==0&&f(`drag`)&&(o=!0,l=e.clientX,d=0,e.preventDefault())}function y(){o=!1,l=null,d=0}function b(e){if(ze()||a.size===0)return;if(o){let t=f(`drag`);if(t&&l!==null){let n=e.clientX-l;l=e.clientX,d+=n;let r=Ie(t.control,t.shortcut),i=Math.trunc(d/8);i!==0&&(d-=i*8,Le(t.panelId,t.path,t.control,r,i))}return}let t=f(`move`);if(t){if(l===null){l=e.clientX;return}let n=e.clientX-l;l=e.clientX,d+=n;let r=Ie(t.control,t.shortcut),i=Math.trunc(d/8);i!==0&&(d-=i*8,Le(t.panelId,t.path,t.control,r,i))}}function x(){a.clear(),o=!1,l=null,d=0,M(n,null),M(i,null)}s(()=>(window.addEventListener(`keydown`,m),window.addEventListener(`keyup`,h),window.addEventListener(`wheel`,g,{passive:!1}),window.addEventListener(`mousedown`,v),window.addEventListener(`mouseup`,y),window.addEventListener(`mousemove`,b),window.addEventListener(`blur`,x),()=>{window.removeEventListener(`keydown`,m),window.removeEventListener(`keyup`,h),window.removeEventListener(`wheel`,g),window.removeEventListener(`mousedown`,v),window.removeEventListener(`mouseup`,y),window.removeEventListener(`mousemove`,b),window.removeEventListener(`blur`,x)}));var C=O(),w=_(C),T=e=>{var n=O();p(_(n),()=>t.children),u(e,n)};r(w,e=>{t.children&&e(T)}),u(e,C),S()}var Tt=t(`<button class="dialkit-button"> </button>`);function Et(e,t){k(t,!0);let i=L(Ct),o=b(()=>t.values[t.control.path]),s=b(()=>i?i.activePanelId===t.panelId&&i.activePath===t.control.path:!1);var l=O(),f=_(l),p=e=>{$(e,{get label(){return t.control.label},get value(){return c(o)},onChange:e=>W.updateValue(t.panelId,t.control.path,e),get min(){return t.control.min},get max(){return t.control.max},get step(){return t.control.step},get shortcut(){return t.control.shortcut},get shortcutActive(){return c(s)}})},m=e=>{Qe(e,{get label(){return t.control.label},get checked(){return c(o)},onChange:e=>W.updateValue(t.panelId,t.control.path,e),get shortcut(){return t.control.shortcut},get shortcutActive(){return c(s)}})},h=e=>{at(e,{get panelId(){return t.panelId},get path(){return t.control.path},get label(){return t.control.label},get spring(){return c(o)},onChange:e=>W.updateValue(t.panelId,t.control.path,e)})},v=e=>{ft(e,{get panelId(){return t.panelId},get path(){return t.control.path},get label(){return t.control.label},get value(){return c(o)},onChange:e=>W.updateValue(t.panelId,t.control.path,e)})},y=e=>{{let n=b(()=>t.control.defaultOpen??!0);Q(e,{get title(){return t.control.label},get defaultOpen(){return c(n)},children:(e,n)=>{var r=O();B(_(r),17,()=>t.control.children??[],e=>e.path,(e,n)=>{Et(e,{get panelId(){return t.panelId},get control(){return c(n)},get values(){return t.values}})}),u(e,r)},$$slots:{default:!0}})}},x=e=>{mt(e,{get label(){return t.control.label},get value(){return c(o)},onChange:e=>W.updateValue(t.panelId,t.control.path,e),get placeholder(){return t.control.placeholder}})},C=e=>{{let n=b(()=>t.control.options??[]);vt(e,{get label(){return t.control.label},get value(){return c(o)},get options(){return c(n)},onChange:e=>W.updateValue(t.panelId,t.control.path,e)})}},w=e=>{St(e,{get label(){return t.control.label},get value(){return c(o)},onChange:e=>W.updateValue(t.panelId,t.control.path,e)})},T=e=>{var r=Tt(),i=g(r,!0);j(r),a(()=>n(i,t.control.label)),d(`click`,r,()=>W.triggerAction(t.panelId,t.control.path)),u(e,r)};r(f,e=>{t.control.type===`slider`?e(p):t.control.type===`toggle`?e(m,1):t.control.type===`spring`?e(h,2):t.control.type===`transition`?e(v,3):t.control.type===`folder`?e(y,4):t.control.type===`text`?e(x,5):t.control.type===`select`?e(C,6):t.control.type===`color`?e(w,7):t.control.type===`action`&&e(T,8)}),u(e,l),S()}l([`click`]),t(`<div class="dialkit-shortcuts-row"><span class="dialkit-shortcuts-row-key"> </span> <span class="dialkit-shortcuts-row-label"> </span> <span class="dialkit-shortcuts-row-mode"> </span></div>`),t(`<div class="dialkit-root dialkit-shortcuts-dropdown"><div class="dialkit-shortcuts-title">Keyboard Shortcuts</div> <div class="dialkit-shortcuts-list"></div> <div class="dialkit-shortcuts-hint">See pill badges on controls for keys</div></div>`),t(`<button class="dialkit-shortcuts-trigger" title="Keyboard shortcuts"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M6 10H6.01"></path><path d="M10 10H10.01"></path><path d="M14 10H14.01"></path><path d="M18 10H18.01"></path><path d="M8 14H16"></path></svg></button> <!>`,1),l([`click`]);var Dt=t(`<button class="dialkit-toolbar-add" title="Add preset"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path></path><path></path><path></path><path></path><path></path></svg></button> <!> <button class="dialkit-toolbar-copy" title="Copy parameters"><span class="dialkit-toolbar-copy-icon-wrap"><svg class="dialkit-toolbar-copy-icon" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path><path fill="currentColor"></path><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg> <svg class="dialkit-toolbar-copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path></path></svg></span> Copy</button>`,1),Ot=t(`<div class="dialkit-panel-wrapper"><!></div>`);function kt(t,n){k(n,!0);let r=y(n,`defaultOpen`,3,!0),o=y(n,`inline`,3,!1);b(()=>Object.keys(n.panel.shortcuts).length>0);let l=F(!1),p=F(e(r())),m=F(e(W.getValues(n.panel.id))),h=F(e(W.getPresets(n.panel.id))),v=F(e(W.getActivePresetId(n.panel.id))),x=new Y(1,{stiffness:.25,damping:.7}),C=new Y(1,{stiffness:.25,damping:.7}),T=new Y(1,{stiffness:.25,damping:.7}),E=new Y(1,{stiffness:.2,damping:.6}),D=new Y(0,{stiffness:.25,damping:.7}),N=new Y(.5,{stiffness:.2,damping:.6}),I;s(()=>{let e=W.subscribe(n.panel.id,()=>{M(m,W.getValues(n.panel.id),!0),M(h,W.getPresets(n.panel.id),!0),M(v,W.getActivePresetId(n.panel.id),!0)});return()=>{e(),I&&clearTimeout(I)}}),s(()=>{if(c(l)){T.set(0),E.set(.5),D.set(1),N.set(1);return}T.set(1),E.set(1),D.set(0),N.set(.5)});let L=()=>{let e=c(h).length+2;W.savePreset(n.panel.id,`Version ${e}`)},R=async()=>{let e=JSON.stringify(c(m),null,2),t=`Update the createDialKit configuration for "${n.panel.name}" with these values:\n\n\`\`\`json\n${e}\n\`\`\`\n\nApply these values as the new defaults in the createDialKit call.`;await navigator.clipboard.writeText(t),M(l,!0),I&&clearTimeout(I),I=setTimeout(()=>{M(l,!1)},1500)};var z=Ot();Q(g(z),{get title(){return n.panel.name},get defaultOpen(){return r()},isRoot:!0,get inline(){return o()},onOpenChange:e=>M(p,e,!0),toolbar:e=>{var t=Dt(),r=_(t);let o;var s=g(r),l=g(s),p=f(l),m=f(p),y=f(m),b=f(y);j(s),j(r);var S=f(r,2);Ae(S,{get panelId(){return n.panel.id},get presets(){return c(h)},get activePresetId(){return c(v)}});var O=f(S,2);let k;var M=g(O),F=g(M);let I;var z=g(F),B=f(z),V=f(B);j(F);var H=f(F,2);let U;var W=g(H);j(H),j(M),P(),j(O),a(()=>{o=A(r,``,o,{transform:`scale(${x.current})`}),w(l,`d`,ve[0]),w(p,`d`,ve[1]),w(m,`d`,ve[2]),w(y,`d`,ve[3]),w(b,`d`,ve[4]),k=A(O,``,k,{transform:`scale(${C.current})`}),I=A(F,``,I,{opacity:T.current,transform:`scale(${E.current})`,filter:`blur(${(1-T.current)*4}px)`}),w(z,`d`,ye.board),w(B,`d`,ye.sparkle),w(V,`d`,ye.body),U=A(H,``,U,{opacity:D.current,transform:`scale(${N.current})`,filter:`blur(${(1-D.current)*4}px)`}),w(W,`d`,ge)}),d(`click`,r,L),d(`pointerdown`,r,()=>x.set(.9)),d(`pointerup`,r,()=>x.set(1)),i(`pointercancel`,r,()=>x.set(1)),i(`pointerleave`,r,()=>x.set(1)),d(`click`,O,R),d(`pointerdown`,O,()=>C.set(.95)),d(`pointerup`,O,()=>C.set(1)),i(`pointercancel`,O,()=>C.set(1)),i(`pointerleave`,O,()=>C.set(1)),u(e,t)},children:(e,t)=>{var r=O();B(_(r),17,()=>n.panel.controls,e=>e.path,(e,t)=>{Et(e,{get panelId(){return n.panel.id},get control(){return c(t)},get values(){return c(m)}})}),u(e,r)},$$slots:{toolbar:!0,default:!0}}),j(z),u(t,z),S()}l([`click`,`pointerdown`,`pointerup`]);var At=t(`<div class="dialkit-root"><div class="dialkit-panel"></div></div>`);function jt(t,n){k(n,!0);let i=!(typeof process<`u`),o=y(n,`position`,3,`top-right`),l=y(n,`defaultOpen`,3,!0),d=y(n,`mode`,3,`popover`),f=y(n,`theme`,3,`system`),p=y(n,`productionEnabled`,3,i),m=b(()=>d()===`inline`),h=F(e([])),v=F(!1);s(()=>{if(typeof document>`u`)return;let e=`dialkit-theme`;if(!document.getElementById(e)){let t=document.createElement(`style`);t.id=e,t.textContent=se,document.head.appendChild(t)}}),s(()=>{if(!(typeof window>`u`))return M(v,!0),M(h,W.getPanels(),!0),W.subscribeGlobal(()=>{M(h,W.getPanels(),!0)})});var x=O(),C=_(x),T=e=>{let t=e=>{wt(e,{children:(e,t)=>{var n=At(),r=g(n);B(r,21,()=>c(h),e=>e.id,(e,t)=>{{let n=b(()=>c(m)||l());kt(e,{get panel(){return c(t)},get defaultOpen(){return c(n)},get inline(){return c(m)}})}}),j(r),j(n),a(()=>{w(n,`data-mode`,d()),w(n,`data-theme`,f()),w(r,`data-mode`,d()),w(r,`data-position`,c(m)?void 0:o())}),u(e,n)},$$slots:{default:!0}})};var n=O(),i=_(n),s=e=>{t(e)},p=e=>{le(e,{target:`body`,children:(e,n)=>{t(e)},$$slots:{default:!0}})};r(i,e=>{c(m)?e(s):e(p,-1)}),u(e,n)};r(C,e=>{p()&&c(v)&&c(h).length>0&&e(T)}),u(t,x),S()}t(`<button class="dialkit-button"> </button>`),t(`<div class="dialkit-button-group"></div>`),l([`click`]);export{K as n,jt as t};