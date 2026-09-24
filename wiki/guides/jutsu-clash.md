# Jutsu Clash explained

Every enemy jutsu comes with a visible wind-up, and your Ultimates can meet it head-on.

## Wind-ups

- Regular enemies build chakra and cast their jutsu after a {{num:enemyScaling.enemyJutsu.windup}}-second wind-up.
- Boss specials wind up for {{num:bossMechanics.telegraphAoE.windup}} seconds, and many of them hit your whole team.
- A **⚠ bar** above the caster shows the jutsu's name in its nature's colour, and rings on the ground mark who it will hit.

## Clashing

Fire **any** Ultimate while a wind-up is active and it meets the jutsu that will land first. Your ninja's best nature against the jutsu's nature decides the result:

| Result | When | What happens |
|---|---|---|
| **▲ Overpower** | your nature beats theirs | Their jutsu is cancelled and the caster is stunned for {{num:jutsuClash.overpowerStun}} seconds. Your Ultimate deals {{x:jutsuClash.overpowerUltMult}} damage and {{num:jutsuClash.overpowerChakraRefund}} chakra comes back. |
| **= Standoff** | neutral, or a jutsu with no nature | Both jutsu fizzle, and your Ultimate still deals {{x:jutsuClash.standoffUltMult}} damage. |
| **▼ Overwhelmed** | their nature beats yours | Your Ultimate deals no damage, but their jutsu is still blocked and {{pct:jutsuClash.overwhelmedChakraRefund}} of the chakra comes back. |

While a wind-up is active, every ready portrait shows a badge predicting its result: ▲ OVERPOWER, = STANDOFF or ▼ WEAK.

## Who should clash

- **The counter.** A ninja whose nature beats the jutsu Overpowers it for the biggest payoff.
- **The Tank.** A Tank that clashes always pulls the jutsu onto itself and takes {{pct:jutsuClash.tankGuardDR}} less damage from it. That's a great answer to a special that hits your whole team.
- **Taijutsu specialists** can never be Overwhelmed: their worst result is a Standoff.

## Fire now, or hold?

An Ultimate fired right away keeps your damage flowing. One held for a wind-up can turn a boss's biggest attack into a free stun. A good rule: **hold the ninja whose nature beats the boss's special**, and fire the others when they're ready.

## Auto-ult

The **🤖** button in battle fires Ultimates for you. In its default **clash-aware** mode it fires counter-nature ninja into wind-ups and holds anyone who would be Overwhelmed. You can switch it to **fire when ready** in Settings. Tap 🤖 again at any time to take control back.
