const fs = require('fs');
const path = require('path');

const tagsVocab = ['http', 'databases', 'sql', 'indexing', 'caching', 'concurrency', 'distributed-systems', 'api-design', 'testing', 'debugging', 'deployment', 'observability', 'security', 'career', 'learning-how-to-learn', 'systems-thinking', 'burnout', 'communication'];

function getRandomTags(count) {
  const shuffled = [...tagsVocab].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomDifficulty() {
  // Bell curve around 3 (1-5)
  const rand = Math.random() + Math.random() + Math.random();
  const val = Math.round((rand / 3) * 4) + 1;
  return Math.max(1, Math.min(5, val));
}

function createItems(count, bucket, type, idStart) {
  const items = [];
  for (let i = 0; i < count; i++) {
    const isContrarian = Math.random() < 0.18;
    const diff = type === 'rest' ? 1 : getRandomDifficulty();
    const heat = Math.random();
    const novelty = Math.random();
    
    let minutes;
    if (type === 'rest') minutes = 0;
    else if (type === 'tool') minutes = 15 + Math.floor(Math.random() * 45);
    else minutes = 5 + Math.floor(Math.random() * 55);

    const item = {
      id: `C${(idStart + i).toString().padStart(3, '0')}`,
      title: `${isContrarian ? 'Against ' : 'Introduction to '} ${getRandomTags(1)[0].replace('-', ' ')}`,
      url: type === 'experience' ? `local:${type}` : `https://example.com/item-${idStart + i}`,
      source: 'The Shelf',
      bucket,
      type,
      minutes,
      difficulty: diff,
      tags: getRandomTags(2),
      stance: isContrarian ? 'contrarian' : 'mainstream',
      thumbnail_heat: parseFloat(heat.toFixed(2)),
      novelty: parseFloat(novelty.toFixed(2))
    };

    if (type === 'challenge') {
      item.completion_condition = `Build a proof of concept for ${item.tags[0]} and write down where it breaks.`;
      item.title = `Challenge: Master ${item.tags[0]}`;
    } else if (type === 'mentor') {
      item.completion_condition = `Send an outreach message to discuss ${item.tags[0]}.`;
      item.title = `Discuss ${item.tags[0]} with a senior`;
    } else if (type === 'rest') {
      item.completion_condition = 'Do no work today.';
      item.title = 'Take the day off';
    }

    items.push(item);
  }
  return items;
}

const allItems = [
  ...createItems(45, 'media', 'story', 1),
  ...createItems(105, 'knowledge', 'idea', 46),
  ...createItems(25, 'knowledge', 'tool', 151),
  ...createItems(45, 'experience', 'challenge', 176),
  ...createItems(25, 'experience', 'mentor', 221),
  ...createItems(5, 'experience', 'rest', 246)
];

const contentPath = path.resolve(__dirname, 'content.json');
fs.writeFileSync(contentPath, JSON.stringify(allItems, null, 2));

console.log(`Generated ${allItems.length} items to content.json`);
