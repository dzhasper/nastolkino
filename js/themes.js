/* Сгенерировано из game/themes.py командой python tools_export_themes.py — правьте там. */
var GAME_DATA = {
 "THEMES": {
  "classic": {
   "title": "Класика",
   "emoji": "🕴️",
   "tagline": "Стара добра мафія: місто, ніч і постріли",
   "accent": "#ef4444",
   "accent2": "#7f1d1d",
   "twist": "Дон шукає комісара, Красуня відволікає, Маніяк грає сам за себе.",
   "kill_word": "убитий",
   "mafia_team": "Мафія",
   "town_team": "Мирне місто",
   "roles": {
    "mafia": {
     "name": "Мафіозі",
     "emoji": "🔫",
     "team": "mafia",
     "desc": "Уночі разом із сім’єю обираєш жертву.",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Убити",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Сім’я не пробачає."
    },
    "don": {
     "name": "Дон",
     "emoji": "🎩",
     "team": "mafia",
     "desc": "Голова сім’ї. Голосуєш за жертву й шукаєш комісара.",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Убити",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      },
      {
       "kind": "find_sheriff",
       "label": "Шукати комісара",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": true,
     "passive": null,
     "motto": "Пропозиція, від якої не можна відмовитися."
    },
    "sheriff": {
     "name": "Комісар",
     "emoji": "🕵️",
     "team": "town",
     "desc": "Щоночі перевіряєш одного гравця: мафія чи ні.",
     "abilities": [
      {
       "kind": "check_team",
       "label": "Перевірити",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": true,
     "leader": false,
     "passive": null,
     "motto": "Закон не спить."
    },
    "doctor": {
     "name": "Лікар",
     "emoji": "💉",
     "team": "town",
     "desc": "Уночі лікуєш одного гравця. Того самого — не дві ночі поспіль.",
     "abilities": [
      {
       "kind": "heal",
       "label": "Лікувати",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Не сьогодні."
    },
    "lover": {
     "name": "Красуня",
     "emoji": "💋",
     "team": "town",
     "desc": "Уночі відволікаєш гравця — його здібність не спрацює.",
     "abilities": [
      {
       "kind": "block",
       "label": "Відволікти",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Одна ніч — і ти забудеш, навіщо прийшов."
    },
    "maniac": {
     "name": "Маніяк",
     "emoji": "🔪",
     "team": "solo",
     "desc": "Граєш сам за себе. Убиваєш щоночі. Перемога — лишитися останнім.",
     "abilities": [
      {
       "kind": "kill",
       "label": "Убити",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Місто — моє."
    },
    "civ": {
     "name": "Мирний мешканець",
     "emoji": "🙂",
     "team": "town",
     "desc": "Знайди мафію вдень і вижени її голосуванням.",
     "abilities": [],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Просто дожити до ранку."
    }
   },
   "specials": [
    [
     "sheriff",
     4
    ],
    [
     "doctor",
     5
    ],
    [
     "don",
     6
    ],
    [
     "lover",
     8
    ],
    [
     "maniac",
     9
    ]
   ],
   "story": {
    "intro": [
     "Місто затихло. Десь у провулках сім’я вже ділить вулиці…"
    ],
    "night": [
     "Місто засинає. Прокидається мафія…",
     "Ліхтарі гаснуть. У темряві клацає затвор.",
     "Ніч. Десь удалині виє сирена."
    ],
    "dead": [
     "Уранці на набережній знайшли {name}. Це був {role}.",
     "{name} не прокинувся цього ранку. {role}.",
     "Газети кричать: «{name} убито!» Це був {role}."
    ],
    "dead_hidden": [
     "Уранці знайшли {name}. Місто в шоці.",
     "{name} більше немає з нами."
    ],
    "none": [
     "Дивно, але цієї ночі всі живі.",
     "Тиха ніч. Місто перелічило мешканців — усі на місці."
    ],
    "saved": [
     "Уночі хтось дивом вижив після нападу."
    ],
    "out": [
     "Місто вирішило: {name} покидає гру. Це був {role}.",
     "{name} вигнано голосуванням. {role}."
    ],
    "out_hidden": [
     "Місто вирішило: {name} покидає гру."
    ],
    "vote_none": [
     "Місто не змогло домовитися. Сьогодні ніхто не йде."
    ],
    "win_town": [
     "Мафію розбито! Місто може спати спокійно."
    ],
    "win_mafia": [
     "Місто впало. Тепер тут править сім’я."
    ],
    "win_solo": [
     "Місто спорожніло. Маніяк витирає ніж…"
    ]
   }
  },
  "90s": {
   "title": "Лихі 90-ті",
   "emoji": "📼",
   "tagline": "Малинові піджаки, стрілки й «дах»",
   "accent": "#facc15",
   "accent2": "#7e22ce",
   "twist": "Авторитет робить «наїзд» — жертва мовчить на голосуванні. У Комерсанта є «дах».",
   "kill_word": "завалили",
   "mafia_team": "Братки",
   "town_team": "Чесні громадяни",
   "roles": {
    "mafia": {
     "name": "Браток",
     "emoji": "🧥",
     "team": "mafia",
     "desc": "Уночі з братвою вирішуєш, кого «закрити».",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Закрити",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Усе по поняттях."
    },
    "don": {
     "name": "Авторитет",
     "emoji": "💰",
     "team": "mafia",
     "desc": "Смотрящий за районом. Голосуєш із братвою й робиш «наїзд»: жертва наїзду завтра не голосує.",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Закрити",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      },
      {
       "kind": "silence",
       "label": "Наїхати",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": true,
     "passive": null,
     "motto": "Район тримаю я."
    },
    "sheriff": {
     "name": "Опер",
     "emoji": "👮",
     "team": "town",
     "desc": "Щоночі пробиваєш одного по базі: братва чи ні.",
     "abilities": [
      {
       "kind": "check_team",
       "label": "Пробити",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": true,
     "leader": false,
     "passive": null,
     "motto": "Проб’ємо по базі."
    },
    "doctor": {
     "name": "Лікар швидкої",
     "emoji": "🚑",
     "team": "town",
     "desc": "Уночі відкачуєш одного. Того самого — не дві ночі поспіль.",
     "abilities": [
      {
       "kind": "heal",
       "label": "Відкачати",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Довеземо — відкачаємо."
    },
    "journalist": {
     "name": "Журналіст",
     "emoji": "📰",
     "team": "town",
     "desc": "Ведеш розслідування: дізнаєшся точну роль гравця.",
     "abilities": [
      {
       "kind": "check_role",
       "label": "Розслідувати",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Правда дорожча за життя."
    },
    "merchant": {
     "name": "Комерсант",
     "emoji": "💼",
     "team": "town",
     "desc": "У тебе є «дах»: перший замах ти переживеш.",
     "abilities": [],
     "sheriff": false,
     "leader": false,
     "passive": "armor",
     "motto": "У мене дах."
    },
    "killer": {
     "name": "Кілер-одинак",
     "emoji": "🎯",
     "team": "solo",
     "desc": "Працюєш тільки на себе. Щоночі — замовлення. Перемога — лишитися останнім.",
     "abilities": [
      {
       "kind": "kill",
       "label": "Виконати замовлення",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Нічого особистого — робота."
    },
    "civ": {
     "name": "Човник",
     "emoji": "🛍️",
     "team": "town",
     "desc": "Возиш шмотки з Туреччини й хочеш просто вижити. Вирахуй братву.",
     "abilities": [],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Туреччина, Польща, базар."
    }
   },
   "specials": [
    [
     "sheriff",
     4
    ],
    [
     "doctor",
     5
    ],
    [
     "don",
     6
    ],
    [
     "merchant",
     7
    ],
    [
     "journalist",
     8
    ],
    [
     "killer",
     10
    ]
   ],
   "story": {
    "intro": [
     "1994 рік. На районі новий смотрящий, а біля кіосків — підозрілі піджаки…"
    ],
    "night": [
     "Ніч. Біля кіоску гальмує чорний «мерс»…",
     "Пейджери мовчать. Братва йде на діло.",
     "Дев’яності не сплять: десь стрілка, десь розбірка."
    ],
    "dead": [
     "Уранці {name} знайшли в багажнику старої «бехи». Це був {role}.",
     "{name} не повернувся зі стрілки. {role}.",
     "По району чутка: {name} — усе. Це був {role}."
    ],
    "dead_hidden": [
     "{name} не повернувся зі стрілки.",
     "Уранці {name} знайшли в багажнику старої «бехи»."
    ],
    "none": [
     "Ніч минула спокійно. Навіть кіоск не спалили.",
     "Усі живі. Братва, мабуть, святкувала."
    ],
    "saved": [
     "Уночі на когось наїхали, але не вийшло — чи то дах, чи то швидка встигла."
    ],
    "silenced": [
     "На {name} був «наїзд»: сьогодні без права голосу."
    ],
    "out": [
     "Сходка вирішила: {name} — на вихід. Це був {role}.",
     "{name} відправлено «відпочивати». {role}."
    ],
    "out_hidden": [
     "Сходка вирішила: {name} — на вихід."
    ],
    "vote_none": [
     "Базар ні до чого не привів. Усі при своїх."
    ],
    "win_town": [
     "Братву взяли. На районі знову можна торгувати."
    ],
    "win_mafia": [
     "Район під братвою. Тепер усі платять."
    ],
    "win_solo": [
     "Замовлення виконано. Кілер розчинився в тумані 90-х."
    ]
   }
  },
  "halloween": {
   "title": "Ніч Гелловіну",
   "emoji": "🎃",
   "tagline": "Вампіри, відьми й перевертень у повню",
   "accent": "#f97316",
   "accent2": "#581c87",
   "twist": "Граф може один раз укусити — жертва стає вампіром. У Відьми є зілля життя й отрута, Перевертень виходить лише в повню.",
   "kill_word": "знекровлений",
   "mafia_team": "Вампіри",
   "town_team": "Село",
   "roles": {
    "mafia": {
     "name": "Вампір",
     "emoji": "🧛",
     "team": "mafia",
     "desc": "Уночі разом із кланом обираєш, чию кров випити.",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Випити кров",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Вічність голодна."
    },
    "don": {
     "name": "Граф",
     "emoji": "🦇",
     "team": "mafia",
     "desc": "Голова клану. Один раз за гру можеш укусити: жертва стане вампіром (цієї ночі клан нікого не вбиває).",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Випити кров",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      },
      {
       "kind": "convert",
       "label": "Укусити",
       "uses": 1,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": true,
     "passive": null,
     "motto": "Кров — це життя."
    },
    "sheriff": {
     "name": "Провидиця",
     "emoji": "🔮",
     "team": "town",
     "desc": "Дивишся в кришталеву кулю: вампір гравець чи ні.",
     "abilities": [
      {
       "kind": "check_team",
       "label": "Зазирнути в кулю",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": true,
     "leader": false,
     "passive": null,
     "motto": "Куля не бреше."
    },
    "witch": {
     "name": "Відьма",
     "emoji": "🧙",
     "team": "town",
     "desc": "У тебе два зілля на всю гру: зілля життя рятує, отрута вбиває.",
     "abilities": [
      {
       "kind": "heal",
       "label": "Зілля життя",
       "uses": 1,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      },
      {
       "kind": "kill",
       "label": "Отрута",
       "uses": 1,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Одне зілля врятує, інше — ні."
    },
    "hunter": {
     "name": "Мисливець на нечисть",
     "emoji": "🏹",
     "team": "town",
     "desc": "Один осиковий кілок на всю гру — використовуй із розумом.",
     "abilities": [
      {
       "kind": "shot",
       "label": "Осиковий кілок",
       "uses": 1,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Кілок завжди при мені."
    },
    "werewolf": {
     "name": "Перевертень",
     "emoji": "🐺",
     "team": "solo",
     "desc": "Сам за себе. Полюєш лише в повню (щодругої ночі). Перемога — лишитися останнім.",
     "abilities": [
      {
       "kind": "kill",
       "label": "Розтерзати",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": true
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Чекай на повню."
    },
    "civ": {
     "name": "Мешканець села",
     "emoji": "🕯️",
     "team": "town",
     "desc": "Замкни двері, запали свічки й вирахуй вампірів.",
     "abilities": [],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Свічки не гаснуть до світанку."
    }
   },
   "specials": [
    [
     "sheriff",
     4
    ],
    [
     "witch",
     5
    ],
    [
     "don",
     6
    ],
    [
     "hunter",
     8
    ],
    [
     "werewolf",
     9
    ]
   ],
   "story": {
    "intro": [
     "31 жовтня. Над селом туман, а в замку на пагорбі засвітилися вікна…"
    ],
    "night": [
     "Гарбузи гаснуть один за одним. Чути шурхіт крил…",
     "Місяць сходить над цвинтарем.",
     "Рипить брама замку. Клан виходить на полювання."
    ],
    "dead": [
     "На світанку {name} знайшли блідим, із двома цятками на шиї. Це був {role}.",
     "{name} не дожив до світанку. {role}.",
     "У тумані знайшли {name}. Це був {role}."
    ],
    "dead_hidden": [
     "{name} не дожив до світанку.",
     "У тумані знайшли {name}."
    ],
    "none": [
     "Дивовижно — цієї ночі всі живі.",
     "Свічки горіли до ранку. Ніхто не постраждав."
    ],
    "saved": [
     "Когось цієї ночі врятувало диво… або зілля."
    ],
    "full_moon": [
     "🌕 Сьогодні повня. Десь у лісі виє вовк…"
    ],
    "out": [
     "Село вирішило: {name} — на вогнище. Це був {role}.",
     "{name} вигнано із села. {role}."
    ],
    "out_hidden": [
     "Село вирішило: {name} — на вогнище."
    ],
    "vote_none": [
     "Село сперечалося до заходу сонця й нікого не вигнало."
    ],
    "win_town": [
     "Останній вампір розсипався на порох. Село врятовано!"
    ],
    "win_mafia": [
     "Село стало замком вампірів. Вічна ніч."
    ],
    "win_solo": [
     "Перевертень виє над порожнім селом."
    ]
   }
  },
  "bunker": {
   "title": "Бункер: Зараження",
   "emoji": "☣️",
   "tagline": "Вірус у бункері. Заражені серед своїх",
   "accent": "#84cc16",
   "accent2": "#14532d",
   "twist": "Нульовий пацієнт заражає: жертва переходить до заражених. Медик може врятувати й вилікувати, Інженер вимикає світло у відсіку.",
   "kill_word": "загинув",
   "mafia_team": "Заражені",
   "town_team": "Ті, хто вижив",
   "roles": {
    "mafia": {
     "name": "Заражений",
     "emoji": "🧟",
     "team": "mafia",
     "desc": "Уночі разом із зараженими нападаєш на того, хто вижив.",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Напасти",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Ми вже серед вас."
    },
    "don": {
     "name": "Нульовий пацієнт",
     "emoji": "🦠",
     "team": "mafia",
     "desc": "Джерело вірусу. Через ніч можеш заразити гравця — він перейде до вас (цієї ночі нападу не буде).",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Напасти",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      },
      {
       "kind": "convert",
       "label": "Заразити",
       "uses": null,
       "cooldown": 1,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": true,
     "passive": null,
     "motto": "Усе почалося з мене."
    },
    "sheriff": {
     "name": "Науковець",
     "emoji": "🧪",
     "team": "town",
     "desc": "Береш аналіз крові: заражений гравець чи ні.",
     "abilities": [
      {
       "kind": "check_team",
       "label": "Взяти аналіз",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": true,
     "leader": false,
     "passive": null,
     "motto": "Кров покаже."
    },
    "doctor": {
     "name": "Медик",
     "emoji": "⛑️",
     "team": "town",
     "desc": "Уночі рятуєш одного: від нападу й від зараження. Того самого — не дві ночі поспіль.",
     "abilities": [
      {
       "kind": "heal",
       "label": "Урятувати",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Пульс є — працюємо."
    },
    "engineer": {
     "name": "Інженер",
     "emoji": "🔧",
     "team": "town",
     "desc": "Вимикаєш світло у відсіку гравця — його здібність не спрацює.",
     "abilities": [
      {
       "kind": "block",
       "label": "Вимкнути світло",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Світло — це влада."
    },
    "soldier": {
     "name": "Військовий",
     "emoji": "🪖",
     "team": "town",
     "desc": "Один набій на всю гру.",
     "abilities": [
      {
       "kind": "shot",
       "label": "Вистрілити",
       "uses": 1,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Один набій. Одне рішення."
    },
    "civ": {
     "name": "Вцілілий",
     "emoji": "🎒",
     "team": "town",
     "desc": "Ти просто хочеш вижити. Знайди заражених, поки не пізно.",
     "abilities": [],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Аби тільки вижити."
    }
   },
   "specials": [
    [
     "sheriff",
     4
    ],
    [
     "doctor",
     5
    ],
    [
     "don",
     6
    ],
    [
     "engineer",
     8
    ],
    [
     "soldier",
     9
    ]
   ],
   "story": {
    "intro": [
     "2049 рік. Бункер №7 загерметизовано. Але хтось проніс вірус усередину…"
    ],
    "night": [
     "Гасне основне світло. Вмикається аварійне…",
     "У вентиляції чути скрегіт.",
     "Відбій. Двері відсіків зачиняються."
    ],
    "dead": [
     "Уранці відсік {name} виявився порожнім. Лише сліди. Це був {role}.",
     "{name} не вийшов на ранкову перевірку. {role}.",
     "Датчики зафіксували: {name} загинув. {role}."
    ],
    "dead_hidden": [
     "{name} не вийшов на ранкову перевірку.",
     "Датчики зафіксували: {name} загинув."
    ],
    "none": [
     "Ранкова перевірка: усі на місці. Але хтось підозріло кашляє…",
     "Ніч минула без втрат. Поки що."
    ],
    "saved": [
     "Медблок повідомляє: цієї ночі когось удалося врятувати."
    ],
    "out": [
     "Рада бункера вирішила: {name} — у карантин назавжди. Це був {role}.",
     "{name} виведено за шлюз. {role}."
    ],
    "out_hidden": [
     "Рада бункера вирішила: {name} — у карантин назавжди."
    ],
    "vote_none": [
     "Рада не ухвалила рішення. Двері лишаються зачиненими."
    ],
    "win_town": [
     "Вірус зупинено! Бункер знову в безпеці."
    ],
    "win_mafia": [
     "Бункер упав. Усередині лишилися тільки заражені."
    ],
    "win_solo": [
     "У бункері лишився один…"
    ]
   }
  },
  "west": {
   "title": "Дикий Захід",
   "emoji": "🤠",
   "tagline": "Банда, шериф, дуелі на заході сонця",
   "accent": "#f59e0b",
   "accent2": "#78350f",
   "twist": "Ковбой один раз за гру викликає на дуель просто вдень. Мисливець за головами отримує свою ціль і перемагає, якщо місто її повісить.",
   "kill_word": "застрелений",
   "mafia_team": "Банда",
   "town_team": "Місто",
   "roles": {
    "mafia": {
     "name": "Бандит",
     "emoji": "🐴",
     "team": "mafia",
     "desc": "Уночі з бандою вирішуєш, кого пристрелити.",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Пристрелити",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Гроші або життя."
    },
    "don": {
     "name": "Ватажок банди",
     "emoji": "💀",
     "team": "mafia",
     "desc": "Ведеш банду й шукаєш шерифа.",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Пристрелити",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      },
      {
       "kind": "find_sheriff",
       "label": "Шукати шерифа",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": true,
     "passive": null,
     "motto": "Це місто — моє."
    },
    "sheriff": {
     "name": "Шериф",
     "emoji": "⭐",
     "team": "town",
     "desc": "Щоночі перевіряєш одного: бандит чи ні.",
     "abilities": [
      {
       "kind": "check_team",
       "label": "Перевірити",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": true,
     "leader": false,
     "passive": null,
     "motto": "Закон — це я."
    },
    "doctor": {
     "name": "Док",
     "emoji": "🩺",
     "team": "town",
     "desc": "Уночі штопаєш одного. Того самого — не дві ночі поспіль.",
     "abilities": [
      {
       "kind": "heal",
       "label": "Підлатати",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Куля пройшла навиліт — пощастило."
    },
    "cowboy": {
     "name": "Ковбой",
     "emoji": "🤠",
     "team": "town",
     "desc": "Один раз за гру вдень викликаєш гравця на дуель. Загине один із вас — 50 на 50.",
     "abilities": [
      {
       "kind": "duel",
       "label": "Дуель",
       "uses": 1,
       "cooldown": 0,
       "phase": "day",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Полудень. Ти і я."
    },
    "bounty": {
     "name": "Мисливець за головами",
     "emoji": "💰",
     "team": "bounty",
     "desc": "У тебе є ціль. Якщо місто повісить її вдень — ти отримуєш нагороду й перемагаєш.",
     "abilities": [],
     "sheriff": false,
     "leader": false,
     "passive": "bounty",
     "motto": "Живим або мертвим."
    },
    "civ": {
     "name": "Містянин",
     "emoji": "🍺",
     "team": "town",
     "desc": "Пий віскі, дивися в обидва й вирахуй банду.",
     "abilities": [],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Ще віскі, бармене."
    }
   },
   "specials": [
    [
     "sheriff",
     4
    ],
    [
     "doctor",
     5
    ],
    [
     "don",
     6
    ],
    [
     "cowboy",
     7
    ],
    [
     "bounty",
     8
    ]
   ],
   "story": {
    "intro": [
     "Курне містечко Дед-Крік. У салуні грає піаніно, а за пагорбами чекає банда…"
    ],
    "night": [
     "Сонце сіло за каньйон. У салуні гасне світло.",
     "Койоти виють. Головною вулицею скачуть вершники.",
     "Ніч у Дед-Крік. Шериф перевіряє кольт."
    ],
    "dead": [
     "Уранці біля салуну знайшли {name}. Це був {role}.",
     "{name} дістав кулю в спину. {role}.",
     "Трунар знімає мірки: {name}. Це був {role}."
    ],
    "dead_hidden": [
     "Уранці біля салуну знайшли {name}.",
     "Трунар знімає мірки: {name}."
    ],
    "none": [
     "Тиха ніч. Навіть койоти мовчали.",
     "Усі живі. Банда, мабуть, перебрала в салуні."
    ],
    "saved": [
     "Док усю ніч когось штопав — і врятував."
    ],
    "duel": [
     "🤠 {a} викликає {b} на дуель! Полудень. Крок. Ще крок… Постріл!"
    ],
    "duel_dead": [
     "{name} падає в пил. Це був {role}."
    ],
    "duel_dead_hidden": [
     "{name} падає в пил."
    ],
    "bounty": [
     "💰 Мисливець за головами {name} отримує нагороду — його ціль повішено!"
    ],
    "out": [
     "Місто вирішило: {name} — на шибеницю. Це був {role}.",
     "{name} гойдається на гілляці. {role}."
    ],
    "out_hidden": [
     "Місто вирішило: {name} — на шибеницю."
    ],
    "vote_none": [
     "Місто сперечалося до заходу сонця. Шибениця сьогодні порожня."
    ],
    "win_town": [
     "Банду розбито! Шериф вішає значок на стіну."
    ],
    "win_mafia": [
     "Дед-Крік тепер належить банді."
    ],
    "win_solo": [
     "Місто спорожніло."
    ]
   }
  },
  "office": {
   "title": "Корпоратив",
   "emoji": "💼",
   "tagline": "Кроти конкурентів в офісі. Кого звільнять наступним?",
   "accent": "#38bdf8",
   "accent2": "#1e3a8a",
   "twist": "Мафія тут «звільняє». Стажер відволікає розмовами, Пліткарка знає все про всіх.",
   "kill_word": "звільнений",
   "mafia_team": "Кроти",
   "town_team": "Команда",
   "roles": {
    "mafia": {
     "name": "Кріт конкурентів",
     "emoji": "🕶️",
     "team": "mafia",
     "desc": "Уночі з іншими кротами вирішуєш, кого «звільнити».",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Звільнити",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Нічого особистого — бізнес."
    },
    "don": {
     "name": "Топменеджер-кріт",
     "emoji": "👔",
     "team": "mafia",
     "desc": "Головний кріт. Голосуєш за звільнення й шукаєш HR.",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Звільнити",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      },
      {
       "kind": "find_sheriff",
       "label": "Шукати HR",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": true,
     "passive": null,
     "motto": "Синергія поглинання."
    },
    "sheriff": {
     "name": "HR",
     "emoji": "📋",
     "team": "town",
     "desc": "Щоночі вивчаєш особову справу: кріт чи ні.",
     "abilities": [
      {
       "kind": "check_team",
       "label": "Вивчити справу",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": true,
     "leader": false,
     "passive": null,
     "motto": "Усе є в особовій справі."
    },
    "doctor": {
     "name": "Сисадмін",
     "emoji": "💻",
     "team": "town",
     "desc": "Уночі відновлюєш доступ одному співробітникові — його не звільнять. Того самого — не дві ночі поспіль.",
     "abilities": [
      {
       "kind": "heal",
       "label": "Відновити доступ",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Ви пробували перезавантажити?"
    },
    "lover": {
     "name": "Стажер",
     "emoji": "☕",
     "team": "town",
     "desc": "Відволікаєш колегу розмовами — його здібність не спрацює.",
     "abilities": [
      {
       "kind": "block",
       "label": "Заговорити",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Кави? Є хвилинка?"
    },
    "journalist": {
     "name": "Пліткарка",
     "emoji": "🗣️",
     "team": "town",
     "desc": "Дізнаєшся точну посаду колеги.",
     "abilities": [
      {
       "kind": "check_role",
       "label": "Випитати",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Ти не повіриш, що я чула…"
    },
    "civ": {
     "name": "Офісний працівник",
     "emoji": "🖇️",
     "team": "town",
     "desc": "Дедлайни, кава й кроти. Вирахуй їх на нараді.",
     "abilities": [],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Дедлайн був учора."
    }
   },
   "specials": [
    [
     "sheriff",
     4
    ],
    [
     "doctor",
     5
    ],
    [
     "don",
     6
    ],
    [
     "lover",
     8
    ],
    [
     "journalist",
     9
    ]
   ],
   "story": {
    "intro": [
     "Понеділок. У відділі продажів витік, а на кухні шепочуться біля кавомашини…"
    ],
    "night": [
     "Офіс порожніє. Тільки в переговорній горить світло…",
     "Прибиральниця вимикає світло. Кроти відкривають ноутбуки.",
     "Ніч. Десь у бухгалтерії шелестять папери."
    ],
    "dead": [
     "Уранці в {name} не спрацювала перепустка. Звільнено! Це був {role}.",
     "{name} складає речі в коробку. {role}.",
     "Розсилка від HR: «{name} більше не працює з нами». {role}."
    ],
    "dead_hidden": [
     "Уранці в {name} не спрацювала перепустка. Звільнено!",
     "{name} складає речі в коробку."
    ],
    "none": [
     "Ранок понеділка… усі на місці. Підозріло.",
     "Нікого не звільнили. Поки що."
    ],
    "saved": [
     "Сисадмін уночі когось урятував — перепустка знову працює."
    ],
    "out": [
     "Нарада вирішила: {name} — за власним бажанням. Це був {role}.",
     "{name} іде на «оптимізацію». {role}."
    ],
    "out_hidden": [
     "Нарада вирішила: {name} — за власним бажанням."
    ],
    "vote_none": [
     "Нарада затяглася й нічим не скінчилася. Як завжди."
    ],
    "win_town": [
     "Кротів вирахували! Команді — премія й піца."
    ],
    "win_mafia": [
     "Компанію купили конкуренти. Усі вільні."
    ],
    "win_solo": [
     "В офісі лишився один."
    ]
   }
  }
 },
 "MODES": {
  "classic": {
   "title": "Класичний",
   "emoji": "⏱️",
   "desc": "Ніч 45 с · обговорення 2 хв · голосування 30 с",
   "night": 45,
   "discussion": 120,
   "vote": 30
  },
  "fast": {
   "title": "Швидкий",
   "emoji": "⚡",
   "desc": "Ніч 30 с · обговорення 1 хв · голосування 20 с",
   "night": 30,
   "discussion": 60,
   "vote": 20
  },
  "party": {
   "title": "Наживо",
   "emoji": "🛋️",
   "desc": "Для гри в одній кімнаті: обговорення 5 хв, ведучий тисне «Далі»",
   "night": 60,
   "discussion": 300,
   "vote": 45
  }
 },
 "MIN_PLAYERS": 4,
 "MAX_PLAYERS": 20
};
if (typeof module !== 'undefined') module.exports = GAME_DATA;
