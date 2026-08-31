---
name: Parametric Industrial
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#5b403a'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#8f7068'
  outline-variant: '#e4beb5'
  surface-tint: '#b22c00'
  primary: '#ae2a00'
  on-primary: '#ffffff'
  primary-container: '#d53d0f'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb5a1'
  secondary: '#376755'
  on-secondary: '#ffffff'
  secondary-container: '#b7ebd4'
  on-secondary-container: '#3b6c5a'
  tertiary: '#5d5d51'
  on-tertiary: '#ffffff'
  tertiary-container: '#767569'
  on-tertiary-container: '#ffffd8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd1'
  primary-fixed-dim: '#ffb5a1'
  on-primary-fixed: '#3c0800'
  on-primary-fixed-variant: '#881f00'
  secondary-fixed: '#baeed7'
  secondary-fixed-dim: '#9ed1bb'
  on-secondary-fixed: '#002116'
  on-secondary-fixed-variant: '#1d4f3e'
  tertiary-fixed: '#e5e3d4'
  tertiary-fixed-dim: '#c9c7b8'
  on-tertiary-fixed: '#1c1c13'
  on-tertiary-fixed-variant: '#47473c'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-xl:
    fontFamily: Hanken Grotesk
    fontSize: 80px
    fontWeight: '800'
    lineHeight: 72px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  label-technical:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-status:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
spacing:
  base-unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 40px
  container-max: 1280px
---

## Brand & Style

The design system is rooted in the "Parametric Industrial" aesthetic—a philosophy that prioritizes technical honesty, structural clarity, and functional precision. Inspired by industrial design blueprints and modular hardware, it avoids soft shadows and organic flourishes in favor of a rigid, grid-based logic.

The brand personality is **authoritative, dry, and utilitarian**. It treats data as the primary visual element, using 1px borders to define enclosures and hierarchy. The emotional response should be one of "calm reliability"—the feeling of using a professional-grade instrument where every pixel serves a mechanical purpose.

Key stylistic markers include:
- **Modular Enclosures:** High use of 1px stroke containers to group related parameters.
- **Data Density:** High-information density layouts that resemble technical data sheets.
- **Analog Textures:** A subtle paper-grain or parchment feel on background surfaces to contrast with sharp digital typography.
- **Monospaced Accents:** Strategic use of monospaced fonts for coordinates, measurements, and status indicators.

## Colors

The palette is derived from technical engineering manuals and hardware chassis. 

- **Primary (Signal Orange):** Used exclusively for high-priority calls to action, active states, and critical "hardware" interactions.
- **Secondary (Deep Forest):** Reserved for background blocks, success states, or distinguishing specific modular sections.
- **Background (Parchment):** The foundational surface is an off-white, slightly warm cream (`#F2F0E9`) that reduces eye strain and provides a "printed material" feel.
- **Borders & Grids:** A mid-tone neutral (`#CECCBE`) is used for the 1px grid lines and container borders, ensuring structure is visible but not distracting.
- **Typography:** Primary text is a "Carbon Black" (`#1A1A1A`) to ensure maximum legibility against the cream background.

## Typography

Typography in this design system is split between **Hanken Grotesk** for high-impact branding and general readability, and **JetBrains Mono** for technical data.

- **Scale:** Headlines use tight tracking and leading to mimic industrial signage. 
- **Technical Labels:** Small, monospaced labels are used for all UI metadata, such as unit measurements (mm, °C, hPa) and field captions. 
- **Hierarchy:** Contrast is achieved through weight rather than just size. Bold, heavy headings are often paired immediately with small, technical labels.
- **Editorial Flourish:** Use brackets `[01]` or leading slashes `/` for section numbering to reinforce the systematic, indexed nature of the content.

## Layout & Spacing

The layout follows a **Strict Grid System** based on a 4px baseline. 

- **The 12-Column Grid:** Desktop layouts use a 12-column grid with 1px borders actually drawn between columns in technical views. 
- **Modular Blocks:** Content is housed in "cells" that snap to the grid. Avoid fluid, centered containers; prefer left-aligned technical blocks that feel like they have been bolted onto the page.
- **Information Density:** Spacing is tight (8px to 16px between related elements) to maintain the feel of a compact control panel.
- **Vertical Rhythm:** Sections are separated by heavy 1px horizontal rules, often accompanied by a section index (e.g., `[02] FEATURES`).

## Elevation & Depth

This design system rejects shadows. Depth is communicated through **Tonal Layering and Linework**:

1.  **Flat Base:** The primary surface is the Parchment background.
2.  **InsetLayouts:** Content areas are defined by 1px solid borders (`#CECCBE`). 
3.  **Layered Panels:** Higher-level "modals" or "pop-overs" do not float with shadows; instead, they use a solid 1px black border and an opaque background, often offset by a few pixels to create a "tabbed" or "stacked paper" effect.
4.  **Active Depth:** Interactive elements like buttons may use a "faux-3D" effect by adding a 1px bottom and right border of a darker shade, mimicking a physical mechanical switch rather than a digital shadow.

## Shapes

The shape language is **Sharp (`0`)**. 

All buttons, input fields, and containers must have 0px border-radius. This reinforces the "industrial instrument" feel. The only exception to the "sharp" rule is for circular elements that represent physical knobs, dials, or status LEDs, which should be perfect circles.

## Components

- **Buttons:** Rectangular with 1px borders. The "Primary" button uses the Signal Orange background with White text. The "Secondary" button uses a Transparent background with a 1px Black border.
- **Inputs:** Simple boxes with a 1px border. Labels are always placed *above* the input in JetBrains Mono at 10px size. 
- **Chips/Tags:** Used for status (e.g., "STABLE", "ACTIVE"). These use a solid color background (Signal Orange or Forest Green) with tiny, bold monospaced text.
- **Cards:** Cards are not "elevated." They are defined by a 1px border. If a card is "selected," the border weight increases to 2px or changes to Signal Orange.
- **Dials/Parametric Controls:** For weather parameters (rain intensity, wind speed), use horizontal sliders or circular dial graphics that resemble analog hardware.
- **Icons:** 1px stroke weight, strictly geometric. No filled icons unless they represent a toggle state.
- **Tables:** Dense, 1px grid lines separating every row and column. Header cells use a slightly darker parchment shade (`#E6E4D9`).