extends Control

# Character creation screen, built procedurally so the .tscn stays minimal.
# Lets the player pick a class, pick 3 skills from that class's 10, and
# confirm a PlayerCharacter ready to be handed to the gameplay scene.

signal character_created(player: PlayerCharacter)

const PREVIEW_LEVEL := 30  # show all skills as available during creation

var working_player: PlayerCharacter
var current_class: CharacterClass
var class_buttons: Array[Button] = []
var loadout_buttons: Array[Button] = []
var name_input: LineEdit
var class_detail: RichTextLabel
var skill_list: VBoxContainer
var loadout_summary: RichTextLabel
var feedback_label: Label
var create_button: Button


func _ready() -> void:
	working_player = PlayerCharacter.new()
	working_player.level = PREVIEW_LEVEL
	_build_ui()
	if not ClassRoster.all().is_empty():
		_select_class(ClassRoster.all()[0])


# --- UI construction ------------------------------------------------------

func _build_ui() -> void:
	var root := MarginContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_theme_constant_override("margin_left", 24)
	root.add_theme_constant_override("margin_right", 24)
	root.add_theme_constant_override("margin_top", 24)
	root.add_theme_constant_override("margin_bottom", 24)
	add_child(root)

	var main := VBoxContainer.new()
	main.add_theme_constant_override("separation", 12)
	root.add_child(main)

	var title := Label.new()
	title.text = "Create Your Outrider"
	title.add_theme_font_size_override("font_size", 28)
	main.add_child(title)

	main.add_child(_build_name_row())
	main.add_child(_build_columns())
	main.add_child(_build_footer())


func _build_name_row() -> HBoxContainer:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)

	var label := Label.new()
	label.text = "Name:"
	row.add_child(label)

	name_input = LineEdit.new()
	name_input.placeholder_text = "Outrider"
	name_input.custom_minimum_size = Vector2(260, 0)
	name_input.text_changed.connect(_on_name_changed)
	row.add_child(name_input)

	feedback_label = Label.new()
	feedback_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(feedback_label)
	return row


func _build_columns() -> HBoxContainer:
	var cols := HBoxContainer.new()
	cols.size_flags_vertical = Control.SIZE_EXPAND_FILL
	cols.add_theme_constant_override("separation", 16)

	cols.add_child(_build_class_column())
	cols.add_child(_build_detail_column())
	cols.add_child(_build_skill_column())
	return cols


func _build_class_column() -> VBoxContainer:
	var col := VBoxContainer.new()
	col.custom_minimum_size = Vector2(220, 0)
	col.add_theme_constant_override("separation", 6)

	var header := Label.new()
	header.text = "Class"
	header.add_theme_font_size_override("font_size", 18)
	col.add_child(header)

	var group := ButtonGroup.new()
	for cc in ClassRoster.all():
		var btn := Button.new()
		btn.text = "%s  ·  %s" % [cc.display_name, _element_short(cc.element)]
		btn.toggle_mode = true
		btn.button_group = group
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		btn.custom_minimum_size = Vector2(0, 36)
		var captured := cc
		btn.pressed.connect(func() -> void: _select_class(captured))
		col.add_child(btn)
		class_buttons.append(btn)
	return col


func _build_detail_column() -> VBoxContainer:
	var col := VBoxContainer.new()
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	col.custom_minimum_size = Vector2(320, 0)

	class_detail = RichTextLabel.new()
	class_detail.bbcode_enabled = true
	class_detail.fit_content = true
	class_detail.size_flags_vertical = Control.SIZE_EXPAND_FILL
	class_detail.scroll_active = true
	col.add_child(class_detail)
	return col


func _build_skill_column() -> VBoxContainer:
	var col := VBoxContainer.new()
	col.custom_minimum_size = Vector2(440, 0)
	col.add_theme_constant_override("separation", 8)

	var header := Label.new()
	header.text = "Skills"
	header.add_theme_font_size_override("font_size", 18)
	col.add_child(header)

	var hint := Label.new()
	hint.text = "Pick three. Click again to unequip."
	hint.modulate = Color(1, 1, 1, 0.65)
	col.add_child(hint)

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.custom_minimum_size = Vector2(0, 280)
	col.add_child(scroll)

	skill_list = VBoxContainer.new()
	skill_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	skill_list.add_theme_constant_override("separation", 6)
	scroll.add_child(skill_list)

	var loadout_header := Label.new()
	loadout_header.text = "Loadout"
	loadout_header.add_theme_font_size_override("font_size", 18)
	col.add_child(loadout_header)

	var loadout_row := HBoxContainer.new()
	loadout_row.add_theme_constant_override("separation", 6)
	col.add_child(loadout_row)
	for i in Loadout.MAX_SLOTS:
		var slot_btn := Button.new()
		slot_btn.text = "Empty"
		slot_btn.custom_minimum_size = Vector2(130, 36)
		var slot_index := i
		slot_btn.pressed.connect(func() -> void: _on_loadout_slot_pressed(slot_index))
		loadout_row.add_child(slot_btn)
		loadout_buttons.append(slot_btn)

	loadout_summary = RichTextLabel.new()
	loadout_summary.bbcode_enabled = true
	loadout_summary.fit_content = true
	col.add_child(loadout_summary)
	return col


