function getDatesForISOWeek(year, week) {
  const d = new Date(year, 0, 4);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1 + (week - 1) * 7);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
    dates.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`);
  }
  return dates;
}
console.log("Week 38: ", getDatesForISOWeek(2026, 38));
console.log("Week 39: ", getDatesForISOWeek(2026, 39));
console.log("Week 40: ", getDatesForISOWeek(2026, 40));
