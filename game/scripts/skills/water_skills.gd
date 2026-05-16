class_name WaterSkills
extends RefCounted

# Hydromancer kit: sustain, control, area denial.

const E := Skill.Element.WATER


static func build() -> Array[Skill]:
	return [
		Skill.make(&"water_tidal_wave", "Tidal Wave",
			"A crashing wave erupts from your palms. Heavy damage in a wide cone, knocks targets back.",
			E, Skill.Category.OFFENSIVE, 1, 8.0, {
				"damage": 80.0, "cast_range_m": 12.0, "area_radius_m": 6.0,
				"status": Skill.Status.KNOCKBACK,
			}),
		Skill.make(&"water_healing_spring", "Healing Spring",
			"Open a wellspring at your feet. Allies inside regenerate health over time.",
			E, Skill.Category.DEFENSIVE, 2, 14.0, {
				"area_radius_m": 5.0, "duration_seconds": 8.0,
				"status": Skill.Status.HEAL, "status_duration": 8.0,
			}),
		Skill.make(&"water_riptide", "Riptide",
			"Hook a target with a violent current. Pulls them toward you and applies a water bleed.",
			E, Skill.Category.OFFENSIVE, 4, 10.0, {
				"damage": 40.0, "cast_range_m": 18.0,
				"status": Skill.Status.BLEED, "status_duration": 5.0,
			}),
		Skill.make(&"water_bubble_shield", "Bubble Shield",
			"Encase yourself in pressurized water. Absorbs incoming projectiles for the duration.",
			E, Skill.Category.DEFENSIVE, 6, 16.0, {
				"duration_seconds": 4.0,
				"status": Skill.Status.SHIELD, "status_duration": 4.0,
			}),
		Skill.make(&"water_geyser", "Geyser",
			"Erupt a column of water beneath a target, launching them and dealing area damage.",
			E, Skill.Category.OFFENSIVE, 8, 12.0, {
				"damage": 110.0, "cast_range_m": 14.0, "area_radius_m": 3.0,
				"status": Skill.Status.KNOCKBACK,
			}),
		Skill.make(&"water_dousing_mist", "Dousing Mist",
			"Saturate the area in cold mist. Extinguishes Burn and Ignite, and slows enemies caught inside.",
			E, Skill.Category.UTILITY, 10, 12.0, {
				"area_radius_m": 7.0, "duration_seconds": 6.0,
				"status": Skill.Status.SLOW, "status_duration": 6.0,
			}),
		Skill.make(&"water_drown", "Drown",
			"Force a sphere of water into a single target. Heavy suffocation DoT that ignores armor.",
			E, Skill.Category.OFFENSIVE, 12, 18.0, {
				"damage": 60.0, "cast_range_m": 16.0,
				"status": Skill.Status.SUFFOCATE, "status_duration": 6.0,
			}),
		Skill.make(&"water_tsunami", "Tsunami",
			"Summon a wall of ocean and ride it forward. Massive line damage and knockdown.",
			E, Skill.Category.OFFENSIVE, 14, 35.0, {
				"damage": 260.0, "cast_range_m": 25.0, "area_radius_m": 8.0,
				"status": Skill.Status.KNOCKDOWN,
			}),
		Skill.make(&"water_liquid_form", "Liquid Form",
			"Dissolve and re-form at a target location. Invulnerable in transit; leaves a slowing puddle behind.",
			E, Skill.Category.MOBILITY, 16, 14.0, {
				"cast_range_m": 18.0, "area_radius_m": 4.0, "duration_seconds": 5.0,
				"status": Skill.Status.SLOW, "status_duration": 5.0,
			}),
		Skill.make(&"water_maelstrom", "Maelstrom",
			"Open a persistent vortex that pulls enemies toward its center and grinds them with damage ticks.",
			E, Skill.Category.OFFENSIVE, 20, 60.0, {
				"damage": 180.0, "cast_range_m": 20.0, "area_radius_m": 7.0, "duration_seconds": 10.0,
				"status": Skill.Status.KNOCKDOWN, "status_duration": 1.5,
			}),
	] as Array[Skill]
