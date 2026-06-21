const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const generateWrongOptions = (correct, count) => {
  const wrongs = new Set();
  const deltas = [1, 2, 3, 4, 5, 7, 10, 11, 20, 25];
  let attempts = 0;
  while (wrongs.size < count && attempts < 60) {
    attempts++;
    const delta = deltas[Math.floor(Math.random() * deltas.length)] * (Math.random() < 0.5 ? 1 : -1);
    const w = correct + delta;
    if (w > 0 && w !== correct && !wrongs.has(String(w))) {
      wrongs.add(String(w));
    }
  }
  // Fallback if not enough
  let fallback = 1;
  while (wrongs.size < count) {
    if (fallback !== correct) wrongs.add(String(correct + fallback));
    fallback++;
  }
  return [...wrongs].slice(0, count);
};

const generateQuestion = (difficulty = 'medium') => {
  const isEasy = difficulty === 'easy' || (difficulty === 'mixed' && Math.random() < 0.5);

  const ops = ['+', '-', '×', '÷'];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a, b, answer, type;

  switch (op) {
    case '+': {
      a = isEasy ? rnd(10, 60) : rnd(50, 400);
      b = isEasy ? rnd(10, 60) : rnd(50, 400);
      answer = a + b;
      type = 'addition';
      break;
    }
    case '-': {
      a = isEasy ? rnd(25, 90) : rnd(100, 600);
      b = isEasy ? rnd(5, Math.max(5, a - 10)) : rnd(10, Math.floor(a * 0.85));
      answer = a - b;
      type = 'subtraction';
      break;
    }
    case '×': {
      a = isEasy ? rnd(2, 12) : rnd(5, 25);
      b = isEasy ? rnd(2, 12) : rnd(5, 25);
      answer = a * b;
      type = 'multiplication';
      break;
    }
    case '÷': {
      b = rnd(2, isEasy ? 10 : 15);
      answer = rnd(2, isEasy ? 12 : 20);
      a = b * answer;
      type = 'division';
      break;
    }
    default: {
      a = rnd(10, 50); b = rnd(10, 50); answer = a + b; type = 'addition';
    }
  }

  const correctStr = String(answer);
  const wrongs = generateWrongOptions(answer, 3);
  const options = shuffle([correctStr, ...wrongs]);

  const symbols = { '+': '+', '-': '−', '×': '×', '÷': '÷' };
  const prompt = `${a} ${symbols[op]} ${b} = ?`;

  return {
    _id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    prompt,
    options,
    correctAnswer: correctStr,
    type,
    difficulty: isEasy ? 'easy' : 'medium',
    generated: true,
  };
};

const generateQuestions = (count, difficulty = 'mixed') =>
  Array.from({ length: count }, () => generateQuestion(difficulty));

module.exports = { generateQuestion, generateQuestions };
