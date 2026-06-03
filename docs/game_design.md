# ALEAGO: Master Game Concept

* **Platform:** Browser-based Web Game (Free-to-Play)
* **Authentication:** Google OAuth 2.0
* **Genre:** Incremental / RNG Scavenger / Casino-Arcade / RPG Crafting

---

## The Core Concept

Aleago bridges the addictive mechanics of Roblox-style RNG games with high-stakes arcade gambling and deep, Genshin-style RPG progression. Players start with nothing, endlessly rolling for 1/X rarity ingredients. They sell low-tier trash to fund high-stakes arcade games, multiplying their cash. That cash and those rare ingredients are combined in the Forge to craft, upgrade, and perfect gear that boosts their luck, speed, and casino payouts.

### The Circular Core Loop

* **Scavenge (The RNG):** Roll for raw materials and blueprints.
* **Gamble (The Arcade):** Bet baseline cash in high-risk games to multiply wealth and find game-exclusive items.
* **Forge (The Time Sink):** Wait real-time to craft gear, or spend casino winnings to finish instantly.
* **Perfect (The Grind):** Level up gear for random substats. If the substats are bad, Reset the item using original crafting materials, ensuring low-tier "trash" rolls stay valuable forever.

---

## 1. The Scavenging System (RNG Engine)

The heartbeat of Aleago. The server randomly generates items based on a 1/X denominator chance.

* **Manual Rolling:** The player actively clicks to roll. Base speed is 1 roll per second.
* **Auto-Roll:** Players can toggle Auto-Roll on. It runs automatically as long as the Aleago browser tab is active.
* **The Auto-Roll Tax:** Auto-rolling applies a permanent -10% penalty to total Luck to reward active play.

**Substitute Rarity Tiers (For the Skeleton Build):**

* **1 / 2** — Alpha Scrap (Common)
* **1 / 20** — Gamma Dust (Uncommon)
* **1 / 100** — Delta Crystal (Rare)
* **1 / 2,500** — Omega Core (Mythic)

---

## 2️. The Arcade (Minigames & Wealth)

Players take their base cash (earned by bulk-selling Alpha/Beta scraps) into the Games tab to get rich.

* **Mines:** A grid where you uncover multipliers while avoiding hidden bombs. Cashing out early guarantees profit.
* **Plinko:** Drop balls through physics-based neon pegs into multiplier buckets.
* **Tower:** Ascend floors by choosing 1 of 3 doors. Two doors increase your multiplier exponentially; one door loses everything.
* **Dice:** Fast-paced over/under probability wagering.

**Key Arcade Mechanics:**

* **"The Power Trip":** Minigames are affected by your crafted clothing. If a player wins $100 in Mines, and their Body armor gives a 1.5x multiplier, a vibrant animation shows their gear pulsing as the final payout surges to $150.
* **Exclusive Drops:** Minigames have a small chance to drop exclusive crafting materials (e.g., Plinko Balls, Tower Crystals) that cannot be found via the RNG Roller.

---

## 3️. The Forge & Loadout (RPG Progression)

This is where players spend their materials and cash. Players have 5 Equipment Slots: Head, Body, Legs, Feet, and Relic.

### Crafting & Mastery

* **Blueprints:** You must discover a recipe (via RNG or Arcade drops) before you can craft it.
* **Real-Time Crafting:** Crafting takes time (from 5 minutes to 24 hours). Players can spend Cash to instantly finish the craft.
* **Recipe Mastery:** Crafting the same item multiple times gives Mastery XP. Reaching Max Rank permanently reduces that item's crafting time and raises the minimum potential value of its substats.

### Upgrading & Substats (The "Forever Grind")

* **Main Stats:** Fixed by the item (e.g., "Starter Head" always gives +10% Luck).
* **Substats:** Ranged and random. As players pay Cash to level up an item (Level 1 to 10), it unlocks and upgrades up to 4 substats (e.g., rolling anywhere from +1.0% to +5.0% Speed).
* **The Reset:** If a Level 10 item has weak substats, players can pay the original crafting materials + a Cash fee to wipe it back to Level 0 and try again.

### Relics & Sets

* **Relics:** The 5th slot. These do not provide standard stats; they provide game-breaking rules (e.g., The Magnetized Compass permanently removes the Auto-Roll penalty).
* **Set Bonuses:** Wearing 2 or 4 pieces of the same clothing "family" unlocks hidden passive abilities (e.g., +10% chance to save your bet on a loss).

---

## 4️. Alchemy (Potions)

The Alchemist's Bench allows players to brew consumables using low-tier ingredients. Potions provide temporary, powerful windows of efficiency.

* **Luck Potions:** Additive luck boosts for short intervals.
* **Haste Brews:** Reduces roll speed (capped at 0.1s per roll).
* **Mastery Oil:** Doubles Mastery XP gained when collecting finished crafts.
* **Void Infusion:** Completely negates the Auto-Roll penalty for idle grinding.

---

## 5️. Social & Economy

* **The Safe Trade:** Players can trade Blueprints, Materials, and Gear. To prevent veterans from boosting new accounts, a "Value-Matching" algorithm ensures trades are mathematically fair (within ~15% value of each other based on rarity).
* **Dual Leaderboards:** Located on the right overlay. Players can filter by Global or Friends (synced via Google contacts). The boards track two metrics: Total Money Earned (For Arcade Grinders) and Rarest Item Found (For RNG Hunters).

---

## 6️. UI / UX Aesthetic

**"Sleek Industrial Dark" meets "Vibrant Neon Arcade."**

* **The Main Dashboard:** Deep charcoal (`#0D0D0D`) and matte steel. A central 3D pedestal displays your rolls.
* **The Navigation (Left):** Sidebar with icons for Home, Games, Forge, Inventory, and Trade. The Forge icon has an active circular progress ring that pulses when a craft is finished.
* **The Live Overlay (Right):** Contains the Leaderboard and "Quick Stats" (a visual representation of your 5 gear slots and your total live multipliers).
* **The Arcade Tab:** When entering Games, the dark UI bursts into high-energy Neon Pinks, Cyans, and Lime Greens.
* **The Mini-Roller (Multitasking HUD):** When the player is in the Arcade or Forge, a 40% transparent icon sits at the bottom-center of the screen, showing the items their Auto-Roll is currently picking up in the background.

---

## 7️. Technical Infrastructure

* **Hosting / Frontend:** Vercel (React/Next.js). Handles the sleek UI, animations, and real-time state management.
* **Backend / Database:** Supabase (PostgreSQL).
* **Authentication:** Google OAuth. Instantly creates user profiles, preventing multi-accounting and enabling secure friend lists.
* **The Anti-Cheat:** All RNG rolls, gambling math, and timer logic happen via Server-Side Edge Functions. If a player modifies their browser code to win $1,000,000, the server rejects it.
* **Database Tables:** `profiles`, `inventory`, `blueprints`, `forge_queue`, and `active_buffs`.