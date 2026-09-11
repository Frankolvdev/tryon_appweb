export type OccupationLocale = "es" | "en";
export type OccupationOption = { id: string; es: string; en: string };

export const OCCUPATIONS: OccupationOption[] = [
 { id: "doctor", es: "Doctora", en: "Doctor" },
 { id: "nurse", es: "Enfermera", en: "Nurse" },
 { id: "teacher", es: "Profesora", en: "Teacher" },
 { id: "engineer", es: "Ingeniera", en: "Engineer" },
 { id: "lawyer", es: "Abogada", en: "Lawyer" },
 { id: "business-owner", es: "Empresaria", en: "Business Owner" },
 { id: "student", es: "Estudiante", en: "Student" },
 { id: "software-developer", es: "Desarrolladora de software", en: "Software Developer" },
 { id: "architect", es: "Arquitecta", en: "Architect" },
 { id: "chef", es: "Chef", en: "Chef" },
 { id: "photographer", es: "Fotógrafa", en: "Photographer" },
 { id: "model", es: "Modelo", en: "Model" },
 { id: "accountant", es: "Contadora", en: "Accountant" },
 { id: "administrator", es: "Administradora", en: "Administrator" },
 { id: "salesperson", es: "Vendedora", en: "Salesperson" },
 { id: "marketing-specialist", es: "Especialista en marketing", en: "Marketing Specialist" },
 { id: "graphic-designer", es: "Diseñadora gráfica", en: "Graphic Designer" },
 { id: "web-designer", es: "Diseñadora web", en: "Web Designer" },
 { id: "data-analyst", es: "Analista de datos", en: "Data Analyst" },
 { id: "data-scientist", es: "Científica de datos", en: "Data Scientist" },
 { id: "product-manager", es: "Gerente de producto", en: "Product Manager" },
 { id: "project-manager", es: "Gerente de proyectos", en: "Project Manager" },
 { id: "human-resources", es: "Recursos humanos", en: "Human Resources" },
 { id: "recruiter", es: "Reclutadora", en: "Recruiter" },
 { id: "psychologist", es: "Psicóloga", en: "Psychologist" },
 { id: "therapist", es: "Terapeuta", en: "Therapist" },
 { id: "dentist", es: "Dentista", en: "Dentist" },
 { id: "pharmacist", es: "Farmacéutica", en: "Pharmacist" },
 { id: "veterinarian", es: "Veterinaria", en: "Veterinarian" },
 { id: "surgeon", es: "Cirujana", en: "Surgeon" },
 { id: "paramedic", es: "Paramédica", en: "Paramedic" },
 { id: "physical-therapist", es: "Fisioterapeuta", en: "Physical Therapist" },
 { id: "nutritionist", es: "Nutrióloga", en: "Nutritionist" },
 { id: "scientist", es: "Científica", en: "Scientist" },
 { id: "researcher", es: "Investigadora", en: "Researcher" },
 { id: "biologist", es: "Bióloga", en: "Biologist" },
 { id: "chemist", es: "Química", en: "Chemist" },
 { id: "physicist", es: "Física", en: "Physicist" },
 { id: "civil-engineer", es: "Ingeniera civil", en: "Civil Engineer" },
 { id: "mechanical-engineer", es: "Ingeniera mecánica", en: "Mechanical Engineer" },
 { id: "electrical-engineer", es: "Ingeniera eléctrica", en: "Electrical Engineer" },
 { id: "industrial-engineer", es: "Ingeniera industrial", en: "Industrial Engineer" },
 { id: "aerospace-engineer", es: "Ingeniera aeroespacial", en: "Aerospace Engineer" },
 { id: "ai-engineer", es: "Ingeniera de IA", en: "AI Engineer" },
 { id: "cybersecurity-specialist", es: "Especialista en ciberseguridad", en: "Cybersecurity Specialist" },
 { id: "network-engineer", es: "Ingeniera de redes", en: "Network Engineer" },
 { id: "it-support", es: "Soporte técnico", en: "IT Support" },
 { id: "database-administrator", es: "Administradora de bases de datos", en: "Database Administrator" },
 { id: "ux-designer", es: "Diseñadora UX", en: "UX Designer" },
 { id: "ui-designer", es: "Diseñadora UI", en: "UI Designer" },
 { id: "illustrator", es: "Ilustradora", en: "Illustrator" },
 { id: "animator", es: "Animadora", en: "Animator" },
 { id: "video-editor", es: "Editora de video", en: "Video Editor" },
 { id: "filmmaker", es: "Cineasta", en: "Filmmaker" },
 { id: "director", es: "Directora", en: "Director" },
 { id: "producer", es: "Productora", en: "Producer" },
 { id: "actor", es: "Actriz", en: "Actor" },
 { id: "musician", es: "Música", en: "Musician" },
 { id: "singer", es: "Cantante", en: "Singer" },
 { id: "dancer", es: "Bailarina", en: "Dancer" },
 { id: "writer", es: "Escritora", en: "Writer" },
 { id: "journalist", es: "Periodista", en: "Journalist" },
 { id: "content-creator", es: "Creadora de contenido", en: "Content Creator" },
 { id: "influencer", es: "Influencer", en: "Influencer" },
 { id: "social-media-manager", es: "Encargada de redes sociales", en: "Social Media Manager" },
 { id: "public-relations", es: "Especialista en relaciones públicas", en: "Public Relations Specialist" },
 { id: "copywriter", es: "Redactora publicitaria", en: "Copywriter" },
 { id: "translator", es: "Traductora", en: "Translator" },
 { id: "interpreter", es: "Intérprete", en: "Interpreter" },
 { id: "librarian", es: "Bibliotecaria", en: "Librarian" },
 { id: "professor", es: "Profesora universitaria", en: "University Professor" },
 { id: "school-principal", es: "Directora escolar", en: "School Principal" },
 { id: "coach", es: "Entrenadora", en: "Coach" },
 { id: "personal-trainer", es: "Entrenadora personal", en: "Personal Trainer" },
 { id: "athlete", es: "Atleta", en: "Athlete" },
 { id: "yoga-instructor", es: "Instructora de yoga", en: "Yoga Instructor" },
 { id: "fitness-instructor", es: "Instructora fitness", en: "Fitness Instructor" },
 { id: "police-officer", es: "Policía", en: "Police Officer" },
 { id: "firefighter", es: "Bombera", en: "Firefighter" },
 { id: "military-officer", es: "Militar", en: "Military Officer" },
 { id: "security-guard", es: "Guardia de seguridad", en: "Security Guard" },
 { id: "detective", es: "Detective", en: "Detective" },
 { id: "judge", es: "Jueza", en: "Judge" },
 { id: "paralegal", es: "Asistente legal", en: "Paralegal" },
 { id: "real-estate-agent", es: "Agente inmobiliario", en: "Real Estate Agent" },
 { id: "insurance-agent", es: "Agente de seguros", en: "Insurance Agent" },
 { id: "banker", es: "Banquera", en: "Banker" },
 { id: "financial-advisor", es: "Asesora financiera", en: "Financial Advisor" },
 { id: "economist", es: "Economista", en: "Economist" },
 { id: "investment-analyst", es: "Analista de inversiones", en: "Investment Analyst" },
 { id: "entrepreneur", es: "Emprendedora", en: "Entrepreneur" },
 { id: "consultant", es: "Consultora", en: "Consultant" },
 { id: "operations-manager", es: "Gerente de operaciones", en: "Operations Manager" },
 { id: "store-manager", es: "Gerente de tienda", en: "Store Manager" },
 { id: "customer-service", es: "Atención al cliente", en: "Customer Service" },
 { id: "receptionist", es: "Recepcionista", en: "Receptionist" },
 { id: "executive-assistant", es: "Asistente ejecutiva", en: "Executive Assistant" },
 { id: "secretary", es: "Secretaria", en: "Secretary" },
 { id: "office-worker", es: "Oficinista", en: "Office Worker" },
 { id: "barista", es: "Barista", en: "Barista" },
 { id: "bartender", es: "Bartender", en: "Bartender" },
 { id: "waiter", es: "Mesera", en: "Waitress" },
 { id: "baker", es: "Panadera", en: "Baker" },
 { id: "pastry-chef", es: "Repostera", en: "Pastry Chef" },
 { id: "butcher", es: "Carnicera", en: "Butcher" },
 { id: "farmer", es: "Agricultora", en: "Farmer" },
 { id: "gardener", es: "Jardinera", en: "Gardener" },
 { id: "florist", es: "Florista", en: "Florist" },
 { id: "fashion-designer", es: "Diseñadora de moda", en: "Fashion Designer" },
 { id: "stylist", es: "Estilista", en: "Stylist" },
 { id: "hair-stylist", es: "Peluquera", en: "Hair Stylist" },
 { id: "makeup-artist", es: "Maquillista", en: "Makeup Artist" },
 { id: "nail-technician", es: "Manicurista", en: "Nail Technician" },
 { id: "esthetician", es: "Cosmetóloga", en: "Esthetician" },
 { id: "tailor", es: "Modista", en: "Tailor" },
 { id: "jeweler", es: "Joyera", en: "Jeweler" },
 { id: "interior-designer", es: "Diseñadora de interiores", en: "Interior Designer" },
 { id: "construction-worker", es: "Trabajadora de obra", en: "Construction Worker" },
 { id: "carpenter", es: "Carpintera", en: "Carpenter" },
 { id: "electrician", es: "Electricista", en: "Electrician" },
 { id: "plumber", es: "Plomera", en: "Plumber" },
 { id: "welder", es: "Soldadora", en: "Welder" },
 { id: "mechanic", es: "Mecánica", en: "Auto Mechanic" },
 { id: "truck-driver", es: "Camionera", en: "Truck Driver" },
 { id: "delivery-driver", es: "Repartidora", en: "Delivery Driver" },
 { id: "taxi-driver", es: "Taxista", en: "Taxi Driver" },
 { id: "pilot", es: "Piloto", en: "Pilot" },
 { id: "flight-attendant", es: "Azafata", en: "Flight Attendant" },
 { id: "travel-agent", es: "Agente de viajes", en: "Travel Agent" },
 { id: "tour-guide", es: "Guía turística", en: "Tour Guide" },
 { id: "hotel-manager", es: "Gerente de hotel", en: "Hotel Manager" },
 { id: "housekeeper", es: "Camarera de hotel", en: "Hotel Housekeeper" },
 { id: "caregiver", es: "Cuidadora", en: "Caregiver" },
 { id: "social-worker", es: "Trabajadora social", en: "Social Worker" },
 { id: "childcare-worker", es: "Cuidadora infantil", en: "Childcare Worker" },
 { id: "stay-at-home-parent", es: "Ama de casa", en: "Homemaker" },
 { id: "retired", es: "Jubilada", en: "Retired" },
 { id: "freelancer", es: "Freelancer", en: "Freelancer" },
 { id: "remote-worker", es: "Trabajadora remota", en: "Remote Worker" },
 { id: "unemployed", es: "Sin empleo", en: "Unemployed" },
];

