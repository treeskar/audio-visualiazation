# An Introduction to *Web Worklets* and Audio Visualization

Here you can see [live example](https://treeskar.github.io/audio-visualiazation/) of audio and paint worklets usage.

## All process can be presented in to four steps
1. We connect to user's media stream.
2. Transform **digital sound** from media stream **to analytical data** by using Web Audio API. In our case we interested in Sound intensity (Db) over time.
3. Then we transform **analytical data to visualization data** with D3. It means Db over time to points (x/y) coordinates.
4. At the end we transform our **points** (visualization data) **to pixels** (render images) with Canvas API.
