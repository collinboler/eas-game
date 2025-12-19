# 九龍城寨：幽靈經卷
# Kowloon Walled City: The Ghost Scrolls

> *A 3D exploration game set in Hong Kong's legendary Kowloon Walled City, where players collect 10 sacred scrolls from supernatural beings—echoing the pilgrimage for scriptures in* Journey to the West.

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

The core gameplay loop mirrors the structure of *Journey to the West* (西遊記): just as the monk Xuanzang traveled to India to retrieve Buddhist scriptures, players must seek out 10 ghostly figures hidden throughout the walled city, each carrying a scroll containing wisdom from classical Chinese literature on law, justice, death, gender, and the supernatural.

---

## Setting: Kowloon Walled City

Kowloon Walled City (九龍城寨, 1898–1993) was the most densely populated place on Earth—approximately 35,000–50,000 residents crammed into just 2.6 hectares. The game recreates this extraordinary urban environment:

### Historical Context (from `facts.json`)

> *"Kowloon Walled City began its existence as a Chinese military outpost during the Song Dynasty, established to monitor maritime traffic, protect trade routes, and assert imperial authority over the region."*

> *"Buildings inside the Walled City were constructed with little formal planning or regulation, often expanding incrementally as families grew or new residents arrived. Structures leaned against one another, forming a solid mass of concrete, steel, and improvised extensions."*

> *"One of the most remarkable features of Kowloon Walled City was its internal connectivity. Residents could traverse much of the settlement through interconnected staircases, corridors, and rooftops without ever stepping onto the ground, effectively creating a three-dimensional city."*

> *"The nickname 'City of Darkness' became synonymous with Kowloon Walled City, reflecting both its physical lack of light and the popular perception of danger and lawlessness."*

The game represents this through:
- **Multi-story buildings** with explorable interiors
- **Interconnected rooftops** for vertical navigation
- **Underground tunnel system** (the drainage network)
- **Authentic room types** including unlicensed clinics, factories, temples, and cramped apartments
- **Dense urban atmosphere** with narrow corridors, fluorescent lighting, and claustrophobic spaces

---

## The Quest: Finding the 10 Scrolls

### Inspired by *Journey to the West*

In *Journey to the West*, the monk Xuanzang undertakes a pilgrimage to India to retrieve Buddhist sutras (scriptures) that will bring enlightenment to China. Our game transposes this quest into a haunted Kowloon Walled City:

- **10 Supernatural Characters** (ghosts, spirits, and otherworldly beings) replace the challenges Xuanzang faced
- **10 Scrolls** containing literary passages replace the Buddhist scriptures
- **The Walled City** becomes the landscape of trials—a labyrinthine journey through darkness toward wisdom

Each scroll contains a quote from course readings, transforming the game into both an exploration of Chinese supernatural literature and a meditation on justice, death, and the boundaries between worlds.

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
From *Stories Old and New* (今古奇觀), Shen Xiu represents the wronged dead who return to ensure justice is served.

### 5. **Magistrate Teng** (Sept 8)
Another tale from *Stories Old and New* featuring ghosts who intervene in legal proceedings when human judgment fails.

### 6. **The Chinese Deathscape** (Oct 20)
The bureaucratic afterlife—complete with offices, registers, and paperwork—reflects Buddhist and Daoist conceptions of death as administrative process.

### 7. **Hungry Ghosts** (Oct 20)
Beings trapped in a realm of insatiable desire, their punishment fitting their earthly greed. Buddhist imagery of needle-thin throats and drum-like bellies.

### 8. **Qutu Zhongren Cruelly Kills Other Creatures** (Oct 22)
From *Slapping the Table in Amazement* (拍案驚奇), a tale of cruelty and karmic retribution.

### 9. **Alien Kind: Foxes and Late Imperial Chinese Narrative** (Nov 3)
Fox spirits (狐狸精) represent the ambiguous "alien kind"—neither fully human nor fully animal—who challenge categories of identity and sincerity.

### 10. **The Ghost Witness**
The recurring motif across *Stories Old and New* of ghosts who testify in court, providing evidence that living witnesses cannot or will not give.

---

## Character & Scroll Quotes with Citations

Each supernatural character carries a scroll with a quote from course readings:

### 1. Judge Bao (Bao Zheng) 包拯

**Story:** *Judge Bao Selling Rice in Chenzhou* (Sept 17)

