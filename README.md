# FNV UI

Modern React WebUI for the Fallout: New Vegas inspired HUD used on a Nanos World server.

This repo hosts the full client UI layer (HUD, dialogs, shop, inventory, containers, transfer screen) and stays tightly coupled to the server logic in the main project:
https://github.com/MaxSC4/fnv-core

## What is inside

- HUD for HP/AP/compass/conditions/ammo, plus contextual prompts
- Dialog system with icons and keyboard navigation
- Shop UI (barter layout) with quantities, carts, and confirmations
- Inventory UI (items + SPECIAL/Stats page)
- Enemy target bar
- Container loot UI (compact view and transfer screen)
- Custom styling for the Fallout NV look and pip-boy palette

## Integration notes

The UI reacts to events and payloads coming from the core server repo.
All WebUI events and contracts are documented and implemented there:
https://github.com/MaxSC4/fnv-core

## Status

This UI is under active development and matches the gameplay systems in the core repo.
