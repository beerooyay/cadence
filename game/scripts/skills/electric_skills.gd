class_name ElectricSkills
extends RefCounted

# Stormcaller kit: burst, chain damage, mobility.

const E := Skill.Element.ELECTRIC


static func build() -> Array[Skill]:
	return [
		Skill.make(&"electric_lightning_bolt", "Lightning Bolt",
			"Hitscan strike on a single target. Long range, applies Shock.",
			E, Skill.Category.OFFENSIVE, 1, 5.0, {
				"damage": 90.0, "cast_range_m": 28.0,
				"status": Skill.Status.SHOCK, "status_duration": 3.0,
			}),
		Skill.make(&"electric_chain_lightning", "Chain Lightning",
			"Arcs from your target to nearby enemies. Each jump deals reduced damage.",
			E, Skill.Category.OFFENSIVE, 2, 9.0, {
				"damage": 70.0, "cast_range_m": 18.0, "area_radius_m": 6.0,
				"status": Skill.Status.SHOCK, "status_duration": 3.0,
			}),
		Skill.make(&"electric_static_field", "Static Field",
			"Charge the air in a zone. Enemies inside take ticking damage and lose movement speed.",
			E, Skill.Category.UTILITY, 4, 14.0, {
				"damage": 50.0, "area_radius_m": 6.0, "duration_seconds": 6.0,
				"status": Skill.Status.SLOW, "status_duration": 6.0,
			}),
		Skill.make(&"electric_overcharge", "Overcharge",
			"Channel current through your weapon. Fire rate and reload speed boosted for the duration.",
			E, Skill.Category.DEFENSIVE, 6, 18.0, {
				"duration_seconds": 6.0,
				"status": Skill.Status.HASTE, "status_duration": 6.0,
			}),
		Skill.make(&"electric_thunderclap", "Thunderclap",
			"Slam the ground and unleash a point-blank shockwave. Stuns all enemies caught.",
			E, Skill.Category.OFFENSIVE, 8, 14.0, {
				"damage": 130.0, "area_radius_m": 6.0,
				"status": Skill.Status.STUN, "status_duration": 2.0,
			}),
		Skill.make(&"electric_tesla_coil", "Tesla Coil",
			"Deploy a stationary coil that auto-zaps nearby enemies for the duration.",
			E, Skill.Category.UTILITY, 10, 20.0, {
				"damage": 35.0, "cast_range_m": 8.0, "area_radius_m": 10.0, "duration_seconds": 12.0,
				"status": Skill.Status.SHOCK, "status_duration": 3.0,
			}),
		Skill.make(&"electric_voltage_spike", "Voltage Spike",
			"Mark a target. Your next 3 weapon hits against it crit and chain to 2 extra enemies.",
			E, Skill.Category.UTILITY, 12, 15.0, {
				"cast_range_m": 22.0, "duration_seconds": 8.0,
				"status": Skill.Status.MARK, "status_duration": 8.0,
			}),
		Skill.make(&"electric_storm_surge", "Storm Surge",
			"Dash forward as living lightning. Damages enemies you pass through and leaves a shocking trail.",
			E, Skill.Category.MOBILITY, 14, 12.0, {
				"damage": 90.0, "cast_range_m": 16.0, "duration_seconds": 3.0,
				"status": Skill.Status.SHOCK, "status_duration": 3.0,
			}),
		Skill.make(&"electric_emp_burst", "EMP Burst",
			"Release an electromagnetic pulse. Disables enemy abilities and shields in a wide area.",
			E, Skill.Category.UTILITY, 16, 24.0, {
				"area_radius_m": 12.0, "duration_seconds": 5.0,
				"status": Skill.Status.DAZE, "status_duration": 5.0,
			}),
		Skill.make(&"electric_wrath_of_zeus", "Wrath of Zeus",
			"Call down a storm. Repeated lightning strikes hit random enemies across a huge area.",
			E, Skill.Category.OFFENSIVE, 20, 70.0, {
				"damage": 380.0, "cast_range_m": 30.0, "area_radius_m": 16.0, "duration_seconds": 8.0,
				"status": Skill.Status.SHOCK, "status_duration": 4.0,
			}),
	] as Array[Skill]