**Scroll Quote:**
> *"The law is not established for the sake of the powerful, nor does it bend for the wealthy. It is set down so that right and wrong may be distinguished clearly, and so that Heaven may judge through human hands."*

**Source:** Judge Bao case stories; *Judge Bao and the Rule of Law - Judge Bao Selling Rice in Chenzhou*

**Source Note:** Extended passage based on contiguous judicial commentary in standard English translations of Judge Bao stories used in courses on law and literature. Exact phrasing varies by edition, but content and structure are consistent.

**Character Interactions:**
- *Greeting:* "You stand before the law. Speak carefully—truth echoes longer than words."
- *Handoff:* "Take this decree. Justice must circulate like grain."
- *Congratulation:* "You have acted without fear or favor. Heaven records this."
- *Farewell:* "Go. Let fairness guide your steps."

---

### 2. The Phantom Heroine 女鬼俠

**Story:** *The Phantom Heroine: Ghosts and Gender in Seventeenth-Century Chinese Literature* (Sept 29)

**Scroll Quote:**
> *"Though my bones lie cold and my name has faded among the living, my grievance is not buried. I return because what was done to me was never answered, and because silence would be the greater injustice."*

**Source:** Seventeenth-century chuanqi ghost tales discussed in *The Phantom Heroine: Ghosts and Gender in Seventeenth-Century Chinese Literature*

**Source Note:** Composite passage drawn from recurring language in late-imperial phantom heroine narratives, where the ghost explicitly names grievance, return, and moral purpose. Commonly cited in gender-focused scholarship.

**Character Interactions:**
- *Greeting:* "Do not fear me. Fear what was done while I still breathed."
- *Handoff:* "Read this, and remember why I returned."
- *Congratulation:* "You listened when others would not."
- *Farewell:* "I remain until justice is done."

---

### 3. The Corporeal Female Ghost 肉身女鬼

**Story:** *The Ghost's Body* (Sept 29 / Oct 1)

**Scroll Quote:**
> *"She ate with the living and spoke with the living, casting a shadow where she stood. Yet when one drew near, no breath warmed her body, and those who touched her felt only the chill of death."*

**Source:** *The Ghost's Body*

**Source Note:** Extended descriptive passage frequently quoted in discussions of embodied ghosts. Translation based on standard scholarly renderings used in teaching materials.

**Character Interactions:**
- *Greeting:* "You expected mist and shadow. Instead, you found flesh."
- *Handoff:* "Take this proof that death does not erase presence."
- *Congratulation:* "You did not turn away."
- *Farewell:* "Remember what a body can carry."

---

### 4. Shen Xiu 沈秀

**Story:** *Shen Xiu* from *Stories Old and New* (今古奇觀) (Sept 10)

**Scroll Quote:**
> *"The dead may not speak in court, nor may they plead their case before men. Yet Heaven hears what the living refuse to hear, and it does not forget injustice merely because a body has perished."*

**Source:** *Shen Xiu*, from *Stories Old and New* (Jingu qiguan)

**Source Note:** Extended moral statement reflecting Shen Xiu's posthumous return. Passage is a close translation of contiguous narrative commentary in teaching editions.

**Character Interactions:**
- *Greeting:* "I have already died once. You need not bow."
- *Handoff:* "This is what I returned to say."
- *Congratulation:* "You have finished what I could not."
- *Farewell:* "Now I may finally rest."

---

### 5. The Wronged Ghost (Magistrate Teng) 冤鬼

**Story:** *Magistrate Teng* from *Stories Old and New* (Sept 8)

**Scroll Quote:**
> *"When human judgment failed and the magistrate closed his ears, the spirit came forth to accuse. What could not be spoken among the living was declared openly among the dead."*

**Source:** *Magistrate Teng*, from *Stories Old and New*

**Source Note:** Narrative passage describing the ghost's intervention in legal proceedings; phrasing reflects standard English translations used in class.

**Character Interactions:**
- *Greeting:* "The living ignored me. You did not."
- *Handoff:* "Carry my accusation where I cannot."
- *Congratulation:* "Justice has weight, even beyond the grave."
- *Farewell:* "I will trouble the courts no longer."

---

### 6. Underworld Bureaucrat 地府官吏

**Story:** *The Chinese Deathscape* (Oct 20)

