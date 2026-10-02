export const TRANSPORT_OPTIONS = [
  { value: 'TRAIN', label: 'Train', hint: 'Lowest footprint for most distances' },
  { value: 'BUS', label: 'Coach / bus', hint: 'Very efficient per passenger' },
  { value: 'BICYCLE', label: 'Bicycle', hint: 'Zero emissions' },
  { value: 'WALK', label: 'On foot', hint: 'Zero emissions' },
  { value: 'CAR_ELECTRIC', label: 'Electric car', hint: 'Depends on the grid mix' },
  { value: 'CAR_HYBRID', label: 'Hybrid car', hint: 'Shared between travellers' },
  { value: 'CAR_GASOLINE', label: 'Petrol car', hint: 'Shared between travellers' },
  { value: 'BOAT', label: 'Ferry / boat', hint: 'Varies widely' },
  { value: 'PLANE', label: 'Plane', hint: 'Highest footprint; avoid if you can' },
];

export const ACCOMMODATION_OPTIONS = ['Eco-certified hotel', 'Guesthouse', 'Hostel', 'Camping', 'Friends & family', 'Other'];

export const transportLabel = (value) => TRANSPORT_OPTIONS.find((t) => t.value === value)?.label || value || 'Not set';
