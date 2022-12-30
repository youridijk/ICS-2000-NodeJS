export type Precision = 'day' | '15minutes' | 'week' | string;

export default interface SmartMeterData {
  date: Date | string | number; // Date object, timestamp string or epoch time number
  powerConsumedLowTariff: number;
  powerConsumed: number;
  powerProducedLowTariff: number;
  powerProduced: number;
  gas: number;
  water: number;
}
