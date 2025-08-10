import { RepeatOption } from "../utils/taskModel";
export const christianPrayers = [
  { title: 'Morning Devotion', time: '06:00', repeat: RepeatOption.Daily },
  { title: 'Midday Prayer', time: '12:00', repeat: RepeatOption.Daily },
  { title: 'Evening Devotion', time: '18:00', repeat: RepeatOption.Daily },
];

export const muslimPrayers = [
  { title: 'Fajr', time: '05:00', repeat: RepeatOption.Daily },
  { title: 'Dhuhr', time: '12:30', repeat: RepeatOption.Daily },
  { title: 'Asr', time: '15:45', repeat: RepeatOption.Daily },
  { title: 'Maghrib', time: '18:15', repeat: RepeatOption.Daily },
  { title: 'Isha', time: '19:45', repeat: RepeatOption.Daily },
];

export const hinduPrayers = [
  { title: 'Sunrise', time: '06:00', repeat: RepeatOption.Daily },
  { title: 'Sunset', time: '18:00', repeat: RepeatOption.Daily },
];