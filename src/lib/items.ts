import type { Locale } from './i18n'

export type ItemDefinition = {
  id: string
  labels: Record<Locale, string>
  aliases: string[]
  /** Pool keys this item appears in, e.g. ['s1_1','s1_2']. Empty = all pools. */
  pools: string[]
}

/** Build a pool key from theme + period, e.g. 's1_1'. */
export function poolKey(theme: string, period: number): string {
  return `${theme}_${period}`
}

// S1 periods 1 & 2 confirmed pool
const S1_P12 = ['s1_1', 's1_2']

export const ITEM_DEFINITIONS: ItemDefinition[] = [
  {
    id: 'tower-of-barrens',
    labels: { en: 'Tower of Barrens', ja: '荒地の塔', vi: 'Tháp Cằn Cỗi' },
    aliases: ['Tower of Barrens', 'Tour des Terres Arides'],
    pools: S1_P12,
  },
  {
    id: 'portal-gate',
    labels: { en: 'Portal / Gate', ja: 'ポータル / ゲート', vi: 'Cổng Dịch Chuyển / Cổng' },
    aliases: ['Portal / Gate', 'Portal', 'Portail', 'Portal Gate'],
    pools: S1_P12,
  },
  {
    id: 'giant-egg',
    labels: { en: 'Giant Egg', ja: '巨大な卵', vi: 'Trứng Khổng Lồ' },
    aliases: ['Giant Egg', 'Œuf Géant'],
    pools: S1_P12,
  },
  {
    id: 'straw-hall',
    labels: { en: 'Straw Hall', ja: 'わらのホール', vi: 'Nhà Rơm Lớn' },
    aliases: ['Straw Hall', 'Hall de Paille'],
    pools: S1_P12,
  },
  {
    id: 'eroded-cave',
    labels: { en: 'Eroded Cave', ja: '風化した洞窟', vi: 'Hang Bị Bào Mòn' },
    aliases: ['Eroded Cave', 'Grotte Érodée', 'Weathered Cave'],
    pools: S1_P12,
  },
  {
    id: 'stone-totem',
    labels: { en: 'Stone Totem', ja: '石のトーテム', vi: 'Tôtem Đá' },
    aliases: ['Stone Totem', 'Totem de Pierre'],
    pools: S1_P12,
  },
  {
    id: 'outpost',
    labels: { en: 'Outpost', ja: '前哨基地', vi: 'Tiền Đồn' },
    aliases: ['Outpost', 'Avant-poste'],
    pools: S1_P12,
  },
  {
    id: 'sandstorm-fortress-i',
    labels: { en: 'Sandstorm Fortress I', ja: '砂嵐の要塞 I', vi: 'Pháo Đài Bão Cát I' },
    aliases: ['Sandstorm Fortress I', 'Forteresse - Tempête de I'],
    pools: S1_P12,
  },
  {
    id: 'sandstorm-fortress-ii',
    labels: { en: 'Sandstorm Fortress II', ja: '砂嵐の要塞 II', vi: 'Pháo Đài Bão Cát II' },
    aliases: ['Sandstorm Fortress II', 'Forteresse - Tempête de II', 'Sandstorm Fortress'],
    pools: S1_P12,
  },
  {
    id: 'straw-hut',
    labels: { en: 'Straw Hut', ja: 'わら小屋', vi: 'Lều Rơm' },
    aliases: ['Straw Hut', 'Hutte de Paille'],
    pools: S1_P12,
  },
  {
    id: 'blue-gem',
    labels: { en: 'Blue Gem', ja: '青い宝石', vi: 'Ngọc Xanh' },
    aliases: ['Blue Gem', 'Gemme Bleue'],
    pools: S1_P12,
  },
  {
    id: 'flower-bed',
    labels: { en: 'Flower Bed', ja: '花壇', vi: 'Luống Hoa' },
    aliases: ['Flower Bed', 'Lit de Fleur'],
    pools: S1_P12,
  },
  {
    id: 'signpost',
    labels: { en: 'Signpost', ja: '道しるべ', vi: 'Biển Chỉ Dẫn' },
    aliases: ['Signpost', 'Panneau'],
    pools: S1_P12,
  },
  {
    id: 'canopy-tent',
    labels: { en: 'Canopy Tent', ja: '天蓋テント', vi: 'Lều Mái Vòm' },
    aliases: ['Canopy Tent', 'Tente à Auvent'],
    pools: S1_P12,
  },
  {
    id: 'beast-bone-totem',
    labels: { en: 'Beast Bone Totem', ja: '獣骨のトーテム', vi: 'Tôtem Xương Thú' },
    aliases: ['Beast Bone Totem', "Totem d'os de Bête"],
    pools: S1_P12,
  },
  {
    id: 'water-reservoir-i',
    labels: { en: 'Water Reservoir I', ja: '貯水槽 I', vi: 'Bể Nước I' },
    aliases: ['Water Reservoir I', "Réservoir d'Eau I"],
    pools: S1_P12,
  },
  {
    id: 'water-reservoir-ii',
    labels: { en: 'Water Reservoir II', ja: '貯水槽 II', vi: 'Bể Nước II' },
    aliases: ['Water Reservoir II', "Réservoir d'Eau II"],
    pools: S1_P12,
  },
  {
    id: 'shell',
    labels: { en: 'Shell', ja: '貝殻', vi: 'Vỏ Sò' },
    aliases: ['Shell', 'Coquille', 'Seashell'],
    pools: S1_P12,
  },
  {
    id: 'boss-throne',
    labels: { en: 'Boss Throne', ja: 'ボスの玉座', vi: 'Ngai Boss' },
    aliases: ['Boss Throne', 'Trône du Boss'],
    pools: S1_P12,
  },
  {
    id: 'stone-pillar',
    labels: { en: 'Stone Pillar', ja: '石柱', vi: 'Trụ Đá' },
    aliases: ['Stone Pillar', 'Pilier en Pierre'],
    pools: S1_P12,
  },
  // ── Items from other themes/periods (no confirmed pool yet) ──
  {
    id: 'sphinx-statue',
    labels: { en: 'Sphinx Statue', ja: 'スフィンクス像', vi: 'Tượng Nhân Sư' },
    aliases: ['Sphinx Statue', 'Statue du Sphinx'],
    pools: [],
  },
  {
    id: 'pyramid',
    labels: { en: 'Pyramid', ja: 'ピラミッド', vi: 'Kim Tự Tháp' },
    aliases: ['Pyramid', 'Pyramide'],
    pools: [],
  },
  {
    id: 'water-wheel',
    labels: { en: 'Water Wheel', ja: '水車', vi: 'Bánh Xe Nước' },
    aliases: ['Water Wheel', 'Roue à Eau', 'Broken Wheel'],
    pools: [],
  },
  {
    id: 'sandstorm-pavilion-a',
    labels: { en: 'Sandstorm Pavilion A', ja: '砂嵐のパビリオン A', vi: 'Nhà Mái Bão Cát A' },
    aliases: ['Sandstorm Pavilion A', 'Pavillon - Tempête de Sab A'],
    pools: [],
  },
  {
    id: 'sandstorm-pavilion-b',
    labels: { en: 'Sandstorm Pavilion B', ja: '砂嵐のパビリオン B', vi: 'Nhà Mái Bão Cát B' },
    aliases: ['Sandstorm Pavilion B', 'Pavillon - Tempête de Sab B'],
    pools: [],
  },
  {
    id: 'colored-ore',
    labels: { en: 'Colored Ore', ja: '彩色鉱石', vi: 'Quặng Màu' },
    aliases: ['Colored Ore', 'Minerai Coloré'],
    pools: [],
  },
  {
    id: 'sandstorm-castle',
    labels: { en: 'Sandstorm Castle', ja: '砂嵐の城', vi: 'Lâu Đài Bão Cát' },
    aliases: ['Sandstorm Castle', 'Château Tempête de Sabl'],
    pools: [],
  },
  {
    id: 'sandstorm-bunker',
    labels: { en: 'Sandstorm Bunker', ja: '砂嵐のバンカー', vi: 'Boong-ke Bão Cát' },
    aliases: ['Sandstorm Bunker', 'Bunker anti-Tempête de S'],
    pools: [],
  },
  {
    id: 'fern-cluster',
    labels: { en: 'Fern Cluster', ja: 'シダの群生', vi: 'Cụm Dương Xỉ' },
    aliases: ['Fern Cluster', 'Amas de Fougère'],
    pools: [],
  },
  {
    id: 'eroded-arch-i',
    labels: { en: 'Eroded Arch I', ja: '風化したアーチ I', vi: 'Cổng Vòm Bào Mòn I' },
    aliases: ['Eroded Arch I', 'Porche Érodée I', 'Weathered Porch I'],
    pools: [],
  },
  {
    id: 'eroded-arch-ii',
    labels: { en: 'Eroded Arch II', ja: '風化したアーチ II', vi: 'Cổng Vòm Bào Mòn II' },
    aliases: ['Eroded Arch II', 'Porche Érodée II', 'Weathered Porch II'],
    pools: [],
  },
  {
    id: 'eroded-arch-iii',
    labels: { en: 'Eroded Arch III', ja: '風化したアーチ III', vi: 'Cổng Vòm Bào Mòn III' },
    aliases: ['Eroded Arch III', 'Porche Érodée III', 'Weathered Porch III'],
    pools: [],
  },
  {
    id: 'eroded-fountain',
    labels: { en: 'Eroded Fountain', ja: '風化した噴水', vi: 'Đài Phun Bị Bào Mòn' },
    aliases: ['Eroded Fountain', 'Fontaine Érodée', 'Weathered Fountain'],
    pools: [],
  },
  {
    id: 'eroded-altar',
    labels: { en: 'Eroded Altar', ja: '風化した祭壇', vi: 'Bệ Thờ Bị Bào Mòn' },
    aliases: ['Eroded Altar', 'Autel Érodée', 'Weathered Altar'],
    pools: [],
  },
  {
    id: 'mineral-cave',
    labels: { en: 'Mineral Cave', ja: '鉱石の洞窟', vi: 'Hang Khoáng Sản' },
    aliases: ['Mineral Cave', 'Grotte Minérale'],
    pools: [],
  },
  {
    id: 'ruby-mine',
    labels: { en: 'Ruby Mine', ja: 'ルビー鉱山', vi: 'Mỏ Hồng Ngọc' },
    aliases: ['Ruby Mine', 'Mine de Rubis', 'Ruby Vein'],
    pools: [],
  },
  {
    id: 'stone-mine',
    labels: { en: 'Stone Mine', ja: '石鉱山', vi: 'Mỏ Đá' },
    aliases: ['Stone Mine', 'Mine de Pierre', 'Stone Vein'],
    pools: [],
  },
  {
    id: 'eroded-stone',
    labels: { en: 'Eroded Stone', ja: '風化した石', vi: 'Đá Bị Bào Mòn' },
    aliases: ['Eroded Stone', 'Pierre Érodée', 'Weathered Stone'],
    pools: [],
  },
]

