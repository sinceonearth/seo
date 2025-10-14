import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export interface UserInput {
  username: string;
  email: string;
  passwordHash: string;
  name: string;
  country?: string | null;
  alien?: string;
}

export interface FlightInput {
  userId: string;
  airlineName: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  departureLatitude?: number | null;
  departureLongitude?: number | null;
  arrivalLatitude?: number | null;
  arrivalLongitude?: number | null;
  date: string;
  departureTime?: string | null;
  arrivalTime?: string | null;
  aircraftType?: string | null;
  distance?: number;
  duration?: string | null;
  status?: string;
}

export const storage = {
  /* ===============================
     👤 Users
     =============================== */
  async getUserByUsernameOrEmail(identifier: string) {
    const result = await pool.query(
      `SELECT * FROM users WHERE username = $1 OR email = $1`,
      [identifier]
    );
    return result.rows[0];
  },

  async getUser(id: string) {
    const result = await pool.query(
      `SELECT id, username, email, name, country, alien, is_admin AS "isAdmin", created_at AS "createdAt"
       FROM users
       WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async getAllUsers() {
    const result = await pool.query(`SELECT * FROM users ORDER BY id ASC`);
    return result.rows;
  },

  async createUser({ username, email, passwordHash, name, country }: UserInput) {
    // Use a transaction to safely assign next alien
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get max current alien value
      const res = await client.query(`SELECT MAX(alien) AS maxAlien FROM users`);
      const maxAlien = res.rows[0]?.maxalien || "00";
      let nextAlienNumber = parseInt(maxAlien, 10) + 1;

      // Limit to 99
      if (nextAlienNumber > 99) throw new Error("Maximum number of users reached");

      const alienStr = String(nextAlienNumber).padStart(2, "0");

      const insertRes = await client.query(
        `INSERT INTO users (username, email, password_hash, name, country, alien)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [username, email, passwordHash, name, country || null, alienStr]
      );

      await client.query("COMMIT");
      return insertRes.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  /* ===============================
     ✈️ Flights
     =============================== */
  async getUserFlights(userId: string) {
    const result = await pool.query(
      `SELECT *
       FROM flights
       WHERE user_id = $1
       ORDER BY date DESC`,
      [userId]
    );
    return result.rows;
  },

  async createFlight(flight: FlightInput) {
    const result = await pool.query(
      `INSERT INTO flights (
         user_id, airline_name, flight_number, departure, arrival,
         departure_latitude, departure_longitude, arrival_latitude, arrival_longitude,
         date, departure_time, arrival_time, aircraft_type, distance, duration, status
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        flight.userId,
        flight.airlineName,
        flight.flightNumber,
        flight.departure,
        flight.arrival,
        flight.departureLatitude ?? null,
        flight.departureLongitude ?? null,
        flight.arrivalLatitude ?? null,
        flight.arrivalLongitude ?? null,
        flight.date,
        flight.departureTime ?? null,
        flight.arrivalTime ?? null,
        flight.aircraftType ?? null,
        flight.distance ?? 0,
        flight.duration ?? null,
        flight.status ?? "scheduled",
      ]
    );
    return result.rows[0];
  },
};
