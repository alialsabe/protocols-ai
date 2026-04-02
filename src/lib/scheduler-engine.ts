/**
 * Deterministic scheduler engine for Protocols.ai
 * Assigns time slots, detects conflicts, resolves spacing requirements.
 */
import { db, schema } from './db';
import { eq, or } from 'drizzle-orm';
import type {
  ScheduleBlock,
  SchedulerInput,
  SchedulerOutput,
  SchedulerWarning,
  UserRoutine,
} from './protocol-types';
import { findSupplementByQuery } from './supplement-lookup';

// ── Types for internal use ──────────────────────────────────────────
interface SupplementSlot {
  suppId: string;
  slug: string;
  name: string;
  preferredTime: string;
  withFood: boolean;
  foodType: string | null;
  emptyStomach: boolean;
  fatSoluble: boolean;
  stimulant: boolean;
  sedating: boolean;
  assignedSlot: string; // HH:MM
}

interface ConflictPair {
  aId: string;
  bId: string;
  conflictType: string;
  minSpacingHours: number | null;
  mechanism: string;
  severity: string;
}

// ── Default routine ─────────────────────────────────────────────────
const DEFAULT_ROUTINE: UserRoutine = {
  wakeTime: '07:00',
  sleepTime: '23:00',
  meals: {
    breakfast: '08:00',
    lunch: '12:30',
    dinner: '18:30',
  },
};

// ── Time utilities ──────────────────────────────────────────────────
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function formatTime12h(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
}

function minutesDiff(a: string, b: string): number {
  return Math.abs(timeToMinutes(a) - timeToMinutes(b));
}

// ── Main scheduler function ─────────────────────────────────────────
export function generateSchedule(input: SchedulerInput): SchedulerOutput {
  const routine = input.routine ?? DEFAULT_ROUTINE;
  const warnings: SchedulerWarning[] = [];

  // 1. Resolve supplement slugs to IDs and load schedule rules
  const slots: SupplementSlot[] = [];
  const resolvedIds: Map<string, { id: string; name: string; slug: string }> = new Map();

  for (const slugOrQuery of input.supplements) {
    const match = findSupplementByQuery(slugOrQuery);
    if (!match) {
      warnings.push({
        type: 'conflict',
        severity: 'warning',
        message: `Supplement "${slugOrQuery}" not found in database. Skipped.`,
        supplements: [slugOrQuery],
      });
      continue;
    }

    resolvedIds.set(match.id, match);

    const rule = db
      .select()
      .from(schema.supplementScheduleRules)
      .where(eq(schema.supplementScheduleRules.supplementId, match.id))
      .get();

    if (!rule) {
      // Default rule if none in DB
      slots.push({
        suppId: match.id,
        slug: match.slug,
        name: match.name,
        preferredTime: 'morning',
        withFood: false,
        foodType: null,
        emptyStomach: false,
        fatSoluble: false,
        stimulant: false,
        sedating: false,
        assignedSlot: routine.meals.breakfast,
      });
    } else {
      slots.push({
        suppId: match.id,
        slug: match.slug,
        name: match.name,
        preferredTime: rule.preferredTime,
        withFood: rule.withFood,
        foodType: rule.foodType,
        emptyStomach: rule.emptyStomach,
        fatSoluble: rule.fatSoluble,
        stimulant: rule.stimulant,
        sedating: rule.sedating,
        assignedSlot: '', // will be assigned
      });
    }
  }

  // 2. Assign initial time slots based on preferred_time + food rules
  for (const slot of slots) {
    slot.assignedSlot = assignTimeSlot(slot, routine);
  }

  // 3. Load conflicts between resolved supplements
  const suppIds = [...resolvedIds.keys()];
  const conflicts: ConflictPair[] = [];

  if (suppIds.length > 1) {
    const allConflicts = db.select().from(schema.supplementConflicts).all();
    for (const c of allConflicts) {
      if (suppIds.includes(c.supplementAId) && suppIds.includes(c.supplementBId)) {
        conflicts.push({
          aId: c.supplementAId,
          bId: c.supplementBId,
          conflictType: c.conflictType,
          minSpacingHours: c.minSpacingHours,
          mechanism: c.mechanism,
          severity: c.severity,
        });
      }
    }
  }

  // 4. Check medication interactions
  if (input.medications && input.medications.length > 0) {
    for (const slot of slots) {
      const medInteractions = db
        .select()
        .from(schema.medicineInteractions)
        .where(eq(schema.medicineInteractions.supplementId, slot.suppId))
        .all();

      for (const mi of medInteractions) {
        for (const userMed of input.medications) {
          const medLower = userMed.toLowerCase();
          if (
            mi.medicineName.toLowerCase().includes(medLower) ||
            (mi.medicineClass && mi.medicineClass.toLowerCase().includes(medLower))
          ) {
            const severity = mi.severity === 'contraindicated' || mi.severity === 'high'
              ? 'critical' as const
              : mi.severity === 'moderate'
                ? 'warning' as const
                : 'info' as const;

            warnings.push({
              type: 'medication',
              severity,
              message: `${slot.name} × ${mi.medicineName}: ${mi.mechanism}. ${mi.recommendation}`,
              supplements: [slot.slug],
            });
          }
        }
      }
    }
  }

  // 5. Detect and resolve conflicts
  for (const conflict of conflicts) {
    const slotA = slots.find(s => s.suppId === conflict.aId);
    const slotB = slots.find(s => s.suppId === conflict.bId);
    if (!slotA || !slotB) continue;

    if (conflict.conflictType === 'synergistic') {
      // Synergistic: try to co-locate if not already together
      warnings.push({
        type: 'conflict',
        severity: 'info',
        message: `${slotA.name} + ${slotB.name}: ${conflict.mechanism}`,
        supplements: [slotA.slug, slotB.slug],
      });
      continue;
    }

    if (conflict.conflictType === 'antagonistic' || conflict.conflictType === 'spacing_required') {
      const spacingMins = (conflict.minSpacingHours ?? 2) * 60;
      const currentDiff = minutesDiff(slotA.assignedSlot, slotB.assignedSlot);

      if (currentDiff < spacingMins) {
        // Resolve: move the later supplement to ensure spacing
        const aMin = timeToMinutes(slotA.assignedSlot);
        const bMin = timeToMinutes(slotB.assignedSlot);

        if (aMin <= bMin) {
          // Move B later
          slotB.assignedSlot = minutesToTime(aMin + spacingMins);
        } else {
          // Move A later
          slotA.assignedSlot = minutesToTime(bMin + spacingMins);
        }

        warnings.push({
          type: 'spacing',
          severity: conflict.severity === 'high' ? 'critical' : 'warning',
          message: `${slotA.name} and ${slotB.name} require ${conflict.minSpacingHours ?? 2}h spacing. ${conflict.mechanism}`,
          supplements: [slotA.slug, slotB.slug],
        });
      }
    }
  }

  // 6. Check food conflicts (empty stomach supplements near meal supplements)
  const emptyStomachSlots = slots.filter(s => s.emptyStomach);
  const withFoodSlots = slots.filter(s => s.withFood);

  for (const es of emptyStomachSlots) {
    const closestMeal = findClosestMealTime(es.assignedSlot, routine);
    if (minutesDiff(es.assignedSlot, closestMeal) < 30) {
      // Move empty-stomach supplement 30 min before the meal
      const mealMins = timeToMinutes(closestMeal);
      es.assignedSlot = minutesToTime(Math.max(timeToMinutes(routine.wakeTime), mealMins - 30));
      warnings.push({
        type: 'food',
        severity: 'info',
        message: `${es.name} is best taken on an empty stomach. Scheduled 30 min before nearest meal.`,
        supplements: [es.slug],
      });
    }
  }

  // 7. Sort by time and group into blocks
  slots.sort((a, b) => timeToMinutes(a.assignedSlot) - timeToMinutes(b.assignedSlot));

  const blocks: ScheduleBlock[] = [];
  const grouped = groupByTime(slots);

  for (const [time, group] of grouped) {
    const supplementNames = group.map(s => s.name);
    const hasSedating = group.some(s => s.sedating);
    const hasFatSoluble = group.some(s => s.fatSoluble);
    const hasEmptyStomach = group.some(s => s.emptyStomach);
    const hasWithFood = group.some(s => s.withFood);

    // Build context
    const contextParts: string[] = [];
    if (hasWithFood) contextParts.push('Take with food');
    if (hasFatSoluble) contextParts.push('include healthy fats for optimal absorption');
    if (hasEmptyStomach) contextParts.push('Take on empty stomach');

    const foodTypes = group.filter(s => s.foodType).map(s => s.foodType!);
    if (foodTypes.length > 0) contextParts.push(`(${[...new Set(foodTypes)].join(', ')})`);

    // Build title
    const timeLabel = getTimeLabel(time);

    blocks.push({
      time: formatTime12h(time),
      title: `${timeLabel} — ${supplementNames.join(' + ')}`,
      context: contextParts.length > 0 ? contextParts.join('; ') + '.' : 'Standard dosing.',
      supplements: supplementNames,
      caution: hasSedating ? 'Contains sedating supplement(s) — may cause drowsiness.' : undefined,
      severity: hasSedating ? 'warning' : undefined,
    });
  }

  return {
    blocks,
    warnings,
    generatedAt: new Date().toISOString(),
  };
}

