const MODIFIER_PREFIXES = ["eq", "ne", "gt", "lt", "ge", "le", "sa", "eb", "ap"] as const;
type ModifierPrefix = typeof MODIFIER_PREFIXES[number];

const MODIFIERS = ["exact", "contains", "text", "above", "below", "in", "not-in", "of-type", "missing"] as const;
type SearchModifier = typeof MODIFIERS[number];

export interface Filter {
  param: string;
  modifier?: SearchModifier | string;
  prefix?: ModifierPrefix;
  value: string;
}

export interface SearchParams {
  filters: Filter[];
  sort?: string;
  count: number;
  offset: number;
  include: string[];
  revInclude: string[];
  summary?: string;
  elements?: string[];
}

function isModifierPrefix(s: string): s is ModifierPrefix {
  return MODIFIER_PREFIXES.includes(s as ModifierPrefix);
}

function isModifier(s: string): s is SearchModifier {
  return MODIFIERS.includes(s as SearchModifier);
}

export function parseSearchParams(query: Record<string, string>): SearchParams {
  const result: SearchParams = {
    filters: [],
    count: 10,
    offset: 0,
    include: [],
    revInclude: [],
  };

  for (const [key, rawValue] of Object.entries(query)) {
    if (!rawValue) continue;

    const value = rawValue.trim();

    if (key === "_sort") {
      result.sort = value;
      continue;
    }

    if (key === "_count") {
      const n = Number.parseInt(value, 10);
      if (!Number.isNaN(n) && n > 0) {
        result.count = Math.min(n, 100);
      }
      continue;
    }

    if (key === "_offset") {
      const n = Number.parseInt(value, 10);
      if (!Number.isNaN(n) && n >= 0) {
        result.offset = n;
      }
      continue;
    }

    if (key === "_include") {
      result.include = value.split(",").map((s) => s.trim()).filter(Boolean);
      continue;
    }

    if (key === "_revinclude" || key === "_revinclude") {
      result.revInclude = value.split(",").map((s) => s.trim()).filter(Boolean);
      continue;
    }

    if (key === "_summary") {
      result.summary = value;
      continue;
    }

    if (key === "_elements") {
      result.elements = value.split(",").map((s) => s.trim()).filter(Boolean);
      continue;
    }

    if (key.startsWith("_")) continue;

    const colonIdx = key.indexOf(":");
    const pipeIdx = key.indexOf("|");
    let paramName: string;
    let modifier: string | undefined;

    if (colonIdx !== -1) {
      paramName = key.slice(0, colonIdx);
      modifier = key.slice(colonIdx + 1);
    } else if (pipeIdx !== -1) {
      paramName = key.slice(0, pipeIdx);
      modifier = key.slice(pipeIdx + 1);
    } else {
      paramName = key;
    }

    let prefix: ModifierPrefix | undefined;
    let filterValue = value;

    if (modifier === undefined || !isModifier(modifier)) {
      for (const p of MODIFIER_PREFIXES) {
        if (value.startsWith(p) && value.length > p.length && !value.slice(p.length).startsWith(".")) {
          prefix = p as ModifierPrefix;
          filterValue = value.slice(p.length).trim();
          break;
        }
      }
    }

    result.filters.push({
      param: paramName,
      modifier: modifier && isModifier(modifier) ? modifier : modifier,
      prefix,
      value: filterValue,
    });
  }

  return result;
}
