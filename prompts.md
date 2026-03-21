# 🎮 Reef Runner - Step-by-Step Development Prompts

## 📋 Phase 1: Project Setup & Foundation

### Prompt 1.1: Initialize React Native Project

```
Create a new React Native project with the following dependencies:
- react-native-skia (@shopify/react-native-skia)
- react-native-reanimated (v3.x)
- react-native-gesture-handler

Set up the project structure:
/src
  /components
  /screens
  /hooks
  /utils
  /assets
  /constants
```

### Prompt 1.2: Configure Skia Canvas

```
Create a full-screen Skia Canvas component that:
- Fills the entire device screen
- Handles different aspect ratios
- Sets up the coordinate system for 2D game rendering
- Implements a game loop using Reanimated's useFrame
```

---

## 🏊 Phase 2: Player (Swimmer) Implementation

### Prompt 2.1: Create Swimmer Component

```
Build a Swimmer component using Skia that:
- Renders a swimmer sprite with diving mask and fins
- Positions at 20% from left edge (fixed X position)
- Supports vertical movement within safe Y bounds
- Includes swimming animation (arm/leg movement cycle)
```

### Prompt 2.2: Implement Touch Controls

```
Create touch control system with two modes:
1. Tap mode: Swimmer jumps to tapped Y position with easing
2. Drag mode: Swimmer follows finger smoothly with interpolation

Add boundary constraints:
- Minimum Y: 15% from top (water surface)
- Maximum Y: 85% from top (above seabed)
```

---

## 🐠 Phase 3: Obstacle System

### Prompt 3.1: School of Fish Obstacle

```
Create FishSchool component that:
- Spawns 5-8 small fish in horizontal formation
- Moves left at constant speed (e.g., 5 units/frame)
- Maintains fixed Y position throughout movement
- Removes when off-screen left edge
- Includes swimming animation for each fish
```

### Prompt 3.2: Sea Turtle Obstacle

```
Create SeaTurtle component that:
- Moves left at constant horizontal speed
- Oscillates vertically using sine wave: y = baseY + amplitude * sin(frequency * time)
- Amplitude: 50-80 pixels, Frequency: 0.02-0.05
- Includes flipper animation
- Removes when off-screen
```

### Prompt 3.3: Branching Coral Obstacle

```
Create Coral obstacle that:
- Remains stationary in world coordinates
- Appears to move left as background scrolls
- Has irregular branching shape (use Skia Path)
- Multiple color variations (pink, red, orange)
- Removes when off-screen
```

### Prompt 3.4: Obstacle Spawner

```
Build ObstacleSpawner that:
- Spawns obstacles at random intervals (2-5 seconds)
- Randomizes obstacle type (40% fish, 35% turtle, 25% coral)
- Randomizes Y position within safe zone
- Ensures minimum distance between obstacles
- Increases spawn rate as level progresses
```

---

## 💎 Phase 4: Collectible System

### Prompt 4.1: Coin Collectible

```
Create Coin component that:
- Renders gold coin with dollar/coin icon
- Slight rotation animation (0-360 degrees over 2 seconds)
- Stationary in world coordinates (scrolls with background)
- Emits sparkle effect on collection
- Removes when collected or off-screen
```

### Prompt 4.2: Diamond Collectible

```
Create Diamond component that:
- Renders blue diamond shape with sparkle effect
- Scale pulse animation (0.9 to 1.1 over 0.5 seconds)
- Higher rarity than coins (30% of collectible spawns)
- Emits brighter sparkle on collection
- Removes when collected or off-screen
```

### Prompt 4.3: Collectible Spawner

```
Build CollectibleSpawner that:
- Spawns collectibles at random intervals (1-3 seconds)
- 70% coins, 30% diamonds
- Randomizes Y position within safe zone
- Avoids spawning inside obstacles
- Creates patterns (lines, arcs) for variety
```

---

## ⚔️ Phase 5: Collision Detection

### Prompt 5.1: Bounding Box System

```
Implement collision detection with:
- AABB (Axis-Aligned Bounding Box) for all objects
- Each object has: x, y, width, height properties
- Swimmer bounding box slightly smaller than sprite (forgiving collision)
- Optimize by only checking objects within swimmer's X range ±200 pixels
```

### Prompt 5.2: Collision Handler

```
Create CollisionHandler that:
- Checks swimmer vs all active obstacles every frame
- Checks swimmer vs all active collectibles every frame
- On obstacle collision: reduce lives, trigger hit animation, remove obstacle
- On collectible collision: add score, trigger collection animation, remove collectible
- Adds brief invincibility period (1 second) after hit
```

---

## ❤️ Phase 6: Lives, Score & Level System

### Prompt 6.1: Lives Manager

```
Build LivesManager that:
- Initializes with 4 hearts
- Decrements on each collision
- Displays hearts in top-left UI
- Triggers game over at 0 lives
- Includes heart animation when losing life (shake + fade)
```

### Prompt 6.2: Score System

```
Create ScoreManager that:
- Starts at 0
- +10 points per coin
- +50 points per diamond
- Displays with coin icon in top-center UI
- Animates on score increase (number roll-up effect)
- Persists high score locally
```

### Prompt 6.3: Level System

```
Build LevelManager that:
- Starts at Level 1
- Increases every 500 points (configurable)
- Displays "LEVEL X" with wave icon in top-right
- Increases difficulty per level:
  - Scroll speed +10%
  - Obstacle spawn rate +15%
  - More complex obstacle patterns
```

