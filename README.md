# 3D Grass Title

A customizable 3D grass-textured title web component using Lit + TypeScript + Three.js.

## Features

- **Grass Shader**: Realistic grass-like displacement and coloring with animated wind effects
- **Customizable**: Full control over text, color, lighting, rotation, and camera position
- **Responsive**: Automatically adapts to container size and device pixel ratio
- **Performance**: Optimized Three.js rendering with efficient shader materials
- **TypeScript**: Full TypeScript support with type definitions
- **Web Components**: Standard web component API, works with any framework

## Installation

```bash
npm install 3d-grass-title
```

## Usage

### Basic Usage

```html
<script type="module">
	import '3d-grass-title';
</script>

<grass-title text="Your Title Here"></grass-title>
```

### With Custom Properties

```html
<grass-title
	text="Columbus Reclaimed"
	color="#66ff99"
	light-intensity="2"
	rotation="[0, 0.3, 0]"
	camera-distance="6"
	link="https://example.com"
></grass-title>
```

## Properties

| Property         | Type                       | Default     | Description                             |
| ---------------- | -------------------------- | ----------- | --------------------------------------- |
| `text`           | `string`                   | `'Welcome'` | The text to display                     |
| `color`          | `string`                   | `'#33ff33'` | Base color of the grass shader          |
| `lightIntensity` | `number`                   | `1.2`       | Intensity of the directional light      |
| `rotation`       | `[number, number, number]` | `[0, 0, 0]` | Rotation angles in radians [x, y, z]    |
| `cameraDistance` | `number`                   | `6`         | Distance of the camera from the text    |
| `fontUrl`        | `string`                   | `undefined` | URL to a custom Three.js font JSON file |
| `link`           | `string`                   | `undefined` | URL to navigate to when clicked (with particle spread animation) |

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Build demo site
npm run build:demo

# Type check
npm run typecheck
```

## Demo

Visit the [live demo](https://3d-grass-title.vercel.app) to see the component in action and experiment with different settings.

## License

MIT
