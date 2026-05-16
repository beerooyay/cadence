class_name IceSkills
extends RefCounted

# Cryomancer kit: CC, slow, freeze + shatter combo.

const E := Skill.Element.ICE


static func build() -> Array[Skill]:
	return [
		Skill.make(&"ice_ice_shard", "Ice Shard",
			"Fire a piercing shard. Slows the target on hit.",
			E, Skill.Category.OFFENSIVE, 1, 5.0, {
				"damage": 75.0, "cast_range_m": 22.0,
				"status": Skill.Status.CHILL, "status_duration": 4.0,
			}),
		Skill.make(&"ice_frost_nova", "Frost Nova",
			"Burst out a ring of frost. Briefly freezes every enemy in range.",
			E, Skill.Category.OFFENSIVE, 2, 12.0, {
				"damage": 60.0, "area_radius_m": 7.0,
				"status": Skill.Status.FREEZE, "status_duration": 2.0,
			}),
		Skill.make(&"ice_glacial_wall", "Glacial Wall",
			"Conjure a wall of ice. Provides cover, and Freezes enemies that contact it.",
			E, Skill.Category.DEFENSIVE, 4, 16.0, {
				"cast_range_m": 12.0, "area_radius_m": 10.0, "duration_seconds": 10.0,
				"status": Skill.Status.FREEZE, "status_duration": 2.0,
			}),
		Skill.make(&"ice_cold_snap", "Cold Snap",
			"Chill yourself into stillness. Immune to Burn and Ignite; all cooldowns recover faster.",
			E, Skill.Category.DEFENSIVE, 6, 22.0, {
				"duration_seconds": 8.0,
				"status": Skill.Status.HASTE, "status_duration": 8.0,
			}),
		Skill.make(&"ice_ice_lance", "Ice Lance",
			"Long piercing lance. Crits Frozen and Chilled enemies for massive damage.",
			E, Skill.Category.OFFENSIVE, 8, 10.0, {
				"damage": 180.0, "cast_range_m": 26.0,
				"status": Skill.Status.CHILL, "status_duration": 3.0,
			}),
		Skill.make(&"ice_blizzard", "Blizzard",
			"Conjure a snowstorm over an area. Slows enemies, deals damage over time.",
			E, Skill.Category.UTILITY, 10, 18.0, {
				"damage": 90.0, "cast_range_m": 22.0, "area_radius_m": 8.0, "duration_seconds": 8.0,
				"status": Skill.Status.CHILL, "status_duration": 8.0,
			}),
		Skill.make(&"ice_shatter", "Shatter",
			"Detonate every Frozen enemy in range. Each detonation deals massive damage.",
			E, Skill.Category.OFFENSIVE, 12, 16.0, {
				"damage": 280.0, "cast_range_m": 20.0, "area_radius_m": 7.0,
			}),
		Skill.make(&"ice_frozen_armor", "Frozen Armor",
			"Ally is encased in ice plating. Absorbs damage and retaliates with frost when hit.",
			E, Skill.Category.DEFENSIVE, 14, 22.0, {
				"cast_range_m": 14.0, "duration_seconds": 8.0,
				"status": Skill.Status.SHIELD, "status_duration": 8.0,
			}),
		Skill.make(&"ice_cryo_dash", "Cryo Dash",
			"Dash forward leaving an icy trail. Freezes enemies you pass through.",
			E, Skill.Category.MOBILITY, 16, 12.0, {
				"damage": 50.0, "cast_range_m": 16.0,
				"status": Skill.Status.FREEZE, "status_duration": 2.0,
			}),
		Skill.make(&"ice_absolute_zero", "Absolute Zero",
			"Drop the temperature in a massive area. Everything inside is Frozen solid.",
			E, Skill.Category.OFFENSIVE, 20, 70.0, {
				"damage": 150.0, "cast_range_m": 24.0, "area_radius_m": 14.0,
				"status": Skill.Status.FREEZE, "status_duration": 5.0,
			}),
	] as Array[Skill]
