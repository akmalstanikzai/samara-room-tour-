# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2024-04-12

### Added

-   New layout (XL 8).
-   Tests for simulating context loss, random complectation, initialization, destruction (destroy should be called after the samara-scene web component is unmounted / removed from the DOM). After unmounting, init can be called again without reloading all assets.
-   Reload HDR on context restore.
-   Added spinner for restoring context overlay.
-   Added the ability to specify the color and roof in the initialState as a string. Now it is not necessary to specify hex for colors and roof; you can use it as for other options (backwards compatibility is preserved).
-   Updated three.js version to 0.162.0 (163 Removed WebGL 1 support), updated camera-controls, gsap, rxjs to the latest versions.
-   Added MeshTransmissionMaterial class for better performance in new three.js versions, see https://github.com/mrdoob/three.js/issues/27108.
-   Added performance stats.

### Changed

-   Replaced clock delta with gsap ticker delta.
-   Replaced render on demand with inactivity observer (that stops the rendering loop after 1 second). This fixes camera move freezes caused by delta updates every tick.
-   Renamed three-libs to libs.
-   Moved materials class to src.
-   Renamed updateFrame to update
-   CameraGsap class now require initialization for coordinates

### Removed

-   Pmrem generator.
-   Ktx textures(Compressed pngs with better size/quality)
