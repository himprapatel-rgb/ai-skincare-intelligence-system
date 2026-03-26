"""seed ingredient interactions

Revision ID: 008_seed_interactions
Revises: 007_clinical_tables
Create Date: 2026-03-26

Seeds ~50 common skincare ingredient interactions into the
ingredient_interactions table for the clinical intelligence engine.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '008_seed_interactions'
down_revision: Union[str, None] = '007_clinical_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# (ingredient_a, ingredient_b, interaction_type, severity, description)
INTERACTIONS = [
    # ── Retinol interactions ──────────────────────────────────────────────
    ("retinol", "AHA", "caution", "medium",
     "Both increase skin cell turnover and can cause excessive irritation, peeling, and sensitivity when used together. Alternate AM/PM or different days."),
    ("retinol", "BHA", "caution", "medium",
     "Salicylic acid (BHA) combined with retinol may over-exfoliate and compromise the skin barrier. Use on alternate nights."),
    ("retinol", "benzoyl_peroxide", "conflict", "high",
     "Benzoyl peroxide oxidises retinol, rendering it ineffective. Never layer together; use at different times of day."),
    ("retinol", "vitamin_c", "caution", "medium",
     "Both are potent actives that can irritate when layered. Vitamin C works best at low pH while retinol prefers higher pH. Use vitamin C in AM, retinol in PM."),
    ("retinol", "niacinamide", "synergy", "low",
     "Niacinamide helps reduce retinol-induced irritation and strengthens the skin barrier. Excellent combination."),
    ("retinol", "hyaluronic_acid", "synergy", "low",
     "Hyaluronic acid provides hydration that counteracts retinol dryness. Apply HA first, then retinol."),
    ("retinol", "peptides", "caution", "low",
     "Some peptides may be destabilised by retinol's low pH environment. Layer carefully or use at different times."),
    ("retinol", "azelaic_acid", "caution", "medium",
     "Both are potent actives. Using together may increase irritation for sensitive skin. Introduce gradually."),
    ("retinol", "SPF", "synergy", "low",
     "Retinol increases photosensitivity; daily SPF is essential when using retinoids. Always pair retinol with sunscreen."),

    # ── Vitamin C interactions ────────────────────────────────────────────
    ("vitamin_c", "niacinamide", "synergy", "low",
     "Contrary to old advice, modern formulations work well together. Both brighten skin and provide antioxidant protection."),
    ("vitamin_c", "vitamin_e", "synergy", "low",
     "Vitamins C and E are synergistic antioxidants — vitamin E regenerates oxidised vitamin C, boosting photoprotection by up to 4x."),
    ("vitamin_c", "SPF", "synergy", "low",
     "Vitamin C enhances sunscreen efficacy by neutralising free radicals that escape UV filters. Apply vitamin C under SPF."),
    ("vitamin_c", "ferulic_acid", "synergy", "low",
     "Ferulic acid stabilises vitamins C and E and doubles their photoprotective capacity (Pinnell et al., 2005)."),
    ("vitamin_c", "AHA", "caution", "medium",
     "Both are acidic and can cause irritation when layered. If combining, use a well-formulated product or alternate AM/PM."),
    ("vitamin_c", "BHA", "caution", "low",
     "Mild pH conflict. Generally tolerable but sensitive skin may experience stinging. Layer with time gap or alternate."),
    ("vitamin_c", "benzoyl_peroxide", "conflict", "high",
     "Benzoyl peroxide is a strong oxidiser that degrades ascorbic acid (vitamin C) on contact. Use at separate times of day."),
    ("vitamin_c", "copper_peptides", "conflict", "medium",
     "Copper ions catalyse oxidation of ascorbic acid, reducing efficacy of both ingredients. Do not combine."),

    # ── AHA / BHA interactions ────────────────────────────────────────────
    ("AHA", "BHA", "caution", "medium",
     "Using glycolic/lactic acid with salicylic acid can over-exfoliate. Limit to one acid per routine or use a balanced combination product."),
    ("AHA", "niacinamide", "synergy", "low",
     "Niacinamide soothes AHA-induced irritation and helps restore the skin barrier. Great combination for brightening."),
    ("AHA", "hyaluronic_acid", "synergy", "low",
     "HA replenishes moisture lost during exfoliation. Apply HA after AHA to hydrate freshly exfoliated skin."),
    ("AHA", "SPF", "synergy", "low",
     "AHAs increase photosensitivity. Sunscreen is non-negotiable when using any AHA product."),
    ("AHA", "benzoyl_peroxide", "caution", "medium",
     "Both can dry and irritate the skin. Use on alternate days if both are needed in your routine."),
    ("BHA", "niacinamide", "synergy", "low",
     "Niacinamide regulates sebum and calms BHA-related dryness. Works well together for acne-prone skin."),
    ("BHA", "hyaluronic_acid", "synergy", "low",
     "HA hydrates skin after BHA exfoliation. Apply BHA first, wait, then follow with HA serum."),
    ("BHA", "benzoyl_peroxide", "caution", "medium",
     "Both target acne but can cause excessive dryness and irritation. Use on alternate days or different times of day."),

    # ── Niacinamide interactions ──────────────────────────────────────────
    ("niacinamide", "hyaluronic_acid", "synergy", "low",
     "Excellent pairing — niacinamide strengthens the skin barrier while HA provides deep hydration. Use together freely."),
    ("niacinamide", "ceramides", "synergy", "low",
     "Niacinamide boosts natural ceramide production. Combined with topical ceramides, this powerfully restores the skin barrier."),
    ("niacinamide", "zinc", "synergy", "low",
     "Niacinamide + zinc is a proven combination for controlling sebum and reducing acne inflammation."),
    ("niacinamide", "SPF", "synergy", "low",
     "Niacinamide reduces UV-induced hyperpigmentation and complements sunscreen protection."),
    ("niacinamide", "peptides", "synergy", "low",
     "Both support collagen production and skin barrier repair. Combine freely for anti-aging benefits."),

    # ── Benzoyl peroxide interactions ─────────────────────────────────────
    ("benzoyl_peroxide", "hyaluronic_acid", "synergy", "low",
     "HA helps counteract BP-induced dryness. Apply HA before or after BP treatment to maintain hydration."),
    ("benzoyl_peroxide", "niacinamide", "synergy", "low",
     "Niacinamide reduces benzoyl peroxide irritation and helps with post-acne hyperpigmentation."),
    ("benzoyl_peroxide", "clindamycin", "synergy", "low",
     "A clinically proven combination for acne treatment. BP prevents antibiotic resistance from clindamycin."),
    ("benzoyl_peroxide", "adapalene", "synergy", "medium",
     "FDA-approved combination (Epiduo). Effective for moderate acne but can be irritating initially."),

    # ── Hyaluronic acid interactions ──────────────────────────────────────
    ("hyaluronic_acid", "ceramides", "synergy", "low",
     "HA draws moisture while ceramides lock it in. Together they provide comprehensive barrier hydration."),
    ("hyaluronic_acid", "squalane", "synergy", "low",
     "HA hydrates; squalane seals in moisture. Layer HA under squalane for optimal hydration."),
    ("hyaluronic_acid", "peptides", "synergy", "low",
     "Both support skin repair. HA provides the hydration matrix while peptides signal collagen production."),
    ("hyaluronic_acid", "SPF", "synergy", "low",
     "HA under sunscreen improves spreadability and provides a hydration layer beneath UV protection."),

    # ── Other notable interactions ────────────────────────────────────────
    ("copper_peptides", "AHA", "conflict", "medium",
     "Acidic pH of AHAs destabilises copper peptides. Use at different times of day for both to remain effective."),
    ("copper_peptides", "BHA", "conflict", "medium",
     "Similar to AHAs, the acidic environment of BHA reduces copper peptide efficacy. Separate usage."),
    ("copper_peptides", "retinol", "caution", "medium",
     "Both are powerful actives that can cause irritation when combined. Alternate nights recommended."),
    ("azelaic_acid", "niacinamide", "synergy", "low",
     "Both address hyperpigmentation and rosacea. Azelaic acid + niacinamide is a gold-standard pairing for redness."),
    ("azelaic_acid", "SPF", "synergy", "low",
     "Azelaic acid may mildly increase sun sensitivity. Pair with SPF for best results."),
    ("glycolic_acid", "lactic_acid", "caution", "medium",
     "Both are AHAs — stacking them doubles exfoliation intensity and risks barrier damage. Choose one."),
    ("salicylic_acid", "tea_tree_oil", "caution", "low",
     "Both target acne but can dry and irritate when combined. Use one in AM and the other in PM if needed."),
    ("sulfur", "retinol", "conflict", "medium",
     "Sulfur can degrade retinol and cause excessive dryness. Do not layer together."),
    ("hydroquinone", "benzoyl_peroxide", "conflict", "high",
     "Benzoyl peroxide can oxidise hydroquinone, causing temporary dark staining. Never combine."),
    ("hydroquinone", "vitamin_c", "caution", "medium",
     "Both target hyperpigmentation; combining may cause irritation. Use under dermatologist supervision."),
    ("tretinoin", "benzoyl_peroxide", "conflict", "high",
     "Benzoyl peroxide degrades tretinoin on contact. Apply at different times of day (BP morning, tretinoin night)."),
    ("tretinoin", "AHA", "caution", "high",
     "Both cause significant exfoliation. Combined use risks severe irritation and barrier damage. Use only under dermatologist guidance."),
]


def upgrade() -> None:
    interactions_table = sa.table(
        'ingredient_interactions',
        sa.column('ingredient_a', sa.String),
        sa.column('ingredient_b', sa.String),
        sa.column('interaction_type', sa.String),
        sa.column('severity', sa.String),
        sa.column('description', sa.Text),
    )

    op.bulk_insert(
        interactions_table,
        [
            {
                "ingredient_a": a,
                "ingredient_b": b,
                "interaction_type": itype,
                "severity": sev,
                "description": desc,
            }
            for a, b, itype, sev, desc in INTERACTIONS
        ],
    )


def downgrade() -> None:
    op.execute("DELETE FROM ingredient_interactions")
