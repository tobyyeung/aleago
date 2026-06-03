# Currency setup (Supabase)

Run the migration in `supabase/migrations/20250602120000_profiles.sql` in the Supabase SQL editor (or via CLI).

Add to `.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## `profiles` table

| Column         | Description                          |
|----------------|--------------------------------------|
| `cash`         | Spendable balance (arcade, forge)    |
| `total_earned` | Lifetime cash gained (leaderboards)   |

New users start at **$0**. Balance changes must go through server actions in `src/app/currency-actions.ts` (`adjustCash`), not from the browser client.

## RLS

- Authenticated users can **read** their own row.
- **Insert/update** uses the service role only.