export function getOccupationLabel(id: string | undefined, locale: OccupationLocale = "es") {
 if (!id) return "";
 const option = OCCUPATIONS.find((item) => item.id === id);
 return option ? option[locale] : "";
}

export function getOccupationPromptValue(id: string | undefined, customValue?: string) {
 if (!id) return "";
 if (id === "custom") return customValue?.trim() || "";
 return OCCUPATIONS.find((item) => item.id === id)?.en || "";
}

export type OccupationGenerationContext = {
 place: string;
 clothes: string;
};

// Keep outfit prompting local and deterministic. Each catalog occupation gets a
// concrete wardrobe direction instead of vague style labels.
const OCCUPATION_CLOTHES: Record<string, string> = {
 doctor: "wear a crisp white medical coat over a fitted pale-blue blouse, tailored navy trousers, clean black leather pumps, a stethoscope and subtle accessories, doctor outfit",
 nurse: "wear a light-blue fitted nurse scrub top, matching tapered scrub pants, a classic white nurse cap, white clinical sneakers, a simple nurse badge and practical watch, clean nurse uniform",
 teacher: "wear a fitted soft knit top tucked into a high-waisted pleated miniskirt, cropped fitted blazer, sheer tights, heeled ankle boots",
 engineer: "wear a fitted button-up blouse, high-waisted tailored trousers, structured lightweight blazer, sleek ankle boots, modern engineering outfit, practical, feminine",
 lawyer: "wear a fitted ivory blouse, high-waisted pencil skirt, sharply tailored blazer, closed-toe heels, realistic lawyer outfit",
 "business-owner": "wear a luxury fitted blouse, high-waisted tailored wide-leg trousers, cropped structured blazer, heels, confident upscale entrepreneur outfit",
 student: "wear a cute red plaid pleated mini skirt, fitted white crop top, cropped cardigan, red high heels, fashionable campus outfit",
 "software-developer": "wear a fitted premium ribbed top, high-waisted dark jeans, cropped smart blazer, clean minimalist sneakers, modern stylish software-developer outfit, comfortable",
 architect: "wear a fitted black mock-neck top, high-waisted tailored trousers, architectural-cut blazer, sleek ankle boots, minimalist designer architect outfit",
 chef: "wear a crisp white double-breasted chef jacket, tailored black chef trousers, black waist apron, tall white chef toque, black non-slip shoes and a neat neckerchief, chef uniform, clean",
 photographer: "wear a fitted black top, high-waisted utility trousers, cropped leather jacket, ankle boots, discreet camera-utility belt, fashionable photographer outfit, realistic",
 model: "wear a fashion-forward fitted designer top, high-waisted mini skirt, heels, editorial accessories, glamorous model off-duty outfit",
 accountant: "wear a fitted satin blouse, high-waisted tailored trousers, slim blazer, classic pumps, realistic accountant office outfit",
 administrator: "wear a fitted blouse, high-waisted pencil skirt, tailored blazer, low heels, administrative outfit",
 salesperson: "wear a fitted fashionable blouse, sleek high-waisted trousers, cropped blazer, heels, upscale retail sales outfit, approachable",
 "marketing-specialist": "wear a fashionable fitted blouse, high-waisted tailored trousers, statement cropped blazer, stylish heels, creative corporate marketing outfit",
 "graphic-designer": "wear a fitted modern top, high-waisted wide-leg trousers, cropped creative jacket, stylish sneakers, statement accessories, graphic-designer outfit",
 "web-designer": "wear a fitted minimalist top, high-waisted tailored jeans, lightweight cropped blazer, clean sneakers, modern digital-creative outfit, stylish",
 "data-analyst": "wear a fitted knit blouse, high-waisted tailored trousers, clean structured blazer, loafers, smart modern data-analyst outfit",
 "data-scientist": "wear a fitted smart-casual blouse, tailored high-waisted trousers, modern blazer, minimalist sneakers, technology outfit",
 "product-manager": "wear a premium fitted top, high-waisted tailored trousers, sharp cropped blazer, pumps, confident modern product-manager outfit",
 "project-manager": "wear a fitted blouse, tailored high-waisted trousers, structured blazer, low heels, organized executive project-manager outfit",
 "human-resources": "wear a soft fitted blouse, high-waisted miniskirt, blazer, pumps, approachable human-resources outfit",
 recruiter: "wear a fitted blouse, tailored ankle trousers, cropped blazer, chic low heels, recruiter outfit, approachable",
 psychologist: "wear a soft fitted knit blouse, miniskirt, light tailored cardigan, low heels, warm psychologist outfit",
 therapist: "wear a soft fitted blouse, high-waisted flowing miniskirt, cardigan, flats, calm approachable therapist outfit",
 dentist: "wear a mint-green fitted dental scrub top, matching tapered scrub pants, short white clinical coat, white clinical shoes, protective glasses and a neat disposable-style surgical cap, dentist outfit, practical",
 pharmacist: "wear a crisp white pharmacist coat over a fitted light-blue blouse, tailored navy trousers, comfortable black loafers, a discreet pharmacy badge and neat accessories, pharmacist outfit",
 veterinarian: "wear a teal fitted veterinary scrub top, matching tapered scrub pants, lightweight white clinic coat, clean white sneakers, a stethoscope and subtle animal-clinic accessories, veterinarian outfit",
 surgeon: "wear a teal fitted surgical scrub top, matching scrub trousers, a matching surgical cap, clean clinical clogs, a lightweight surgical mask resting neatly at the neck and minimal clinical accessories, authentic surgeon outfit, realistic",
 paramedic: "wear a navy fitted paramedic polo, dark navy medical cargo trousers with reflective yellow details, utility belt, sturdy black boots and a compact radio accessory, authentic paramedic uniform, practical",
 "physical-therapist": "wear a fitted athletic polo, tailored stretch trousers, clean supportive sneakers, minimal clinic accessories, physical-therapist outfit",
 nutritionist: "wear a fitted blouse, high-waisted tailored trousers, light clinical coat, low heels, clean modern nutritionist outfit",
 scientist: "wear a fitted blouse and tailored trousers under a clean laboratory coat, closed-toe lab shoes, subtle safety glasses, realistic scientist outfit",
 researcher: "wear a fitted smart blouse, tailored trousers, clean research lab coat, closed-toe shoes, understated accessories, realistic researcher outfit",
 biologist: "wear a fitted practical blouse, tailored lab trousers, clean laboratory coat, closed-toe shoes, subtle lab accessories, realistic biologist outfit",
 chemist: "wear a fitted top and tailored trousers under a clean lab coat, safety glasses, closed-toe laboratory shoes, realistic chemist outfit",
 physicist: "wear a fitted smart-casual blouse, high-waisted tailored trousers, minimalist blazer, loafers, physicist outfit",
 "civil-engineer": "wear a fitted white collared shirt, tailored navy utility trousers, bright yellow high-visibility vest, white hard hat, sturdy tan work boots and a slim utility belt, civil-engineer outfit, practical",
 "mechanical-engineer": "wear a fitted steel-blue work shirt, tailored dark utility trousers, clean gray work jacket, white hard hat, protective black boots and practical engineering accessories, mechanical-engineer outfit",
 "electrical-engineer": "wear a fitted navy work shirt, durable khaki utility trousers, bright yellow safety vest, white hard hat, insulated black work boots and protective work gloves, realistic electrical-engineer outfit",
 "industrial-engineer": "wear a fitted blouse, tailored high-waisted trousers, structured blazer with optional safety vest, work shoes, modern industrial-engineer outfit",
 "aerospace-engineer": "wear a fitted technical blouse, tailored trousers, sleek structured jacket, clean work shoes, modern aerospace-engineer outfit",
 "ai-engineer": "wear a fitted premium tech top, high-waisted tailored trousers, minimalist cropped blazer, sleek sneakers, futuristic but realistic AI-engineer outfit",
 "cybersecurity-specialist": "wear a fitted dark mock-neck top, tailored black trousers, structured minimalist blazer, sleek boots, cybersecurity outfit",
 "network-engineer": "wear a fitted technical polo, tailored utility trousers, lightweight smart jacket, clean practical shoes, realistic network-engineer outfit",
 "it-support": "wear a fitted company polo, tailored dark trousers, lightweight utility jacket, clean sneakers, realistic IT-support outfit, practical",
 "database-administrator": "wear a fitted minimalist blouse, high-waisted tailored trousers, clean blazer, stylish loafers, smart database-administrator outfit",
 "ux-designer": "wear a fitted top, high-waisted wide-leg trousers, cropped designer jacket, fashionable sneakers, creative accessories, UX-designer outfit",
 "ui-designer": "wear a fitted modern top, high-waisted tailored trousers, cropped fashion blazer, sleek sneakers, creative-tech outfit",
 illustrator: "wear a fitted artistic top, high-waisted relaxed trousers, cropped creative jacket, stylish ankle boots, subtle artsy accessories, illustrator outfit",
 animator: "wear a fitted graphic knit top, high-waisted casual trousers, cropped jacket, fashionable sneakers, animation-studio outfit",
 "video-editor": "wear a fitted dark top, high-waisted tailored cargo trousers, cropped utility jacket, sleek sneakers, modern video-editor outfit",
 filmmaker: "wear a fitted black top, high-waisted utility trousers, stylish field jacket, ankle boots, subtle production accessories, cinematic filmmaker outfit, realistic",
 director: "wear a fitted black blouse, high-waisted tailored trousers, statement structured jacket, sleek boots, confident film-director outfit, fashionable",
 producer: "wear a fitted blouse, tailored high-waisted trousers, luxury blazer, heels, film-producer outfit",
 actor: "wear a fashionable fitted top, high-waisted tailored trousers, chic cropped jacket, heels, camera-ready actor off-duty outfit",
 musician: "wear a stylish fitted stage-inspired top, high-waisted leather-look trousers, cropped jacket, heeled ankle boots, fashionable musician outfit, glamorous but",
 singer: "wear a fitted performance-inspired top, high-waisted statement skirt, chic cropped jacket, heels, glamorous singer outfit",
 dancer: "wear a fitted long-sleeve dance top, high-waisted performance leggings, light wrap layer, dance shoes, dancer outfit, athletic",
 writer: "wear a fitted soft blouse, high-waisted trousers, cozy tailored cardigan, loafers, writer outfit, stylish",
 journalist: "wear a fitted blouse, high-waisted tailored trousers, practical trench, ankle boots, field-journalist outfit, realistic",
 "content-creator": "wear a trendy fitted cropped top with midriff, high-waisted fashion trousers, stylish jacket, statement heels, camera-ready creator outfit, glamorous",
 influencer: "wear a fashion-forward fitted crop top with midriff, high-waisted mini skirt, chic cropped jacket, heels, influencer outfit, glamorous",
 "social-media-manager": "wear a trendy fitted blouse, high-waisted tailored jeans, cropped blazer, fashionable sneakers, modern social-media outfit",
 "public-relations": "wear a fitted blouse, high-waisted pencil skirt, statement blazer, heels, public-relations outfit",
 copywriter: "wear a fitted creative blouse, high-waisted trousers, cropped casual blazer, stylish loafers, copywriter outfit",
 translator: "wear a fitted blouse, tailored trousers, light blazer, loafers, translator outfit, understated",
 interpreter: "wear a fitted blouse, high-waisted tailored trousers, structured blazer, low heels, interpreter outfit",
 librarian: "wear a fitted knit blouse, high-waisted pleated miniskirt, soft cardigan, loafers, charming modern librarian outfit",
 professor: "wear a fitted turtleneck, high-waisted tailored miniskirt, blazer, loafers, university-professor outfit",
 "school-principal": "wear a fitted blouse, high-waisted pencil skirt, structured blazer, classic pumps, authoritative school-principal outfit",
 coach: "wear a fitted performance polo, high-waisted athletic trousers, lightweight track jacket, clean trainers, coach outfit, sporty",
 "personal-trainer": "wear a fitted athletic top, high-waisted performance leggings, cropped zip jacket, premium training sneakers, stylish personal-trainer outfit, athletic",
 athlete: "wear a fitted performance top, high-waisted athletic leggings, lightweight sport jacket, trainers, realistic athlete outfit",
 "yoga-instructor": "wear a fitted longline yoga top, high-waisted yoga leggings, light wrap jacket, clean studio footwear, yoga-instructor outfit",
 "fitness-instructor": "wear a fitted performance crop top with coverage, high-waisted training leggings, cropped athletic jacket, premium sneakers, energetic fitness-instructor outfit",
 "police-officer": "wear a navy fitted police duty shirt, matching tailored navy uniform trousers, black duty belt, black boots, a navy peaked police cap and restrained badge details, realistic police uniform, non-tactical presentation",
 firefighter: "wear a navy fire-station duty T-shirt, dark station trousers with reflective yellow accents, black duty boots, a bright yellow firefighter helmet and a lightweight station jacket, realistic firefighter outfit",
 "military-officer": "wear a dark-green fitted service uniform jacket, matching tailored trousers, black shoes, restrained gold insignia and a matching peaked service cap, military dress uniform, realistic",
 "security-guard": "wear a navy fitted security shirt, tailored black uniform trousers, black utility belt, black boots, a simple navy security cap and restrained badge details, realistic security-guard uniform, neat",
 detective: "wear a fitted blouse, high-waisted tailored trousers, practical long coat, ankle boots, subtle badge accessory, stylish realistic detective outfit",
 judge: "wear a blouse and tailored skirt beneath a judicial robe, closed-toe shoes, realistic judge outfit, dignified",
 paralegal: "wear a fitted blouse, high-waisted tailored trousers, structured blazer, pumps, paralegal outfit",
 "real-estate-agent": "wear a fitted luxury blouse, high-waisted pencil skirt, tailored blazer, heels, upscale real-estate-agent outfit, confident",
 "insurance-agent": "wear a fitted blouse, tailored high-waisted trousers, classic blazer, pumps, trustworthy insurance-agent outfit",
 banker: "wear a fitted silk blouse, high-waisted tailored trousers, sharp blazer, classic heels, banker outfit",
 "financial-advisor": "wear a fitted blouse, tailored trousers, structured blazer, pumps, premium financial-advisor outfit",
 economist: "wear a fitted blouse, high-waisted tailored trousers, minimalist blazer, loafers, economist outfit",
 "investment-analyst": "wear a fitted silk blouse, high-waisted tailored trousers, sharp blazer, heels, investment-analyst outfit",
 entrepreneur: "wear a fashionable fitted blouse, high-waisted tailored trousers, statement blazer, heels, confident entrepreneur outfit, upscale",
 consultant: "wear a fitted premium blouse, tailored high-waisted trousers, crisp blazer, pumps, consultant outfit",
 "operations-manager": "wear a fitted blouse, tailored trousers, structured blazer, practical shoes, confident operations-manager outfit",
 "store-manager": "wear a fitted fashionable blouse, high-waisted tailored trousers, retail-ready blazer, low heels, store-manager outfit",
 "customer-service": "wear a fitted company blouse, tailored trousers, light blazer, comfortable shoes, approachable customer-service outfit, neat",
 receptionist: "wear a fitted blouse, high-waisted pencil skirt, cropped blazer, low heels, receptionist outfit, welcoming",
 "executive-assistant": "wear a fitted silk blouse, high-waisted tailored trousers, blazer, pumps, executive-assistant outfit",
 secretary: "wear a fitted blouse, high-waisted pencil skirt, tailored cardigan, classic pumps, secretary outfit",
 "office-worker": "wear a fitted smart blouse, high-waisted tailored trousers, cropped blazer, loafers, modern office-worker outfit",
 barista: "wear a fitted white T-shirt, dark high-waisted trousers, brown leather-look barista apron, dark cap and clean black sneakers, stylish cafe barista outfit",
 bartender: "wear a fitted white button-up shirt, black high-waisted trousers, black waistcoat, slim black bow tie, black waist apron and black shoes, classic upscale bartender outfit, stylish",
 waiter: "wear a fitted white button-up blouse, black tailored trousers, black waist apron, slim black necktie and black low heels, classic restaurant waitress uniform, neat",
 baker: "wear a white fitted baker blouse, beige work trousers, striped waist apron, white baker cap, clean non-slip shoes and subtle bakery accessories, charming realistic baker outfit",
 "pastry-chef": "wear a crisp white pastry-chef jacket with pale-pink piping, tailored black trousers, pale-pink waist apron, white chef toque, clean black non-slip shoes and delicate pastry-shop accessories",
 butcher: "wear a clean white butcher coat over a dark fitted work shirt, durable dark trousers, striped protective apron, white butcher cap, sturdy non-slip boots and cut-resistant work gloves, realistic butcher outfit",
 farmer: "wear a fitted light plaid work shirt, high-waisted blue denim jeans, brown work boots, wide-brim straw hat, practical leather belt and light work gloves, charming realistic farmer outfit, practical",
 gardener: "wear a fitted sage-green work shirt, khaki gardening trousers, brown ankle boots, wide-brim sun hat, gardening gloves and a practical waist apron, realistic gardener outfit",
 florist: "wear a fitted cream blouse, sage-green high-waisted trousers, soft pink florist apron, comfortable tan loafers and a delicate floral headband, charming florist outfit",
 "fashion-designer": "wear a fitted black designer blouse, high-waisted cream wide-leg trousers, cropped red statement jacket, black heels, a black beret and a measuring tape worn as a subtle accessory, chic fashion-designer outfit",
 stylist: "wear a trendy fitted top, high-waisted fashion trousers, statement cropped jacket, heels, fashion-stylist outfit, chic",
 "hair-stylist": "wear a fitted black salon top, high-waisted black trousers, sleek black salon apron, fashionable black ankle boots and a slim stylist headband with subtle hair-tool accessories, hair-stylist outfit",
 "makeup-artist": "wear a fitted black top, high-waisted black trousers, sleek utility makeup apron, stylish black ankle boots, a slim black headband and a makeup belt, makeup-artist outfit",
 "nail-technician": "wear a fitted pastel-pink blouse, white high-waisted trousers, pale-pink salon apron, clean white flats and a neat pastel headband, nail-technician outfit, feminine",
 esthetician: "wear a fitted white spa tunic, matching white tailored trousers, soft beige spa shoes, a clean white spa headband and subtle salon accessories, esthetician outfit, serene",
 tailor: "wear a fitted blouse, high-waisted tailored trousers, measuring-tape accessory, chic waist apron, shoes, stylish tailor outfit, realistic",
 jeweler: "wear a fitted blouse, high-waisted tailored trousers, blazer, low heels, luxury jeweler outfit",
 "interior-designer": "wear a fitted designer blouse, high-waisted wide-leg trousers, architectural blazer, stylish heels, interior-designer outfit, creative",
 "construction-worker": "wear a fitted orange long-sleeve work shirt, durable navy work trousers, bright yellow high-visibility vest, yellow hard hat, sturdy tan safety boots and protective work gloves, realistic construction-worker outfit, practical",
 carpenter: "wear a fitted work shirt, durable utility trousers, practical tool belt, sturdy work boots, clean realistic carpenter outfit, functional",
 electrician: "wear a fitted long-sleeve work shirt, durable utility trousers, practical tool belt, protective boots, realistic electrician outfit",
 plumber: "wear a fitted work polo, durable utility trousers, practical tool belt, sturdy work boots, clean realistic plumber outfit",
 welder: "wear a dark-blue flame-resistant fitted work shirt, durable dark work trousers, brown protective leather apron, heavy black work boots, welding gloves and a raised black welding helmet, realistic welder outfit, safe",
 mechanic: "wear a fitted navy mechanic work shirt, charcoal utility work pants, a blue mechanic coverall layer worn neatly, sturdy black work boots, protective work gloves and a simple dark mechanic cap, authentic mechanic outfit",
 "truck-driver": "wear a fitted casual work shirt, high-waisted durable jeans, practical lightweight jacket, sturdy boots, clean realistic truck-driver outfit, comfortable",
 "delivery-driver": "wear a fitted delivery polo, practical tailored cargo trousers, lightweight branded-style jacket without logos, clean sneakers, realistic delivery-driver outfit",
 "taxi-driver": "wear a fitted smart-casual blouse, tailored dark trousers, light cardigan, comfortable shoes, neat taxi-driver outfit, realistic",
 pilot: "wear a crisp white fitted pilot shirt with black-and-gold epaulets, tailored navy trousers, structured navy aviation blazer, black shoes, black tie and a classic navy pilot peaked cap, authentic pilot uniform, realistic",
 "flight-attendant": "wear a fitted navy-blue airline blazer, matching navy knee-length pencil skirt, crisp white blouse, bright red neck scarf, red pillbox hat, sheer neutral stockings and red closed-toe heels, classic flight-attendant uniform, realistic",
 "travel-agent": "wear a fitted blouse, high-waisted tailored trousers, light blazer, heels, travel-agent outfit, welcoming",
 "tour-guide": "wear a fitted white breathable blouse, khaki high-waisted tailored shorts, lightweight red utility vest, comfortable white sneakers, a beige sun hat and a small crossbody guide pouch, tour-guide outfit",
 "hotel-manager": "wear a fitted ivory blouse, navy high-waisted pencil skirt, tailored burgundy blazer, black heels, a discreet gold hotel name badge and a silk neck scarf, premium hotel-manager outfit",
 housekeeper: "wear a clean light-blue fitted housekeeping tunic, matching navy work trousers, crisp white waist apron, white housekeeping cap and comfortable black closed-toe shoes, hotel-housekeeper uniform, realistic",
 caregiver: "wear a soft fitted polo, comfortable tailored trousers, light cardigan, clean supportive shoes, warm caregiver outfit, practical",
 "social-worker": "wear a soft fitted blouse, tailored trousers, lightweight blazer, comfortable shoes, approachable social-worker outfit",
 "childcare-worker": "wear a fitted comfortable cotton top, high-waisted practical trousers, light cardigan, clean sneakers, cheerful childcare-worker outfit, practical",
 "stay-at-home-parent": "wear a cute fitted casual top, high-waisted jeans, cozy cardigan, stylish flats, attractive modern stay-at-home outfit, comfortable",
 retired: "wear a fitted casual blouse, high-waisted relaxed trousers, cardigan, comfortable stylish shoes, mature lifestyle outfit",
 freelancer: "wear a fitted top, high-waisted smart-casual trousers, light cropped blazer, stylish sneakers, freelancer outfit, relaxed",
 "remote-worker": "wear a fitted soft knit top, high-waisted smart-casual trousers, cozy tailored cardigan, clean minimalist sneakers, attractive remote-work outfit, comfortable",
 unemployed: "wear a stylish fitted casual top, high-waisted jeans, light fashionable jacket, clean sneakers, everyday lifestyle outfit",
};

