extends Node

# Autoload: ClassRoster
# Holds the six playable CharacterClass definitions. SkillDB autoload runs
# first (per project.godot order), so by the time _ready() fires here the
# skill registry is populated.

var by_id: Dictionary = {}                       # StringName -> CharacterClass
var ordered: Array[CharacterClass] = []


func _ready() -> void:
	_register(_make_hydromancer())
	_register(_make_pyromancer())
	_register(_make_stormcaller())
	_register(_make_devastator())
	_register(_make_cryomancer())
	_register(_make_tempest())


func get_class(class_id: StringName) -> CharacterClass:
	return by_id.get(class_id, null)


func all() -> Array[CharacterClass]:
	return ordered


func _register(c: CharacterClass) -> void:
	by_id[c.id] = c
	ordered.append(c)


# --- Class definitions ----------------------------------------------------

func _make_hydromancer() -> CharacterClass:
	var c := CharacterClass.new()
	c.id = &"hydromancer"
	c.display_name = "Hydromancer"
	c.element = Skill.Element.WATER
	c.fantasy = "Hold the tide in your hand. Heal allies, drown your enemies."
	c.description = "Sustain-focused controller. Strong area denial and group healing."
	c.base_health = 115.0
	c.base_armor = 5.0
	c.base_move_speed = 5.0
	c.passive_name = "Tidal Mend"
	c.passive_description = "Regenerate 1.5% max health per second while standing in a Water effect, or for 3s after using a Water skill."
	c.skills = SkillDB.for_element(Skill.Element.WATER)
	return c


func _make_pyromancer() -> CharacterClass:
	var c := CharacterClass.new()
	c.id = &"pyromancer"
	c.display_name = "Pyromancer"
	c.element = Skill.Element.FIRE
	c.fantasy = "Set the world on fire, then walk through the ashes."
	c.description = "Mid-range DPS built around burn DoT and detonation combos."
	c.base_health = 95.0
	c.base_armor = 0.0
	c.base_move_speed = 5.0
	c.passive_name = "Cinder"
	c.passive_description = "Burning enemies drop healing motes when killed. Each mote restores 8% max health."
	c.skills = SkillDB.for_element(Skill.Element.FIRE)
	return c


func _make_stormcaller() -> CharacterClass:
	var c := CharacterClass.new()
	c.id = &"stormcaller"
	c.display_name = "Stormcaller"
	c.element = Skill.Element.ELECTRIC
	c.fantasy = "Move like lightning. End fights before they start."
	c.description = "High-mobility burst damage. Chain effects punish grouped enemies."
	c.base_health = 90.0
	c.base_armor = 0.0
	c.base_move_speed = 6.0
	c.passive_name = "Conductive"
	c.passive_description = "Weapon hits chain to one nearby enemy for 25% damage. Shocked targets count as primary at full damage."
	c.skills = SkillDB.for_element(Skill.Element.ELECTRIC)
	return c


func _make_devastator() -> CharacterClass:
	var c := CharacterClass.new()
	c.id = &"devastator"
	c.display_name = "Devastator"
	c.element = Skill.Element.EARTH
	c.fantasy = "Be the mountain. Move only when the world ends."
	c.description = "Frontline tank. Heavy displacement, armor stacking, and crowd control."
	c.base_health = 140.0
	c.base_armor = 15.0
	c.base_move_speed = 4.5
	c.passive_name = "Bulwark"
	c.passive_description = "Killing an enemy at close range restores 6% max armor. Above 50% armor you take 15% less damage."
	c.skills = SkillDB.for_element(Skill.Element.EARTH)
	return c


func _make_cryomancer() -> CharacterClass:
	var c := CharacterClass.new()
	c.id = &"cryomancer"
	c.display_name = "Cryomancer"
	c.element = Skill.Element.ICE
	c.fantasy = "Stop time, one breath at a time."
	c.description = "Crowd-control specialist. Freezes set up massive Shatter damage."
	c.base_health = 100.0
	c.base_armor = 5.0
	c.base_move_speed = 5.0
	c.passive_name = "Subzero"
	c.passive_description = "Frozen or Chilled enemies take 25% more weapon damage. Killing a Frozen target refunds 1s of all cooldowns."
	c.skills = SkillDB.for_element(Skill.Element.ICE)
	return c


func _make_tempest() -> CharacterClass:
	var c := CharacterClass.new()
	c.id = &"tempest"
	c.display_name = "Tempest"
	c.element = Skill.Element.AIR
	c.fantasy = "Be everywhere they're not."
	c.description = "Ranged skirmisher. Mobility, precision, and knockback control space."
	c.base_health = 95.0
	c.base_armor = 0.0
	c.base_move_speed = 6.0
	c.passive_name = "Slipstream"
	c.passive_description = "Killing or knocking back an enemy grants 20% movement speed for 3s. Refreshes on each kill or knockback."
	c.skills = SkillDB.for_element(Skill.Element.AIR)
	return c
