import type { Invitation, OccasionId } from "@/types/invitation";

export type WordingLanguage = "english" | "hinglish" | "hindi" | "punjabi" | "marathi" | "gujarati";
export type WordingPatch = Required<Pick<Invitation, "coverText" | "intro" | "message" | "closingText">>;

// Wording is chosen explicitly by the host, independently of tradition or names.
export const wordingLanguages: { id: WordingLanguage; label: string; locale: string }[] = [
  { id: "english", label: "English", locale: "en-IN" },
  { id: "hinglish", label: "Hinglish · Hindi + English", locale: "hi-Latn-IN" },
  { id: "hindi", label: "हिन्दी · Hindi", locale: "hi-IN" },
  { id: "punjabi", label: "ਪੰਜਾਬੀ · Punjabi", locale: "pa-Guru-IN" },
  { id: "marathi", label: "मराठी · Marathi", locale: "mr-IN" },
  { id: "gujarati", label: "ગુજરાતી · Gujarati", locale: "gu-IN" },
];

type OccasionLines = Record<OccasionId, readonly [cover: string, intro: string]>;
const occasionLines: Record<WordingLanguage, OccasionLines> = {
  english: {
    wedding: ["With our favourite people, a new beginning", "We’re getting married, and we’d love you to be there."],
    engagement: ["A little promise, a lifetime ahead", "Join us as we celebrate our engagement."],
    birthday: ["Another year, a little more magic", "Come for the birthday cake. Stay for the happy memories."],
    "baby-shower": ["A little love is on the way", "Join us to celebrate our growing family."],
    housewarming: ["A new address, the same warm welcome", "Help us fill our new home with happy memories."],
    naming: ["A little name, a world of love", "Join us for our little one’s naming celebration."],
    anniversary: ["Still choosing each other", "Celebrate another chapter of our story with us."],
    remembrance: ["Held close in our memories", "A quiet gathering to remember a cherished life."],
    other: ["Good company, lovely memories", "There’s a place for you at our gathering."],
  },
  hinglish: {
    wedding: ["Shaadi apni, khushiyaan sabki", "Hamari new beginning mein aapka hona banta hai!"],
    engagement: ["Ek promise, aur bahut saara pyaar", "Hamari engagement ki khushiyon mein zaroor aana."],
    birthday: ["Cake bhi, masti bhi, aap bhi!", "Birthday hai—thodi masti toh banti hai!"],
    "baby-shower": ["Little guest, dher saara pyaar", "Ek nanhi si new beginning, apno ke saath."],
    housewarming: ["Naya ghar, apno ka intezaar", "New address, wahi apnapan. Ghar zaroor aana!"],
    naming: ["Chhota sa naam, dher saara pyaar", "Hamare little one ke naming day par zaroor aana."],
    anniversary: ["Wahi pyaar, ek aur beautiful year", "Hamari kahaani ke ek aur saal ko saath celebrate karein."],
    remembrance: ["Yaadein, jo saath rehti hain", "Milkar yaad karein, pyaar se."],
    other: ["Mil baithenge, yaadein banayenge", "Good company aur dil se baatein—aap zaroor aana."],
  },
  hindi: {
    wedding: ["अपनों के साथ, एक नई शुरुआत", "हमारी शादी की खुशियों में शामिल हों।"],
    engagement: ["एक वादा, ढेर सारा प्यार", "हमारी सगाई की खुशियाँ हमारे साथ बाँटें।"],
    birthday: ["एक और साल, ढेर सारी मुस्कानें", "जन्मदिन की खुशियाँ मिलकर मनाएँ।"],
    "baby-shower": ["एक नन्ही सी आहट, ढेर सारा प्यार", "हमारे बढ़ते परिवार की खुशियों में शामिल हों।"],
    housewarming: ["नया घर, अपनों का इंतज़ार", "आइए, हमारे नए घर को अपनी हँसी से सजाएँ।"],
    naming: ["एक प्यारा सा नाम, एक नई पहचान", "हमारे नन्हे से बच्चे के नामकरण में शामिल हों।"],
    anniversary: ["साथ के साल, प्यार के पल", "हमारी सालगिरह की खुशियाँ हमारे साथ मनाएँ।"],
    remembrance: ["प्यार भरी यादों में", "एक प्रिय जीवन को याद करने के लिए साथ बैठें।"],
    other: ["मिल बैठें, कुछ यादें बनाएँ", "आपके साथ यह मिलन और भी खास होगा।"],
  },
  punjabi: {
    wedding: ["ਆਪਣਿਆਂ ਦੇ ਨਾਲ, ਇੱਕ ਨਵੀਂ ਸ਼ੁਰੂਆਤ", "ਸਾਡੇ ਵਿਆਹ ਦੀਆਂ ਖੁਸ਼ੀਆਂ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਵੋ।"],
    engagement: ["ਇੱਕ ਵਾਅਦਾ, ਬਹੁਤ ਸਾਰਾ ਪਿਆਰ", "ਸਾਡੀ ਮੰਗਣੀ ਦੀਆਂ ਖੁਸ਼ੀਆਂ ਸਾਡੇ ਨਾਲ ਸਾਂਝੀਆਂ ਕਰੋ।"],
    birthday: ["ਇੱਕ ਹੋਰ ਸਾਲ, ਢੇਰ ਸਾਰੀਆਂ ਮੁਸਕਾਨਾਂ", "ਆਓ, ਜਨਮਦਿਨ ਦੀਆਂ ਖੁਸ਼ੀਆਂ ਇਕੱਠੇ ਮਨਾਈਏ।"],
    "baby-shower": ["ਇੱਕ ਨਿੱਕੇ ਜੀਅ ਲਈ, ਢੇਰ ਸਾਰਾ ਪਿਆਰ", "ਸਾਡੇ ਵਧਦੇ ਪਰਿਵਾਰ ਦੀ ਖੁਸ਼ੀ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਵੋ।"],
    housewarming: ["ਨਵਾਂ ਘਰ, ਆਪਣਿਆਂ ਦੀ ਉਡੀਕ", "ਆਓ, ਸਾਡੇ ਨਵੇਂ ਘਰ ਨੂੰ ਹਾਸਿਆਂ ਨਾਲ ਭਰ ਦਈਏ।"],
    naming: ["ਇੱਕ ਪਿਆਰਾ ਜਿਹਾ ਨਾਂ, ਇੱਕ ਨਵੀਂ ਪਛਾਣ", "ਸਾਡੇ ਬੱਚੇ ਦਾ ਨਾਂ ਰੱਖਣ ਦੀ ਖੁਸ਼ੀ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਵੋ।"],
    anniversary: ["ਸਾਥ ਦੇ ਸਾਲ, ਪਿਆਰ ਦੇ ਪਲ", "ਸਾਡੀ ਵਰ੍ਹੇਗੰਢ ਦੀਆਂ ਖੁਸ਼ੀਆਂ ਸਾਡੇ ਨਾਲ ਮਨਾਓ।"],
    remembrance: ["ਪਿਆਰੀਆਂ ਯਾਦਾਂ ਵਿੱਚ", "ਇੱਕ ਪਿਆਰੀ ਜ਼ਿੰਦਗੀ ਨੂੰ ਯਾਦ ਕਰਨ ਲਈ ਇਕੱਠੇ ਬੈਠੀਏ।"],
    other: ["ਮਿਲ ਬੈਠੀਏ, ਯਾਦਾਂ ਬਣਾਈਏ", "ਤੁਹਾਡੇ ਨਾਲ ਇਹ ਮਿਲਣੀ ਹੋਰ ਵੀ ਖ਼ਾਸ ਹੋਵੇਗੀ।"],
  },
  marathi: {
    wedding: ["आपल्या माणसांसोबत, एक नवी सुरुवात", "आमच्या लग्नाच्या आनंदात सहभागी व्हा."],
    engagement: ["एक वचन, आयुष्यभराची साथ", "आमच्या साखरपुड्याचा आनंद साजरा करायला या."],
    birthday: ["आणखी एक वर्ष, हसरे नवे क्षण", "वाढदिवसाचा आनंद एकत्र साजरा करूया."],
    "baby-shower": ["चिमुकल्या पावलांची चाहूल", "आमच्या कुटुंबातील नव्या सुरुवातीचा आनंद वाटून घ्यायला या."],
    housewarming: ["नवे घर, आपल्या माणसांची वाट", "आमच्या नव्या घरी या, गप्पा आणि आठवणींची भर घाला."],
    naming: ["एक गोड नाव, एक नवी ओळख", "आमच्या लाडक्या बाळाच्या नामकरणासाठी अवश्य या."],
    anniversary: ["सहवासाची वर्षे, प्रेमाचे क्षण", "आमच्या लग्नाच्या वाढदिवसाचा आनंद साजरा करायला या."],
    remembrance: ["जपलेल्या आठवणींसोबत", "एका प्रिय व्यक्तीच्या आठवणींना उजाळा देण्यासाठी एकत्र येऊया."],
    other: ["भेटूया, गप्पा मारूया", "आपल्या भेटीने हा दिवस आणखी खास होईल."],
  },
  gujarati: {
    wedding: ["પોતાના લોકો સાથે, એક નવી શરૂઆત", "અમારા લગ્નની ખુશીમાં સહભાગી થાઓ."],
    engagement: ["એક વચન, જીવનભરનો સાથ", "અમારી સગાઈની ખુશી સાથે મળીને ઉજવીએ."],
    birthday: ["વધુ એક વર્ષ, ઘણી બધી ખુશીઓ", "જન્મદિવસની ખુશી સાથે મળીને ઉજવીએ."],
    "baby-shower": ["નાનાં પગલાંની આહટ, ઘણો બધો પ્રેમ", "અમારા પરિવારની આ નવી શરૂઆતની ખુશીમાં જોડાઓ."],
    housewarming: ["નવું ઘર, પોતાના લોકોની રાહ", "અમારા નવા ઘરે પધારો, સાથે મીઠી યાદો બનાવીએ."],
    naming: ["એક મીઠું નામ, એક નવી ઓળખ", "અમારા બાળકના નામકરણમાં સહભાગી થાઓ."],
    anniversary: ["સાથનાં વર્ષો, પ્રેમની પળો", "અમારી લગ્નવર્ષગાંઠનો આનંદ સાથે મળીને ઉજવીએ."],
    remembrance: ["સ્નેહભરી યાદોમાં", "એક પ્રિય વ્યક્તિની યાદો વહેંચવા સાથે બેસીએ."],
    other: ["મળીએ, વાતો કરીએ, યાદો બનાવીએ", "તમારા સાથથી આ મેળાવડો વધુ ખાસ બનશે."],
  },
};

