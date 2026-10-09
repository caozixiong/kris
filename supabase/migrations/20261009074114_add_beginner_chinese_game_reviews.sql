-- Add the three beginner-Chinese games without changing review access or moderation.
begin;
alter table public.game_reviews drop constraint game_reviews_game_id_check;
alter table public.game_reviews add constraint game_reviews_game_id_check
  check (game_id in (
    'chinese-first-words','chinese-picture-match','chinese-word-builder',
    'bilingual-memory','word-bridge','sentence-match',
    'addition_game','multiplication_game','shape_sorter_math','vocabulary_quiz',
    'chinese_character_quiz','chinese_game1','circuit-lab','english-ruins','french-market','math-orbit',
    'math1','math10','math234','math567','math8','math9','math_addition_subtraction','math_chinese','math_english','math_visual_game'
  ));
commit;
