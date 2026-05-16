# outriders prototype — godot 4

class & skill data system for an outriders-style looter shooter. six elemental
classes, ten skills per class, three equipped at a time, plus a working
character-creation screen.

> first slice. no gunplay, enemies, loot, or world yet — that hangs off this
> data layer. see "next steps" below.

## the six classes

| class        | element  | role                | base hp / armor | passive            |
|--------------|----------|---------------------|-----------------|--------------------|
| hydromancer  | water    | sustain controller  | 115 / 5         | tidal mend         |
| pyromancer   | fire     | dot / detonation    | 95  / 0         | cinder             |
| stormcaller  | electric | mobile burst        | 90  / 0         | conductive         |
| devastator   | earth    | frontline tank      | 140 / 15        | bulwark            |
| cryomancer   | ice      | cc + shatter        | 100 / 5         | subzero            |
| tempest      | air      | ranged skirmisher   | 95  / 0         | slipstream         |

each class owns a 10-skill kit unlocked across levels 1–20. you can equip
at most three at any time (`Loadout.MAX_SLOTS = 3`).

## running it

```bash
# open the project in godot 4.3+
godot --path game

# or just godot project.godot from inside game/
```

main scene is `scenes/character_creation.tscn`. tab through classes on the
left, click skills to equip / unequip, hit "create character" to print the
final loadout to the godot console (and emit the `character_created`
signal carrying a `PlayerCharacter`).

## file layout

```
game/
├── project.godot              godot config + autoloads
├── scenes/
│   ├── character_creation.tscn   minimal scene, root Control
│   └── character_creation.gd     procedural UI + selection logic
└── scripts/
    ├── skill.gd               Skill resource (id, stats, status, factory)
    ├── character_class.gd     CharacterClass resource (kit + passive + stats)
    ├── loadout.gd             3-slot loadout with no duplicates
    ├── player_character.gd    name + class + level + loadout
    ├── skill_database.gd      autoload SkillDB — registers all 60 skills
    ├── class_database.gd      autoload ClassRoster — registers all 6 classes
    └── skills/                10 skills per element
        ├── water_skills.gd
        ├── fire_skills.gd
        ├── electric_skills.gd
        ├── earth_skills.gd
        ├── ice_skills.gd
        └── air_skills.gd
```

## data model

```gdscript
# define a new skill — copy/paste, no boilerplate
Skill.make(&"fire_fireball", "Fireball",
    "Hurl a fiery projectile that explodes on impact and applies Burn.",
    Skill.Element.FIRE, Skill.Category.OFFENSIVE, 1, 6.0, {
        "damage": 70.0,
        "cast_range_m": 20.0,
        "area_radius_m": 3.0,
        "status": Skill.Status.BURN,
        "status_duration": 4.0,
    })
```

every skill carries: id, element, category (offensive / defensive / mobility
/ utility), unlock level, cooldown, damage, range, radius, duration, and a
status effect with its own duration. that's enough for the gameplay layer
to drive projectiles, AoEs, buffs, and CC without changes here.

statuses available: burn, ignite, freeze, chill, shock, stun, knockback,
knockdown, bleed, poison, daze, slow, haste, armor, shield, heal,
suffocate, blind, petrify, mark.

## next steps (build order)

1. **player controller** — third-person camera, `CharacterBody3D` movement,
   weapon equip + fire. wire `PlayerCharacter.move_speed()` and the
   loadout into input actions Q/E/R.
2. **enemy template** — `CharacterBody3D` with a health/status component
   that reads from `Skill.Status`. one melee + one ranged variant is
   enough to validate everything.
3. **status system** — single component that owns timers for every status,
   so a Pyromancer's `Combustion` can ask "is this target Burning?" and
   detonate stored damage.
4. **loot drop system** — weapon resource + mod resource + roll table per
   enemy tier. drops floor-pickups that re-equip via the loadout pattern.
5. **arena scene** — single-room kill box for tuning skill numbers before
   building real levels.
6. **save/load** — `ResourceSaver.save(player, "user://character.tres")`
   already works for the data, just needs UI plumbing.

balance numbers in the skill files are first-pass starting points, expect to
retune once gunplay is in.
