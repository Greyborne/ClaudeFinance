# migrate_groups.py
from app import create_app, db
from app.models import BudgetCategory, CategoryGroup

app = create_app()

with app.app_context():
    misc_expense = CategoryGroup.query.filter_by(name='Misc', category_type='expense').first()
    misc_income = CategoryGroup.query.filter_by(name='Misc', category_type='income').first()

    if not misc_expense or not misc_income:
        print("Error: Run seed_groups.py first!")
        exit(1)

    # Assign group_id to ALL categories (default Misc)
    updated = 0
    for cat in BudgetCategory.query.all():
        if cat.group_id is None:
            cat.group_id = misc_expense.id if cat.category_type == 'expense' else misc_income.id
            updated += 1

    db.session.commit()
    print(f"Updated {updated} categories with group_id.")