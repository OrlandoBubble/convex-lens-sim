# Convex Lens Simulator (HK F3)

A simulation for F3 lens physics — interactive thin-lens study for **Hong Kong F.3 Physics** exam preparation.

## Live demo (GitHub Pages)

**https://orlandobubble.github.io/convex-lens-sim/**

Share that link on WhatsApp — no download required.

## What it shows

- **Inputs**: focal length \(f\), object distance magnitude \(|u|\), object height \(h_o\)
- **Outputs**: image distance \(v\), magnification \(m\), image height \(h_i\)
- **Live ray diagram**: two principal rays + dashed back extensions for virtual images

## Sign convention used (Cartesian)

- Optical axis is horizontal; lens at \(x = 0\)
- **Right side is positive** (\(+x\))
- Real object is on the left, so **\(u < 0\)** (we input \(|u|\) and internally use \(u = -|u|\))
- Convex lens has **\(f > 0\)**

Thin lens formula:

\[
\frac{1}{f} = \frac{1}{v} - \frac{1}{u}
\]

Interpretation:

- **Real image**: \(v > 0\) (forms on the right), magnification \(m = v/u < 0\) → inverted
- **Virtual image**: \(v < 0\) (appears on the left), \(m > 0\) → upright
- **At infinity**: \(u = f\) → rays emerge parallel

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL shown in the terminal.

## Deploy to GitHub Pages

Pushes to `main` run `.github/workflows/deploy.yml`. In the repo on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
