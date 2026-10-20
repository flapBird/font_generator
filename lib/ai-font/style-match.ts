import { FONT_SAMPLES } from './catalog';

const keywords = {
  playful: ['playful', 'round', 'bubble', 'cute', 'kids', 'child', 'party', 'bakery', '可爱', '圆润', '儿童', '卡通', '蛋糕'],
  editorial: ['serif', 'elegant', 'editorial', 'luxury', 'wedding', 'classic', 'retro', 'coffee', 'cafe', '复古', '优雅', '婚礼', '咖啡', '杂志'],
  arcade: ['pixel', 'arcade', '8-bit', '8 bit', 'game', 'gaming', '像素', '游戏', '街机'],
  bold: ['bold', 'condensed', 'sport', 'strong', 'poster', 'headline', '粗', '运动', '海报', '力量', '标题'],
};

// Deterministic matching only: no model, API request, or paid generation.
export function matchFontStyle(description: string) {
  const text = description.trim().toLowerCase();
  const ranked = FONT_SAMPLES.map(sample => ({ sample, score: keywords[sample.id].filter(word => text.includes(word)).length }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score ? ranked[0].sample : null;
}
