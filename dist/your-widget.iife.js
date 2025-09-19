var YourWidget=(function(exports){'use strict';var w={rooms:1,adults:2,childrenAges:[],infants:0},A=";",$=".",y=(e,t=0)=>{let r=Number.parseInt(e,10);return Number.isFinite(r)&&r>=0?r:t},I=e=>{let t=Number.parseFloat(e);return Number.isFinite(t)&&t>=0?t:0},G=e=>e?e.split(A).map(t=>t.trim()).filter(Boolean).map(t=>{let[r,n]=t.split(":"),[s,o="0",a="0"]=(n!=null?n:"").split(","),i=o.split($).map(d=>d.trim()).filter(Boolean).map(d=>I(d)).filter(d=>d>=0);return {rooms:Math.max(1,y(r,1)),adults:Math.max(1,y(s,1)),childrenAges:i,infants:Math.max(0,y(a,0))}}):[w],h=e=>e.map(t=>{let r=t.childrenAges.length?t.childrenAges.map(n=>n.toString()).join($):"0";return `${t.rooms}:${t.adults},${r},${t.infants}`}).join(A),R=e=>e.reduce((r,n)=>(r.rooms+=n.rooms,r.adults+=n.adults,r.children+=n.childrenAges.length,r.infants+=n.infants,r),{rooms:0,adults:0,children:0,infants:0}),p=e=>e.map(t=>({...t,childrenAges:[...t.childrenAges]}));var S=/\d{4}-\d{2}-\d{2}/,D=()=>{let e=new Date;return e.setHours(0,0,0,0),e.toISOString().slice(0,10)},k=(e,t)=>{let r=new Date(e);return r.setDate(r.getDate()+t),r.toISOString().slice(0,10)},L=(e,t)=>e&&S.test(e)?e:t,_="en",W="USD",N="GLOBAL",M=1e3,f=e=>{var i,d,u,l;let t=L(e.initialStart,D()),r=L(e.initialEnd,k(t,1)),n=t,s=r;s<=n&&(s=k(n,1));let o=G(e.initialGroups),a=o.length?o:[w];return {startDate:n,endDate:s,pos:(i=e.pos)!=null?i:N,locale:(d=e.locale)!=null?d:_,currency:(u=e.currency)!=null?u:W,productId:(l=e.productId)!=null?l:M,groups:p(a),redirect:!!e.redirect,isSearching:false,errors:{}}},O=(e,t)=>S.test(e)?S.test(t)?t<=e?"End date must be after start date.":null:"End date is invalid.":"Start date is invalid.",F=e=>{if(!e.length)return "At least one room group is required.";for(let[t,r]of e.entries()){if(r.rooms<=0)return `Room ${t+1}: rooms must be greater than 0.`;if(r.adults<=0)return `Room ${t+1}: adults must be greater than 0.`;if(r.childrenAges.some(n=>n<0))return `Room ${t+1}: child ages must be >= 0.`;if(r.infants<0)return `Room ${t+1}: infants must be >= 0.`}return null},T=e=>{let t={},r=O(e.startDate,e.endDate);r&&(t.dates=r),(!e.productId||e.productId<=0)&&(t.productId="Product is required.");let n=F(e.groups);return n&&(t.groups=n),e.pos||(t.pos="POS is required."),e.locale||(t.locale="Language is required."),e.currency||(t.currency="Currency is required."),{valid:Object.keys(t).length===0,errors:t}},C=(e,t)=>{var n,s;let r=h(e.groups);return {start_date:e.startDate,end_date:e.endDate,product_id:e.productId,groups_form:r,pos:e.pos,language:e.locale,currency:e.currency,redirect:(s=(n=e.redirect)!=null?n:t.redirect)!=null?s:false}};var P=`
:host {
  all: initial;
  display: inline-block;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.yw-container {
  font-family: inherit;
  background: var(--yw-bg, #ffffff);
  color: var(--yw-fg, #101828);
  border: 1px solid rgba(16, 24, 40, 0.1);
  border-radius: 12px;
  padding: 1rem;
  min-width: 260px;
  max-width: 420px;
  box-sizing: border-box;
  box-shadow: 0 8px 24px rgba(16, 24, 40, 0.08);
}
.yw-container[data-theme='dark'] {
  background: var(--yw-bg, #101828);
  color: var(--yw-fg, #ffffff);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.75);
}
.yw-container h2 {
  font-size: 1.1rem;
  margin: 0 0 0.75rem;
}
form {
  display: grid;
  gap: 0.75rem;
}
label {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  gap: 0.35rem;
}
input,
select,
button {
  font: inherit;
}
input,
select {
  border-radius: 8px;
  border: 1px solid rgba(16, 24, 40, 0.18);
  padding: 0.5rem 0.6rem;
  background: var(--yw-bg, #ffffff);
  color: inherit;
}
[data-theme='dark'] input,
[data-theme='dark'] select {
  border-color: rgba(255, 255, 255, 0.18);
}
.yw-row {
  display: grid;
  gap: 0.75rem;
}
.yw-row--inline {
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}
.yw-groups {
  display: grid;
  gap: 0.75rem;
  border: 1px dashed rgba(16, 24, 40, 0.15);
  padding: 0.75rem;
  border-radius: 8px;
}
.yw-group {
  display: grid;
  gap: 0.5rem;
}
.yw-group-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.yw-group-controls label {
  flex: 1;
  min-width: 120px;
}
.yw-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
}
.yw-primary {
  background: var(--yw-accent, #2563eb);
  border: none;
  color: #ffffff;
  border-radius: 999px;
  padding: 0.65rem 1.25rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}
.yw-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.yw-secondary {
  background: transparent;
  border: 1px solid rgba(16, 24, 40, 0.2);
  color: inherit;
  border-radius: 999px;
  padding: 0.55rem 1rem;
  cursor: pointer;
}
.yw-error {
  color: #dc2626;
  font-size: 0.8rem;
}
[data-theme='dark'] .yw-error {
  color: #f87171;
}
.yw-summary {
  font-size: 0.85rem;
  opacity: 0.8;
}
small {
  font-size: 0.8rem;
  opacity: 0.7;
}
`,U=["token","theme","locale","currency","pos","product-id","initial-start","initial-end","initial-groups","redirect"],q=(e,t)=>{if(!e.hasAttribute(t))return;let r=e.getAttribute(t);return r===null||r===""||r.toLowerCase()==="true"?true:r.toLowerCase()!=="false"},H=e=>{if(e==null)return;let t=Number(e);return Number.isFinite(t)?t:void 0},B=(e,t)=>`
  <div class="yw-group" data-index="${t}">
    <header class="yw-summary">Room ${t+1}</header>
    <div class="yw-group-controls">
      <label>
        <span>Rooms</span>
        <input type="number" min="1" data-group-field="rooms" data-index="${t}" value="${e.rooms}" />
      </label>
      <label>
        <span>Adults</span>
        <input type="number" min="1" data-group-field="adults" data-index="${t}" value="${e.adults}" />
      </label>
      <label>
        <span>Children ages</span>
        <input type="text" placeholder="e.g. 5.8" data-group-field="children" data-index="${t}" value="${e.childrenAges.join(".")}" />
      </label>
      <label>
        <span>Infants</span>
        <input type="number" min="0" data-group-field="infants" data-index="${t}" value="${e.infants}" />
      </label>
    </div>
    ${t>0?`<button class="yw-secondary" type="button" data-remove-group="${t}" aria-label="Remove room ${t+1}">Remove room</button>`:""}
  </div>
`,j=e=>e.map(B).join(""),z=e=>e.split(/[.,]/).map(t=>t.trim()).filter(Boolean).map(Number).filter(t=>Number.isFinite(t)&&t>=0),V=e=>({token:e}),b=class extends HTMLElement{constructor(){var r,n;super();this.bootstrapped=false;this.attachShadow({mode:"open"}),this.config=V((r=this.getAttribute("token"))!=null?r:"PUBLIC_TOKEN"),this.state=f({...this.config,initialGroups:(n=this.getAttribute("initial-groups"))!=null?n:void 0});}static get observedAttributes(){return U}connectedCallback(){this.config=this.readConfig(),this.state=f(this.config),this.render(),this.bootstrapped=true,this.emit("ready",{state:this.state});}attributeChangedCallback(){this.bootstrapped&&(this.config=this.readConfig(),this.state=f(this.config),this.render());}readConfig(){var r,n,s,o,a,i,d,u;return {token:(r=this.getAttribute("token"))!=null?r:"PUBLIC_TOKEN",theme:(n=this.getAttribute("theme"))!=null?n:void 0,locale:(s=this.getAttribute("locale"))!=null?s:void 0,currency:(o=this.getAttribute("currency"))!=null?o:void 0,pos:(a=this.getAttribute("pos"))!=null?a:void 0,productId:H(this.getAttribute("product-id")),initialStart:(i=this.getAttribute("initial-start"))!=null?i:void 0,initialEnd:(d=this.getAttribute("initial-end"))!=null?d:void 0,initialGroups:(u=this.getAttribute("initial-groups"))!=null?u:void 0,redirect:q(this,"redirect"),onEvent:l=>this.emit(l.type,l.payload)}}emit(r,n){let s={type:r,payload:n};this.dispatchEvent(new CustomEvent("yw:event",{detail:s,bubbles:true,composed:true}));}setState(r){this.state={...this.state,...r},this.emit("change",{state:this.state}),this.render();}render(){var E,x;if(!this.shadowRoot)return;let r=(E=this.config.theme)!=null?E:"light",{startDate:n,endDate:s,pos:o,locale:a,currency:i,productId:d,groups:u,isSearching:l,errors:c,redirect:m}=this.state,g=R(u),v=(x=Object.values(c)[0])!=null?x:"";this.shadowRoot.innerHTML=`
      <style>${P}</style>
      <div class="yw-container" data-theme="${r}" role="region" aria-live="polite">
        <h2>Booking search</h2>
        <form>
          <div class="yw-row yw-row--inline">
            <label>
              <span>Check-in</span>
              <input type="date" name="start" value="${n}" />
            </label>
            <label>
              <span>Check-out</span>
              <input type="date" name="end" value="${s}" min="${n}" />
            </label>
          </div>

          <div class="yw-row yw-row--inline">
            <label>
              <span>POS</span>
              <input type="text" name="pos" value="${o}" />
            </label>
            <label>
              <span>Language</span>
              <input type="text" name="locale" value="${a}" />
            </label>
            <label>
              <span>Currency</span>
              <input type="text" name="currency" value="${i}" />
            </label>
          </div>

          <label>
            <span>Product ID</span>
            <input type="number" name="product" min="1" value="${d}" />
          </label>

          <section class="yw-groups" aria-label="Guests">
            ${j(u)}
            <button type="button" class="yw-secondary" data-add-group>Add room</button>
            <p class="yw-summary">${g.rooms} rooms \xB7 ${g.adults} adults \xB7 ${g.children} children \xB7 ${g.infants} infants</p>
          </section>

          <label>
            <span>
              Redirect to booking engine
              <input type="checkbox" name="redirect" ${m?"checked":""} />
            </span>
          </label>

          ${v?`<p class="yw-error">${v}</p>`:""}

          <div class="yw-actions">
            <button type="submit" class="yw-primary" ${l?"disabled":""}>${l?"Searching\u2026":"Search"}</button>
            <small>${h(u)}</small>
          </div>
        </form>
      </div>
    `,this.bindEvents();}bindEvents(){let r=this.shadowRoot;if(!r)return;let n=r.querySelector("form");n==null||n.addEventListener("submit",i=>this.onSubmit(i));let s=(i,d)=>{let u=r.querySelector(i);u&&u.addEventListener("change",l=>d(l.target.value));};s('input[name="start"]',i=>this.setState({startDate:i})),s('input[name="end"]',i=>this.setState({endDate:i})),s('input[name="pos"]',i=>this.setState({pos:i})),s('input[name="locale"]',i=>this.setState({locale:i})),s('input[name="currency"]',i=>this.setState({currency:i})),s('input[name="product"]',i=>this.setState({productId:Number(i)||0}));let o=r.querySelector('input[name="redirect"]');o==null||o.addEventListener("change",i=>{let d=i.target;this.setState({redirect:d.checked});}),r.querySelectorAll("[data-group-field]").forEach(i=>{i.addEventListener("change",d=>{var m;let u=d.target,l=Number((m=u.dataset.index)!=null?m:"0"),c=u.dataset.groupField;this.updateGroup(l,c!=null?c:"",u.value);});}),r.querySelectorAll("[data-remove-group]").forEach(i=>{i.addEventListener("click",()=>{var u;let d=Number((u=i.dataset.removeGroup)!=null?u:"0");this.setState({groups:this.state.groups.filter((l,c)=>c!==d)});});});let a=r.querySelector("[data-add-group]");a==null||a.addEventListener("click",()=>{this.setState({groups:[...p(this.state.groups),{rooms:1,adults:2,childrenAges:[],infants:0}]});});}updateGroup(r,n,s){let o=p(this.state.groups),a=o[r];a&&(n==="rooms"&&(a.rooms=Math.max(1,Number(s)||1)),n==="adults"&&(a.adults=Math.max(1,Number(s)||1)),n==="children"&&(a.childrenAges=z(s)),n==="infants"&&(a.infants=Math.max(0,Number(s)||0)),this.setState({groups:o}));}async onSubmit(r){r.preventDefault();let n=T(this.state);if(!n.valid){this.setState({errors:n.errors}),this.emit("validate_error",n);return}let s=C({...this.state},this.config);this.setState({isSearching:true,errors:{}}),this.emit("search_start",s);try{let o=await fetch("https://gateway-prod.pxsol.com/v2/search",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.config.token}`},body:JSON.stringify(s)});if(!o.ok)throw new Error(`Search failed with status ${o.status}`);let a=await o.json();this.setState({isSearching:!1,lastResponse:a}),this.emit("search_success",{request:s,response:a}),s.redirect&&a.booking_engine_url&&window.location.assign(a.booking_engine_url);}catch(o){let a=o instanceof Error?o:new Error("Unexpected error");this.setState({isSearching:false}),this.emit("search_error",{request:s,error:a}),console.error("[booking-search-widget]",a);}}};customElements.get("your-widget")||customElements.define("your-widget",b);var Z=()=>{customElements.get("your-widget")||customElements.define("your-widget",b);};
exports.YourWidgetElement=b;exports.registerYourWidget=Z;return exports;})({});//# sourceMappingURL=your-widget.iife.js.map
//# sourceMappingURL=your-widget.iife.js.map