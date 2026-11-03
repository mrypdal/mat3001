/**
 * Splittider fra offisielle biomekaniske rapporter (World Athletics / DLV, Berlin 2009 og London 2017).
 * Alle tider er kumulative, målt fra startskuddet (inkluderer reaksjonstiden RT).
 */

export interface RaceAthlete {
  name: string;
  rt: number; // s, reaksjonstid
  gun: number[]; // s fra startskudd ved hver distanse i settet
}

export interface RaceSet {
  id: string;
  label: string;
  source: string;
  distances: number[];
  athletes: RaceAthlete[];
}

const D10 = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export const RACE_SETS: Record<string, RaceSet> = {
  w100_2009: {
    id: "w100_2009",
    label: "Kvinner 100 m, VM Berlin 2009 (finale)",
    source: "Kilde: Graubner & Nixdorf, DLV/IAAF Biomechanics Report WC Berlin 2009",
    distances: [20, 40, 60, 80, 100],
    athletes: [
      { name: "Fraser", rt: 0.146, gun: [3.03, 4.98, 6.88, 8.77, 10.73] },
      { name: "Stewart", rt: 0.17, gun: [3.11, 5.07, 6.96, 8.82, 10.75] },
      { name: "Jeter", rt: 0.16, gun: [3.13, 5.09, 7.01, 8.91, 10.9] },
      { name: "Campbell-Brown", rt: 0.135, gun: [3.12, 5.12, 7.06, 8.97, 10.95] },
      { name: "Williams", rt: 0.158, gun: [3.14, 5.13, 7.08, 9.0, 11.01] },
      { name: "Ferguson-McKenzie", rt: 0.13, gun: [3.15, 5.16, 7.12, 9.06, 11.05] },
      { name: "Sturrup", rt: 0.137, gun: [3.11, 5.11, 7.07, 9.02, 11.05] },
      { name: "Bailey", rt: 0.173, gun: [3.24, 5.27, 7.23, 9.18, 11.16] },
    ],
  },
  m100_2017: {
    id: "m100_2017",
    label: "Menn 100 m, VM London 2017 (finale)",
    source: "Kilde: World Athletics Biomechanical Report, London 2017",
    distances: D10,
    athletes: [
      { name: "Gatlin", rt: 0.138, gun: [1.88, 2.9, 3.81, 4.71, 5.59, 6.45, 7.31, 8.18, 9.05, 9.92] },
      { name: "Coleman", rt: 0.123, gun: [1.87, 2.87, 3.77, 4.65, 5.52, 6.38, 7.26, 8.14, 9.02, 9.94] },
      { name: "Bolt (London)", rt: 0.183, gun: [1.96, 2.98, 3.88, 4.76, 5.64, 6.49, 7.34, 8.2, 9.06, 9.95] },
      { name: "Blake", rt: 0.137, gun: [1.89, 2.92, 3.83, 4.73, 5.62, 6.5, 7.37, 8.25, 9.12, 9.99] },
      { name: "Simbine", rt: 0.141, gun: [1.92, 2.95, 3.87, 4.79, 5.66, 6.5, 7.36, 8.23, 9.11, 10.01] },
      { name: "Vicaut", rt: 0.152, gun: [1.95, 2.98, 3.88, 4.77, 5.64, 6.51, 7.39, 8.28, 9.18, 10.08] },
      { name: "Prescod", rt: 0.145, gun: [2.04, 3.09, 4.01, 4.93, 5.82, 6.68, 7.54, 8.41, 9.29, 10.17] },
      { name: "Su", rt: 0.224, gun: [2.03, 3.06, 3.98, 4.89, 5.78, 6.67, 7.56, 8.45, 9.35, 10.27] },
    ],
  },
  m100_2009: {
    id: "m100_2009",
    label: "Menn 100 m, VM Berlin 2009 (finale)",
    source: "Kilde: Graubner & Nixdorf, DLV/IAAF Biomechanics Report WC Berlin 2009",
    distances: [20, 30, 40, 60, 80, 100],
    athletes: [
      { name: "Bolt", rt: 0.146, gun: [2.88, 3.78, 4.64, 6.31, 7.92, 9.58] },
      { name: "Gay", rt: 0.144, gun: [2.92, 3.83, 4.7, 6.39, 8.02, 9.71] },
      { name: "Powell", rt: 0.134, gun: [2.91, 3.83, 4.71, 6.42, 8.1, 9.84] },
      { name: "Bailey", rt: 0.129, gun: [2.92, 3.85, 4.73, 6.48, 8.18, 9.93] },
      { name: "Thompson", rt: 0.119, gun: [2.9, 3.83, 4.71, 6.45, 8.17, 9.93] },
      { name: "Chambers", rt: 0.123, gun: [2.93, 3.86, 4.75, 6.5, 8.22, 10.0] },
      { name: "Burns", rt: 0.165, gun: [2.94, 3.87, 4.76, 6.52, 8.24, 10.0] },
      { name: "Patton", rt: 0.149, gun: [2.96, 3.93, 4.85, 6.65, 8.42, 10.34] },
    ],
  },
  m200_2009: {
    id: "m200_2009",
    label: "Menn 200 m, VM Berlin 2009 (finale)",
    source: "Kilde: Graubner & Nixdorf, DLV/IAAF Biomechanics Report WC Berlin 2009",
    distances: [50, 100, 150, 200],
    athletes: [
      { name: "Bolt", rt: 0.133, gun: [5.6, 9.92, 14.44, 19.19] },
      { name: "Edward", rt: 0.179, gun: [5.88, 10.37, 15.0, 19.81] },
      { name: "Spearmon", rt: 0.152, gun: [5.89, 10.42, 15.06, 19.85] },
      { name: "Crawford", rt: 0.148, gun: [5.73, 10.15, 14.8, 19.89] },
      { name: "Mullings", rt: 0.146, gun: [5.7, 10.2, 14.93, 19.98] },
      { name: "Clark", rt: 0.158, gun: [5.8, 10.38, 15.16, 20.39] },
      { name: "Guliyev", rt: 0.165, gun: [6.04, 10.77, 15.62, 20.61] },
      { name: "Alerte", rt: 0.161, gun: [5.96, 10.65, 15.59, 20.68] },
    ],
  },
  w200_2009: {
    id: "w200_2009",
    label: "Kvinner 200 m, VM Berlin 2009 (finale)",
    source: "Kilde: Graubner & Nixdorf, DLV/IAAF Biomechanics Report WC Berlin 2009",
    distances: [50, 100, 150, 200],
    athletes: [
      { name: "Felix", rt: 0.173, gun: [6.25, 11.16, 16.37, 22.02] },
      { name: "Campbell-Brown", rt: 0.184, gun: [6.19, 11.14, 16.49, 22.35] },
      { name: "Ferguson-McKenzie", rt: 0.171, gun: [6.27, 11.29, 16.65, 22.41] },
      { name: "Lee", rt: 0.174, gun: [6.29, 11.25, 16.61, 22.48] },
      { name: "McLaughlin", rt: 0.178, gun: [6.37, 11.43, 16.76, 22.62] },
      { name: "Facey", rt: 0.163, gun: [6.27, 11.39, 16.8, 22.8] },
      { name: "Freeman", rt: 0.141, gun: [6.33, 11.47, 16.96, 22.98] },
      { name: "Artymata", rt: 0.176, gun: [6.51, 11.7, 17.17, 23.01] },
    ],
  },
};

export interface RaceRow {
  distances: number[];
  rt: number;
  gun: number[];
  source: string;
}

export function raceRow(setId: string, athlete: string): RaceRow {
  const set = RACE_SETS[setId];
  const a = set.athletes.find((x) => x.name === athlete);
  if (!a) throw new Error(`Ukjent løper ${athlete} i ${setId}`);
  return { distances: set.distances, rt: a.rt, gun: a.gun, source: set.source };
}
