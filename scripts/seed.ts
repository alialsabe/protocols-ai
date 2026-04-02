import { db, schema, getRawDb } from '../src/lib/db';
import {
supplementsData,
scienceData,
socialData,
sentimentData,
dosageData,
scheduleRulesData,
conflictsData,
medicineInteractionsData,
affiliateData,
companionData,
} from '../src/lib/seed-data';
function reseed() {
const raw = getRawDb();
// Clear tables safely, including legacy table names from earlier schema versions.
raw.pragma('foreign_keys = OFF');
raw.exec(`
DELETE FROM affiliate_options;
DELETE FROM medicine_interactions;
DELETE FROM conflicts;
DELETE FROM schedule_rules;
DELETE FROM supplement_dosage;
DELETE FROM supplement_sentiment;
DELETE FROM supplement_social;
DELETE FROM supplement_science;
DELETE FROM companion_stacks;
    DELETE FROM supplements;
-- legacy tables
DELETE FROM supplement_conflicts;
DELETE FROM supplement_schedule_rules;
`);
raw.pragma('foreign_keys = ON');
db.transaction((tx) => {
tx.insert(schema.supplements).values(supplementsData).run();
tx.insert(schema.supplementScience).values(scienceData).run();
tx.insert(schema.supplementSocial).values(socialData).run();
tx.insert(schema.supplementSentiment).values(sentimentData).run();
tx.insert(schema.supplementDosage).values(dosageData).run();
tx.insert(schema.supplementScheduleRules).values(scheduleRulesData).run();
tx.insert(schema.supplementConflicts).values(conflictsData).run();
tx.insert(schema.medicineInteractions).values(medicineInteractionsData).run();
tx.insert(schema.affiliateOptions).values(affiliateData).run();
    tx.insert(schema.companionStacks).values(companionData).run();
});
console.log('✅ Reseeded database with Protocols.ai v1 dataset.');
}
reseed();