const ITEM_LOOKUP = new Map<string, ItemDefinition>()

for (const item of ITEM_DEFINITIONS) {
  ITEM_LOOKUP.set(item.id.toLowerCase(), item)
  ITEM_LOOKUP.set(item.labels.en.toLowerCase(), item)
  for (const alias of item.aliases) {
    ITEM_LOOKUP.set(alias.toLowerCase(), item)
  }
}

export function resolveItemDefinition(value: string | null | undefined) {
  if (!value) {
    return null
  }

  return ITEM_LOOKUP.get(value.trim().toLowerCase()) ?? null
}

export function itemLabel(value: string | null | undefined, locale: Locale) {
  const definition = resolveItemDefinition(value)
  if (!definition) {
    return value ?? ''
  }

  return definition.labels[locale]
}

export function itemImageUrl(id: string): string {
  return `${import.meta.env.BASE_URL}items/${id}.png`
}

/**
 * Returns items available in the current pool that haven't been found yet.
 * Items with pools=[] (unassigned) are shown for pools that have no specific items.
 */
export function availableItems(
  foundItems: Array<string | null | undefined>,
  theme: string,
  period: number,
) {
  const foundIds = new Set(
    foundItems
      .map((item) => resolveItemDefinition(item)?.id)
      .filter((value): value is string => Boolean(value)),
  )

  const pool = poolKey(theme, period)
  const poolItems = ITEM_DEFINITIONS.filter((item) => item.pools.includes(pool))

  // If we have specific items for this pool, use them; otherwise show all unassigned items
  const baseItems = poolItems.length > 0
    ? poolItems
    : ITEM_DEFINITIONS.filter((item) => item.pools.length === 0)

  return baseItems.filter((item) => !foundIds.has(item.id))
}
