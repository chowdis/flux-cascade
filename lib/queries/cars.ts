import { pool } from "@/lib/db";
import { resolveCarId, type Car } from "@/lib/car";

export type { Car };

export async function getCars(): Promise<Car[]> {
  const { rows } = await pool.query<Car>(
    `select id, name, model, trim_badging, marketing_name, vin, efficiency,
            exterior_color, wheel_type
     from cars
     order by display_priority nulls last, id`
  );
  return rows;
}

export async function getCar(carId: number): Promise<Car | null> {
  const { rows } = await pool.query<Car>(
    `select id, name, model, trim_badging, marketing_name, vin, efficiency,
            exterior_color, wheel_type
     from cars
     where id = $1`,
    [carId]
  );
  return rows[0] ?? null;
}

export type PageSearchParams = Promise<{ car?: string }>;

/**
 * Shared per-page logic: fetch all cars and resolve which one is selected
 * from the `?car=` query param. Every dashboard page calls this instead of
 * hardcoding cars[0].
 */
export async function getSelectedCar(
  searchParams: PageSearchParams
): Promise<{ cars: Car[]; car: Car | null }> {
  const [cars, params] = await Promise.all([getCars(), searchParams]);
  const carId = resolveCarId(cars, params.car);
  const car = cars.find((c) => c.id === carId) ?? null;
  return { cars, car };
}
