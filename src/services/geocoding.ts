/**
 * Represents a geographical location with latitude and longitude coordinates.
 */
export interface Location {
  /**
   * The latitude of the location.
   */
  lat: number;
  /**
   * The longitude of the location.
   */
  lng: number;
}

/**
 * Asynchronously retrieves geographic coordinates (latitude and longitude) for a given address.
 *
 * @param address The address to geocode.
 * @returns A promise that resolves to a Location object containing latitude and longitude.
 */
export async function geocodeAddress(address: string): Promise<Location> {
  // TODO: Implement this by calling an API.

  return {
    lat: -1.43333,
    lng: 36.68333,
  };
}
