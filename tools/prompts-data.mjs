// tools/prompts-data.mjs — the words behind assets/manifest.json: the style anchor every image
// prompt starts with (docs/ART_BIBLE.md §3, the Phase 2 gate) and one canonical description per
// character, written the way the anime shows them. tools/manifest.mjs turns these into prompts.
// Keys are portrait ids (a roster id, or the id the manifest gives an enemy that has no roster
// twin). Descriptions for the dual-era characters (§3.5) come in a Part I and a Shippuden version.

export const STYLE_ANCHOR = `STYLE ANCHOR (keep this block identical in every prompt):
Original fan-art character portrait in the look of a late-2000s Japanese shonen TV anime: clean cel shading with exactly two tones (base colour and one darker shadow), medium-thick near-black outlines (#1A1410) of even weight, the same near-black everywhere, including where a line meets the background (never brown, red, purple or tinted by the background), flat saturated colours, no gradients, no rim light, no painterly texture, no 3D render, no photo realism. Head-and-chest bust, three-quarter view: the WHOLE head and ALL of the hair fit inside the frame, with a clear empty margin above the highest point of the hair and on both sides (no spike, ponytail or headband tail is cut off by the edge); the head, from the chin to the top of the skull, fills about 38% of the image height, the same for every character; the crop ends at mid-chest, so the collar and the upper part of the top or jacket, with its design, are clearly visible. Mouth closed, determined expression, looking slightly past the viewer. The body faces forward in a three-quarter front view, chest and shoulders toward the viewer; never turned away, never seen from behind, never looking back over the shoulder. Anything described as being on the back of the outfit is simply not visible from this angle: do not turn the character to show it. Square image, 1024 x 1024, delivered as a PNG file (not JPEG). BACKGROUND: one flat solid magenta colour, hex #FF00FF, filling every pixel behind the character; not white, not a gradient, nothing else in the background. No props, no text, no watermark, no border, no signature.`;

export const SPRITE_ANCHOR = `STYLE ANCHOR (keep this block identical in every prompt):
Original fan-art character sprite in the look of a late-2000s Japanese shonen TV anime, redrawn in a lightly stylised proportion: every character has the SAME head size, and their height in heads follows the PROPORTIONS line below (never a big chibi head; the head is only a little wider than the neck and clearly narrower than the shoulders), simple hands and feet, clean cel shading with exactly two tones, bold near-black outlines (#1A1410) of even weight: the outer outline around the whole figure is about 1% of the figure's height thick (about 9 to 10 pixels on a 1024 image), the inner lines (face, folds, hands) a little thinner, like a game sprite rather than a fine illustration, the same near-black everywhere, including where a line meets the background (never brown, red, purple or tinted by the background), flat saturated colours, no gradients, no rim light, no painterly texture, no 3D render. FULL BODY, standing in a relaxed ready stance, feet apart, arms at the sides, the whole figure visible with a small margin, feet at the bottom centre. The body faces forward in a three-quarter front view, chest and shoulders toward the viewer; never turned away, never seen from behind, never looking back over the shoulder. Anything described as being on the back of the outfit is simply not visible from this angle: do not turn the character to show it. Square image, 1024 x 1024, delivered as a PNG file (not JPEG). BACKGROUND: one flat solid magenta colour, hex #FF00FF, filling every pixel behind the character; not white, not a gradient. No props, no text, no watermark, no border, no shadow on the ground.`;

export const FACE_RIGHT = `FACING: the character faces the viewer's RIGHT. The head and shoulders are turned toward the right edge of the image; the visible ear is on the left side of the face; the nose points right.`;
export const FACE_LEFT = `FACING: the character faces the viewer's LEFT. The head and shoulders are turned toward the left edge of the image; the visible ear is on the right side of the face; the nose points left.`;

// The village symbols, spelled out for the plate on every headband.
export const VILLAGE_PLATE = {
  leaf: 'a metal forehead-protector plate engraved with the Hidden Leaf Village symbol (a spiral ending in a small triangular leaf flick)',
  mist: 'a metal forehead-protector plate engraved with the Hidden Mist Village symbol (four short wavy horizontal lines)',
  sand: 'a metal forehead-protector plate engraved with the Hidden Sand Village symbol (an hourglass shape)',
  sound: 'a metal forehead-protector plate engraved with the Hidden Sound Village symbol (a musical note)',
  cloud: 'a metal forehead-protector plate engraved with the Hidden Cloud Village symbol (a curling cloud)',
  stone: 'a metal forehead-protector plate engraved with the Hidden Stone Village symbol (two stacked rocks)',
  rain: 'a metal forehead-protector plate engraved with the Hidden Rain Village symbol (four vertical falling lines)',
  waterfall: 'a metal forehead-protector plate engraved with the Hidden Waterfall Village symbol (a downward arrow like falling water)',
  grass: 'a metal forehead-protector plate engraved with the Hidden Grass Village symbol (a blade of grass)',
  oil: 'a horned metal forehead plate engraved with the kanji for "oil" (油), the mark of Mount Myoboku',
  none: 'no forehead protector',
};

const LEAF = 'a cloth forehead protector with ' + VILLAGE_PLATE.leaf;
const SAND = 'a cloth forehead protector with ' + VILLAGE_PLATE.sand;
const MIST = 'a cloth forehead protector with ' + VILLAGE_PLATE.mist;
const SOUND = 'a cloth forehead protector with ' + VILLAGE_PLATE.sound;
const CLOUD = 'a cloth forehead protector with ' + VILLAGE_PLATE.cloud;
const STONE = 'a cloth forehead protector with ' + VILLAGE_PLATE.stone;
const AKATSUKI = 'a long black high-collared cloak patterned with red clouds outlined in white';
const SCRATCHED = (v) => `a forehead protector whose ${VILLAGE_PLATE[v].replace('a metal forehead-protector plate', 'metal plate is')} and scratched through with a horizontal gash (a rogue ninja)`;

