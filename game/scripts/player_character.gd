class_name PlayerCharacter
extends Resource

# A created character: identity + class + level + currently-equipped skills.
# The looter-shooter layer will hang weapons, gear, mods, etc. off this.

@export var character_name: String = "Outrider"
@export var character_class: CharacterClass
@export var level: int = 1
@export var experience: int = 0
@export var loadout: Loadout


func _init() -> void:
	if loadout == null:
		loadout = Loadout.new()


func max_health() -> float:
	if character_class == null:
		return 100.0
	return character_class.base_health + float(level - 1) * 10.0


func max_armor() -> float:
	if character_class == null:
		return 0.0
	return character_class.base_armor + float(level - 1) * 2.0


func move_speed() -> float:
	if character_class == null:
		return 5.0
	return character_class.base_move_speed


func element() -> Skill.Element:
	if character_class == null:
		return Skill.Element.WATER
	return character_class.element


func can_equip(skill: Skill) -> bool:
	if character_class == null or skill == null:
		return false
	if skill not in character_class.skills:
		return false
	return skill.level_unlock <= level
