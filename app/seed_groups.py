# seed_groups.py
from app import create_app, db
from app.models import CategoryGroup

app = create_app()

with app.app_context():
    for cat_type in ['expense', 'income']:
        if not CategoryGroup.query.filter_by(name='Misc', category_type=cat_type).first():
            group = CategoryGroup(
                name='Misc',
                category_type=cat_type,
                sort_order=999  # bottom
            )
            db.session.add(group)
    db.session.commit()
    print("Default 'Misc' groups created!")