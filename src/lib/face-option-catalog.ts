"use client";

export type ColorOption={id:string;label:string;tone:string;prompt:string;negative?:string};
export type ColorCategory={id:"eyeColor"|"skinTone"|"hairColor";label:string;hint:string;options:ColorOption[]};
export type IdentitySelections=Record<string,string>;
export const FACE_TRIGGER="angel face";

export const colorCategories:ColorCategory[]=[
 {id:"eyeColor",label:"Eye color",hint:"Color de iris",options:[
  {id:"blue",label:"Blue",tone:"#48a8ff",prompt:"neon blue eyes color"},
  {id:"green",label:"Green",tone:"#60e879",prompt:"neon green eyes color"},
  {id:"hazel",label:"Hazel",tone:"#a78643",prompt:"bright azel eyes color"},
  {id:"brown",label:"Brown",tone:"#704633",prompt:"bright brown eyes color"},
  {id:"gray",label:"Gray",tone:"#aeb6c2",prompt:"bright grey eyes color"},
  {id:"purple",label:"Purple",tone:"#9258e8",prompt:"bright purple eyes color"},
  {id:"red",label:"Red",tone:"#ee3f4f",prompt:"bright red eyes color"},
  {id:"pink",label:"Pink",tone:"#ff65b3",prompt:"bright pink eyes color"},
 ]},
 {id:"skinTone",label:"Skin tone",hint:"Tono de piel",options:[
  {id:"albine",label:"Albine",tone:"#f5e8e1",prompt:"albine skin tone"},
  {id:"porcelain",label:"Porcelain",tone:"#ead4c9",prompt:"porcelain skin tone"},
  {id:"fair",label:"Fair",tone:"#d9b8a7",prompt:"fair skin tone"},
  {id:"light",label:"Light",tone:"#cda18c",prompt:"light skin tone"},
  {id:"medium",label:"Medium",tone:"#a9765d",prompt:"medium skin tone"},
  {id:"tan",label:"Tan",tone:"#8e5f49",prompt:"tan skin tone"},
  {id:"black",label:"Black",tone:"#4a3028",prompt:"black skin tone"},
  {id:"black-dark",label:"Black dark",tone:"#211a18",prompt:"black dark skin tone"},
 ]},
 {id:"hairColor",label:"Hair color",hint:"Color de cabello",options:[
  {id:"black",label:"Black",tone:"#111214",prompt:"pure jet-black hair color from roots to ends"},
  {id:"dark-brown",label:"Dark brown",tone:"#3a251f",prompt:"rich deep dark-brown hair color"},
  {id:"brown",label:"Brown",tone:"#654434",prompt:"natural medium brown hair color"},
  {id:"light-brown",label:"Light brown",tone:"#94705a",prompt:"soft light-brown hair color"},
  {id:"blonde",label:"Blonde",tone:"#cbb47c",prompt:"natural neutral blonde hair color"},
  {id:"white",label:"White",tone:"#f0efea",prompt:"soft fashion white hair color"},
  {id:"auburn",label:"Auburn",tone:"#7a3529",prompt:"rich natural auburn hair color"},
  {id:"red",label:"Red",tone:"#9d272b",prompt:"vivid fashion red hair color"},
  {id:"blue",label:"Blue",tone:"#315f9f",prompt:"vivid fashion blue hair color"},
  {id:"purple",label:"Purple",tone:"#6f4aa8",prompt:"vivid fashion purple hair color"},
  {id:"pink",label:"Pink",tone:"#d97c9f",prompt:"soft fashion pink hair color"},
  {id:"rose-gold",label:"Rose gold",tone:"#c98e85",prompt:"soft rose-gold fashion hair color"},
  {id:"silver",label:"Silver",tone:"#aaaeb8",prompt:"cool metallic silver hair color"},
  {id:"split",label:"Split",tone:"linear-gradient(90deg,#f0efea 0 50%,#111214 50% 100%)",prompt:"center-split hair, left half white and right half black"},
  {id:"balayage",label:"Balayage",tone:"linear-gradient(135deg,#3a251f 0 38%,#765743 58%,#cbb47c 82%,#eadba9 100%)",prompt:"dark brown hair with blonde balayage highlights"},
  {id:"highlights",label:"Highlights",tone:"repeating-linear-gradient(115deg,#111214 0 8px,#d97c9f 8px 12px,#111214 12px 20px)",prompt:"black hair with pink colored highlights"},
 ]},
];