/** { p1?: string, p2?: string, one?: string } — one entry per portrait id; `one` when the look does not change. */
export const DESCRIPTIONS = {
  // ---------------------------------------------------------------- Team 7
  naruto: {
    p1: `Naruto Uzumaki as a 12-year-old genin from the first part of the series. Spiky bright golden-blond hair, big blue eyes, three thin whisker-like marks on each cheek, a wide confident grin held closed. He wears an orange tracksuit jacket with blue shoulders and a white fluffy collar, zipped up, and a blue ${LEAF} tied across his forehead. Warm daylight from the upper left.`,
    p2: `Naruto Uzumaki as a 16-year-old from the second part of the series (Shippuden). A taller, leaner face, spiky golden-blond hair, blue eyes, three whisker-like marks on each cheek, a confident half-smile held closed. He wears an orange and black tracksuit jacket with a high collar, zipped up, and a BLACK ${LEAF} with a long black band. Cooler, higher-contrast light from the upper left.`,
  },
  sasuke: {
    p1: `Sasuke Uchiha as a 12-year-old genin. Black hair with a blue sheen, spiked at the back with long bangs framing a pale, serious face, narrow dark eyes, an unimpressed expression. He wears a dark blue short-sleeved high-collared shirt with the Uchiha fan crest (red over white) on the back of the collar, white arm warmers, and a blue ${LEAF}.`,
    p2: `Sasuke Uchiha at 16 (Shippuden). Black hair spiked at the back with long bangs, a pale cold face, dark eyes. He wears a white open-collared long-sleeved shirt showing his chest, a thick purple rope belt at the waist, and the hilt of a straight chokuto sword over his back. No forehead protector.`,
  },
  sakura: {
    p1: `Sakura Haruno as a 12-year-old genin. Long straight pink hair to the shoulders, bright green eyes, a large forehead, a bright hopeful expression. She wears a red qipao-style dress with a white circle crest on the back and short sleeves, and a red ${LEAF} worn as a hairband on top of her head.`,
    p2: `Sakura Haruno at 16 (Shippuden). Short pink hair cut to the jaw, green eyes, a small purple diamond seal beginning to show on her forehead, a confident expression. She wears a sleeveless red zippered top with pink elbow guards, pink gloves, and a red ${LEAF} worn as a hairband.`,
  },
  kakashi: {
    p1: `Kakashi Hatake, an adult jonin. Gravity-defying spiky silver-white hair leaning to the left, a dark navy cloth mask covering his nose and mouth, and his blue ${LEAF} pulled down slanted over his left eye so only his right eye (dark, lazy, half-lidded) shows. He wears the standard Leaf jonin outfit: a dark blue long-sleeved shirt under a green flak vest with pockets, fingerless gloves with metal plates.`,
    p2: `Kakashi Hatake (Shippuden), the same look with a little more age in the face: spiky silver-white hair, a dark navy mask over the nose and mouth, the blue ${LEAF} slanted over his left eye, one dark lazy eye visible, the green Leaf flak vest over a dark blue shirt. Cooler light.`,
  },
  sai: { one: `Sai, a pale teenage boy from the Foundation (Shippuden). Short straight jet-black hair with a fringe, black eyes, very pale skin, a thin unreadable smile. He wears a short black high-collared jacket that shows his midriff, one long sleeve and one bare arm, a tanto sword hilt over his shoulder, and a black ${LEAF}.` },
  yamato: { one: `Yamato (Tenzo), an adult jonin of the Hidden Leaf (Shippuden). Short brown hair, dark almond eyes with a calm, slightly eerie stare. He wears a happuri-style metal face guard framing his face from the forehead down both cheeks, engraved with the Hidden Leaf symbol on the forehead, over a green Leaf flak vest and dark blue shirt.` },
  // ---------------------------------------------------------------- Team 10
  shikamaru: {
    p1: `Shikamaru Nara as a 12-year-old genin. Black hair pulled up in a spiky ponytail like a pineapple top, narrow bored dark eyes, small hoop earrings, a lazy unimpressed expression. He wears a short grey jacket with green edging over a mesh shirt, and a blue ${LEAF} worn on the upper left arm rather than the head.`,
    p2: `Shikamaru Nara at 16 (Shippuden), a chunin. Black hair in a spiky pineapple ponytail, narrow calm eyes, small stud earrings. He wears the green Leaf flak vest over a dark long-sleeved shirt and a blue ${LEAF} on the forehead.`,
  },
  ino: {
    p1: `Ino Yamanaka as a 12-year-old genin. Long platinum-blond hair in a high ponytail with a long bang covering her right eye, pale blue eyes, a confident, slightly haughty expression. She wears a purple sleeveless top and a blue ${LEAF} worn as a belt-like band at the waist, so her forehead is bare.`,
    p2: `Ino Yamanaka at 16 (Shippuden). Very long platinum-blond ponytail, a long bang over her right eye, pale blue eyes, a confident smile held closed. She wears a purple high-collared sleeveless top showing her midriff, mesh arm sleeves, and a blue ${LEAF} at the waist.`,
  },
  choji: {
    p1: `Choji Akimichi as a 12-year-old genin, a big round-faced friendly boy. Spiky brown hair, small dark eyes, red swirl marks on both cheeks, a warm grin held closed. He wears a green short-sleeved jacket over a white shirt with the kanji for "food" (食) on the chest, a long white scarf, and a blue ${LEAF} worn like a bandanna cap.`,
    p2: `Choji Akimichi at 16 (Shippuden), a big broad boy. Long spiky brown hair down past his shoulders, red swirl marks on both cheeks, a friendly determined face. He wears red armour plates over a red outfit with the kanji for "food" (食) on the chest, and a blue ${LEAF} worn as a bandanna over the top of his head.`,
  },
  asuma: {
    p1: `Asuma Sarutobi, an adult jonin of the Hidden Leaf. Short spiky black hair, a full black beard along the jaw and chin, calm dark eyes, an unlit cigarette held in his closed mouth. He wears the green Leaf flak vest over a dark blue shirt, a white sash with the kanji for "fire" (火) at the waist, and a blue ${LEAF}.`,
    p2: `Asuma Sarutobi (Shippuden), the same look: short spiky black hair, a full black beard, a cigarette in his closed mouth, the green Leaf flak vest, a blue ${LEAF}. A little more tired around the eyes.`,
  },
  // ---------------------------------------------------------------- Team 8
  kiba: {
    p1: `Kiba Inuzuka as a 12-year-old genin, a feral-looking boy. Short messy brown hair, slit-like dark eyes, a red fang-shaped mark on each cheek, a toothy grin held closed. He wears a grey fur-hooded parka with the hood down and a blue ${LEAF}; a small white puppy (Akamaru) sits on top of his head.`,
    p2: `Kiba Inuzuka at 16 (Shippuden). Messy brown hair, slit-like eyes, red fang marks on each cheek, a wolfish grin held closed. He wears a black leather-look jacket with a fur-lined collar zipped to the chest, and a blue ${LEAF}.`,
  },
  shino: {
    p1: `Shino Aburame as a 12-year-old genin, a mysterious boy. Bushy dark brown hair, round black sunglasses hiding his eyes, and a high grey collar of his jacket covering his mouth and nose. He wears a pale grey hooded jacket zipped to the top and a blue ${LEAF}.`,
    p2: `Shino Aburame at 16 (Shippuden). A hood over dark spiky hair, round black goggles-like sunglasses hiding his eyes, a high collar covering his lower face. He wears a dark green hooded jacket with a big collar over a grey outfit, and a blue ${LEAF}.`,
  },
  hinata: {
    p1: `Hinata Hyuga as a 12-year-old genin, a shy girl. Short dark blue-black hair in a bob with two long side locks, pale lavender-white pupilless Hyuga eyes, a soft blushing expression. She wears a cream and tan hooded jacket with fur trim, and a blue ${LEAF} worn loosely around her neck.`,
    p2: `Hinata Hyuga at 16 (Shippuden). Long straight dark blue-black hair down to her waist, pale lavender-white pupilless eyes, a gentle, quietly determined expression. She wears a lavender and cream hooded jacket with white fur trim over mesh, and a blue ${LEAF} around her neck.`,
  },
  kurenai: {
    p1: `Kurenai Yuhi, an adult jonin of the Hidden Leaf. Long wavy black hair, striking red eyes with a ring pattern, purple eyeshadow, a composed face. She wears a red and white outfit wrapped like bandages down one arm over a mesh top, and a blue ${LEAF}.`,
    p2: `Kurenai Yuhi (Shippuden). Long wavy black hair, red ringed eyes, a calm mature face. She wears a red and white outfit over a mesh shirt and a blue ${LEAF}.`,
  },
  // ---------------------------------------------------------------- Team Guy
  lee: {
    p1: `Rock Lee as a 13-year-old genin. A shiny black bowl haircut, very thick black eyebrows, large round dark eyes with dark lashes, an earnest expression. He wears a green skin-tight jumpsuit with orange leg warmers, bandaged forearms and hands, and a red ${LEAF} worn as a belt at the waist.`,
    p2: `Rock Lee at 16 (Shippuden). A black bowl cut, very thick eyebrows, big round eyes, a fierce earnest face. He wears the green jumpsuit under a green Leaf flak vest, bandaged forearms, and a red ${LEAF} at the waist.`,
  },
  neji: {
    p1: `Neji Hyuga as a 13-year-old genin. Long straight dark brown hair tied loosely near the end, pale lavender-white pupilless Hyuga eyes, a cold superior expression. He wears a beige kimono-style top and a blue ${LEAF} worn low over the forehead with two long cloth tails, hiding the mark on his brow.`,
    p2: `Neji Hyuga at 17 (Shippuden), a jonin. Long straight dark brown hair, pale pupilless Hyuga eyes, a calm serious face. He wears a white kimono-style robe with a dark grey sash, and a black ${LEAF} over the forehead.`,
  },
  tenten: {
    p1: `Tenten as a 13-year-old genin. Dark brown hair in two round buns on top of her head, brown eyes, a bright practical expression. She wears a pink sleeveless Chinese-style top with dark blue trim and a blue ${LEAF}.`,
    p2: `Tenten at 17 (Shippuden). Dark brown hair in two buns with short bangs, brown eyes, a confident face. She wears a white sleeveless Chinese-style high-collared top with red trim over a mesh shirt and a blue ${LEAF}.`,
  },
  guy: {
    p1: `Might Guy, an adult jonin of the Hidden Leaf. A shiny black bowl haircut, very thick black eyebrows, a big gleaming grin held closed (a thumbs-up energy in the face), a strong jaw. He wears a green skin-tight jumpsuit under a green Leaf flak vest, orange leg warmers, and a red ${LEAF} worn as a belt at the waist.`,
    p2: `Might Guy (Shippuden), the same look: black bowl cut, very thick eyebrows, a beaming grin held closed, the green jumpsuit under a green Leaf flak vest, a red ${LEAF} at the waist.`,
  },
  // ---------------------------------------------------------------- Leaf adults and Hokage
  iruka: {
    p1: `Iruka Umino, an adult Academy teacher of the Hidden Leaf. Dark brown hair in a high spiky ponytail, a long horizontal scar across the bridge of his nose and both cheeks, kind dark eyes, a warm expression. He wears the standard chunin outfit: a green Leaf flak vest over a dark blue long-sleeved shirt, and a blue ${LEAF}.`,
    p2: `Iruka Umino (Shippuden), the same look with a little more age: a high spiky ponytail, the scar across the nose, the green Leaf flak vest, a blue ${LEAF}.`,
  },
  hiruzen: { one: `Hiruzen Sarutobi, the elderly Third Hokage. A lined face with a short white goatee, dark eyes, a liver spot near the eye, a wise stern expression. He wears the Hokage's white robe and the red and white Hokage hat with the kanji for "fire" (火) on the front and a wide brim; a pipe held in the closed mouth.` },
  jiraiya: {
    p1: `Jiraiya, one of the Legendary Sannin, a big boisterous man in his fifties. Very long spiky white hair down his back, a red wart on the side of his nose, red tear-like lines running from his eyes down to his jaw, a hearty grin held closed. He wears a green short kimono under a red haori vest, a wooden hand-guard on his forearm, and a horned metal forehead plate with the kanji for "oil" (油).`,
    p2: `Jiraiya (Shippuden), the same look: long spiky white hair, the red lines from his eyes, the red wart, a green kimono under a red haori, the horned "oil" (油) forehead plate. A little more gravity in the face.`,
  },
  tsunade: {
    p1: `Tsunade, one of the Legendary Sannin and the Fifth Hokage, who looks like a woman in her twenties. Long blond hair in two loose low pigtails, light brown eyes, a violet diamond mark in the centre of her forehead, a commanding expression. She wears a grey kimono-style blouse open low at the neck under a green haori jacket with the kanji for "gamble" (賭) on the back, and a green jewel necklace.`,
    p2: `Tsunade (Shippuden), the same look: long blond low pigtails, the violet forehead diamond, a grey blouse under a green haori, the green necklace, a stern Hokage's stare.`,
  },
  shizune: {
    p1: `Shizune, Tsunade's attendant, a young woman. Short straight black hair, dark eyes, a gentle worried expression. She wears a long black kimono-style robe with a white sash and no forehead protector; a small pig (Tonton) may peek at the edge.`,
    p2: `Shizune (Shippuden), the same: short black hair, dark eyes, a kind composed face, a black kimono-style robe with a white obi, no forehead protector.`,
  },
  konohamaru: { one: `Konohamaru Sarutobi, a boy of about 12 (Shippuden). Short spiky brown hair, big dark eyes, a cheeky determined grin held closed. He wears a grey jacket over a dark shirt with a long blue scarf, and a blue ${LEAF}.` },
  minato: { one: `Minato Namikaze, the Fourth Hokage, a handsome man in his twenties. Spiky golden-blond hair with two long bangs framing the face, bright blue eyes, a calm kind expression. He wears the green Leaf flak vest over a dark blue shirt under a white short-sleeved haori coat with red flame patterns at the hem and the kanji for "Fourth Hokage" (四代目火影) on the back, and a blue ${LEAF}.` },
  hashirama: { one: `Hashirama Senju, the First Hokage, a tall man with long straight dark brown hair down his back and a centre parting, dark eyes, tanned skin, a warm serene expression. He wears dark red samurai-style plate armour over a black outfit, with a red and white Hokage headpiece.` },
  madara: { one: `Madara Uchiha, a tall man with very long, wild spiky black hair down to his waist and long bangs framing a pale stern face, red Sharingan eyes, a cold proud expression. He wears dark red samurai-style plate armour over a black high-collared outfit with the Uchiha fan crest, and a gunbai war fan at his back.` },
  obito: { one: `Obito Uchiha (Shippuden), a man with short spiky black hair, the right half of his face scarred and creased like cracked bark, one red Sharingan eye and one purple ringed Rinnegan eye, a grim cold expression. He wears a purple high-collared robe with the ${AKATSUKI.replace('a long black', 'a black')} style, and dark plate armour at the shoulders.` },
  // ---------------------------------------------------------------- Sand
  gaara: {
    p1: `Gaara of the Sand as a 12-year-old. Short spiky dark red hair, pale sea-green eyes ringed with heavy dark circles, no eyebrows, the kanji for "love" (愛) carved in red on the left side of his forehead, a cold blank expression. He wears a black full-body outfit with a white sash across the chest holding a huge sand gourd on his back, and a ${SAND} worn on the sash strap.`,
    p2: `Gaara as the Fifth Kazekage at 15 (Shippuden). Short spiky dark red hair, pale sea-green eyes with dark rings, no eyebrows, the red "love" (愛) kanji on his forehead, a calm serious face. He wears a long dark red coat with a grey flak-vest-like harness over it, the sand gourd on his back, and a ${SAND} on the harness strap.`,
  },
  temari: {
    p1: `Temari of the Sand as a 15-year-old. Sandy blond hair in four short spiky pigtails, dark teal eyes, a sharp confident smirk held closed. She wears a purple-lavender wrap dress with a red sash, mesh at the neck, a giant folded iron fan on her back, and a ${SAND} worn around her neck.`,
    p2: `Temari at 18 (Shippuden). Sandy blond hair in four spiky pigtails, teal eyes, a cool confident face. She wears a black kimono-style top with a red sash and a purple obi, the giant iron fan on her back, and a ${SAND} on her forehead.`,
  },
  kankuro: {
    p1: `Kankuro of the Sand as a 14-year-old. His face is painted with purple kabuki-style markings (lines across the forehead, cheeks and chin) over a brown-haired head hidden under a black hooded cat-eared jumpsuit; dark eyes, a smug expression. A bandaged puppet is strapped to his back, and a ${SAND} is on the hood.`,
    p2: `Kankuro at 17 (Shippuden). Purple painted face markings over a hooded black outfit with cat-like ears, dark eyes, a cocky smirk held closed; the ${SAND} on the hood; puppet scrolls strapped to his back.`,
  },
  chiyo: { one: `Chiyo, an elderly puppet master of the Hidden Sand (Shippuden). A small wrinkled face with sharp dark eyes, grey hair in a bun with a top knot, no eyebrows drawn, a cunning expression. She wears a dark high-collared robe with a white cloth hood.` },
  // ---------------------------------------------------------------- Mist, Sound and the Land of Waves
  zabuza: { one: `Zabuza Momochi, a tall adult rogue ninja from the Hidden Mist. Short spiky black hair, no eyebrows, small sharp menacing eyes, the lower half of his face wrapped in white bandages like a mask. His ${MIST} is tied sideways at an angle on his head. Bare muscular arms, a sleeveless dark grey top, grey and white camouflage arm warmers, the wrapped hilt of a giant cleaver sword rising behind his shoulder. Cool misty grey-blue light.` },
  haku: { one: `Haku, a teenage boy from the Hidden Mist with a delicate, feminine face. Long straight black hair with two loose side locks and a white bun cover, dark gentle eyes, pale skin, a soft serene expression. He wears a pale green and brown striped kimono-style robe with a high collar; no forehead protector on the head (a hunter-nin mask with red wave lines may be pushed up to the side of the hair).` },
  suigetsu: { one: `Suigetsu Hozuki, a teenage rogue ninja from the Hidden Mist (Shippuden). Straight white hair to the chin with a blue tint, purple eyes, pointed shark-like teeth in a wide grin held closed, pale skin. He wears a purple sleeveless top over a mesh shirt, a big water bottle on a belt, and the hilt of Zabuza's giant cleaver sword over his back.` },
  chojuro: { one: `Chojuro, a young shy swordsman of the Hidden Mist (Shippuden). Short shaggy pale blue hair, dark eyes behind black-rimmed rectangular glasses, pointed teeth, a nervous expression. He wears a blue-grey striped high-collared shirt and grey-blue camouflage arm covers, a ${MIST}, and the bandaged hilt of the twin sword Hiramekarei over his shoulder.` },
  mei: { one: `Mei Terumi, the Fifth Mizukage (Shippuden), a beautiful woman with very long auburn-red hair, a topknot, one long bang covering her right eye, a single visible green eye, a graceful confident smile held closed. She wears a long blue dress with a mesh top under it, and a blue ${MIST}-style emblem is on her outfit rather than her forehead.` },
  kisame: { one: `Kisame Hoshigaki, a tall shark-like man of the Akatsuki. Blue-grey skin, small round white eyes, three gill-like lines under each eye, spiky dark blue hair, pointed shark teeth in a wide grin held closed. He wears ${AKATSUKI} and a ${SCRATCHED('mist')} tied on his forehead; the bandaged hilt of the huge sword Samehada rises behind his shoulder.` },
  orochimaru: {
    p1: `Orochimaru, one of the Legendary Sannin, a tall pale man with long straight black hair down his back, golden slit-pupil snake eyes with purple markings around them, a cruel amused expression. He wears a plain grey-beige robe with a thick purple rope tied in a bow at the waist; no forehead protector (or a ${SCRATCHED('leaf')}).`,
    p2: `Orochimaru (Shippuden), the same look: long straight black hair, golden snake eyes with purple eye markings, very pale skin, a grey-beige robe with a thick purple rope belt, a thin knowing smile held closed.`,
  },
  kabuto: {
    p1: `Kabuto Yakushi, a young man with silver-grey hair in a low ponytail with a fringe, dark eyes behind round glasses, a polite unreadable smile held closed. He wears a dark purple high-collared outfit with a white sash at the waist and a ${LEAF} (later revealed as a Sound spy).`,
    p2: `Kabuto Yakushi (Shippuden), silver-grey hair in a ponytail, round glasses, a sly smile held closed, a dark purple hooded cloak; the skin around his left eye and cheek shows pale snake-like scales.`,
  },
  kimimaro: { one: `Kimimaro of the Sound Four's elite, a teenage boy with straight pale bone-white hair to the shoulders framing his face, green eyes with red markings under them, two red dots above his brows, a calm cold devotion in his expression. He wears a loose grey-white robe open at the chest with a thick purple rope belt.` },
  jirobo: { one: `Jirobo of the Sound Four, a large heavy-set teenage boy with orange-red hair in a mohawk with a pointed tuft, small eyes, a broad face, a serious expression. He wears a black outfit with a thick purple rope belt and a beige tabard, no forehead protector.` },
  kidomaru: { one: `Kidomaru of the Sound Four, a teenage boy with dark skin, black hair in a spiky high ponytail, dark eyes, a cocky grin held closed, and six arms (two extra pairs folded behind). He wears a black outfit with a thick purple rope belt and a ${SOUND} on his forehead.` },
  sakon: { one: `Sakon of the Sound Four, a teenage boy with pale blue-grey hair falling over one eye, dark eyes with purple lipstick-like markings on his lips, a sly grin held closed; a second identical face (Ukon) peeks over his shoulder from the back of his neck. He wears a black outfit with a thick purple rope belt and a ${SOUND}.` },
  tayuya: { one: `Tayuya of the Sound Four, a teenage girl with long dark pink-red hair, brown eyes, a foul-tempered scowl, and a black cap with a wide brim over her hair. She wears a black outfit with a thick purple rope belt and a ${SOUND}.` },
  karin: { one: `Karin, a teenage girl of Taka (Shippuden). Long bright red hair, uneven and spiky on one side and straight on the other, red eyes behind brown-rimmed glasses, a sharp irritable expression. She wears a lavender zippered top over a mesh shirt and a dark ${SOUND}-style band is not worn; no forehead protector.` },
  jugo: { one: `Jugo, a tall broad young man of Taka (Shippuden). Short spiky orange hair, calm orange-red eyes, a gentle sad expression on a big face. He wears a pale tan cloak-like top over a dark outfit; no forehead protector.` },
  // ---------------------------------------------------------------- Cloud and Stone
  killer_bee: { one: `Killer Bee, the Eight-Tails jinchuriki of the Hidden Cloud (Shippuden), a muscular dark-skinned man with white-blond hair swept back, dark sunglasses, a small goatee, a cool rapping grin held closed, and a bull-horn tattoo on his left cheek. He wears a white one-strap flak vest over bare skin, a white scarf, gold shoulder pads, and a white ${CLOUD}.` },
  omoi: { one: `Omoi, a young Hidden Cloud ninja (Shippuden), a dark-skinned young man with short white hair, dark eyes, a lollipop stick in his closed mouth, a worried thoughtful expression. He wears a white one-strap flak vest and a white ${CLOUD}.` },
  darui: { one: `Darui, a jonin of the Hidden Cloud (Shippuden), a dark-skinned man with shaggy white hair that covers one eye, a sleepy dark eye, a laid-back expression. He wears a white one-strap flak vest over bare skin with a large cleaver sword on his back, and a white ${CLOUD} tied on the forehead.` },
  ay: { one: `Ay, the Fourth Raikage (Shippuden), a huge, extremely muscular dark-skinned man with slicked-back white-blond hair, a small pointed moustache and goatee, fierce dark eyes, a scowl. He wears the Raikage's white and gold robe open over a bare muscular chest with heavy gold bracers, and the white and blue Raikage hat with the kanji for "lightning" (雷).` },
  onoki: { one: `Onoki, the Third Tsuchikage (Shippuden), a very small, very old man with a large red bulbous nose, a white beard and moustache, a bald head with white hair at the sides tied in a tuft, small sharp eyes, a grumpy expression. He wears a green and yellow Tsuchikage robe with a red collar and the Tsuchikage hat with the kanji for "earth" (土).` },
  kurotsuchi: { one: `Kurotsuchi, a young kunoichi of the Hidden Stone (Shippuden), a girl with short black hair, pink pupil-less eyes, a determined cocky face. She wears a red sleeveless top over mesh, a red ${STONE} on her forehead, and a Stone flak vest.` },
  deidara: { one: `Deidara of the Akatsuki, a slender young man with long blond hair in a high ponytail and a long bang over his left eye, a single visible blue eye, a scope-like device over the hidden eye, a smirk held closed. He wears ${AKATSUKI} and a ${SCRATCHED('stone')} tied on the forehead.` },
  // ---------------------------------------------------------------- Akatsuki
  sasori: { one: `Sasori of the Red Sand, an Akatsuki member who looks like a young man with short messy red hair, half-lidded brown eyes, a bored doll-like face with smooth pale skin. He wears ${AKATSUKI}; no forehead protector (a scratched Sand plate may hang at the collar).` },
  hidan: { one: `Hidan of the Akatsuki, a young man with silver-grey hair slicked back, purple-pink eyes, a manic wide grin held closed. He wears ${AKATSUKI} open at the chest showing a Jashin pendant (a circle with a downward triangle) on a cord, and a ${SCRATCHED('waterfall')} tied around his neck.` },
  kakuzu: { one: `Kakuzu of the Akatsuki, a tall man whose lower face is covered by a black cloth mask and whose head is covered by a white hood; only his strange green irises on red sclera show, framed by dark stitches at the cheeks. He wears ${AKATSUKI} and a ${SCRATCHED('waterfall')}.` },
  konan: { one: `Konan of the Akatsuki (Shippuden), a woman with short straight blue hair with a bun, an origami white paper flower in her hair, amber-orange eyes, a stud piercing under her lip, a calm serious expression. She wears ${AKATSUKI} and a ${SCRATCHED('rain')} on her forehead.` },
  pain: { one: `Pain (the Deva Path) of the Akatsuki (Shippuden), a man with short spiky orange hair, purple ringed Rinnegan eyes, and many black metal stud piercings: three across each side of the nose, a row along each ear, a bar under the lip. A cold expressionless face. He wears ${AKATSUKI} and a ${SCRATCHED('rain')} on his forehead.` },
  itachi: { one: `Itachi Uchiha of the Akatsuki, a young man with long black hair tied in a low ponytail, long bangs framing a pale face, red Sharingan eyes, long deep lines running from the inner corners of his eyes down the cheeks, a calm emotionless expression. He wears ${AKATSUKI} with the collar up, a necklace of three metal rings, and a ${SCRATCHED('leaf')} on his forehead.` },
  // ---------------------------------------------------------------- alternate forms (the roster's transformation entries)
  naruto_ninetails: { one: `Naruto Uzumaki at 12 in the first Nine-Tails chakra state: spiky blond hair blown upward, red slit-pupil eyes, thick dark whisker marks, bared teeth in a snarl held closed, a shroud of orange-red bubbling chakra outlining him. The orange tracksuit with the blue ${LEAF}.` },
  sasuke_cursemark: { one: `Sasuke Uchiha at 13 with the Heavens' Curse Mark spreading: black flame-shaped markings creeping across the left side of his face and neck, red Sharingan eyes, spiky black hair, a cold furious expression, a dark blue high-collared shirt with the Uchiha crest. A blue ${LEAF}.` },
  sakura_hundred: { one: `Sakura Haruno at 17 with the Strength of a Hundred Seal released: a violet diamond on her forehead with dark seal lines spreading across her face, short pink hair, green eyes, a fierce determined expression, a red sleeveless zippered top, a red ${LEAF} worn as a hairband.` },
  gaara_kazekage: { one: `Gaara as the Fifth Kazekage in formal robes (Shippuden): short spiky dark red hair, pale sea-green eyes with dark rings, the red "love" (愛) kanji on his forehead, a calm dignified face. He wears the white Kazekage robe and the green and white Kazekage hat with the kanji for "wind" (風).` },
  kakashi_mangekyo: { one: `Kakashi Hatake (Shippuden) with his forehead protector pushed up, revealing his left eye as a red Mangekyo Sharingan with a three-bladed pinwheel pattern and a scar running down through it; spiky silver-white hair, the dark navy mask over nose and mouth, the green Leaf flak vest.` },
  naruto_sage: { one: `Naruto Uzumaki at 16 in Sage Mode (Shippuden): spiky golden-blond hair, yellow toad-like eyes with horizontal bar pupils and orange-red pigment around the eyes, whisker marks, a calm powerful expression. He wears a short red cloak with black flame patterns at the hem over the orange and black tracksuit, and the horned metal forehead plate with the kanji for "oil" (油) instead of the Leaf one.` },
  sasuke_ems: { one: `Sasuke Uchiha at 17 (Shippuden) with the Eternal Mangekyo Sharingan: red eyes with a six-pointed overlapping star pattern, spiky black hair with long bangs, a pale hard face, a dark grey high-collared cloak over a dark outfit, the chokuto sword hilt at his back. No forehead protector.` },
  guy_eightgates: { one: `Might Guy with the Eight Inner Gates open (Shippuden): his skin flushed dark red, black bowl cut standing on end, thick eyebrows, glowing white pupil-less eyes, a burning green-red steam aura rising around him, a fierce shout held closed. The green jumpsuit, red ${LEAF} at the waist.` },
  naruto_sixpaths: { one: `Naruto Uzumaki at 17 in Six Paths Sage Mode (Shippuden): golden-yellow glowing chakra cloak over his body with black seal markings and a black high collar, spiky golden hair, orange-yellow eyes with cross-shaped pupils and orange pigment around them, whisker marks, a serene powerful face. A black ${LEAF}.` },
  naruto_chakramode: { one: `Naruto Uzumaki at 16 in Nine-Tails Chakra Mode (Shippuden): his whole body glowing in golden-yellow chakra with black seal markings and a flame-like cloak, spiky hair blown up, orange-yellow eyes, whisker marks, a bold grin held closed. A black ${LEAF}.` },
  // ---------------------------------------------------------------- enemies with no roster twin (portrait ids given by tools/manifest.mjs)
  e_mizuki: { one: `Mizuki, an adult Academy teacher turned traitor (Part I). Shoulder-length silver-white hair with a fringe, sharp dark eyes, a sneer. He wears the Leaf chunin outfit, a green flak vest over a dark shirt, a blue ${LEAF}, with a giant four-bladed shuriken at his back.` },
  e_gozu: { one: `Gozu of the Demon Brothers, a rogue Hidden Mist ninja: a dark rebreather mask covering the mouth and nose, a ${SCRATCHED('mist')}, dark spiky hair, one bare clawed gauntlet arm, a dark grey camouflage cloak.` },
  e_meizu: { one: `Meizu of the Demon Brothers, a rogue Hidden Mist ninja identical in style to his brother: a dark rebreather mask over the mouth, a ${SCRATCHED('mist')}, spiky dark hair, a clawed metal gauntlet on one arm, a grey camouflage cloak.` },
  e_water_clone: { one: `A water clone of Zabuza Momochi: the same tall bandaged-face rogue Mist ninja with the sideways ${MIST}, spiky black hair and no eyebrows, but rendered in translucent blue-white water tones with a dripping, liquid look.` },
  e_zori: { one: `Zori, a hired samurai thug from the Land of Waves: a thin man with a straw-coloured hat pushed back, dark hair, a hard face, a dark kimono and a sword at the hip; no headband.` },
  e_waraji: { one: `Waraji, a hired samurai thug from the Land of Waves: a burly man with a tattoo on his bare chest, an eyepatch, a top-knot, a scowl, and a katana on his back; no headband.` },
  e_gato_thug: { one: `A hired thug of the shipping magnate Gato: a rough bandit in a ragged dark kimono, a bandanna, stubble, a club or short sword; no ninja headband.` },
  e_dosu: { one: `Dosu Kinuta of the Hidden Sound genin trio: a hunched boy wrapped almost entirely in white bandages, one dark eye visible, a large fur-lined collar, a ${SOUND} worn as a bandanna, a metal sound amplifier gauntlet on his right arm.` },
  e_zaku: { one: `Zaku Abumi of the Hidden Sound genin trio: a boy with spiky black hair, dark eyes, a cruel grin held closed, a beige shirt with a scarf, and a ${SOUND}; the palms of his hands have small air holes.` },
  e_kin: { one: `Kin Tsuchi of the Hidden Sound genin trio: a girl with very long straight black hair tied at the end with a bow, dark eyes, a smug expression, a pale green vest over a mesh shirt and a ${SOUND} tied on her forehead.` },
  e_oboro: { one: `Oboro, a Hidden Rain genin: a boy with a hooded cloak, a rebreather over his mouth, dark spiky hair, and a ${'cloth forehead protector with ' + VILLAGE_PLATE.rain}.` },
  e_misty_follower: { one: `A Hidden Rain genin follower: a hooded ninja in a dark cloak with a ${'cloth forehead protector with ' + VILLAGE_PLATE.rain} and a rebreather mask, eyes shadowed by the hood.` },
  e_mubi: { one: `Mubi, a Hidden Rain genin: a hooded ninja with a rebreather mask, dark hair and a ${'cloth forehead protector with ' + VILLAGE_PLATE.rain}.` },
  e_kagari: { one: `Kagari, a Hidden Rain genin: a hooded ninja with a rebreather mask, a ${'cloth forehead protector with ' + VILLAGE_PLATE.rain}, a dark cloak.` },
  e_yoroi: { one: `Yoroi Akado, a Sound spy posing as a Leaf genin: a tall man wearing dark round sunglasses and a dark mask over the lower face, a bandanna-style ${LEAF} covering his hair, a purple outfit and a white sash.` },
  e_misumi: { one: `Misumi Tsurugi, a Sound spy posing as a Leaf genin: a lanky man with round glasses, a dark mask over the lower face, a bandanna-style ${LEAF}, a purple outfit with a white sash.` },
  e_sand_ninja: { one: `A Hidden Sand ninja: a chunin in the Sand's beige-grey flak vest over a dark outfit, a cloth hood, and a ${SAND}.` },
  e_sound_ninja: { one: `A Hidden Sound ninja: a soldier in a grey outfit with a large fur-lined collar and camouflage-pattern trousers, a ${SOUND} worn as a bandanna.` },
  e_hashirama: { one: `Hashirama Senju, the First Hokage, as a reanimated corpse: long straight dark brown hair, dark red samurai-style plate armour, but with grey-ashen skin, black sclera with white irises and dark cracks across the face.` },
  e_tobirama: { one: `Tobirama Senju, the Second Hokage, as a reanimated corpse: short spiky white hair, three red marks on his face (one on each cheek and the chin), a white fur collar over blue plate armour with a Senju crest and a metal headpiece, grey-ashen skin, black sclera with white irises, dark cracks across the face.` },
  e_manda: { one: `Manda, a colossal purple snake summon with dark stripes, yellow slit-pupil eyes, and a wide fanged mouth held closed; shown as a head-and-neck portrait.` },
  e_aoi: { one: `Aoi Rokusho, a rogue Leaf jonin serving the Hidden Rain: a man with long green hair, dark eyes, a smug expression, a dark outfit with a ${'cloth forehead protector with ' + VILLAGE_PLATE.rain} and an umbrella at his back.` },
  e_ukon: { one: `Ukon of the Sound Four, Sakon's twin: a teenage boy with pale blue-grey hair over one eye, dark eyes with purple lip markings, a cruel grin held closed, a black outfit with a purple rope belt and a ${SOUND}.` },
  e_doki: { one: `A Doki, one of Tayuya's three summoned ogre-like giants: a hulking grey-skinned demon with a blindfold-like cloth over its eyes, a gaping stitched mouth, wild hair, bandaged arms, a tattered kimono; shown head and shoulders.` },
  e_kurosuki: { one: `A member of the Kurosuki Family, a rogue Hidden Mist thug: a stocky man with a black bandanna, a scarred face, a ${SCRATCHED('mist')} at the arm, a dark sleeveless top.` },
  e_raiga: { one: `Raiga Kurosuki, a rogue swordsman of the Hidden Mist: a man with long shaggy dark teal hair, dark rings under his eyes, sharp teeth in a snarl held closed, a ${SCRATCHED('mist')} worn low, a dark outfit and the twin Kiba lightning blades at his hips.` },
  e_ranmaru: { one: `Ranmaru, a frail young boy with long lavender hair, pale lavender eyes with a faint glow, a fragile serene expression, wrapped in a dark cloak; no headband.` },
  e_clay_bird: { one: `Deidara's white clay bird: a large stylised bird sculpted from smooth white clay, with a simple beak and small round eyes; shown head and neck.` },
  e_wood_clone: { one: `A wood clone of Yamato: the same man with short brown hair and a happuri face guard engraved with the Leaf symbol, but rendered with a brown wood-grain texture across the skin, in the green Leaf flak vest.` },
  e_fuka: { one: `Fuka, a kunoichi of the Twelve Guardian Ninja's rogue faction (Shippuden): a beautiful woman with long dark wavy hair (with shifting streaks of colour), sultry eyes, a confident smirk held closed, a revealing dark kimono; no headband.` },
  e_fudo: { one: `Fudo of the rogue Twelve Guardian Ninja faction (Shippuden): a huge, heavy-set man with a shaved head and a thick neck, a grim stony face, a dark outfit with rope belts and bandaged fists; no headband.` },
  e_sora: { one: `Sora, a young monk of the Fire Temple (Shippuden): a teenage boy with spiky blue-grey hair, sharp eyes, a cocky expression, monk robes with a beige cloth wrapped over one shoulder, his right arm bandaged; no headband.` },
  e_revived_soul: { one: `A revived soul of the Fire Temple's dead: a pale ghost-like ninja with a hollow expression, glowing white eyes, ragged dark clothes, an ashen translucent look.` },
  e_kazuma: { one: `Kazuma of the Twelve Guardian Ninja (Shippuden): a tall man with long dark hair, dark eyes, a thin moustache and beard, a cold aristocratic expression, a grey robe with a guardian's white sash bearing the kanji for "fire" (火).` },
  e_masked_beast: { one: `One of Kakuzu's masked beasts: a shadowy black mass of dark threads with a white tribal mask for a face, hollow eyes, and a gaping mouth; shown head-on.` },
  e_kigiri: { one: `Kigiri, a rogue Sound ninja (Shippuden): a young man with wild hair, a bandanna, dark eyes, a curse-mark tinge, a dark outfit and a scratched ${SOUND}-style band.` },
  e_smoke_clone: { one: `A smoke clone: a ninja silhouette formed of drifting grey smoke with vague dark eyes, dissolving at the edges.` },
  e_nurari: { one: `Nurari, a rogue Sound ninja (Shippuden): a lanky man with long slicked hair, narrow eyes, a sly face, a dark outfit with a scratched ${SOUND}-style band.` },
  e_guren: { one: `Guren, a kunoichi of the Crystal Style (Shippuden): a woman with short dark blue-teal hair with a longer lock over one eye, brown eyes, an intense proud expression, a dark green sleeveless top with a wide dark sash; no headband.` },
  e_three_tails: { one: `The Three-Tails (Isobu), a colossal grey-green turtle-like tailed beast with a spiked shell, a single red eye visible (the other side covered), a crab-like mouth held closed; shown as a head-and-shell portrait.` },
  e_c2_dragon: { one: `Deidara's C2 clay dragon: a large stylised dragon sculpted from smooth white clay with a long jaw, small eyes and swept-back horns; shown head and neck.` },
  e_tobi: { one: `Tobi of the Akatsuki (Shippuden): a man in ${AKATSUKI} with a black hood down, his face fully covered by an orange spiral mask with a single eyehole on the right through which one dark eye shows; spiky black hair above the mask.` },
  e_rain_ninja: { one: `A Hidden Rain ninja of Pain's village (Shippuden): a ninja in a dark rubber-like rain suit and hood with a rebreather-style mask, dark eyes, a ${'cloth forehead protector with ' + VILLAGE_PLATE.rain} over the hood.` },
  e_summoned_beast: { one: `A summoned beast of the Animal Path: a giant chameleon-like or dog-like creature with grey skin, black-and-orange ringed Rinnegan eyes and black piercings on its face; shown as a head portrait.` },
  e_pain_animal: { one: `Pain (the Animal Path) of the Akatsuki (Shippuden): a tall man with long spiky orange hair, purple ringed Rinnegan eyes and many black metal piercings on the nose and ears, a blank expression, ${AKATSUKI}, a ${SCRATCHED('rain')}.` },
  e_pain_asura: { one: `Pain (the Asura Path) of the Akatsuki (Shippuden): a bald man with a long topknot ponytail of orange hair, purple ringed Rinnegan eyes, black piercings, and mechanical seams on the face, ${AKATSUKI}, a ${SCRATCHED('rain')}.` },
  e_pain_naraka: { one: `Pain (the Naraka Path) of the Akatsuki (Shippuden): a heavy-set man with short spiky orange hair, purple ringed Rinnegan eyes and black piercings, a stern face, ${AKATSUKI}, a ${SCRATCHED('rain')}.` },
  e_pain_preta: { one: `Pain (the Preta Path) of the Akatsuki (Shippuden): a heavy-set man with short orange hair and a broad face, purple ringed Rinnegan eyes, black piercings across the face, ${AKATSUKI}, a ${SCRATCHED('rain')}.` },
  e_crow_clone: { one: `Itachi Uchiha's crow clone: the same young man with a low black ponytail, red Sharingan eyes and ${AKATSUKI}, but his outline breaking apart into a flock of black crows at the edges.` },
  e_bandit_ninja: { one: `A bandit ninja: a rough rogue in mismatched dark clothes, a bandanna and a scarred face, a scratched forehead protector with an unreadable plate.` },
  e_tracker_ninja: { one: `A Hidden Mist tracker ninja (a hunter-nin): a lean ninja in a dark high-collared outfit with a white porcelain mask painted with red wave lines covering the whole face, dark hair tied back, and a ${MIST} above the mask.` },
  e_shiranami: { one: `Shiranami of the Tsuchigumo clan (Shippuden): a young man with long straight silver-grey hair, cold dark eyes, a superior smirk held closed, a dark high-collared robe; no headband.` },
  e_danzo: { one: `Danzo Shimura, the leader of the Foundation (Shippuden): an old man with shaggy black hair, his right eye and most of the right side of his face wrapped in white bandages, one visible dark eye, a scar on his chin, a grim closed expression. He wears a white robe under a dark grey cloak with his right arm hidden in a sling.` },
  e_giant_squid: { one: `A giant squid: a massive pale purple-grey squid with a great round eye and trailing tentacles, seen from the front.` },
  e_nine_tails: { one: `The Nine-Tails (Kurama), a colossal orange-red fox with long black-tipped ears, red eyes with slit pupils, thick black markings around the eyes and a snarling mouth held closed; shown as a head portrait.` },
  e_kinkaku: { one: `Kinkaku of the Gold and Silver Brothers, reanimated (Shippuden): a huge muscular man with long wild blond hair, a horned Cloud-style headpiece, black sclera with white irises, dark cracks on the face, and golden chakra flickering around him; a white Hidden Cloud flak vest.` },
  e_ginkaku: { one: `Ginkaku of the Gold and Silver Brothers, reanimated (Shippuden): a huge muscular man with long wild silver hair, a horned Cloud-style headpiece, black sclera with white irises, dark cracks on the face; a white Hidden Cloud flak vest.` },
  e_mu_fragment: { one: `Mu, the Second Tsuchikage, reanimated and split (Shippuden): a slim man wrapped completely in white bandages with only narrow eyes showing, a Stone-style ${'cloth forehead protector with ' + VILLAGE_PLATE.stone}, a tall red hat, black sclera with white irises.` },
  e_mu: { one: `Mu, the Second Tsuchikage, reanimated (Shippuden): a slim man wrapped in white bandages showing only narrow eyes, a ${'cloth forehead protector with ' + VILLAGE_PLATE.stone}, a tall red Tsuchikage hat, black sclera with white irises and dark cracks.` },
  e_four_tails: { one: `The Four-Tails (Son Goku), a colossal red-furred ape-like tailed beast with a green mane, thick horns, yellow eyes and a fanged mouth held closed; shown as a head portrait.` },
  e_ten_tails_clone: { one: `A clone spawned by the Ten-Tails: a pale white-grey humanoid creature with no face features except a single large eye pattern, ragged skin and spiky growths; shown head and shoulders.` },
  e_foundation_op: { one: `A Foundation operative (Root ANBU) of the Hidden Leaf (Shippuden): a ninja in a white porcelain animal-style mask with red and green markings, a black hooded cloak, and a short tanto over the shoulder.` },
  e_gotta: { one: `Gotta, a Foundation operative: a young man with short dark hair, blank dark eyes, a pale expressionless face, a short black jacket and a black ${LEAF}.` },
  e_kaguya: { one: `Kaguya Otsutsuki, the Mother of Chakra (Shippuden): a pale woman with extremely long white hair spreading behind her, two horn-like protrusions on the head, white pupil-less Byakugan eyes, a red third eye (Rinne Sharingan) on her forehead, a cold serene expression; she wears a high-collared white kimono robe with black tomoe markings.` },
  npc_hotaru: { one: `Hotaru of the Tsuchigumo clan (Shippuden): a young woman with long blond hair and a fringe, green eyes, a determined earnest face, a dark high-collared travelling outfit; no headband.` },
  npc_leaf_villager: { one: `A civilian of the Hidden Leaf Village: a plainly dressed villager in a simple beige and brown kimono-style outfit, no headband, a worried face.` },
  npc_motoi: { one: `Motoi of the Hidden Cloud (Shippuden): a dark-skinned man with a shaved head, a short beard, calm dark eyes, a white ${'cloth forehead protector with ' + VILLAGE_PLATE.cloud} and a white Cloud flak vest.` },
  npc_tazuna: { one: `Tazuna, the elderly bridge builder of the Land of Waves: a man with grey hair, a grey beard, round glasses, a rope headband, a sleeveless shirt and a towel around the neck; a weary stubborn face.` },
  npc_tsunami: { one: `Tsunami, Tazuna's daughter from the Land of Waves: a woman with long dark blue-black hair, dark eyes, a kind gentle face, a pink shirt with a long dark blue skirt; no headband.` },
  npc_idate: { one: `Idate Morino, a young runner of the Land of Tea: a boy with short messy dark hair, a bandanna, dark eyes, a stubborn face, a sleeveless white shirt with a blue cloth at the neck; no headband.` },
  npc_rokusuke: { one: `Rokusuke, a villager of the Katabami Gold Mine: a thin, tired man with short dark hair, a lined face, a ragged miner's outfit; no headband.` },
  e_puppet: { one: `One of Sasori's human puppets: a wooden puppet with jointed limbs, a pale carved face with painted features and hollow eyes, wisps of hair, a dark cloak.` },
  e_itachi_clone: { one: `Itachi Uchiha's shadow clone: the same young man with a low black ponytail, red Sharingan eyes, the deep lines under his eyes, ${AKATSUKI} and a ${SCRATCHED('leaf')}.` },
};

/** Which descriptions the manifest may still miss: an enemy id → the description key it should use instead of its own id. */
export const ALIASES = {
  e_mizuki_clash: 'e_mizuki', e_kagari_tea: 'e_kagari', e_aoi_boss: 'e_aoi', e_kurosuki_diver: 'e_kurosuki', e_raiga_boss: 'e_raiga',
  e_kazuma_boss: 'e_kazuma', e_guren_boss: 'e_guren', e_shiranami_boss: 'e_shiranami', e_danzo_boss: 'e_danzo', e_mu_boss: 'e_mu',
  e_kaguya_boss: 'e_kaguya', e_foundation_sniper: 'e_foundation_op', e_pain_deva: 'pain', e_pain_boss: 'pain', e_pain_sixpaths: 'pain', e_br_pain: 'pain',
  e_nagato_boss: 'pain',
};
