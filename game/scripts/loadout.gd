class_name Loadout
extends Resource

# A fixed-size set of equipped skills. Outriders-style: 3 slots, no duplicates.

const MAX_SLOTS := 3

@export var slots: Array[Skill] = [null, null, null]


func equip(skill: Skill, slot: int) -> bool:
	if slot < 0 or slot >= MAX_SLOTS:
		push_error("Loadout slot %d out of range" % slot)
		return false
	_ensure_slots()
	if skill != null and contains(skill):
		return false
	slots[slot] = skill
	return true


func unequip(slot: int) -> void:
	if slot < 0 or slot >= MAX_SLOTS:
		return
	_ensure_slots()
	slots[slot] = null


func contains(skill: Skill) -> bool:
	_ensure_slots()
	return skill in slots


func equipped() -> Array[Skill]:
	_ensure_slots()
	var out: Array[Skill] = []
	for s in slots:
		if s != null:
			out.append(s)
	return out


func is_full() -> bool:
	return equipped().size() >= MAX_SLOTS


func first_empty_slot() -> int:
	_ensure_slots()
	for i in MAX_SLOTS:
		if slots[i] == null:
			return i
	return -1


func _ensure_slots() -> void:
	if slots.size() < MAX_SLOTS:
		slots.resize(MAX_SLOTS)
