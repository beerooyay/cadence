extends Node

# Autoload: SkillDB
# Registers every Skill instance once at boot. Look up by id or by element.

var by_id: Dictionary = {}        # StringName -> Skill
var by_element: Dictionary = {}   # Skill.Element -> Array[Skill]


func _ready() -> void:
	_register_all(WaterSkills.build())
	_register_all(FireSkills.build())
	_register_all(ElectricSkills.build())
	_register_all(EarthSkills.build())
	_register_all(IceSkills.build())
	_register_all(AirSkills.build())


func get_skill(skill_id: StringName) -> Skill:
	return by_id.get(skill_id, null)


func for_element(e: Skill.Element) -> Array[Skill]:
	var raw: Array = by_element.get(e, [])
	var out: Array[Skill] = []
	for s in raw:
		out.append(s)
	return out


func all() -> Array[Skill]:
	var out: Array[Skill] = []
	for s in by_id.values():
		out.append(s)
	return out


func _register_all(list: Array[Skill]) -> void:
	for s in list:
		if s.id == &"":
			push_error("Skill missing id: %s" % s.display_name)
			continue
		if by_id.has(s.id):
			push_error("Duplicate skill id: %s" % s.id)
			continue
		by_id[s.id] = s
		var bucket: Array = by_element.get(s.element, [])
		bucket.append(s)
		by_element[s.element] = bucket