const OCCUPATION_CONTEXT_GROUPS: Array<{
 ids: string[];
 place: string;
}> = [
 { ids: ["doctor", "nurse", "dentist", "pharmacist", "surgeon", "paramedic", "physical-therapist", "nutritionist", "caregiver"], place: "inside a modern bright hospital or medical clinic" },
 { ids: ["veterinarian"], place: "inside a modern veterinary clinic" },
 { ids: ["teacher", "professor", "school-principal", "librarian", "student"], place: "inside a modern school classroom or university classroom" },
 { ids: ["software-developer", "data-analyst", "data-scientist", "product-manager", "project-manager", "ai-engineer", "cybersecurity-specialist", "network-engineer", "it-support", "database-administrator", "ux-designer", "ui-designer", "web-designer", "remote-worker"], place: "inside a modern technology office with computer workstations" },
 { ids: ["engineer", "architect", "civil-engineer", "mechanical-engineer", "electrical-engineer", "industrial-engineer", "aerospace-engineer"], place: "inside a modern design and engineering studio" },
 { ids: ["lawyer", "judge", "paralegal"], place: "inside a modern law office" },
 { ids: ["business-owner", "accountant", "administrator", "marketing-specialist", "human-resources", "recruiter", "banker", "financial-advisor", "economist", "investment-analyst", "entrepreneur", "consultant", "operations-manager", "customer-service", "receptionist", "executive-assistant", "secretary", "office-worker"], place: "inside a modern corporate office" },
 { ids: ["salesperson", "store-manager"], place: "inside a modern retail store" },
 { ids: ["psychologist", "therapist", "social-worker"], place: "inside a warm modern consultation office" },
 { ids: ["scientist", "researcher", "biologist", "chemist", "physicist"], place: "inside a clean modern research laboratory" },
 { ids: ["chef", "baker", "pastry-chef", "butcher"], place: "inside a modern restaurant kitchen" },
 { ids: ["barista", "bartender", "waiter"], place: "inside a stylish cafe or restaurant" },
 { ids: ["photographer", "graphic-designer", "illustrator", "animator", "video-editor", "filmmaker", "director", "producer", "writer", "journalist", "copywriter", "translator", "interpreter"], place: "inside a modern creative studio" },
 { ids: ["model", "actor", "musician", "singer", "dancer", "content-creator", "influencer", "social-media-manager", "public-relations"], place: "inside a modern photo and content studio" },
 { ids: ["coach", "personal-trainer", "athlete", "yoga-instructor", "fitness-instructor"], place: "inside a modern fitness studio or gym" },
 { ids: ["police-officer", "security-guard", "detective"], place: "inside a modern security operations facility" },
 { ids: ["firefighter"], place: "inside a modern fire station" },
 { ids: ["military-officer"], place: "inside a modern military facility" },
 { ids: ["real-estate-agent", "insurance-agent", "travel-agent", "hotel-manager"], place: "inside a modern client office or hotel lobby" },
 { ids: ["fashion-designer", "stylist", "hair-stylist", "makeup-artist", "nail-technician", "esthetician", "tailor", "jeweler", "interior-designer", "florist"], place: "inside a modern fashion, beauty or design studio" },
 { ids: ["construction-worker", "carpenter", "electrician", "plumber", "welder", "mechanic"], place: "at a clean modern workshop or active worksite" },
 { ids: ["farmer", "gardener"], place: "at a beautiful outdoor garden or farm" },
 { ids: ["truck-driver", "delivery-driver", "taxi-driver"], place: "inside a modern vehicle or logistics setting" },
 { ids: ["pilot", "flight-attendant"], place: "inside a modern aircraft cockpit or aircraft cabin" },
 { ids: ["tour-guide"], place: "at a modern urban landmark" },
 { ids: ["housekeeper"], place: "inside a modern hotel interior" },
 { ids: ["childcare-worker", "stay-at-home-parent"], place: "inside a bright comfortable modern home" },
 { ids: ["freelancer", "unemployed", "retired"], place: "inside a modern lifestyle interior" },
];

