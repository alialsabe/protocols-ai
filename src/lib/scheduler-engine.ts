import {
  getScheduleRuleBySupplementId,
  listConflicts,
  listMedicineInteractionsBySupplementId,
} from './db';
import type {
  ScheduleBlock,
  SchedulerInput,
  SchedulerOutput,
  SchedulerWarning,
  UserRoutine,
} from './protocol-types';
import { findSupplementByQuery } from './supplement-lookup';

type ScheduleRuleRow = {
  preferredTime: string;
  withFood: number | boolean;
  foodType: string | null;
  emptyStomach: number | boolean;
  fatSoluble: number | boolean;
  stimulant: number | boolean;
  sedating: number | boolean;
};

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
  assignedSlot: string;
}

interface ConflictPair {
  aId: string;
  bId: string;
  conflictType: string;
  minSpacingHours: number | null;
  mechanism: string;
  severity: string;
}

const DEFAULT_ROUTINE: UserRoutine = {
  wakeTime: '07:00',
  sleepTime: '23:00',
  meals: {
    breakfast: '08:00',
    lunch: '12:30',
    dinner: '18:30',
  },
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function formatTime12h(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function minutesDiff(a: string, b: string): number {
  return Math.abs(timeToMinutes(a) - timeToMinutes(b));
}

export async function generateSchedule(input: SchedulerInput): Promise<SchedulerOutput> {
  const routine = input.routine ?? DEFAULT_ROUTINE;
  const warnings: SchedulerWarning[] = [];
  const slots: SupplementSlot[] = [];
  const resolvedIds = new Map<string, { id: string; name: string; slug: string }>();

  for (const slugOrQuery of input.supplements) {
    const match = await findSupplementByQuery(slugOrQuery);

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
    const rule = (await getScheduleRuleBySupplementId(match.id)) as ScheduleRuleRow | null;

    if (!rule) {
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
      continue;
    }

    slots.push({
      suppId: match.id,
      slug: match.slug,
      name: match.name,
      preferredTime: rule.preferredTime,
      withFood: Boolean(rule.withFood),
      foodType: rule.foodType,
      emptyStomach: Boolean(rule.emptyStomach),
      fatSoluble: Boolean(rule.fatSoluble),
      stimulant: Boolean(rule.stimulant),
      sedating: Boolean(rule.sedating),
      assignedSlot: '',
    });
  }

  for (const slot of slots) {
    slot.assignedSlot = assignTimeSlot(slot, routine);
  }

  const supplementIds = [...resolvedIds.keys()];
  const conflicts: ConflictPair[] = [];

  if (supplementIds.length > 1) {
    const allConflicts = await listConflicts();
    for (const conflict of allConflicts as Array<{
      supplementAId: string;
      supplementBId: string;
      conflictType: string;
      minSpacingHours: number | null;
      mechanism: string;
      severity: string;
    }>) {
      if (supplementIds.includes(conflict.supplementAId) && supplementIds.includes(conflict.supplementBId)) {
        conflicts.push({
          aId: conflict.supplementAId,
          bId: conflict.supplementBId,
          conflictType: conflict.conflictType,
          minSpacingHours: conflict.minSpacingHours,
          mechanism: conflict.mechanism,
          severity: conflict.severity,
        });
      }
    }
  }

  if (input.medications && input.medications.length > 0) {
    for (const slot of slots) {
      const medicineInteractions = await listMedicineInteractionsBySupplementId(slot.suppId);

      for (const interaction of medicineInteractions as Array<{
        medicineName: string;
        medicineClass: string | null;
        severity: string;
        mechanism: string;
        recommendation: string;
      }>) {
        for (const userMedication of input.medications) {
          const medicationLower = userMedication.toLowerCase();
          if (
            interaction.medicineName.toLowerCase().includes(medicationLower)
            || interaction.medicineClass?.toLowerCase().includes(medicationLower)
          ) {
            const severity = interaction.severity === 'contraindicated' || interaction.severity === 'high'
              ? 'critical'
              : interaction.severity === 'moderate'
                ? 'warning'
                : 'info';

            warnings.push({
              type: 'medication',
              severity,
              message: `${slot.name} × ${interaction.medicineName}: ${interaction.mechanism}. ${interaction.recommendation}`,
              supplements: [slot.slug],
            });
          }
        }
      }
    }
  }

  for (const conflict of conflicts) {
    const slotA = slots.find((slot) => slot.suppId === conflict.aId);
    const slotB = slots.find((slot) => slot.suppId === conflict.bId);

    if (!slotA || !slotB) continue;

    if (conflict.conflictType === 'synergistic') {
      warnings.push({
        type: 'conflict',
        severity: 'info',
        message: `${slotA.name} + ${slotB.name}: ${conflict.mechanism}`,
        supplements: [slotA.slug, slotB.slug],
      });
      continue;
    }

    if (conflict.conflictType === 'antagonistic' || conflict.conflictType === 'spacing_required') {
      const spacingMinutes = (conflict.minSpacingHours ?? 2) * 60;
      const currentDiff = minutesDiff(slotA.assignedSlot, slotB.assignedSlot);

      if (currentDiff < spacingMinutes) {
        const slotAMinutes = timeToMinutes(slotA.assignedSlot);
        const slotBMinutes = timeToMinutes(slotB.assignedSlot);

        if (slotAMinutes <= slotBMinutes) {
          slotB.assignedSlot = minutesToTime(slotAMinutes + spacingMinutes);
        } else {
          slotA.assignedSlot = minutesToTime(slotBMinutes + spacingMinutes);
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

  for (const slot of slots.filter((entry) => entry.emptyStomach)) {
    const closestMeal = findClosestMealTime(slot.assignedSlot, routine);
    if (minutesDiff(slot.assignedSlot, closestMeal) < 30) {
      slot.assignedSlot = minutesToTime(Math.max(timeToMinutes(routine.wakeTime), timeToMinutes(closestMeal) - 30));
      warnings.push({
        type: 'food',
        severity: 'info',
        message: `${slot.name} is best taken on an empty stomach. Scheduled 30 min before nearest meal.`,
        supplements: [slot.slug],
      });
    }
  }

  slots.sort((a, b) => timeToMinutes(a.assignedSlot) - timeToMinutes(b.assignedSlot));
  const groups = groupByTime(slots);
  const blocks: ScheduleBlock[] = [];

  for (const [time, group] of groups) {
    const supplementNames = group.map((slot) => slot.name);
    const hasSedating = group.some((slot) => slot.sedating);
    const hasFatSoluble = group.some((slot) => slot.fatSoluble);
    const hasEmptyStomach = group.some((slot) => slot.emptyStomach);
    const hasWithFood = group.some((slot) => slot.withFood);

    const contextParts: string[] = [];
    if (hasWithFood) contextParts.push('Take with food');
    if (hasFatSoluble) contextParts.push('include healthy fats for optimal absorption');
    if (hasEmptyStomach) contextParts.push('Take on empty stomach');

    const foodTypes = group.filter((slot) => slot.foodType).map((slot) => slot.foodType as string);
    if (foodTypes.length > 0) {
      contextParts.push(`(${[...new Set(foodTypes)].join(', ')})`);
    }

    blocks.push({
      time: formatTime12h(time),
      title: `${getTimeLabel(time)} — ${supplementNames.join(' + ')}`,
      context: contextParts.length > 0 ? `${contextParts.join('; ')}.` : 'Standard dosing.',
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

function assignTimeSlot(slot: SupplementSlot, routine: UserRoutine): string {
  const preferredTimeMap: Record<string, () => string> = {
    morning: () => (slot.emptyStomach
      ? minutesToTime(Math.max(timeToMinutes(routine.wakeTime), timeToMinutes(routine.meals.breakfast) - 30))
      : routine.meals.breakfast),
    afternoon: () => routine.meals.lunch,
    evening: () => routine.meals.dinner,
    bedtime: () => minutesToTime(timeToMinutes(routine.sleepTime) - 30),
    any: () => routine.meals.breakfast,
  };

  return preferredTimeMap[slot.preferredTime]?.() ?? routine.meals.breakfast;
}

function findClosestMealTime(time: string, routine: UserRoutine): string {
  const meals = [routine.meals.breakfast, routine.meals.lunch, routine.meals.dinner];
  let closest = meals[0];
  let minDistance = minutesDiff(time, meals[0]);

  for (const meal of meals.slice(1)) {
    const distance = minutesDiff(time, meal);
    if (distance < minDistance) {
      closest = meal;
      minDistance = distance;
    }
  }

  return closest;
}

function groupByTime(slots: SupplementSlot[]): Map<string, SupplementSlot[]> {
  const groups = new Map<string, SupplementSlot[]>();
  for (const slot of slots) {
    const group = groups.get(slot.assignedSlot) ?? [];
    group.push(slot);
    groups.set(slot.assignedSlot, group);
  }
  return groups;
}

function getTimeLabel(time24: string): string {
  const minutes = timeToMinutes(time24);
  if (minutes < 12 * 60) return 'Morning';
  if (minutes < 14 * 60) return 'Midday';
  if (minutes < 17 * 60) return 'Afternoon';
  if (minutes < 20 * 60) return 'Evening';
  return 'Bedtime';
}
