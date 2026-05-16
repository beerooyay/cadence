class_name AirSkills
extends RefCounted

# Tempest kit: mobility, knockback, ranged precision.

const E := Skill.Element.AIR


static func build() -> Array[Skill]:
	return [
		Skill.make(&"air_gust", "Gust",
			"Blast a cone of wind. Knocks enemies back and staggers them.",
			E, Skill.Category.OFFENSIVE, 1, 6.0, {
				"damage": 60.0, "cast_range_m": 10.0, "area_radius_m": 6.0,
				"status": Skill.Status.KNOCKBACK,
			}),
		Skill.make(&"air_wind_slash", "Wind Slash",
			"Throw a crescent of compressed air. Long range piercing projectile.",
			E, Skill.Category.OFFENSIVE, 2, 7.0, {
				"damage": 95.0, "cast_range_m": 24.0,
				"status": Skill.Status.BLEED, "status_duration": 4.0,
			}),
		Skill.make(&"air_updraft", "Updraft",
			"Lift yourself and nearby enemies into the air. Allies stay grounded.",
			E, Skill.Category.MOBILITY, 4, 12.0, {
				"area_radius_m": 5.0, "duration_seconds": 2.0,
				"status": Skill.Status.KNOCKBACK,
			}),
		Skill.make(&"air_cyclone", "Cyclone",
			"Launch a roaming vortex that pulls enemies in and grinds them with damage ticks.",
			E, Skill.Category.OFFENSIVE, 6, 16.0, {
				"damage": 140.0, "cast_range_m": 20.0, "area_radius_m": 5.0, "duration_seconds": 6.0,
				"status": Skill.Status.DAZE, "status_duration": 4.0,
			}),
		Skill.make(&"air_aerial_step", "Aerial Step",
			"Double-jump and air-dash. Grants brief weightlessness and slows incoming damage.",
			E, Skill.Category.MOBILITY, 8, 8.0, {
				"cast_range_m": 12.0, "duration_seconds": 3.0,
				"status": Skill.Status.HASTE, "status_duration": 3.0,
			}),
		Skill.make(&"air_sonic_boom", "Sonic Boom",
			"Clap your hands together. A focused shockwave hammers enemies in a line.",
			E, Skill.Category.OFFENSIVE, 10, 14.0, {
				"damage": 180.0, "cast_range_m": 22.0, "area_radius_m": 4.0,
				"status": Skill.Status.KNOCKBACK,
			}),
		Skill.make(&"air_tailwind", "Tailwind",
			"Allies in range gain bonus movement and reload speed for the duration.",
			E, Skill.Category.DEFENSIVE, 12, 20.0, {
				"area_radius_m": 8.0, "duration_seconds": 8.0,
				"status": Skill.Status.HASTE, "status_duration": 8.0,
			}),
		Skill.make(&"air_pressure_wave", "Pressure Wave",
			"Project a ranged shockwave that compresses on impact. Heavy AoE damage and stagger.",
			E, Skill.Category.OFFENSIVE, 14, 22.0, {
				"damage": 220.0, "cast_range_m": 22.0, "area_radius_m": 6.0,
				"status": Skill.Status.DAZE, "status_duration": 4.0,
			}),
		Skill.make(&"air_vacuum", "Vacuum",
			"Pull the air from an area. Enemies inside suffocate and lose ranged accuracy.",
			E, Skill.Category.UTILITY, 16, 24.0, {
				"damage": 120.0, "cast_range_m": 18.0, "area_radius_m": 6.0, "duration_seconds": 6.0,
				"status": Skill.Status.SUFFOCATE, "status_duration": 6.0,
			}),
		Skill.make(&"air_hurricane", "Hurricane",
			"Summon a moving hurricane. Massive sustained AoE damage with frequent knockback.",
			E, Skill.Category.OFFENSIVE, 20, 75.0, {
				"damage": 360.0, "cast_range_m": 26.0, "area_radius_m": 12.0, "duration_seconds": 10.0,
				"status": Skill.Status.KNOCKBACK, "status_duration": 1.0,
			}),
	] as Array[Skill]