type BodyCopy = Pick<WordingPatch, "message" | "closingText">;
const warmCopy: Record<WordingLanguage, BodyCopy> = {
  english: { message: "We’re bringing our favourite people together for a special day. Join us, share a few smiles, and help us make some lovely memories.", closingText: "With love, and a place saved for you" },
  hinglish: { message: "Apno ke saath kuch pyaare moments banane hain. Aap zaroor aana—saath milkar is din ko aur bhi special banayenge.", closingText: "Aapka intezaar rahega—dil se, with love" },
  hindi: { message: "इस खास दिन की खुशियाँ हम अपनों के साथ बाँटना चाहते हैं। आइए, मिलकर कुछ प्यारी यादें बनाएँ।", closingText: "स्नेह सहित, आपके आने का इंतज़ार रहेगा" },
  punjabi: { message: "ਇਸ ਖ਼ਾਸ ਦਿਨ ਦੀਆਂ ਖੁਸ਼ੀਆਂ ਅਸੀਂ ਆਪਣਿਆਂ ਨਾਲ ਸਾਂਝੀਆਂ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹਾਂ। ਆਓ, ਮਿਲ ਕੇ ਕੁਝ ਪਿਆਰੀਆਂ ਯਾਦਾਂ ਬਣਾਈਏ।", closingText: "ਪਿਆਰ ਨਾਲ, ਤੁਹਾਡੀ ਉਡੀਕ ਰਹੇਗੀ" },
  marathi: { message: "या खास दिवसाचा आनंद आपल्या माणसांसोबत वाटून घ्यायचा आहे. अवश्य या, एकत्र मिळून सुंदर आठवणी जपूया.", closingText: "सस्नेह, तुमच्या आगमनाची वाट पाहत आहोत" },
  gujarati: { message: "આ ખાસ દિવસની ખુશી અમે પોતાના લોકો સાથે વહેંચવા માંગીએ છીએ. જરૂર પધારો, સાથે મળીને સુંદર યાદો બનાવીએ.", closingText: "સ્નેહપૂર્વક, તમારા આગમનની રાહ જોઈશું" },
};
const weddingCopy: Record<WordingLanguage, BodyCopy> = {
  english: { message: "Join us and our families as we celebrate the beginning of our life together. Your company will make this day even more special.", closingText: "With love, and a place saved for you" },
  hinglish: { message: "Dil se invitation hai—hamari shaadi ki khushiyon mein zaroor aana. Apni favourite smiles aur thode dance moves saath lana.", closingText: "Aapka intezaar rahega—dil se, with love" },
  hindi: { message: "हम अपने परिवारों के साथ आपको हमारी शादी में स्नेहपूर्वक आमंत्रित करते हैं। आपका साथ इस दिन को और भी खास बना देगा।", closingText: "स्नेह सहित, आपके आने का इंतज़ार रहेगा" },
  punjabi: { message: "ਅਸੀਂ ਆਪਣੇ ਪਰਿਵਾਰਾਂ ਨਾਲ ਤੁਹਾਨੂੰ ਆਪਣੇ ਵਿਆਹ ਵਿੱਚ ਪਿਆਰ ਨਾਲ ਸੱਦਾ ਦਿੰਦੇ ਹਾਂ। ਤੁਹਾਡਾ ਸਾਥ ਇਸ ਦਿਨ ਨੂੰ ਹੋਰ ਵੀ ਖ਼ਾਸ ਬਣਾ ਦੇਵੇਗਾ।", closingText: "ਪਿਆਰ ਨਾਲ, ਤੁਹਾਡੀ ਉਡੀਕ ਰਹੇਗੀ" },
  marathi: { message: "आमच्या आयुष्याच्या या नव्या प्रवासाची सुरुवात तुमच्या सोबतीने व्हावी, हीच इच्छा. सहकुटुंब या आणि आमच्या आनंदात सहभागी व्हा.", closingText: "सस्नेह, तुमच्या आगमनाची वाट पाहत आहोत" },
  gujarati: { message: "અમારા નવા જીવનની શરૂઆત તમારી સાથે થાય એવી અમારી ઇચ્છા છે. પરિવાર સાથે પધારો અને અમારી ખુશીમાં સહભાગી થાઓ.", closingText: "સ્નેહપૂર્વક, તમારા આગમનની રાહ જોઈશું" },
};
const remembranceCopy: Record<WordingLanguage, BodyCopy> = {
  english: { message: "Please join us to share memories of a life we hold dear. Your presence will bring comfort as we remember together.", closingText: "With love and shared memories" },
  hinglish: { message: "Kuch yaadein baantne aur ek doosre ka saath dene ke liye hamare saath baithiye. Is waqt aapka saath hamare parivaar ke liye bahut maayne rakhta hai.", closingText: "Pyaar aur unki yaadon ke saath" },
  hindi: { message: "आइए, एक प्रिय जीवन की यादें बाँटने और एक-दूसरे का साथ देने के लिए साथ बैठें। इस समय आपका साथ हमारे परिवार को संबल देगा।", closingText: "प्यार और साझा यादों के साथ" },
  punjabi: { message: "ਆਓ, ਇਕੱਠੇ ਬੈਠ ਕੇ ਪਿਆਰੀਆਂ ਯਾਦਾਂ ਸਾਂਝੀਆਂ ਕਰੀਏ। ਇਸ ਵੇਲੇ ਤੁਹਾਡਾ ਸਾਥ ਸਾਡੇ ਪਰਿਵਾਰ ਨੂੰ ਹੌਸਲਾ ਦੇਵੇਗਾ।", closingText: "ਪਿਆਰ ਅਤੇ ਸਾਂਝੀਆਂ ਯਾਦਾਂ ਨਾਲ" },
  marathi: { message: "एका प्रिय व्यक्तीच्या आठवणींना उजाळा देण्यासाठी आणि एकमेकांना आधार देण्यासाठी एकत्र येऊया. या वेळी तुमची साथ आमच्या कुटुंबाला धीर देईल.", closingText: "स्नेह आणि जपलेल्या आठवणींसह" },
  gujarati: { message: "એક પ્રિય વ્યક્તિની યાદો વહેંચવા અને એકબીજાને સાથ આપવા ભેગા થઈએ. આ સમયે તમારો સાથ અમારા પરિવારને હિંમત આપશે.", closingText: "સ્નેહ અને સાચવેલી યાદો સાથે" },
};

export function getWordingPreset(occasion: OccasionId | undefined, language: WordingLanguage): WordingPatch {
  const selectedOccasion = occasion ?? "wedding";
  const [coverText, intro] = occasionLines[language][selectedOccasion];
  const body = selectedOccasion === "remembrance" ? remembranceCopy[language] : selectedOccasion === "wedding" ? weddingCopy[language] : warmCopy[language];
  return { coverText, intro, ...body };
}
