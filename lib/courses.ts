export type Course = {
  slug: string;
  title: string;
  subtitle: string;
  category: "古典詩詞" | "古文選讀" | "文學史" | "寫作與賞析";
  excerpt: string;
  description: string;
  lessons: number;
  duration: string;
  accent: string;
  featured?: boolean;
  outline: string[];
  audiences: string[];
};

export const courses: Course[] = [
  {
    slug: "tang-poetry-and-life",
    title: "唐詩導讀：盛世的詩心與人生",
    subtitle: "從初唐到晚唐，讀懂詩人的生命處境與創作風格",
    category: "古典詩詞",
    excerpt: "沿著唐詩的時代脈絡，理解李白、杜甫、王維等詩人如何回應世界。",
    description:
      "這不只是一堂背誦名篇的課，而是一趟走進唐代生活現場的旅程。我們從時代、地景與詩人際遇出發，重新感受熟悉詩句中的選擇、失落與曠達。",
    lessons: 12,
    duration: "24 小時",
    accent: "mist",
    featured: true,
    outline: ["盛唐氣象與詩歌的新格局", "李白：自由精神與想像之境", "杜甫：時代苦難與深情凝視", "王維：山水、禪意與內在安頓"],
    audiences: ["想有系統理解唐詩發展的讀者", "希望提升詩詞鑑賞能力的學習者", "喜歡從文學思考人生的你"],
  },
  {
    slug: "classical-prose-reading",
    title: "古文觀止精讀",
    subtitle: "精選歷代名家散文，建立閱讀古文的清晰方法",
    category: "古文選讀",
    excerpt: "從篇章結構、語氣與歷史背景入手，讀懂古人的論辯、情感與智慧。",
    description:
      "選讀先秦至明代的重要篇章，以逐段導讀與關鍵字詞解析，拆解古文看似艱深的門檻，逐步建立可以獨立閱讀的能力。",
    lessons: 10,
    duration: "20 小時",
    accent: "bamboo",
    featured: true,
    outline: ["古文閱讀的三個入口", "先秦說理文的辯證力量", "唐宋古文的情理與格局", "明代小品的日常美學"],
    audiences: ["對古文有興趣但不知如何開始的人", "希望重新建立國文底子的成人", "教師與文字工作者"],
  },
  {
    slug: "song-ci-emotional-world",
    title: "詞的情感世界：從婉約到豪放",
    subtitle: "走進宋詞細膩而遼闊的情感宇宙",
    category: "古典詩詞",
    excerpt: "從柳永、李清照到蘇軾、辛棄疾，聽見不同生命姿態的聲音。",
    description:
      "詞原是配樂歌唱的文體，也成為古人最細膩的心靈容器。課程將兼顧聲律、意象與生命史，讀出婉約之外的深度，也理解豪放背後的柔軟。",
    lessons: 8,
    duration: "16 小時",
    accent: "plum",
    featured: true,
    outline: ["詞體的誕生與歌唱傳統", "柳永與城市中的離情", "李清照的時間與記憶", "蘇軾、辛棄疾的豪放與不平"],
    audiences: ["喜愛宋詞與古典美學的讀者", "想深入理解情感書寫的人", "希望豐富創作語彙的寫作者"],
  },
  {
    slug: "records-of-history-wisdom",
    title: "經典選讀：史記的人生智慧",
    subtitle: "在人物成敗之間，看見選擇、性格與時代",
    category: "文學史",
    excerpt: "從史記故事出發，理解古人處世之道與人性的複雜層次。",
    description:
      "透過《史記》的經典人物與關鍵事件，辨析司馬遷如何以敘事寫人、以命運照見時代，並把歷史中的難題帶回當代生活。",
    lessons: 10,
    duration: "18 小時",
    accent: "mountain",
    featured: true,
    outline: ["司馬遷與《史記》的誕生", "項羽：性格如何成為命運", "張良與韓信的進退之道", "在歷史敘事中理解自己"],
    audiences: ["喜歡歷史人物與故事的讀者", "想培養敘事閱讀能力的人", "關心領導、選擇與人生進退的你"],
  },
  {
    slug: "poetry-writing",
    title: "詩詞意象與現代書寫",
    subtitle: "借古典意象，找到屬於自己的表達",
    category: "寫作與賞析",
    excerpt: "從月、風、花、雨等經典意象出發，練習觀察、轉化與書寫。",
    description: "將古典詩詞的感受力帶入現代創作，透過短篇練習與示例拆解，讓意象不只是典故，而是你可以使用的表達工具。",
    lessons: 6,
    duration: "12 小時",
    accent: "river",
    outline: ["意象如何承載情感", "從觀察到文字的轉化", "古典語彙的現代運用", "完成一組個人短詩"],
    audiences: ["想開始寫作卻常常卡住的人", "喜歡詩詞並希望實際創作的人", "需要培養文字感受力的內容工作者"],
  },
  {
    slug: "literary-history-intro",
    title: "中國文學史入門",
    subtitle: "用一張清晰地圖，理解三千年文學流變",
    category: "文學史",
    excerpt: "從先秦到明清，掌握文體、時代與重要作家的關係。",
    description: "以易懂的時間軸與主題地圖串聯重要文體，建立日後閱讀詩詞、散文與小說時可持續擴充的知識框架。",
    lessons: 14,
    duration: "28 小時",
    accent: "scroll",
    outline: ["先秦文學與思想源流", "漢魏六朝的文體自覺", "唐宋文學的高峰", "元明清敘事文學的展開"],
    audiences: ["第一次系統學習文學史的人", "準備相關考試的學習者", "希望補足閱讀背景的愛書人"],
  },
];

export const categories = ["全部", "古典詩詞", "古文選讀", "文學史", "寫作與賞析"] as const;

export function getCourse(slug: string) {
  return courses.find((course) => course.slug === slug);
}
