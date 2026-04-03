"""
compute-tda.py — Build-time script to generate pre-computed TDA JSON assets.

Produces 4 JSON files under src/data/tda/:
  - circle-20pts.json       : 20 pts evenly spaced on unit circle
  - two-clusters-16pts.json : 2 Gaussian clusters (8+8 pts)
  - figure-eight-11pts.json : figure-eight shape (11 pts)
  - random-30pts.json       : 30 random pts in [0, 2]²

Each file conforms to the schema:
  {
    "metadata": { "n_points": int, "max_dimension": 1, "epsilon_range": [0.0, float] },
    "point_cloud": [[x, y], ...],
    "diagrams": {
      "H0": [{"birth": float, "death": float}, ...],
      "H1": [{"birth": float, "death": float}, ...]
    }
  }

Run: python scripts/compute-tda.py
Dev-only dependency — do NOT add ripser/numpy to package.json.
"""

import json
import os
import math
import numpy as np
from ripser import ripser

# ---------------------------------------------------------------------------
# Output directory
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
OUT_DIR = os.path.join(PROJECT_ROOT, "src", "data", "tda")
os.makedirs(OUT_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def max_pairwise_dist(pts: np.ndarray) -> float:
    """Return the maximum pairwise Euclidean distance between any two points."""
    n = len(pts)
    if n < 2:
        return 1.0
    dmax = 0.0
    for i in range(n):
        for j in range(i + 1, n):
            d = float(np.linalg.norm(pts[i] - pts[j]))
            if d > dmax:
                dmax = d
    return dmax if dmax > 0 else 1.0


def compute_and_save(filename: str, points: np.ndarray) -> None:
    """Run ripser on the point cloud, cap infinite values, and write JSON."""
    n = len(points)
    cap = max_pairwise_dist(points) * 1.1
    epsilon_range = [0.0, round(cap, 4)]

    dgms = ripser(points, maxdim=1)["dgms"]
    h0_raw = dgms[0]  # shape (k, 2)
    h1_raw = dgms[1] if len(dgms) > 1 else np.zeros((0, 2), dtype=float)

    def finite_features(arr: np.ndarray) -> list[dict]:
        result = []
        for birth, death in arr:
            b = float(birth)
            d = float(death)
            # Cap any infinite death values (last H0 component, essential H1 loops)
            if not math.isfinite(d):
                d = cap
            # Skip degenerate features where birth >= cap (zero or negative persistence after capping)
            if b >= cap:
                continue
            result.append({"birth": round(b, 6), "death": round(d, 6)})
        return result

    h0 = finite_features(h0_raw)
    h1 = finite_features(h1_raw)

    payload = {
        "metadata": {
            "n_points": n,
            "max_dimension": 1,
            "epsilon_range": epsilon_range,
        },
        "point_cloud": [[round(float(x), 6), round(float(y), 6)] for x, y in points],
        "diagrams": {
            "H0": h0,
            "H1": h1,
        },
    }

    out_path = os.path.join(OUT_DIR, filename)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print(f"  Written: {out_path}")
    print(f"    H0 features: {len(h0)},  H1 features: {len(h1)}")

    # Spot-check infinite values
    for feat in h0 + h1:
        assert math.isfinite(feat["birth"]), f"Non-finite birth in {filename}"
        assert math.isfinite(feat["death"]), f"Non-finite death in {filename}"


# ---------------------------------------------------------------------------
# Preset generators
# ---------------------------------------------------------------------------

def make_circle_20pts() -> np.ndarray:
    """20 points evenly spaced on the unit circle."""
    angles = np.linspace(0, 2 * np.pi, 20, endpoint=False)
    return np.column_stack([np.cos(angles), np.sin(angles)])


def make_two_clusters_16pts() -> np.ndarray:
    """Two Gaussian clusters (8+8 pts), centres ±1.5 on x-axis, σ=0.3."""
    rng = np.random.default_rng(42)
    c1 = rng.normal(loc=[-1.5, 0.0], scale=0.3, size=(8, 2))
    c2 = rng.normal(loc=[1.5, 0.0], scale=0.3, size=(8, 2))
    return np.vstack([c1, c2])


def make_figure_eight_11pts() -> np.ndarray:
    """
    Figure-eight shape: two separate circles of radius 0.5 centred at
    (-0.7, 0) and (0.7, 0), plus a bridging point at the origin (11 pts).
    Ripser returns 2 persistent H₁ loops — one per lobe.
    """
    angles = np.linspace(0, 2 * np.pi, 5, endpoint=False)
    left = np.column_stack([np.cos(angles) * 0.5 - 0.7, np.sin(angles) * 0.5])
    right = np.column_stack([np.cos(angles) * 0.5 + 0.7, np.sin(angles) * 0.5])
    origin = np.array([[0.0, 0.0]])
    return np.vstack([left, origin, right])


def make_random_30pts() -> np.ndarray:
    """30 randomly placed points in [0, 2]²."""
    rng = np.random.default_rng(7)
    return rng.uniform(0.0, 2.0, size=(30, 2))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print(f"Writing TDA JSON assets to: {OUT_DIR}")

    presets = [
        ("circle-20pts.json", make_circle_20pts()),
        ("two-clusters-16pts.json", make_two_clusters_16pts()),
        ("figure-eight-11pts.json", make_figure_eight_11pts()),
        ("random-30pts.json", make_random_30pts()),
    ]

    for filename, points in presets:
        print(f"\n→ {filename} ({len(points)} points)")
        compute_and_save(filename, points)

    print("\nSpot-checking circle-20pts.json for persistent H₁ loop...")
    circle_path = os.path.join(OUT_DIR, "circle-20pts.json")
    with open(circle_path, encoding="utf-8") as f:
        circle_data = json.load(f)

    persistent_loops = [
        feat for feat in circle_data["diagrams"]["H1"]
        if feat["death"] - feat["birth"] > 0.5
    ]
    assert len(persistent_loops) >= 1, (
        f"Expected at least 1 persistent H₁ loop (persistence > 0.5) in circle-20pts.json, "
        f"got 0. H1 features: {circle_data['diagrams']['H1']}"
    )
    print(f"  ✓ Found {len(persistent_loops)} persistent H₁ loop(s): {persistent_loops}")
    print("\nAll done.")


if __name__ == "__main__":
    main()