export const HAIR_EFFECT_COLORS=[
 {id:"black",label:"Black",tone:"#111214",prompt:"black"},
 {id:"dark-brown",label:"Dark brown",tone:"#3a251f",prompt:"dark brown"},
 {id:"brown",label:"Brown",tone:"#654434",prompt:"brown"},
 {id:"blonde",label:"Blonde",tone:"#cbb47c",prompt:"blonde"},
 {id:"white",label:"White",tone:"#f0efea",prompt:"white"},
 {id:"silver",label:"Silver",tone:"#aaaeb8",prompt:"silver"},
 {id:"auburn",label:"Auburn",tone:"#7a3529",prompt:"auburn"},
 {id:"red",label:"Red",tone:"#b82f34",prompt:"red"},
 {id:"blue",label:"Blue",tone:"#315f9f",prompt:"blue"},
 {id:"purple",label:"Purple",tone:"#6f4aa8",prompt:"purple"},
 {id:"pink",label:"Pink",tone:"#d97c9f",prompt:"pink"},
] as const;

export const SKIN_TONE_GENERATION_VALUES:Record<string,number>={
 albine:-2,
 porcelain:-0.8,
 fair:0.2,
 light:1.4,
 medium:2.6,
 tan:3.8,
 black:4.8,
 "black-dark":6.8,
};

export const defaultIdentitySelections:IdentitySelections={eyeColor:"brown",skinTone:"fair",hairColor:"dark-brown"};
export function colorOption(categoryId:string,optionId:string){return colorCategories.find(c=>c.id===categoryId)?.options.find(o=>o.id===optionId)}

export function buildIdentityPrompt(args:{ancestryLabel?:string;selections:IdentitySelections;mediaValues:Record<string,string>;customValues:Record<string,string>}){
 const eyebrowValue=(args.mediaValues.eyebrows||args.customValues.eyebrows||"").trim();
 const lipsValue=(args.mediaValues.lips||args.customValues.lips||"").trim();
 const hairstyleValue=(args.mediaValues.hairstyle||args.customValues.hairstyle||"").trim();
 const hairColor=colorOption("hairColor",args.selections.hairColor)?.prompt||
   (args.selections.hairColor==="custom"&&args.customValues.hairColor?.trim()?`${args.customValues.hairColor.trim()} hair color`:"");
 const colorsWithoutHair=colorCategories
   .filter(c=>c.id!=="hairColor")
   .map(c=>{
     const chosen=args.selections[c.id];
     if(chosen==="custom") return args.customValues[c.id]?.trim()?`${args.customValues[c.id].trim()} ${c.id.replace("Color"," color").replace("skinTone","skin tone")}`:"";
     return colorOption(c.id,chosen)?.prompt||"";
   });
 const hairDescription=[hairColor,hairstyleValue?`${hairstyleValue} hair style`:""].filter(Boolean).join(", ");
 const eyebrowDescription=eyebrowValue?`${eyebrowValue} eyebrow shape`:"";
 const lipsDescription=lipsValue?`${lipsValue} lip shape`:"";
 const pieces=[
   "instapic",
   FACE_TRIGGER,
   args.ancestryLabel?`beautiful woman of ${args.ancestryLabel} ancestry`:"beautiful woman",
   ...colorsWithoutHair,
   hairDescription,
   eyebrowDescription,
   lipsDescription,
   "realistic skin texture",
   "fine pores",
   "highly detailed eyes",
   "realistic hair strands",
   "front-facing beauty portrait",
   "85mm photography",
 ];
 return {prompt:pieces.filter(Boolean).join(", "),negativePrompt:""};
}