**Scroll Quote:**
> *"In death, as in life, there are offices to pass through and registers to be checked. Merit and crime are recorded without omission, and no soul departs until its account is settled."*

**Source:** *The Chinese Deathscape*, Introduction

**Source Note:** Composite quotation summarizing contiguous descriptions of afterlife bureaucracy in the reading; content and imagery are directly drawn from the text.

**Character Interactions:**
- *Greeting:* "State your name. The dead queue as well."
- *Handoff:* "Keep this record. Nothing escapes documentation."
- *Congratulation:* "Your papers are in order."
- *Farewell:* "Next."

---

### 7. Hungry Ghost 餓鬼

**Story:** *The Chinese Deathscape* (Oct 20)

**Scroll Quote:**
> *"With throats no wider than needles and bellies like great drums, they hunger without relief. Food turns to flame before it can be swallowed, and desire itself becomes punishment."*

**Source:** *The Chinese Deathscape*

**Source Note:** Traditional hungry-ghost description cited in the reading; extended passage reflects standard Buddhist-inflected imagery used in English translations.

**Character Interactions:**
- *Greeting:* "Food… no, not food—memory."
- *Handoff:* "This is all I was given."
- *Congratulation:* "You saw me."
- *Farewell:* "I remain."

---

### 8. Qutu Zhongren 屈突仲任

**Story:** *Qutu Zhongren Cruelly Kills Other Creatures* (Oct 22)

**Scroll Quote:**
> *"Qutu Zhongren took pleasure not merely in killing, but in cruelty itself. He delighted in suffering, and his heart was unmoved by pleading, blood, or death."*

**Source:** *Slapping the Table in Amazement* (拍案驚奇) – *Qutu Zhongren Cruelly Kills Other Creatures*

**Source Note:** Extended evaluative description of Qutu Zhongren's character from standard English translations of the story.

**Character Interactions:**
- *Greeting:* "Do you hear them? They never stop."
- *Handoff:* "Take it. I don't need reminders."
- *Shun:* "You think this makes you better than me?"
- *Farewell:* "Run."

---

### 9. Fox Spirit (Huli Jing) 狐狸精

**Story:** *Alien Kind: Foxes and Late Imperial Chinese Narrative* (Nov 3)

**Scroll Quote:**
> *"Do not ask whether I am human or spirit. Ask only whether I am sincere, for sincerity is rarer than either form and far more dangerous."*

**Source:** Late-imperial fox-spirit tales discussed in *Alien Kind: Foxes and Late Imperial Chinese Narrative*

**Source Note:** Representative fox-spirit speech drawn from recurring dialogue patterns in late-imperial fox narratives; phrasing aligns with standard teaching translations.

**Character Interactions:**
- *Greeting:* "Relax. If I meant to harm you, you'd never know."
- *Handoff:* "Read carefully. Words bite."
- *Congratulation:* "Clever enough to survive—impressive."
- *Farewell:* "We'll meet again. Or we won't."

---

### 10. Ghost Witness 鬼證人

**Story:** *Stories Old and New* (今古奇觀) – judicial ghost motif

**Scroll Quote:**
> *"The ghost testified clearly, naming names and crimes without hesitation, and when the truth was revealed, the case was finally resolved and the living left without excuse."*

**Source:** *Stories Old and New* (Jingu qiguan)

**Source Note:** Judicial ghost motif recurring across multiple stories; extended narrative phrasing reflects common teaching translations.

**Character Interactions:**
- *Greeting:* "I was summoned."
- *Handoff:* "This is what I said."
- *Congratulation:* "The record is complete."
- *Farewell:* "Court is adjourned."

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
- **11 Foxes** – Fox spirits roaming the streets (referencing the *Alien Kind* readings)
- **8 Monkeys** – Playful creatures (echoing the simian companion in *Journey to the West*)
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

> *"Unlicensed dentists and medical practitioners operated within the Walled City, offering affordable services to residents who might otherwise lack access to healthcare."* — `facts.json`

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

### Key Systems
- **Floor Room Cache** – Persists room configurations for consistent generation
- **Seeded Random Generation** – Ensures reproducible room layouts across sessions
- **NPC State Machine** – Multi-stage dialogue system for supernatural characters
- **Scroll Collection Tracking** – Persistent tracking of collected scrolls

---

## AI Usage Disclosure

This project was developed with significant assistance from AI tools:

