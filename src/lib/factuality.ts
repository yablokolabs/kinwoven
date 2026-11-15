export type FactualityCategory = 'time' | 'date' | 'people' | 'feeling' | 'filler';

export type FactualityFlag = {
  term: string;
  category: FactualityCategory;
};

const LABELS: Record<FactualityCategory, string> = {
  time: 'time of day',
  date: 'date or occasion',
  people: 'person or group',
  feeling: 'feeling or judgement',
  filler: 'filler or commentary',
};

const RULES: Array<{ category: FactualityCategory; terms: string[] }> = [
  {
    category: 'time',
    terms: [
      'morning',
      'afternoon',
      'evening',
      'night',
      'tonight',
      'dawn',
      'dusk',
      'sunrise',
      'sunset',
      'noon',
      'midnight',
      'daytime',
      'day',
      'today',
      'yesterday',
      'tomorrow',
    ],
  },
  {
    category: 'date',
    terms: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
      'January',
      'February',
      'April',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
      'spring',
      'summer',
      'autumn',
      'winter',
      'birthday',
      'anniversary',
      'Christmas',
      'Easter',
      'holiday',
      'wedding',
      'funeral',
      'tradition',
    ],
  },
  {
    category: 'people',
    terms: [
      'family',
      'families',
      'everyone',
      'people',
      'Mum',
      'Mom',
      'Mother',
      'Dad',
      'Father',
      'Grandma',
      'Grandmother',
      'Grandad',
      'Grandfather',
      'Aunt',
      'Uncle',
      'Sister',
      'Brother',
      'Son',
      'Daughter',
      'Wife',
      'Husband',
      'friend',
      'neighbour',
      'neighbor',
    ],
  },
  {
    category: 'feeling',
    terms: [
      'happy',
      'sad',
      'proud',
      'grateful',
      'joyful',
      'excited',
      'nervous',
      'lonely',
      'loved',
      'love',
      'miss',
      'missed',
      'wonderful',
      'precious',
      'special',
      'beautiful',
      'perfect',
      'favourite',
      'favorite',
      'lovely',
      'nice',
      'fun',
    ],
  },
  {
    category: 'filler',
    terms: [
      'appreciate',
      'treasure',
      'cherish',
      'remember',
      'memory',
      'memories',
      'blessed',
      'thank',
      'thanks',
      'welcome',
      'share',
      'photo',
      'photos',
      'photograph',
      'photographs',
      'picture',
      'pictures',
      'sound',
      'sounds',
      'always',
      'never',
    ],
  },
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, ' ').trim();
}

function hasTerm(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}(?:s|es)?([^a-z0-9]|$)`, 'i').test(text);
}

export function factualityCategoryLabel(category: FactualityCategory): string {
  return LABELS[category];
}

/**
 * A deliberately small review aid, not a semantic fact checker. It surfaces
 * concrete words that are common sources of invention when they are absent
 * from the family's notes. A human still has to read the draft.
 */
export function findUnsupportedDetails(
  caption: string,
  story: string,
  sources: string[],
): FactualityFlag[] {
  const draft = normalize(`${caption}\n${story}`);
  const sourceText = normalize(sources.join('\n'));
  const flags = new Map<string, FactualityFlag>();

  for (const rule of RULES) {
    for (const term of rule.terms) {
      if (!hasTerm(sourceText, term) && hasTerm(draft, term)) {
        flags.set(term.toLowerCase(), { term, category: rule.category });
      }
    }
  }

  for (const match of draft.match(/\b(?:19|20)\d{2}\b/g) ?? []) {
    if (!sourceText.includes(match)) {
      flags.set(match, { term: match, category: 'date' });
    }
  }

  return [...flags.values()].slice(0, 8);
}
