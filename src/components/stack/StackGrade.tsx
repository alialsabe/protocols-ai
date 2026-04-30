interface ConflictRow {
  severity: string;
}

export function StackGrade({ conflicts, total }: { conflicts: ConflictRow[]; total: number }) {
  const high = conflicts.filter(c => c.severity === 'high').length;
  const med  = conflicts.filter(c => c.severity === 'medium').length;

  let grade: string;
  let note: string;
  let color: string;

  if (total === 0) {
    grade = '—';
    color = 'var(--ink-4)';
    note = 'Add supplements to see a grade.';
  } else if (high > 0) {
    grade = 'C';
    color = 'var(--severity-high)';
    note = `${high} high-severity conflict${high > 1 ? 's' : ''} require attention before adding these supplements together.`;
  } else if (med > 1) {
    grade = 'B';
    color = 'var(--severity-mid)';
    note = `${med} moderate interaction${med > 1 ? 's' : ''} detected. Space these supplements 2–4 hours apart.`;
  } else if (med === 1) {
    grade = 'B+';
    color = 'var(--severity-mid)';
    note = 'One moderate interaction. Space the flagged supplements apart when possible.';
  } else {
    grade = 'A';
    color = 'var(--severity-low)';
    note = `Stack of ${total} looks clean. No significant interactions found in clinical literature.`;
  }

  return (
    <div
      style={{
        marginTop: 20,
        padding: '16px 20px',
        borderRadius: 12,
        border: '1px solid var(--rule)',
        background: 'var(--paper-2)',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <span style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-mono)', color, lineHeight: 1 }}>
        {grade}
      </span>
      <div>
        <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 4 }}>
          Stack Grade
        </p>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: '19px' }}>{note}</p>
      </div>
    </div>
  );
}
