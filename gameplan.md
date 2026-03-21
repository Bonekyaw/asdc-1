# 🎮 Game Overview

**Reef Runner** is a 2D side‑scrolling endless runner set in a vibrant underwater world. The player controls a swimmer who automatically moves forward (screen scrolls right‑to‑left) while avoiding obstacles and collecting treasures. The goal is to survive as long as possible, maximise the score, and progress through levels.

**Core Game Loop:**

- The swimmer stays fixed horizontally on the left side of the screen (camera follows).
- Obstacles and collectibles spawn off‑screen on the right and move left toward the swimmer.
- The player taps or drags vertically to move the swimmer up/down.
- Colliding with an obstacle reduces a life; collecting items increases the score.
- After a certain score or distance, the level advances (visual indicator only, may increase difficulty).

---

## 🧩 Game Mechanics & Logic

### 1. Player Movement

- **Horizontal:** Fixed at a comfortable distance from the left edge (e.g., 20% of screen width). The illusion of forward motion comes from scrolling objects.
- **Vertical:** Controlled by touch. Options:
  - **Tap:** Swimmer jumps to tap Y‑position.
  - **Drag:** Swimmer follows finger smoothly (with easing).
  - **Limits:** Constrain Y within safe bounds (above seabed, below surface).

### 2. Obstacles – Three Types

| Type            | Behaviour                                                                         | Collision Effect                 |
| --------------- | --------------------------------------------------------------------------------- | -------------------------------- |
| School of Fish  | Move horizontally at constant speed. All fish in the school share a fixed Y.      | Lose 1 life, obstacle disappears |
| Sea Turtle      | Moves left while oscillating vertically with a sine wave (amplitude + frequency). | Lose 1 life, obstacle disappears |
| Branching Coral | Stationary in world coordinates (scrolls left with background).                   | Lose 1 life, obstacle disappears |

- Obstacles spawn at random intervals (or fixed spawn points) with random Y positions (within safe zone).
- After passing the left edge, they are removed from the active list.

### 3. Collectibles – Two Types

| Type    | Behaviour                             | Score Effect |
| ------- | ------------------------------------- | ------------ |
| Coin    | Slightly rotates, stationary in world | +10 points   |
| Diamond | Sparkles (scale pulse), stationary    | +50 points   |

- Spawned similarly to obstacles, but at a lower frequency.
- When the swimmer touches a collectible, it disappears and score increases.

### 4. Lives & Score

- **Lives:** Start with 4 hearts. Each collision reduces lives by 1. Game over at 0.
- **Score:** Increases by collecting coins/diamonds. Displayed with a coin icon.
- **Level:** Increases after every N points (e.g., 500 points) or distance. Level number is shown with a wave icon. Difficulty may ramp up (more obstacles, faster scroll).

### 5. Collision Detection

- Each object (swimmer, obstacle, collectible) has a bounding box (rectangle or circle).
- On every frame, check for overlap between swimmer’s bounding box and each active object.
- Use simple AABB (Axis‑Aligned Bounding Box) collision, adjusting for object shapes if needed.
- For performance, only check objects that are near the swimmer’s X position.

### 6. Scrolling & Parallax

- **Scroll Speed:** Constant (e.g., 5 units per frame). Can increase with level.
- **Background Elements:** Coral, seabed, sun rays can be static or scroll slower (parallax) for depth.
- **Bubbles:** Small circles rise randomly – they are purely visual and do not affect gameplay.

---

## 🛠 Technical Implementation with React Native Skia & Reanimated

### Why Skia + Reanimated?

- **Skia** provides a powerful 2D graphics canvas directly in React Native. It’s ideal for drawing custom shapes, sprites, and effects (like bubbles, sun rays) with high performance.
- **Reanimated** enables smooth, 60fps animations by running animations on the UI thread. It can drive the positions of game objects in real time.

### Architecture Overview

1. **Canvas** – The main game area using Skia’s `<Canvas>` component.
2. **Game State** – Managed with React hooks (`useState`, `useReducer`) or a lightweight state machine. Shared values from Reanimated hold positions and properties of dynamic objects.
3. **Game Loop** – Use Reanimated’s `useFrame` callback (via `useSharedValue` and `useAnimatedReaction`) to update object positions every frame.
4. **Rendering** – Inside the Canvas, draw the background, swimmer, obstacles, collectibles, and bubbles using Skia primitives (Rect, Circle, Path, Image, etc.). The UI overlay (hearts, score, level) is rendered with standard React Native components positioned absolutely.
