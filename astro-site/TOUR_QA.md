# Clinic tour preview QA - 2026-09-21

Status: all six rooms load. The revised rooms correct spherical stretching, but visible image seams remain. Preview only, not a seamless final tour.

## Source and scope

The Downloads package contained six panoramas and the original viewer, but neither HBOT_REVISION.md nor revised cube faces. The obsolete hyperbaric panorama was excluded. The user's follow-up authorized creating missing hyperbaric images and correcting patient-suite and DEXA distortion.

The three replacement rooms use eighteen generated square images referenced to the existing futuristic renders. Generation used the built-in image tool. Prompts are in TOUR_IMAGE_PROMPTS.md; dimensions, sizes and hashes are in public/assets/clinic-tour/cube-v2/manifest.json. All faces are 1254 × 1254, compressed to WebP quality 92 without cropping or projection conversion. Hyperbaric totals 932,198 bytes, patient suite 1,234,450 bytes, and DEXA 1,071,360 bytes (3.24 MB combined).

Main entrance, private entrance and VO₂ max retain the supplied panoramas. Existing gallery images and old patient-suite/DEXA tour assets remain unchanged.

## Projection and navigation

The revised rooms use native WebGL cube sampling. Field of view is measured on the longer viewport dimension: 78° for panoramas, 82° for cubes, capped at 90°. The previous fixed vertical angle could exceed 120° horizontally on desktop, stretching room edges. Intentionally sculpted architectural curves remain.

The Gallery floor plan shows entrances and clinical corridors without matched camera positions or direct links between these six viewpoints. The supplied sequence remains:
Main entrance → Private entrance → Patient suite → DEXA → VO₂ max → Hyperbaric → Main entrance.

Arrows say Jump to / Back to, and the interface explains that jumps skip corridors. No new corridor or spatial adjacency is asserted. There is one viewpoint per room.

All six cube faces must succeed before display. Only the selected room loads immediately; the next room is prefetched after loading unless data saving or a slow connection is detected. Two room image sets are retained in application memory. The viewer renders on interaction.

## Validation

- Production builds pass at /immortals-site/ and custom-domain base / with SITE_URL=https://immortals.international.
- Ten automated tests pass, covering initial load, wraparound, stale requests, failure/retry, touch swipe/pinch/cancel, atomic six-face upload, exclusion of the obsolete hyperbaric fallback, failed-face retry, invalid dimensions, actual production assets, and the desktop field-of-view cap.
- Browser: all six rooms render. Cube/sphere transitions, selection, previous/next, projected arrows, drag, keyboard rotation, zoom/reset and fullscreen toggling work.
- Updated mobile layouts checked at 390 × 844 and 375 × 667, without horizontal overflow. These are resized-browser and synthetic-touch checks, not physical iPhone/Android tests.
- The earlier integration also checked 1440 × 900 and 812 × 375, homepage entry links, three floor-plan selectors/enlargement, four galleries, DEXA comparison and retained feedback link. This revision changes none of those content files.
- Main entrance is the default on a fresh /tour/ URL; room hashes remain shareable.

## Image findings

The forward views have substantially more natural furniture and equipment proportions. The generated faces are not a continuous 3D reconstruction and must not be described as seamless.

- Hyperbaric: the chamber remains on one rectilinear front face. Front/side boundaries show abrupt timber and floor changes. Ceiling coves and floor tiles do not align at the upper/lower joins. Rear and side walls are concept imagery.
- Patient suite: the sofa ends abruptly at the front/right boundary and the wall scale changes. Ceiling/floor continuity also needs refinement. A duplicate TV and cabinet in the first right-face generation were removed.
- DEXA: the front/left join repeats part of the visitor chair and interrupts the window line. The right join cuts off the workstation at a timber boundary. Ceiling/floor continuity needs refinement.
- Supplied private entrance: a small rear ceiling/light-band mismatch remains.
- The original 1774 × 887 panoramas remain softer than the new cube faces.

Final seam acceptance requires views rendered from one camera in a coherent 3D scene, or an edge-matched image revision. This preview makes the proportion correction and complete six-room navigation reviewable; it does not pass final seam acceptance.

No remote push, merge, publishing, experience subpages or trailer.
