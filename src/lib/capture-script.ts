/**
 * Browser-side script that reads the listing the person is looking at and opens TSL's add page with
 * its title, photo and price. It runs in their own browser, so sites that block TSL's server still work.
 * On a search results page it also collects every price shown, for the market comparison.
 * Used as a PC bookmark ("bookmarklet") and in the iPhone Shortcut's "Run JavaScript on Web Page" step.
 */
const READ_PAGE = `
var d=document,t='',i='',p='',c='',A=[],L=[];
function m(s){var e=d.querySelector(s);return e?(e.getAttribute('content')||e.textContent||'').trim():''}
function w(o){
  if(!o||typeof o!='object')return;
  if(Array.isArray(o)){o.forEach(w);return}
  var ty=[].concat(o['@type']||[]).join(' ');
  if(/Product|Car|Vehicle|Offer|Residence|House|Apartment|RealEstateListing|Accommodation/.test(ty)){
    if(!t&&o.name&&!/^Offer$/.test(ty))t=String(o.name);
    if(!i&&(o.image||o.photo)){var g=[].concat(o.image||o.photo)[0];i=typeof g=='string'?g:(g&&(g.url||g.contentUrl))||''}
    if(!p){var f=[].concat(o.offers||(/Offer/.test(ty)?o:[]))[0];if(f){var s=f.priceSpecification||{};p=String(f.price||f.lowPrice||s.price||'');c=f.priceCurrency||s.priceCurrency||''}}
  }
  if(/Offer/.test(ty)&&(o.price||o.lowPrice))A.push(String(o.price||o.lowPrice));
  for(var k in o)if(k!='@context')w(o[k]);
}
d.querySelectorAll('script[type="application/ld+json"]').forEach(function(s){try{w(JSON.parse(s.textContent))}catch(e){}});
t=t||m('meta[property="og:title"]')||d.title;
i=i||m('meta[property="og:image"]')||m('meta[name="twitter:image"]');
p=p||m('meta[property="product:price:amount"]')||m('[itemprop="price"]');
c=c||m('meta[property="product:price:currency"]');
if(!p){var e=d.querySelector('[data-testid*="price" i],[class*="price" i]');if(e&&/\\$|\\d/.test(e.textContent))p=e.textContent.trim().slice(0,60)}
d.querySelectorAll('[data-testid*="price" i],[class*="price" i],[itemprop="price"]').forEach(function(e){
  if(e.closest('s,del')||e.querySelector('[data-testid*="price" i],[class*="price" i]'))return;
  var x=(e.getAttribute('content')||e.textContent||'').trim();
  if(x.length<40&&(/\\$\\s?\\d/.test(x)||/^\\d[\\d,.]{3,}$/.test(x)))L.push(x);
});
if(A.length>L.length)L=A;
if(i)try{i=new URL(i,location.href).href}catch(x){}
var u=new URL('/add',ORIGIN);
[['url',location.href],['title',t.slice(0,200)],['image',i],['price',p],['currency',c],['prices',L.length>4?L.slice(0,150).join('|'):'']].forEach(function(a){if(a[1])u.searchParams.set(a[0],a[1])});
`;

function withOrigin(origin: string) {
  return READ_PAGE.replace("ORIGIN", JSON.stringify(origin)).replace(/\n\s*/g, "");
}

/** A bookmark that opens the listing in TSL in a new tab. */
export function bookmarklet(origin: string) {
  return `javascript:(function(){${withOrigin(origin)}window.open(u.href,'_blank')})()`;
}

/** For the iPhone Shortcut: hands the TSL link back to the next step ("Open URLs"). */
export function shortcutScript(origin: string) {
  return `${withOrigin(origin)}completion(u.href);`;
}