---

## 🌊 Phase 7: Background & Scrolling

### Prompt 7.1: Parallax Background

```
Create ParallaxBackground with 3 layers:
1. Far layer: Sun rays, distant coral (scroll at 20% speed)
2. Mid layer: Main coral reef, seabed (scroll at 50% speed)
3. Near layer: Bubbles, small particles (scroll at 100% speed)

Each layer loops seamlessly for endless effect.
```

### Prompt 7.2: Water Effects

```
Add water visual effects:
- Light blue gradient overlay (darker at bottom)
- Caustic light patterns (subtle animated overlay)
- Rising bubbles (random positions, varying sizes)
- Occasional fish schools in background (non-interactive)
```

### Prompt 7.3: Scroll Controller

```
Build ScrollController that:
- Maintains global scroll position (shared value)
- Increments every frame based on current speed
- Passes scroll offset to all scrolling objects
- Increases speed gradually as level progresses
- Caps maximum speed for playability
```

---

## 🎨 Phase 8: UI/HUD Overlay

### Prompt 8.1: Top HUD Component

```
Create TopHUD with React Native components (absolute positioning):
- Top-left: 4 heart icons (filled/empty based on lives)
- Top-center: Score display with coin icon (e.g., "🪙 305")
- Top-right: Level indicator with wave icon (e.g., "LEVEL 1 🌊")

Style: Rounded blue backgrounds, white text, game-appropriate fonts.
```

### Prompt 8.2: Game Over Screen

```
Build GameOverScreen that shows:
- "Game Over" title with animation
- Final score
- High score (if beaten)
- Level reached
- "Play Again" button
- "Main Menu" button

Fade in animation, semi-transparent overlay.
```

### Prompt 8.3: Start Screen

```
Create StartScreen with:
- Game title "Reef Runner" with underwater styling
- "Start Game" button (large, prominent)
- "How to Play" instructions (tap/drag to move)
- High score display
- Settings icon (optional)

Include animated swimmer preview in background.
```

---

## ⚡ Phase 9: Animations & Polish

### Prompt 9.1: Swimmer Animations

```
Add swimmer animation states:
- Idle: Gentle floating motion (subtle up/down)
- Swimming: Arm/leg cycle animation
- Hit: Flash red, brief backward movement
- Collect: Small jump with sparkle effect

Use Reanimated for smooth 60fps animations.
```

### Prompt 9.2: Particle Effects

```
Implement particle system for:
- Coin collection: Gold sparkles radiating outward
- Diamond collection: Blue sparkles with longer duration
- Hit effect: Red flash + shake
- Level up: Confetti-style celebration

Particles fade out and remove after animation completes.
```

### Prompt 9.3: Screen Transitions

```
Add smooth transitions:
- Start screen → Game: Fade + scale up
- Game → Game Over: Fade + blur
- Game Over → Start: Fade out
- Level up: Brief pause + flash + continue

Use Reanimated for all transitions.
```

---

## 🧪 Phase 10: Testing & Optimization

### Prompt 10.1: Performance Optimization

```
Optimize for 60fps:
- Limit active objects (remove off-screen immediately)
- Use Reanimated shared values for all animations
- Batch Skia draw calls where possible
- Implement object pooling for obstacles/collectibles
- Profile with React Native Performance Monitor
```

### Prompt 10.2: Device Compatibility

```
Test across devices:
- iOS (iPhone SE to Pro Max)
- Android (various screen sizes)
- Handle safe areas (notch, dynamic island)
- Test on low-end devices for performance
- Adjust quality settings for older devices
```

### Prompt 10.3: Gameplay Balancing

```
Balance game difficulty:
- Test obstacle spawn rates (not too dense)
- Ensure collectibles are reachable
- Adjust collision box sizes for fairness
- Test level progression curve
- Gather playtest feedback and iterate
```

---

## 📦 Bonus: Additional Features

### Prompt B.1: Power-ups (Future)

```
Consider adding power-ups:
- Shield: Temporary invincibility (10 seconds)
- Magnet: Attracts nearby collectibles (5 seconds)
- Speed Boost: Temporary score multiplier (8 seconds)

Spawn rarely (5% of collectible spawns).
```

### Prompt B.2: Achievements

```
Implement achievement system:
- "First Dive": Complete Level 1
- "Treasure Hunter": Collect 100 coins
- "Survivor": Reach Level 5
- "Perfect Run": Complete level without losing life

Display in separate achievements screen.
```

### Prompt B.3: Sound & Music

```
Add audio system:
- Background music (calm underwater theme)
- SFX: Coin collect, diamond collect, hit, level up, game over
- Mute/unmute toggle in settings
- Use react-native-sound or similar library
```

---

## 🚀 Development Timeline Estimate

| Phase                         | Estimated Time | Priority |
| ----------------------------- | -------------- | -------- |
| 1-2: Setup & Player           | 3-5 days       | Critical |
| 3-4: Obstacles & Collectibles | 5-7 days       | Critical |
| 5-6: Collision & Scoring      | 3-4 days       | Critical |
| 7: Background & Scrolling     | 3-4 days       | High     |
| 8: UI/HUD                     | 2-3 days       | High     |
| 9: Animations & Polish        | 4-5 days       | Medium   |
| 10: Testing & Optimization    | 3-5 days       | High     |
| Bonus Features                | 5-10 days      | Low      |

**Total Estimated Time: 4-6 weeks for MVP**

---

Would you like me to elaborate on any specific phase or provide code templates for any component?