function getCustomOccupationContext(customValue?: string): OccupationGenerationContext {
 const occupation = customValue?.trim().replace(/\s+/g, " ").slice(0, 80);
 if (!occupation) {
 return {
 place: "inside a modern lifestyle environment",
 clothes: "sexy outfit associated with the occupation, with recognizable role-specific garments, explicit footwear and subtle accessories",
 };
 }

 // The free-text occupation can be in any language. Keep the surrounding prompt
 // in English and preserve the user's value verbatim so the image model still
 // receives the exact role they entered.
 return {
 place: `in a realistic environment naturally associated with the occupation: ${occupation}`,
 clothes: `sexy outfit associated with the occupation: ${occupation}; use recognizable role-specific garments, explicit footwear and subtle accessories`,
 };
}

function normalizeOccupationClothes(value: string): string {
 return value
 .replace(/\bpleated midi skirt\b/gi, "pleated miniskirt")
 .replace(/\bmidi skirt\b/gi, "miniskirt")
 .replace(/\bankle-length trousers\b/gi, "tailored trousers")
 .replace(/\b(?:SFW|professional-looking|professional|formal|polished|refined|tasteful|modest|conservative|elegant|sophisticated)\b/gi, "")
 .replace(/\b(?:classroom-ready|office-ready|work-ready)\b/gi, "")
 .replace(/\s+,/g, ",")
 .replace(/,\s*,+/g, ", ")
 .replace(/\s{2,}/g, " ")
 .replace(/,\s*(?:and\s*)?$/i, "")
 .trim();
}

function clothesWithoutWearPrefix(value: string): string {
 return normalizeOccupationClothes(value)
 .replace(/^wear\s+(?:a|an)\s+/i, "")
 .trim();
}

export function getOccupationGenerationContext(
 id: string | undefined,
 customValue?: string,
): OccupationGenerationContext {
 if (id === "custom") return getCustomOccupationContext(customValue);

 const group = OCCUPATION_CONTEXT_GROUPS.find((item) => item.ids.includes(id || ""));
 const clothes = id ? OCCUPATION_CLOTHES[id] : undefined;

 return {
 place: group?.place || "inside a modern environment naturally suited to the occupation",
 clothes: clothesWithoutWearPrefix(
 clothes ||
 "wear a sexy outfit associated with the occupation, with recognizable role-specific garments, explicit footwear and subtle accessories",
 ),
 };
}
