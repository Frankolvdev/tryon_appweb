"use client";

export type ColorOption={id:string;label:string;tone:string;prompt:string;negative?:string};
export type ColorCategory={id:"eyeColor"|"skinTone"|"hairColor";label:string;hint:string;options:ColorOption[]};
export type IdentitySelections=Record<string,string>;
export const FACE_TRIGGER="4ng3l face";

export const colorCategories:ColorCategory[]=[
 {id:"eyeColor",label:"Eye color",hint:"Color de iris",options:[
  {id:"blue",label:"Blue",tone:"#6ca9d9",prompt:"clear light blue irises, matching blue eye color in both eyes"},
  {id:"green",label:"Green",tone:"#6d996b",prompt:"clear natural green irises, matching green eye color in both eyes"},
  {id:"hazel",label:"Hazel",tone:"#8f7a45",prompt:"warm hazel irises with subtle green and amber variation"},
  {id:"brown",label:"Brown",tone:"#704633",prompt:"rich natural brown irises, matching brown eye color in both eyes"},
  {id:"dark-brown",label:"Dark brown",tone:"#3f2a24",prompt:"deep dark-brown irises, matching dark eye color in both eyes"},
  {id:"gray",label:"Gray",tone:"#9299a1",prompt:"clear cool gray irises, matching gray eye color in both eyes"},
 ]},
 {id:"skinTone",label:"Skin tone",hint:"Tono de piel",options:[
  {id:"porcelain",label:"Porcelain",tone:"#ead4c9",prompt:"porcelain skin tone"},
  {id:"fair",label:"Fair",tone:"#d9b8a7",prompt:"fair skin tone"},
  {id:"light",label:"Light",tone:"#cda18c",prompt:"light skin tone"},
  {id:"medium",label:"Medium",tone:"#a9765d",prompt:"medium skin tone"},
  {id:"tan",label:"Tan",tone:"#8e5f49",prompt:"tan skin tone"},
  {id:"deep",label:"Deep",tone:"#55362d",prompt:"deep skin tone"},
 ]},
 {id:"hairColor",label:"Hair color",hint:"Color de cabello",options:[
  {id:"black",label:"Black",tone:"#111214",prompt:"pure jet-black hair color from roots to ends"},
  {id:"dark-brown",label:"Dark brown",tone:"#3a251f",prompt:"rich deep dark-brown hair color"},
  {id:"brown",label:"Brown",tone:"#654434",prompt:"natural medium brown hair color"},
  {id:"light-brown",label:"Light brown",tone:"#94705a",prompt:"soft light-brown hair color"},
  {id:"blonde",label:"Blonde",tone:"#cbb47c",prompt:"natural neutral blonde hair color"},
  {id:"platinum",label:"Platinum",tone:"#dedbd2",prompt:"cool pale platinum-blonde hair color"},
  {id:"auburn",label:"Auburn",tone:"#7a3529",prompt:"rich natural auburn hair color"},
  {id:"red",label:"Red",tone:"#9d272b",prompt:"vivid fashion red hair color"},
  {id:"blue",label:"Blue",tone:"#315f9f",prompt:"vivid fashion blue hair color"},
  {id:"purple",label:"Purple",tone:"#6f4aa8",prompt:"vivid fashion purple hair color"},
  {id:"pink",label:"Pink",tone:"#d97c9f",prompt:"soft fashion pink hair color"},
  {id:"rose-gold",label:"Rose gold",tone:"#c98e85",prompt:"soft rose-gold fashion hair color"},
  {id:"silver",label:"Silver",tone:"#aaaeb8",prompt:"cool metallic silver hair color"},
 ]},
];

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
 const extra=args.customValues.extraDetails?.trim()||"";
 const pieces=[FACE_TRIGGER,"photorealistic",args.ancestryLabel?`beautiful young adult woman of ${args.ancestryLabel} ancestry`:"beautiful young adult woman",...colorsWithoutHair,hairDescription,eyebrowDescription,lipsDescription,extra,"realistic skin texture, fine pores, highly detailed eyes, realistic hair strands","front-facing professional beauty portrait, neutral-cool soft beauty lighting, 85mm photography","consistent facial identity"];
 return {prompt:pieces.filter(Boolean).join(",\n"),negativePrompt:""};
}
