# 九龍城寨：幽靈經卷

# Kowloon Walled City: The Ghost Scrolls

> _A 3D exploration game set in Hong Kong's legendary Kowloon Walled City, where players collect 10 sacred scrolls (and a few bonus scrolls) from supernatural beings, while learning about the city from it's inhabitants

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Setting: Kowloon Walled City](#setting-kowloon-walled-city)
3. [The Quest: Finding the 10 Scrolls](#the-quest-finding-the-10-scrolls)
4. [Course Themes & Literary Sources](#course-themes--literary-sources)
5. [Character & Scroll Quotes with Citations](#character--scroll-quotes-with-citations)
6. [Game Features](#game-features)
7. [Room Types & Authentic KWC Interiors](#room-types--authentic-kwc-interiors)
8. [Technical Implementation](#technical-implementation)
9. [AI Usage Disclosure](#ai-usage-disclosure)
10. [Historical Sources](#historical-sources)
11. [Getting Started](#getting-started)
12. [Commands](#commands)

---

## Project Overview

**Kowloon Walled City: The Ghost Scrolls** is an immersive 3D exploration game built for Reddit's Devvit platform. Players navigate a faithfully reconstructed Kowloon Walled City—Hong Kong's infamous "City of Darkness"—encountering supernatural characters drawn from Chinese literary traditions studied throughout our course.

The core gameplay loop mirrors the structure of _Journey to the West_ (西遊記): just as the monk Xuanzang traveled to India to retrieve Buddhist scriptures, players must seek out 10 ghostly figures hidden throughout the walled city, each carrying a scroll containing wisdom from classical Chinese literature on law, justice, death, gender, and the supernatural.

---

## Setting: Kowloon Walled City

Kowloon Walled City (九龍城寨, 1898–1993) was the most densely populated place on Earth—approximately 35,000–50,000 residents crammed into just 2.6 hectares. The game recreates this extraordinary urban environment:

### Historical Context (from `facts.json`)

> _"Kowloon Walled City began its existence as a Chinese military outpost during the Song Dynasty, established to monitor maritime traffic, protect trade routes, and assert imperial authority over the region."_

> _"Buildings inside the Walled City were constructed with little formal planning or regulation, often expanding incrementally as families grew or new residents arrived. Structures leaned against one another, forming a solid mass of concrete, steel, and improvised extensions."_

> _"One of the most remarkable features of Kowloon Walled City was its internal connectivity. Residents could traverse much of the settlement through interconnected staircases, corridors, and rooftops without ever stepping onto the ground, effectively creating a three-dimensional city."_

> _"The nickname 'City of Darkness' became synonymous with Kowloon Walled City, reflecting both its physical lack of light and the popular perception of danger and lawlessness."_

The game represents this through:

- **Multi-story buildings** with explorable interiors
- **Interconnected rooftops** for vertical navigation
- **Underground tunnel system** (the lacking drainage network)
- **Authentic room types** including unlicensed clinics, factories, temples, and cramped apartments
- **Dense urban atmosphere** with narrow corridors, fluorescent lighting, and claustrophobic spaces

---

## The Quest: Finding the 10 Scrolls (Inspired by JTTW)

In _Journey to the West_, the monk Xuanzang undertakes a pilgrimage to India to retrieve Buddhist sutras (scriptures) that will bring enlightenment to China. Our game transposes this quest into a haunted Kowloon Walled City:

- **10 Supernatural Characters** (ghosts, spirits, and otherworldly beings) replace the challenges Xuanzang faced
- **10 Scrolls** containing literary passages replace the Buddhist scriptures
- **The Walled City** becomes the landscape of trials—a labyrinthine journey through darkness toward wisdom

Each scroll contains a quote from course readings, transforming the game into both an exploration of Chinese supernatural literature and a meditation on justice, death, and the boundaries between worlds.

### Bonus Scrolls: Resident Knowledge

Beyond the 10 main story scrolls, players can also collect **Bonus Scrolls** by speaking to the ordinary residents of the Walled City. These scrolls contain historical facts and memories about daily life in Kowloon Walled City, compiled from historical research.

- **Sources:** _City of Darkness: Life in Kowloon Walled City_ (Girard & Lambot), oral history archives, and academic studies of the settlement.
- **Objective:** Collect all resident stories to gain a complete understanding of the city's history.

---

## Course Themes & Literary Sources

The game integrates themes and characters from across the semester's readings:

### 1. **Judge Bao and the Rule of Law** (Sept 17)

The incorruptible Judge Bao (包青天) represents the ideal of impartial justice. His presence in the game connects to discussions of law, morality, and the role of the magistrate in traditional Chinese society.

### 2. **The Phantom Heroine: Ghosts and Gender** (Sept 29)

Female ghosts who return to address injustices done to them while alive. These figures challenge patriarchal structures even in death, refusing to be silenced.

### 3. **The Ghost's Body** (Sept 29 / Oct 1)

The corporeal ghost—a spirit with physical presence who eats, speaks, and casts shadows—blurs the boundary between life and death.

### 4. **Shen Xiu** (Sept 10)

From _Stories Old and New_ (今古奇觀), Shen Xiu represents the wronged dead who return to ensure justice is served.

### 5. **Magistrate Teng** (Sept 8)

Another tale from _Stories Old and New_ featuring ghosts who intervene in legal proceedings when human judgment fails.

### 6. **The Chinese Deathscape** (Oct 20)

The bureaucratic afterlife—complete with offices, registers, and paperwork—reflects Buddhist and Daoist conceptions of death as administrative process.

### 7. **Hungry Ghosts** (Oct 20)

Beings trapped in a realm of insatiable desire, their punishment fitting their earthly greed. Buddhist imagery of needle-thin throats and drum-like bellies.

### 8. **Qutu Zhongren Cruelly Kills Other Creatures** (Oct 22)

From _Slapping the Table in Amazement_ (拍案驚奇), a tale of cruelty and karmic retribution.

### 9. **Alien Kind: Foxes and Late Imperial Chinese Narrative** (Nov 3)

Fox spirits (狐狸精) represent the ambiguous "alien kind"—neither fully human nor fully animal—who challenge categories of identity and sincerity.

### 10. **The Ghost Witness**

The recurring motif across _Stories Old and New_ of ghosts who testify in court, providing evidence that living witnesses cannot or will not give.

---

## Character & Scroll Quotes with Citations

Each supernatural character carries a scroll with a quote from course readings:

### 1. Judge Bao (Bao Zheng) 包拯

**Story:** _Judge Bao Selling Rice in Chenzhou_ (Sept 17)

**Scroll Quote:**

> _"The law is not established for the sake of the powerful, nor does it bend for the wealthy. It is set down so that right and wrong may be distinguished clearly, and so that Heaven may judge through human hands."_

**Source:** Judge Bao case stories; _Judge Bao and the Rule of Law - Judge Bao Selling Rice in Chenzhou_

**Source Note:** Extended passage based on contiguous judicial commentary in standard English translations of Judge Bao stories used in courses on law and literature. Exact phrasing varies by edition, but content and structure are consistent.

**Character Interactions:**

- _Greeting:_ "You stand before the law. Speak carefully—truth echoes longer than words."
- _Handoff:_ "Take this decree. Justice must circulate like grain."
- _Congratulation:_ "You have acted without fear or favor. Heaven records this."
- _Farewell:_ "Go. Let fairness guide your steps."

---

### 2. The Phantom Heroine 女鬼俠

**Story:** _The Phantom Heroine: Ghosts and Gender in Seventeenth-Century Chinese Literature_ (Sept 29)

**Scroll Quote:**

> _"Though my bones lie cold and my name has faded among the living, my grievance is not buried. I return because what was done to me was never answered, and because silence would be the greater injustice."_

**Source:** Seventeenth-century chuanqi ghost tales discussed in _The Phantom Heroine: Ghosts and Gender in Seventeenth-Century Chinese Literature_

**Source Note:** Composite passage drawn from recurring language in late-imperial phantom heroine narratives, where the ghost explicitly names grievance, return, and moral purpose. Commonly cited in gender-focused scholarship.

**Character Interactions:**

- _Greeting:_ "Do not fear me. Fear what was done while I still breathed."
- _Handoff:_ "Read this, and remember why I returned."
- _Congratulation:_ "You listened when others would not."
- _Farewell:_ "I remain until justice is done."

---

### 3. The Corporeal Female Ghost 肉身女鬼

**Story:** _The Ghost's Body_ (Sept 29 / Oct 1)

**Scroll Quote:**

> _"She ate with the living and spoke with the living, casting a shadow where she stood. Yet when one drew near, no breath warmed her body, and those who touched her felt only the chill of death."_

**Source:** _The Ghost's Body_

**Source Note:** Extended descriptive passage frequently quoted in discussions of embodied ghosts. Translation based on standard scholarly renderings used in teaching materials.

**Character Interactions:**

- _Greeting:_ "You expected mist and shadow. Instead, you found flesh."
- _Handoff:_ "Take this proof that death does not erase presence."
- _Congratulation:_ "You did not turn away."
- _Farewell:_ "Remember what a body can carry."

---

### 4. Shen Xiu 沈秀

**Story:** _Shen Xiu_ from _Stories Old and New_ (今古奇觀) (Sept 10)

**Scroll Quote:**

> _"The dead may not speak in court, nor may they plead their case before men. Yet Heaven hears what the living refuse to hear, and it does not forget injustice merely because a body has perished."_

**Source:** _Shen Xiu_, from _Stories Old and New_ (Jingu qiguan)

**Source Note:** Extended moral statement reflecting Shen Xiu's posthumous return. Passage is a close translation of contiguous narrative commentary in teaching editions.

**Character Interactions:**

- _Greeting:_ "I have already died once. You need not bow."
- _Handoff:_ "This is what I returned to say."
- _Congratulation:_ "You have finished what I could not."
- _Farewell:_ "Now I may finally rest."

---

### 5. The Wronged Ghost (Magistrate Teng) 冤鬼

**Story:** _Magistrate Teng_ from _Stories Old and New_ (Sept 8)

**Scroll Quote:**

> _"When human judgment failed and the magistrate closed his ears, the spirit came forth to accuse. What could not be spoken among the living was declared openly among the dead."_

**Source:** _Magistrate Teng_, from _Stories Old and New_

**Source Note:** Narrative passage describing the ghost's intervention in legal proceedings; phrasing reflects standard English translations used in class.

**Character Interactions:**

- _Greeting:_ "The living ignored me. You did not."
- _Handoff:_ "Carry my accusation where I cannot."
- _Congratulation:_ "Justice has weight, even beyond the grave."
- _Farewell:_ "I will trouble the courts no longer."

---

### 6. Underworld Bureaucrat 地府官吏

**Story:** _The Chinese Deathscape_ (Oct 20)

**Scroll Quote:**

> _"In death, as in life, there are offices to pass through and registers to be checked. Merit and crime are recorded without omission, and no soul departs until its account is settled."_

**Source:** _The Chinese Deathscape_, Introduction

**Source Note:** Composite quotation summarizing contiguous descriptions of afterlife bureaucracy in the reading; content and imagery are directly drawn from the text.

**Character Interactions:**

- _Greeting:_ "State your name. The dead queue as well."
- _Handoff:_ "Keep this record. Nothing escapes documentation."
- _Congratulation:_ "Your papers are in order."
- _Farewell:_ "Next."

---

### 7. Hungry Ghost 餓鬼

**Story:** _The Chinese Deathscape_ (Oct 20)

**Scroll Quote:**

> _"With throats no wider than needles and bellies like great drums, they hunger without relief. Food turns to flame before it can be swallowed, and desire itself becomes punishment."_

**Source:** _The Chinese Deathscape_

**Source Note:** Traditional hungry-ghost description cited in the reading; extended passage reflects standard Buddhist-inflected imagery used in English translations.

**Character Interactions:**

- _Greeting:_ "Food… no, not food—memory."
- _Handoff:_ "This is all I was given."
- _Congratulation:_ "You saw me."
- _Farewell:_ "I remain."

---

### 8. Qutu Zhongren 屈突仲任

**Story:** _Qutu Zhongren Cruelly Kills Other Creatures_ (Oct 22)

**Scroll Quote:**

> _"Qutu Zhongren took pleasure not merely in killing, but in cruelty itself. He delighted in suffering, and his heart was unmoved by pleading, blood, or death."_

**Source:** _Slapping the Table in Amazement_ (拍案驚奇) – _Qutu Zhongren Cruelly Kills Other Creatures_

**Source Note:** Extended evaluative description of Qutu Zhongren's character from standard English translations of the story.

**Character Interactions:**

- _Greeting:_ "Do you hear them? They never stop."
- _Handoff:_ "Take it. I don't need reminders."
- _Shun:_ "You think this makes you better than me?"
- _Farewell:_ "Run."

---

### 9. Fox Spirit (Huli Jing) 狐狸精

**Story:** _Alien Kind: Foxes and Late Imperial Chinese Narrative_ (Nov 3)

**Scroll Quote:**

> _"Do not ask whether I am human or spirit. Ask only whether I am sincere, for sincerity is rarer than either form and far more dangerous."_

**Source:** Late-imperial fox-spirit tales discussed in _Alien Kind: Foxes and Late Imperial Chinese Narrative_

**Source Note:** Representative fox-spirit speech drawn from recurring dialogue patterns in late-imperial fox narratives; phrasing aligns with standard teaching translations.

**Character Interactions:**

- _Greeting:_ "Relax. If I meant to harm you, you'd never know."
- _Handoff:_ "Read carefully. Words bite."
- _Congratulation:_ "Clever enough to survive—impressive."
- _Farewell:_ "We'll meet again. Or we won't."

---

### 10. Ghost Witness 鬼證人

**Story:** _Stories Old and New_ (今古奇觀) – judicial ghost motif

**Scroll Quote:**

> _"The ghost testified clearly, naming names and crimes without hesitation, and when the truth was revealed, the case was finally resolved and the living left without excuse."_

**Source:** _Stories Old and New_ (Jingu qiguan)

**Source Note:** Judicial ghost motif recurring across multiple stories; extended narrative phrasing reflects common teaching translations.

**Character Interactions:**

- _Greeting:_ "I was summoned."
- _Handoff:_ "This is what I said."
- _Congratulation:_ "The record is complete."
- _Farewell:_ "Court is adjourned."

---

## Game Features

### Exploration Modes

- **Outdoor City Streets** – Navigate the maze-like alleys between buildings
- **Building Interiors** – Enter any building and explore floor-by-floor
- **Rooftop Traversal** – Climb to the top and move between buildings
- **Underground Tunnels** – Secret drainage system connecting distant areas

### NPCs and Wildlife

- **41 Human NPCs** – Residents who share historical facts about KWC
- **10 Supernatural Characters** – Glowing ghost figures carrying scrolls
- **Ambient Ghosts** – Spectral figures that fade in and out throughout the city
- **11 Foxes** – Fox spirits roaming the streets (referencing the _Alien Kind_ readings)
- **8 Monkeys** – Playful creatures (echoing the simian companion in _Journey to the West_)
- **10 Dogs, 13 Squirrels, 26 Mice** – Urban wildlife

### Supernatural Elements

- **Glowing Auras** – Supernatural characters pulse with ethereal light
- **Multi-stage Dialogue** – Greeting → Backstory/Quote → Scroll Handoff → Farewell
- **Scroll Collection UI** – Track your progress toward collecting all 10 scrolls

---

## Room Types & Authentic KWC Interiors

The game recreates the diverse interior spaces documented in historical accounts of KWC:

### Residential Spaces

- **Bedrooms** – Cramped sleeping quarters with thin mattresses
- **Kitchens** – Woks, rice cookers, narrow counters
- **Living Rooms** – Small sofas, TV sets, coffee tables
- **Bathrooms** – Shared facilities, one per every other floor

### Commercial & Industrial

- **Noodle Factories** – Kneading tables, drying racks with hanging noodles, flour sacks
- **Fishball Factories** – Vats with floating fishballs, prep tables, ice buckets
- **Workshops** – Workbenches, sewing machines, fabric rolls, hanging tools
- **Grocery Shops** – Shelving units with products, counters, cash registers
- **Noodle Shops** – Woks with steam, small tables and stools
- **Tea Shops** – Tea canisters, ceramic pots, calligraphy scrolls
- **Snack Stalls** – Glass display cases, fryers, paper bags

### Medical (Famous KWC Feature)

- **Medical Clinics** – Examination tables, medicine cabinets, IV stands
- **Dental Clinics** – Dental chairs, lamp arms, tool trays, spittoons

> _"Unlicensed dentists and medical practitioners operated within the Walled City, offering affordable services to residents who might otherwise lack access to healthcare."_ — `facts.json`

### Religious & Community

- **Temples** – Altars with deity statues, incense burners, red lanterns, prayer cushions (Tin Hau / Fuk Tak style)
- **Shrines** – Wall-mounted shrine boxes, small deity figures, incense holders
- **Schools** – Teacher's desk, blackboard, chalk tray, student desks

### Infrastructure

- **Sewage Rooms** – Pipes, drainage grates, buckets, puddles
- **Water Points** – Water tanks, faucets, basins, waiting buckets
- **Mail Rooms** – Wall of mailboxes, sorting tables, notice boards
- **Stairwell Storage** – Electrical junction boxes, bicycles, random stored items
- **Storage / Boxes Rooms** – Stacked cardboard boxes, plastic crates, general clutter

---

## Technical Implementation

### Technology Stack

- **[Devvit](https://developers.reddit.com/)** – Reddit's developer platform for deploying web applications
- **[Three.js](https://threejs.org/)** – 3D graphics library for rendering the city, characters, and interiors
- **[Vite](https://vite.dev/)** – Build tool for compiling the webview
- **[Express](https://expressjs.com/)** – Backend server logic
- **[TypeScript](https://www.typescriptlang.org/)** – Type-safe JavaScript

### Architecture

```
src/
├── client/
│   ├── game/
│   │   ├── game.ts      # Main game logic (~10,800 lines)
│   │   └── game.css     # Styling and UI
│   ├── public/
│   │   ├── characters.json   # Supernatural character data
│   │   └── facts.json        # Historical facts for NPC dialogue
│   └── splash/              # Loading screen
├── server/                  # Backend API
└── shared/                  # Shared types
```



## AI Usage Disclosure

This project was developed with assistance from AI tools:

- **Code Generation**:
- Three.js scene construction and rendering
- NPC behavior and pathfinding systems
- Room generation algorithms
- UI implementation
- Dialogue system architecture
- **Music Generation**: (Eleven Labs)
- Background music generated in order to add to ambiance
- Inspired by traditional Chinese music
- **Source Compliation**:
- Multimodal models with web access to compile direct and indirect quotes on life in Kowloon and Scroll contents
- Help formatting the facts about Kowloon Wallec City in src/public/facts.json


### 3D Assets

- Building exteriors, interiors, and furniture are **procedurally generated** using Three.js primitives



## Historical Sources

### Primary Sources on Kowloon Walled City

| Source                                                                                | Description                                                    |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Girard, G. & Lambot, I. _City of Darkness Revisited_ (2014)                           | Comprehensive photography and interviews with former residents |
| Pullinger, J. _Chasing the Dragon_ (1980)                                             | First-hand account of missionary work inside KWC               |
| Wall Street Journal. "City of Imagination: Kowloon Walled City 20 Years Later" (2014) | Retrospective journalism                                       |
| South China Morning Post. "Remembering Hong Kong's 'City of Darkness'" (2024)         | Recent memorial coverage                                       |
| BBC World Service                                                                     | Former resident interview series                               |
| Industrial History HK                                                                 | Factory and manufacturing documentation                        |
| M+ Museum, Hong Kong                                                                  | Suenn Ho's Kowloon Walled City Research Archive                |

### Course Readings (Literary Sources)

| Reading                                                 | Date            | Themes                               |
| ------------------------------------------------------- | --------------- | ------------------------------------ |
| _Magistrate Teng_                                       | Sept 8          | Ghosts in legal proceedings          |
| _Shen Xiu_                                              | Sept 10         | Posthumous return for justice        |
| _Judge Bao Selling Rice in Chenzhou_                    | Sept 17         | Law, justice, incorruptibility       |
| _The Phantom Heroine_                                   | Sept 29         | Gender and ghost narratives          |
| _The Ghost's Body_                                      | Sept 29 / Oct 1 | Corporeal ghosts, embodiment         |
| _The Chinese Deathscape_                                | Oct 20          | Afterlife bureaucracy, hungry ghosts |
| _Qutu Zhongren Cruelly Kills Other Creatures_           | Oct 22          | Cruelty and karmic retribution       |
| _Alien Kind: Foxes and Late Imperial Chinese Narrative_ | Nov 3           | Fox spirits, identity, sincerity     |
| _Stories Old and New_ (今古奇觀)                        | Various         | Judicial ghost motifs                |

---

## Getting Started

> Make sure you have Node 22 downloaded on your machine before running!

1. Run `npm create devvit@latest --template=threejs`
2. Go through the installation wizard (requires Reddit developer account)
3. Copy the command from the success page into your terminal
4. IMPORTANT: Modify devvit.json's name to correspond to the name of the app you just created. (Currently is kowloongame)

## Commands

- `npm run dev` – Starts development server for live testing on Reddit
- `npm run build` – Builds client and server projects
- `npm run deploy` – Uploads a new version of your app
- `npm run launch` – Publishes your app for review
- `npm run login` – Logs CLI into Reddit
- `npm run check` – Type checks, lints, and prettifies your app

---

## Acknowledgments

This project was created for EAS307 (East Asian Studies - Digital Detecting the Strange)




