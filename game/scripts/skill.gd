class_name Skill
extends Resource

# A single ability that can be slotted into a Loadout.
# This is the core data record — runtime behavior (projectiles, AoE volumes,
# status application) lives in the gameplay layer that consumes these.

enum Element { WATER, FIRE, ELECTRIC, EARTH, ICE, AIR }

enum Category { OFFENSIVE, DEFENSIVE, MOBILITY, UTILITY }

enum Status {
	NONE,
	BURN,        # fire DoT
	IGNITE,      # primes for Combustion detonation
	FREEZE,      # ice hard CC, enables Shatter
	CHILL,       # ice slow + damage amp
	SHOCK,       # electric DoT + slow
	STUN,        # short hard CC
	KNOCKBACK,   # displaces target away
	KNOCKDOWN,   # prone + brief hard CC
	BLEED,       # physical DoT
	POISON,      # earth / nature DoT
	DAZE,        # outgoing damage reduced
	SLOW,        # movement penalty
	HASTE,       # movement bonus (ally buff)
	ARMOR,       # damage reduction buff (ally buff)
	SHIELD,      # absorb shield (ally buff)
	HEAL,        # healing over time (ally buff)
	SUFFOCATE,   # air / water DoT, ignores armor
	BLIND,       # accuracy penalty
	PETRIFY,     # hard CC, target cannot act
	MARK,        # target takes extra damage
}

@export var id: StringName = &""
@export var display_name: String = ""
@export_multiline var description: String = ""
@export var element: Element = Element.WATER
@export var category: Category = Category.OFFENSIVE
@export var level_unlock: int = 1
@export var cooldown_seconds: float = 5.0
@export var damage: float = 0.0
@export var cast_range_m: float = 10.0
@export var area_radius_m: float = 0.0
@export var duration_seconds: float = 0.0
@export var status: Status = Status.NONE
@export var status_chance: float = 1.0
@export var status_duration: float = 0.0


func element_name() -> String:
	return Element.keys()[element].capitalize()


func category_name() -> String:
	return Category.keys()[category].capitalize()


func status_name() -> String:
	if status == Status.NONE:
		return ""
	return Status.keys()[status].capitalize()


static func element_color(e: Element) -> Color:
	match e:
		Element.WATER:    return Color(0.20, 0.60, 1.00)
		Element.FIRE:     return Color(1.00, 0.40, 0.10)
		Element.ELECTRIC: return Color(1.00, 0.90, 0.20)
		Element.EARTH:    return Color(0.55, 0.38, 0.22)
		Element.ICE:      return Color(0.70, 0.92, 1.00)
		Element.AIR:      return Color(0.86, 0.92, 0.96)
	return Color.WHITE


# Factory used by the per-element skill files. Keeps definitions terse.
static func make(p_id: StringName, p_name: String, p_desc: String,
		p_element: Element, p_category: Category, p_level: int, p_cooldown: float,
		extras: Dictionary = {}) -> Skill:
	var s := Skill.new()
	s.id = p_id
	s.display_name = p_name
	s.description = p_desc
	s.element = p_element
	s.category = p_category
	s.level_unlock = p_level
	s.cooldown_seconds = p_cooldown
	for key in extras:
		s.set(key, extras[key])
	return s
