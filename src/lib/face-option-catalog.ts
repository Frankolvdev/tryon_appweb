"use client";

export type FaceOption = {
  id: string;
  label: string;
  prompt: string;
  negative?: string;
  tone?: string;
};

export type FaceCategory = {
  id: string;
  label: string;
  hint: string;
  options: FaceOption[];
};

export type FaceSelections = Record<string,string>;

export const FACE_TRIGGER = "4ng3l face, nude";

export const faceCategories: FaceCategory[] = [
  {
    id:"heritage", label:"Heritage", hint:"Origen visual",
    options:[
      {id:"eastern-european",label:"Eastern European",prompt:"Eastern European heritage, refined Slavic-inspired facial harmony"},
      {id:"latina",label:"Latina",prompt:"Latin American heritage, harmonious feminine facial features"},
      {id:"east-asian",label:"East Asian",prompt:"East Asian heritage, harmonious feminine facial features"},
      {id:"mediterranean",label:"Mediterranean",prompt:"Mediterranean heritage, harmonious feminine facial features"},
      {id:"middle-eastern",label:"Middle Eastern",prompt:"Middle Eastern heritage, harmonious feminine facial features"},
      {id:"mixed",label:"Mixed",prompt:"mixed heritage, globally harmonious feminine facial features"},
    ]
  },
  {
    id:"age",label:"Apparent age",hint:"Apariencia",
    options:[
      {id:"young-adult",label:"Young adult",prompt:"beautiful young adult woman"},
      {id:"adult",label:"Adult",prompt:"beautiful adult woman"},
      {id:"mature",label:"Mature",prompt:"beautiful mature adult woman"},
    ]
  },
  {
    id:"faceShape",label:"Face shape",hint:"Estructura general",
    options:[
      {id:"oval",label:"Oval",prompt:"oval face, harmonious feminine facial proportions"},
      {id:"heart",label:"Heart",prompt:"heart-shaped face, gently tapered lower face"},
      {id:"oval-heart",label:"Oval Heart",prompt:"elongated oval face with a subtle heart-shaped structure, slender feminine face"},
      {id:"round",label:"Round",prompt:"soft round face, smooth feminine facial contour"},
      {id:"diamond",label:"Diamond",prompt:"diamond-shaped face, prominent cheekbones, narrow forehead and chin"},
      {id:"square",label:"Soft Square",prompt:"soft square face, balanced jaw width, feminine softened angles"},
    ]
  },
  {
    id:"eyeShape",label:"Eye shape",hint:"Forma",
    options:[
      {id:"almond",label:"Almond",prompt:"large almond-shaped eyes"},
      {id:"upturned",label:"Upturned",prompt:"large almond-shaped eyes, subtly upturned outer eye corners"},
      {id:"round",label:"Round",prompt:"large open round eyes"},
      {id:"hooded",label:"Hooded",prompt:"elegant hooded almond-shaped eyes"},
      {id:"deep-set",label:"Deep set",prompt:"deep-set almond-shaped eyes with dimensional eyelids"},
    ]
  },
  {
    id:"eyeSpacing",label:"Eye spacing",hint:"Separación",
    options:[
      {id:"balanced",label:"Balanced",prompt:"balanced eye spacing"},
      {id:"slightly-wide",label:"Slightly wide",prompt:"slightly wide-set eyes"},
      {id:"wide",label:"Wide",prompt:"wide-set eyes"},
      {id:"close",label:"Close",prompt:"slightly close-set eyes"},
    ]
  },
  {
    id:"eyeColor",label:"Eye color",hint:"Color de iris",
    options:[
      {id:"blue",label:"Blue",tone:"#5aa8ff",prompt:"(bright vivid blue eyes:1.35), (clear saturated blue irises:1.30), pure cool blue eye color, crystal blue irises, uniform blue pigmentation throughout both irises, defined dark blue limbal rings, both eyes have exactly the same blue iris color, no green tint, no hazel tint, no gray-green tones",negative:"green eyes, hazel eyes, gray-green eyes, heterochromia"},
      {id:"green",label:"Green",tone:"#58b66c",prompt:"(bright vivid green eyes:1.35), clear saturated emerald-green irises, pure green eye color, uniform green pigmentation throughout both irises, both eyes have exactly the same green iris color, no blue tint, no hazel tint",negative:"blue eyes, hazel eyes, gray eyes, heterochromia"},
      {id:"hazel",label:"Hazel",tone:"#9b8244",prompt:"clear warm hazel irises, balanced amber-green pigmentation, realistic detailed hazel eyes, matching iris color in both eyes"},
      {id:"brown",label:"Brown",tone:"#6b3f28",prompt:"rich deep brown eyes, uniform warm brown irises, detailed dark limbal rings, matching brown iris color in both eyes"},
      {id:"gray",label:"Gray",tone:"#9aa3ad",prompt:"clear cool gray eyes, silver-gray irises, uniform neutral gray pigmentation, no green tint"},
    ]
  },
  {
    id:"eyebrows",label:"Eyebrows",hint:"Forma",
    options:[
      {id:"soft-arch",label:"Soft arch",prompt:"full naturally shaped eyebrows, defined soft arch, realistic individual eyebrow hairs"},
      {id:"straight",label:"Straight",prompt:"full straight natural eyebrows, softly tapered tails, realistic individual eyebrow hairs"},
      {id:"high-arch",label:"High arch",prompt:"defined high-arched eyebrows, clean tapered tails, realistic individual eyebrow hairs"},
      {id:"thick",label:"Thick",prompt:"thick dense naturally shaped eyebrows, realistic individual eyebrow hairs"},
    ]
  },
  {
    id:"nose",label:"Nose",hint:"Forma",
    options:[
      {id:"small-straight",label:"Small straight",prompt:"small refined straight nose, narrow straight nose bridge, softly defined nose tip"},
      {id:"button",label:"Button",prompt:"small refined button nose, short smooth bridge, softly rounded subtly upturned tip"},
      {id:"slender",label:"Slender",prompt:"slender narrow feminine nose, long smooth straight bridge, small refined tip"},
      {id:"soft-upturned",label:"Soft upturned",prompt:"small straight nose with a subtly upturned refined tip"},
    ]
  },
  {
    id:"lips",label:"Lips",hint:"Forma y volumen",
    options:[
      {id:"balanced",label:"Balanced",prompt:"well-defined feminine lips, soft cupid's bow, balanced upper and lower lip proportions"},
      {id:"full",label:"Full",prompt:"full highly defined feminine lips, pronounced cupid's bow, plump rounded lip shape, slightly fuller lower lip"},
      {id:"heart",label:"Heart",prompt:"full heart-shaped lips, pronounced cupid's bow, softly rounded lower lip"},
      {id:"natural",label:"Natural",prompt:"natural medium-full lips, subtle cupid's bow, soft rosy-pink lip tone"},
    ]
  },
  {
    id:"cheekbones",label:"Cheekbones",hint:"Definición",
    options:[
      {id:"soft",label:"Soft",prompt:"softly defined cheek structure"},
      {id:"high",label:"High",prompt:"high prominent cheekbones, defined sculpted cheek structure"},
      {id:"medium",label:"Medium",prompt:"moderately high defined cheekbones, softly sculpted cheeks"},
    ]
  },
  {
    id:"jawline",label:"Jawline",hint:"Contorno",
    options:[
      {id:"soft",label:"Soft",prompt:"softly defined feminine jawline, smooth jaw contour"},
      {id:"defined",label:"Defined",prompt:"slender sharply defined feminine jawline, gently tapered lower face"},
      {id:"angular",label:"Angular",prompt:"defined angular feminine jawline with softened elegant corners"},
    ]
  },
  {
    id:"chin",label:"Chin",hint:"Forma",
    options:[
      {id:"rounded",label:"Rounded",prompt:"small balanced rounded chin"},
      {id:"pointed",label:"Soft pointed",prompt:"small softly pointed chin, balanced feminine chin projection"},
      {id:"narrow",label:"Narrow",prompt:"small narrow rounded chin, subtle chin projection"},
    ]
  },
  {
    id:"freckles",label:"Freckles",hint:"Detalle de piel",
    options:[
      {id:"none",label:"None",prompt:"clean even complexion"},
      {id:"light",label:"Light",prompt:"subtle light natural freckles across the nose and upper cheeks"},
      {id:"medium",label:"Medium",prompt:"natural visible freckles across the nose and cheeks"},
    ]
  },
  {
    id:"hairColor",label:"Hair color",hint:"Color",
    options:[
      {id:"black",label:"Black",tone:"#111214",prompt:"long pure jet-black hair, naturally black hair, uniform deep black hair color from roots to ends, neutral black tones, no brown or brunette tones"},
      {id:"dark-brown",label:"Dark brown",tone:"#3b241c",prompt:"rich deep chocolate-brown hair, uniform dark brown pigmentation from roots to ends, neutral-to-cool brunette tone, no black tones, no red or copper tones"},
      {id:"blonde",label:"Blonde",tone:"#d7bd79",prompt:"bright clean blonde hair color, uniform pale golden-blonde pigmentation from roots to ends, soft neutral blonde tone, no brown or red tones"},
      {id:"pink",label:"Pink",tone:"#ed78b6",prompt:"vivid pure pink hair, uniform saturated pink hair color from roots to ends, clean bright pink tone, consistent pink pigmentation throughout, no brown, blonde, red, copper, purple or violet tones"},
      {id:"pure-red",label:"Pure red",tone:"#b91c2d",prompt:"hair dyed an intense saturated primary-red fashion color, uniform vivid red pigmentation from roots to ends, cool pure red tone, intentionally fashion-dyed red rather than naturally redheaded, zero orange, copper, ginger or auburn hue",negative:"natural redhead, ginger hair, orange hair, copper hair, auburn hair, strawberry blonde"},
      {id:"crimson",label:"Dark crimson",tone:"#741b2c",prompt:"hair dyed a deep vivid crimson-red color, rich dark cherry-red hair, uniform deep crimson pigmentation from roots to ends, cool-toned red hair dye, no orange, copper, ginger or auburn tones",negative:"ginger hair, orange hair, copper hair, auburn hair"},
    ]
  },
  {
    id:"hairLength",label:"Hair length",hint:"Largo",
    options:[
      {id:"short",label:"Short",prompt:"short hair"},
      {id:"medium",label:"Medium",prompt:"medium-length hair reaching the shoulders"},
      {id:"long",label:"Long",prompt:"long hair extending below the shoulders"},
      {id:"very-long",label:"Very long",prompt:"very long hair extending far below the shoulders"},
    ]
  },
  {
    id:"hairTexture",label:"Hair texture",hint:"Textura",
    options:[
      {id:"straight",label:"Straight",prompt:"(perfectly pin-straight hair:1.45), (ultra-straight flat-ironed hair:1.40), sleek glass-straight hair, completely straight hair from roots to ends, long perfectly linear smooth hair strands, no waves, no curls, no bends, no fluffy volume",negative:"wavy hair, waves, curly hair, curls, ringlets, bent hair, flipped ends, fluffy hair"},
      {id:"soft-wavy",label:"Soft wavy",prompt:"smooth soft-wavy hair, large loose flowing waves, silky realistic hair texture"},
      {id:"wavy",label:"Wavy",prompt:"defined natural wavy hair, flowing S-shaped waves, realistic silky strands"},
      {id:"curly",label:"Curly",prompt:"defined natural curly hair, consistent soft curls from roots to ends"},
    ]
  },
  {
    id:"hairPart",label:"Hair part",hint:"Raya",
    options:[
      {id:"center",label:"Center",prompt:"precise center part"},
      {id:"left",label:"Left",prompt:"clean left side part"},
      {id:"right",label:"Right",prompt:"clean right side part"},
      {id:"deep-side",label:"Deep side",prompt:"deep elegant side part"},
    ]
  },
  {
    id:"hairstyle",label:"Hairstyle",hint:"Peinado",
    options:[
      {id:"loose",label:"Loose",prompt:"hair worn loose, flowing naturally around both sides of the face"},
      {id:"behind-ears",label:"Behind ears",prompt:"hair worn loose, front sections swept neatly behind the ears"},
      {id:"face-framing",label:"Face framing",prompt:"long face-framing front sections, hair falling naturally around both sides of the face"},
      {id:"sleek",label:"Sleek",prompt:"sleek controlled hairstyle, smooth polished strands, minimal flyaways"},
    ]
  },
];

