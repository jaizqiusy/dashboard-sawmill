function getWeeksInMonth(year, month) {
  const weeks = new Set();
  const d = new Date(year, month - 1, 1);
  while (d.getMonth() === month - 1) {
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const week = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    weeks.add(week);
    d.setDate(d.getDate() + 1);
  }
  return Array.from(weeks);
}
console.log("Aug: ", getWeeksInMonth(2026, 8));
console.log("Sep: ", getWeeksInMonth(2026, 9));
console.log("Oct: ", getWeeksInMonth(2026, 10));
