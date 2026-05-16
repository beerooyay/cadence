class_name CharacterClass
extends Resource

# One of the six playable archetypes. Owns a kit of 10 Skills and the
# base stats / passive that define the fantasy.

@export var id: StringName = &""
@export var display_name: String = ""
@export var element: Skill.Element = Skill.Element.WATER
@export var fantasy: String = ""
@export_multiline var description: String = ""
@export var base_health: float = 100.0
@export var base_armor: float = 0.0
@export var base_move_speed: float = 5.0
@export var passive_name: String = ""
@export_multiline var passive_description: String = ""
@export var skills: Array[Skill] = []


func skills_by_level() -> Array[Skill]:
	var out: Array[Skill] = skills.duplicate()
	out.sort_custom(func(a: Skill, b: Skill) -> bool: return a.level_unlock < b.level_unlock)
	return out


func unlocked_for(player_level: int) -> Array[Skill]:
	var out: Array[Skill] = []
	for s in skills:
		if s.level_unlock <= player_level:
			out.append(s)
	return out
