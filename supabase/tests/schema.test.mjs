import { PGlite } from "@electric-sql/pglite"
import { readdirSync, readFileSync } from "node:fs"

// Aplica las migraciones en PGlite (Postgres en WASM, sin Docker) y verifica reglas y RLS.
// Uso: pnpm test:db

const migrationsDir = new URL("../migrations/", import.meta.url)
const migration = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(new URL(f, migrationsDir), "utf8"))
  .join("\n")

// Stub mínimo de lo que Supabase provee (roles, esquema auth)
const supabaseStub = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid $$;
grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated;
`

const db = new PGlite()
await db.exec(supabaseStub)
await db.exec(migration)
console.log("✓ migración aplicada")

const A = "00000000-0000-0000-0000-00000000000a"
const B = "00000000-0000-0000-0000-00000000000b"
await db.query(
  `insert into auth.users (id, email, raw_user_meta_data) values ($1, 'jack@x.pe', '{"full_name":"Jack"}'), ($2, 'ana@x.pe', '{}')`,
  [A, B],
)

let passed = 0
let failed = 0
const check = (name, cond) => {
  if (cond) passed++
  else failed++
  console.log(`${cond ? "✓" : "✗"} ${name}`)
}

async function as(user, fn) {
  await db.exec(`set role authenticated; select set_config('request.jwt.claims', '{"sub":"${user}"}', false);`)
  try {
    return await fn()
  } finally {
    await db.exec(`reset role;`)
  }
}
async function fails(fn) {
  try {
    await fn()
    return false
  } catch (e) {
    return e.message
  }
}

// ── Registro ──
const prof = await as(A, () => db.query(`select display_name, default_space_id from profiles where id = $1`, [A]))
check("perfil creado con nombre", prof.rows[0]?.display_name === "Jack")
const spaceA = prof.rows[0].default_space_id
check("espacio personal por defecto", !!spaceA)
const catsA = await as(A, () => db.query(`select id, name, kind from categories`))
check("16 categorías por defecto", catsA.rows.length === 16)
const spaceB = (await as(B, () => db.query(`select default_space_id from profiles where id=$1`, [B]))).rows[0]
  .default_space_id
check(
  "nombre de Ana cae al email",
  (await as(B, () => db.query(`select display_name from profiles where id=$1`, [B]))).rows[0].display_name === "ana",
)

// ── Cuentas (caso Jack) ──
const acc = await as(A, () =>
  db.query(
    `insert into accounts (space_id, name, type, currency, institution, opening_balance_cents, credit_limit_cents, statement_day, due_day)
     values ($1,'BCP','bank','PEN','BCP',200000,null,null,null),
            ($1,'Efectivo','cash','PEN',null,20000,null,null,null),
            ($1,'Visa BCP','credit_card','PEN','BCP',-30000,500000,20,15),
            ($1,'Dólares','cash','USD',null,10000,null,null,null)
     returning id, name`,
    [spaceA],
  ),
)
const id = Object.fromEntries(acc.rows.map((r) => [r.name, r.id]))
check("cuentas creadas", acc.rows.length === 4)
check(
  "no se puede poner límite de crédito a efectivo",
  !!(await fails(() =>
    as(A, () =>
      db.query(`insert into accounts (space_id,name,type,credit_limit_cents) values ($1,'x','cash',100)`, [spaceA]),
    ),
  )),
)

const cat = (name, kind = "expense") => catsA.rows.find((c) => c.name === name && c.kind === kind).id

// ── Movimientos ──
await as(A, () =>
  db.query(
    `insert into transactions (space_id, type, account_id, amount_cents, currency, category_id, payment_method, description)
     values ($1,'expense',$2,1500,'USD',$3,'yape','Menú'),        -- currency se corrige a PEN
            ($1,'expense',$4,18790,'PEN',$5,null,'Plaza Vea'),
            ($1,'income',$2,60000,'PEN',$6,null,'Freelance')`,
    [spaceA, id["BCP"], cat("Comida"), id["Visa BCP"], cat("Supermercado"), cat("Freelance", "income")],
  ),
)
// Pago de tarjeta (misma moneda: to_amount se completa solo)
await as(A, () =>
  db.query(
    `insert into transactions (space_id,type,account_id,to_account_id,amount_cents,currency) values ($1,'transfer',$2,$3,50000,'PEN')`,
    [spaceA, id["BCP"], id["Visa BCP"]],
  ),
)
// Cambio de dólares: 50 USD → 187.50 PEN
await as(A, () =>
  db.query(
    `insert into transactions (space_id,type,account_id,to_account_id,amount_cents,to_amount_cents,exchange_rate,currency) values ($1,'transfer',$2,$3,5000,18750,3.75,'USD')`,
    [spaceA, id["Dólares"], id["Efectivo"]],
  ),
)

const cur = await as(A, () => db.query(`select currency from transactions where description='Menú'`))
check("moneda del movimiento se toma de la cuenta", cur.rows[0].currency === "PEN")

const bal = Object.fromEntries(
  (
    await as(A, () =>
      db.query(`select a.name, b.balance_cents from account_balances b join accounts a on a.id=b.account_id`),
    )
  ).rows.map((r) => [r.name, Number(r.balance_cents)]),
)
console.log("  saldos:", bal)
check("saldo BCP = 2000 − 15 + 600 − 500 = 2085.00", bal["BCP"] === 208500)
check("saldo Visa = −300 − 187.90 + 500 = 12.10", bal["Visa BCP"] === 1210)
check("saldo Efectivo = 200 + 187.50", bal["Efectivo"] === 38750)
check("saldo Dólares = 100 − 50", bal["Dólares"] === 5000)

check(
  "gasto sin categoría rechazado",
  !!(await fails(() =>
    as(A, () =>
      db.query(
        `insert into transactions (space_id,type,account_id,amount_cents,currency) values ($1,'expense',$2,100,'PEN')`,
        [spaceA, id["BCP"]],
      ),
    ),
  )),
)
check(
  "categoría de ingreso en un gasto rechazada",
  !!(await fails(() =>
    as(A, () =>
      db.query(
        `insert into transactions (space_id,type,account_id,amount_cents,currency,category_id) values ($1,'expense',$2,100,'PEN',$3)`,
        [spaceA, id["BCP"], cat("Sueldo", "income")],
      ),
    ),
  )),
)
check(
  "transferencia entre monedas sin monto recibido rechazada",
  !!(await fails(() =>
    as(A, () =>
      db.query(
        `insert into transactions (space_id,type,account_id,to_account_id,amount_cents,currency) values ($1,'transfer',$2,$3,100,'USD')`,
        [spaceA, id["Dólares"], id["BCP"]],
      ),
    ),
  )),
)
check(
  "monto negativo rechazado",
  !!(await fails(() =>
    as(A, () =>
      db.query(
        `insert into transactions (space_id,type,account_id,amount_cents,currency,category_id) values ($1,'expense',$2,-100,'PEN',$3)`,
        [spaceA, id["BCP"], cat("Comida")],
      ),
    ),
  )),
)

// ── Aislamiento entre usuarios ──
const seenByB = await as(B, () => db.query(`select count(*)::int n from transactions`))
check("Ana no ve movimientos de Jack", seenByB.rows[0].n === 0)
check(
  "Ana no ve cuentas de Jack",
  (await as(B, () => db.query(`select count(*)::int n from accounts`))).rows[0].n === 0,
)
check(
  "Ana no ve saldos de Jack",
  (await as(B, () => db.query(`select count(*)::int n from account_balances`))).rows[0].n === 0,
)
check(
  "Ana no ve el perfil de Jack",
  (await as(B, () => db.query(`select count(*)::int n from profiles`))).rows[0].n === 1,
)
check(
  "Ana no puede insertar en el espacio de Jack",
  !!(await fails(() =>
    as(B, () =>
      db.query(
        `insert into transactions (space_id,type,account_id,amount_cents,currency,category_id) values ($1,'expense',$2,100,'PEN',$3)`,
        [spaceA, id["BCP"], cat("Comida")],
      ),
    ),
  )),
)
check(
  "Ana no puede usar una cuenta de Jack desde su espacio",
  !!(await fails(() =>
    as(B, () =>
      db.query(
        `insert into transactions (space_id,type,account_id,amount_cents,currency) values ($1,'adjustment',$2,100,'PEN')`,
        [spaceB, id["BCP"]],
      ),
    ),
  )),
)
check(
  "Ana no puede auto-agregarse al espacio de Jack",
  !!(await fails(() =>
    as(B, () => db.query(`insert into space_members (space_id,user_id,role) values ($1,$2,'owner')`, [spaceA, B])),
  )),
)
check(
  "no se puede crear un segundo espacio personal",
  !!(await fails(() =>
    as(A, () => db.query(`insert into spaces (name,kind,created_by) values ('x','personal',$1)`, [A])),
  )),
)
const upd = await as(B, () => db.query(`update transactions set amount_cents = 1 returning id`))
check("Ana no puede editar movimientos de Jack", upd.rows.length === 0)

// ── Espacio compartido ──
const shared = await as(A, () =>
  db.query(`insert into spaces (name, kind, created_by) values ('Casa','shared',$1) returning id`, [A]),
)
const spaceCasa = shared.rows[0].id
check("espacio compartido creado (insert ... returning)", !!spaceCasa)
// Simula invitación aceptada (en fase 2 será una función accept_invitation)
await db.query(`insert into space_members (space_id,user_id,role) values ($1,$2,'editor')`, [spaceCasa, B])
const casaCats = await as(B, () => db.query(`select count(*)::int n from categories where space_id=$1`, [spaceCasa]))
check("Ana ve las categorías de Casa", casaCats.rows[0].n === 16)
check(
  "Ana sigue sin ver el espacio Personal de Jack",
  (await as(B, () => db.query(`select count(*)::int n from spaces`))).rows[0].n === 2,
)
check(
  "Ana ve el perfil de Jack (comparten Casa)",
  (await as(B, () => db.query(`select count(*)::int n from profiles`))).rows[0].n === 2,
)
const casaAcc = await as(B, () =>
  db.query(`insert into accounts (space_id,name,type) values ($1,'Caja común','cash') returning id`, [spaceCasa]),
)
const casaFood = (
  await as(B, () => db.query(`select id from categories where space_id=$1 and name='Comida'`, [spaceCasa]))
).rows[0].id
await as(B, () =>
  db.query(
    `insert into transactions (space_id,type,account_id,amount_cents,currency,category_id) values ($1,'expense',$2,4000,'PEN',$3)`,
    [spaceCasa, casaAcc.rows[0].id, casaFood],
  ),
)
const who = await as(A, () => db.query(`select created_by from transactions where space_id=$1`, [spaceCasa]))
check("Jack ve el gasto de Ana en Casa con autor", who.rows[0]?.created_by === B)
check(
  "Ana (editor) no puede borrar Casa",
  (await as(B, () => db.query(`delete from spaces where id=$1 returning id`, [spaceCasa]))).rows.length === 0,
)
check(
  "Ana no puede ascenderse a owner",
  (
    await as(B, () =>
      db.query(`update space_members set role='owner' where space_id=$1 and user_id=$2 returning 1`, [spaceCasa, B]),
    )
  ).rows.length === 0,
)
check(
  "Jack (owner) no puede cambiar su propio rol",
  (
    await as(A, () =>
      db.query(`update space_members set role='viewer' where space_id=$1 and user_id=$2 returning 1`, [spaceCasa, A]),
    )
  ).rows.length === 0,
)
check(
  "Jack puede hacer viewer a Ana",
  (
    await as(A, () =>
      db.query(`update space_members set role='viewer' where space_id=$1 and user_id=$2 returning 1`, [spaceCasa, B]),
    )
  ).rows.length === 1,
)
check(
  "Jack no puede hacer owner a Ana",
  !!(await fails(() =>
    as(A, () => db.query(`update space_members set role='owner' where space_id=$1 and user_id=$2`, [spaceCasa, B])),
  )),
)
check(
  "Ana puede salir de Casa",
  (
    await as(B, () =>
      db.query(`delete from space_members where space_id=$1 and user_id=$2 returning 1`, [spaceCasa, B]),
    )
  ).rows.length === 1,
)

console.log(`\n${passed} ok, ${failed} fallidas`)
process.exit(failed ? 1 : 0)