export const defaultFaceSelections: FaceSelections = Object.fromEntries(
  faceCategories.map(category=>[category.id, category.options[0]?.id ?? ""])
);

export function optionFor(categoryId:string, optionId:string){
  return faceCategories.find(c=>c.id===categoryId)?.options.find(o=>o.id===optionId);
}

export function buildFacePrompt(selections:FaceSelections, ancestryLabel?:string){
  const selected = faceCategories
    .filter(category=>!(ancestryLabel && category.id==="heritage"))
    .map(category=>optionFor(category.id,selections[category.id] ?? ""))
    .filter((item):item is FaceOption=>Boolean(item));

  const pieces = [
    FACE_TRIGGER,
    "",
    "photorealistic",
    ancestryLabel ? `beautiful young adult woman of ${ancestryLabel} ancestry` : "",
    ...selected.map(item=>item.prompt),
    "smooth natural skin, subtle realistic skin texture, fine pores, even complexion",
    "attractive balanced facial structure, subtle natural facial asymmetry",
    "highly detailed realistic face, realistic facial anatomy",
    "realistic eyes with highly detailed irises, natural eye reflections and catchlights",
    "natural eyelashes, detailed individual eyebrow hairs",
    "natural feminine hairline, realistic individual hair strands",
    "consistent facial identity",
    "Tumblr, realism, cute beautiful appearance, soft feminine aesthetic, clean glamorous beauty aesthetic",
    "professional close-up beauty portrait, front-facing composition, face centered toward camera",
    "soft diffused lighting, gentle dimensional facial lighting",
    "85mm portrait photography, shallow depth of field",
    "sharp focus on eyes and facial features, high facial detail, realistic skin and hair detail",
    "photorealistic",
  ];

  const negative = [...new Set(selected.flatMap(item=>(item.negative??"").split(",").map(v=>v.trim()).filter(Boolean)))];

  return {
    prompt: pieces.filter(Boolean).join(",\n"),
    negativePrompt: negative.join(", "),
  };
}