// ── Helper functions ────────────────────────────────────────────────
function assignTimeSlot(slot: SupplementSlot, routine: UserRoutine): string {
  const preferredTimeMap: Record<string, () => string> = {
    morning: () => {
      if (slot.emptyStomach) {
        // 30 min before breakfast
        return minutesToTime(Math.max(timeToMinutes(routine.wakeTime), timeToMinutes(routine.meals.breakfast) - 30));
      }
      return routine.meals.breakfast;
    },
    afternoon: () => routine.meals.lunch,
    evening: () => routine.meals.dinner,
    bedtime: () => {
      // 30 min before sleep
      return minutesToTime(timeToMinutes(routine.sleepTime) - 30);
    },
    any: () => routine.meals.breakfast,
  };

  const fn = preferredTimeMap[slot.preferredTime];
  return fn ? fn() : routine.meals.breakfast;
}

function findClosestMealTime(time: string, routine: UserRoutine): string {
  const meals = [routine.meals.breakfast, routine.meals.lunch, routine.meals.dinner];
  let closest = meals[0];
  let minDist = minutesDiff(time, meals[0]);

  for (const meal of meals.slice(1)) {
    const dist = minutesDiff(time, meal);
    if (dist < minDist) {
      minDist = dist;
      closest = meal;
    }
  }
  return closest;
}

function groupByTime(slots: SupplementSlot[]): Map<string, SupplementSlot[]> {
  const groups = new Map<string, SupplementSlot[]>();
  for (const slot of slots) {
    const time = slot.assignedSlot;
    if (!groups.has(time)) groups.set(time, []);
    groups.get(time)!.push(slot);
  }
  return groups;
}

function getTimeLabel(time24: string): string {
  const mins = timeToMinutes(time24);
  if (mins < 12 * 60) return 'Morning';
  if (mins < 14 * 60) return 'Midday';
  if (mins < 17 * 60) return 'Afternoon';
  if (mins < 20 * 60) return 'Evening';
  return 'Bedtime';
}
