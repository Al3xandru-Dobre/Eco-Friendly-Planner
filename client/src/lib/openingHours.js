const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Human-readable opening hours, e.g. "Daily 09:00–22:00 · Mon, Tue 12:00–15:00". */
export function openingSummary(restaurant) {
  return restaurant.openingHours.map((p) => {
    const days = p.days.length === 7 ? 'Daily' : p.days.map((d) => DAY_NAMES[d]).join(', ');
    return `${days} ${p.open}–${p.close}`;
  }).join(' · ');
}
