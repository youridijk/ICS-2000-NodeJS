export default interface DeviceConfig {
  readonly disabled?: true; // for sensors
  readonly modelName: string;
  readonly onOffFunction?: number;
  readonly dimFunction?: number;
  readonly colorTemperatureFunction?: number;
  readonly colorFunction?: number; // Packed CIE xy coordinates

  readonly maxBrightness?: number;
  readonly maxColorTemperature?: number;
}
