# Hyperbaric rendering revision - generated preview

Written on 2026-09-21. This is the integration record, not the missing HBOT_REVISION.md from the original handoff. That document and its cube images were absent from Downloads. The user's follow-up authorized creating missing images.

Hyperbaric uses six generated square rectilinear images, referenced to the approved futuristic chamber render. Never substitute the obsolete spherical hyperbaric image.

## Mapping

Files: public/assets/clinic-tour/cube-v2/hyperbaric/, each 1254 × 1254.

- +X: right.webp
- -X: left.webp
- +Y: up.webp (front direction at bottom)
- -Y: down.webp (front direction at top)
- +Z: front.webp
- -Z: back.webp

Use native textureCube, UNPACK_FLIP_Y_WEBGL=false, linear filtering and CLAMP_TO_EDGE. Cube and sphere samplers use separate texture units. All faces must load at equal square dimensions before display.

Initial yaw is 0, pitch -0.10 radians and field of view 82° on the longer viewport dimension, capped at 90°. The chamber's intentionally oval ends remain. No spherical projection is used.

## Review

The front view is usable for reviewing chamber proportions. Wall, ceiling and floor seams remain visible. See TOUR_QA.md for findings. This is a concept preview, not a seamless final cubemap or measured reconstruction.
