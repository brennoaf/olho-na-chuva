import I0 from '@lucide/svelte/icons/map-pin';
import I1 from '@lucide/svelte/icons/chevron-left';
import I2 from '@lucide/svelte/icons/chevron-right';
import I3 from '@lucide/svelte/icons/phone';
import I4 from '@lucide/svelte/icons/navigation';
import I5 from '@lucide/svelte/icons/info';
import I6 from '@lucide/svelte/icons/triangle-alert';
import I7 from '@lucide/svelte/icons/check';
import I8 from '@lucide/svelte/icons/x';
import I9 from '@lucide/svelte/icons/wifi-off';
import I10 from '@lucide/svelte/icons/refresh-cw';
import I11 from '@lucide/svelte/icons/volume-2';
import I13 from '@lucide/svelte/icons/house';
import I14 from '@lucide/svelte/icons/locate-fixed';
import I15 from '@lucide/svelte/icons/message-square';
import I16 from '@lucide/svelte/icons/clock';
import I17 from '@lucide/svelte/icons/cloud-rain';
import I18 from '@lucide/svelte/icons/waves';
import I19 from '@lucide/svelte/icons/mountain';
import I20 from '@lucide/svelte/icons/shield-check';
import I21 from '@lucide/svelte/icons/notebook-pen';
import I22 from '@lucide/svelte/icons/users';
import I23 from '@lucide/svelte/icons/calendar-days';
import I24 from '@lucide/svelte/icons/flag';
import I25 from '@lucide/svelte/icons/square';
import I26 from '@lucide/svelte/icons/chart-no-axes-combined';
import I27 from '@lucide/svelte/icons/zap';
import I28 from '@lucide/svelte/icons/briefcase-medical';
import I29 from '@lucide/svelte/icons/file-text';
import I30 from '@lucide/svelte/icons/arrow-up-right';
import Weather from '@lucide/svelte/icons/cloud-sun';
import Backpack from '@lucide/svelte/icons/backpack';
import Undo from '@lucide/svelte/icons/rotate-ccw';
import Search from '@lucide/svelte/icons/search';

export const icons = {
 pin: I0,
 back: I1,
 next: I2,
 phone: I3,
 route: I4,
 info: I5,
 alert: I6,
 check: I7,
 close: I8,
 offline: I9,
 refresh: I10,
 volume: I11,
 weather: Weather,
 backpack: Backpack,
 home: I13,
 gps: I14,
 sms: I15,
 clock: I16,
 rain: I17,
 wave: I18,
 hill: I19,
 shield: I20,
 note: I21,
 people: I22,
 calendar: I23,
 flag: I24,
 stop: I25,
 chart: I26,
 flash: I27,
 bottle: I28,
 file: I29,
 arrow: I30,
 undo: Undo,
 search: Search
} as const;
export type IconName = keyof typeof icons | 'whatsapp';
