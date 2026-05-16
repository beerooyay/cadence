class_name EarthSkills
extends RefCounted

# Devastator kit: tankiness, displacement, hard CC.

const E := Skill.Element.EARTH


static func build() -> Array[Skill]:
	return [
		Skill.make(&"earth_boulder_throw", "Boulder Throw",
			"Heft a stone slab and pitch it forward. Heavy single-target damage with knockback.",
			E, Skill.Category.OFFENSIVE, 1, 7.0, {
				"damage": 110.0, "cast_range_m": 18.0,
				"status": Skill.Status.KNOCKBACK,
			}),
		Skill.make(&"earth_stone_skin", "Stone Skin",
			"Coat yourself in rock plating. Gain significant armor for the duration.",
			E, Skill.Category.DEFENSIVE, 2, 16.0, {
				"duration_seconds": 8.0,
				"status": Skill.Status.ARMOR, "status_duration": 8.0,
			}),
		Skill.make(&"earth_tremor", "Tremor",
			"Stomp the ground sending a fissure forward. Cone damage and knocks targets down.",
			E, Skill.Category.OFFENSIVE, 4, 11.0, {
				"damage": 100.0, "cast_range_m": 14.0, "area_radius_m": 6.0,
				"status": Skill.Status.KNOCKDOWN,
			}),
		Skill.make(&"earth_spike_wall", "Spike Wall",
			"Raise a wall of jagged stone. Blocks projectiles and damages enemies that touch it.",
			E, Skill.Category.DEFENSIVE, 6, 18.0, {
				"damage": 80.0, "cast_range_m": 10.0, "area_radius_m": 8.0, "duration_seconds": 10.0,
				"status": Skill.Status.BLEED, "status_duration": 4.0,
			}),
		Skill.make(&"earth_earthquake", "Earthquake",
			"Shake the ground around you. Heavy AoE damage with knockdown and a brief stun.",
			E, Skill.Category.OFFENSIVE, 8, 15.0, {
				"damage": 140.0, "area_radius_m": 8.0,
				"status": Skill.Status.STUN, "status_duration": 2.0,
			}),
		Skill.make(&"earth_gravity_well", "Gravity Well",
			"Open a sinkhole that pulls every enemy toward its center. Tight grouping for follow-up AoE.",
			E, Skill.Category.UTILITY, 10, 16.0, {
				"cast_range_m": 18.0, "area_radius_m": 6.0, "duration_seconds": 4.0,
				"status": Skill.Status.SLOW, "status_duration": 4.0,
			}),
		Skill.make(&"earth_iron_bash", "Iron Bash",
			"Charge into melee range and slam with a stone gauntlet. Armor-piercing strike.",
			E, Skill.Category.OFFENSIVE, 12, 12.0, {
				"damage": 180.0, "cast_range_m": 6.0,
				"status": Skill.Status.STUN, "status_duration": 1.5,
			}),
		Skill.make(&"earth_petrify", "Petrify",
			"Turn a target to stone. Hard CC that lets them be shattered for bonus damage.",
			E, Skill.Category.UTILITY, 14, 20.0, {
				"cast_range_m": 16.0,
				"status": Skill.Status.PETRIFY, "status_duration": 4.0,
			}),
		Skill.make(&"earth_tectonic_slam", "Tectonic Slam",
			"Leap and crash down with a planetary shockwave. Huge AoE damage and knockdown.",
			E, Skill.Category.OFFENSIVE, 16, 28.0, {
				"damage": 240.0, "cast_range_m": 16.0, "area_radius_m": 9.0,
				"status": Skill.Status.KNOCKDOWN,
			}),
		Skill.make(&"earth_mountains_wrath", "Mountain's Wrath",
			"Summon a stone titan that body-slams the area. Enormous damage; you gain massive armor while active.",
			E, Skill.Category.OFFENSIVE, 20, 80.0, {
				"damage": 450.0, "cast_range_m": 12.0, "area_radius_m": 14.0, "duration_seconds": 8.0,
				"status": Skill.Status.ARMOR, "status_duration": 8.0,
			}),
	] as Array[Skill]