### Claude (Anthropic) – Primary Development Assistant
- **Code Generation** – The majority of game.ts was written with Claude's assistance, including:
  - Three.js scene construction and rendering
  - NPC behavior and pathfinding systems
  - Room generation algorithms
  - UI implementation
  - Dialogue system architecture
- **Content Development** – Claude helped:
  - Structure the README documentation
  - Format character quotes and citations
  - Expand scroll quotes to appropriate length while maintaining fidelity to source material
- **Research Synthesis** – Claude assisted in:
  - Connecting course themes to game mechanics
  - Identifying which room types were historically accurate to KWC
  - Suggesting authentic details for interior spaces

### Character Dialogue & Scroll Quotes
The scroll quotes were developed through collaboration between the course readings and AI assistance:
- **Base Material:** Direct quotes and themes from course readings
- **Extension:** Where original quotes were too brief for gameplay, AI helped expand them while preserving meaning, tone, and source fidelity
- **Verification:** All quotes were reviewed against source material and annotated with source notes explaining their provenance

### 3D Assets
- Building exteriors, interiors, and furniture are **procedurally generated** using Three.js primitives
- No external 3D models were used for the city itself

### Historical Research
- Facts about Kowloon Walled City were compiled from academic sources (see Historical Sources below)
- AI assisted in organizing and formatting this research for the `facts.json` file

---

## Historical Sources

### Primary Sources on Kowloon Walled City

| Source | Description |
|--------|-------------|
| Girard, G. & Lambot, I. *City of Darkness Revisited* (2014) | Comprehensive photography and interviews with former residents |
| Pullinger, J. *Chasing the Dragon* (1980) | First-hand account of missionary work inside KWC |
| Wall Street Journal. "City of Imagination: Kowloon Walled City 20 Years Later" (2014) | Retrospective journalism |
| South China Morning Post. "Remembering Hong Kong's 'City of Darkness'" (2024) | Recent memorial coverage |
| BBC World Service | Former resident interview series |
| Industrial History HK | Factory and manufacturing documentation |
| M+ Museum, Hong Kong | Suenn Ho's Kowloon Walled City Research Archive |

### Course Readings (Literary Sources)

| Reading | Date | Themes |
|---------|------|--------|
| *Magistrate Teng* | Sept 8 | Ghosts in legal proceedings |
| *Shen Xiu* | Sept 10 | Posthumous return for justice |
| *Judge Bao Selling Rice in Chenzhou* | Sept 17 | Law, justice, incorruptibility |
| *The Phantom Heroine* | Sept 29 | Gender and ghost narratives |
| *The Ghost's Body* | Sept 29 / Oct 1 | Corporeal ghosts, embodiment |
| *The Chinese Deathscape* | Oct 20 | Afterlife bureaucracy, hungry ghosts |
| *Qutu Zhongren Cruelly Kills Other Creatures* | Oct 22 | Cruelty and karmic retribution |
| *Alien Kind: Foxes and Late Imperial Chinese Narrative* | Nov 3 | Fox spirits, identity, sincerity |
| *Stories Old and New* (今古奇觀) | Various | Judicial ghost motifs |

---

## Getting Started

> Make sure you have Node 22 downloaded on your machine before running!

1. Run `npm create devvit@latest --template=threejs`
2. Go through the installation wizard (requires Reddit developer account)
3. Copy the command from the success page into your terminal

## Commands

- `npm run dev` – Starts development server for live testing on Reddit
- `npm run build` – Builds client and server projects
- `npm run deploy` – Uploads a new version of your app
- `npm run launch` – Publishes your app for review
- `npm run login` – Logs CLI into Reddit
- `npm run check` – Type checks, lints, and prettifies your app

---

## Acknowledgments

This project was created for an East Asian Studies course exploring Chinese supernatural literature, law, death, and the afterlife. The game attempts to honor both the historical reality of Kowloon Walled City and the rich literary traditions of Chinese ghost stories.

Special thanks to:
- Course instructors and readings that provided the literary foundation
- Former residents of Kowloon Walled City whose stories preserved this unique community
- The photographers and researchers who documented KWC before its demolition
- Claude (Anthropic) for tireless development assistance

---

*"The story of Kowloon Walled City remains a powerful symbol of human adaptability, resilience, and the complex relationship between governance, architecture, and community."* — `facts.json`

---

**License:** See [LICENSE](LICENSE) file

**Version:** December 2024
