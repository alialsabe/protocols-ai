import postgres from 'postgres';
import { loadLocalEnv, getPoolerUrl } from '../src/lib/database-env';

loadLocalEnv();

const poolerUrl = getPoolerUrl();
if (!poolerUrl) throw new Error('Missing SUPABASE_POOLER_URL');

const parsed = new URL(poolerUrl);
const sql = postgres({
  host: parsed.hostname,
  port: Number(parsed.port) || 5432,
  database: parsed.pathname.slice(1) || 'postgres',
  username: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  ssl: { rejectUnauthorized: false },
  prepare: false,
  max: 1,
});

// ── Raw catalog data ──────────────────────────────────────────────
// Format: [baseCompound, specificForm, types (comma-separated)]
const CATALOG: [string, string, string][] = [
  // Essential Vitamins
  ['Vitamin A', 'Retinol', 'Essential Vitamin'],
  ['Vitamin A', 'Retinyl Palmitate', 'Essential Vitamin'],
  ['Vitamin A', 'Retinyl Acetate', 'Essential Vitamin'],
  ['Vitamin A', 'Beta-Carotene', 'Essential Vitamin'],
  ['Vitamin B1', 'Thiamine HCl', 'Essential Vitamin'],
  ['Vitamin B1', 'Thiamine Mononitrate', 'Essential Vitamin'],
  ['Vitamin B1', 'Benfotiamine', 'Essential Vitamin'],
  ['Vitamin B1', 'Sulbutiamine', 'Essential Vitamin, Nootropics'],
  ['Vitamin B2', 'Riboflavin', 'Essential Vitamin'],
  ['Vitamin B2', 'Riboflavin-5-Phosphate', 'Essential Vitamin'],
  ['Vitamin B3', 'Nicotinic Acid (Niacin)', 'Essential Vitamin'],
  ['Vitamin B3', 'Niacinamide (Nicotinamide)', 'Essential Vitamin'],
  ['Vitamin B3', 'Inositol Hexanicotinate', 'Essential Vitamin'],
  ['Vitamin B3', 'Nicotinamide Riboside (NR)', 'Essential Vitamin, Longevity'],
  ['Vitamin B3', 'Nicotinamide Mononucleotide (NMN)', 'Essential Vitamin, Longevity'],
  ['Vitamin B5', 'D-Calcium Pantothenate', 'Essential Vitamin'],
  ['Vitamin B5', 'Pantethine', 'Essential Vitamin'],
  ['Vitamin B6', 'Pyridoxine HCl', 'Essential Vitamin'],
  ['Vitamin B6', 'Pyridoxal-5-Phosphate (P5P)', 'Essential Vitamin'],
  ['Vitamin B7', 'Biotin', 'Essential Vitamin'],
  ['Vitamin B9', 'Folic Acid', 'Essential Vitamin'],
  ['Vitamin B9', 'L-Methylfolate (5-MTHF)', 'Essential Vitamin'],
  ['Vitamin B9', 'Folinic Acid', 'Essential Vitamin'],
  ['Vitamin B12', 'Cyanocobalamin', 'Essential Vitamin'],
  ['Vitamin B12', 'Methylcobalamin', 'Essential Vitamin'],
  ['Vitamin B12', 'Adenosylcobalamin', 'Essential Vitamin'],
  ['Vitamin B12', 'Hydroxocobalamin', 'Essential Vitamin'],
  ['Vitamin C', 'Ascorbic Acid', 'Essential Vitamin'],
  ['Vitamin C', 'Sodium Ascorbate', 'Essential Vitamin'],
  ['Vitamin C', 'Calcium Ascorbate', 'Essential Vitamin'],
  ['Vitamin C', 'Magnesium Ascorbate', 'Essential Vitamin'],
  ['Vitamin C', 'Liposomal Vitamin C', 'Essential Vitamin'],
  ['Vitamin D', 'Cholecalciferol (D3)', 'Essential Vitamin'],
  ['Vitamin D', 'Ergocalciferol (D2)', 'Essential Vitamin'],
  ['Vitamin E', 'd-Alpha Tocopherol', 'Essential Vitamin'],
  ['Vitamin E', 'dl-Alpha Tocopherol', 'Essential Vitamin'],
  ['Vitamin E', 'Mixed Tocopherols', 'Essential Vitamin'],
  ['Vitamin E', 'Tocotrienols', 'Essential Vitamin'],
  ['Vitamin K', 'Phylloquinone (K1)', 'Essential Vitamin'],
  ['Vitamin K', 'Menaquinone-4 (K2 MK-4)', 'Essential Vitamin'],
  ['Vitamin K', 'Menaquinone-7 (K2 MK-7)', 'Essential Vitamin'],
  // Essential Minerals
  ['Magnesium', 'Magnesium Oxide', 'Essential Mineral'],
  ['Magnesium', 'Magnesium Citrate', 'Essential Mineral'],
  ['Magnesium', 'Magnesium Glycinate / Bisglycinate', 'Essential Mineral'],
  ['Magnesium', 'Magnesium Malate', 'Essential Mineral'],
  ['Magnesium', 'Magnesium L-Threonate', 'Essential Mineral, Nootropics'],
  ['Magnesium', 'Magnesium Taurate', 'Essential Mineral'],
  ['Magnesium', 'Magnesium Chloride', 'Essential Mineral'],
  ['Magnesium', 'Magnesium Sulfate', 'Essential Mineral'],
  ['Magnesium', 'Magnesium Orotate', 'Essential Mineral'],
  ['Magnesium', 'Magnesium Carbonate', 'Essential Mineral'],
  ['Magnesium', 'Sucrosomial Magnesium', 'Essential Mineral'],
  ['Calcium', 'Calcium Carbonate', 'Essential Mineral'],
  ['Calcium', 'Calcium Citrate', 'Essential Mineral'],
  ['Calcium', 'Calcium Malate', 'Essential Mineral'],
  ['Calcium', 'Calcium Gluconate', 'Essential Mineral'],
  ['Calcium', 'Microcrystalline Hydroxyapatite (MCHA)', 'Essential Mineral'],
  ['Iron', 'Ferrous Sulfate', 'Essential Mineral'],
  ['Iron', 'Ferrous Gluconate', 'Essential Mineral'],
  ['Iron', 'Ferrous Fumarate', 'Essential Mineral'],
  ['Iron', 'Ferrous Bisglycinate', 'Essential Mineral'],
  ['Iron', 'Heme Iron Polypeptide', 'Essential Mineral'],
  ['Zinc', 'Zinc Oxide', 'Essential Mineral'],
  ['Zinc', 'Zinc Citrate', 'Essential Mineral'],
  ['Zinc', 'Zinc Picolinate', 'Essential Mineral'],
  ['Zinc', 'Zinc Gluconate', 'Essential Mineral'],
  ['Zinc', 'Zinc Carnosine', 'Essential Mineral'],
  ['Zinc', 'Zinc Bisglycinate', 'Essential Mineral'],
  ['Zinc', 'Zinc Monomethionine', 'Essential Mineral'],
  ['Zinc', 'Zinc Sulfate', 'Essential Mineral'],
  ['Potassium', 'Potassium Chloride', 'Essential Mineral'],
  ['Potassium', 'Potassium Citrate', 'Essential Mineral'],
  ['Potassium', 'Potassium Gluconate', 'Essential Mineral'],
  ['Potassium', 'Potassium Bicarbonate', 'Essential Mineral'],
  // Trace Minerals
  ['Selenium', 'Sodium Selenite', 'Trace Mineral'],
  ['Selenium', 'Selenomethionine', 'Trace Mineral'],
  ['Selenium', 'Selenium Yeast', 'Trace Mineral'],
  ['Selenium', 'Methylselenocysteine', 'Trace Mineral'],
  ['Iodine', 'Potassium Iodide', 'Trace Mineral'],
  ['Iodine', 'Kelp Extract', 'Trace Mineral'],
  ['Iodine', 'Nascent Iodine', 'Trace Mineral'],
  ['Copper', 'Copper Sulfate', 'Trace Mineral'],
  ['Copper', 'Copper Gluconate', 'Trace Mineral'],
  ['Copper', 'Copper Bisglycinate', 'Trace Mineral'],
  ['Copper', 'Copper Citrate', 'Trace Mineral'],
  ['Chromium', 'Chromium Picolinate', 'Trace Mineral'],
  ['Chromium', 'Chromium Polynicotinate', 'Trace Mineral'],
  ['Manganese', 'Manganese Sulfate', 'Trace Mineral'],
  ['Manganese', 'Manganese Gluconate', 'Trace Mineral'],
  ['Manganese', 'Manganese Bisglycinate', 'Trace Mineral'],
  ['Molybdenum', 'Sodium Molybdate', 'Trace Mineral'],
  ['Lithium', 'Lithium Orotate', 'Trace Mineral, Nootropics'],
  ['Boron', 'Boron Citrate', 'Trace Mineral'],
  ['Boron', 'Boron Glycinate', 'Trace Mineral'],
  ['Boron', 'Calcium Fructoborate', 'Trace Mineral'],
  // Amino Acids
  ['Leucine', 'L-Leucine', 'Amino Acid'],
  ['Isoleucine', 'L-Isoleucine', 'Amino Acid'],
  ['Valine', 'L-Valine', 'Amino Acid'],
  ['Arginine', 'L-Arginine', 'Amino Acid'],
  ['Arginine', 'Arginine Alpha-Ketoglutarate (AAKG)', 'Amino Acid'],
  ['Arginine', 'Arginine Silicate Inositol', 'Amino Acid'],
  ['Citrulline', 'L-Citrulline', 'Amino Acid'],
  ['Citrulline', 'Citrulline Malate', 'Amino Acid'],
  ['Glutamine', 'L-Glutamine', 'Amino Acid'],
  ['Glutamine', 'L-Alanyl-L-Glutamine', 'Amino Acid'],
  ['Tyrosine', 'L-Tyrosine', 'Amino Acid, Nootropics'],
  ['Tyrosine', 'N-Acetyl L-Tyrosine (NALT)', 'Amino Acid, Nootropics'],
  ['Tryptophan', 'L-Tryptophan', 'Amino Acid'],
  ['Tryptophan', '5-Hydroxytryptophan (5-HTP)', 'Amino Acid, Nootropics'],
  ['Theanine', 'L-Theanine', 'Amino Acid, Nootropics'],
  ['Carnitine', 'L-Carnitine Base', 'Amino Acid'],
  ['Carnitine', 'Acetyl-L-Carnitine (ALCAR)', 'Amino Acid, Nootropics, Longevity'],
  ['Carnitine', 'L-Carnitine L-Tartrate (LCLT)', 'Amino Acid'],
  ['Carnitine', 'Propionyl-L-Carnitine', 'Amino Acid'],
  // Amino Acid Derivatives
  ['Creatine', 'Creatine Monohydrate', 'Amino Acid Derivative'],
  ['Creatine', 'Creatine HCl', 'Amino Acid Derivative'],
  ['Creatine', 'Creatine Magnesium Chelate', 'Amino Acid Derivative'],
  ['Creatine', 'Creatine Ethyl Ester', 'Amino Acid Derivative'],
  ['Beta-Alanine', 'Beta-Alanine', 'Amino Acid Derivative'],
  ['Taurine', 'L-Taurine', 'Amino Acid'],
  ['Glycine', 'L-Glycine', 'Amino Acid, Longevity'],
  ['Cysteine', 'L-Cysteine', 'Amino Acid'],
  ['Cysteine', 'N-Acetyl Cysteine (NAC)', 'Amino Acid Derivative, Longevity'],
  ['Methionine', 'L-Methionine', 'Amino Acid'],
  ['Methionine', 'S-Adenosyl Methionine (SAMe)', 'Amino Acid Derivative, Nootropics'],
  ['Lysine', 'L-Lysine', 'Amino Acid'],
  ['Phenylalanine', 'L-Phenylalanine', 'Amino Acid, Nootropics'],
  ['Phenylalanine', 'DL-Phenylalanine (DLPA)', 'Amino Acid, Nootropics'],
  ['Proline', 'L-Proline', 'Amino Acid'],
  ['Serine', 'Phosphatidylserine', 'Amino Acid Derivative, Nootropics'],
  ['Histidine', 'L-Histidine', 'Amino Acid'],
  // Proteins
  ['Whey', 'Whey Protein Concentrate', 'Protein'],
  ['Whey', 'Whey Protein Isolate', 'Protein'],
  ['Whey', 'Whey Protein Hydrolysate', 'Protein'],
  ['Casein', 'Micellar Casein', 'Protein'],
  ['Casein', 'Calcium Caseinate', 'Protein'],
  ['Collagen', 'Bovine Collagen Peptides (Type I & III)', 'Protein'],
  ['Collagen', 'Marine Collagen Peptides', 'Protein'],
  ['Collagen', 'Chicken Sternum Cartilage (Type II)', 'Protein'],
  ['Plant Protein', 'Pea Protein Isolate', 'Protein'],
  ['Plant Protein', 'Soy Protein Isolate', 'Protein'],
  ['Plant Protein', 'Rice Protein', 'Protein'],
  ['Plant Protein', 'Hemp Protein', 'Protein'],
  ['Beef', 'Beef Protein Isolate', 'Protein'],
  // Herbs & Botanicals
  ['Ashwagandha', 'Root Powder', 'Herb & Botanical'],
  ['Ashwagandha', 'KSM-66 Extract', 'Herb & Botanical'],
  ['Ashwagandha', 'Sensoril Extract', 'Herb & Botanical'],
  ['Ashwagandha', 'Shoden Extract', 'Herb & Botanical'],
  ['Turmeric', 'Curcumin Powder', 'Herb & Botanical'],
  ['Turmeric', 'Curcumin with Piperine', 'Herb & Botanical'],
  ['Turmeric', 'Meriva Phospholipid Complex', 'Herb & Botanical'],
  ['Turmeric', 'BCM-95 Extract', 'Herb & Botanical'],
  ['Turmeric', 'Longvida Extract', 'Herb & Botanical'],
  ['Maca', 'Raw Maca Root', 'Herb & Botanical'],
  ['Maca', 'Gelatinized Maca', 'Herb & Botanical'],
  ['Ginseng', 'Panax Ginseng (Asian)', 'Herb & Botanical, Nootropics'],
  ['Ginseng', 'American Ginseng', 'Herb & Botanical'],
  ['Ginseng', 'Eleuthero (Siberian Ginseng)', 'Herb & Botanical'],
  ['Tongkat Ali', 'Eurycoma Longifolia Extract', 'Herb & Botanical'],
  ['Rhodiola', 'Rhodiola Rosea (3% Rosavins 1% Salidrosides)', 'Herb & Botanical, Nootropics'],
  ['Milk Thistle', 'Silymarin Extract', 'Herb & Botanical'],
  ['Saw Palmetto', 'Berry Extract', 'Herb & Botanical'],
  ['Echinacea', 'Echinacea Purpurea Extract', 'Herb & Botanical'],
  ['Echinacea', 'Echinacea Angustifolia Extract', 'Herb & Botanical'],
  ['Ginkgo Biloba', 'Standardized Extract (EGb 761)', 'Herb & Botanical, Nootropics'],
  ["St. John's Wort", 'Hypericin Extract', 'Herb & Botanical'],
  ['Valerian', 'Valerian Root Extract', 'Herb & Botanical'],
  ['Lemon Balm', 'Melissa Officinalis Leaf Extract', 'Herb & Botanical, Nootropics'],
  ['Holy Basil', 'Tulsi Extract', 'Herb & Botanical'],
  ['Boswellia', 'Boswellia Serrata (AKBA)', 'Herb & Botanical'],
  ['Ginger', 'Ginger Root Extract', 'Herb & Botanical'],
  ['Garlic', 'Aged Garlic Extract', 'Herb & Botanical'],
  ['Garlic', 'Allicin Extract', 'Herb & Botanical'],
  ['Green Tea', 'Green Tea Extract (EGCG)', 'Herb & Botanical'],
  ['Fadogia Agrestis', 'Stem Extract', 'Herb & Botanical'],
  ['Bacopa', 'Bacopa Monnieri Extract (Bacosides)', 'Herb & Botanical, Nootropics'],
  ['Gotu Kola', 'Centella Asiatica Extract', 'Herb & Botanical, Nootropics'],
  ['Saffron', 'Crocus Sativus Extract', 'Herb & Botanical, Nootropics'],
  ['Schisandra', 'Schisandra Chinensis Extract', 'Herb & Botanical'],
  ['Astragalus', 'Astragalus Membranaceus Root', 'Herb & Botanical, Longevity'],
  ['Berberine', 'Berberine HCl', 'Herb & Botanical, Longevity'],
  ['Berberine', 'Dihydroberberine', 'Herb & Botanical, Longevity'],
  ['Moringa', 'Moringa Oleifera Leaf Powder', 'Herb & Botanical'],
  ['Mucuna', 'Mucuna Pruriens (L-DOPA)', 'Herb & Botanical, Nootropics'],
  ['Tribulus', 'Tribulus Terrestris Extract', 'Herb & Botanical'],
  ['Cranberry', 'Vaccinium Macrocarpon Extract', 'Herb & Botanical'],
  ['Elderberry', 'Sambucus Nigra Extract', 'Herb & Botanical'],
  ['Fenugreek', 'Trigonella Foenum-graecum Extract', 'Herb & Botanical'],
  ['Hawthorn', 'Hawthorn Berry Extract', 'Herb & Botanical'],
  ['Olive Leaf', 'Oleuropein Extract', 'Herb & Botanical'],
  ['Grape Seed', 'Grape Seed Extract (OPC)', 'Herb & Botanical, Longevity'],
  ['Pine Bark', 'Pycnogenol', 'Herb & Botanical, Longevity'],
  ['Oregano', 'Oregano Oil (Carvacrol)', 'Herb & Botanical'],
  ['Cinnamon', 'Ceylon Cinnamon Extract', 'Herb & Botanical'],
  ['Yohimbe', 'Yohimbine HCl', 'Herb & Botanical'],
  ['Black Seed', 'Nigella Sativa Oil (Thymoquinone)', 'Herb & Botanical'],
  // Nootropics
  ['Choline', 'Alpha-GPC', 'Nootropics'],
  ['Choline', 'CDP-Choline (Citicoline)', 'Nootropics'],
  ['Choline', 'Choline Bitartrate', 'Nootropics'],
  ['Huperzine', 'Huperzine A', 'Nootropics'],
  ['Vinpocetine', 'Vinpocetine Extract', 'Nootropics'],
  ['Uridine', 'Uridine Monophosphate', 'Nootropics'],
  ["Lion's Mane", 'Hericium Erinaceus Fruiting Body Extract', 'Nootropics'],
  ["Lion's Mane", 'Hericium Erinaceus Mycelium Extract', 'Nootropics'],
  ['Phenethylamine', 'Phenylethylamine (PEA)', 'Nootropics'],
  ['Noopept', 'Omberacetam', 'Nootropics'],
  ['Racetams', 'Piracetam', 'Nootropics'],
  ['Racetams', 'Aniracetam', 'Nootropics'],
  ['Racetams', 'Oxiracetam', 'Nootropics'],
  ['Racetams', 'Phenylpiracetam', 'Nootropics'],
  ['Racetams', 'Pramiracetam', 'Nootropics'],
  ['Modafinil Analogues', 'Adrafinil', 'Nootropics'],
  ['GABA', 'Gamma-Aminobutyric Acid', 'Nootropics'],
  ['Phenibut', 'Beta-phenyl-gamma-aminobutyric acid', 'Nootropics'],
  ['L-DOPA', 'Levodopa', 'Nootropics'],
  // Longevity
  ['Resveratrol', 'Trans-Resveratrol', 'Longevity'],
  ['Pterostilbene', 'Pterostilbene', 'Longevity'],
  ['Quercetin', 'Quercetin Dihydrate', 'Longevity'],
  ['Quercetin', 'Quercetin Phytosome', 'Longevity'],
  ['Fisetin', 'Fisetin Extract', 'Longevity'],
  ['Spermidine', 'Wheat Germ Spermidine', 'Longevity'],
  ['Spermidine', 'Synthetic Spermidine', 'Longevity'],
  ['Apigenin', 'Apigenin Extract', 'Longevity'],
  ['Urolithin', 'Urolithin A', 'Longevity'],
  ['Alpha-Ketoglutarate', 'Calcium Alpha-Ketoglutarate (CaAKG)', 'Longevity'],
  ['L-Ergothioneine', 'L-Ergothioneine', 'Longevity'],
  ['Astaxanthin', 'Natural Astaxanthin', 'Longevity'],
  ['Glutathione', 'Liposomal Glutathione', 'Longevity'],
  ['Glutathione', 'Reduced L-Glutathione', 'Longevity'],
  ['NADH', 'Reduced Nicotinamide Adenine Dinucleotide', 'Longevity'],
  // Specialty Dietary Substances
  ['Omega-3', 'Fish Oil (EPA/DHA)', 'Specialty Dietary Substance'],
  ['Omega-3', 'Krill Oil (Phospholipid EPA/DHA)', 'Specialty Dietary Substance'],
  ['Omega-3', 'Algal Oil (Vegan EPA/DHA)', 'Specialty Dietary Substance'],
  ['Omega-3', 'Cod Liver Oil', 'Specialty Dietary Substance'],
  ['Omega-6', 'Evening Primrose Oil (GLA)', 'Specialty Dietary Substance'],
  ['Omega-6', 'Borage Oil', 'Specialty Dietary Substance'],
  ['Omega-6', 'Conjugated Linoleic Acid (CLA)', 'Specialty Dietary Substance'],
  ['Omega-9', 'Oleic Acid', 'Specialty Dietary Substance'],
  ['CoQ10', 'Ubiquinone (Oxidized)', 'Specialty Dietary Substance, Longevity'],
  ['CoQ10', 'Ubiquinol (Reduced)', 'Specialty Dietary Substance, Longevity'],
  ['Probiotics', 'Lactobacillus Acidophilus', 'Specialty Dietary Substance'],
  ['Probiotics', 'Lactobacillus Rhamnosus', 'Specialty Dietary Substance'],
  ['Probiotics', 'Bifidobacterium Bifidum', 'Specialty Dietary Substance'],
  ['Probiotics', 'Saccharomyces Boulardii', 'Specialty Dietary Substance'],
  ['Probiotics', 'Bacillus Coagulans (Spore-based)', 'Specialty Dietary Substance'],
  ['Prebiotics', 'Inulin', 'Specialty Dietary Substance'],
  ['Prebiotics', 'Fructooligosaccharides (FOS)', 'Specialty Dietary Substance'],
  ['Prebiotics', 'Galactooligosaccharides (GOS)', 'Specialty Dietary Substance'],
  ['Enzymes', 'Alpha-Amylase', 'Specialty Dietary Substance'],
  ['Enzymes', 'Protease', 'Specialty Dietary Substance'],
  ['Enzymes', 'Lipase', 'Specialty Dietary Substance'],
  ['Enzymes', 'Lactase', 'Specialty Dietary Substance'],
  ['Enzymes', 'Bromelain', 'Specialty Dietary Substance'],
  ['Enzymes', 'Papain', 'Specialty Dietary Substance'],
  ['Enzymes', 'Alpha-Galactosidase', 'Specialty Dietary Substance'],
  ['Enzymes', 'Nattokinase', 'Specialty Dietary Substance, Longevity'],
  ['Enzymes', 'Serrapeptase', 'Specialty Dietary Substance'],
  ['Alpha-Lipoic Acid', 'Alpha-Lipoic Acid (ALA)', 'Specialty Dietary Substance, Longevity'],
  ['Alpha-Lipoic Acid', 'R-Lipoic Acid (Stabilized Na-RALA)', 'Specialty Dietary Substance, Longevity'],
  ['Joint Support', 'Glucosamine Sulfate', 'Specialty Dietary Substance'],
  ['Joint Support', 'Glucosamine HCl', 'Specialty Dietary Substance'],
  ['Joint Support', 'Chondroitin Sulfate', 'Specialty Dietary Substance'],
  ['Joint Support', 'Methylsulfonylmethane (MSM)', 'Specialty Dietary Substance'],
  ['Joint Support', 'Hyaluronic Acid', 'Specialty Dietary Substance'],
  ['Hormone/Sleep', 'Melatonin', 'Specialty Dietary Substance, Longevity'],
  ['Hormone/Sleep', 'DHEA', 'Specialty Dietary Substance, Longevity'],
  ['Hormone/Sleep', 'Pregnenolone', 'Specialty Dietary Substance, Nootropics'],
  ['Antioxidant', 'Lutein', 'Specialty Dietary Substance'],
  ['Antioxidant', 'Zeaxanthin', 'Specialty Dietary Substance'],
  ['Antioxidant', 'Lycopene', 'Specialty Dietary Substance'],
  ['Hormone Modulator', 'Diindolylmethane (DIM)', 'Specialty Dietary Substance'],
  ['Mineral Pitch', 'Shilajit Extract (Fulvic Acid)', 'Specialty Dietary Substance'],
  ['Ketones', 'Beta-Hydroxybutyrate (BHB) Salts', 'Specialty Dietary Substance'],
  ['Ketones', 'Ketone Esters', 'Specialty Dietary Substance'],
  ['MCTs', 'Medium-Chain Triglyceride Powder/Oil', 'Specialty Dietary Substance'],
  ['Phospholipids', 'Phosphatidylcholine', 'Specialty Dietary Substance, Nootropics'],
  ['Polyphenols', 'Theaflavins', 'Specialty Dietary Substance, Longevity'],
  ['Senolytic', 'Piperlongumine', 'Specialty Dietary Substance, Longevity'],
];

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function makeId(base: string, form: string): string {
  const b = slugify(base).slice(0, 20);
  const f = slugify(form).slice(0, 25);
  return `supp-${b}-${f}`;
}

