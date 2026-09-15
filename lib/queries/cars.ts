import { pool } from "@/lib/db";

export interface Car {
  id: number;
  name: string | null;
  model: string | null;
  trim_badging: string | null;
  vin: string;
  efficiency: number | null;
}

export async function getCars(): Promise<Car[]> {
  const { rows } = await pool.query<Car>(
    `select id, name, model, trim_badging, vin, efficiency
     from cars
     order by display_priority nulls last, id`
  );
  return rows;
}

export async function getCar(carId: number): Promise<Car | null> {
  const { rows } = await pool.query<Car>(
    `select id, name, model, trim_badging, vin, efficiency
     from cars
     where id = $1`,
    [carId]
  );
  return rows[0] ?? null;
}
