extends Node2D
## A texture-free player. Position is the center of the square.

@export var speed: float = 300.0
@export var size: float = 40.0
@export var color: Color = Color(0.25, 0.85, 0.75, 1.0)


func _ready() -> void:
	position = get_viewport_rect().get_center()
	get_viewport().size_changed.connect(_clamp_to_screen)
	_clamp_to_screen()
	queue_redraw()


func _physics_process(delta: float) -> void:
	# get_vector limits length to 1, keeping diagonal movement the same speed.
	var direction := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	position += direction * speed * delta
	_clamp_to_screen()


func _clamp_to_screen() -> void:
	var screen := get_viewport_rect()
	# Account for half the square so the entire player stays visible.
	var margin := Vector2.ONE * size * 0.5
	var minimum := screen.position + margin
	var maximum := screen.end - margin
	position.x = clampf(position.x, minimum.x, maximum.x) if minimum.x <= maximum.x else screen.get_center().x
	position.y = clampf(position.y, minimum.y, maximum.y) if minimum.y <= maximum.y else screen.get_center().y


func _draw() -> void:
	var square := Rect2(-Vector2.ONE * size * 0.5, Vector2.ONE * size)
	draw_rect(square, color)
	# Draw the border inside the square's bounds.
	draw_rect(square.grow(-1.0), color.lightened(0.45), false, 2.0)