// Map existing supplements to their base compounds for update
const EXISTING_MAP: Record<string, { baseCompound: string; specificForm: string }> = {
  'supp-mag-glyc': { baseCompound: 'Magnesium', specificForm: 'Magnesium Glycinate / Bisglycinate' },
  'supp-creatine': { baseCompound: 'Creatine', specificForm: 'Creatine Monohydrate' },
  'supp-vit-d3': { baseCompound: 'Vitamin D', specificForm: 'Cholecalciferol (D3)' },
  'supp-omega3': { baseCompound: 'Omega-3', specificForm: 'Fish Oil (EPA/DHA)' },
  'supp-zinc-pic': { baseCompound: 'Zinc', specificForm: 'Zinc Picolinate' },
  'supp-ashwa-ksm66': { baseCompound: 'Ashwagandha', specificForm: 'KSM-66 Extract' },
  'supp-l-theanine': { baseCompound: 'Theanine', specificForm: 'L-Theanine' },
  'supp-coq10-ubiq': { baseCompound: 'CoQ10', specificForm: 'Ubiquinol (Reduced)' },
  'supp-vit-k2-mk7': { baseCompound: 'Vitamin K', specificForm: 'Menaquinone-7 (K2 MK-7)' },
  'supp-iron-ferr-bis': { baseCompound: 'Iron', specificForm: 'Ferrous Bisglycinate' },
  'supp-vit-c': { baseCompound: 'Vitamin C', specificForm: 'Ascorbic Acid' },
  'supp-b12-methyl': { baseCompound: 'Vitamin B12', specificForm: 'Methylcobalamin' },
  'supp-nac': { baseCompound: 'Cysteine', specificForm: 'N-Acetyl Cysteine (NAC)' },
  'supp-berberine-hcl': { baseCompound: 'Berberine', specificForm: 'Berberine HCl' },
  'supp-lions-mane': { baseCompound: "Lion's Mane", specificForm: 'Hericium Erinaceus Fruiting Body Extract' },
  'supp-melatonin': { baseCompound: 'Hormone/Sleep', specificForm: 'Melatonin' },
  'supp-rhodiola': { baseCompound: 'Rhodiola', specificForm: 'Rhodiola Rosea (3% Rosavins 1% Salidrosides)' },
  'supp-collagen-peptides': { baseCompound: 'Collagen', specificForm: 'Bovine Collagen Peptides (Type I & III)' },
  'supp-boron': { baseCompound: 'Boron', specificForm: 'Boron Citrate' },
  'supp-turkey-tail': { baseCompound: 'Turkey Tail', specificForm: 'Turkey Tail Mushroom' },
};

