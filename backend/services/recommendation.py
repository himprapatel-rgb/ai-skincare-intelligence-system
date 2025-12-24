from sqlalchemy.orm import Session
from app.models import product_models as models
from app.core import skin_analysis

def get_recommended_products(db: Session, analysis_id: int):
    # 1. Fetch the analysis results
    analysis = db.query(skin_analysis.SkinAnalysis).filter(skin_analysis.SkinAnalysis.id == analysis_id).first()
    
    if not analysis:
        return None
    
    # 2. Build the query logic
    # We want products that match the skin_type AND address at least one concern
    query = db.query(models.Product).filter(
        models.Product.suitable_for.contains([analysis.skin_type])
    )
    
    # Filter for products addressing specific concerns
    # This assumes your Product model has a 'targets' column (e.g., Acne, Dryness)
    recommendations = query.filter(
        models.Product.targets.overlap(analysis.concerns)
    ).limit(5).all()
    
    return recommendations