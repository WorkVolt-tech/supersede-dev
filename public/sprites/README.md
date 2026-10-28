# Drop sprite art in here

The game loads whatever it finds at these exact paths. Nothing else needs to
change — no code edits, no imports. Missing files fall back to simple drawn
shapes (see src/game/drawSprite.js), so the game keeps working while art is
still in progress.

    public/sprites/player/car_default.png
    public/sprites/enemies/looter.png
    public/sprites/enemies/hunter_scout.png
    public/sprites/enemies/bike_hunter.png
    public/sprites/enemies/looter_truck.png
    public/sprites/enemies/hunter_marksman.png
    public/sprites/enemies/stalker_pack.png
    public/sprites/bosses/hunter_captain.png

PNG or WEBP, transparent background, roughly square, ~128-256px.
