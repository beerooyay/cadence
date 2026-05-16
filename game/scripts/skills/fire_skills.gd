class_name FireSkills
extends RefCounted

# Pyromancer kit: burn DoT, area, detonation combos.

const E := Skill.Element.FIRE


static func build() -> Array[Skill]:
	return [
		Skill.make(&"fire_fireball", "Fireball",
			"Hurl a fiery projectile that explodes on impact and applies Burn.",
			E, Skill.Category.OFFENSIVE, 1, 6.0, {
				"damage": 70.0, "cast_range_m": 20.0, "area_radius_m": 3.0,
				"status": Skill.Status.BURN, "status_duration": 4.0,
			}),
		Skill.make(&"fire_ignite", "Ignite",
			"Curse a target. Burns them for a fixed amount per second over the duration.",
			E, Skill.Category.OFFENSIVE, 2, 10.0, {
				"damage": 20.0, "cast_range_m": 22.0,
				"status": Skill.Status.BURN, "status_duration": 8.0,
			}),
		Skill.make(&"fire_heat_wave", "Heat Wave",
			"Exhale a wave of pressurized heat. Cone damage and Ignites every enemy caught in it.",
			E, Skill.Category.OFFENSIVE, 4, 9.0, {
				"damage": 90.0, "cast_range_m": 10.0, "area_radius_m": 6.0,
				"status": Skill.Status.IGNITE, "status_duration": 5.0,
			}),
		Skill.make(&"fire_magma_trap", "Magma Trap",
			"Place a smoldering trap that erupts when triggered, leaving a burning pool behind.",
			E, Skill.Category.UTILITY, 6, 14.0, {
				"damage": 120.0, "area_radius_m": 4.0, "duration_seconds": 6.0,
				"status": Skill.Status.BURN, "status_duration": 4.0,
			}),
		Skill.make(&"fire_phoenix_step", "Phoenix Step",
			"Burst forward in a streak of flame. Ignites everything along your path.",
			E, Skill.Category.MOBILITY, 8, 10.0, {
				"damage": 50.0, "cast_range_m": 14.0,
				"status": Skill.Status.IGNITE, "status_duration": 4.0,
			}),
		Skill.make(&"fire_inferno", "Inferno",
			"Detonate the air around you. Heavy point-blank damage and knocks enemies back.",
			E, Skill.Category.OFFENSIVE, 10, 16.0, {
				"damage": 160.0, "area_radius_m": 8.0,
				"status": Skill.Status.KNOCKBACK,
			}),
		Skill.make(&"fire_combustion", "Combustion",
			"Detonate every Burning or Ignited enemy in range. Each detonation hits like a grenade.",
			E, Skill.Category.OFFENSIVE, 12, 18.0, {
				"damage": 220.0, "cast_range_m": 18.0, "area_radius_m": 6.0,
			}),
		Skill.make(&"fire_volcanic_slam", "Volcanic Slam",
			"Leap and crash down with a magma shockwave. AoE damage and knocks down enemies on impact.",
			E, Skill.Category.OFFENSIVE, 14, 22.0, {
				"damage": 200.0, "cast_range_m": 14.0, "area_radius_m": 7.0,
				"status": Skill.Status.KNOCKDOWN,
			}),
		Skill.make(&"fire_solar_flare", "Solar Flare",
			"Release a blinding pulse. Every enemy in line of sight is Blinded and takes ongoing fire damage.",
			E, Skill.Category.UTILITY, 16, 20.0, {
				"damage": 100.0, "area_radius_m": 18.0,
				"status": Skill.Status.BLIND, "status_duration": 5.0,
			}),
		Skill.make(&"fire_apocalypse", "Apocalypse",
			"Call down a rain of meteors over a wide area. Sustained AoE devastation.",
			E, Skill.Category.OFFENSIVE, 20, 75.0, {
				"damage": 400.0, "cast_range_m": 30.0, "area_radius_m": 12.0, "duration_seconds": 6.0,
				"status": Skill.Status.BURN, "status_duration": 6.0,
			}),
	] as Array[Skill]
