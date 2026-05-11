import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = readline.createInterface({ input, output });

try {
  const username = (await rl.question("Usuario [postgres]: ")).trim() || "postgres";
  const password = await rl.question("Password: ");
  const host = (await rl.question("Host [localhost]: ")).trim() || "localhost";
  const port = (await rl.question("Puerto [5432]: ")).trim() || "5432";
  const database = (await rl.question("Base de datos [TurnoHotel]: ")).trim() || "TurnoHotel";

  const encodedUser = encodeURIComponent(username);
  const encodedPassword = encodeURIComponent(password);

  console.log("");
  console.log("Copia esta linea en .env:");
  console.log(
    `DATABASE_URL="postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${database}?schema=public"`
  );
} finally {
  rl.close();
}
