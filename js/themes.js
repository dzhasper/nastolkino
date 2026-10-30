/* Сгенерировано из game/themes.py командой python tools_export_themes.py — правьте там. */
var GAME_DATA = {
 "THEMES": {
  "classic": {
   "title": "Классика",
   "emoji": "🕴️",
   "tagline": "Старая добрая мафия: город, ночь и выстрелы",
   "accent": "#ef4444",
   "accent2": "#7f1d1d",
   "twist": "Дон ищет комиссара, Красотка отвлекает, Маньяк играет сам за себя.",
   "kill_word": "убит",
   "mafia_team": "Мафия",
   "town_team": "Мирный город",
   "roles": {
    "mafia": {
     "name": "Мафиози",
     "emoji": "🔫",
     "team": "mafia",
     "desc": "Ночью вместе с семьёй выбираешь жертву.",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Убить",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Семья не прощает."
    },
    "don": {
     "name": "Дон",
     "emoji": "🎩",
     "team": "mafia",
     "desc": "Глава семьи. Голосуешь за жертву и ищешь комиссара.",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Убить",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      },
      {
       "kind": "find_sheriff",
       "label": "Искать комиссара",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": true,
     "passive": null,
     "motto": "Предложение, от которого нельзя отказаться."
    },
    "sheriff": {
     "name": "Комиссар",
     "emoji": "🕵️",
     "team": "town",
     "desc": "Каждую ночь проверяешь одного игрока: мафия или нет.",
     "abilities": [
      {
       "kind": "check_team",
       "label": "Проверить",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": true,
     "leader": false,
     "passive": null,
     "motto": "Закон не спит."
    },
    "doctor": {
     "name": "Доктор",
     "emoji": "💉",
     "team": "town",
     "desc": "Ночью лечишь одного игрока. Одного и того же — не две ночи подряд.",
     "abilities": [
      {
       "kind": "heal",
       "label": "Лечить",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Не сегодня."
    },
    "lover": {
     "name": "Красотка",
     "emoji": "💋",
     "team": "town",
     "desc": "Ночью отвлекаешь игрока — его способность не сработает.",
     "abilities": [
      {
       "kind": "block",
       "label": "Отвлечь",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Одна ночь — и ты забудешь, зачем пришёл."
    },
    "maniac": {
     "name": "Маньяк",
     "emoji": "🔪",
     "team": "solo",
     "desc": "Играешь сам за себя. Убиваешь каждую ночь. Победа — остаться последним.",
     "abilities": [
      {
       "kind": "kill",
       "label": "Убить",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Город — мой."
    },
    "civ": {
     "name": "Мирный житель",
     "emoji": "🙂",
     "team": "town",
     "desc": "Найди мафию днём и выгони её голосованием.",
     "abilities": [],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Просто дожить до утра."
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
     "Город затих. Где-то в переулках семья уже делит улицы…"
    ],
    "night": [
     "Город засыпает. Просыпается мафия…",
     "Фонари гаснут. В темноте щёлкает затвор.",
     "Ночь. Где-то вдалеке воет сирена."
    ],
    "dead": [
     "Утром на набережной нашли {name}. Это был {role}.",
     "{name} не проснулся этим утром. {role}.",
     "Газеты кричат: «{name} убит!» Это был {role}."
    ],
    "dead_hidden": [
     "Утром нашли {name}. Город в шоке.",
     "{name} больше нет с нами."
    ],
    "none": [
     "Удивительно, но этой ночью все живы.",
     "Тихая ночь. Город пересчитал жителей — все на месте."
    ],
    "saved": [
     "Ночью кто-то чудом выжил после нападения."
    ],
    "out": [
     "Город решил: {name} покидает игру. Это был {role}.",
     "{name} выгнан голосованием. {role}."
    ],
    "out_hidden": [
     "Город решил: {name} покидает игру."
    ],
    "vote_none": [
     "Город не смог договориться. Сегодня никто не уходит."
    ],
    "win_town": [
     "Мафия разбита! Город может спать спокойно."
    ],
    "win_mafia": [
     "Город пал. Теперь здесь правит семья."
    ],
    "win_solo": [
     "Город опустел. Маньяк вытирает нож…"
    ]
   }
  },
  "90s": {
   "title": "Лихие 90-е",
   "emoji": "📼",
   "tagline": "Малиновые пиджаки, стрелки и «крыша»",
   "accent": "#facc15",
   "accent2": "#7e22ce",
   "twist": "Авторитет делает «наезд» — жертва молчит на голосовании. У Коммерсанта есть «крыша».",
   "kill_word": "завалили",
   "mafia_team": "Братва",
   "town_team": "Честные граждане",
   "roles": {
    "mafia": {
     "name": "Браток",
     "emoji": "🧥",
     "team": "mafia",
     "desc": "Ночью с братвой решаешь, кого «закрыть».",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Закрыть",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Всё по понятиям."
    },
    "don": {
     "name": "Авторитет",
     "emoji": "💰",
     "team": "mafia",
     "desc": "Смотрящий за районом. Голосуешь с братвой и делаешь «наезд»: жертва наезда завтра не голосует.",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Закрыть",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      },
      {
       "kind": "silence",
       "label": "Наехать",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": true,
     "passive": null,
     "motto": "Район держу я."
    },
    "sheriff": {
     "name": "Опер",
     "emoji": "👮",
     "team": "town",
     "desc": "Каждую ночь пробиваешь одного по базе: братва или нет.",
     "abilities": [
      {
       "kind": "check_team",
       "label": "Пробить",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": true,
     "leader": false,
     "passive": null,
     "motto": "Пробьём по базе."
    },
    "doctor": {
     "name": "Врач скорой",
     "emoji": "🚑",
     "team": "town",
     "desc": "Ночью откачиваешь одного. Одного и того же — не две ночи подряд.",
     "abilities": [
      {
       "kind": "heal",
       "label": "Откачать",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Довезём — откачаем."
    },
    "journalist": {
     "name": "Журналист",
     "emoji": "📰",
     "team": "town",
     "desc": "Ведёшь расследование: узнаёшь точную роль игрока.",
     "abilities": [
      {
       "kind": "check_role",
       "label": "Расследовать",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Правда дороже жизни."
    },
    "merchant": {
     "name": "Коммерсант",
     "emoji": "💼",
     "team": "town",
     "desc": "У тебя есть «крыша»: первое покушение ты переживёшь.",
     "abilities": [],
     "sheriff": false,
     "leader": false,
     "passive": "armor",
     "motto": "У меня крыша."
    },
    "killer": {
     "name": "Киллер-одиночка",
     "emoji": "🎯",
     "team": "solo",
     "desc": "Работаешь только на себя. Каждую ночь — заказ. Победа — остаться последним.",
     "abilities": [
      {
       "kind": "kill",
       "label": "Выполнить заказ",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Ничего личного — работа."
    },
    "civ": {
     "name": "Челнок",
     "emoji": "🛍️",
     "team": "town",
     "desc": "Возишь шмотки из Турции и хочешь просто выжить. Вычисли братву.",
     "abilities": [],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Турция, Польша, рынок."
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
     "1994 год. На районе новый смотрящий, а у ларьков — подозрительные пиджаки…"
    ],
    "night": [
     "Ночь. У ларька тормозит чёрный «мерс»…",
     "Пейджеры молчат. Братва выходит на дело.",
     "Девяностые не спят: где-то стрелка, где-то разборка."
    ],
    "dead": [
     "Утром {name} нашли в багажнике «девятки». Это был {role}.",
     "{name} не вернулся со стрелки. {role}.",
     "По району слух: {name} всё. Это был {role}."
    ],
    "dead_hidden": [
     "{name} не вернулся со стрелки.",
     "Утром {name} нашли в багажнике «девятки»."
    ],
    "none": [
     "Ночь прошла спокойно. Даже ларёк не сожгли.",
     "Все живы. Братва, видимо, отмечала."
    ],
    "saved": [
     "Ночью на кого-то наехали, но не вышло — то ли крыша, то ли скорая успела."
    ],
    "silenced": [
     "На {name} был «наезд»: сегодня без права голоса."
    ],
    "out": [
     "Сход решил: {name} — на выход. Это был {role}.",
     "{name} отправлен «отдыхать». {role}."
    ],
    "out_hidden": [
     "Сход решил: {name} — на выход."
    ],
    "vote_none": [
     "Базар ни к чему не привёл. Все при своих."
    ],
    "win_town": [
     "Братву приняли. На районе снова можно торговать."
    ],
    "win_mafia": [
     "Район под братвой. Теперь все платят."
    ],
    "win_solo": [
     "Заказы выполнены. Киллер растворился в тумане 90-х."
    ]
   }
  },
  "halloween": {
   "title": "Ночь Хэллоуина",
   "emoji": "🎃",
   "tagline": "Вампиры, ведьмы и оборотень в полнолуние",
   "accent": "#f97316",
   "accent2": "#581c87",
   "twist": "Граф может один раз укусить — жертва становится вампиром. У Ведьмы есть зелье жизни и яд, Оборотень выходит только в полнолуние.",
   "kill_word": "обескровлен",
   "mafia_team": "Вампиры",
   "town_team": "Деревня",
   "roles": {
    "mafia": {
     "name": "Вампир",
     "emoji": "🧛",
     "team": "mafia",
     "desc": "Ночью вместе с кланом выбираешь, чью кровь выпить.",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Выпить кровь",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Вечность голодна."
    },
    "don": {
     "name": "Граф",
     "emoji": "🦇",
     "team": "mafia",
     "desc": "Глава клана. Один раз за игру можешь укусить: жертва станет вампиром (в эту ночь клан никого не убивает).",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Выпить кровь",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      },
      {
       "kind": "convert",
       "label": "Укусить",
       "uses": 1,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": true,
     "passive": null,
     "motto": "Кровь — это жизнь."
    },
    "sheriff": {
     "name": "Провидица",
     "emoji": "🔮",
     "team": "town",
     "desc": "Смотришь в хрустальный шар: вампир игрок или нет.",
     "abilities": [
      {
       "kind": "check_team",
       "label": "Заглянуть в шар",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": true,
     "leader": false,
     "passive": null,
     "motto": "Шар не лжёт."
    },
    "witch": {
     "name": "Ведьма",
     "emoji": "🧙",
     "team": "town",
     "desc": "У тебя два зелья на всю игру: зелье жизни спасает, яд убивает.",
     "abilities": [
      {
       "kind": "heal",
       "label": "Зелье жизни",
       "uses": 1,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      },
      {
       "kind": "kill",
       "label": "Яд",
       "uses": 1,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Одно зелье спасёт, другое — нет."
    },
    "hunter": {
     "name": "Охотник на нечисть",
     "emoji": "🏹",
     "team": "town",
     "desc": "Один осиновый кол на всю игру — используй с умом.",
     "abilities": [
      {
       "kind": "shot",
       "label": "Осиновый кол",
       "uses": 1,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Кол всегда при мне."
    },
    "werewolf": {
     "name": "Оборотень",
     "emoji": "🐺",
     "team": "solo",
     "desc": "Сам за себя. Охотишься только в полнолуние (каждую вторую ночь). Победа — остаться последним.",
     "abilities": [
      {
       "kind": "kill",
       "label": "Растерзать",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": true
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Жди полнолуния."
    },
    "civ": {
     "name": "Житель деревни",
     "emoji": "🕯️",
     "team": "town",
     "desc": "Запри двери, зажги свечи и вычисли вампиров.",
     "abilities": [],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Свечи не гаснут до рассвета."
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
     "31 октября. Над деревней туман, а в замке на холме зажглись окна…"
    ],
    "night": [
     "Тыквы гаснут одна за другой. Слышен шорох крыльев…",
     "Луна поднимается над кладбищем.",
     "Скрипят ворота замка. Клан выходит на охоту."
    ],
    "dead": [
     "На рассвете {name} нашли бледным, с двумя точками на шее. Это был {role}.",
     "{name} не дожил до рассвета. {role}.",
     "В тумане нашли {name}. Это был {role}."
    ],
    "dead_hidden": [
     "{name} не дожил до рассвета.",
     "В тумане нашли {name}."
    ],
    "none": [
     "Удивительно — этой ночью все живы.",
     "Свечи горели до утра. Никто не пострадал."
    ],
    "saved": [
     "Кого-то этой ночью спасло чудо… или зелье."
    ],
    "full_moon": [
     "🌕 Сегодня полнолуние. Где-то в лесу воет волк…"
    ],
    "out": [
     "Деревня решила: {name} — на костёр. Это был {role}.",
     "{name} изгнан из деревни. {role}."
    ],
    "out_hidden": [
     "Деревня решила: {name} — на костёр."
    ],
    "vote_none": [
     "Деревня спорила до заката и никого не изгнала."
    ],
    "win_town": [
     "Последний вампир рассыпался в прах. Деревня спасена!"
    ],
    "win_mafia": [
     "Деревня стала замком вампиров. Вечная ночь."
    ],
    "win_solo": [
     "Оборотень воет над пустой деревней."
    ]
   }
  },
  "bunker": {
   "title": "Бункер: Заражение",
   "emoji": "☣️",
   "tagline": "Вирус в бункере. Заражённые среди своих",
   "accent": "#84cc16",
   "accent2": "#14532d",
   "twist": "Нулевой пациент заражает: жертва переходит к заражённым. Медик может спасти и вылечить, Инженер отключает свет в отсеке.",
   "kill_word": "погиб",
   "mafia_team": "Заражённые",
   "town_team": "Выжившие",
   "roles": {
    "mafia": {
     "name": "Заражённый",
     "emoji": "🧟",
     "team": "mafia",
     "desc": "Ночью вместе с заражёнными нападаешь на выжившего.",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Напасть",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Мы уже среди вас."
    },
    "don": {
     "name": "Нулевой пациент",
     "emoji": "🦠",
     "team": "mafia",
     "desc": "Источник вируса. Через ночь можешь заразить игрока — он перейдёт к вам (в эту ночь нападения не будет).",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Напасть",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      },
      {
       "kind": "convert",
       "label": "Заразить",
       "uses": null,
       "cooldown": 1,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": true,
     "passive": null,
     "motto": "Всё началось с меня."
    },
    "sheriff": {
     "name": "Учёный",
     "emoji": "🧪",
     "team": "town",
     "desc": "Берёшь анализ крови: заражён игрок или нет.",
     "abilities": [
      {
       "kind": "check_team",
       "label": "Взять анализ",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": true,
     "leader": false,
     "passive": null,
     "motto": "Кровь покажет."
    },
    "doctor": {
     "name": "Медик",
     "emoji": "⛑️",
     "team": "town",
     "desc": "Ночью спасаешь одного: от нападения и от заражения. Одного и того же — не две ночи подряд.",
     "abilities": [
      {
       "kind": "heal",
       "label": "Спасти",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Пульс есть — работаем."
    },
    "engineer": {
     "name": "Инженер",
     "emoji": "🔧",
     "team": "town",
     "desc": "Отключаешь свет в отсеке игрока — его способность не сработает.",
     "abilities": [
      {
       "kind": "block",
       "label": "Отключить свет",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Свет — это власть."
    },
    "soldier": {
     "name": "Военный",
     "emoji": "🪖",
     "team": "town",
     "desc": "Один патрон на всю игру.",
     "abilities": [
      {
       "kind": "shot",
       "label": "Выстрелить",
       "uses": 1,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Один патрон. Одно решение."
    },
    "civ": {
     "name": "Выживший",
     "emoji": "🎒",
     "team": "town",
     "desc": "Ты просто хочешь выжить. Найди заражённых до того, как станет поздно.",
     "abilities": [],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Только бы выжить."
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
     "2049 год. Бункер №7 загерметизирован. Но кто-то пронёс вирус внутрь…"
    ],
    "night": [
     "Гаснет основной свет. Включается аварийный…",
     "В вентиляции слышен скрежет.",
     "Отбой. Двери отсеков закрываются."
    ],
    "dead": [
     "Утром отсек {name} оказался пустым. Только следы. Это был {role}.",
     "{name} не вышел на утреннюю проверку. {role}.",
     "Датчики зафиксировали: {name} погиб. {role}."
    ],
    "dead_hidden": [
     "{name} не вышел на утреннюю проверку.",
     "Датчики зафиксировали: {name} погиб."
    ],
    "none": [
     "Утренняя проверка: все на месте. Но кашляет кто-то подозрительно…",
     "Ночь прошла без потерь. Пока что."
    ],
    "saved": [
     "Медблок сообщает: этой ночью кого-то удалось спасти."
    ],
    "out": [
     "Совет бункера решил: {name} — в карантин навсегда. Это был {role}.",
     "{name} выведен за шлюз. {role}."
    ],
    "out_hidden": [
     "Совет бункера решил: {name} — в карантин навсегда."
    ],
    "vote_none": [
     "Совет не принял решения. Двери остаются закрытыми."
    ],
    "win_town": [
     "Вирус остановлен! Бункер снова в безопасности."
    ],
    "win_mafia": [
     "Бункер пал. Внутри остались только заражённые."
    ],
    "win_solo": [
     "В бункере остался один…"
    ]
   }
  },
  "west": {
   "title": "Дикий Запад",
   "emoji": "🤠",
   "tagline": "Банда, шериф, дуэли на закате",
   "accent": "#f59e0b",
   "accent2": "#78350f",
   "twist": "Ковбой один раз за игру вызывает на дуэль прямо днём. Охотник за головами получает свою цель и побеждает, если город её повесит.",
   "kill_word": "застрелен",
   "mafia_team": "Банда",
   "town_team": "Город",
   "roles": {
    "mafia": {
     "name": "Бандит",
     "emoji": "🐴",
     "team": "mafia",
     "desc": "Ночью с бандой решаешь, кого пристрелить.",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Пристрелить",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Деньги или жизнь."
    },
    "don": {
     "name": "Главарь банды",
     "emoji": "💀",
     "team": "mafia",
     "desc": "Ведёшь банду и ищешь шерифа.",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Пристрелить",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      },
      {
       "kind": "find_sheriff",
       "label": "Искать шерифа",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": true,
     "passive": null,
     "motto": "Этот город — мой."
    },
    "sheriff": {
     "name": "Шериф",
     "emoji": "⭐",
     "team": "town",
     "desc": "Каждую ночь проверяешь одного: бандит или нет.",
     "abilities": [
      {
       "kind": "check_team",
       "label": "Проверить",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": true,
     "leader": false,
     "passive": null,
     "motto": "Закон — это я."
    },
    "doctor": {
     "name": "Док",
     "emoji": "🩺",
     "team": "town",
     "desc": "Ночью штопаешь одного. Одного и того же — не две ночи подряд.",
     "abilities": [
      {
       "kind": "heal",
       "label": "Подлатать",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Пуля прошла навылет — повезло."
    },
    "cowboy": {
     "name": "Ковбой",
     "emoji": "🤠",
     "team": "town",
     "desc": "Один раз за игру днём вызываешь игрока на дуэль. Погибнет один из вас — 50 на 50.",
     "abilities": [
      {
       "kind": "duel",
       "label": "Дуэль",
       "uses": 1,
       "cooldown": 0,
       "phase": "day",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Полдень. Ты и я."
    },
    "bounty": {
     "name": "Охотник за головами",
     "emoji": "💰",
     "team": "bounty",
     "desc": "У тебя есть цель. Если город повесит её днём — ты получаешь награду и побеждаешь.",
     "abilities": [],
     "sheriff": false,
     "leader": false,
     "passive": "bounty",
     "motto": "Живым или мёртвым."
    },
    "civ": {
     "name": "Горожанин",
     "emoji": "🍺",
     "team": "town",
     "desc": "Пей виски, смотри в оба и вычисли банду.",
     "abilities": [],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Ещё виски, бармен."
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
     "Пыльный городок Дэд-Крик. В салуне играет пианино, а за холмами ждёт банда…"
    ],
    "night": [
     "Солнце село за каньон. В салуне гаснет свет.",
     "Койоты воют. По главной улице скачут всадники.",
     "Ночь в Дэд-Крик. Шериф проверяет кольт."
    ],
    "dead": [
     "Утром у салуна нашли {name}. Это был {role}.",
     "{name} получил пулю в спину. {role}.",
     "Гробовщик снимает мерки: {name}. Это был {role}."
    ],
    "dead_hidden": [
     "Утром у салуна нашли {name}.",
     "Гробовщик снимает мерки: {name}."
    ],
    "none": [
     "Тихая ночь. Даже койоты молчали.",
     "Все живы. Банда, видимо, перебрала в салуне."
    ],
    "saved": [
     "Док всю ночь кого-то штопал — и спас."
    ],
    "duel": [
     "🤠 {a} вызывает {b} на дуэль! Полдень. Шаг. Ещё шаг… Выстрел!"
    ],
    "duel_dead": [
     "{name} падает в пыль. Это был {role}."
    ],
    "duel_dead_hidden": [
     "{name} падает в пыль."
    ],
    "bounty": [
     "💰 Охотник за головами {name} получает награду — его цель повешена!"
    ],
    "out": [
     "Город решил: {name} — на виселицу. Это был {role}.",
     "{name} болтается на суку. {role}."
    ],
    "out_hidden": [
     "Город решил: {name} — на виселицу."
    ],
    "vote_none": [
     "Город спорил до заката. Виселица сегодня пустует."
    ],
    "win_town": [
     "Банда разбита! Шериф вешает значок на стену."
    ],
    "win_mafia": [
     "Дэд-Крик теперь принадлежит банде."
    ],
    "win_solo": [
     "Город опустел."
    ]
   }
  },
  "office": {
   "title": "Корпоратив",
   "emoji": "💼",
   "tagline": "Кроты конкурентов в офисе. Кого уволят следующим?",
   "accent": "#38bdf8",
   "accent2": "#1e3a8a",
   "twist": "Мафия здесь «увольняет». Стажёр отвлекает разговорами, Сплетница знает всё про всех.",
   "kill_word": "уволен",
   "mafia_team": "Кроты",
   "town_team": "Команда",
   "roles": {
    "mafia": {
     "name": "Крот конкурентов",
     "emoji": "🕶️",
     "team": "mafia",
     "desc": "Ночью с другими кротами решаешь, кого «уволить».",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Уволить",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Ничего личного — бизнес."
    },
    "don": {
     "name": "Топ-менеджер-крот",
     "emoji": "👔",
     "team": "mafia",
     "desc": "Главный крот. Голосуешь за увольнение и ищешь HR.",
     "abilities": [
      {
       "kind": "mafia_kill",
       "label": "Уволить",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      },
      {
       "kind": "find_sheriff",
       "label": "Искать HR",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": true,
     "passive": null,
     "motto": "Синергия поглощения."
    },
    "sheriff": {
     "name": "HR",
     "emoji": "📋",
     "team": "town",
     "desc": "Каждую ночь изучаешь личное дело: крот или нет.",
     "abilities": [
      {
       "kind": "check_team",
       "label": "Изучить дело",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": true,
     "leader": false,
     "passive": null,
     "motto": "Всё есть в личном деле."
    },
    "doctor": {
     "name": "Сисадмин",
     "emoji": "💻",
     "team": "town",
     "desc": "Ночью восстанавливаешь доступ одному сотруднику — его не уволят. Одного и того же — не две ночи подряд.",
     "abilities": [
      {
       "kind": "heal",
       "label": "Восстановить доступ",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Вы пробовали перезагрузить?"
    },
    "lover": {
     "name": "Стажёр",
     "emoji": "☕",
     "team": "town",
     "desc": "Отвлекаешь коллегу разговорами — его способность не сработает.",
     "abilities": [
      {
       "kind": "block",
       "label": "Заболтать",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Кофе? Есть минутка?"
    },
    "journalist": {
     "name": "Сплетница",
     "emoji": "🗣️",
     "team": "town",
     "desc": "Узнаёшь точную должность коллеги.",
     "abilities": [
      {
       "kind": "check_role",
       "label": "Выведать",
       "uses": null,
       "cooldown": 0,
       "phase": "night",
       "even_nights": false
      }
     ],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Ты не поверишь, что я слышала…"
    },
    "civ": {
     "name": "Офисный сотрудник",
     "emoji": "🖇️",
     "team": "town",
     "desc": "Дедлайны, кофе и кроты. Вычисли их на планёрке.",
     "abilities": [],
     "sheriff": false,
     "leader": false,
     "passive": null,
     "motto": "Дедлайн был вчера."
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
     "Понедельник. В отделе продаж утечка, а на кухне шепчутся у кофемашины…"
    ],
    "night": [
     "Офис пустеет. Только в переговорке горит свет…",
     "Уборщица выключает свет. Кроты открывают ноутбуки.",
     "Ночь. Где-то в бухгалтерии шуршат бумаги."
    ],
    "dead": [
     "Утром у {name} не работал пропуск. Уволен! Это был {role}.",
     "{name} собирает вещи в коробку. {role}.",
     "Рассылка от HR: «{name} больше не работает с нами». {role}."
    ],
    "dead_hidden": [
     "Утром у {name} не работал пропуск. Уволен!",
     "{name} собирает вещи в коробку."
    ],
    "none": [
     "Утро понедельника… все на месте. Подозрительно.",
     "Никого не уволили. Пока."
    ],
    "saved": [
     "Сисадмин ночью кого-то спас — пропуск снова работает."
    ],
    "out": [
     "Планёрка решила: {name} — по собственному. Это был {role}.",
     "{name} уходит на «оптимизацию». {role}."
    ],
    "out_hidden": [
     "Планёрка решила: {name} — по собственному."
    ],
    "vote_none": [
     "Планёрка затянулась и ничем не закончилась. Как обычно."
    ],
    "win_town": [
     "Кротов вычислили! Команде — премия и пицца."
    ],
    "win_mafia": [
     "Компанию купили конкуренты. Все свободны."
    ],
    "win_solo": [
     "В офисе остался один."
    ]
   }
  }
 },
 "MODES": {
  "classic": {
   "title": "Классический",
   "emoji": "⏱️",
   "desc": "Ночь 45 с · обсуждение 2 мин · голосование 30 с",
   "night": 45,
   "discussion": 120,
   "vote": 30
  },
  "fast": {
   "title": "Быстрый",
   "emoji": "⚡",
   "desc": "Ночь 30 с · обсуждение 1 мин · голосование 20 с",
   "night": 30,
   "discussion": 60,
   "vote": 20
  },
  "party": {
   "title": "Вживую",
   "emoji": "🛋️",
   "desc": "Для игры в одной комнате: обсуждение 5 мин, ведущий жмёт «Дальше»",
   "night": 60,
   "discussion": 300,
   "vote": 45
  }
 },
 "MIN_PLAYERS": 4,
 "MAX_PLAYERS": 20
};
if (typeof module !== 'undefined') module.exports = GAME_DATA;
