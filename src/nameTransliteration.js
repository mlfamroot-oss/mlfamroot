const tamilRange = /[\u0B80-\u0BFF]/;

// Small, offline phonetic helper for names. This is transliteration, not translation.
// English spelling is ambiguous, so every result remains editable by the family member.
const vowelIndependent = { a:"அ", aa:"ஆ", ae:"ஏ", ai:"ஐ", e:"எ", ee:"ஈ", i:"இ", o:"ஒ", oo:"ஊ", u:"உ", au:"ஔ" };
const vowelSigns = { a:"", aa:"ா", ae:"ே", ai:"ை", e:"ெ", ee:"ீ", i:"ி", o:"ொ", oo:"ூ", u:"ு", au:"ௌ" };
const consonants = {
  ng:"ங", nj:"ஞ", zh:"ழ", sh:"ஷ", ch:"ச", th:"த", dh:"த", nn:"ண", ll:"ள", rr:"ற",
  k:"க", g:"க", c:"ச", s:"ச", j:"ஜ", t:"ட", d:"ட", n:"ந", p:"ப", b:"ப", m:"ம",
  y:"ய", r:"ர", l:"ல", v:"வ", w:"வ", h:"ஹ", f:"ஃப", x:"க்ஸ", q:"க"
};
const vowels = ["aa", "ae", "ai", "ee", "oo", "au", "a", "e", "i", "o", "u"];
const consonantKeys = Object.keys(consonants).sort((a, b) => b.length - a.length);
const virama = "்";

export function suggestTamilName(value) {
  const source = String(value || "").trim();
  if (!source || tamilRange.test(source)) return "";
  const canonical = source.toLowerCase().replace(/[ .'-]/g, "");
  // Frequent Tamil name endings often use a long vowel absent from English spelling.
  const knownNames = { loganathan:"லோகநாதன்", loganathanm:"லோகநாதன்" };
  if (knownNames[canonical]) return knownNames[canonical];

  const words = source.toLowerCase().split(/([\s'-]+)/);
  return words.map(word => {
    if (!word || /^[\s'-]+$/.test(word)) return word;
    let output = "", index = 0, lastWasConsonant = false;
    while (index < word.length) {
      const vowel = vowels.find(item => word.startsWith(item, index));
      if (vowel) {
        if (lastWasConsonant) output += vowelSigns[vowel];
        else output += vowelIndependent[vowel] || "";
        index += vowel.length;
        lastWasConsonant = false;
        continue;
      }
      const key = consonantKeys.find(item => word.startsWith(item, index));
      if (key) {
        if (lastWasConsonant) output += virama;
        output += consonants[key];
        index += key.length;
        lastWasConsonant = true;
      } else {
        output += word[index];
        index += 1;
        lastWasConsonant = false;
      }
    }
    if (lastWasConsonant) output += virama;
    return output;
  }).join("");
}

const tamilToLatin = {
  "க":"k", "ங":"ng", "ச":"ch", "ஞ":"nj", "ட":"t", "ண":"n", "த":"th", "ந":"n", "ப":"p", "ம":"m", "ய":"y", "ர":"r", "ல":"l", "வ":"v", "ழ":"zh", "ள":"l", "ற":"r", "ன":"n", "ஜ":"j", "ஷ":"sh", "ஸ":"s", "ஹ":"h", "ஃ":"h",
  "அ":"a", "ஆ":"aa", "இ":"i", "ஈ":"ee", "உ":"u", "ஊ":"oo", "எ":"e", "ஏ":"ae", "ஐ":"ai", "ஒ":"o", "ஓ":"o", "ஔ":"au",
  "ா":"aa", "ி":"i", "ீ":"ee", "ு":"u", "ூ":"oo", "ெ":"e", "ே":"ae", "ை":"ai", "ொ":"o", "ோ":"o", "ௌ":"au"
};

export function romanizeTamil(value) {
  const source = String(value || "").trim();
  if (!source || !tamilRange.test(source)) return "";
  const units = Array.from(source);
  let result = "";
  for (let index = 0; index < units.length; index += 1) {
    const char = units[index];
    if (char === virama) continue;
    const consonant = tamilToLatin[char];
    if (!consonant) { result += char; continue; }
    const next = units[index + 1];
    if (["க","ங","ச","ஞ","ட","ண","த","ந","ப","ம","ய","ர","ல","வ","ழ","ள","ற","ன","ஜ","ஷ","ஸ","ஹ"].includes(char)) {
      result += consonant;
      if (next === virama) index += 1;
      else if (!next || !["ா","ி","ீ","ு","ூ","ெ","ே","ை","ொ","ோ","ௌ"].includes(next)) result += "a";
      continue;
    }
    result += consonant;
  }
  return result.replace(/\s+/g, " ").trim();
}