func _build_footer() -> HBoxContainer:
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_END

	create_button = Button.new()
	create_button.text = "Create Character"
	create_button.custom_minimum_size = Vector2(220, 44)
	create_button.pressed.connect(_on_create_pressed)
	row.add_child(create_button)
	return row


# --- Selection & refresh --------------------------------------------------

func _select_class(cc: CharacterClass) -> void:
	current_class = cc
	working_player.character_class = cc
	working_player.loadout = Loadout.new()
	for i in class_buttons.size():
		class_buttons[i].set_pressed_no_signal(ClassRoster.all()[i] == cc)
	_refresh_detail()
	_refresh_skill_list()
	_refresh_loadout()
	feedback_label.text = ""


func _refresh_detail() -> void:
	var c := current_class
	var hex := Skill.element_color(c.element).to_html(false)
	class_detail.text = (
		"[font_size=24][color=#%s]%s[/color][/font_size]\n" % [hex, c.display_name]
		+ "[i]%s[/i]\n\n" % c.fantasy
		+ "%s\n\n" % c.description
		+ "[b]Stats[/b]\n"
		+ "HP %d   ·   Armor %d   ·   Move %.1f m/s\n\n" % [int(c.base_health), int(c.base_armor), c.base_move_speed]
		+ "[b]Passive — %s[/b]\n" % c.passive_name
		+ "%s" % c.passive_description
	)


func _refresh_skill_list() -> void:
	for child in skill_list.get_children():
		child.queue_free()

	for s in current_class.skills_by_level():
		skill_list.add_child(_build_skill_row(s))


func _build_skill_row(s: Skill) -> HBoxContainer:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	row.size_flags_horizontal = Control.SIZE_EXPAND_FILL

	var btn := Button.new()
	btn.custom_minimum_size = Vector2(96, 32)
	var equipped := working_player.loadout.contains(s)
	var locked := s.level_unlock > working_player.level
	if locked:
		btn.text = "Lvl %d" % s.level_unlock
		btn.disabled = true
	elif equipped:
		btn.text = "Equipped"
	else:
		btn.text = "Equip"
	var captured := s
	btn.pressed.connect(func() -> void: _toggle_equip(captured))
	row.add_child(btn)

	var label := RichTextLabel.new()
	label.bbcode_enabled = true
	label.fit_content = true
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var status_chunk := ""
	if s.status != Skill.Status.NONE:
		status_chunk = "  ·  [color=#aaaaaa]applies %s[/color]" % s.status_name()
	label.text = (
		"[b]%s[/b]  [color=#888]%s · %ds CD[/color]%s\n" % [s.display_name, s.category_name(), int(s.cooldown_seconds), status_chunk]
		+ "[color=#bdbdbd]%s[/color]" % s.description
	)
	row.add_child(label)
	return row


func _refresh_loadout() -> void:
	for i in Loadout.MAX_SLOTS:
		var s: Skill = working_player.loadout.slots[i]
		if s == null:
			loadout_buttons[i].text = "Empty"
		else:
			loadout_buttons[i].text = s.display_name

	var equipped := working_player.loadout.equipped()
	if equipped.is_empty():
		loadout_summary.text = "[i]Pick three skills above.[/i]"
		return
	var lines: Array[String] = []
	for s in equipped:
		var status_chunk := "" if s.status == Skill.Status.NONE else "  ·  %s" % s.status_name()
		lines.append("[b]%s[/b] — %s · %ds CD%s\n[color=#bdbdbd]%s[/color]" % [
			s.display_name, s.category_name(), int(s.cooldown_seconds), status_chunk, s.description
		])
	loadout_summary.text = "\n\n".join(lines)


# --- Handlers -------------------------------------------------------------

func _on_name_changed(text: String) -> void:
	var trimmed := text.strip_edges()
	working_player.character_name = trimmed if trimmed != "" else "Outrider"


func _toggle_equip(s: Skill) -> void:
	var lo := working_player.loadout
	if lo.contains(s):
		for i in Loadout.MAX_SLOTS:
			if lo.slots[i] == s:
				lo.unequip(i)
				break
		feedback_label.text = ""
	else:
		var slot := lo.first_empty_slot()
		if slot == -1:
			feedback_label.text = "Loadout full — unequip a skill first."
		else:
			lo.equip(s, slot)
			feedback_label.text = ""
	_refresh_skill_list()
	_refresh_loadout()


func _on_loadout_slot_pressed(slot: int) -> void:
	working_player.loadout.unequip(slot)
	_refresh_skill_list()
	_refresh_loadout()


func _on_create_pressed() -> void:
	if working_player.character_name.strip_edges() == "":
		working_player.character_name = "Outrider"
	if working_player.loadout.equipped().size() < Loadout.MAX_SLOTS:
		feedback_label.text = "Equip 3 skills to begin."
		return
	feedback_label.text = "Created %s the %s." % [working_player.character_name, current_class.display_name]
	print_rich("[color=lightgreen]Character created:[/color] %s the %s" % [working_player.character_name, current_class.display_name])
	for s in working_player.loadout.equipped():
		print("  • %s (%s)" % [s.display_name, s.element_name()])
	character_created.emit(working_player)


# --- Helpers --------------------------------------------------------------

func _element_short(e: Skill.Element) -> String:
	return Skill.Element.keys()[e].capitalize()