async function main() {
  const now = new Date().toISOString();

  console.log('Updating existing supplements with base_compound/specific_form...');
  for (const [id, mapping] of Object.entries(EXISTING_MAP)) {
    await sql`
      UPDATE supplements
      SET base_compound = ${mapping.baseCompound},
          specific_form = ${mapping.specificForm}
      WHERE id = ${id}
    `;
  }
  console.log(`Updated ${Object.keys(EXISTING_MAP).length} existing supplements.`);

  // Build set of existing specific_form values to skip duplicates
  const existingForms = new Set(Object.values(EXISTING_MAP).map(m => m.specificForm));

  console.log('Inserting new supplements...');
  let inserted = 0;
  let typesInserted = 0;

  for (const [baseCompound, specificForm, typesStr] of CATALOG) {
    // Skip if this form already exists as an existing supplement
    if (existingForms.has(specificForm)) {
      // But still insert types for it
      const types = typesStr.split(',').map(t => t.trim());
      // Find the existing supplement ID
      const existing = Object.entries(EXISTING_MAP).find(([, m]) => m.specificForm === specificForm);
      if (existing) {
        for (const typeName of types) {
          const typeId = `stype-${slugify(existing[0])}-${slugify(typeName)}`.slice(0, 60);
          await sql`
            INSERT INTO supplement_types (id, supplement_id, type_name)
            VALUES (${typeId}, ${existing[0]}, ${typeName})
            ON CONFLICT (id) DO NOTHING
          `;
          typesInserted++;
        }
      }
      continue;
    }

    const id = makeId(baseCompound, specificForm);
    const slug = slugify(specificForm);
    const name = specificForm;
    const types = typesStr.split(',').map(t => t.trim());
    const primaryType = types[0];
    const category = primaryType.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    await sql`
      INSERT INTO supplements (id, slug, name, aliases, category, base_compound, specific_form, popularity_score, status, created_at, updated_at)
      VALUES (
        ${id}, ${slug}, ${name},
        ${JSON.stringify([specificForm.toLowerCase(), baseCompound.toLowerCase()])},
        ${category}, ${baseCompound}, ${specificForm},
        0, 'published', ${now}, ${now}
      )
      ON CONFLICT (slug) DO UPDATE SET
        base_compound = EXCLUDED.base_compound,
        specific_form = EXCLUDED.specific_form,
        updated_at = EXCLUDED.updated_at
    `;
    inserted++;

    for (const typeName of types) {
      const typeId = `stype-${slugify(id)}-${slugify(typeName)}`.slice(0, 60);
      await sql`
        INSERT INTO supplement_types (id, supplement_id, type_name)
        VALUES (${typeId}, ${id}, ${typeName})
        ON CONFLICT (id) DO NOTHING
      `;
      typesInserted++;
    }
  }

  console.log(`Inserted ${inserted} new supplements.`);
  console.log(`Inserted ${typesInserted} type mappings.`);

  // Verify
  const [{ count: totalCount }] = await sql`SELECT count(*) FROM supplements`;
  const [{ count: typeCount }] = await sql`SELECT count(*) FROM supplement_types`;
  console.log(`Total supplements: ${totalCount}`);
  console.log(`Total type mappings: ${typeCount}`);

  await sql.end();
  console.log('Done!');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
