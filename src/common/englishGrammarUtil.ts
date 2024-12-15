enum Rule {
  A_AN_MATCH_CONSONANT_VOWEL
}

type FixableWords = { [key: string]: Rule; }

const fixableWords:FixableWords = {
  a: Rule.A_AN_MATCH_CONSONANT_VOWEL,
  an: Rule.A_AN_MATCH_CONSONANT_VOWEL
}

function _fixAAn(word: string, wordI: number, words: string[]): string {
  const nextWord = words[wordI + 1];
  if (!nextWord) return word;
  const nextWordFirstLetter = nextWord[0];
  const isVowel = 'aeiou'.includes(nextWordFirstLetter);
  const isUpperCase = word[0].toUpperCase() === word[0];
  if (isVowel) return isUpperCase ? 'An' : 'an';
  return isUpperCase ? 'A' : 'a';
}

export function fixGrammar(text: string): string {
  const words = text.split(' ');
  const fixedWords = words.map((word, wordI) => {
    const lowerCaseWord = word.toLowerCase();
    const rule = fixableWords[lowerCaseWord];
    switch(rule) {
      case Rule.A_AN_MATCH_CONSONANT_VOWEL:
        word = _fixAAn(word, wordI, words);
      break;
    }
    return word;
  });
  return fixedWords.join(' ');
}