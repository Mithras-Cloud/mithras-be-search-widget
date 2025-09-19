import { GroupSpec } from './types';

export const DEFAULT_GROUP: GroupSpec = {
  rooms: 1,
  adults: 2,
  childrenAges: [],
  infants: 0,
};

const GROUP_SEPARATOR = ';';
const CHILD_SEPARATOR = '.';

const safeInt = (value: string, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const safeFloat = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

export const parseGroupsForm = (input?: string): GroupSpec[] => {
  if (!input) return [DEFAULT_GROUP];

  return input
    .split(GROUP_SEPARATOR)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const [roomsRaw, rest] = segment.split(':');
      const [adultsRaw, childrenRaw = '0', infantsRaw = '0'] = (rest ?? '').split(',');
      const childrenAges = childrenRaw
        .split(CHILD_SEPARATOR)
        .map((age) => age.trim())
        .filter(Boolean)
        .map((age) => safeFloat(age))
        .filter((age) => age >= 0);

      return {
        rooms: Math.max(1, safeInt(roomsRaw, 1)),
        adults: Math.max(1, safeInt(adultsRaw, 1)),
        childrenAges,
        infants: Math.max(0, safeInt(infantsRaw, 0)),
      } satisfies GroupSpec;
    });
};

export const formatGroupsForm = (groups: GroupSpec[]): string =>
  groups
    .map((group) => {
      const children = group.childrenAges.length
        ? group.childrenAges.map((age) => age.toString()).join(CHILD_SEPARATOR)
        : '0';
      return `${group.rooms}:${group.adults},${children},${group.infants}`;
    })
    .join(GROUP_SEPARATOR);

export const summarizeGuests = (groups: GroupSpec[]) => {
  const summary = groups.reduce(
    (acc, group) => {
      acc.rooms += group.rooms;
      acc.adults += group.adults;
      acc.children += group.childrenAges.length;
      acc.infants += group.infants;
      return acc;
    },
    { rooms: 0, adults: 0, children: 0, infants: 0 }
  );
  return summary;
};

export const cloneGroups = (groups: GroupSpec[]): GroupSpec[] =>
  groups.map((group) => ({ ...group, childrenAges: [...group.childrenAges] }));
