export const normalizeLines = (raw: string): string[] => {
  return raw.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Remove bullets and numbers
      let s = line.replace(/^(\-|\*|•|·)\s+/, '');
      s = s.replace(/^\d+\)\s+/, '');
      s = s.replace(/^\d+\.\s+/, '');
      return s.trim();
    })
    .filter(s => s.length > 0);
};

export const mergeDuplicates = (lines: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  
  for (const s of lines) {
    const key = s.replace(/\s+/g, ' ').trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
};
